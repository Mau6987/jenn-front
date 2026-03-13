"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, User, CheckCircle, X } from "lucide-react"
import { ImageSequence } from "../../components/image-sequence"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"
const DEVICE_ID = "ESP-6"
const G = 9.81

const PUSHER_KEY     = "4f85ef5c792df94cebc9"
const PUSHER_CLUSTER = "us2"

// ─────────────────────────────────────────────────────────────────────────────
//  TABLA DE COMANDOS ESP
// ─────────────────────────────────────────────────────────────────────────────

const SALTO_SIMPLE_IMAGES = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/conos-removebg-preview__2_-removebg-preview-ZdpOb2qgOJERfCssbovE9QRaOX5m1U.png",
]
const SALTO_CONOS_IMAGES = SALTO_SIMPLE_IMAGES
const CMD = {
  CALIBRAR:         "CALIBRAR",
  CANCELAR:         "CANCELAR",
  STOP:             "STOP",
  ALCANCE:          "ALCANCE",
  VERTICAL_TIMED:   (s) => `VERTICAL:${s}`,
  VERTICAL_MANUAL:  "VERTICAL",
  CONO_TIMED:       (s) => `CONO:${s}`,
  CONO_MANUAL:      "CONO",
}

const ALCANCE_DURACION_SEG = 15

function addMessage(device, message, status, setMessages) {
  const timestamp = new Date().toLocaleTimeString()
  setMessages((prev) => [...prev, { device, message, status, timestamp }])
}

async function sendCommand(command, setMessages) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: DEVICE_ID,
        command,
        channel: `private-device-${DEVICE_ID}`,
      }),
    })
    const data = await res.json()
    if (data.success || res.ok)
      addMessage("SISTEMA", `Comando enviado: ${command}`, "success", setMessages)
    else
      addMessage("SISTEMA", `Error: ${data.message || "desconocido"}`, "error", setMessages)
  } catch {
    addMessage("SISTEMA", "Error al enviar comando", "error", setMessages)
  }
}

async function cargarCuentas(setCuentas, setJugadoresDisponibles) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/cuentas`)
    const data = await res.json()
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
  window.Pusher.logToConsole = false
  const pusher = new window.Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
    encrypted: true,
    authEndpoint: `${BACKEND_URL}/api/pusher/pusher/auth`,
    forceTLS: true,
  })
  pusher.connection.bind("state_change", ({ previous, current }) =>
    console.log(`[Pusher] ${previous} → ${current}`)
  )
  subscribeToESP(pusher)
}

// ─────────────────────────────────────────────────────────────────────────────
//  ÍNDICE DE FATIGA
// ─────────────────────────────────────────────────────────────────────────────
function calcularIndiceFatiga(primerSalto, ultimoSalto) {
  if (!primerSalto || !ultimoSalto) return null
  const fInicial = parseFloat(primerSalto.pico_izq) + parseFloat(primerSalto.pico_der)
  const fFinal   = parseFloat(ultimoSalto.pico_izq)  + parseFloat(ultimoSalto.pico_der)
  if (fInicial <= 0) return null
  return ((fInicial - fFinal) / fInicial * 100).toFixed(1)
}

// ─────────────────────────────────────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ notification, onClose }) {
  if (!notification) return null
  const isOk = notification.type === "success"
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border bg-white max-w-[90vw]"
      style={{ borderColor: isOk ? "#a7f3d0" : "#fecaca", color: isOk ? "#065f46" : "#991b1b" }}>
      {isOk
        ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
        : <X className="w-4 h-4 text-red-400 shrink-0" />}
      <span className="truncate">{notification.message}</span>
      <button onClick={onClose} className="ml-1 opacity-40 hover:opacity-80 shrink-0">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL RESULTADO
// ─────────────────────────────────────────────────────────────────────────────
function ResultModal({ isOpen, onClose, title, data }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-400 mb-0.5 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
              <p className="text-base font-bold text-slate-900">{v}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition-colors">
          Cerrar y Limpiar
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL CALIBRACIÓN
// ─────────────────────────────────────────────────────────────────────────────
function CalibrationModal({ isOpen, isCalibrated, onClose, onCancel }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>
        {!isCalibrated ? (
          <>
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/calibrar-removebg-preview-1y4aBupjFQ9WApv9Ru1gxKoxsOdMqW.png"
                alt="Calibrando"
                className="w-14 h-14 object-contain animate-spin"
                style={{ animationDuration: "2s" }}
              />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Calibrando...</h3>
            <p className="text-sm text-slate-500 mb-5">
              Jugador <strong>quieto y de pie</strong> sobre las celdas (~5 segundos)
            </p>
            <button
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 transition-colors">
              Cancelar calibración
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-800 mb-1">¡Calibrado correctamente!</h3>
            <p className="text-sm text-slate-500">MPU6050 y celdas HX711 listas</p>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  TARJETA ÍNDICE DE FATIGA
// ─────────────────────────────────────────────────────────────────────────────
function FatigaCard({ primerSalto, ultimoSalto, totalSaltos }) {
  const IF = calcularIndiceFatiga(primerSalto, ultimoSalto)

  const fInicial    = primerSalto ? (parseFloat(primerSalto.pico_izq) + parseFloat(primerSalto.pico_der)).toFixed(2) : "—"
  const fFinal      = ultimoSalto ? (parseFloat(ultimoSalto.pico_izq) + parseFloat(ultimoSalto.pico_der)).toFixed(2) : "—"
  const fInicialIzq = primerSalto ? parseFloat(primerSalto.pico_izq).toFixed(2) : "—"
  const fInicialDer = primerSalto ? parseFloat(primerSalto.pico_der).toFixed(2) : "—"
  const fFinalIzq   = ultimoSalto ? parseFloat(ultimoSalto.pico_izq).toFixed(2)  : "—"
  const fFinalDer   = ultimoSalto ? parseFloat(ultimoSalto.pico_der).toFixed(2)  : "—"

  const nivel =
    IF === null            ? "slate"
    : parseFloat(IF) < 0  ? "blue"
    : parseFloat(IF) < 10 ? "emerald"
    : parseFloat(IF) < 20 ? "amber"
    : "red"

  const colorMap = {
    slate:   { bg: "bg-slate-50",   border: "border-slate-200",   badge: "bg-slate-100 text-slate-500",     bar: "bg-slate-400",   text: "text-slate-500",   val: "text-slate-600"   },
    blue:    { bg: "bg-blue-50",    border: "border-blue-200",    badge: "bg-blue-100 text-blue-600",       bar: "bg-blue-400",    text: "text-blue-600",    val: "text-blue-700"    },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500", text: "text-emerald-600", val: "text-emerald-700" },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   badge: "bg-amber-100 text-amber-700",    bar: "bg-amber-400",   text: "text-amber-600",   val: "text-amber-700"   },
    red:     { bg: "bg-red-50",     border: "border-red-200",     badge: "bg-red-100 text-red-700",        bar: "bg-red-500",     text: "text-red-600",     val: "text-red-700"     },
  }
  const c = colorMap[nivel]

  const nivelLabel =
    IF === null            ? "Sin datos suficientes"
    : parseFloat(IF) < 0  ? "↑ Fuerza en aumento — activación progresiva"
    : parseFloat(IF) < 10 ? "✓ Fatiga baja — rendimiento sostenido"
    : parseFloat(IF) < 20 ? "⚠ Fatiga moderada — monitorear"
    : "✗ Fatiga alta — considerar descanso"

  const barPct =
    IF === null ? 0
    : parseFloat(IF) < 0 ? Math.min(Math.abs(parseFloat(IF)) * 3, 30)
    : Math.min(parseFloat(IF) * 3, 100)

  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-5 space-y-4`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-600">Índice de Fatiga</p>
        <span className={`text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
          {totalSaltos} saltos
        </span>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col items-center gap-1">
        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Fórmula aplicada</p>
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
          <span className="font-bold text-slate-700">IF</span>
          <span className="text-slate-300">=</span>
          <div className="flex flex-col items-center leading-tight">
            <span className="text-slate-600 font-semibold whitespace-nowrap">
              F<sub>inicial</sub> − F<sub>final</sub>
            </span>
            <div className="w-full h-px bg-slate-300 my-0.5" />
            <span className="text-slate-500 whitespace-nowrap">F<sub>inicial</sub></span>
          </div>
          <span className="text-slate-300">×</span>
          <span>100</span>
        </div>
        <p className="text-[9px] text-slate-400 mt-0.5">F = pico izq. + pico der. (kg)</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center bg-white rounded-xl border border-slate-100 p-2.5 gap-1">
          <p className="text-[9px] uppercase tracking-wide text-slate-400 text-center">F inicial (kg)</p>
          <p className="text-base font-bold text-slate-700">{fInicial}</p>
          <div className="flex flex-col items-center text-[9px] text-slate-400">
            <span>Izq: {fInicialIzq}</span>
            <span>Der: {fInicialDer}</span>
          </div>
        </div>
        <div className="flex flex-col items-center bg-white rounded-xl border border-slate-100 p-2.5 gap-1">
          <p className="text-[9px] uppercase tracking-wide text-slate-400 text-center">F final (kg)</p>
          <p className="text-base font-bold text-slate-700">{fFinal}</p>
          <div className="flex flex-col items-center text-[9px] text-slate-400">
            <span>Izq: {fFinalIzq}</span>
            <span>Der: {fFinalDer}</span>
          </div>
        </div>
        <div className={`flex flex-col items-center rounded-xl border ${c.border} p-2.5 gap-1`}>
          <p className={`text-[9px] uppercase tracking-wide ${c.text} text-center`}>IF (%)</p>
          <p className={`text-base font-bold ${c.val}`}>{IF !== null ? `${IF}%` : "—"}</p>
          <p className={`text-[9px] font-semibold ${c.text} text-center leading-tight`}>
            {IF === null ? "—"
            : parseFloat(IF) < 0  ? "↑ mejora"
            : parseFloat(IF) < 10 ? "baja"
            : parseFloat(IF) < 20 ? "moderada"
            : "alta"}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${barPct}%` }} />
        </div>
        <p className={`text-[10px] font-semibold ${c.text} text-center`}>{nivelLabel}</p>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export default function SistemaUnificadoPage() {
  const [cuentas, setCuentas]                           = useState([])
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada]     = useState("")
  const [espConnected, setEspConnected]                 = useState(false)
  const [messages, setMessages]                         = useState([])
  const [notification, setNotification]                 = useState(null)
  const [activeTab, setActiveTab]                       = useState("alcance")

  // ── ALCANCE ───────────────────────────────────────────────────────────────
  const [faseAlcance, setFaseAlcance]                   = useState("idle")
  const [incrementoAnterior, setIncrementoAnterior]     = useState("")
  const [ultimoAlcance, setUltimoAlcance]               = useState(null)
  const [alcanceGuardado, setAlcanceGuardado]           = useState(null)
  const [modalAlcanceOpen, setModalAlcanceOpen]         = useState(false)
  const [alcanceSegundos, setAlcanceSegundos]           = useState(0)

  // ── CALIBRACIÓN ───────────────────────────────────────────────────────────
  const [calibrationModalOpen, setCalibrationModalOpen] = useState(false)
  const [isCalibrated, setIsCalibrated]                 = useState(false)
  const calibrationTimerRef                             = useRef(null)
  const calibrandoRef                                   = useRef(false)
  const alcanceTimerRef                                 = useRef(null)

  // ── PLIOMETRÍA ────────────────────────────────────────────────────────────
  const [tiempoPliometria, setTiempoPliometria]         = useState("60")
  const [tipoSalto, setTipoSalto]                       = useState("salto simple")
  const [pliometriaId, setPliometriaId]                 = useState(null)
  const [pliometriaCalibrada, setPliometriaCalibrada]   = useState(false)
  const [pliometriaIniciada, setPliometriaIniciada]     = useState(false)
  const [ejercicioEnCurso, setEjercicioEnCurso]         = useState(false)
  const [pliometriaGuardada, setPliometriaGuardada]     = useState(null)
  const [modalPliometriaOpen, setModalPliometriaOpen]   = useState(false)
  const [progresoSegundos, setProgresoSegundos]         = useState(0)
  const [saltoRTActual, setSaltoRTActual]               = useState(null)
  const [saltoFlash, setSaltoFlash]                     = useState(false)
  const [ultimaAlturaCono, setUltimaAlturaCono]         = useState(null)
  const [resultadoFinal, setResultadoFinal]             = useState(null)

  // ── FATIGA ────────────────────────────────────────────────────────────────
  const [primerSaltoSesion, setPrimerSaltoSesion]       = useState(null)
  const [ultimoSaltoSesion, setUltimoSaltoSesion]       = useState(null)
  const [totalSaltosSesion, setTotalSaltosSesion]       = useState(0)

  const saltoConosContadorRef = useRef(0)
  const progresoTimerRef      = useRef(null)
  const jugadorRef            = useRef(null)
  const tipoSaltoRef          = useRef(tipoSalto)
  const ultimoAlcanceRef      = useRef(null)

  const jugadorSeleccionado = cuentas.find((c) => c.id === Number(cuentaSeleccionada))

  useEffect(() => { jugadorRef.current    = jugadorSeleccionado }, [jugadorSeleccionado])
  useEffect(() => { tipoSaltoRef.current  = tipoSalto },          [tipoSalto])

  useEffect(() => {
    cargarCuentas(setCuentas, setJugadoresDisponibles)
    loadPusher(subscribeToESP)
  }, [])

  useEffect(() => {
    if (!cuentaSeleccionada) { setUltimoAlcance(null); ultimoAlcanceRef.current = null; return }
    fetch(`${BACKEND_URL}/api/alcances/ultimo/${cuentaSeleccionada}`)
      .then((r) => r.json())
      .then((d) => { setUltimoAlcance(d.data ?? null); ultimoAlcanceRef.current = d.data ?? null })
      .catch(console.error)
  }, [cuentaSeleccionada])

  const notify = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3500)
  }

  const getAlcanceEstaticoCm = () => {
    const j = jugadorRef.current
    if (!j) return 0
    return parseFloat(j?.jugador?.alcance_estatico ?? j?.alcance_estatico ?? 0) * 100
  }

  const resetFatiga = () => {
    setPrimerSaltoSesion(null)
    setUltimoSaltoSesion(null)
    setTotalSaltosSesion(0)
  }

  // ── PUSHER ────────────────────────────────────────────────────────────────
  const subscribeToESP = (pusher) => {
    const channel = pusher.subscribe(`private-device-${DEVICE_ID}`)

    channel.bind("pusher:subscription_succeeded", () => {
      setEspConnected(true)
      addMessage(DEVICE_ID, "Conectado", "success", setMessages)
      notify("success", "ESP-6 conectado")
    })

    channel.bind("pusher:subscription_error", (err) => {
      addMessage("SISTEMA", `Error suscripción: ${JSON.stringify(err)}`, "error", setMessages)
    })

    channel.bind("client-response", (data) => {
      let rawMsg = data.message || ""
      if (typeof rawMsg === "object") rawMsg = JSON.stringify(rawMsg)
      try { const p = JSON.parse(rawMsg); if (p?.message) rawMsg = p.message } catch (_) {}
      const msg = String(rawMsg).trim()
      addMessage(DEVICE_ID, msg, "success", setMessages)

      if (msg.includes("CALIBRADO_OK")) {
        if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }
        calibrandoRef.current = false
        setIsCalibrated(true)
        setPliometriaCalibrada(true)
        setFaseAlcance("calibrated")
        setCalibrationModalOpen(true)
        setTimeout(() => { setCalibrationModalOpen(false); setIsCalibrated(false) }, 2000)
        notify("success", "¡Calibrado! — listo para iniciar")
        return
      }

      if (msg.includes("CALIBRACION_CANCELADA")) {
        if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }
        calibrandoRef.current = false
        setFaseAlcance("idle")
        setCalibrationModalOpen(false)
        setIsCalibrated(false)
        setPliometriaCalibrada(false)
        notify("error", "Calibración cancelada")
        return
      }

      if (msg.includes("SESION_INICIADA")) {
        setFaseAlcance("jumping")
        setEjercicioEnCurso(true)
        setSaltoRTActual(null)
        setResultadoFinal(null)
        saltoConosContadorRef.current = 0
        resetFatiga()
        return
      }

      if (msg.includes("SESION_FINALIZADA")) {
        setEjercicioEnCurso(false)
        if (progresoTimerRef.current) { clearInterval(progresoTimerRef.current); progresoTimerRef.current = null }
        if (alcanceTimerRef.current)  { clearInterval(alcanceTimerRef.current);  alcanceTimerRef.current  = null }
        return
      }

      if (msg.startsWith("SALTO_JSON:")) {
        try {
          const json = JSON.parse(msg.slice("SALTO_JSON:".length))
          const currentTipo       = tipoSaltoRef.current
          const alcanceEstaticoCm = getAlcanceEstaticoCm()
          const alcanceTotal      = parseFloat((alcanceEstaticoCm + json.altura_cm).toFixed(1))

          const saltoFatiga = { pico_izq: json.pico_izq ?? 0, pico_der: json.pico_der ?? 0 }
          setPrimerSaltoSesion((prev) => prev ?? saltoFatiga)
          setUltimoSaltoSesion(saltoFatiga)
          setTotalSaltosSesion((prev) => prev + 1)

          saltoConosContadorRef.current += 1
          const numSalto = saltoConosContadorRef.current

          setSaltoFlash(true)
          setTimeout(() => setSaltoFlash(false), 400)

          const saltoData = {
            num:       numSalto,
            altura_cm: json.altura_cm,
            alcanceTotal,
            pico_izq:  json.pico_izq ?? 0,
            pico_der:  json.pico_der ?? 0,
          }

          if (currentTipo === "salto conos") {
            setSaltoRTActual(saltoData)
            setUltimaAlturaCono(json.altura_cm)
            addMessage(DEVICE_ID,
              `Salto cono #${numSalto} — ${json.altura_cm}cm | Izq: ${json.pico_izq}kg | Der: ${json.pico_der}kg`,
              "success", setMessages)
          } else {
            setSaltoRTActual((prev) => (!prev || json.altura_cm > prev.altura_cm) ? saltoData : prev)
            addMessage(DEVICE_ID,
              `Salto #${numSalto} — ${json.altura_cm}cm | alcance: ${alcanceTotal}cm | Izq: ${json.pico_izq}kg | Der: ${json.pico_der}kg`,
              "success", setMessages)
          }
        } catch (e) {
          addMessage(DEVICE_ID, `Error parseando SALTO_JSON: ${e.message}`, "error", setMessages)
        }
        return
      }

      if (msg.startsWith("RESULTADO_JSON:")) {
        try {
          const json              = JSON.parse(msg.slice("RESULTADO_JSON:".length))
          const currentTipo       = tipoSaltoRef.current
          const alcanceEstaticoCm = getAlcanceEstaticoCm()
          const alcanceTotal      = parseFloat((alcanceEstaticoCm + Number(json.alt_max_cm)).toFixed(1))

          const picoIzq   = json.fuerza_izq  ?? json.pico_izq_kg ?? json.pico_izq  ?? 0
          const picoDer   = json.fuerza_der  ?? json.pico_der_kg ?? json.pico_der  ?? 0
          const numSaltos = json.saltos       ?? json.saltos_validos               ?? saltoConosContadorRef.current

          const resultado = {
            _tipo:             json.modo ?? (currentTipo === "salto conos" ? "cono" : "vertical"),
            saltos_validos:    numSaltos,
            alt_max_cm:        Number(json.alt_max_cm).toFixed(1),
            pico_izq_kg:       Number(picoIzq).toFixed(2),
            pico_der_kg:       Number(picoDer).toFixed(2),
            alcanceEstaticoCm: parseFloat(alcanceEstaticoCm.toFixed(1)),
            alcanceTotal,
          }

          if (resultado._tipo !== "cono") {
            const previo = ultimoAlcanceRef.current
            if (previo?.alcance != null) {
              const inc = alcanceTotal - parseFloat(previo.alcance)
              setIncrementoAnterior(`${inc >= 0 ? "+" : ""}${inc.toFixed(1)} cm`)
            } else {
              setIncrementoAnterior("Sin registro previo")
            }
          }

          setResultadoFinal(resultado)
          setEjercicioEnCurso(false)
          if (progresoTimerRef.current) { clearInterval(progresoTimerRef.current); progresoTimerRef.current = null }
          if (alcanceTimerRef.current)  { clearInterval(alcanceTimerRef.current);  alcanceTimerRef.current  = null }
          setFaseAlcance("done")
          notify("success", "Prueba finalizada — presiona Guardar")
          addMessage(DEVICE_ID,
            `Resultado — alt.máx: ${json.alt_max_cm}cm | Izq: ${picoIzq}kg | Der: ${picoDer}kg`,
            "success", setMessages)
        } catch (e) {
          addMessage(DEVICE_ID, `Error parseando RESULTADO_JSON: ${e.message}`, "error", setMessages)
        }
        return
      }
    })

    channel.bind("client-status", (data) => {
      if (data?.status === "connected") setEspConnected(true)
    })
  }

  // ── Calibrar ──────────────────────────────────────────────────────────────
  const handleCalibrar = async () => {
    if (!jugadorSeleccionado) { notify("error", "Selecciona un jugador primero"); return }
    if (calibrandoRef.current) return
    if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }

    calibrandoRef.current = true
    setFaseAlcance("calibrating")
    setPliometriaCalibrada(false)
    setSaltoRTActual(null)
    setResultadoFinal(null)
    setIncrementoAnterior("")
    setIsCalibrated(false)
    setCalibrationModalOpen(true)
    resetFatiga()

    addMessage("SISTEMA", `Enviando ${CMD.CALIBRAR}...`, "info", setMessages)
    await sendCommand(CMD.CALIBRAR, setMessages)

    calibrationTimerRef.current = setTimeout(() => {
      calibrationTimerRef.current = null
      if (calibrandoRef.current) {
        calibrandoRef.current = false
        setFaseAlcance("idle")
        setCalibrationModalOpen(false)
        setIsCalibrated(false)
        notify("error", "Calibración sin respuesta (25s) — intenta nuevamente")
        addMessage("SISTEMA", "Calibración cancelada por timeout (25s)", "error", setMessages)
      }
    }, 25000)
  }

  const handleCancelarCalibracion = async () => {
    if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }
    calibrandoRef.current = false
    setCalibrationModalOpen(false)
    setIsCalibrated(false)
    setFaseAlcance("idle")
    setPliometriaCalibrada(false)
    addMessage("SISTEMA", `Enviando ${CMD.CANCELAR}...`, "info", setMessages)
    await sendCommand(CMD.CANCELAR, setMessages)
    notify("error", "Cancelación enviada al ESP")
  }

  // ── Tab Alcance — iniciar ─────────────────────────────────────────────────
  const handleIniciarSalto = async () => {
    if (faseAlcance !== "calibrated") { notify("error", "Calibra primero el sensor"); return }
    setSaltoRTActual(null); setResultadoFinal(null); setIncrementoAnterior("")
    setAlcanceSegundos(0)
    saltoConosContadorRef.current = 0; resetFatiga()

    const cmd = CMD.VERTICAL_TIMED(ALCANCE_DURACION_SEG)
    addMessage("SISTEMA", `Enviando ${cmd} al ESP...`, "info", setMessages)
    await sendCommand(cmd, setMessages)

    if (alcanceTimerRef.current) clearInterval(alcanceTimerRef.current)
    alcanceTimerRef.current = setInterval(() => {
      setAlcanceSegundos((prev) => {
        const next = prev + 1
        if (next >= ALCANCE_DURACION_SEG) {
          clearInterval(alcanceTimerRef.current)
          alcanceTimerRef.current = null
        }
        return next
      })
    }, 1000)
  }

  const handleFinalizarSalto = async () => {
    if (faseAlcance !== "jumping") return
    if (alcanceTimerRef.current) { clearInterval(alcanceTimerRef.current); alcanceTimerRef.current = null }
    addMessage("SISTEMA", `Enviando ${CMD.STOP}...`, "info", setMessages)
    await sendCommand(CMD.STOP, setMessages)
  }

  const handleGuardarAlcance = async () => {
    if (!resultadoFinal || !cuentaSeleccionada) return
    if (resultadoFinal._tipo === "cono") { notify("error", "El salto con conos no guarda alcance"); return }
    try {
      const res = await fetch(`${BACKEND_URL}/api/alcances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: Number(cuentaSeleccionada), alcance: resultadoFinal.alcanceTotal }),
      })
      const d = await res.json()
      if (d.success) {
        setAlcanceGuardado({
          "Alcance registrado":     `${resultadoFinal.alcanceTotal} cm`,
          "Altura del salto (ESP)": `${resultadoFinal.alt_max_cm} cm`,
          "Alcance estático":       `${resultadoFinal.alcanceEstaticoCm} cm`,
          "Saltos válidos":         `${resultadoFinal.saltos_validos}`,
          "Fuerza máx. izquierda":  `${resultadoFinal.pico_izq_kg} kg`,
          "Fuerza máx. derecha":    `${resultadoFinal.pico_der_kg} kg`,
        })
        setModalAlcanceOpen(true)
        notify("success", "Guardado correctamente")
      }
    } catch (e) { console.error(e); notify("error", "Error al guardar") }
  }

  const cerrarModalAlcance = () => {
    setModalAlcanceOpen(false); setAlcanceGuardado(null); setFaseAlcance("idle")
    setSaltoRTActual(null); setResultadoFinal(null); setIncrementoAnterior("")
    setAlcanceSegundos(0); resetFatiga()
    if (cuentaSeleccionada) {
      fetch(`${BACKEND_URL}/api/alcances/ultimo/${cuentaSeleccionada}`)
        .then((r) => r.json())
        .then((d) => { setUltimoAlcance(d.data ?? null); ultimoAlcanceRef.current = d.data ?? null })
        .catch(console.error)
    }
  }

  // ── Tab Pruebas — iniciar ─────────────────────────────────────────────────
  const iniciarPliometria = async () => {
    if (!cuentaSeleccionada)  { notify("error", "Selecciona un jugador primero"); return }
    if (!pliometriaCalibrada) { notify("error", "Calibra primero el sensor"); return }

    const duracion = Math.round(Number.parseFloat(tiempoPliometria))
    if (!tiempoPliometria || duracion <= 0) { notify("error", "Ingresa un tiempo válido"); return }

    try {
      const res = await fetch(`${BACKEND_URL}/api/pliometrias/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuentaId: Number(cuentaSeleccionada),
          tipo:     tipoSalto,
          tiempo:   duracion,
        }),
      })
      const d = await res.json()
      if (d.success) setPliometriaId(d.data.id)
    } catch (e) { console.error(e) }

    setSaltoRTActual(null); setResultadoFinal(null); setProgresoSegundos(0)
    setSaltoFlash(false); setUltimaAlturaCono(null)
    saltoConosContadorRef.current = 0; resetFatiga()

    const cmdEsp = tipoSaltoRef.current === "salto conos"
      ? CMD.CONO_TIMED(duracion)
      : CMD.VERTICAL_TIMED(duracion)

    addMessage("SISTEMA", `Enviando ${cmdEsp} al ESP`, "info", setMessages)
    await sendCommand(cmdEsp, setMessages)

    if (progresoTimerRef.current) clearInterval(progresoTimerRef.current)
    progresoTimerRef.current = setInterval(() => {
      setProgresoSegundos((prev) => {
        const next = prev + 1
        if (next >= duracion) {
          clearInterval(progresoTimerRef.current)
          progresoTimerRef.current = null
          sendCommand(CMD.STOP, setMessages)
          addMessage("SISTEMA", `Tiempo agotado — enviando ${CMD.STOP}`, "info", setMessages)
        }
        return next
      })
    }, 1000)

    setPliometriaIniciada(true)
    notify("success", `Prueba de ${duracion}s iniciada`)
  }

  const detenerPliometria = async () => {
    if (!pliometriaIniciada) { notify("error", "No hay prueba activa"); return }
    if (progresoTimerRef.current) { clearInterval(progresoTimerRef.current); progresoTimerRef.current = null }
    addMessage("SISTEMA", `Enviando ${CMD.STOP}...`, "info", setMessages)
    await sendCommand(CMD.STOP, setMessages)
  }

  const finalizarPliometria = async () => {
    if (!pliometriaId || !resultadoFinal) { notify("error", "No hay datos para guardar"); return }
    const IF = calcularIndiceFatiga(primerSaltoSesion, ultimoSaltoSesion)
    try {
      const body = {
        saltos_validos: resultadoFinal.saltos_validos,
        alt_max_cm:     resultadoFinal.alt_max_cm,
        pico_izq_kg:    resultadoFinal.pico_izq_kg,
        pico_der_kg:    resultadoFinal.pico_der_kg,
        indice_fatiga:  IF,
        ...(resultadoFinal._tipo !== "cono" && { alcanceTotal: resultadoFinal.alcanceTotal }),
      }
      const res = await fetch(`${BACKEND_URL}/api/pliometrias/finalizar/${pliometriaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (d.success) {
        setPliometriaGuardada({
          "Tipo de salto":    tipoSalto,
          "Saltos válidos":   `${resultadoFinal.saltos_validos}`,
          "Altura máxima":    `${resultadoFinal.alt_max_cm} cm`,
          "Fuerza pico izq.": `${resultadoFinal.pico_izq_kg} kg`,
          "Fuerza pico der.": `${resultadoFinal.pico_der_kg} kg`,
          ...(IF !== null && { "Índice de fatiga": `${IF}%` }),
          ...(resultadoFinal.alcanceTotal && { "Alcance total": `${resultadoFinal.alcanceTotal} cm` }),
        })
        setModalPliometriaOpen(true)
        notify("success", "Pliometría guardada")
      }
    } catch (e) { console.error(e) }
  }

  const cerrarModalPliometria = () => {
    setModalPliometriaOpen(false); setPliometriaId(null); setPliometriaCalibrada(false)
    setPliometriaIniciada(false); setPliometriaGuardada(null); setEjercicioEnCurso(false)
    setProgresoSegundos(0); setTiempoPliometria("60")
    if (progresoTimerRef.current) { clearInterval(progresoTimerRef.current); progresoTimerRef.current = null }
    setSaltoRTActual(null); setResultadoFinal(null); setIncrementoAnterior("")
    setFaseAlcance("idle"); saltoConosContadorRef.current = 0; resetFatiga()
  }

  const stepState = (step) => {
    if (step === 1) { if (faseAlcance === "calibrating") return "active"; if (["calibrated","jumping","done"].includes(faseAlcance)) return "done" }
    if (step === 2) { if (faseAlcance === "jumping") return "active"; if (faseAlcance === "done") return "done" }
    if (step === 3) { if (faseAlcance === "done") return "done"; if (faseAlcance === "jumping") return "active" }
    return "idle"
  }
  const borderCls = (s) => s === "done" ? "border-emerald-400" : s === "active" ? "border-slate-600" : "border-slate-200"
  const titleCls  = (s) => s === "done" ? "text-emerald-600"   : s === "active" ? "text-slate-700"   : "text-slate-400"
  const saltoImages = tipoSalto === "salto conos" ? SALTO_CONOS_IMAGES : SALTO_SIMPLE_IMAGES

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f3f3f1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <Toast notification={notification} onClose={() => setNotification(null)} />
      <ResultModal isOpen={modalAlcanceOpen}    onClose={cerrarModalAlcance}    title="Alcance Guardado"    data={alcanceGuardado    || {}} />
      <ResultModal isOpen={modalPliometriaOpen} onClose={cerrarModalPliometria} title="Pliometría Guardada" data={pliometriaGuardada  || {}} />
      <CalibrationModal
        isOpen={calibrationModalOpen}
        isCalibrated={isCalibrated}
        onClose={handleCancelarCalibracion}
        onCancel={handleCancelarCalibracion}
      />

      <div className="max-w-6xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4">

        {/* Indicador ESP */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold w-fit
          ${espConnected ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
          <span className={`w-2 h-2 rounded-full ${espConnected ? "bg-emerald-500 animate-ping" : "bg-amber-400"}`} />
          {espConnected ? "ESP-6 conectado" : "ESP-6 desconectado"}
        </div>

        {/* ── FILA SUPERIOR: jugador | panel de control ───────────────────── */}
        <div className="flex flex-col lg:flex-row gap-3">

          {/* Card jugador */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-5">
            {/* Select */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Seleccionar jugador</span>
              <div className="relative">
                <select
                  value={cuentaSeleccionada}
                  onChange={(e) => {
                    setCuentaSeleccionada(e.target.value)
                    setFaseAlcance("idle"); setSaltoRTActual(null); setResultadoFinal(null); setIncrementoAnterior("")
                  }}
                  className="appearance-none w-40 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-slate-50 pr-8 focus:outline-none focus:ring-2 focus:ring-slate-300">
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

            {/* Divider */}
            <div className="w-px self-stretch bg-slate-100 shrink-0" />

            {/* Avatar + info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                {jugadorSeleccionado?.jugador?.posicion_principal
                  ? <img src={getPositionIcon(jugadorSeleccionado.jugador.posicion_principal)} alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = "/oso.png" }} />
                  : <User className="w-6 h-6 text-slate-300" />}
              </div>
              <div className="leading-tight min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {jugadorSeleccionado?.jugador
                    ? `${jugadorSeleccionado.jugador.nombres} ${jugadorSeleccionado.jugador.apellidos}`
                    : "—"}
                </p>
                <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">
                  {jugadorSeleccionado?.jugador
                    ? (getPositionName(jugadorSeleccionado.jugador.posicion_principal) ?? "—")
                    : ""}
                </p>
                <p className="text-xs text-slate-400">
                  {jugadorSeleccionado?.jugador
                    ? `Altura: ${jugadorSeleccionado.jugador.alcance_estatico ?? "N"} (m)`
                    : ""}
                </p>
              </div>
            </div>
          </div>

          {/* ── Panel de control ────────────────────────────────────────────── */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">

            {activeTab === "alcance" && (
              <>
                <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Inicio de test</span>
                <div className="flex gap-2">
                  <button onClick={handleCalibrar}
                    disabled={!cuentaSeleccionada || ["calibrating","jumping"].includes(faseAlcance)}
                    className={`flex-1 py-2.5 px-5 rounded-xl text-sm font-semibold transition-all active:scale-95
                      ${faseAlcance === "calibrating"
                        ? "bg-amber-100 text-amber-600 border border-amber-200 animate-pulse"
                        : "bg-slate-700 text-white hover:bg-slate-600"}
                      disabled:opacity-40 disabled:cursor-not-allowed`}>
                    {faseAlcance === "calibrating" ? "Calibrando…" : faseAlcance === "calibrated" ? "✓ Recalibrar" : "Calibrar"}
                  </button>
                  {faseAlcance !== "jumping" ? (
                    <button onClick={handleIniciarSalto} disabled={faseAlcance !== "calibrated"}
                      className="flex-1 py-2.5 px-5 rounded-xl text-sm font-semibold transition-all active:scale-95 bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed">
                      Iniciar
                    </button>
                  ) : (
                    <button onClick={handleFinalizarSalto}
                      className="flex-1 py-2.5 px-5 rounded-xl text-sm font-semibold transition-all active:scale-95 bg-red-600 text-white hover:bg-red-500 animate-pulse">
                      Detener
                    </button>
                  )}
                </div>
                {faseAlcance === "jumping" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>{alcanceSegundos}s</span>
                      <span>{ALCANCE_DURACION_SEG}s</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((alcanceSegundos / ALCANCE_DURACION_SEG) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                      <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Sesión activa</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "pruebas" && (
              <div className="flex items-center gap-4 h-full">
                {/* Tipo de prueba */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Seleccionar tipo de prueba</span>
                  <div className="flex gap-1">
                    {[{ key: "salto simple", label: "Salto simple" }, { key: "salto conos", label: "Salto cono" }].map(({ key, label }) => (
                      <button key={key} onClick={() => setTipoSalto(key)}
                        disabled={ejercicioEnCurso}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border whitespace-nowrap
                          ${tipoSalto === key ? "bg-slate-600 text-white border-slate-600" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"}
                          disabled:opacity-40 disabled:cursor-not-allowed`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px self-stretch bg-slate-100 shrink-0" />

                {/* Tiempo de uso */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Tiempo de uso</span>
                  <input
                    type="number"
                    value={tiempoPliometria}
                    onChange={(e) => setTiempoPliometria(e.target.value)}
                    placeholder="Agregar número"
                    min="10" max="300"
                    disabled={ejercicioEnCurso}
                    className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-slate-50 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-40"
                  />
                </div>

                {/* Botones — al extremo derecho */}
                <div className="flex flex-col gap-2 ml-auto shrink-0">
                  <button onClick={handleCalibrar}
                    disabled={!cuentaSeleccionada || ejercicioEnCurso}
                    className={`py-2.5 px-6 rounded-full text-sm font-semibold transition-all active:scale-95
                      ${pliometriaCalibrada ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-slate-700 text-white hover:bg-slate-600"}
                      disabled:opacity-40 disabled:cursor-not-allowed`}>
                    {pliometriaCalibrada ? "✓ Calibrado" : "Calibrar"}
                  </button>
                  {!ejercicioEnCurso ? (
                    <button onClick={iniciarPliometria}
                      disabled={!pliometriaCalibrada || !tiempoPliometria}
                      className="py-2.5 px-6 rounded-full text-sm font-semibold transition-all active:scale-95 bg-slate-600 text-white hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed">
                      Iniciar Prueba
                    </button>
                  ) : (
                    <button onClick={detenerPliometria}
                      className="py-2.5 px-6 rounded-full text-sm font-semibold transition-all active:scale-95 bg-red-600 text-white hover:bg-red-500 animate-pulse">
                      Detener
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <div className="flex justify-center">
          <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
            {[["alcance", "Test de Alcance"], ["pruebas", "Pruebas"]].map(([key, label], i, arr) => (
              <span key={key} className="flex items-stretch">
                <button onClick={() => setActiveTab(key)}
                  className={`px-14 sm:px-20 py-2.5 text-sm font-medium transition-colors whitespace-nowrap
                    ${activeTab === key ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}>
                  {label}
                </button>
                {i < arr.length - 1 && <span className="w-px bg-slate-200" />}
              </span>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB ALCANCE
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "alcance" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                Pasos a seguir para el jugador
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {[
                  {
                    step: 1, label: "Calibración",
                    desc: <>
                    
                    </>,
                  },
                  {
                    step: 2, label: "Inicio de prueba",
                    desc: <>
                     
                    </>,
                  },
                  {
                    step: 3, label: "Finalización de prueba",
                    desc: <>
                     </>,
                  },
                ].map(({ step, label, desc }) => (
                  <div key={step} className="flex flex-col gap-2">
                    <p className={`text-[10px] font-semibold uppercase tracking-widest text-center ${titleCls(stepState(step))}`}>{label}</p>
                    <div className={`rounded-xl border-2 ${borderCls(stepState(step))} bg-white overflow-hidden transition-all duration-300`}>
                      <div className="aspect-[3/4] flex items-center justify-center bg-slate-50">
                        <svg viewBox="0 0 100 140" className="w-20 sm:w-28" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {step === 1 && <><circle cx="50" cy="24" r="11" /><line x1="50" y1="35" x2="50" y2="82" /><line x1="50" y1="52" x2="30" y2="68" /><line x1="50" y1="52" x2="70" y2="68" /><line x1="50" y1="82" x2="35" y2="110" /><line x1="50" y1="82" x2="65" y2="110" /></>}
                          {step === 2 && <><circle cx="50" cy="32" r="11" /><path d="M50 43 Q46 58 38 70" /><path d="M50 43 Q54 58 62 70" /><path d="M44 64 Q36 82 30 96" /><path d="M56 64 Q64 82 70 96" /><path d="M80 55 L80 30" stroke="#cbd5e1" strokeWidth="1.5" /><path d="M75 36 L80 30 L85 36" stroke="#cbd5e1" strokeWidth="1.5" /></>}
                          {step === 3 && <><circle cx="50" cy="24" r="11" /><path d="M50 35 Q46 52 40 64" /><path d="M50 35 Q54 52 60 64" /><path d="M40 64 Q34 82 28 98" /><path d="M60 64 Q66 82 72 98" /><line x1="20" y1="108" x2="80" y2="108" strokeWidth="2.5" />{stepState(3) === "done" && <path d="M36 120 l8 8 l18 -14" stroke="#10b981" strokeWidth="2.5" />}</>}
                        </svg>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight px-1">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-600 text-center mb-4">Resultados</p>
                <div className="space-y-3">
                  {[
                    {
                      label: "Altura de alcance registrada",
                      value: resultadoFinal?.alcanceTotal
                        ? `${resultadoFinal.alcanceTotal} cm`
                        : saltoRTActual?.alcanceTotal ? `${saltoRTActual.alcanceTotal} cm` : "",
                      live: faseAlcance === "jumping" && !!saltoRTActual,
                    },
                    {
                      label: "Incremento respecto al anterior",
                      value: incrementoAnterior,
                      special: true,
                    },
                  ].map(({ label, value, live, special }) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold shrink-0">{label}</span>
                      <div className="relative w-36 shrink-0">
                        <input readOnly value={value}
                          className={`w-full border rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none transition-all text-center font-semibold text-slate-700
                            ${live ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200"}
                            ${special && value.startsWith("+") ? "text-emerald-600 border-emerald-200 bg-emerald-50" : ""}
                            ${special && value.startsWith("-") ? "text-red-500 border-red-200 bg-red-50" : ""}`} />
                        {live && <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-5">
                  <button onClick={handleGuardarAlcance}
                    disabled={faseAlcance !== "done" || !resultadoFinal || resultadoFinal._tipo === "cono"}
                    className="px-8 py-2.5 rounded-xl text-sm font-semibold bg-slate-700 text-white hover:bg-slate-600 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    Guardar
                  </button>
                </div>
              </div>
            </div>

            {primerSaltoSesion && (
              <FatigaCard primerSalto={primerSaltoSesion} ultimoSalto={ultimoSaltoSesion} totalSaltos={totalSaltosSesion} />
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB PRUEBAS  —  layout según wireframe
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "pruebas" && (
          <div className="space-y-5">

            {/* ── Pasos ── */}
            <div className="space-y-3">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                Pasos a seguir para el jugador
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {[
                  { label: "Calibración" },
                  { label: "Inicio de prueba" },
                  { label: "Finalización" },
                ].map(({ label }, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-center text-slate-400">{label}</p>
                    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
                      <div className="aspect-[3/4] flex items-center justify-center bg-slate-50 overflow-hidden">
                        <ImageSequence images={saltoImages} alt={label} delay={3000} className="w-full h-full object-contain" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Barra de progreso ── */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] uppercase tracking-widest font-semibold text-slate-500">Tiempo transcurrido</p>
                  <p className="text-[10px] font-mono text-slate-400">
                    {progresoSegundos}s {tiempoPliometria ? `/ ${tiempoPliometria}s` : ""}
                  </p>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-700 rounded-full transition-all duration-1000"
                    style={{
                      width: tiempoPliometria && progresoSegundos > 0
                        ? `${Math.min((progresoSegundos / parseFloat(tiempoPliometria)) * 100, 100)}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>

            {/* ── Panel de resultados centrado ── */}
            <div className="flex justify-center">
              <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-5 space-y-3">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-600 text-center">Resultados</p>

                <div className="space-y-2">
                  {[
                    {
                      label: "Saltos detectados",
                      value: resultadoFinal
                        ? `${resultadoFinal.saltos_validos}`
                        : saltoRTActual ? `${saltoRTActual.num}` : "",
                      isLive: !!saltoRTActual && !resultadoFinal,
                    },
                    {
                      label: "Índice de fatiga (%)",
                      value: (() => {
                        const IF = calcularIndiceFatiga(primerSaltoSesion, ultimoSaltoSesion)
                        return IF !== null ? `${IF}%` : ""
                      })(),
                      isLive: false,
                    },
                    {
                      label: "Fuerza máxima alcanzada",
                      value: resultadoFinal
                        ? `Izq: ${resultadoFinal.pico_izq_kg} kg  /  Der: ${resultadoFinal.pico_der_kg} kg`
                        : saltoRTActual
                          ? `Izq: ${saltoRTActual.pico_izq} kg  /  Der: ${saltoRTActual.pico_der} kg`
                          : "",
                      isLive: !!saltoRTActual && !resultadoFinal,
                    },
                    {
                      label: "Altura promedio",
                      value: resultadoFinal
                        ? `${resultadoFinal.alt_max_cm} cm`
                        : saltoRTActual ? `${saltoRTActual.altura_cm} cm` : "",
                      isLive: !!saltoRTActual && !resultadoFinal,
                    },
                  ].map(({ label, value, isLive }) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-[9px] uppercase tracking-wide text-slate-500 font-semibold shrink-0">
                        {label}
                      </span>
                      <div className="relative shrink-0">
                        <input
                          readOnly
                          value={value}
                          placeholder="—"
                          className={`w-44 border rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:outline-none text-center font-semibold text-slate-700 transition-all
                            ${isLive && value ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200"}`}
                        />
                        {isLive && value && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={finalizarPliometria}
                    disabled={!resultadoFinal || !pliometriaId}
                    className="px-8 py-2.5 rounded-xl text-sm font-semibold bg-slate-700 text-white hover:bg-slate-600 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    Guardar
                  </button>
                </div>
              </div>
            </div>

            {/* ── Tarjeta fatiga (si hay datos) ── */}
            {primerSaltoSesion && (
              <div className="flex justify-center">
                <div className="w-full max-w-lg">
                  <FatigaCard
                    primerSalto={primerSaltoSesion}
                    ultimoSalto={ultimoSaltoSesion}
                    totalSaltos={totalSaltosSesion}
                  />
                </div>
              </div>
            )}

          </div>
        )}

        {/* Monitor de mensajes */}
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