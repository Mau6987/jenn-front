"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  Copy,
  User,
  Award,
} from "lucide-react"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

export default function PruebasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  const [selectedESPs, setSelectedESPs] = useState([1, 2, 3, 4, 5])

  const [showSummary, setShowSummary] = useState(false)
  const [summaryData, setSummaryData] = useState(null)

  // Secuencial
  const [testActiveSequential, setTestActiveSequential] = useState(false)
  const [currentActiveESPSequential, setCurrentActiveESPSequential] = useState(null)
  const [waitingForResponseSequential, setWaitingForResponseSequential] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)
  const [totalRounds, setTotalRounds] = useState(1)
  const [currentSequence, setCurrentSequence] = useState(0)
  const [pruebaActualSequential, setPruebaActualSequential] = useState(null)
  const [estadisticasSequential, setEstadisticasSequential] = useState({ intentos: 0, aciertos: 0, errores: 0 })

  // Aleatorio
  const [testActiveRandom, setTestActiveRandom] = useState(false)
  const [currentActiveESPRandom, setCurrentActiveESPRandom] = useState(null)
  const [waitingForResponseRandom, setWaitingForResponseRandom] = useState(false)
  const [tiempoPrueba, setTiempoPrueba] = useState(60)
  const [tiempoRestante, setTiempoRestante] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  const [pruebaActualRandom, setPruebaActualRandom] = useState(null)
  const [estadisticasRandom, setEstadisticasRandom] = useState({ intentos: 0, aciertos: 0, errores: 0 })

  // Manual
  const [testActiveManual, setTestActiveManual] = useState(false)
  const [currentActiveESPManual, setCurrentActiveESPManual] = useState(null)
  const [waitingForResponseManual, setWaitingForResponseManual] = useState(false)
  const [pruebaActualManual, setPruebaActualManual] = useState(null)
  const [estadisticasManual, setEstadisticasManual] = useState({ intentos: 0, aciertos: 0, errores: 0 })

  const [modoActual, setModoActual] = useState("secuencial")
  const [tiempoReaccion, setTiempoReaccion] = useState(3.0)
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0)
  const [timerGeneralInterval, setTimerGeneralInterval] = useState(null)

  const [microControllers, setMicroControllers] = useState([
    { id: 1, active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
    { id: 2, active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
    { id: 3, active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
    { id: 4, active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
    { id: 5, active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
  ])

  const [pusherConnected, setPusherConnected] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [jugadores, setJugadores] = useState([])

  // ── Refs ──────────────────────────────────────────────────────────────────
  const testActiveSequentialRef = useRef(false)
  const currentActiveESPSequentialRef = useRef(null)
  const waitingForResponseSequentialRef = useRef(false)
  const processingResponseSequentialRef = useRef(false)
  const responseTimeoutSequentialRef = useRef(null)

  const testActiveRandomRef = useRef(false)
  const currentActiveESPRandomRef = useRef(null)
  const waitingForResponseRandomRef = useRef(false)
  const processingResponseRandomRef = useRef(false)
  const responseTimeoutRandomRef = useRef(null)

  const testActiveManualRef = useRef(false)
  const currentActiveESPManualRef = useRef(null)
  const waitingForResponseManualRef = useRef(false)
  const processingResponseManualRef = useRef(false)
  const responseTimeoutManualRef = useRef(null)

  const selectedESPsRef = useRef([1, 2, 3, 4, 5])
  const estadisticasSequentialRef = useRef({ intentos: 0, aciertos: 0, errores: 0 })
  const estadisticasRandomRef = useRef({ intentos: 0, aciertos: 0, errores: 0 })
  const estadisticasManualRef = useRef({ intentos: 0, aciertos: 0, errores: 0 })

  useEffect(() => {
    testActiveSequentialRef.current = testActiveSequential
    currentActiveESPSequentialRef.current = currentActiveESPSequential
    waitingForResponseSequentialRef.current = waitingForResponseSequential
    testActiveRandomRef.current = testActiveRandom
    currentActiveESPRandomRef.current = currentActiveESPRandom
    waitingForResponseRandomRef.current = waitingForResponseRandom
    testActiveManualRef.current = testActiveManual
    currentActiveESPManualRef.current = currentActiveESPManual
    waitingForResponseManualRef.current = waitingForResponseManual
    selectedESPsRef.current = selectedESPs
  }, [
    testActiveSequential, currentActiveESPSequential, waitingForResponseSequential,
    testActiveRandom, currentActiveESPRandom, waitingForResponseRandom,
    testActiveManual, currentActiveESPManual, waitingForResponseManual,
    selectedESPs,
  ])

  useEffect(() => { fetchJugadores(); loadPusher() }, [])

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval)
      if (timerGeneralInterval) clearInterval(timerGeneralInterval)
    }
  }, [timerInterval, timerGeneralInterval])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleESPSelection = (espId) => {
    setSelectedESPs((prev) => {
      if (prev.includes(espId)) {
        if (prev.length === 1) { showNotification("error", "Debe haber al menos 1 cápsula seleccionada"); return prev }
        return prev.filter((id) => id !== espId)
      }
      return [...prev, espId].sort((a, b) => a - b)
    })
  }

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchJugadores = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch("https://jenn-back-reac.onrender.com/api/cuentas", {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      if (data.success) {
        setJugadores(
          data.data
            .filter((c) => c.rol === "jugador" && c.jugador)
            .map((c) => ({ ...c.jugador, id: c.jugador.id, usuario: c.usuario, cuentaId: c.id }))
        )
      }
    } catch { showNotification("error", "Error al cargar jugadores") }
    finally { setLoading(false) }
  }

  const loadPusher = () => {
    if (typeof window === "undefined") return
    const script = document.createElement("script")
    script.src = "https://js.pusher.com/8.2.0/pusher.min.js"
    script.async = true
    document.head.appendChild(script)
    script.onload = initializePusher
  }

  const initializePusher = () => {
    const pusher = new window.Pusher("4f85ef5c792df94cebc9", {
      cluster: "us2", encrypted: true,
      authEndpoint: `${BACKEND_URL}/api/pusher/pusher/auth`, forceTLS: true,
    })
    pusher.connection.bind("connected", () => { setPusherConnected(true); subscribeToMicrocontrollerChannels(pusher) })
    pusher.connection.bind("disconnected", () => setPusherConnected(false))
  }

  const subscribeToMicrocontrollerChannels = (pusher) => {
    for (let i = 1; i <= 5; i++) {
      const channelName = `private-device-ESP-${i}`
      const channel = pusher.subscribe(channelName)
      channel.bind("pusher:subscription_succeeded", () =>
        setMicroControllers((prev) => prev.map((mc) => mc.id === i ? { ...mc, connected: true, lastSeen: new Date() } : mc))
      )
      channel.bind("client-response", (data) => {
        const espId = parseInt(channelName.split("-").pop())
        const isAcierto = (data.message?.toLowerCase() || "").includes("acierto") || (data.message?.toLowerCase() || "").includes("success")
        setMicroControllers((prev) => prev.map((mc) => mc.id === espId ? { ...mc, connected: true, lastSeen: new Date() } : mc))
        if (testActiveSequentialRef.current && waitingForResponseSequentialRef.current && currentActiveESPSequentialRef.current === espId) {
          if (processingResponseSequentialRef.current) return
          processingResponseSequentialRef.current = true
          handleSequentialResponse(espId, isAcierto ? "acierto" : "error")
        } else if (testActiveRandomRef.current && waitingForResponseRandomRef.current && currentActiveESPRandomRef.current === espId) {
          if (processingResponseRandomRef.current) return
          processingResponseRandomRef.current = true
          handleRandomResponse(espId, isAcierto ? "acierto" : "error")
        } else if (testActiveManualRef.current && waitingForResponseManualRef.current && currentActiveESPManualRef.current === espId) {
          if (processingResponseManualRef.current) return
          processingResponseManualRef.current = true
          handleManualResponse(espId, isAcierto ? "acierto" : "error")
        }
      })
    }
  }

  const sendCommandToESP = async (espId, command) => {
    try {
      const commandToSend = command?.command === "ON" ? `ON:${tiempoReaccion}` : command?.command || "ON"
      await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: `ESP-${espId}`, command: commandToSend }),
      })
    } catch (e) { console.error(e) }
  }

  const iniciarCronometroGeneral = () => {
    setTiempoTranscurrido(0)
    const interval = setInterval(() => setTiempoTranscurrido((p) => p + 1), 1000)
    setTimerGeneralInterval(interval)
  }

  const detenerCronometroGeneral = () => {
    if (timerGeneralInterval) { clearInterval(timerGeneralInterval); setTimerGeneralInterval(null) }
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  const getMicroImage = (mc) => {
    const testActive = testActiveSequential || testActiveRandom || testActiveManual
    if (!testActive) return "/gris.png"
    if (mc.active) return "/azul.png"
    if (mc.lastResponse === "acierto") return "/verde.png"
    if (mc.lastResponse === "error") return "/rojo.png"
    return "/gris.png"
  }

  const abrirResumen = (tipo, stats) => {
    setSummaryData({
      tipo,
      jugador: selectedPlayer
        ? { id: selectedPlayer.id, nombres: selectedPlayer.nombres, apellidos: selectedPlayer.apellidos, posicion: selectedPlayer.posicion_principal, cuentaId: selectedPlayer.cuentaId }
        : null,
      tiempo_transcurrido: tiempoTranscurrido,
      esp_seleccionadas: selectedESPs,
      parametros: { tiempo_reaccion: tiempoReaccion, rondas: tipo === "secuencial" ? totalRounds : undefined, duracion: tipo !== "secuencial" ? tiempoPrueba : undefined },
      resultados: stats,
      timestamp: new Date().toISOString(),
    })
    setShowSummary(true)
  }

  const copySummary = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(summaryData, null, 2)); showNotification("success", "Copiado") }
    catch { showNotification("error", "No se pudo copiar") }
  }

  // ── SECUENCIAL ──────────────────────────────────────────────────────────────
  const iniciarPruebaSecuencial = async () => {
    if (!selectedPlayer) { showNotification("error", "Selecciona un jugador"); return }
    try {
      const res = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "secuencial", cuentaId: selectedPlayer.cuentaId }),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem("prueba_secuencial_id", data.data.id.toString())
        setPruebaActualSequential(data.data); setTestActiveSequential(true); setModoActual("secuencial")
        setCurrentRound(1); setCurrentSequence(1)
        const initStats = { intentos: 0, aciertos: 0, errores: 0 }
        setEstadisticasSequential(initStats); estadisticasSequentialRef.current = initStats
        iniciarCronometroGeneral()
        showNotification("success", `Prueba secuencial iniciada · ${totalRounds} rondas`)
        setTimeout(() => activateNextMicrocontrollerSequential(selectedESPs[0]), 1000)
      } else showNotification("error", data.message)
    } catch { showNotification("error", "Error iniciando prueba") }
  }

  const activateNextMicrocontrollerSequential = (espId) => {
    if (responseTimeoutSequentialRef.current) { clearTimeout(responseTimeoutSequentialRef.current); responseTimeoutSequentialRef.current = null }
    setCurrentActiveESPSequential(espId); setWaitingForResponseSequential(true)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: mc.id === espId, status: mc.id === espId ? "Esperando respuesta" : mc.status })))
    sendCommandToESP(espId, { command: "ON" })
    responseTimeoutSequentialRef.current = setTimeout(() => handleSequentialResponse(espId, "error"), tiempoReaccion * 1000)
  }

  const handleSequentialResponse = (espId, responseType) => {
    if (!testActiveSequentialRef.current || !waitingForResponseSequentialRef.current || currentActiveESPSequentialRef.current !== espId) {
      processingResponseSequentialRef.current = false; return
    }
    if (responseTimeoutSequentialRef.current) { clearTimeout(responseTimeoutSequentialRef.current); responseTimeoutSequentialRef.current = null }
    setEstadisticasSequential((prev) => {
      const n = { intentos: prev.intentos + 1, aciertos: responseType === "acierto" ? prev.aciertos + 1 : prev.aciertos, errores: responseType === "error" ? prev.errores + 1 : prev.errores }
      estadisticasSequentialRef.current = n; return n
    })
    setWaitingForResponseSequential(false)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, lastResponse: mc.id === espId ? responseType : mc.lastResponse, status: mc.id === espId ? (responseType === "acierto" ? "Acierto" : "Error") : mc.status })))
    setTimeout(() => {
      const idx = selectedESPsRef.current.indexOf(espId)
      const next = idx + 1
      if (next < selectedESPsRef.current.length) {
        setCurrentSequence(next + 1); activateNextMicrocontrollerSequential(selectedESPsRef.current[next])
      } else {
        setCurrentRound((prevRound) => {
          if (prevRound < totalRounds) {
            limpiarEntreRondasSequential()
            showNotification("success", `Iniciando ronda ${prevRound + 1}`)
            setTimeout(() => { setCurrentSequence(1); activateNextMicrocontrollerSequential(selectedESPsRef.current[0]) }, 2000)
            return prevRound + 1
          } else {
            showNotification("success", "Rondas completadas"); setTimeout(() => finalizarPruebaSecuencial(), 1000); return prevRound
          }
        })
      }
      processingResponseSequentialRef.current = false
    }, 1500)
  }

  const finalizarPruebaSecuencial = async () => {
    detenerCronometroGeneral()
    const pruebaId = localStorage.getItem("prueba_secuencial_id")
    const stats = { ...estadisticasSequentialRef.current }
    if (pruebaId) {
      try {
        await fetch(`${BACKEND_URL}/api/pruebas/finalizar/${pruebaId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantidad_intentos: stats.intentos, cantidad_aciertos: stats.aciertos, cantidad_errores: stats.errores }),
        })
        localStorage.removeItem("prueba_secuencial_id")
      } catch (e) { console.error(e) }
    }
    abrirResumen("secuencial", stats); limpiarPruebaSecuencial()
  }

  const limpiarPruebaSecuencial = () => {
    setTestActiveSequential(false); setCurrentActiveESPSequential(null); setWaitingForResponseSequential(false)
    setCurrentRound(0); setCurrentSequence(0); setPruebaActualSequential(null); setTiempoTranscurrido(0)
    const r = { intentos: 0, aciertos: 0, errores: 0 }
    setEstadisticasSequential(r); estadisticasSequentialRef.current = r
    if (responseTimeoutSequentialRef.current) { clearTimeout(responseTimeoutSequentialRef.current); responseTimeoutSequentialRef.current = null }
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, status: "", lastResponse: null })))
    processingResponseSequentialRef.current = false
  }

  const limpiarEntreRondasSequential = () => {
    setCurrentActiveESPSequential(null); setWaitingForResponseSequential(false); setCurrentSequence(0)
    if (responseTimeoutSequentialRef.current) { clearTimeout(responseTimeoutSequentialRef.current); responseTimeoutSequentialRef.current = null }
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, status: "", lastResponse: null })))
    processingResponseSequentialRef.current = false
  }

  // ── ALEATORIO ──────────────────────────────────────────────────────────────
  const iniciarPruebaAleatoria = async () => {
    if (!selectedPlayer) { showNotification("error", "Selecciona un jugador"); return }
    try {
      const res = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "aleatorio", cuentaId: selectedPlayer.cuentaId }),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem("prueba_aleatoria_id", data.data.id.toString())
        setPruebaActualRandom(data.data); setTestActiveRandom(true); setModoActual("aleatorio"); setTiempoRestante(tiempoPrueba)
        const initStats = { intentos: 0, aciertos: 0, errores: 0 }
        setEstadisticasRandom(initStats); estadisticasRandomRef.current = initStats
        iniciarCronometroGeneral()
        const interval = setInterval(() => setTiempoRestante((p) => { if (p <= 1) { clearInterval(interval); setTimeout(() => finalizarPruebaAleatoria(), 1000); return 0 } return p - 1 }), 1000)
        setTimerInterval(interval)
        setTimeout(() => activateRandomMicrocontroller(), 1000)
      } else showNotification("error", data.message)
    } catch { showNotification("error", "Error iniciando prueba") }
  }

  const activateRandomMicrocontroller = () => {
    const esps = selectedESPsRef.current
    const espId = esps[Math.floor(Math.random() * esps.length)]
    if (responseTimeoutRandomRef.current) { clearTimeout(responseTimeoutRandomRef.current); responseTimeoutRandomRef.current = null }
    setCurrentActiveESPRandom(espId); setWaitingForResponseRandom(true)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: mc.id === espId, status: mc.id === espId ? "Esperando respuesta" : mc.status })))
    sendCommandToESP(espId, { command: "ON" })
    responseTimeoutRandomRef.current = setTimeout(() => handleRandomResponse(espId, "error"), tiempoReaccion * 1000)
  }

  const handleRandomResponse = (espId, responseType) => {
    if (!testActiveRandomRef.current || !waitingForResponseRandomRef.current || currentActiveESPRandomRef.current !== espId) {
      processingResponseRandomRef.current = false; return
    }
    if (responseTimeoutRandomRef.current) { clearTimeout(responseTimeoutRandomRef.current); responseTimeoutRandomRef.current = null }
    setEstadisticasRandom((prev) => {
      const n = { intentos: prev.intentos + 1, aciertos: responseType === "acierto" ? prev.aciertos + 1 : prev.aciertos, errores: responseType === "error" ? prev.errores + 1 : prev.errores }
      estadisticasRandomRef.current = n; return n
    })
    setWaitingForResponseRandom(false)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, lastResponse: mc.id === espId ? responseType : mc.lastResponse, status: mc.id === espId ? (responseType === "acierto" ? "Acierto" : "Error") : mc.status })))
    setTimeout(() => { if (testActiveRandomRef.current) activateRandomMicrocontroller(); processingResponseRandomRef.current = false }, 1000)
  }

  const finalizarPruebaAleatoria = async () => {
    detenerCronometroGeneral()
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    const pruebaId = localStorage.getItem("prueba_aleatoria_id")
    const stats = { ...estadisticasRandomRef.current }
    if (pruebaId) {
      try {
        await fetch(`${BACKEND_URL}/api/pruebas/finalizar/${pruebaId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantidad_intentos: stats.intentos, cantidad_aciertos: stats.aciertos, cantidad_errores: stats.errores }),
        })
        localStorage.removeItem("prueba_aleatoria_id")
      } catch (e) { console.error(e) }
    }
    abrirResumen("aleatorio", stats); limpiarPruebaAleatoria()
  }

  const limpiarPruebaAleatoria = () => {
    setTestActiveRandom(false); setCurrentActiveESPRandom(null); setWaitingForResponseRandom(false); setPruebaActualRandom(null); setTiempoRestante(0)
    const r = { intentos: 0, aciertos: 0, errores: 0 }
    setEstadisticasRandom(r); estadisticasRandomRef.current = r
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    if (responseTimeoutRandomRef.current) { clearTimeout(responseTimeoutRandomRef.current); responseTimeoutRandomRef.current = null }
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, status: "", lastResponse: null })))
    processingResponseRandomRef.current = false
  }

  // ── MANUAL ─────────────────────────────────────────────────────────────────
  const iniciarPruebaManual = async () => {
    if (!selectedPlayer) { showNotification("error", "Selecciona un jugador"); return }
    try {
      const res = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: selectedPlayer.cuentaId, tipo: "manual" }),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem("prueba_manual_id", data.data.id.toString())
        setPruebaActualManual(data.data); setTestActiveManual(true); setModoActual("manual"); setTiempoRestante(tiempoPrueba)
        const initStats = { intentos: 0, aciertos: 0, errores: 0 }
        setEstadisticasManual(initStats); estadisticasManualRef.current = initStats
        const interval = setInterval(() => setTiempoRestante((p) => { if (p <= 1) { clearInterval(interval); finalizarPruebaManual(); return 0 } return p - 1 }), 1000)
        setTimerInterval(interval)
        iniciarCronometroGeneral()
      } else showNotification("error", data.message)
    } catch { showNotification("error", "Error iniciando prueba") }
  }

  const activateManualMicrocontroller = (espId) => {
    if (!selectedESPsRef.current.includes(espId) || !testActiveManualRef.current || waitingForResponseManualRef.current) return
    if (responseTimeoutManualRef.current) { clearTimeout(responseTimeoutManualRef.current); responseTimeoutManualRef.current = null }
    setCurrentActiveESPManual(espId); setWaitingForResponseManual(true)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: mc.id === espId, status: mc.id === espId ? "Esperando respuesta" : mc.status })))
    sendCommandToESP(espId, { command: "ON" })
    responseTimeoutManualRef.current = setTimeout(() => handleManualResponse(espId, "error"), tiempoReaccion * 1000)
  }

  const handleManualResponse = (espId, responseType) => {
    if (!testActiveManualRef.current || !waitingForResponseManualRef.current || currentActiveESPManualRef.current !== espId) {
      processingResponseManualRef.current = false; return
    }
    if (responseTimeoutManualRef.current) { clearTimeout(responseTimeoutManualRef.current); responseTimeoutManualRef.current = null }
    setEstadisticasManual((prev) => {
      const n = { intentos: prev.intentos + 1, aciertos: responseType === "acierto" ? prev.aciertos + 1 : prev.aciertos, errores: responseType === "error" ? prev.errores + 1 : prev.errores }
      estadisticasManualRef.current = n; return n
    })
    setWaitingForResponseManual(false); setCurrentActiveESPManual(null)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, lastResponse: mc.id === espId ? responseType : mc.lastResponse, status: mc.id === espId ? (responseType === "acierto" ? "Acierto" : "Error") : mc.status })))
    processingResponseManualRef.current = false
  }

  const finalizarPruebaManual = async () => {
    detenerCronometroGeneral()
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    const pruebaId = localStorage.getItem("prueba_manual_id")
    const stats = { ...estadisticasManualRef.current }
    if (pruebaId) {
      try {
        await fetch(`${BACKEND_URL}/api/pruebas/finalizar/${pruebaId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantidad_intentos: stats.intentos, cantidad_aciertos: stats.aciertos, cantidad_errores: stats.errores }),
        })
        localStorage.removeItem("prueba_manual_id")
      } catch (e) { console.error(e) }
    }
    abrirResumen("manual", stats); limpiarPruebaManual()
  }

  const limpiarPruebaManual = () => {
    setTestActiveManual(false); setCurrentActiveESPManual(null); setWaitingForResponseManual(false); setPruebaActualManual(null); setTiempoRestante(0)
    const r = { intentos: 0, aciertos: 0, errores: 0 }
    setEstadisticasManual(r); estadisticasManualRef.current = r
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    if (responseTimeoutManualRef.current) { clearTimeout(responseTimeoutManualRef.current); responseTimeoutManualRef.current = null }
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, status: "", lastResponse: null })))
    processingResponseManualRef.current = false
  }

  // ── Computed ───────────────────────────────────────────────────────────────
  const testActive = testActiveSequential || testActiveRandom || testActiveManual
  const estadisticas = testActiveSequential ? estadisticasSequential : testActiveRandom ? estadisticasRandom : estadisticasManual
  const totalAttempts = estadisticas.intentos
  const accuracy = totalAttempts > 0 ? Math.round((estadisticas.aciertos / totalAttempts) * 100) : 0

  const progressPct = modoActual === "secuencial"
    ? totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0
    : tiempoPrueba > 0 ? (tiempoRestante / tiempoPrueba) * 100 : 0

  const onIniciar = () => {
    if (modoActual === "secuencial") iniciarPruebaSecuencial()
    else if (modoActual === "aleatorio") iniciarPruebaAleatoria()
    else iniciarPruebaManual()
  }

  const onFinalizar = () => {
    if (modoActual === "secuencial") finalizarPruebaSecuencial()
    else if (modoActual === "aleatorio") finalizarPruebaAleatoria()
    else finalizarPruebaManual()
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">

      {/* ── Notificación ── */}
      {notification && (
        <div className="fixed top-5 right-5 z-50">
          <div className={`flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg border ${notification.type === "success" ? "border-emerald-200" : "border-red-200"}`}>
            {notification.type === "success"
              ? <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              : <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
            <span className="text-sm font-medium text-gray-800">{notification.message}</span>
            <button onClick={() => setNotification(null)}><X className="h-4 w-4 text-gray-400 hover:text-gray-600" /></button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          FILA SUPERIOR: Panel Jugador  +  Panel Config  (separados)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex gap-0 mb-6 border border-gray-400 bg-white">

        {/* ── Panel izquierdo: SELECCIONAR JUGADOR ── */}
        <div className="flex items-center gap-4 px-5 py-4 border-r border-gray-400" style={{ minWidth: 340 }}>
          {/* Bloque dropdown */}
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
              Seleccionar Jugador
            </p>
            <div className="relative">
              <select
                value={selectedPlayer?.id || ""}
                onChange={(e) => {
                  const p = jugadores.find((j) => j.id === parseInt(e.target.value))
                  setSelectedPlayer(p || null)
                }}
                disabled={testActive}
                className="w-full appearance-none border border-gray-400 rounded px-3 py-1.5 text-sm text-gray-700 bg-white pr-8 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50"
              >
                <option value="">Select</option>
                {jugadores.map((j) => (
                  <option key={j.id} value={j.id}>{j.nombres} {j.apellidos}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Avatar circular */}
          <div className="flex-shrink-0 w-14 h-14 rounded-full border-2 border-gray-400 bg-gray-200 flex items-center justify-center overflow-hidden">
            {selectedPlayer ? (
              <img
                src={getPositionIcon(selectedPlayer.posicion_principal) || "/oso.png"}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = "/oso.png" }}
              />
            ) : (
              <User className="w-7 h-7 text-gray-400" />
            )}
          </div>

          {/* Nombre y posición */}
          <div className="flex-shrink-0">
            <p className="text-base font-bold text-gray-900 leading-tight">
              {selectedPlayer ? `${selectedPlayer.nombres} ${selectedPlayer.apellidos}` : "—"}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">
              {selectedPlayer ? getPositionName(selectedPlayer.posicion_principal) : ""}
            </p>
          </div>
        </div>

        {/* ── Panel derecho: CONFIG ── */}
        <div className="flex-1 flex items-center px-5 py-4 gap-6">

          {/* Columna izquierda del panel config: tipo + cápsulas */}
          <div className="flex-1">
            {/* Tipo de prueba */}
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
              Seleccionar tipo de prueba
            </p>
            <div className="flex mb-3 rounded border border-gray-400 overflow-hidden w-fit">
              {["Secuencial", "Aleatorio", "Manual"].map((label, i, arr) => {
                const key = label.toLowerCase()
                return (
                  <button
                    key={key}
                    onClick={() => !testActive && setModoActual(key)}
                    disabled={testActive}
                    className={`px-4 py-1 text-xs font-semibold transition-colors ${i < arr.length - 1 ? "border-r border-gray-400" : ""} ${modoActual === key ? "bg-gray-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"} disabled:cursor-not-allowed`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Cápsulas a usar */}
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
              Cápsulas a usar
            </p>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((num) => {
                const selected = selectedESPs.includes(num)
                return (
                  <button
                    key={num}
                    onClick={() => !testActive && toggleESPSelection(num)}
                    disabled={testActive}
                    title={`Cápsula ${num}`}
                    className={`w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 ${selected ? "border-gray-700 bg-gray-700" : "border-gray-400 bg-white"} disabled:cursor-not-allowed`}
                  />
                )
              })}
              {/* Números debajo alineados */}
              <span className="sr-only">Cápsulas 1-5</span>
            </div>
            {/* Números debajo de los círculos */}
            <div className="flex items-center gap-3 mt-0.5 ml-0">
              {[1, 2, 3, 4, 5].map((num) => (
                <span key={num} className="text-[9px] text-gray-500 w-5 text-center">{num}</span>
              ))}
            </div>
          </div>

          {/* Columna derecha del panel config: inputs + botón */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Input N° Rondas o Tiempo */}
            <div className="flex items-center gap-2 w-full justify-end">
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">
                {modoActual === "secuencial" ? "N° Rondas" : "Tiempo (min)"}
              </span>
              <input
                type="number"
                value={modoActual === "secuencial" ? totalRounds : Math.round(tiempoPrueba / 60) || 1}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 1
                  if (modoActual === "secuencial") setTotalRounds(v)
                  else setTiempoPrueba(v * 60)
                }}
                disabled={testActive}
                min="1"
                placeholder="Agregar número"
                className="w-32 border border-gray-400 rounded px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50 text-right"
              />
            </div>

            {/* Input Tiempo encendido */}
            <div className="flex items-center gap-2 w-full justify-end">
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">
                Tiempo encendido (seg)
              </span>
              <input
                type="number"
                step="0.1" min="0.1" max="5"
                value={tiempoReaccion}
                onChange={(e) => {
                  let v = parseFloat(e.target.value)
                  if (isNaN(v)) v = 0.1
                  v = Math.min(5, Math.max(0.1, v))
                  setTiempoReaccion(v)
                }}
                disabled={testActive}
                placeholder="Agregar número"
                className="w-32 border border-gray-400 rounded px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50 text-right"
              />
            </div>

            {/* Botón Iniciar / Finalizar */}
            {!testActive ? (
              <button
                onClick={onIniciar}
                className="mt-1 px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-full shadow transition-all"
              >
                Iniciar Prueba
              </button>
            ) : (
              <button
                onClick={onFinalizar}
                className="mt-1 px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-full shadow transition-all"
              >
                Finalizar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ESTADO DE CÁPSULAS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="mb-4">
        <h2 className="text-center text-xs font-bold text-gray-700 uppercase tracking-[0.25em] mb-4">
          Estado de cápsulas
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {microControllers.map((mc) => {
            const isSelected = selectedESPs.includes(mc.id)
            const isClickable = testActiveManual && mc.connected && !waitingForResponseManual && isSelected
            const isActive = mc.active
            const wasHit = mc.lastResponse === "acierto"
            const wasMissed = mc.lastResponse === "error"

            return (
              <div
                key={mc.id}
                onClick={() => { if (isClickable) activateManualMicrocontroller(mc.id) }}
                className={`bg-white border-2 transition-all duration-300 ${
                  isActive ? "border-blue-400 shadow-md" :
                  wasHit && !isActive ? "border-emerald-400" :
                  wasMissed && !isActive ? "border-red-400" :
                  "border-gray-400"
                } ${isClickable ? "cursor-pointer hover:border-blue-400" : "cursor-default"} ${!isSelected && testActive ? "opacity-40" : ""}`}
              >
                {/* Badge estado arriba derecha */}
                <div className="flex items-center justify-end gap-1.5 px-2.5 pt-2">
                  <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                    isActive ? "border-blue-500 bg-blue-500 animate-pulse" :
                    wasHit ? "border-emerald-500 bg-emerald-500" :
                    wasMissed ? "border-red-500 bg-red-500" :
                    mc.connected ? "border-gray-500 bg-white" :
                    "border-gray-300 bg-white"
                  }`} />
                  <span className="text-[10px] text-gray-500">Estado</span>
                </div>

                {/* Imagen placeholder gris */}
                <div className="mx-2.5 mb-2 mt-1.5 bg-gray-600 flex items-center justify-center overflow-hidden" style={{ aspectRatio: "4/3" }}>
                  <img
                    src={getMicroImage(mc)}
                    alt={`Cápsula ${mc.id}`}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </div>

                {/* Nombre cápsula */}
                <div className="text-center pb-2.5 px-1">
                  <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Cápsula {mc.id}
                  </p>
                  {mc.status && (
                    <p className={`text-[10px] font-semibold mt-0.5 ${
                      mc.status === "Acierto" ? "text-emerald-600" :
                      mc.status === "Error" ? "text-red-500" :
                      "text-blue-500"
                    }`}>{mc.status}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BARRA DE PROGRESO — TIEMPO TRANSCURRIDO
      ══════════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <div className="relative h-2.5 bg-gray-300 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-blue-800 rounded-full transition-all duration-1000"
            style={{ width: testActive ? `${progressPct}%` : "0%" }}
          />
        </div>
        <div className="flex items-center justify-center gap-3 mt-2">
          <p className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em]">
            Tiempo transcurrido
          </p>
          {testActive && (
            <span className="text-xs text-gray-500">
              {formatTime(tiempoTranscurrido)}
              {modoActual !== "secuencial" && ` · ${formatTime(tiempoRestante)} restante`}
              {modoActual === "secuencial" && totalRounds > 0 && ` · Ronda ${currentRound}/${totalRounds}`}
            </span>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          RESULTADOS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex justify-center">
        <div className="border-2 border-gray-400 bg-white px-10 py-5" style={{ minWidth: 380 }}>
          <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4">
            Resultados
          </p>
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1">Aciertos</p>
              <p className="text-3xl font-bold text-emerald-600">{estadisticas.aciertos}</p>
              {totalAttempts > 0 && <p className="text-xs text-emerald-600 mt-0.5">{accuracy}%</p>}
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1">Fallos</p>
              <p className="text-3xl font-bold text-red-500">{estadisticas.errores}</p>
              {totalAttempts > 0 && <p className="text-xs text-red-500 mt-0.5">{100 - accuracy}%</p>}
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1">Intentos</p>
              <p className="text-3xl font-bold text-gray-700">{estadisticas.intentos}</p>
            </div>
          </div>

          {/* Botones modo manual */}
          {testActiveManual && (
            <div className="flex gap-3 mt-4 justify-center border-t border-gray-200 pt-4">
              <button
                onClick={() => { if (currentActiveESPManual) handleManualResponse(currentActiveESPManual, "acierto") }}
                disabled={!waitingForResponseManual}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40"
              >
                ✓ Acierto
              </button>
              <button
                onClick={() => { if (currentActiveESPManual) handleManualResponse(currentActiveESPManual, "error") }}
                disabled={!waitingForResponseManual}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40"
              >
                ✗ Fallo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL RESUMEN
      ══════════════════════════════════════════════════════════════════ */}
      {showSummary && summaryData && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSummary(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-7 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Prueba Finalizada</h3>
                  <p className="text-xs text-gray-500 capitalize">{summaryData.tipo} · {new Date(summaryData.timestamp).toLocaleTimeString("es-ES")}</p>
                </div>
              </div>
              <button onClick={() => setShowSummary(false)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-7 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Aciertos", value: summaryData.resultados?.aciertos || 0, cls: "emerald", pct: summaryData.resultados?.intentos > 0 ? Math.round((summaryData.resultados.aciertos / summaryData.resultados.intentos) * 100) + "%" : null },
                  { label: "Errores", value: summaryData.resultados?.errores || 0, cls: "red", pct: summaryData.resultados?.intentos > 0 ? (100 - Math.round((summaryData.resultados.aciertos / summaryData.resultados.intentos) * 100)) + "%" : null },
                  { label: "Intentos", value: summaryData.resultados?.intentos || 0, cls: "blue", pct: "total" },
                ].map(({ label, value, cls, pct }) => (
                  <div key={label} className={`rounded-xl bg-${cls}-50 border border-${cls}-200 p-4 text-center`}>
                    <p className={`text-[10px] font-bold text-${cls}-700 uppercase tracking-widest mb-2`}>{label}</p>
                    <p className={`text-4xl font-black text-${cls}-800`}>{value}</p>
                    {pct && <p className={`text-xs text-${cls}-600 mt-1`}>{pct}</p>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Jugador</p>
                  <p className="text-sm font-bold text-gray-900">{summaryData.jugador ? `${summaryData.jugador.nombres} ${summaryData.jugador.apellidos}` : "—"}</p>
                  {summaryData.jugador?.posicion && <p className="text-xs text-gray-500 mt-0.5 capitalize">{summaryData.jugador.posicion}</p>}
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Duración</p>
                  <p className="text-sm font-bold text-gray-900">{formatTime(summaryData.tiempo_transcurrido || 0)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">tiempo total</p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tipo</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">{summaryData.tipo}</p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Cápsulas</p>
                  <p className="text-sm font-bold text-gray-900">{summaryData.esp_seleccionadas?.join(", ") || "Todas"}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-200">
                <button onClick={copySummary} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  <Copy className="w-4 h-4" /> Copiar
                </button>
                <button onClick={() => setShowSummary(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-semibold">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}