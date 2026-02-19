"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle,
  X,
  Play,
  List,
  Shuffle,
  Hand,
  ChevronDown,
  Info,
  Copy,
  Target,
  XCircle,
  User,
  Timer,
  BarChart3,
  TrendingUp,
  Award,
  Activity,
} from "lucide-react"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

export default function PruebasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notification, setNotification] = useState(null)

  const [selectedESPs, setSelectedESPs] = useState([1, 2, 3, 4, 5])
  const [showESPSelection, setShowESPSelection] = useState(false)

  // Modal resumen al finalizar
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
  const [estadisticasSequential, setEstadisticasSequential] = useState({
    intentos: 0,
    aciertos: 0,
    errores: 0,
  })

  // Aleatorio
  const [testActiveRandom, setTestActiveRandom] = useState(false)
  const [currentActiveESPRandom, setCurrentActiveESPRandom] = useState(null)
  const [waitingForResponseRandom, setWaitingForResponseRandom] = useState(false)
  const [tiempoPrueba, setTiempoPrueba] = useState(60)
  const [tiempoRestante, setTiempoRestante] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  const [pruebaActualRandom, setPruebaActualRandom] = useState(null)
  const [estadisticasRandom, setEstadisticasRandom] = useState({
    intentos: 0,
    aciertos: 0,
    errores: 0,
  })

  // Manual
  const [testActiveManual, setTestActiveManual] = useState(false)
  const [currentActiveESPManual, setCurrentActiveESPManual] = useState(null)
  const [waitingForResponseManual, setWaitingForResponseManual] = useState(false)
  const [pruebaActualManual, setPruebaActualManual] = useState(null)
  const [estadisticasManual, setEstadisticasManual] = useState({
    intentos: 0,
    aciertos: 0,
    errores: 0,
  })

  const [modoActual, setModoActual] = useState("secuencial")
  const [tiempoReaccion, setTiempoReaccion] = useState(3.0)

  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0)
  const [timerGeneralInterval, setTimerGeneralInterval] = useState(null)

  const [microControllers, setMicroControllers] = useState([
    { id: 1, label: "A", active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
    { id: 2, label: "B", active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
    { id: 3, label: "C", active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
    { id: 4, label: "D", active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
    { id: 5, label: "E", active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
  ])

  const [pusherConnected, setPusherConnected] = useState(false)
  const [pusherStatus, setPusherStatus] = useState("Desconectado")
  const [espResponses, setEspResponses] = useState([])

  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [jugadores, setJugadores] = useState([])

  // Refs
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
    testActiveSequential,
    currentActiveESPSequential,
    waitingForResponseSequential,
    testActiveRandom,
    currentActiveESPRandom,
    waitingForResponseRandom,
    testActiveManual,
    currentActiveESPManual,
    waitingForResponseManual,
    selectedESPs,
  ])

  useEffect(() => {
    fetchJugadores()
    loadPusher()
  }, [])

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval)
      if (timerGeneralInterval) clearInterval(timerGeneralInterval)
    }
  }, [timerInterval, timerGeneralInterval])

  const toggleESPSelection = (espId) => {
    setSelectedESPs((prev) => {
      if (prev.includes(espId)) {
        if (prev.length === 1) {
          showNotification("error", "Debe haber al menos 1 ESP seleccionada")
          return prev
        }
        return prev.filter((id) => id !== espId)
      } else {
        return [...prev, espId].sort((a, b) => a - b)
      }
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
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error al cargar jugadores")

      if (data.success) {
        const jugadores = data.data
          .filter((cuenta) => cuenta.rol === "jugador" && cuenta.jugador)
          .map((cuenta) => ({
            ...cuenta.jugador,
            id: cuenta.jugador.id,
            usuario: cuenta.usuario,
            cuentaId: cuenta.id,
          }))
        setJugadores(jugadores)
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("error", "Error al cargar jugadores")
    } finally {
      setLoading(false)
    }
  }

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null
    const birthDate = new Date(fechaNacimiento)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const loadPusher = async () => {
    if (typeof window === "undefined") return
    try {
      const script = document.createElement("script")
      script.src = "https://js.pusher.com/8.2.0/pusher.min.js"
      script.async = true
      document.head.appendChild(script)
      script.onload = () => initializePusher()
    } catch (error) {
      console.error("Error loading Pusher:", error)
      setPusherStatus("Error cargando Pusher")
    }
  }

  const initializePusher = () => {
    const pusherKey = "4f85ef5c792df94cebc9"
    const pusherCluster = "us2"

    const pusher = new window.Pusher(pusherKey, {
      cluster: pusherCluster,
      encrypted: true,
      authEndpoint: `${BACKEND_URL}/api/pusher/pusher/auth`,
      forceTLS: true,
    })

    pusher.connection.bind("connected", () => {
      setPusherStatus("Conectado")
      setPusherConnected(true)
      subscribeToMicrocontrollerChannels(pusher)
    })

    pusher.connection.bind("disconnected", () => {
      setPusherStatus("Desconectado")
      setPusherConnected(false)
    })
  }

  const subscribeToMicrocontrollerChannels = (pusher) => {
    for (let i = 1; i <= 5; i++) {
      const channelName = `private-device-ESP-${i}`
      const channel = pusher.subscribe(channelName)

      channel.bind("pusher:subscription_succeeded", () => {
        setMicroControllers((prev) =>
          prev.map((mc) => (mc.id === i ? { ...mc, connected: true, lastSeen: new Date() } : mc)),
        )
      })

      channel.bind("client-response", (data) => {
        const espId = Number.parseInt(channelName.split("-").pop())
        const responseMessage = data.message?.toLowerCase() || ""

        setMicroControllers((prev) =>
          prev.map((mc) => (mc.id === espId ? { ...mc, connected: true, lastSeen: new Date() } : mc)),
        )

        if (
          testActiveSequentialRef.current &&
          waitingForResponseSequentialRef.current &&
          currentActiveESPSequentialRef.current === espId
        ) {
          if (processingResponseSequentialRef.current) return
          processingResponseSequentialRef.current = true
          if (responseMessage.includes("acierto") || responseMessage.includes("success")) {
            handleSequentialResponse(espId, "acierto")
          } else {
            handleSequentialResponse(espId, "error")
          }
        } else if (
          testActiveRandomRef.current &&
          waitingForResponseRandomRef.current &&
          currentActiveESPRandomRef.current === espId
        ) {
          if (processingResponseRandomRef.current) return
          processingResponseRandomRef.current = true
          if (responseMessage.includes("acierto") || responseMessage.includes("success")) {
            handleRandomResponse(espId, "acierto")
          } else {
            handleRandomResponse(espId, "error")
          }
        } else if (
          testActiveManualRef.current &&
          waitingForResponseManualRef.current &&
          currentActiveESPManualRef.current === espId
        ) {
          if (processingResponseManualRef.current) return
          processingResponseManualRef.current = true
          if (responseMessage.includes("acierto") || responseMessage.includes("success")) {
            handleManualResponse(espId, "acierto")
          } else {
            handleManualResponse(espId, "error")
          }
        }
      })
    }
  }

  const sendCommandToESP = async (espId, command) => {
    try {
      const deviceId = `ESP-${espId}`
      const commandToSend = command?.command === "ON" ? `ON:${tiempoReaccion}` : command?.command || "ON"

      const response = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: deviceId,
          command: commandToSend,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error al enviar comando")
    } catch (error) {
      console.error(`Error sending command to ESP-${espId}:`, error)
    }
  }

  const iniciarCronometroGeneral = () => {
    setTiempoTranscurrido(0)
    const interval = setInterval(() => setTiempoTranscurrido((prev) => prev + 1), 1000)
    setTimerGeneralInterval(interval)
  }

  const detenerCronometroGeneral = () => {
    if (timerGeneralInterval) {
      clearInterval(timerGeneralInterval)
      setTimerGeneralInterval(null)
    }
  }

  const iniciarPruebaSecuencial = async () => {
    if (!selectedPlayer) {
      showNotification("error", "Debe seleccionar un jugador")
      return
    }
    if (selectedESPs.length === 0) {
      showNotification("error", "Debe seleccionar al menos 1 ESP")
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "secuencial", cuentaId: selectedPlayer.cuentaId }),
      })
      const data = await response.json()

      if (data.success) {
        localStorage.setItem("prueba_secuencial_id", data.data.id.toString())
        setPruebaActualSequential(data.data)
        setTestActiveSequential(true)
        setModoActual("secuencial")
        setCurrentRound(1)
        setCurrentSequence(1)
        setEstadisticasSequential({ intentos: 0, aciertos: 0, errores: 0 })
        iniciarCronometroGeneral()
        showNotification(
          "success",
          `Prueba secuencial iniciada - ${totalRounds} rondas con ESP: ${selectedESPs.join(", ")}`,
        )
        setTimeout(() => activateNextMicrocontrollerSequential(selectedESPs[0]), 1000)
      } else {
        showNotification("error", "Error iniciando prueba: " + data.message)
      }
    } catch (error) {
      console.error("Error starting sequential test:", error)
      showNotification("error", "Error iniciando prueba")
    }
  }

  const activateNextMicrocontrollerSequential = (espId) => {
    if (responseTimeoutSequentialRef.current) {
      clearTimeout(responseTimeoutSequentialRef.current)
      responseTimeoutSequentialRef.current = null
    }

    setCurrentActiveESPSequential(espId)
    setWaitingForResponseSequential(true)

    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: mc.id === espId,
        status: mc.id === espId ? "Esperando respuesta" : mc.status,
      })),
    )

    const command = { command: "ON", from: "server" }
    sendCommandToESP(espId, command)

    const timeoutMs = tiempoReaccion * 1000
    responseTimeoutSequentialRef.current = setTimeout(() => {
      handleSequentialResponse(espId, "error")
    }, timeoutMs)
  }

  const handleSequentialResponse = (espId, responseType) => {
    if (
      !testActiveSequentialRef.current ||
      !waitingForResponseSequentialRef.current ||
      currentActiveESPSequentialRef.current !== espId
    ) {
      processingResponseSequentialRef.current = false
      return
    }

    if (responseTimeoutSequentialRef.current) {
      clearTimeout(responseTimeoutSequentialRef.current)
      responseTimeoutSequentialRef.current = null
    }

    setEstadisticasSequential((prev) => ({
      intentos: prev.intentos + 1,
      aciertos: responseType === "acierto" ? prev.aciertos + 1 : prev.aciertos,
      errores: responseType === "error" ? prev.errores + 1 : prev.errores,
    }))

    setWaitingForResponseSequential(false)
    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: false,
        lastResponse: mc.id === espId ? responseType : mc.lastResponse,
        status: mc.id === espId ? (responseType === "acierto" ? "Acierto" : "Error") : mc.status,
      })),
    )

    setTimeout(() => {
      const currentIndex = selectedESPsRef.current.indexOf(espId)
      const nextIndex = currentIndex + 1

      if (nextIndex < selectedESPsRef.current.length) {
        const nextEspId = selectedESPsRef.current[nextIndex]
        setCurrentSequence(nextIndex + 1)
        activateNextMicrocontrollerSequential(nextEspId)
      } else {
        setCurrentRound((prevRound) => {
          if (prevRound < totalRounds) {
            limpiarEntreRondasSequential()
            showNotification("success", `Iniciando ronda ${prevRound + 1}`)
            setTimeout(() => {
              setCurrentSequence(1)
              activateNextMicrocontrollerSequential(selectedESPs.current[0])
            }, 2000)
            return prevRound + 1
          } else {
            showNotification("success", "Todas las rondas completadas")
            setTimeout(() => finalizarPruebaSecuencial(), 1000)
            return prevRound
          }
        })
      }
      processingResponseSequentialRef.current = false
    }, 1500)
  }

  const abrirResumen = (tipo, stats) => {
    const payload = {
      tipo,
      jugador: selectedPlayer
        ? {
            id: selectedPlayer.id,
            nombres: selectedPlayer.nombres,
            apellidos: selectedPlayer.apellidos,
            posicion: selectedPlayer.posicion_principal,
            cuentaId: selectedPlayer.cuentaId,
          }
        : null,
      tiempo_transcurrido: tiempoTranscurrido,
      esp_seleccionadas: selectedESPs,
      parametros: {
        tiempo_reaccion: tiempoReaccion,
        rondas: tipo === "secuencial" ? totalRounds : undefined,
        duracion: tipo === "aleatorio" ? tiempoPrueba : undefined,
      },
      resultados: stats,
      timestamp: new Date().toISOString(),
    }
    setSummaryData(payload)
    setShowSummary(true)
  }

  const finalizarPruebaSecuencial = async () => {
    detenerCronometroGeneral()

    const pruebaId = localStorage.getItem("prueba_secuencial_id")

    if (pruebaId) {
      try {
        await fetch(`${BACKEND_URL}/api/pruebas/finalizar/${pruebaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cantidad_intentos: estadisticasSequential.intentos,
            cantidad_aciertos: estadisticasSequential.aciertos,
            cantidad_errores: estadisticasSequential.errores,
          }),
        })

        localStorage.removeItem("prueba_secuencial_id")
        showNotification("success", "Prueba secuencial finalizada correctamente")
      } catch (error) {
        console.error("Error finalizing sequential test:", error)
      }
    }

    abrirResumen("secuencial", { ...estadisticasSequential })
    limpiarPruebaSecuencial()
  }

  const limpiarPruebaSecuencial = () => {
    setTestActiveSequential(false)
    setCurrentActiveESPSequential(null)
    setWaitingForResponseSequential(false)
    setCurrentRound(0)
    setCurrentSequence(0)
    setPruebaActualSequential(null)
    setEstadisticasSequential({ intentos: 0, aciertos: 0, errores: 0 })
    setTiempoTranscurrido(0)

    if (responseTimeoutSequentialRef.current) {
      clearTimeout(responseTimeoutSequentialRef.current)
      responseTimeoutSequentialRef.current = null
    }

    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, status: "", lastResponse: null })))
    processingResponseSequentialRef.current = false
  }

  const limpiarEntreRondasSequential = () => {
    setCurrentActiveESPSequential(null)
    setWaitingForResponseSequential(false)
    setCurrentSequence(0)

    if (responseTimeoutSequentialRef.current) {
      clearTimeout(responseTimeoutSequentialRef.current)
      responseTimeoutSequentialRef.current = null
    }

    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, status: "", lastResponse: null })))
    processingResponseSequentialRef.current = false
  }

  const iniciarPruebaAleatoria = async () => {
    if (!selectedPlayer) {
      showNotification("error", "Debe seleccionar un jugador")
      return
    }
    if (selectedESPs.length === 0) {
      showNotification("error", "Debe seleccionar al menos 1 ESP")
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "aleatorio",
          cuentaId: selectedPlayer.cuentaId,
        }),
      })
      const data = await response.json()

      if (data.success) {
        localStorage.setItem("prueba_aleatoria_id", data.data.id.toString())
        setPruebaActualRandom(data.data)
        setTestActiveRandom(true)
        setModoActual("aleatorio")
        setTiempoRestante(tiempoPrueba)
        setEstadisticasRandom({ intentos: 0, aciertos: 0, errores: 0 })
        iniciarCronometroGeneral()
        showNotification("success", `Prueba aleatoria iniciada - ${tiempoPrueba}s con ESP: ${selectedESPs.join(", ")}`)

        const interval = setInterval(() => {
          setTiempoRestante((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              showNotification("success", "Tiempo agotado - Finalizando prueba")
              setTimeout(() => finalizarPruebaAleatoria(), 1000)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        setTimerInterval(interval)

        setTimeout(() => activateRandomMicrocontroller(), 1000)
      } else {
        showNotification("error", "Error iniciando prueba: " + data.message)
      }
    } catch (error) {
      console.error("Error starting random test:", error)
      showNotification("error", "Error iniciando prueba")
    }
  }

  const activateRandomMicrocontroller = () => {
    const availableESPs = selectedESPsRef.current
    const randomIndex = Math.floor(Math.random() * availableESPs.length)
    const randomEspId = availableESPs[randomIndex]

    if (responseTimeoutRandomRef.current) {
      clearTimeout(responseTimeoutRandomRef.current)
      responseTimeoutRandomRef.current = null
    }

    setCurrentActiveESPRandom(randomEspId)
    setWaitingForResponseRandom(true)

    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: mc.id === randomEspId,
        status: mc.id === randomEspId ? "Esperando respuesta" : mc.status,
      })),
    )

    const command = { command: "ON", from: "server" }
    sendCommandToESP(randomEspId, command)

    const timeoutMs = tiempoReaccion * 1000
    responseTimeoutRandomRef.current = setTimeout(() => {
      handleRandomResponse(randomEspId, "error")
    }, timeoutMs)
  }

  const handleRandomResponse = (espId, responseType) => {
    if (
      !testActiveRandomRef.current ||
      !waitingForResponseRandomRef.current ||
      currentActiveESPRandomRef.current !== espId
    ) {
      processingResponseRandomRef.current = false
      return
    }

    if (responseTimeoutRandomRef.current) {
      clearTimeout(responseTimeoutRandomRef.current)
      responseTimeoutRandomRef.current = null
    }

    setEstadisticasRandom((prev) => ({
      intentos: prev.intentos + 1,
      aciertos: responseType === "acierto" ? prev.aciertos + 1 : prev.aciertos,
      errores: responseType === "error" ? prev.errores + 1 : prev.errores,
    }))

    setWaitingForResponseRandom(false)
    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: false,
        lastResponse: mc.id === espId ? responseType : mc.lastResponse,
        status: mc.id === espId ? (responseType === "acierto" ? "Acierto" : "Error") : mc.status,
      })),
    )

    setTimeout(() => {
      if (testActiveRandomRef.current) {
        activateRandomMicrocontroller()
      }
      processingResponseRandomRef.current = false
    }, 1000)
  }

  const finalizarPruebaAleatoria = async () => {
    detenerCronometroGeneral()

    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }

    const pruebaId = localStorage.getItem("prueba_aleatoria_id")

    if (pruebaId) {
      try {
        await fetch(`${BACKEND_URL}/api/pruebas/finalizar/${pruebaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cantidad_intentos: estadisticasRandom.intentos,
            cantidad_aciertos: estadisticasRandom.aciertos,
            cantidad_errores: estadisticasRandom.errores,
          }),
        })

        localStorage.removeItem("prueba_aleatoria_id")
        showNotification("success", "Prueba aleatoria finalizada correctamente")
      } catch (error) {
        console.error("Error finalizing random test:", error)
      }
    }

    abrirResumen("aleatorio", { ...estadisticasRandom })
    limpiarPruebaAleatoria()
  }

  const limpiarPruebaAleatoria = () => {
    setTestActiveRandom(false)
    setCurrentActiveESPRandom(null)
    setWaitingForResponseRandom(false)
    setPruebaActualRandom(null)
    setEstadisticasRandom({ intentos: 0, aciertos: 0, errores: 0 })
    setTiempoRestante(0)

    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }

    if (responseTimeoutRandomRef.current) {
      clearTimeout(responseTimeoutRandomRef.current)
      responseTimeoutRandomRef.current = null
    }

    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, status: "", lastResponse: null })))
    processingResponseRandomRef.current = false
  }

  const iniciarPruebaManual = async () => {
    if (!selectedPlayer) {
      showNotification("error", "Debe seleccionar un jugador")
      return
    }
    if (selectedESPs.length === 0) {
      showNotification("error", "Debe seleccionar al menos 1 ESP")
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: selectedPlayer.cuentaId, tipo: "manual" }),
      })
      const data = await response.json()

      if (data.success) {
        localStorage.setItem("prueba_manual_id", data.data.id.toString())
        setPruebaActualManual(data.data)
        setTestActiveManual(true)
        setModoActual("manual")
        setEstadisticasManual({ intentos: 0, aciertos: 0, errores: 0 })

        setTiempoRestante(tiempoPrueba)
        const interval = setInterval(() => {
          setTiempoRestante((prev) => {
            if (prev <= 1) {
              finalizarPruebaManual()
              return 0
            }
            return prev - 1
          })
        }, 1000)
        setTimerInterval(interval)

        iniciarCronometroGeneral()
        showNotification("success", `Prueba manual iniciada con ESP: ${selectedESPs.join(", ")}`)
      } else {
        showNotification("error", "Error iniciando prueba: " + data.message)
      }
    } catch (error) {
      console.error("Error starting manual test:", error)
      showNotification("error", "Error iniciando prueba")
    }
  }

  const activateManualMicrocontroller = (espId) => {
    if (!selectedESPsRef.current.includes(espId)) {
      showNotification("error", `ESP-${espId} no está seleccionada para esta prueba`)
      return
    }
    if (!testActiveManualRef.current || waitingForResponseManualRef.current) return

    if (responseTimeoutManualRef.current) {
      clearTimeout(responseTimeoutManualRef.current)
      responseTimeoutManualRef.current = null
    }

    setCurrentActiveESPManual(espId)
    setWaitingForResponseManual(true)

    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: mc.id === espId,
        status: mc.id === espId ? "Esperando respuesta" : mc.status,
      })),
    )

    const command = { command: "ON", from: "server" }
    sendCommandToESP(espId, command)

    const timeoutMs = tiempoReaccion * 1000
    responseTimeoutManualRef.current = setTimeout(() => {
      handleManualResponse(espId, "error")
    }, timeoutMs)
  }

  const handleManualResponse = (espId, responseType) => {
    if (
      !testActiveManualRef.current ||
      !waitingForResponseManualRef.current ||
      currentActiveESPManualRef.current !== espId
    ) {
      processingResponseManualRef.current = false
      return
    }

    if (responseTimeoutManualRef.current) {
      clearTimeout(responseTimeoutManualRef.current)
      responseTimeoutManualRef.current = null
    }

    setEstadisticasManual((prev) => ({
      intentos: prev.intentos + 1,
      aciertos: responseType === "acierto" ? prev.aciertos + 1 : prev.aciertos,
      errores: responseType === "error" ? prev.errores + 1 : prev.errores,
    }))

    setWaitingForResponseManual(false)
    setCurrentActiveESPManual(null)
    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: false,
        lastResponse: mc.id === espId ? responseType : mc.lastResponse,
        status: mc.id === espId ? (responseType === "acierto" ? "Acierto" : "Error") : mc.status,
      })),
    )

    processingResponseManualRef.current = false
  }

  const finalizarPruebaManual = async () => {
    detenerCronometroGeneral()

    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }

    const pruebaId = localStorage.getItem("prueba_manual_id")

    if (pruebaId) {
      try {
        await fetch(`${BACKEND_URL}/api/pruebas/finalizar/${pruebaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cantidad_intentos: estadisticasManual.intentos,
            cantidad_aciertos: estadisticasManual.aciertos,
            cantidad_errores: estadisticasManual.errores,
          }),
        })

        localStorage.removeItem("prueba_manual_id")
        showNotification("success", "Prueba manual finalizada correctamente")
      } catch (error) {
        console.error("Error finalizing manual test:", error)
      }
    }

    abrirResumen("manual", { ...estadisticasManual })
    limpiarPruebaManual()
  }

  const limpiarPruebaManual = () => {
    setTestActiveManual(false)
    setCurrentActiveESPManual(null)
    setWaitingForResponseManual(false)
    setPruebaActualManual(null)
    setEstadisticasManual({ intentos: 0, aciertos: 0, errores: 0 })
    setTiempoRestante(0)

    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }

    if (responseTimeoutManualRef.current) {
      clearTimeout(responseTimeoutManualRef.current)
      responseTimeoutManualRef.current = null
    }

    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, status: "", lastResponse: null })))
    processingResponseManualRef.current = false
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getMicroImage = (mc) => {
    const testActive = testActiveSequential || testActiveRandom || testActiveManual
    if (!testActive) return "/gris.png"
    if (mc.active) return "/azul.png"
    if (mc.lastResponse === "acierto") return "/verde.png"
    if (mc.lastResponse === "error") return "/rojo.png"
    return "/gris.png"
  }

  const copySummary = async () => {
    if (!summaryData) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(summaryData, null, 2))
      showNotification("success", "Resumen copiado al portapapeles")
    } catch (e) {
      showNotification("error", "No se pudo copiar")
    }
  }

  const testActive = testActiveSequential || testActiveRandom || testActiveManual
  const estadisticas = testActiveSequential
    ? estadisticasSequential
    : testActiveRandom
      ? estadisticasRandom
      : estadisticasManual

  const totalAttempts = estadisticas.intentos
  const accuracy = totalAttempts > 0 ? Math.round((estadisticas.aciertos / totalAttempts) * 100) : 0

  const progressPct =
    modoActual === "aleatorio" || modoActual === "manual"
      ? (tiempoRestante / tiempoPrueba) * 100
      : totalRounds > 0
        ? (currentRound / totalRounds) * 100
        : 0

  return (
    <div className="min-h-screen bg-gray-50/60">

      {/* ── NOTIFICATION ── */}
      {notification && (
        <div className="fixed top-20 right-6 z-50">
          <div
            className={`rounded-2xl shadow-xl px-5 py-3.5 flex items-center gap-3 min-w-72 border bg-white ${
              notification.type === "success" ? "border-emerald-100" : "border-red-100"
            }`}
          >
            {notification.type === "success" ? (
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            )}
            <span className="font-medium text-sm text-gray-800">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── TOP ROW: Player + Config ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* PLAYER CARD */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-gray-200 bg-white">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Seleccionar Jugador</p>
              </div>

              <div className="p-6">
                {!selectedPlayer ? (
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                    <div className="flex-1">
                      <div className="relative">
                        <select
                          value=""
                          onChange={(e) => {
                            const player = jugadores.find((j) => j.id === Number.parseInt(e.target.value))
                            setSelectedPlayer(player)
                          }}
                          className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 font-medium"
                          disabled={testActive}
                        >
                          <option value="">Select</option>
                          {jugadores.map((jugador) => (
                            <option key={jugador.id} value={jugador.id}>
                              {jugador.nombres} {jugador.apellidos}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center border-2 border-gray-400">
                        <User className="w-7 h-7 text-gray-500" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                    {/* Left: Dropdown */}
                    <div className="flex-1">
                      <div className="relative">
                        <select
                          value={selectedPlayer.id}
                          onChange={(e) => {
                            const player = jugadores.find((j) => j.id === Number.parseInt(e.target.value))
                            setSelectedPlayer(player)
                          }}
                          className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 font-medium"
                          disabled={testActive}
                        >
                          {jugadores.map((jugador) => (
                            <option key={jugador.id} value={jugador.id}>
                              {jugador.nombres} {jugador.apellidos}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Right: Avatar + Name + Position + X Button */}
                    <div className="flex items-center gap-4 flex-shrink-0 md:justify-end">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center border-2 border-gray-400 shadow-sm">
                          <img
                            src={getPositionIcon(selectedPlayer?.posicion_principal) || "/oso.png"}
                            alt={getPositionName(selectedPlayer?.posicion_principal)}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = "/oso.png" }}
                          />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">
                          {selectedPlayer.nombres} {selectedPlayer.apellidos}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium mt-0.5">
                          {getPositionName(selectedPlayer?.posicion_principal) || "Posición"}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedPlayer(null)}
                        disabled={testActive}
                        className="ml-2 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0"
                        title="Cambiar jugador"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CONFIG CARD */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              
              <div className="p-6 space-y-5">

                {/* Test type + Capsules */}
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Tipo de prueba</p>
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                      {[
                        { key: "secuencial", label: "Secuencial" },
                        { key: "aleatorio", label: "Aletorio" },
                        { key: "manual",   label: "Mananual" },
                      ].map(({ key, icon, label }) => (
                        <button
                          key={key}
                          onClick={() => setModoActual(key)}
                          disabled={testActive}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                            modoActual === key
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          } disabled:opacity-50`}
                        >
                          {icon}{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Cápsulas a usar</p>
                    <div className="flex gap-1.5">
                      {microControllers.map((mc) => (
                        <button
                          key={mc.id}
                          onClick={() => toggleESPSelection(mc.id)}
                          disabled={testActive}
                          className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${
                            selectedESPs.includes(mc.id)
                              ? "bg-gray-900 text-white shadow-sm"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          } disabled:opacity-50`}
                        >
                          {mc.id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Params + Button */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      {modoActual === "secuencial" ? " N° Rondas" : "Duración (s)"}
                    </p>
                    <input
                      type="number"
                      value={modoActual === "aleatorio" || modoActual === "manual" ? tiempoPrueba : totalRounds}
                      onChange={(e) => {
                        if (modoActual === "aleatorio" || modoActual === "manual") {
                          setTiempoPrueba(Number.parseInt(e.target.value) || 60)
                        } else {
                          setTotalRounds(Number.parseInt(e.target.value) || 1)
                        }
                      }}
                      disabled={testActive}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                    />
                  </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Tiempo de encendido (S)
                  </p>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5"
                    value={tiempoReaccion}
                    onChange={(e) => {
                      let value = Number.parseFloat(e.target.value);
                      if (isNaN(value)) value = 0.1;
                      if (value < 0.1) value = 0.1;
                      if (value > 5) value = 5;

                      setTiempoReaccion(value);
                    }}
                    disabled={testActive}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  />
                </div>


                  <div className="flex flex-col justify-end">
                    {!testActive ? (
                    <button
                        onClick={() => {
                          if (modoActual === "secuencial") iniciarPruebaSecuencial()
                          else if (modoActual === "aleatorio") iniciarPruebaAleatoria()
                          else iniciarPruebaManual()
                        }}
                        className="w-full h-[42px] bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Iniciar
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (modoActual === "secuencial") finalizarPruebaSecuencial()
                          else if (modoActual === "aleatorio") finalizarPruebaAleatoria()
                          else finalizarPruebaManual()
                        }}
                        className="w-full h-[42px] bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Finalizar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CAPSULE GRID ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-gray-200 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Estado de Cápsulas</p>
             
            </div>
            <div className="p-3 md:p-6 grid grid-cols-5 gap-2.5 md:gap-4">
              {microControllers.map((mc, index) => {
                const isSelected = selectedESPs.includes(mc.id)
                const isClickable = testActiveManual && mc.connected && !waitingForResponseManual && isSelected
                const isActive = mc.active
                const wasHit = mc.lastResponse === "acierto"
                const wasMissed = mc.lastResponse === "error"

                return (
                  <div
                    key={index}
                    onClick={() => { if (isClickable) activateManualMicrocontroller(mc.id) }}
                    className={`
                      relative rounded-2xl border-2 overflow-hidden transition-all duration-300
                      ${isActive ? "border-blue-300 bg-blue-50/60 shadow-lg shadow-blue-100" : "border-gray-100 bg-gray-50"}
                      ${wasHit && !isActive ? "border-emerald-200 bg-emerald-50/40" : ""}
                      ${wasMissed && !isActive ? "border-red-200 bg-red-50/40" : ""}
                      ${isClickable ? "cursor-pointer hover:border-blue-300 hover:shadow-md" : "cursor-default"}
                      ${!isSelected && testActive ? "opacity-40" : ""}
                    `}
                  >
                    {/* Status dot */}
                    <div className="absolute top-2 md:top-3 right-2 md:right-3">
                      <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        isActive ? "bg-blue-500 animate-pulse" :
                        wasHit ? "bg-emerald-400" :
                        wasMissed ? "bg-red-400" :
                        mc.connected ? "bg-gray-300" : "bg-gray-200"
                      }`} />
                    </div>

                    <div className="p-2.5 md:p-4">
                      {/* Image */}
                      <div className="w-full aspect-square rounded-lg md:rounded-xl overflow-hidden bg-white flex items-center justify-center mb-2.5 md:mb-3 border border-gray-100">
                        <img
                          src={getMicroImage(mc) || "/placeholder.svg"}
                          alt={`ESP-${mc.id}`}
                          className="w-full h-full object-contain p-2 md:p-2"
                        />
                      </div>

                      {/* Label */}
                      <div className="text-center">
                        <p className="text-xs md:text-xs font-bold text-gray-600 uppercase tracking-wide">
                          <span className="hidden md:inline">Cápsula </span>{mc.id}
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
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── PROGRESS BAR ── */}
          {testActive && (modoActual === "aleatorio" || modoActual === "manual") && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Timer className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {modoActual === "secuencial" ? "Progreso de rondas" : "Tiempo restante"}
                    </p>
                    
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-gray-900 tabular-nums">
                    {modoActual === "secuencial"
                      ? `${totalRounds > 0 ? Math.round((currentRound / totalRounds) * 100) : 0}%`
                      : formatTime(tiempoRestante)}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {modoActual === "secuencial" ? "completado" : "restante"}
                  </p>
                </div>
              </div>

              {/* Bar track */}
              <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                    modoActual === "secuencial"
                      ? "bg-blue-900"
                      : tiempoRestante < tiempoPrueba * 0.2
                        ? "bg-red-600"
                        : tiempoRestante < tiempoPrueba * 0.5
                          ? "bg-amber-500"
                          : "bg-blue-900"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex justify-between mt-2">
                <span className="text-[11px] text-gray-400">
                  {modoActual === "secuencial" ? "Inicio" : "0s"}
                </span>
                <span className="text-[11px] text-gray-400">
                  {modoActual === "secuencial" ? `${totalRounds} rondas` : `${tiempoPrueba}s`}
                </span>
              </div>
            </div>
          )}

          {/* ── RESULTS CARD ── */}
<div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-lg mx-auto">
  <div className="px-5 pt-4 pb-3 border-b border-gray-200 flex items-center justify-between">
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Resultados</p>
  </div>

  <div className="p-4">
    <div className="grid grid-cols-2 gap-3 items-stretch">

      {/* Aciertos */}
      <div className="relative rounded-lg bg-emerald-50 border border-emerald-200 p-4 overflow-hidden flex flex-col justify-between h-full">
        <div className="absolute top-2 right-2 opacity-[0.08]">
          <Target className="w-8 h-8 text-emerald-900" />
        </div>
        <div>
          <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center mb-2">
            <Target className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <p className="text-[9px] font-semibold text-emerald-700/70 uppercase tracking-widest mb-1">Aciertos</p>
          <p className="text-2xl font-black text-emerald-800 tabular-nums leading-none">{estadisticas.aciertos}</p>
        </div>
        {totalAttempts > 0 && (
          <p className="text-xs text-emerald-600 mt-2 font-medium">{accuracy}%</p>
        )}
      </div>

      {/* Fallos */}
      <div className="relative rounded-lg bg-red-50 border border-red-200 p-4 overflow-hidden flex flex-col justify-between h-full">
        <div className="absolute top-2 right-2 opacity-[0.08]">
          <XCircle className="w-8 h-8 text-red-900" />
        </div>
        <div>
          <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center mb-2">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <p className="text-[9px] font-semibold text-red-700/70 uppercase tracking-widest mb-1">Fallos</p>
          <p className="text-2xl font-black text-red-800 tabular-nums leading-none">{estadisticas.errores}</p>
        </div>
        {totalAttempts > 0 && (
          <p className="text-xs text-red-600 mt-2 font-medium">{100 - accuracy}%</p>
        )}
      </div>

    </div>
  </div>
</div>


        </div>
      </div>

      {/* ── SUMMARY MODAL ── */}
      {showSummary && summaryData && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSummary(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

            {/* Modal header */}
            <div className="px-7 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-900 flex items-center justify-center shadow-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Prueba Finalizada</h3>
                    <p className="text-xs text-gray-500 capitalize">
                      {summaryData.tipo} · {new Date(summaryData.timestamp).toLocaleTimeString('es-ES')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSummary(false)}
                  className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-7 space-y-6">

              {/* Main results grid */}
              <div className="grid grid-cols-3 gap-4">
                {/* Aciertos */}
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                    <Target className="w-5 h-5 text-emerald-700" />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2">Aciertos</p>
                  <p className="text-4xl font-black text-emerald-800">{summaryData.resultados?.aciertos || 0}</p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
                    {summaryData.resultados?.intentos > 0 
                      ? `${Math.round((summaryData.resultados.aciertos / summaryData.resultados.intentos) * 100)}%`
                      : "0%"}
                  </p>
                </div>

                {/* Errores */}
                <div className="rounded-2xl bg-red-50 border border-red-200 p-5 text-center hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mx-auto mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-2">Errores</p>
                  <p className="text-4xl font-black text-red-800">{summaryData.resultados?.errores || 0}</p>
                  <p className="text-xs text-red-600 mt-2 font-medium">
                    {summaryData.resultados?.intentos > 0
                      ? `${100 - Math.round((summaryData.resultados.aciertos / summaryData.resultados.intentos) * 100)}%`
                      : "0%"}
                  </p>
                </div>

              
              </div>

              {/* Metadata section */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">Información de la prueba</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Jugador</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {summaryData.jugador
                        ? `${summaryData.jugador.nombres} ${summaryData.jugador.apellidos}`
                        : "—"}
                    </p>
                    {summaryData.jugador?.posicion && (
                      <p className="text-xs text-gray-600 mt-1">{summaryData.jugador.posicion}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Duración</p>
                    <p className="text-sm font-bold text-gray-900">{formatTime(summaryData.tiempo_transcurrido || 0)}</p>
                    <p className="text-xs text-gray-600 mt-1">tiempo total</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tipo de prueba</p>
                    <p className="text-sm font-bold text-gray-900 capitalize">{summaryData.tipo}</p>
                  </div>
                 
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => copySummary()}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
                <button
                  onClick={() => setShowSummary(false)}
                  className="flex-1 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors"
                >
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
