"use client"

import { useState, useEffect } from "react"
import { ChevronDown, User, CheckCircle, X, Wrench, Play, Dumbbell, Zap } from "lucide-react"
import { ImageSequence } from "../../components/image-sequence"
import { MetricCard } from "../../components/metric-card"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"
import { ChartContainer, ChartTooltipContent } from "../../components/ui/chart"
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"
const DEVICE_ID = "ESP-6"

const SALTO_CAJON_IMAGES = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cajon-removebg-preview-yhz7cS5MN1rF4lIBBeSvhMBAI1uiHS.png",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cajon2-removebg-preview-removebg-preview-zWP78jtMRIfQFlkKJLd5rwJBRDLEn6.png",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cajon3-removebg-preview-6xFOXZWLABaQWaKYlHKhEc6TCEbjv2.png",
]
const SALTO_VALLA_IMAGES = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/valla-removebg-preview-JNsJ12DKXyqbkKntBNTWB6bG4bmXAB.png",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/valla2-removebg-preview-QKaw1YxgYCcFlv6osQkEE9gaR4XL8g.png",
]
const SALTO_SIMPLE_IMAGES = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/conos-removebg-preview__2_-removebg-preview-ZdpOb2qgOJERfCssbovE9QRaOX5m1U.png",
]

// ─── helpers ────────────────────────────────────────────────────────────────

function addMessage(device, message, status, setMessages) {
  const timestamp = new Date().toLocaleTimeString()
  setMessages((prev) => [...prev, { device, message, status, timestamp }])
}

async function sendCommand(command, setMessages) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: DEVICE_ID, command, channel: `private-device-${DEVICE_ID}` }),
    })
    const data = await response.json()
    if (data.success || response.ok) addMessage("SISTEMA", `Comando enviado: ${command}`, "success", setMessages)
    else addMessage("SISTEMA", `Error: ${data.message || "desconocido"}`, "error", setMessages)
  } catch {
    addMessage("SISTEMA", "Error al enviar comando", "error", setMessages)
  }
}

async function cargarCuentas(setCuentas, setJugadoresDisponibles) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/cuentas`)
    const data = await response.json()
    if (data.success) {
      setCuentas(data.data)
      setJugadoresDisponibles(data.data.filter((c) => c.rol === "jugador"))
    }
  } catch (e) { console.error(e) }
}

function loadPusher(subscribeToESP) {
  if (typeof window === "undefined") return
  if (!window.Pusher) {
    const script = document.createElement("script")
    script.src = "https://js.pusher.com/8.2.0/pusher.min.js"
    script.async = true
    script.onload = () => initializePusher(subscribeToESP)
    document.body.appendChild(script)
  } else {
    initializePusher(subscribeToESP)
  }
}

function initializePusher(subscribeToESP) {
  const pusher = new window.Pusher("4f85ef5c792df94cebc9", {
    cluster: "us2",
    encrypted: true,
    authEndpoint: `${BACKEND_URL}/api/pusher/pusher/auth`,
    forceTLS: true,
  })
  subscribeToESP(pusher)
}

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null
  const birthDate = new Date(fechaNacimiento)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Notification({ notification, onClose }) {
  if (!notification) return null
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border bg-white
      animate-in slide-in-from-top-2 duration-200"
      style={{ borderColor: notification.type === "success" ? "#a7f3d0" : "#fecaca",
               color: notification.type === "success" ? "#065f46" : "#991b1b" }}>
      {notification.type === "success"
        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
        : <X className="w-4 h-4 text-red-500" />}
      {notification.message}
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
    </div>
  )
}

function ResultModal({ isOpen, onClose, title, data }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-400 mb-0.5 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
              <p className="text-base font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition-colors">
          Cerrar y Limpiar
        </button>
      </div>
    </div>
  )
}

function CalibrationModal({ isOpen, onClose, isCalibrated }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-8 text-center relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        {!isCalibrated ? (
          <>
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/calibrar-removebg-preview-1y4aBupjFQ9WApv9Ru1gxKoxsOdMqW.png"
                alt="Calibrando" className="w-14 h-14 object-contain animate-spin" style={{ animationDuration: "2s" }} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Calibrando...</h3>
            <p className="text-sm text-slate-500">Por favor espere mientras se calibran los sensores</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-800 mb-1">Calibrado correctamente</h3>
            <p className="text-sm text-slate-500">Los sensores han sido calibrados exitosamente</p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── main ────────────────────────────────────────────────────────────────────

export default function SistemaUnificadoPage() {
  const [cuentas, setCuentas] = useState([])
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState("")
  const [espConnected, setEspConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [activeTab, setActiveTab] = useState("alcance")

  // ── ALCANCE state ──
  const [alturaRegistrada, setAlturaRegistrada] = useState("")
  const [incrementoAnterior, setIncrementoAnterior] = useState("")
  const [faseAlcance, setFaseAlcance] = useState("idle") // idle|calibrating|calibrated|jumping|done
  const [alcanceId, setAlcanceId] = useState(null)
  const [modalAlcanceOpen, setModalAlcanceOpen] = useState(false)
  const [alcanceGuardado, setAlcanceGuardado] = useState(null)
  const [calibrationModalOpen, setCalibrationModalOpen] = useState(false)
  const [isCalibrated, setIsCalibrated] = useState(false)
  // raw data para guardar
  const [jumpRaw, setJumpRaw] = useState(null)

  // ── PLIOMETRÍA state ──
  const [masaJugador, setMasaJugador] = useState("")
  const [tiempoPliometria, setTiempoPliometria] = useState("")
  const [tipoSalto, setTipoSalto] = useState("salto cajon")
  const [pliometriaId, setPliometriaId] = useState(null)
  const [pliometriaIniciada, setPliometriaIniciada] = useState(false)
  const [ejercicioEnCurso, setEjercicioEnCurso] = useState(false)
  const [datosEjercicio, setDatosEjercicio] = useState({ F1: 0, F2: 0, Ftotal: 0, acelZ: 0, pitch: 0, potencia: 0 })
  const [chartData, setChartData] = useState([])
  const [dataPointCounter, setDataPointCounter] = useState(0)
  const [modalPliometriaOpen, setModalPliometriaOpen] = useState(false)
  const [pliometriaGuardada, setPliometriaGuardada] = useState(null)

  useEffect(() => {
    cargarCuentas(setCuentas, setJugadoresDisponibles)
    loadPusher(subscribeToESP)
  }, [])

  const jugadorSeleccionado = cuentas.find((c) => c.id === Number(cuentaSeleccionada))

  const notify = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── pusher ───────────────────────────────────────────────────────────────────
  const subscribeToESP = (pusher) => {
    const channel = pusher.subscribe(`private-device-${DEVICE_ID}`)

    channel.bind("pusher:subscription_succeeded", () => {
      setEspConnected(true)
      addMessage(DEVICE_ID, "Conectado", "success", setMessages)
      notify("success", "ESP conectado")
    })

    channel.bind("client-response", (data) => {
      const msg = (data.message || "").toLowerCase()
      setLoading(false)
      addMessage(DEVICE_ID, data.message || "", "success", setMessages)

      // calibración confirmada (alcance)
      if (msg.includes("calibra")) {
        setFaseAlcance("calibrated")
        setIsCalibrated(true)
        setTimeout(() => {
          setCalibrationModalOpen(false)
          setIsCalibrated(false)
        }, 2000)
        notify("success", "Calibración lista — presiona Iniciar")
      }
    })

    channel.bind("client-jump-results", (data) => {
      if (data.tiempoVuelo !== undefined) {}
      if (data.altura !== undefined) setAlturaRegistrada(String(data.altura))
      setJumpRaw(data)
      setFaseAlcance("done")
      notify("success", "Salto registrado — revisa los resultados")
      addMessage(DEVICE_ID, "Salto completado", "success", setMessages)
    })

    channel.bind("client-exercise-data", (data) => {
      setDatosEjercicio((prev) => ({
        F1: Math.max(prev.F1, data.F1 || 0),
        F2: Math.max(prev.F2, data.F2 || 0),
        Ftotal: Math.max(prev.Ftotal, data.Ftotal || 0),
        acelZ: Math.max(prev.acelZ, data.acelZ || 0),
        pitch: Math.max(prev.pitch, data.pitch || 0),
        potencia: Math.max(prev.potencia, data.potencia || 0),
      }))
      setDataPointCounter((prev) => {
        const n = prev + 1
        setChartData((d) => [...d, { point: n, acelZ: data.acelZ || 0, potencia: data.potencia || 0 }].slice(-100))
        return n
      })
    })

    channel.bind("client-exercise-complete", () => {
      setEjercicioEnCurso(false)
      addMessage(DEVICE_ID, "Ejercicio completado", "success", setMessages)
      notify("success", "Ejercicio completado")
    })

    channel.bind("client-status", (data) => {
      if (data?.status === "connected") setEspConnected(true)
    })
  }

  // ── ALCANCE acciones ─────────────────────────────────────────────────────────

  const handleCalibrar = async () => {
    if (!jugadorSeleccionado) { notify("error", "Selecciona un jugador primero"); return }
    if (!espConnected) { notify("error", "Sin conexión con el dispositivo"); return }

    setFaseAlcance("calibrating")
    setAlturaRegistrada("")
    setIncrementoAnterior("")
    setJumpRaw(null)
    setCalibrationModalOpen(true)
    setIsCalibrated(false)

    // Iniciar alcance en BD
    try {
      const res = await fetch(`${BACKEND_URL}/api/alcances/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: Number(cuentaSeleccionada) }),
      })
      const d = await res.json()
      if (d.success) { setAlcanceId(d.data.id); addMessage("SISTEMA", `Alcance iniciado ID: ${d.data.id}`, "success", setMessages) }
    } catch (e) { console.error(e) }

    // Comandos: modo salto + datos estáticos + calibrar
    const alcanceEstatico = jugadorSeleccionado?.jugador?.alcance_estatico ?? 0
    await sendCommand("A", setMessages)
    setTimeout(async () => {
      await sendCommand(`D:${alcanceEstatico}`, setMessages)
      await sendCommand("C", setMessages)
    }, 300)
  }

  const handleIniciarSalto = async () => {
    if (faseAlcance !== "calibrated") { notify("error", "Calibra primero el sensor"); return }
    setFaseAlcance("jumping")
    await sendCommand("S", setMessages)
  }

  const handleGuardarAlcance = async () => {
    if (!jumpRaw || !alcanceId) return
    try {
      const res = await fetch(`${BACKEND_URL}/api/alcances/finalizar/${alcanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiempodevuelo: Number(jumpRaw.tiempoVuelo) || 0,
          potencia: Number(jumpRaw.potencia) || 0,
          velocidad: Number(jumpRaw.velocidad) || 0,
          alcance: Number(jumpRaw.altura) || 0,
        }),
      })
      const d = await res.json()
      if (d.success) {
        setAlcanceGuardado({
          "Altura de Alcance": `${jumpRaw.altura} cm`,
          "Tiempo de Vuelo": `${jumpRaw.tiempoVuelo} ms`,
          Velocidad: `${jumpRaw.velocidad} m/s`,
          Potencia: `${jumpRaw.potencia} W`,
        })
        setModalAlcanceOpen(true)
        notify("success", "Guardado correctamente")
      }
    } catch (e) { console.error(e) }
  }

  const cerrarModalAlcance = () => {
    setModalAlcanceOpen(false)
    setAlcanceId(null)
    setAlcanceGuardado(null)
    setFaseAlcance("idle")
    setAlturaRegistrada("")
    setIncrementoAnterior("")
    setJumpRaw(null)
  }

  // ── PLIOMETRÍA acciones ──────────────────────────────────────────────────────

  const iniciarPliometria = async () => {
    if (!cuentaSeleccionada) { notify("error", "Selecciona un jugador primero"); return }
    if (!tiempoPliometria || Number.parseFloat(tiempoPliometria) <= 0) { notify("error", "Ingresa un tiempo válido"); return }
    if (!masaJugador || Number.parseFloat(masaJugador) <= 0) { notify("error", "Ingresa una masa válida"); return }

    try {
      const res = await fetch(`${BACKEND_URL}/api/pliometrias/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: Number(cuentaSeleccionada), tipo: tipoSalto, tiempo: Number.parseFloat(tiempoPliometria) }),
      })
      const d = await res.json()
      if (d.success) {
        setPliometriaId(d.data.id)
        setPliometriaIniciada(true)
        notify("success", `Pliometría iniciada ID: ${d.data.id}`)
        await sendCommand("B", setMessages)
        setTimeout(async () => { await sendCommand(`M:${Number.parseFloat(masaJugador)}`, setMessages) }, 300)
      } else {
        notify("error", d.message)
      }
    } catch (e) { console.error(e) }
  }

  const calibrarEjercicio = async () => {
    await sendCommand("I", setMessages)
    notify("success", "Sensores calibrados")
  }

  const iniciarEjercicio = async () => {
    const dur = Number.parseFloat(tiempoPliometria)
    if (isNaN(dur) || dur <= 0) { notify("error", "Duración inválida"); return }
    setChartData([])
    setDataPointCounter(0)
    setDatosEjercicio({ F1: 0, F2: 0, Ftotal: 0, acelZ: 0, pitch: 0, potencia: 0 })
    setEjercicioEnCurso(true)
    await sendCommand(`T:${dur}`, setMessages)
    setTimeout(async () => { await sendCommand("S", setMessages) }, 500)
  }

  const finalizarPliometria = async () => {
    if (!pliometriaId) { notify("error", "No hay pliometría iniciada"); return }
    try {
      const res = await fetch(`${BACKEND_URL}/api/pliometrias/finalizar/${pliometriaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fuerzaizquierda: datosEjercicio.F1,
          fuerzaderecha: datosEjercicio.F2,
          aceleracion: datosEjercicio.acelZ,
          potencia: datosEjercicio.potencia,
        }),
      })
      const d = await res.json()
      if (d.success) {
        setPliometriaGuardada({
          Tipo: tipoSalto,
          "Fuerza Izquierda": `${datosEjercicio.F1.toFixed(1)} N`,
          "Fuerza Derecha": `${datosEjercicio.F2.toFixed(1)} N`,
          Aceleración: `${datosEjercicio.acelZ.toFixed(2)} m/s²`,
          Potencia: `${datosEjercicio.potencia.toFixed(1)} W`,
        })
        setModalPliometriaOpen(true)
        notify("success", "Pliometría finalizada y guardada")
      }
    } catch (e) { console.error(e) }
  }

  const cerrarModalPliometria = () => {
    setModalPliometriaOpen(false)
    setPliometriaId(null)
    setPliometriaIniciada(false)
    setPliometriaGuardada(null)
    setDatosEjercicio({ F1: 0, F2: 0, Ftotal: 0, acelZ: 0, pitch: 0, potencia: 0 })
    setChartData([])
    setDataPointCounter(0)
    setMasaJugador("")
    setTiempoPliometria("")
    setEjercicioEnCurso(false)
  }

  // ── step helpers ─────────────────────────────────────────────────────────────
  const stepState = (step) => {
    if (step === 1) {
      if (faseAlcance === "calibrating") return "active"
      if (["calibrated", "jumping", "done"].includes(faseAlcance)) return "done"
    }
    if (step === 2) {
      if (faseAlcance === "jumping") return "active"
      if (faseAlcance === "done") return "done"
    }
    if (step === 3) {
      if (faseAlcance === "done") return "done"
      if (faseAlcance === "jumping") return "active"
    }
    return "idle"
  }
  const borderCls = (s) => s === "done" ? "border-emerald-400" : s === "active" ? "border-slate-500" : "border-slate-200"
  const titleCls  = (s) => s === "done" ? "text-emerald-600" : s === "active" ? "text-slate-700" : "text-slate-400"

  const aceleracionChartConfig = { acelZ: { label: "Aceleración", color: "#4f46e5" } }
  const potenciaChartConfig    = { potencia: { label: "Potencia",    color: "#0ea5e9" } }

  return (
    <div className="min-h-screen bg-[#f3f3f1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <Notification notification={notification} onClose={() => setNotification(null)} />
      <ResultModal isOpen={modalAlcanceOpen}    onClose={cerrarModalAlcance}    title="Alcance Guardado"    data={alcanceGuardado || {}} />
      <ResultModal isOpen={modalPliometriaOpen} onClose={cerrarModalPliometria} title="Pliometría Guardada" data={pliometriaGuardada || {}} />
      <CalibrationModal isOpen={calibrationModalOpen} onClose={() => { setCalibrationModalOpen(false); setIsCalibrated(false) }} isCalibrated={isCalibrated} />

      <div className="max-w-6xl mx-auto px-5 py-6 space-y-3">

        {/* ═══════════════════════════════════════════════
            FILA SUPERIOR — selector/perfil · test · resultados
        ═══════════════════════════════════════════════ */}
        <div className="flex gap-3 items-stretch">

          {/* ① SELECCIONAR JUGADOR + PERFIL */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-5">
            {/* selector */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Seleccionar jugador</span>
              <div className="relative">
                <select
                  value={cuentaSeleccionada}
                  onChange={(e) => { setCuentaSeleccionada(e.target.value); setFaseAlcance("idle"); setAlturaRegistrada(""); setIncrementoAnterior("") }}
                  className="appearance-none w-40 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-slate-50 pr-8 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="">Select</option>
                  {jugadoresDisponibles.map((c) => (
                    <option key={c.id} value={c.id.toString()}>
                      {c.jugador ? `${c.jugador.nombres} ${c.jugador.apellidos}` : c.usuario}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="w-px self-stretch bg-slate-100" />

            {/* perfil */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                {jugadorSeleccionado?.jugador?.posicion_principal
                  ? <img src={getPositionIcon(jugadorSeleccionado.jugador.posicion_principal)} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "/oso.png" }} />
                  : <User className="w-6 h-6 text-slate-300" />}
              </div>
              {jugadorSeleccionado?.jugador ? (
                <div className="leading-tight">
                  <p className="text-sm font-bold text-slate-800">{jugadorSeleccionado.jugador.nombres} {jugadorSeleccionado.jugador.apellidos}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">{jugadorSeleccionado.jugador.posicion_principal ?? "—"}</p>
                  <p className="text-xs text-slate-400">ALTURA: {jugadorSeleccionado.jugador.alcance_estatico ?? "N"}(m)</p>
                </div>
              ) : (
                <div className="leading-tight opacity-35">
                  <p className="text-sm font-bold text-slate-600">Nombre Jugador</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">POSICIÓN</p>
                  <p className="text-xs text-slate-400">ALTURA: N(m)</p>
                </div>
              )}
            </div>

            {/* esp status */}
            <div className="ml-auto flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${espConnected ? "bg-emerald-400" : "bg-red-400"}`} />
              <span className="text-[10px] text-slate-400">{espConnected ? "ESP OK" : "Sin señal"}</span>
            </div>
          </div>

          {/* ② INICIO DE TEST — solo visible en tab alcance */}
          {activeTab === "alcance" && (
            <div className="w-56 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Inicio de test</span>
              <div className="flex gap-2 flex-1 items-end">
                <button
                  onClick={handleCalibrar}
                  disabled={!cuentaSeleccionada || !espConnected || faseAlcance === "calibrating"}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95
                    ${faseAlcance === "calibrating" ? "bg-amber-100 text-amber-600 border border-amber-200 animate-pulse" : "bg-slate-700 text-white hover:bg-slate-600"}
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {faseAlcance === "calibrating" ? "…" : "Calibrar"}
                </button>
                <button
                  onClick={handleIniciarSalto}
                  disabled={faseAlcance !== "calibrated" || !espConnected}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95
                    ${faseAlcance === "jumping" ? "bg-indigo-100 text-indigo-600 border border-indigo-200 animate-pulse" : "bg-slate-700 text-white hover:bg-slate-600"}
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {faseAlcance === "jumping" ? "…" : "Iniciar"}
                </button>
              </div>
            </div>
          )}

          {/* ③ RESULTADOS — solo visible en tab alcance */}
          {activeTab === "alcance" && (
            <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Resultados</span>
              <div className="space-y-2.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wide text-slate-400 w-36 shrink-0 leading-tight">Altura de alcance registrada</span>
                  <input readOnly value={alturaRegistrada} placeholder="Agregar texto"
                    className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 placeholder-slate-300 focus:outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wide text-slate-400 w-36 shrink-0 leading-tight">Incremento respecto al anterior</span>
                  <input readOnly value={incrementoAnterior} placeholder="Agregar texto"
                    className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 placeholder-slate-300 focus:outline-none" />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleGuardarAlcance} disabled={faseAlcance !== "done"}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-700 text-white hover:bg-slate-600 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            TABS
        ═══════════════════════════════════════════════ */}
        <div className="flex w-fit rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          {[["alcance","Test de Alcance"],["pliometria","Pliometría"]].map(([key, label], i, arr) => (
            <span key={key} className="flex">
              <button onClick={() => setActiveTab(key)}
                className={`px-10 py-2.5 text-sm font-medium transition-colors
                  ${activeTab === key ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}>
                {label}
              </button>
              {i < arr.length - 1 && <span className="w-px bg-slate-200" />}
            </span>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════
            TAB: TEST DE ALCANCE
        ═══════════════════════════════════════════════ */}
        {activeTab === "alcance" && (
          <div className="pt-2 space-y-5">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
              Pasos a seguir para el jugador
            </p>
            <div className="grid grid-cols-3 gap-6">

              {/* Paso 1 — Calibración */}
              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-semibold uppercase tracking-widest text-center ${titleCls(stepState(1))}`}>Calibración</p>
                <div className={`rounded-xl border-2 ${borderCls(stepState(1))} bg-white overflow-hidden transition-all duration-300`}>
                  <div className="aspect-[3/4] flex items-center justify-center bg-slate-50">
                    <svg viewBox="0 0 100 140" className="w-28" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="50" cy="24" r="11" />
                      <line x1="50" y1="35" x2="50" y2="82" />
                      <line x1="50" y1="52" x2="30" y2="68" />
                      <line x1="50" y1="52" x2="70" y2="68" />
                      <line x1="50" y1="82" x2="35" y2="110" />
                      <line x1="50" y1="82" x2="65" y2="110" />
                    </svg>
                  </div>
                </div>
                <div className="px-1 space-y-1">
                  <p className="text-[11px] font-bold text-red-500 uppercase leading-tight">Indicar que jugador se quede quieto</p>
                  <p className="text-[11px] text-red-400 leading-tight">Mostrar mensaje de calibración</p>
                </div>
              </div>

              {/* Paso 2 — Inicio de prueba */}
              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-semibold uppercase tracking-widest text-center ${titleCls(stepState(2))}`}>Inicio de prueba</p>
                <div className={`rounded-xl border-2 ${borderCls(stepState(2))} bg-white overflow-hidden transition-all duration-300`}>
                  <div className="aspect-[3/4] flex items-center justify-center bg-slate-50">
                    <svg viewBox="0 0 100 140" className="w-28" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="50" cy="32" r="11" />
                      <path d="M50 43 Q46 58 38 70" />
                      <path d="M50 43 Q54 58 62 70" />
                      <path d="M44 64 Q36 82 30 96" />
                      <path d="M56 64 Q64 82 70 96" />
                      <path d="M80 55 L80 30" stroke="#cbd5e1" strokeWidth="1.5" />
                      <path d="M75 36 L80 30 L85 36" stroke="#cbd5e1" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
                <div className="px-1">
                  <p className="text-[11px] text-slate-400 leading-tight">El jugador realiza el salto al recibir la señal</p>
                </div>
              </div>

              {/* Paso 3 — Finalización */}
              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-semibold uppercase tracking-widest text-center ${titleCls(stepState(3))}`}>Finalización de prueba</p>
                <div className={`rounded-xl border-2 ${borderCls(stepState(3))} bg-white overflow-hidden transition-all duration-300`}>
                  <div className="aspect-[3/4] flex items-center justify-center bg-slate-50">
                    <svg viewBox="0 0 100 140" className="w-28" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="50" cy="24" r="11" />
                      <path d="M50 35 Q46 52 40 64" />
                      <path d="M50 35 Q54 52 60 64" />
                      <path d="M40 64 Q34 82 28 98" />
                      <path d="M60 64 Q66 82 72 98" />
                      <line x1="20" y1="108" x2="80" y2="108" strokeWidth="2.5" />
                      {stepState(3) === "done" && <path d="M36 120 l8 8 l18 -14" stroke="#10b981" strokeWidth="2.5" />}
                    </svg>
                  </div>
                </div>
                <div className="px-1">
                  <p className="text-[11px] text-slate-400 leading-tight">Datos registrados automáticamente al aterrizar</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: PLIOMETRÍA
        ═══════════════════════════════════════════════ */}
        {activeTab === "pliometria" && (
          <div className="space-y-4">

            {/* Selección tipo de salto */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "salto cajon", label: "Salto Cajón", images: SALTO_CAJON_IMAGES },
                { key: "salto valla", label: "Salto Valla", images: SALTO_VALLA_IMAGES },
                { key: "salto simple", label: "Salto Simple", images: SALTO_SIMPLE_IMAGES },
              ].map(({ key, label, images }) => (
                <button key={key} onClick={() => setTipoSalto(key)}
                  className={`rounded-2xl border-2 p-4 transition-all text-center
                    ${tipoSalto === key ? "border-slate-700 bg-white shadow-md" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <div className="w-full h-40 mb-3 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                    <ImageSequence images={images} alt={label} delay={3000} className="w-full h-full" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                </button>
              ))}
            </div>

            {/* Configuración */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <p className="text-[9px] uppercase tracking-widest font-semibold text-slate-400 mb-4">Configuración del ejercicio</p>

              <div className="flex justify-center gap-6 mb-6">
                <div className="flex flex-col gap-1.5 w-36">
                  <label className="text-xs font-semibold text-slate-600 text-center">Tiempo (s)</label>
                  <input type="number" value={tiempoPliometria} onChange={(e) => setTiempoPliometria(e.target.value)} placeholder="30"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-center text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300" />
                </div>
                <div className="flex flex-col gap-1.5 w-36">
                  <label className="text-xs font-semibold text-slate-600 text-center">Masa (kg)</label>
                  <input type="number" value={masaJugador} onChange={(e) => setMasaJugador(e.target.value)} placeholder="75"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-center text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300" />
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {!pliometriaIniciada ? (
                  <button onClick={iniciarPliometria} disabled={!cuentaSeleccionada || !tiempoPliometria || !masaJugador}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <Play className="w-4 h-4" /> Iniciar Pliometría
                  </button>
                ) : (
                  <div className="px-5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-semibold text-emerald-800">Pliometría Activa</span>
                  </div>
                )}

                <button onClick={calibrarEjercicio} disabled={!espConnected || !pliometriaIniciada}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> Calibrar
                </button>

                <button onClick={iniciarEjercicio} disabled={!espConnected || !tiempoPliometria || !pliometriaIniciada}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" /> Realizar Salto
                </button>

                {pliometriaIniciada && (
                  <button onClick={finalizarPliometria}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all active:scale-95 flex items-center gap-2">
                    Finalizar
                  </button>
                )}
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-3 gap-4">
              <MetricCard icon="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fuerza-rQwaYzHNkSayDm1ezPNPlEptppC9WK.png"
                label="Fuerza Máxima" value={datosEjercicio.Ftotal.toFixed(1)} unit="N" variant="accent" />
              <MetricCard icon="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/aceleracion-uT5p8f2u0RXiZNGhtYUvC4SBe4v74F.png"
                label="Aceleración Máxima" value={datosEjercicio.acelZ.toFixed(2)} unit="m/s²" variant="default" />
              <MetricCard icon="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pontencia-r31E1tQpn0cCurnFjLCnR6GIo7IZwh.png"
                label="Potencia Máxima" value={datosEjercicio.potencia.toFixed(1)} unit="W" variant="success" />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-600 mb-3 text-center">Gráfico de Fuerza</p>
                <div className="h-56 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                  <p className="text-xs text-slate-400">Gráfico de fuerza</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-600 mb-3 text-center">Gráfico de Aceleración</p>
                {chartData.length === 0 ? (
                  <div className="h-56 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <p className="text-xs text-slate-400">Esperando datos...</p>
                  </div>
                ) : (
                  <ChartContainer config={aceleracionChartConfig} className="h-56">
                    <RechartsLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="point" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="acelZ" stroke="var(--color-acelZ)" strokeWidth={2} dot={false} />
                    </RechartsLineChart>
                  </ChartContainer>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-600 mb-3 text-center">Gráfico de Potencia</p>
                {chartData.length === 0 ? (
                  <div className="h-56 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <p className="text-xs text-slate-400">Esperando datos...</p>
                  </div>
                ) : (
                  <ChartContainer config={potenciaChartConfig} className="h-56">
                    <RechartsLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="point" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="potencia" stroke="var(--color-potencia)" strokeWidth={2} dot={false} />
                    </RechartsLineChart>
                  </ChartContainer>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Monitor colapsable */}
        <details className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <summary className="px-4 py-2.5 text-[10px] uppercase tracking-widest text-slate-400 font-semibold cursor-pointer select-none">
            Monitor de mensajes
          </summary>
          <div className="bg-slate-900 p-4 h-36 overflow-y-auto font-mono text-[11px]">
            {messages.length === 0
              ? <p className="text-slate-500">Sin mensajes…</p>
              : messages.map((m, i) => (
                <div key={i} className={m.status === "error" ? "text-red-400" : m.status === "success" ? "text-emerald-400" : "text-slate-400"}>
                  <span className="text-slate-600">[{m.timestamp}] </span>
                  <span className="font-semibold">{m.device}: </span>
                  {m.message}
                </div>
              ))}
          </div>
        </details>

      </div>
    </div>
  )
}