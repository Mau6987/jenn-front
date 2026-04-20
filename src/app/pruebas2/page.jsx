"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle, CheckCircle, X, ChevronDown, Save, User, Award, Activity, Target,
} from "lucide-react"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

const C = {
  guindo:      "#7B1D2E",
  guindoDark:  "#5E1522",
  guindoLight: "#F5E8EA",
  guindoMid:   "#A52A3C",
  slate:       "#334155",
  slateDark:   "#1E293B",
  slateLight:  "#EFF3F7",
  grayDark:    "#2C2C2C",
  grayMed:     "#6B6B6B",
  grayLight:   "#E8E8E8",
  grayUltra:   "#F4F4F4",
  white:       "#FFFFFF",
  emerald:     "#1A7A5E",
  emeraldBg:   "#EAF5F1",
  red:         "#B03030",
  redBg:       "#FAEAEA",
  blue:        "#2563EB",
  blueBg:      "#EFF6FF",
  orange:      "#C2620A",
  orangeBg:    "#FEF3E8",
}

const styles = {
  label: { fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.grayMed, marginBottom: 6, display: "block", fontFamily: "'DM Sans', sans-serif" },
  input: {
    border: `1px solid ${C.grayLight}`, borderRadius: 4, padding: "7px 12px",
    fontSize: 13, color: C.grayDark, background: C.white, outline: "none",
    fontFamily: "'DM Sans', sans-serif", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
}

// ── FIX: barColors incluye alias "critica" (string que manda el ESP)
function BatteryIcon({ nivel, porcentaje, voltaje }) {
  const barColors = {
    normal:  ["#1A7A5E", "#1A7A5E", "#1A7A5E"],
    alerta:  ["#C2620A", "#C2620A", "#E8E8E8"],
    critico: ["#B03030", "#E8E8E8", "#E8E8E8"],
    critica: ["#B03030", "#E8E8E8", "#E8E8E8"], // alias para el valor que manda el ESP
    null:    ["#E8E8E8", "#E8E8E8", "#E8E8E8"],
  }
  const colors = barColors[nivel] || barColors[null]
  const label  = nivel === "normal" ? "OK" : (nivel === "alerta" ? "LOW" : (nivel === "critico" || nivel === "critica") ? "CRIT" : "—")
  const labelColor = nivel === "normal" ? C.emerald : nivel === "alerta" ? C.orange : (nivel === "critico" || nivel === "critica") ? C.red : C.grayMed

  return (
    <div title={voltaje != null ? `${typeof voltaje === "number" ? voltaje.toFixed(2) : voltaje}V · ${porcentaje}%` : "Sin datos de batería"}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "default" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
        <div style={{
          width: 18, height: 10, border: `1.5px solid ${colors[0] === "#E8E8E8" ? C.grayLight : colors[0]}`,
          borderRadius: 2, padding: "1px 2px",
          display: "flex", alignItems: "center", gap: 1, background: C.white,
        }}>
          {colors.map((c, i) => (
            <div key={i} style={{ flex: 1, height: "100%", borderRadius: 1, background: c, transition: "background 0.4s" }} />
          ))}
        </div>
        <div style={{ width: 2, height: 5, background: colors[0] === "#E8E8E8" ? C.grayLight : colors[0], borderRadius: "0 1px 1px 0", transition: "background 0.4s" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: labelColor, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
        {porcentaje !== null ? `${porcentaje}%` : label}
      </span>
    </div>
  )
}

export default function PruebasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [selectedESPs, setSelectedESPs] = useState([])
  const [showSummary, setShowSummary] = useState(false)
  const [summaryData, setSummaryData] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const [testActiveSequential, setTestActiveSequential] = useState(false)
  const [currentActiveESPSequential, setCurrentActiveESPSequential] = useState(null)
  const [waitingForResponseSequential, setWaitingForResponseSequential] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)
  const [totalRounds, setTotalRounds] = useState(1)
  const [currentSequence, setCurrentSequence] = useState(0)
  const [pruebaActualSequential, setPruebaActualSequential] = useState(null)
  const [estadisticasSequential, setEstadisticasSequential] = useState({ intentos: 0, aciertos: 0, errores: 0 })

  const [testActiveRandom, setTestActiveRandom] = useState(false)
  const [currentActiveESPRandom, setCurrentActiveESPRandom] = useState(null)
  const [waitingForResponseRandom, setWaitingForResponseRandom] = useState(false)
  const [tiempoPrueba, setTiempoPrueba] = useState(60)
  const [tiempoRestante, setTiempoRestante] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  const [pruebaActualRandom, setPruebaActualRandom] = useState(null)
  const [estadisticasRandom, setEstadisticasRandom] = useState({ intentos: 0, aciertos: 0, errores: 0 })

  const [testActiveManual, setTestActiveManual] = useState(false)
  const [currentActiveESPManual, setCurrentActiveESPManual] = useState(null)
  const [waitingForResponseManual, setWaitingForResponseManual] = useState(false)
  const [pruebaActualManual, setPruebaActualManual] = useState(null)
  const [estadisticasManual, setEstadisticasManual] = useState({ intentos: 0, aciertos: 0, errores: 0 })

  const [modoActual, setModoActual] = useState("secuencial")
  const [tiempoReaccion, setTiempoReaccion] = useState(3.0)
  const [batteryLevels, setBatteryLevels] = useState({})

  const testStartTimeRef = useRef(null)
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0)
  const [timerGeneralInterval, setTimerGeneralInterval] = useState(null)
  const finalDurationRef = useRef(0)

  const [microControllers, setMicroControllers] = useState([
    { id: 1, active: false, connected: false, lastSeen: null, lastResponse: null, status: "", battery: null },
    { id: 2, active: false, connected: false, lastSeen: null, lastResponse: null, status: "", battery: null },
    { id: 3, active: false, connected: false, lastSeen: null, lastResponse: null, status: "", battery: null },
    { id: 4, active: false, connected: false, lastSeen: null, lastResponse: null, status: "", battery: null },
    { id: 5, active: false, connected: false, lastSeen: null, lastResponse: null, status: "", battery: null },
  ])

  const [pusherConnected, setPusherConnected] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [jugadores, setJugadores] = useState([])

  const testActiveSequentialRef = useRef(false)
  const currentActiveESPSequentialRef = useRef(null)
  const waitingForResponseSequentialRef = useRef(false)
  const processingResponseSequentialRef = useRef(false)
  const responseTimeoutSequentialRef = useRef(null)
  const currentRoundRef = useRef(0)
  const totalRoundsRef = useRef(1)

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

  const selectedESPsRef = useRef([])
  const estadisticasSequentialRef = useRef({ intentos: 0, aciertos: 0, errores: 0 })
  const estadisticasRandomRef = useRef({ intentos: 0, aciertos: 0, errores: 0 })
  const estadisticasManualRef = useRef({ intentos: 0, aciertos: 0, errores: 0 })

  const pusherChannelsRef = useRef({})
  const connectedESPsRef = useRef(new Set())

  const capsuleSelectionInitializedRef = useRef(false)

  useEffect(() => {
    testActiveSequentialRef.current = testActiveSequential
    currentActiveESPSequentialRef.current = currentActiveESPSequential
    waitingForResponseSequentialRef.current = waitingForResponseSequential
    currentRoundRef.current = currentRound
    totalRoundsRef.current = totalRounds
    testActiveRandomRef.current = testActiveRandom
    currentActiveESPRandomRef.current = currentActiveESPRandom
    waitingForResponseRandomRef.current = waitingForResponseRandom
    testActiveManualRef.current = testActiveManual
    currentActiveESPManualRef.current = currentActiveESPManual
    waitingForResponseManualRef.current = waitingForResponseManual
    selectedESPsRef.current = selectedESPs
  }, [
    testActiveSequential, currentActiveESPSequential, waitingForResponseSequential, currentRound, totalRounds,
    testActiveRandom, currentActiveESPRandom, waitingForResponseRandom,
    testActiveManual, currentActiveESPManual, waitingForResponseManual, selectedESPs,
  ])

  useEffect(() => {
    fetchJugadores()
    loadPusher()
  }, [])

  useEffect(() => {
    if (pusherConnected && !capsuleSelectionInitializedRef.current) {
      const connectedIds = microControllers.filter((mc) => mc.connected).map((mc) => mc.id).sort((a, b) => a - b)
      if (connectedIds.length > 0) {
        setSelectedESPs(connectedIds)
        capsuleSelectionInitializedRef.current = true
      }
    }
  }, [pusherConnected])

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval)
      if (timerGeneralInterval) clearInterval(timerGeneralInterval)
    }
  }, [timerInterval, timerGeneralInterval])

  const toggleESPSelection = (espId) => {
    const mc = microControllers.find((m) => m.id === espId)
    if (!mc?.connected) return
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
    setTimeout(() => setNotification(null), 4000)
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

  const sendHealthCheck = async (espId) => {
    try {
      await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: `ESP-${espId}`, command: "health" }),
      })
    } catch (e) { console.error("Health check error:", e) }
  }

  const checkAllCapsuleHealth = async () => {
    for (const espId of [1, 2, 3, 4, 5]) {
      await sendHealthCheck(espId)
    }
  }

  const subscribeToMicrocontrollerChannels = (pusher) => {
    for (let i = 1; i <= 5; i++) {
      const channelName = `private-device-ESP-${i}`
      const channel = pusher.subscribe(channelName)
      pusherChannelsRef.current[i] = channel

      channel.bind("client-response", (data) => {
        const espId = i
        const message = data.message?.toLowerCase() || ""

        if (message === "ok" || message === "health_ok" || message.includes("vivo")) {
          connectedESPsRef.current.add(espId)
          setMicroControllers((prev) => prev.map((mc) =>
            mc.id === espId ? { ...mc, connected: true, lastSeen: new Date(), status: "" } : mc
          ))
          return
        }

        setMicroControllers((prev) => prev.map((mc) =>
          mc.id === espId ? { ...mc, connected: true, lastSeen: new Date() } : mc
        ))

        const isAcierto = message.includes("acierto") || message.includes("success")
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

      // ── FIX PRINCIPAL: parsing correcto del evento de batería del ESP ──
      channel.bind("client-bateria_estado", (data) => {
        const espId = i

        // El ESP puede mandar data como string JSON o como objeto directo
        let payload = data
        if (typeof data.data === "string") {
          try { payload = JSON.parse(data.data) } catch { payload = data }
        } else if (data.data && typeof data.data === "object") {
          payload = data.data
        }

        // El ESP manda "estado" (no "nivel"), y voltaje como string "7.85"
        const nivel      = payload.estado     ?? payload.nivel     ?? null
        const porcentaje = payload.porcentaje  ?? null
        const voltaje    = payload.voltaje != null
                             ? parseFloat(payload.voltaje)  // viene como string del ESP
                             : null

        if (nivel) {
          setMicroControllers((prev) => prev.map((mc) =>
            mc.id === espId
              ? {
                  ...mc,
                  connected: true,       // si manda batería, está viva
                  lastSeen: new Date(),
                  battery: { nivel, porcentaje, voltaje },
                }
              : mc
          ))
          setBatteryLevels((prev) => ({ ...prev, [espId]: { nivel, porcentaje, voltaje } }))

          if (nivel === "critica" || nivel === "critico") {
            showNotification(
              "error",
              `🔋 Batería crítica en Cápsula ${espId}${voltaje != null ? ` (${voltaje.toFixed(2)}V)` : ""}`
            )
          }
        }
      })
    }

    setTimeout(() => checkAllCapsuleHealth(), 500)
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

  const getActiveESPs = () => selectedESPsRef.current

  const iniciarCronometroGeneral = () => {
    testStartTimeRef.current = Date.now()
    setTiempoTranscurrido(0)
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - testStartTimeRef.current) / 1000)
      setTiempoTranscurrido(elapsed)
    }, 1000)
    setTimerGeneralInterval(interval)
  }

  const detenerCronometroGeneral = () => {
    if (timerGeneralInterval) { clearInterval(timerGeneralInterval); setTimerGeneralInterval(null) }
    if (testStartTimeRef.current) {
      finalDurationRef.current = Math.floor((Date.now() - testStartTimeRef.current) / 1000)
      testStartTimeRef.current = null
    }
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

  const handleGuardar = async () => {
    if (!summaryData || isSaving) return
    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${BACKEND_URL}/api/reacciones/guardar-resumen`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(summaryData),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        showNotification("success", "Resultado guardado correctamente")
        setShowSummary(false)
      } else {
        const key = `prueba_${summaryData.tipo}_${Date.now()}`
        localStorage.setItem(key, JSON.stringify(summaryData))
        showNotification("success", "Guardado localmente")
        setShowSummary(false)
      }
    } catch (e) {
      const key = `prueba_${summaryData.tipo}_${Date.now()}`
      localStorage.setItem(key, JSON.stringify(summaryData))
      showNotification("success", "Guardado localmente")
      setShowSummary(false)
    } finally { setIsSaving(false) }
  }

  const abrirResumen = (tipo, stats, jugadorSnapshot, capsulasSnapshot) => {
    setSummaryData({
      tipo,
      jugador: jugadorSnapshot
        ? { id: jugadorSnapshot.id, nombres: jugadorSnapshot.nombres, apellidos: jugadorSnapshot.apellidos, posicion: jugadorSnapshot.posicion_principal, cuentaId: jugadorSnapshot.cuentaId }
        : null,
      tiempo_transcurrido: finalDurationRef.current,
      esp_seleccionadas: capsulasSnapshot,
      parametros: { tiempo_reaccion: tiempoReaccion, rondas: tipo === "secuencial" ? totalRounds : undefined, duracion: tipo !== "secuencial" ? tiempoPrueba : undefined },
      resultados: stats,
      timestamp: new Date().toISOString(),
    })
    setShowSummary(true)
  }

  // ── SECUENCIAL ─────────────────────────────────────────────────────────────
  const iniciarPruebaSecuencial = async () => {
    if (!selectedPlayer) { showNotification("error", "Selecciona un jugador"); return }
    const connectedSelected = selectedESPs.filter((id) => microControllers.find((mc) => mc.id === id)?.connected)
    if (connectedSelected.length === 0) { showNotification("error", "Ninguna cápsula seleccionada está conectada"); return }
    try {
      const res = await fetch(`${BACKEND_URL}/api/reacciones/iniciar`, {
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
        const firstSelected = selectedESPs[0]
        setTimeout(() => activateNextMicrocontrollerSequential(firstSelected), 1000)
      } else showNotification("error", data.message)
    } catch { showNotification("error", "Error iniciando prueba") }
  }

  const activateNextMicrocontrollerSequential = (espId) => {
    const allESPs = selectedESPsRef.current
    if (!allESPs.includes(espId)) {
      const fallback = allESPs[0]
      if (!fallback) { showNotification("error", "No hay cápsulas seleccionadas"); finalizarPruebaSecuencial(); return }
      activateNextMicrocontrollerSequential(fallback); return
    }
    if (responseTimeoutSequentialRef.current) { clearTimeout(responseTimeoutSequentialRef.current); responseTimeoutSequentialRef.current = null }
    setCurrentActiveESPSequential(espId); setWaitingForResponseSequential(true)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: mc.id === espId, status: mc.id === espId ? "Esperando respuesta" : mc.status })))
    sendCommandToESP(espId, { command: "ON" })
    responseTimeoutSequentialRef.current = setTimeout(() => {
      showNotification("error", `Cápsula ${espId} sin respuesta, contando como fallo`)
      if (processingResponseSequentialRef.current) return
      processingResponseSequentialRef.current = true
      handleSequentialResponse(espId, "error")
    }, (tiempoReaccion + 1) * 1000)
  }

  const handleSequentialResponse = (espId, responseType) => {
    if (!testActiveSequentialRef.current || !waitingForResponseSequentialRef.current || currentActiveESPSequentialRef.current !== espId) { processingResponseSequentialRef.current = false; return }
    if (responseTimeoutSequentialRef.current) { clearTimeout(responseTimeoutSequentialRef.current); responseTimeoutSequentialRef.current = null }
    setEstadisticasSequential((prev) => {
      const n = { intentos: prev.intentos + 1, aciertos: responseType === "acierto" ? prev.aciertos + 1 : prev.aciertos, errores: responseType === "error" ? prev.errores + 1 : prev.errores }
      estadisticasSequentialRef.current = n; return n
    })
    setWaitingForResponseSequential(false)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, lastResponse: mc.id === espId ? responseType : mc.lastResponse, status: mc.id === espId ? (responseType === "acierto" ? "Acierto" : "Error") : mc.status })))
    setTimeout(() => { setMicroControllers((prev) => prev.map((mc) => mc.id === espId ? { ...mc, lastResponse: null } : mc)) }, 1000)
    setTimeout(() => {
      const allESPs = selectedESPsRef.current
      const idx = allESPs.indexOf(espId)
      let nextESP = null
      for (let i = idx + 1; i < allESPs.length; i++) { nextESP = allESPs[i]; break }
      if (nextESP !== null) {
        setCurrentSequence(allESPs.indexOf(nextESP) + 1); activateNextMicrocontrollerSequential(nextESP)
      } else {
        const nextRound = currentRoundRef.current + 1
        if (nextRound <= totalRoundsRef.current) {
          setCurrentRound(nextRound); limpiarEntreRondasSequential()
          showNotification("success", `Iniciando ronda ${nextRound}`)
          const firstAvail = allESPs[0]
          if (!firstAvail) { setTimeout(() => finalizarPruebaSecuencial(), 500) }
          else { setTimeout(() => { setCurrentSequence(1); activateNextMicrocontrollerSequential(firstAvail) }, 2000) }
        } else {
          showNotification("success", "Rondas completadas"); setTimeout(() => finalizarPruebaSecuencial(), 1000)
        }
      }
      processingResponseSequentialRef.current = false
    }, 1500)
  }

  const finalizarPruebaSecuencial = async () => {
    detenerCronometroGeneral()
    const stats = { ...estadisticasSequentialRef.current }
    const jugadorSnap = selectedPlayer
    const capsulasSnap = [...selectedESPsRef.current]
    const pruebaId = localStorage.getItem("prueba_secuencial_id")
    if (pruebaId) {
      try {
        await fetch(`${BACKEND_URL}/api/reacciones/finalizar/${pruebaId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantidad_intentos: stats.intentos, cantidad_aciertos: stats.aciertos, cantidad_errores: stats.errores }),
        })
        localStorage.removeItem("prueba_secuencial_id")
      } catch (e) { console.error(e) }
    }
    limpiarPruebaSecuencial()
    abrirResumen("secuencial", stats, jugadorSnap, capsulasSnap)
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
    const connectedSelected = selectedESPs.filter((id) => microControllers.find((mc) => mc.id === id)?.connected)
    if (connectedSelected.length === 0) { showNotification("error", "Ninguna cápsula seleccionada está conectada"); return }
    try {
      const res = await fetch(`${BACKEND_URL}/api/reacciones/iniciar`, {
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
    const esps = getActiveESPs()
    if (esps.length === 0) { showNotification("error", "No hay cápsulas seleccionadas"); finalizarPruebaAleatoria(); return }
    const espId = esps[Math.floor(Math.random() * esps.length)]
    if (responseTimeoutRandomRef.current) { clearTimeout(responseTimeoutRandomRef.current); responseTimeoutRandomRef.current = null }
    setCurrentActiveESPRandom(espId); setWaitingForResponseRandom(true)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: mc.id === espId, status: mc.id === espId ? "Esperando respuesta" : mc.status })))
    sendCommandToESP(espId, { command: "ON" })
    responseTimeoutRandomRef.current = setTimeout(() => {
      showNotification("error", `Cápsula ${espId} sin respuesta, contando como fallo`)
      if (processingResponseRandomRef.current) return
      processingResponseRandomRef.current = true
      handleRandomResponse(espId, "error")
    }, (tiempoReaccion + 1) * 1000)
  }

  const handleRandomResponse = (espId, responseType) => {
    if (!testActiveRandomRef.current || !waitingForResponseRandomRef.current || currentActiveESPRandomRef.current !== espId) { processingResponseRandomRef.current = false; return }
    if (responseTimeoutRandomRef.current) { clearTimeout(responseTimeoutRandomRef.current); responseTimeoutRandomRef.current = null }
    setEstadisticasRandom((prev) => {
      const n = { intentos: prev.intentos + 1, aciertos: responseType === "acierto" ? prev.aciertos + 1 : prev.aciertos, errores: responseType === "error" ? prev.errores + 1 : prev.errores }
      estadisticasRandomRef.current = n; return n
    })
    setWaitingForResponseRandom(false)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, lastResponse: mc.id === espId ? responseType : mc.lastResponse, status: mc.id === espId ? (responseType === "acierto" ? "Acierto" : "Error") : mc.status })))
    setTimeout(() => { setMicroControllers((prev) => prev.map((mc) => mc.id === espId ? { ...mc, lastResponse: null } : mc)) }, 1000)
    setTimeout(() => { if (testActiveRandomRef.current) activateRandomMicrocontroller(); processingResponseRandomRef.current = false }, 1000)
  }

  const finalizarPruebaAleatoria = async () => {
    detenerCronometroGeneral()
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    const stats = { ...estadisticasRandomRef.current }
    const jugadorSnap = selectedPlayer
    const capsulasSnap = [...selectedESPsRef.current]
    const pruebaId = localStorage.getItem("prueba_aleatoria_id")
    if (pruebaId) {
      try {
        await fetch(`${BACKEND_URL}/api/reacciones/finalizar/${pruebaId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantidad_intentos: stats.intentos, cantidad_aciertos: stats.aciertos, cantidad_errores: stats.errores }),
        })
        localStorage.removeItem("prueba_aleatoria_id")
      } catch (e) { console.error(e) }
    }
    limpiarPruebaAleatoria()
    abrirResumen("aleatorio", stats, jugadorSnap, capsulasSnap)
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
    const connectedSelected = selectedESPs.filter((id) => microControllers.find((mc) => mc.id === id)?.connected)
    if (connectedSelected.length === 0) { showNotification("error", "Ninguna cápsula seleccionada está conectada"); return }
    try {
      const res = await fetch(`${BACKEND_URL}/api/reacciones/iniciar`, {
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
    const allESPs = getActiveESPs()
    if (!allESPs.includes(espId) || !testActiveManualRef.current || waitingForResponseManualRef.current) return
    if (responseTimeoutManualRef.current) { clearTimeout(responseTimeoutManualRef.current); responseTimeoutManualRef.current = null }
    setCurrentActiveESPManual(espId); setWaitingForResponseManual(true)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: mc.id === espId, status: mc.id === espId ? "Esperando respuesta" : mc.status })))
    sendCommandToESP(espId, { command: "ON" })
    responseTimeoutManualRef.current = setTimeout(() => {
      showNotification("error", `Cápsula ${espId} sin respuesta, contando como fallo`)
      if (processingResponseManualRef.current) return
      processingResponseManualRef.current = true
      handleManualResponse(espId, "error")
    }, (tiempoReaccion + 1) * 1000)
  }

  const handleManualResponse = (espId, responseType) => {
    if (!testActiveManualRef.current || !waitingForResponseManualRef.current || currentActiveESPManualRef.current !== espId) { processingResponseManualRef.current = false; return }
    if (responseTimeoutManualRef.current) { clearTimeout(responseTimeoutManualRef.current); responseTimeoutManualRef.current = null }
    setEstadisticasManual((prev) => {
      const n = { intentos: prev.intentos + 1, aciertos: responseType === "acierto" ? prev.aciertos + 1 : prev.aciertos, errores: responseType === "error" ? prev.errores + 1 : prev.errores }
      estadisticasManualRef.current = n; return n
    })
    setWaitingForResponseManual(false); setCurrentActiveESPManual(null)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, lastResponse: mc.id === espId ? responseType : mc.lastResponse, status: mc.id === espId ? (responseType === "acierto" ? "Acierto" : "Error") : mc.status })))
    setTimeout(() => { setMicroControllers((prev) => prev.map((mc) => mc.id === espId ? { ...mc, lastResponse: null } : mc)) }, 1000)
    processingResponseManualRef.current = false
  }

  const finalizarPruebaManual = async () => {
    detenerCronometroGeneral()
    if (timerInterval) { clearInterval(timerInterval); setTimerInterval(null) }
    const stats = { ...estadisticasManualRef.current }
    const jugadorSnap = selectedPlayer
    const capsulasSnap = [...selectedESPsRef.current]
    const pruebaId = localStorage.getItem("prueba_manual_id")
    if (pruebaId) {
      try {
        await fetch(`${BACKEND_URL}/api/reacciones/finalizar/${pruebaId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantidad_intentos: stats.intentos, cantidad_aciertos: stats.aciertos, cantidad_errores: stats.errores }),
        })
        localStorage.removeItem("prueba_manual_id")
      } catch (e) { console.error(e) }
    }
    limpiarPruebaManual()
    abrirResumen("manual", stats, jugadorSnap, capsulasSnap)
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

  const capsulasToShow = testActive
    ? microControllers.filter((mc) => selectedESPs.includes(mc.id))
    : microControllers

  const gridCols = capsulasToShow.length <= 3
    ? `repeat(${capsulasToShow.length}, 1fr)`
    : capsulasToShow.length === 4 ? "repeat(4, 1fr)" : "repeat(5, 1fr)"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .pruebas-root { min-height: 100vh; background: #F4F4F4; padding: 32px 16px; font-family: 'DM Sans', sans-serif; }
        .pruebas-inner { max-width: 1100px; margin: 0 auto; }
        @media (max-width: 860px) {
          .pruebas-root { padding: 20px 12px; }
          .top-row { flex-direction: column !important; }
          .config-panel { flex-direction: column !important; gap: 16px !important; }
          .config-left { width: 100% !important; }
          .config-right-col { width: 100% !important; min-width: unset !important; }
          .v-divider { display: none !important; }
          .results-grid { grid-template-columns: 1fr 1fr 1fr !important; }
        }
        @media (max-width: 540px) {
          .pruebas-root { padding: 14px 10px; }
          .player-panel { flex-direction: column !important; align-items: flex-start !important; }
          .player-right { width: 100% !important; }
          .results-grid { grid-template-columns: 1fr !important; }
          .tipo-tabs { flex-wrap: wrap !important; }
          .capsulas-selector { flex-wrap: wrap !important; }
          .progress-info { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
          .stat-num { font-size: 32px !important; }
        }
        .micro-card { background: #fff; border: 1.5px solid #E8E8E8; border-radius: 8px; overflow: hidden; transition: all 0.2s ease; cursor: default; }
        .micro-card.active { border-color: #334155; box-shadow: 0 0 0 3px rgba(51,65,85,0.14); }
        .micro-card.hit { border-color: #1A7A5E; }
        .micro-card.missed { border-color: #B03030; }
        .micro-card.clickable { cursor: pointer; }
        .micro-card.clickable:hover { border-color: #334155; box-shadow: 0 4px 14px rgba(51,65,85,0.18); transform: translateY(-1px); }
        @keyframes pulse-guindo {
          0%, 100% { box-shadow: 0 0 0 0 rgba(51,65,85,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(51,65,85,0); }
        }
        .dot-active { animation: pulse-guindo 1.2s ease infinite; }
        .seg-tab { padding: 6px 18px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; border: none; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; background: #fff; color: #6B6B6B; }
        .seg-tab.active-tab { background: #334155; color: #fff; }
        .seg-tab:disabled { cursor: not-allowed; opacity: 0.5; }
        .seg-tab:not(:last-child) { border-right: 1.5px solid #E8E8E8; }
        .stat-num { font-family: 'DM Mono', monospace; font-size: 42px; font-weight: 500; line-height: 1; }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #334155 0%, #475569 50%, #334155 100%); background-size: 200% auto; animation: shimmer 2s linear infinite; transition: width 1s ease; }
        .field-input:focus { border-color: #334155 !important; outline: none; box-shadow: 0 0 0 2px rgba(51,65,85,0.12); }
        .player-select { appearance: none; -webkit-appearance: none; }
        .v-divider { width: 1px; background: #E8E8E8; align-self: stretch; margin: 0 24px; }
        .modal-backdrop { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 16px; background: rgba(20,10,12,0.45); backdrop-filter: blur(4px); }
        .notif-toast { position: fixed; top: 28px; right: 28px; z-index: 200; display: flex; align-items: center; gap: 14px; background: #fff; border-radius: 14px; padding: 16px 22px; box-shadow: 0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10); min-width: 280px; max-width: 420px; animation: slideInRight 0.25s ease; }
        @keyframes slideInRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .notif-icon { flex-shrink: 0; }
        .notif-text { font-size: 15px; font-weight: 600; color: #1f2937; flex: 1; line-height: 1.35; }
        .notif-close { flex-shrink: 0; background: none; border: none; cursor: pointer; padding: 2px; display: flex; align-items: center; }
      `}</style>

      <div className="pruebas-root">
      <div className="pruebas-inner">

        {notification && (
          <div className="notif-toast" style={{ borderLeft: `5px solid ${notification.type === "success" ? C.emerald : C.red}` }}>
            <span className="notif-icon">
              {notification.type === "success" ? <CheckCircle size={22} color={C.emerald} /> : <AlertCircle size={22} color={C.red} />}
            </span>
            <span className="notif-text">{notification.message}</span>
            <button className="notif-close" onClick={() => setNotification(null)}><X size={16} color={C.grayMed} /></button>
          </div>
        )}

        <div className="top-row" style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "stretch" }}>

          {/* Player panel */}
          <div className="player-panel" style={{
            background: C.white, border: `1.5px solid ${C.grayLight}`, borderRadius: 10,
            padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8,
            flexShrink: 0, minWidth: 340,
          }}>
            <div style={{ position: "relative" }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.grayMed, display: "block", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
                Jugador
              </span>
              <select
                value={selectedPlayer?.id || ""}
                onChange={(e) => { const p = jugadores.find((j) => j.id === parseInt(e.target.value)); setSelectedPlayer(p || null) }}
                disabled={testActiveRandom || testActiveManual}
                className="player-select field-input"
                style={{
                  border: `1.5px solid ${C.grayLight}`, borderRadius: 6,
                  padding: "5px 26px 5px 9px", fontSize: 11, color: C.grayDark,
                  background: C.white, cursor: (testActiveRandom || testActiveManual) ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif", opacity: (testActiveRandom || testActiveManual) ? 0.5 : 1, width: "100%",
                }}>
                <option value="">Seleccionar…</option>
                {jugadores.map((j) => (
                  <option key={j.id} value={j.id}>{j.nombres} {j.apellidos}</option>
                ))}
              </select>
              <ChevronDown size={11} color={C.grayMed} style={{ position: "absolute", right: 7, bottom: 7, pointerEvents: "none" }} />
            </div>
            <div style={{ height: 1, background: C.grayLight }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                border: `2px solid ${selectedPlayer ? C.guindo : C.grayLight}`,
                background: C.grayUltra, display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", flexShrink: 0, transition: "border-color 0.2s",
              }}>
                {selectedPlayer ? (
                  <img src={getPositionIcon(selectedPlayer.posicion_principal) || "/oso.png"} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.currentTarget.src = "/oso.png" }} />
                ) : <User size={15} color={C.grayMed} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.grayDark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selectedPlayer ? `${selectedPlayer.nombres} ${selectedPlayer.apellidos}` : "—"}
                </p>
                <p style={{ margin: "1px 0 0", fontSize: 10, color: C.guindo, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {selectedPlayer ? getPositionName(selectedPlayer.posicion_principal) : "Sin selección"}
                </p>
              </div>
            </div>
          </div>

          {/* Config panel */}
          <div style={{
            background: C.white, border: `1.5px solid ${C.grayLight}`, borderRadius: 10,
            padding: "20px 24px", flex: 1, display: "flex", alignItems: "center", gap: 0,
          }} className="config-panel">
            <div style={{ flex: 1 }} className="config-left">
              <div style={{ marginBottom: 18 }}>
                <span style={styles.label}>Tipo de prueba</span>
                <div className="tipo-tabs" style={{ display: "inline-flex", border: `1.5px solid ${C.grayLight}`, borderRadius: 6, overflow: "hidden" }}>
                  {["Secuencial", "Aleatorio", "Manual"].map((label) => {
                    const key = label.toLowerCase()
                    return (
                      <button key={key} onClick={() => !testActive && setModoActual(key)} disabled={testActive}
                        className={`seg-tab ${modoActual === key ? "active-tab" : ""}`}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <span style={styles.label}>Cápsulas activas</span>
                <div className="capsulas-selector" style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map((num) => {
                    const selected = selectedESPs.includes(num)
                    const mc = microControllers.find((m) => m.id === num)
                    const isConnected = mc?.connected
                    const isDisabledByConnection = !testActive && !isConnected

                    return (
                      <div key={num} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <button
                          onClick={() => { if (testActive || isDisabledByConnection) return; toggleESPSelection(num) }}
                          disabled={testActive || isDisabledByConnection}
                          title={isDisabledByConnection ? "Sin conexión" : `Cápsula ${num}`}
                          style={{
                            width: 40, height: 40, borderRadius: "50%",
                            border: `2px solid ${isDisabledByConnection ? C.grayLight : selected ? C.slate : C.grayLight}`,
                            background: isDisabledByConnection ? C.grayUltra : selected ? C.slate : C.white,
                            cursor: (testActive || isDisabledByConnection) ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s", fontSize: 13, fontWeight: 700,
                            color: isDisabledByConnection ? C.grayLight : selected ? C.white : C.grayMed,
                            fontFamily: "'DM Mono', monospace", opacity: isDisabledByConnection ? 0.45 : 1,
                            position: "relative",
                          }}>
                          {num}
                          {!testActive && (
                            <span style={{
                              position: "absolute", bottom: -2, right: -2,
                              width: 8, height: 8, borderRadius: "50%",
                              background: isConnected ? C.emerald : C.grayLight,
                              border: `1.5px solid ${C.white}`,
                            }} />
                          )}
                        </button>

                        {isConnected && (
                          <BatteryIcon
                            nivel={mc?.battery?.nivel ?? null}
                            porcentaje={mc?.battery?.porcentaje ?? null}
                            voltaje={mc?.battery?.voltaje ?? null}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="v-divider" />

            <div className="config-right-col" style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 220, width: 220 }}>
              <div>
                <span style={styles.label}>{modoActual === "secuencial" ? "Número de rondas" : "Duración (seg)"}</span>
                <input type="number"
                  value={modoActual === "secuencial" ? totalRounds : tiempoPrueba}
                  onChange={(e) => { const v = parseInt(e.target.value) || 1; if (modoActual === "secuencial") setTotalRounds(v); else setTiempoPrueba(v) }}
                  disabled={testActive} min="1" className="field-input"
                  style={{ ...styles.input, opacity: testActive ? 0.5 : 1 }} />
              </div>
              <div>
                <span style={styles.label}>Tiempo encendido (seg)</span>
                <input type="number" step="0.1" min="0.1" max="5"
                  value={tiempoReaccion}
                  onChange={(e) => { let v = parseFloat(e.target.value); if (isNaN(v)) v = 0.1; v = Math.min(5, Math.max(0.1, v)); setTiempoReaccion(v) }}
                  disabled={testActive} className="field-input"
                  style={{ ...styles.input, opacity: testActive ? 0.5 : 1 }} />
              </div>
              {!testActive ? (
                <button onClick={onIniciar} style={{
                  marginTop: 4, padding: "10px 0",
                  background: C.guindo, color: C.white, border: "none", borderRadius: 6,
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "background 0.15s", width: "100%",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = C.guindoDark}
                  onMouseLeave={e => e.currentTarget.style.background = C.guindo}>
                  Iniciar prueba
                </button>
              ) : (
                <button onClick={onFinalizar} style={{
                  marginTop: 4, padding: "10px 0",
                  background: "transparent", color: C.red, border: `2px solid ${C.red}`, borderRadius: 6,
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", width: "100%",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.red; e.currentTarget.style.color = C.white }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.red }}>
                  Finalizar prueba
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── CÁPSULAS ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 16, background: C.slate, borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.grayMed, fontFamily: "'DM Sans', sans-serif" }}>
              Estado de cápsulas
            </span>
            {testActive && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.slate }} className="dot-active" />
                <span style={{ fontSize: 11, color: C.slate, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>EN CURSO</span>
              </div>
            )}
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: gridCols, gap: 12,
            maxWidth: capsulasToShow.length <= 3 ? `${capsulasToShow.length * 220}px` : "100%",
          }}>
            {capsulasToShow.map((mc) => {
              const isSelected = selectedESPs.includes(mc.id)
              const isActive = mc.active
              const wasHit = mc.lastResponse === "acierto"
              const wasMissed = mc.lastResponse === "error"
              const isClickable = testActiveManual && mc.connected && !waitingForResponseManual && isSelected

              let cardClass = "micro-card"
              if (isActive) cardClass += " active"
              else if (wasHit) cardClass += " hit"
              else if (wasMissed) cardClass += " missed"
              if (isClickable) cardClass += " clickable"

              let dotColor = C.grayLight
              if (!testActive) dotColor = mc.connected ? C.emerald : C.grayLight
              else dotColor = isActive ? C.slate : wasHit ? C.emerald : wasMissed ? C.red : C.grayLight

              return (
                <div key={mc.id} className={cardClass}
                  onClick={() => { if (isClickable) activateManualMicrocontroller(mc.id) }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 6px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.grayDark, fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>
                        CAP-{mc.id}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, transition: "background 0.3s" }}
                        className={isActive ? "dot-active" : ""} />
                      {mc.status && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                          color: isActive ? C.slate : wasHit ? C.emerald : wasMissed ? C.red : C.grayMed,
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {mc.status === "Esperando respuesta" ? "ACTIVO" : mc.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    margin: "0 8px 8px",
                    background: isActive ? "#EFF3F7" : wasHit ? "#eaf5f1" : wasMissed ? "#faeaea" : C.grayUltra,
                    borderRadius: 6, aspectRatio: "1/1",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.3s", overflow: "hidden",
                  }}>
                    <img src={getMicroImage(mc)} alt={`Cápsula ${mc.id}`}
                      style={{ width: "88%", height: "88%", objectFit: "contain" }}
                      onError={(e) => { e.currentTarget.style.display = "none" }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Progreso */}
        <div style={{ background: C.white, border: `1.5px solid ${C.grayLight}`, borderRadius: 10, padding: "16px 24px", marginBottom: 20 }}>
          <div className="progress-info" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={14} color={C.slate} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.grayMed, fontFamily: "'DM Sans', sans-serif" }}>Progreso</span>
            </div>
            {testActive && (
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: C.grayMed, fontFamily: "'DM Sans', sans-serif" }}>Transcurrido</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: C.grayDark }}>{formatTime(tiempoTranscurrido)}</span>
                </div>
                {modoActual !== "secuencial" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.grayMed, fontFamily: "'DM Sans', sans-serif" }}>Restante</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: C.slate }}>{formatTime(tiempoRestante)}</span>
                  </div>
                )}
                {modoActual === "secuencial" && totalRounds > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.grayMed, fontFamily: "'DM Sans', sans-serif" }}>Ronda</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: C.slate }}>{currentRound}/{totalRounds}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ height: 6, background: C.grayLight, borderRadius: 4, overflow: "hidden" }}>
            <div className={testActive ? "progress-fill" : ""}
              style={{ width: testActive ? `${progressPct}%` : "0%", height: "100%", borderRadius: 4, background: testActive ? undefined : C.grayLight }} />
          </div>
        </div>

        {/* Resultados */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <div style={{ background: C.white, border: `1.5px solid ${C.grayLight}`, borderRadius: 10, overflow: "hidden", width: "100%", maxWidth: 620 }}>
            <div style={{ background: C.slate, padding: "10px 24px", display: "flex", alignItems: "center", gap: 8 }}>
              <Target size={14} color="rgba(255,255,255,0.8)" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.white, fontFamily: "'DM Sans', sans-serif" }}>Resultados</span>
            </div>
            <div style={{ padding: "24px 32px" }}>
              <div className="results-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
                <div style={{ textAlign: "center", padding: "0 24px", borderRight: `1px solid ${C.grayLight}` }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.emerald }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.emerald, fontFamily: "'DM Sans', sans-serif" }}>Aciertos</span>
                  </div>
                  <p className="stat-num" style={{ color: C.emerald, margin: 0 }}>{estadisticas.aciertos}</p>
                  {totalAttempts > 0 && <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 600, color: C.emerald, fontFamily: "'DM Mono', monospace" }}>{accuracy}%</p>}
                </div>
                <div style={{ textAlign: "center", padding: "0 24px", borderRight: `1px solid ${C.grayLight}` }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.red }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.red, fontFamily: "'DM Sans', sans-serif" }}>Fallos</span>
                  </div>
                  <p className="stat-num" style={{ color: C.red, margin: 0 }}>{estadisticas.errores}</p>
                  {totalAttempts > 0 && <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 600, color: C.red, fontFamily: "'DM Mono', monospace" }}>{100 - accuracy}%</p>}
                </div>
                <div style={{ textAlign: "center", padding: "0 24px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.blue, fontFamily: "'DM Sans', sans-serif" }}>Intentos</span>
                  </div>
                  <p className="stat-num" style={{ color: C.blue, margin: 0 }}>{estadisticas.intentos}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: C.grayMed, fontFamily: "'DM Sans', sans-serif" }}>total</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal resumen */}
        {showSummary && summaryData && (
          <div className="modal-backdrop" onClick={() => setShowSummary(false)}>
            <div onClick={e => e.stopPropagation()} style={{
              width: "100%", maxWidth: 560, background: C.white, borderRadius: 14,
              boxShadow: "0 32px 80px rgba(0,0,0,0.2)", overflow: "hidden", fontFamily: "'DM Sans', sans-serif",
            }}>
              <div style={{ background: C.guindo, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Award size={18} color={C.white} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.white }}>Prueba Finalizada</h3>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.65)", textTransform: "capitalize", marginTop: 1 }}>{summaryData.tipo}</p>
                  </div>
                </div>
                <button onClick={() => setShowSummary(false)} style={{
                  background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6,
                  width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <X size={14} color={C.white} />
                </button>
              </div>
              <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Aciertos", value: summaryData.resultados?.aciertos || 0, color: C.emerald, bg: C.emeraldBg, pct: summaryData.resultados?.intentos > 0 ? Math.round((summaryData.resultados.aciertos / summaryData.resultados.intentos) * 100) + "%" : null },
                    { label: "Errores",  value: summaryData.resultados?.errores  || 0, color: C.red,     bg: C.redBg,     pct: summaryData.resultados?.intentos > 0 ? (100 - Math.round((summaryData.resultados.aciertos / summaryData.resultados.intentos) * 100)) + "%" : null },
                    { label: "Intentos", value: summaryData.resultados?.intentos || 0, color: C.blue,    bg: C.blueBg,    pct: "total" },
                  ].map(({ label, value, color, bg, pct }) => (
                    <div key={label} style={{ background: bg, borderRadius: 8, padding: "14px 10px", textAlign: "center" }}>
                      <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color }}>{label}</p>
                      <p style={{ margin: 0, fontFamily: "'DM Mono', monospace", fontSize: 36, fontWeight: 500, color }}>{value}</p>
                      {pct && <p style={{ margin: "4px 0 0", fontSize: 11, color, fontWeight: 600 }}>{pct}</p>}
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Jugador", value: summaryData.jugador ? `${summaryData.jugador.nombres} ${summaryData.jugador.apellidos}` : "—", sub: summaryData.jugador?.posicion ? getPositionName(summaryData.jugador.posicion) : null },
                    { label: "Duración", value: formatTime(summaryData.tiempo_transcurrido || 0), sub: "tiempo total" },
                    { label: "Modalidad", value: summaryData.tipo, sub: null },
                    { label: "Cápsulas", value: summaryData.esp_seleccionadas?.join(", ") || "Todas", sub: null },
                  ].map(({ label, value, sub }) => (
                    <div key={label} style={{ background: C.grayUltra, borderRadius: 8, padding: "12px 14px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.grayMed }}>{label}</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.grayDark, textTransform: "capitalize" }}>{value}</p>
                      {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: C.grayMed }}>{sub}</p>}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, paddingTop: 4, borderTop: `1px solid ${C.grayLight}` }}>
                  <button onClick={handleGuardar} disabled={isSaving} style={{
                    flex: 1, padding: "10px 0",
                    background: isSaving ? C.grayUltra : C.slate,
                    border: `1px solid ${isSaving ? C.grayLight : C.slate}`,
                    borderRadius: 6, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                    color: isSaving ? C.grayMed : C.white, cursor: isSaving ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { if (!isSaving) { e.currentTarget.style.background = C.slateDark; e.currentTarget.style.borderColor = C.slateDark } }}
                    onMouseLeave={e => { if (!isSaving) { e.currentTarget.style.background = C.slate; e.currentTarget.style.borderColor = C.slate } }}>
                    <Save size={13} />
                    {isSaving ? "Guardando…" : "Guardar"}
                  </button>
                  <button onClick={() => setShowSummary(false)} style={{
                    flex: 1, padding: "10px 0", background: C.guindo, border: "none",
                    borderRadius: 6, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                    color: C.white, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = C.guindoDark}
                    onMouseLeave={e => e.currentTarget.style.background = C.guindo}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      </div>
    </>
  )
}
