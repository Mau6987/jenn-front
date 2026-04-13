"use client"
import { useState, useEffect, useRef } from "react"
import { ChevronDown, User, CheckCircle, X } from "lucide-react"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"
const DEVICE_ID = "ESP-6"
const PUSHER_KEY = "4f85ef5c792df94cebc9"
const PUSHER_CLUSTER = "us2"
const ALCANCE_DURACION_SEG = 15
const CALIBRATION_TIMEOUT_MS = 15000

// ── IMÁGENES POR SECCIÓN ──────────────────────────────────────────────────
const ALCANCE_CALIBRACION_IMG    = "/calibraAlcance2.png"
const ALCANCE_INICIO_IMAGES      = ["/alcance1ima.png", "/alcance3.png", "/alcance2.png"]

const SALTO_SIMPLE_IMAGES = ["/saltosimple1.jpeg", "/saltosimple2.jpeg", "/saltosimple3.jpeg"]
const SALTO_CONOS_IMAGES  = ["/cono1ima.jpeg", "/cono2ima.jpeg", "/cono3ima.jpeg"]

// ── COMANDOS ──────────────────────────────────────────────────────────────
const CMD = {
  CALIBRAR:       "CALIBRAR",
  CANCELAR:       "CANCELAR",
  STOP:           "STOP",
  ESTADO:         "ESTADO",
  ALCANCE_TIMED:  (s) => `ALCANCE:${s}`,
  VERTICAL_TIMED: (s) => `VERTICAL:${s}`,
  CONO_TIMED:     (s) => `CONO:${s}`,
}

function addMessage(device, message, status, setMessages) {
  const timestamp = new Date().toLocaleTimeString()
  setMessages((prev) => [...prev, { device, message, status, timestamp }])
}

async function sendCommand(command, setMessages) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: DEVICE_ID, command, channel: `private-device-${DEVICE_ID}` }),
    })
    const data = await res.json()
    if (data.success || res.ok) addMessage("SISTEMA", `Comando enviado: ${command}`, "success", setMessages)
    else addMessage("SISTEMA", `Error: ${data.message || "desconocido"}`, "error", setMessages)
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
  subscribeToESP(pusher)
}

function calcularIndiceFatiga(primerSalto, ultimoSalto) {
  if (!primerSalto || !ultimoSalto) return null
  const fInicial = parseFloat(primerSalto.pico_izq) + parseFloat(primerSalto.pico_der)
  const fFinal   = parseFloat(ultimoSalto.pico_izq)  + parseFloat(ultimoSalto.pico_der)
  if (fInicial <= 0) return null
  return ((fInicial - fFinal) / fInicial * 100).toFixed(1)
}

// ── CARRUSEL ───────────────────────────────────────────────────────────────
function Carrusel({ images, alt }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (images.length <= 1) return
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 2500)
    return () => clearInterval(t)
  }, [images])
  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg,#f8fafc,#fff)" }}
    >
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`${alt} ${i + 1}`}
          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-700"
          style={{ opacity: i === idx ? 1 : 0 }}
        />
      ))}
    </div>
  )
}

// ── TOAST ──────────────────────────────────────────────────────────────────
function Toast({ notification, onClose }) {
  if (!notification) return null
  const isOk = notification.type === "success"
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium max-w-sm"
      style={{
        background: isOk ? "#f0fdf4" : "#faf5f5",
        border: `1px solid ${isOk ? "#86efac" : "#d6c4c4"}`,
        color: isOk ? "#166534" : "#6b3535",
        boxShadow: isOk ? "0 4px 12px rgba(16,185,129,.12)" : "0 4px 12px rgba(107,53,53,.12)",
      }}>
      {isOk ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> : <X className="w-4 h-4 text-red-700 shrink-0" />}
      <span className="truncate">{notification.message}</span>
      <button onClick={onClose} className="ml-auto opacity-50 hover:opacity-100 shrink-0"><X className="w-3.5 h-3.5" /></button>
    </div>
  )
}

// ── MODAL RESULTADO ────────────────────────────────────────────────────────
function ResultModal({ isOpen, onClose, title, data }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6" style={{ boxShadow: "0 12px 32px rgba(0,0,0,.08)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
              <p className="text-sm font-semibold text-gray-900">{v}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-5 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95"
          style={{ background: "#8b4545", color: "#fff" }}>
          Cerrar y Limpiar
        </button>
      </div>
    </div>
  )
}

// ── MODAL CALIBRACIÓN ──────────────────────────────────────────────────────
function CalibrationModal({ isOpen, calibrationStatus, onClose, onCancel }) {
  const [countdown, setCountdown] = useState(10)
  const [errorCountdown, setErrorCountdown] = useState(6)
  const countdownRef = useRef(null)
  const errorCountdownRef = useRef(null)

  useEffect(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    if (!isOpen || calibrationStatus !== "calibrating") { setCountdown(10); return }
    setCountdown(10)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownRef.current); countdownRef.current = null; return 0 }
        return prev - 1
      })
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [isOpen, calibrationStatus])

  useEffect(() => {
    if (errorCountdownRef.current) { clearInterval(errorCountdownRef.current); errorCountdownRef.current = null }
    if (!isOpen || calibrationStatus !== "failed") { setErrorCountdown(6); return }
    setErrorCountdown(6)
    errorCountdownRef.current = setInterval(() => {
      setErrorCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(errorCountdownRef.current)
          errorCountdownRef.current = null
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (errorCountdownRef.current) clearInterval(errorCountdownRef.current) }
  }, [isOpen, calibrationStatus])

  if (!isOpen) return null
  const isCalibrationFailed  = calibrationStatus === "failed"
  const isCalibrationSuccess = calibrationStatus === "success"
  const isCalibrating        = !isCalibrationSuccess && !isCalibrationFailed

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-8 text-center relative" style={{ boxShadow: "0 12px 32px rgba(0,0,0,.08)" }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <X className="h-4 w-4 text-gray-500" />
        </button>
        {isCalibrating && (
          <>
            <div className="w-48 h-48 mx-auto mb-5">
              <img src="/calibrar1.png" alt="Calibrando" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Calibrando...</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
              <p className="text-sm font-semibold text-amber-800 leading-snug">
                JUGADOR DEBE PERMANECER QUIETO Y DE PIE DURANTE{" "}
                <span
                  className="inline-block text-2xl font-extrabold tabular-nums align-middle"
                  style={{ color: countdown === 0 ? "#059669" : "#d97706", minWidth: 28, transition: "color .3s" }}
                >
                  ({countdown})
                </span>{" "}
                segundos
              </p>
            </div>
            <button onClick={onCancel} className="w-full py-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-semibold hover:bg-red-100 transition-colors">
              Cancelar calibración
            </button>
          </>
        )}
        {isCalibrationSuccess && (
          <>
            <div className="w-48 h-48 mx-auto mb-5">
              <img src="/calibrarbien.png" alt="Calibrado correctamente" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-xl font-bold text-green-700 mb-1">¡Calibrado!</h3>
            <p className="text-sm text-gray-600">Sensores listos</p>
          </>
        )}
        {isCalibrationFailed && (
          <>
            <div className="w-48 h-48 mx-auto mb-5">
              <img src="/calibrarmal.png" alt="Error en calibración" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-xl font-bold text-red-700 mb-1">Error de calibración</h3>
            <p className="text-sm text-gray-600 mb-2">
              Asegúrate que el jugador esté quieto y de pie sobre las celdas
            </p>
            <p className="text-xs text-gray-400 mb-4 font-mono">
              Cerrando en{" "}
              <span className="font-bold text-red-400">{errorCountdown}s</span>
              ...
            </p>
            <button
              onClick={() => {
                if (errorCountdownRef.current) { clearInterval(errorCountdownRef.current); errorCountdownRef.current = null }
                onCancel()
              }}
              className="w-full py-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              Volver a calibrar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── BATTERY ICON ───────────────────────────────────────────────────────────
function BatteryIcon({ nivel, porcentaje, voltaje }) {
  // nivel: "normal" | "alerta" | "critico" | null (desconocido)
  const barColors = {
    normal:  ["#1A7A5E", "#1A7A5E", "#1A7A5E"],
    alerta:  ["#C2620A", "#C2620A", "#E8E8E8"],
    critico: ["#B03030", "#E8E8E8", "#E8E8E8"],
    null:    ["#E8E8E8", "#E8E8E8", "#E8E8E8"],
  }
  const colors = barColors[nivel] || barColors[null]
  const labelColor = nivel === "normal" ? "#1A7A5E" : nivel === "alerta" ? "#C2620A" : nivel === "critico" ? "#B03030" : "#6B6B6B"

  return (
    <div
      title={voltaje ? `${voltaje.toFixed(2)}V · ${porcentaje}%` : "Sin datos de batería"}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "default" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
        <div style={{
          width: 18, height: 10,
          border: `1.5px solid ${colors[0] === "#E8E8E8" ? "#d1d5db" : colors[0]}`,
          borderRadius: 2, padding: "1px 2px",
          display: "flex", alignItems: "center", gap: 1, background: "#fff",
        }}>
          {colors.map((c, i) => (
            <div key={i} style={{ flex: 1, height: "100%", borderRadius: 1, background: c, transition: "background 0.4s" }} />
          ))}
        </div>
        {/* Terminal positivo */}
        <div style={{
          width: 2, height: 5,
          background: colors[0] === "#E8E8E8" ? "#d1d5db" : colors[0],
          borderRadius: "0 1px 1px 0", transition: "background 0.4s",
        }} />
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
        color: labelColor, fontFamily: "monospace", lineHeight: 1,
      }}>
        {porcentaje !== null ? `${porcentaje}%` : "—"}
      </span>
    </div>
  )
}

// ── FATIGA ─────────────────────────────────────────────────────────────────
function FatigaCard({ primerSalto, ultimoSalto, totalSaltos }) {
  const IF = calcularIndiceFatiga(primerSalto, ultimoSalto)
  const fInicial    = primerSalto ? (parseFloat(primerSalto.pico_izq) + parseFloat(primerSalto.pico_der)).toFixed(2) : "—"
  const fFinal      = ultimoSalto ? (parseFloat(ultimoSalto.pico_izq) + parseFloat(ultimoSalto.pico_der)).toFixed(2) : "—"
  const fInicialIzq = primerSalto ? parseFloat(primerSalto.pico_izq).toFixed(2) : "—"
  const fInicialDer = primerSalto ? parseFloat(primerSalto.pico_der).toFixed(2) : "—"
  const fFinalIzq   = ultimoSalto ? parseFloat(ultimoSalto.pico_izq).toFixed(2)  : "—"
  const fFinalDer   = ultimoSalto ? parseFloat(ultimoSalto.pico_der).toFixed(2)  : "—"
  const nivel = IF === null ? "slate" : parseFloat(IF) < 0 ? "blue" : parseFloat(IF) < 10 ? "emerald" : parseFloat(IF) < 20 ? "amber" : "red"
  const palettes = {
    slate:   { grad: "from-gray-50 to-white",   accent: "#78716c", bar: "#a89968", label: "Sin datos suficientes",                      badgeBg: "#f5f5f5", badgeText: "#5a5a5a" },
    blue:    { grad: "from-red-50 to-white",    accent: "#a83a3a", bar: "#c85a5a", label: "↑ Fuerza en aumento — activación progresiva", badgeBg: "#ffe8e8", badgeText: "#8b3535" },
    emerald: { grad: "from-green-50 to-white", accent: "#16a34a", bar: "#4ade80", label: "✓ Fatiga baja — rendimiento sostenido",       badgeBg: "#f0fdf4", badgeText: "#166534" },
    amber:   { grad: "from-yellow-50 to-white",   accent: "#d97706", bar: "#fbbf24", label: "⚠ Fatiga moderada — monitorear",             badgeBg: "#fffbeb", badgeText: "#92400e" },
    red:     { grad: "from-orange-50 to-white",     accent: "#dc2626", bar: "#f87171", label: "✗ Fatiga alta — considerar descanso",         badgeBg: "#fff1f2", badgeText: "#991b1b" },
  }
  const p = palettes[nivel]
  const barPct = IF === null ? 0 : parseFloat(IF) < 0 ? Math.min(Math.abs(parseFloat(IF)) * 3, 30) : Math.min(parseFloat(IF) * 3, 100)
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${p.grad} p-6 space-y-5`}
      style={{ border: `1px solid ${p.accent}20`, boxShadow: `0 2px 12px ${p.accent}08` }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-600">Índice de Fatiga</p>
        <span className="text-[9px] uppercase tracking-wider font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: p.badgeBg, color: p.badgeText }}>{totalSaltos} saltos</span>
      </div>
      <div className="bg-white/70 rounded-lg border border-gray-200 p-4 flex flex-col items-center gap-1.5">
        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">Fórmula</p>
        <div className="flex items-center gap-2 text-gray-600 text-[11px] font-mono">
          <span className="font-semibold text-gray-800 text-sm">IF</span>
          <span className="text-gray-400 text-lg">=</span>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-gray-700 whitespace-nowrap">F<sub>i</sub> − F<sub>f</sub></span>
            <div className="w-full h-px bg-gray-300 my-0.5" />
            <span className="text-gray-500 whitespace-nowrap">F<sub>i</sub></span>
          </div>
          <span className="text-gray-400">×</span><span className="font-medium text-gray-700">100</span>
        </div>
        <p className="text-[9px] text-gray-400 mt-0.5">F = pico izq. + pico der. (kgf)</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "F inicial", main: fInicial, sub: [`Izq: ${fInicialIzq}`, `Der: ${fInicialDer}`], hi: false },
          { label: "F final",   main: fFinal,   sub: [`Izq: ${fFinalIzq}`,   `Der: ${fFinalDer}`],   hi: false },
          { label: "IF (%)",    main: IF !== null ? `${IF}%` : "—",
            sub: [IF === null ? "—" : parseFloat(IF) < 0 ? "↑ mejora" : parseFloat(IF) < 10 ? "baja" : parseFloat(IF) < 20 ? "moderada" : "alta"],
            hi: true },
        ].map(({ label, main, sub, hi }) => (
          <div key={label} className="flex flex-col items-center bg-white rounded-lg p-3 gap-1"
            style={{ border: hi ? `1.5px solid ${p.accent}30` : "1px solid #e5e5e5", boxShadow: hi ? `0 1px 8px ${p.accent}08` : "none" }}>
            <p className="text-[9px] uppercase tracking-wide text-gray-500 text-center font-semibold">{label}</p>
            <p className="text-base font-bold" style={{ color: hi ? p.accent : "#2d2d2d" }}>{main}</p>
            {sub.map((s, i) => <p key={i} className="text-[9px] text-gray-500 text-center">{s}</p>)}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="w-full h-1.5 bg-gray-300 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barPct}%`, background: p.bar }} />
        </div>
        <p className="text-[10px] font-medium text-center text-gray-700" style={{ color: p.accent }}>{p.label}</p>
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
  const [espBattery, setEspBattery]                     = useState(null)
  const [messages, setMessages]                         = useState([])
  const [notification, setNotification]                 = useState(null)
  const [activeTab, setActiveTab]                       = useState("alcance")

  const [faseAlcance, setFaseAlcance]                   = useState("idle")
  const [incrementoAnterior, setIncrementoAnterior]     = useState("")
  const [ultimoAlcance, setUltimoAlcance]               = useState(null)
  const [alcanceGuardado, setAlcanceGuardado]           = useState(null)
  const [modalAlcanceOpen, setModalAlcanceOpen]         = useState(false)
  const [alcanceSegundos, setAlcanceSegundos]           = useState(0)

  const [calibrationModalOpen, setCalibrationModalOpen] = useState(false)
  const [isCalibrated, setIsCalibrated]                 = useState(false)
  const [calibrationStatus, setCalibrationStatus]       = useState("calibrating")
  const [calibracionOrigen, setCalibracionOrigen]       = useState(null)
  const calibrationTimerRef    = useRef(null)
  const calibrationAutoCloseRef = useRef(null)
  const calibrandoRef          = useRef(false)

  const alcanceTimerRef = useRef(null)

  const [tiempoPrueba, setTiempoPrueba]                 = useState("60")
  const [tipoSalto, setTipoSalto]                       = useState("salto simple")
  const [pruebaId, setPruebaId]                         = useState(null)
  const [pruebaCalibrada, setPruebaCalibrada]           = useState(false)
  const [pruebaIniciada, setPruebaIniciada]             = useState(false)
  const [ejercicioEnCurso, setEjercicioEnCurso]         = useState(false)
  const [pruebaGuardada, setPruebaGuardada]             = useState(null)
  const [modalPruebaOpen, setModalPruebaOpen]           = useState(false)
  const [progresoSegundos, setProgresoSegundos]         = useState(0)
  const [saltoRTActual, setSaltoRTActual]               = useState(null)
  const [saltoFlash, setSaltoFlash]                     = useState(false)
  const [ultimaAlturaCono, setUltimaAlturaCono]         = useState(null)
  const [resultadoFinal, setResultadoFinal]             = useState(null)

  const [primerSaltoSesion, setPrimerSaltoSesion]       = useState(null)
  const [ultimoSaltoSesion, setUltimoSaltoSesion]       = useState(null)
  const [totalSaltosSesion, setTotalSaltosSesion]       = useState(0)
  const [alturasSesion, setAlturasSesion]               = useState([])

  const [alcanceCalibracionDone, setAlcanceCalibracionDone] = useState(false)
  const [pruebaCalibracionDone, setPruebaCalibracionDone]   = useState(false)

  const saltoConosContadorRef = useRef(0)
  const progresoTimerRef      = useRef(null)
  const jugadorRef            = useRef(null)
  const tipoSaltoRef          = useRef(tipoSalto)
  const ultimoAlcanceRef      = useRef(null)

  const jugadorSeleccionado = cuentas.find((c) => c.id === Number(cuentaSeleccionada))

  useEffect(() => { jugadorRef.current   = jugadorSeleccionado }, [jugadorSeleccionado])
  useEffect(() => { tipoSaltoRef.current = tipoSalto },          [tipoSalto])

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
    setAlturasSesion([])
  }

  const onCalibrationSuccess = () => {
    if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }
    calibrandoRef.current = false
    setCalibrationStatus("success")

    if (calibracionOrigen === "alcance") {
      setIsCalibrated(true)
      setFaseAlcance("calibrated")
      setAlcanceCalibracionDone(true)
    } else if (calibracionOrigen === "pruebas") {
      setPruebaCalibrada(true)
      setPruebaCalibracionDone(true)
    }

    setCalibrationModalOpen(true)

    if (calibrationAutoCloseRef.current) clearTimeout(calibrationAutoCloseRef.current)
    calibrationAutoCloseRef.current = setTimeout(() => {
      calibrationAutoCloseRef.current = null
      setCalibrationModalOpen(false)
    }, 5000)

    notify("success", "¡Calibrado! — listo para iniciar")
  }

  const triggerCalibrationFailed = () => {
    if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }
    if (calibrationAutoCloseRef.current) { clearTimeout(calibrationAutoCloseRef.current); calibrationAutoCloseRef.current = null }
    calibrandoRef.current = false
    setCalibrationStatus("failed")

    if (calibracionOrigen === "alcance") {
      setIsCalibrated(false)
      setFaseAlcance("idle")
      setAlcanceCalibracionDone(false)
    } else if (calibracionOrigen === "pruebas") {
      setPruebaCalibrada(false)
      setPruebaCalibracionDone(false)
    }

    setCalibrationModalOpen(true)
    notify("error", "Error de calibración — intenta nuevamente")
  }

  const subscribeToESP = (pusher) => {
    const channel = pusher.subscribe(`private-device-${DEVICE_ID}`)

    channel.bind("pusher:subscription_succeeded", () => {
      setEspConnected(true)
      addMessage(DEVICE_ID, "Conectado", "success", setMessages)
      notify("success", "ESP-6 conectado")
    })
    channel.bind("pusher:subscription_error", (err) => {
      addMessage("SISTEMA", `Error: ${JSON.stringify(err)}`, "error", setMessages)
    })

    // ── Evento de batería ──────────────────────────────────────────────────
    channel.bind("client-bateria_estado", (data) => {
      let payload = data
      if (typeof data.data === "string") {
        try { payload = JSON.parse(data.data) } catch { payload = data }
      }
      const { nivel, porcentaje, voltaje } = payload
      if (nivel) {
        setEspBattery({ nivel, porcentaje: porcentaje ?? null, voltaje: voltaje ?? null })
        if (nivel === "critico") {
          notify("error", `🔋 Batería crítica en ESP-6 (${voltaje?.toFixed(2)}V)`)
        }
      }
    })

    channel.bind("client-response", (data) => {
      let rawMsg = data.message || ""
      if (typeof rawMsg === "object") rawMsg = JSON.stringify(rawMsg)
      try { const p = JSON.parse(rawMsg); if (p?.message) rawMsg = p.message } catch (_) {}
      const msg = String(rawMsg).trim()
      addMessage(DEVICE_ID, msg, "success", setMessages)

      if (msg.includes("CALIBRADO_OK")) {
        onCalibrationSuccess()
        return
      }

      if (msg.includes("CALIBRACION_CANCELADA") || msg.includes("ERROR_CALIBRACION")) {
        if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }
        if (calibrationAutoCloseRef.current) { clearTimeout(calibrationAutoCloseRef.current); calibrationAutoCloseRef.current = null }
        calibrandoRef.current = false

        if (msg.includes("ERROR_CALIBRACION")) {
          triggerCalibrationFailed()
        } else {
          if (calibracionOrigen === "alcance") { setFaseAlcance("idle"); setIsCalibrated(false); setAlcanceCalibracionDone(false) }
          else if (calibracionOrigen === "pruebas") { setPruebaCalibrada(false); setPruebaCalibracionDone(false) }
          setCalibrationModalOpen(false)
          setCalibrationStatus("calibrating")
          notify("error", "Calibración cancelada")
        }
        return
      }

      if (msg.includes("SESION_INICIADA")) {
        setEjercicioEnCurso(true)
        setSaltoRTActual(null)
        setResultadoFinal(null)
        saltoConosContadorRef.current = 0
        resetFatiga()
        if (calibracionOrigen === "alcance" || faseAlcance === "jumping") {
          setFaseAlcance("jumping")
        }
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
          const currentTipo = tipoSaltoRef.current
          const alcanceEstaticoCm = getAlcanceEstaticoCm()
          const alcanceTotal = parseFloat((alcanceEstaticoCm + json.altura_cm).toFixed(1))

          const picoIzq = parseFloat(json.pico_izq_kgf ?? json.pico_izq ?? 0)
          const picoDer = parseFloat(json.pico_der_kgf ?? json.pico_der ?? 0)

          const saltoFatiga = { pico_izq: picoIzq, pico_der: picoDer }
          setPrimerSaltoSesion((prev) => prev ?? saltoFatiga)
          setUltimoSaltoSesion(saltoFatiga)
          setTotalSaltosSesion((prev) => prev + 1)
          setAlturasSesion((prev) => [...prev, json.altura_cm])
          saltoConosContadorRef.current += 1
          const numSalto = saltoConosContadorRef.current

          setSaltoFlash(true)
          setTimeout(() => setSaltoFlash(false), 400)

          const saltoData = {
            num: numSalto,
            altura_cm: json.altura_cm,
            alcanceTotal,
            pico_izq: picoIzq,
            pico_der: picoDer,
          }

          if (currentTipo === "salto conos") {
            setSaltoRTActual(saltoData)
            setUltimaAlturaCono(json.altura_cm)
          } else {
            setSaltoRTActual((prev) => (!prev || json.altura_cm > prev.altura_cm) ? saltoData : prev)
          }

          addMessage(DEVICE_ID, `Salto #${numSalto} — ${json.altura_cm}cm | Izq:${picoIzq.toFixed(2)} Der:${picoDer.toFixed(2)} kgf`, "success", setMessages)
        } catch (e) {
          addMessage(DEVICE_ID, `Error SALTO_JSON: ${e.message}`, "error", setMessages)
        }
        return
      }

      if (msg.startsWith("RESULTADO_JSON:")) {
        try {
          const json = JSON.parse(msg.slice("RESULTADO_JSON:".length))
          const currentTipo = tipoSaltoRef.current
          const alcanceEstaticoCm = getAlcanceEstaticoCm()
          const altMax = Number(json.alt_max_cm ?? 0)
          const alcanceTotal = parseFloat((alcanceEstaticoCm + altMax).toFixed(1))

          const picoIzq = parseFloat(
            json.fuerza_max_izq_kgf ??
            json.fuerza_izq          ??
            json.pico_izq_kg         ??
            json.pico_izq            ??
            0
          )
          const picoDer = parseFloat(
            json.fuerza_max_der_kgf ??
            json.fuerza_der          ??
            json.pico_der_kg         ??
            json.pico_der            ??
            0
          )

          const numSaltos = json.saltos ?? json.saltos_validos ?? saltoConosContadorRef.current
          const altPromedio = alturasSesion.length > 0
            ? (alturasSesion.reduce((a, b) => a + b, 0) / alturasSesion.length).toFixed(1)
            : altMax.toFixed(1)

          const resultado = {
            _tipo: json.modo ?? (currentTipo === "salto conos" ? "cono" : "vertical"),
            saltos_validos: numSaltos,
            alt_max_cm:    altMax.toFixed(1),
            alt_promedio_cm: altPromedio,
            pico_izq_kg:   picoIzq.toFixed(2),
            pico_der_kg:   picoDer.toFixed(2),
            alcanceEstaticoCm: parseFloat(alcanceEstaticoCm.toFixed(1)),
            alcanceTotal,
          }

          if (resultado._tipo !== "cono") {
            const previo = ultimoAlcanceRef.current
            setIncrementoAnterior(
              previo?.alcance != null
                ? `${(alcanceTotal - parseFloat(previo.alcance)) >= 0 ? "+" : ""}${(alcanceTotal - parseFloat(previo.alcance)).toFixed(1)} cm`
                : "Sin registro previo"
            )
          }

          setResultadoFinal(resultado)
          setEjercicioEnCurso(false)

          if (progresoTimerRef.current) { clearInterval(progresoTimerRef.current); progresoTimerRef.current = null }
          if (alcanceTimerRef.current)  { clearInterval(alcanceTimerRef.current);  alcanceTimerRef.current  = null }

          setFaseAlcance("done")
          notify("success", "Prueba finalizada — presiona Guardar")
        } catch (e) {
          addMessage(DEVICE_ID, `Error RESULTADO_JSON: ${e.message}`, "error", setMessages)
        }
        return
      }
    })

    channel.bind("client-status", (data) => {
      if (data?.status === "connected") setEspConnected(true)
    })
  }

  const handleCalibrar = async (origen = "alcance") => {
    if (!jugadorSeleccionado) { notify("error", "Selecciona un jugador primero"); return }
    if (calibrandoRef.current) return
    if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }
    if (calibrationAutoCloseRef.current) { clearTimeout(calibrationAutoCloseRef.current); calibrationAutoCloseRef.current = null }

    calibrandoRef.current = true
    setCalibracionOrigen(origen)

    if (origen === "alcance") {
      setFaseAlcance("calibrating")
      setSaltoRTActual(null)
      setResultadoFinal(null)
      setIncrementoAnterior("")
      setIsCalibrated(false)
      setAlcanceCalibracionDone(false)
    } else if (origen === "pruebas") {
      setPruebaCalibrada(false)
      setPruebaCalibracionDone(false)
      setEjercicioEnCurso(false)
      setResultadoFinal(null)
      setSaltoRTActual(null)
      resetFatiga()
    }

    setCalibrationStatus("calibrating")
    setCalibrationModalOpen(true)
    resetFatiga()

    await sendCommand(CMD.CALIBRAR, setMessages)

    calibrationTimerRef.current = setTimeout(() => {
      calibrationTimerRef.current = null
      if (calibrandoRef.current) triggerCalibrationFailed()
    }, CALIBRATION_TIMEOUT_MS)
  }

  const handleCancelarCalibracion = async () => {
    if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }
    if (calibrationAutoCloseRef.current) { clearTimeout(calibrationAutoCloseRef.current); calibrationAutoCloseRef.current = null }
    calibrandoRef.current = false

    setCalibrationModalOpen(false)
    if (calibracionOrigen === "alcance") { setIsCalibrated(false); setFaseAlcance("idle"); setAlcanceCalibracionDone(false) }
    else if (calibracionOrigen === "pruebas") { setPruebaCalibrada(false); setPruebaCalibracionDone(false) }
    setCalibrationStatus("calibrating")

    await sendCommand(CMD.CANCELAR, setMessages)
    notify("error", "Cancelación enviada al ESP")
  }

  const handleCerrarModalCalibracion = () => {
    if (calibrationAutoCloseRef.current) {
      clearTimeout(calibrationAutoCloseRef.current)
      calibrationAutoCloseRef.current = null
    }
    setCalibrationModalOpen(false)
    if (calibrationStatus !== "success") {
      setCalibrationStatus("calibrating")
    }
  }

  const handleIniciarSalto = async () => {
    setSaltoRTActual(null)
    setResultadoFinal(null)
    setIncrementoAnterior("")
    setAlcanceSegundos(0)
    saltoConosContadorRef.current = 0
    resetFatiga()
    setFaseAlcance("jumping")
    setEjercicioEnCurso(true)

    await sendCommand(CMD.ALCANCE_TIMED(ALCANCE_DURACION_SEG), setMessages)

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
    await sendCommand(CMD.STOP, setMessages)
  }

  const handleGuardarAlcance = async () => {
    if (!resultadoFinal || !cuentaSeleccionada) return
    if (resultadoFinal._tipo === "cono") { notify("error", "El salto con conos no guarda alcance"); return }
    const IF = calcularIndiceFatiga(primerSaltoSesion, ultimoSaltoSesion)
    try {
      const res = await fetch(`${BACKEND_URL}/api/alcances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuentaId: Number(cuentaSeleccionada),
          alcance: resultadoFinal.alcanceTotal,
          indice_fatiga: IF,
        }),
      })
      const d = await res.json()
      if (d.success) {
        setAlcanceGuardado({
          "Alcance registrado":      `${resultadoFinal.alcanceTotal} cm`,
          "Altura promedio":         `${resultadoFinal.alt_promedio_cm} cm`,
          "Alcance estático":        `${resultadoFinal.alcanceEstaticoCm} cm`,
          ...(IF !== null && { "Índice de fatiga": `${IF}%` }),
        })
        setModalAlcanceOpen(true)
        notify("success", "Guardado correctamente")
      }
    } catch (e) {
      console.error(e)
      notify("error", "Error al guardar")
    }
  }

  const cerrarModalAlcance = () => {
    setModalAlcanceOpen(false)
    setAlcanceGuardado(null)
    setFaseAlcance("idle")
    setIsCalibrated(false)
    setAlcanceCalibracionDone(false)
    setSaltoRTActual(null)
    setResultadoFinal(null)
    setIncrementoAnterior("")
    setAlcanceSegundos(0)
    setEjercicioEnCurso(false)
    resetFatiga()

    if (cuentaSeleccionada) {
      fetch(`${BACKEND_URL}/api/alcances/ultimo/${cuentaSeleccionada}`)
        .then((r) => r.json())
        .then((d) => { setUltimoAlcance(d.data ?? null); ultimoAlcanceRef.current = d.data ?? null })
        .catch(console.error)
    }
  }

  const iniciarPrueba = async () => {
    if (!cuentaSeleccionada)  { notify("error", "Selecciona un jugador primero"); return }
    const duracion = Math.round(Number.parseFloat(tiempoPrueba))
    if (!tiempoPrueba || duracion <= 0) { notify("error", "Ingresa un tiempo válido"); return }

    try {
      const res = await fetch(`${BACKEND_URL}/api/saltos/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: Number(cuentaSeleccionada), tipo: tipoSalto, tiempo: duracion }),
      })
      const d = await res.json()
      if (d.success) setPruebaId(d.data.id)
    } catch (e) { console.error(e) }

    setSaltoRTActual(null)
    setResultadoFinal(null)
    setProgresoSegundos(0)
    setSaltoFlash(false)
    setUltimaAlturaCono(null)
    saltoConosContadorRef.current = 0
    resetFatiga()
    setEjercicioEnCurso(true)
    setPruebaIniciada(true)

    const comando = tipoSaltoRef.current === "salto conos"
      ? CMD.CONO_TIMED(duracion)
      : CMD.VERTICAL_TIMED(duracion)
    await sendCommand(comando, setMessages)

    if (progresoTimerRef.current) clearInterval(progresoTimerRef.current)
    progresoTimerRef.current = setInterval(() => {
      setProgresoSegundos((prev) => {
        const next = prev + 1
        if (next >= duracion) {
          clearInterval(progresoTimerRef.current)
          progresoTimerRef.current = null
        }
        return next
      })
    }, 1000)

    notify("success", `Prueba de ${duracion}s iniciada`)
  }

  const detenerPrueba = async () => {
    if (!pruebaIniciada && !ejercicioEnCurso) { notify("error", "No hay prueba activa"); return }
    if (progresoTimerRef.current) { clearInterval(progresoTimerRef.current); progresoTimerRef.current = null }
    await sendCommand(CMD.STOP, setMessages)
  }

  const cancelarPrueba = async () => {
    if (!pruebaIniciada && !ejercicioEnCurso) { notify("error", "No hay prueba activa"); return }
    if (progresoTimerRef.current) { clearInterval(progresoTimerRef.current); progresoTimerRef.current = null }
    await sendCommand(CMD.STOP, setMessages)
    setPruebaId(null)
    setPruebaIniciada(false)
    setPruebaGuardada(null)
    setPruebaCalibracionDone(false)
    setEjercicioEnCurso(false)
    setProgresoSegundos(0)
    setTiempoPrueba("60")
    setSaltoRTActual(null)
    setResultadoFinal(null)
    setIncrementoAnterior("")
    setFaseAlcance("idle")
    saltoConosContadorRef.current = 0
    resetFatiga()
    notify("error", "Prueba cancelada")
  }

  const finalizarPrueba = async () => {
    if (!pruebaId || !resultadoFinal) { notify("error", "No hay datos para guardar"); return }
    const IF = calcularIndiceFatiga(primerSaltoSesion, ultimoSaltoSesion)
    try {
      const res = await fetch(`${BACKEND_URL}/api/saltos/finalizar/${pruebaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saltos_validos:  resultadoFinal.saltos_validos,
          alt_promedio_cm: resultadoFinal.alt_promedio_cm,
          alt_max_cm:      resultadoFinal.alt_max_cm,
          pico_izq_kg:     resultadoFinal.pico_izq_kg,
          pico_der_kg:     resultadoFinal.pico_der_kg,
          indice_fatiga:   IF,
          ...(resultadoFinal._tipo !== "cono" && { alcanceTotal: resultadoFinal.alcanceTotal }),
        }),
      })
      const d = await res.json()
      if (d.success) {
        setPruebaGuardada({
          "Tipo de salto":           tipoSalto,
          "Saltos válidos":          `${resultadoFinal.saltos_validos}`,
          "Altura promedio":         `${resultadoFinal.alt_promedio_cm} cm`,
          "Fuerza pico izq. (kgf)":  `${resultadoFinal.pico_izq_kg}`,
          "Fuerza pico der. (kgf)":  `${resultadoFinal.pico_der_kg}`,
          ...(IF !== null && { "Índice de fatiga": `${IF}%` }),
        })
        setModalPruebaOpen(true)
        notify("success", "Prueba guardada")
      }
    } catch (e) { console.error(e) }
  }

  const cerrarModalPrueba = () => {
    setModalPruebaOpen(false)
    setPruebaId(null)
    setPruebaIniciada(false)
    setPruebaGuardada(null)
    setPruebaCalibracionDone(false)
    setEjercicioEnCurso(false)
    setProgresoSegundos(0)
    setTiempoPrueba("60")
    if (progresoTimerRef.current) { clearInterval(progresoTimerRef.current); progresoTimerRef.current = null }
    setSaltoRTActual(null)
    setResultadoFinal(null)
    setIncrementoAnterior("")
    setFaseAlcance("idle")
    saltoConosContadorRef.current = 0
    resetFatiga()
  }

  const stepState = (step) => {
    if (step === 1) return faseAlcance === "calibrating" ? "active" : ["calibrated","jumping","done"].includes(faseAlcance) ? "done" : "idle"
    if (step === 2) return faseAlcance === "jumping" ? "active" : faseAlcance === "done" ? "done" : "idle"
    return faseAlcance === "done" ? "done" : faseAlcance === "jumping" ? "active" : "idle"
  }

  const pruebaStepState = (step) => {
    if (step === 1) return pruebaCalibracionDone ? "done" : ejercicioEnCurso ? "idle" : "idle"
    if (step === 2) return ejercicioEnCurso ? "active" : resultadoFinal ? "done" : "idle"
    return "idle"
  }

  const card = { background: "rgba(255,255,255,.82)", backdropFilter: "blur(16px)", border: "1px solid rgba(148,163,184,.2)", boxShadow: "0 4px 24px rgba(148,163,184,.1)", borderRadius: 24 }

  const pillBtn = (active, disabled) => ({
    borderRadius: 50,
    background: disabled ? "#f1f5f9" : active ? "linear-gradient(135deg,#1e293b,#334155)" : "#f1f5f9",
    color: disabled ? "#94a3b8" : active ? "#fff" : "#64748b",
    border: active || disabled ? "none" : "1.5px solid #e2e8f0",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all .18s cubic-bezier(.4,0,.2,1)",
    boxShadow: active && !disabled ? "0 4px 16px rgba(30,41,59,.22)" : "none",
  })

  const getPruebasCarrusel = () =>
    tipoSalto === "salto conos" ? SALTO_CONOS_IMAGES : SALTO_SIMPLE_IMAGES

  // ── Helpers de batería ─────────────────────────────────────────────────
  const batteryBorderColor = espBattery
    ? espBattery.nivel === "normal"  ? "#10b981"
    : espBattery.nivel === "alerta"  ? "#f59e0b"
    : espBattery.nivel === "critico" ? "#ef4444"
    : "#e2e8f0"
    : "#e2e8f0"

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#f8fafc 0%,#f0f4f8 60%,#e8eef5 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        .pill-btn { transition: all .18s cubic-bezier(.4,0,.2,1) !important; }
        .pill-btn:not(:disabled):active { transform: scale(.96) !important; }
        .field-live { animation: glow-green .9s ease-in-out infinite alternate; }
        @keyframes glow-green { from { box-shadow: 0 0 0 0 rgba(16,185,129,.08); } to { box-shadow: 0 0 0 6px rgba(16,185,129,.06); } }
        .step-card { transition: border-color .3s ease, box-shadow .3s ease; }
        select { -webkit-appearance: none; }
        @keyframes battery-pulse-crit { 0%,100%{opacity:1} 50%{opacity:.45} }
        .battery-critico { animation: battery-pulse-crit 1s ease-in-out infinite; }
      `}</style>

      <Toast notification={notification} onClose={() => setNotification(null)} />
      <ResultModal isOpen={modalAlcanceOpen}  onClose={cerrarModalAlcance} title="Test de Alcance Guardado" data={alcanceGuardado || {}} />
      <ResultModal isOpen={modalPruebaOpen}   onClose={cerrarModalPrueba}  title="Prueba de Salto Guardada" data={pruebaGuardada  || {}} />
      <CalibrationModal
        isOpen={calibrationModalOpen}
        calibrationStatus={calibrationStatus}
        onClose={handleCerrarModalCalibracion}
        onCancel={handleCancelarCalibracion}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* ── Selector jugador + controles de tab ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ── Card jugador ── */}
          <div style={card} className="p-5 flex items-center gap-4">
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Jugador</span>
              <div className="relative">
                <select
                  value={cuentaSeleccionada}
                  onChange={(e) => {
                    setCuentaSeleccionada(e.target.value)
                    setFaseAlcance("idle")
                    setIsCalibrated(false)
                    setAlcanceCalibracionDone(false)
                    setPruebaCalibrada(false)
                    setPruebaCalibracionDone(false)
                    setSaltoRTActual(null)
                    setResultadoFinal(null)
                    setIncrementoAnterior("")
                    setEjercicioEnCurso(false)
                  }}
                  style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "9px 36px 9px 14px", fontSize: 13, color: "#374151", width: 168, cursor: "pointer" }}
                  className="focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Seleccionar...</option>
                  {jugadoresDisponibles.map((c) => (
                    <option key={c.id} value={c.id.toString()}>
                      {c.jugador ? `${c.jugador.nombres} ${c.jugador.apellidos}` : c.usuario}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* ── Estado ESP-6 + Batería ── */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: espConnected ? "#10b981" : "#cbd5e1" }}
                  />
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                    {espConnected ? "Online" : "Offline"}
                  </span>
                </div>
                {espConnected && espBattery && (
                  <div className={espBattery.nivel === "critico" ? "battery-critico" : ""}>
                    <BatteryIcon
                      nivel={espBattery.nivel}
                      porcentaje={espBattery.porcentaje}
                      voltaje={espBattery.voltaje}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="w-px self-stretch bg-slate-100 shrink-0" />

            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 shrink-0 overflow-hidden"
                style={{
                  borderRadius: 16,
                  background: "#f1f5f9",
                  border: espBattery
                    ? `1.5px solid ${batteryBorderColor}`
                    : "1.5px solid #e2e8f0",
                  transition: "border-color .4s",
                }}
              >
                {jugadorSeleccionado?.jugador?.posicion_principal
                  ? <img src={getPositionIcon(jugadorSeleccionado.jugador.posicion_principal)} alt=""
                      className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "/oso.png" }} />
                  : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-slate-300" /></div>}
              </div>
              <div className="leading-snug min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {jugadorSeleccionado?.jugador
                    ? `${jugadorSeleccionado.jugador.nombres} ${jugadorSeleccionado.jugador.apellidos}`
                    : <span className="text-slate-300 font-normal">Sin selección</span>}
                </p>
                {jugadorSeleccionado?.jugador && <>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                    {getPositionName(jugadorSeleccionado.jugador.posicion_principal) ?? "—"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Alcance: <span className="font-semibold text-slate-600">{jugadorSeleccionado.jugador.alcance_estatico ?? "N"} m</span>
                  </p>
                </>}
              </div>
            </div>
          </div>

          {/* ── Controles según tab ── */}
          <div style={card} className="p-5">
            {activeTab === "alcance" && (
              <>
                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 block mb-3">Test de Alcance</span>
                <div className="flex gap-2.5 mb-3">
                  <button
                    onClick={() => handleCalibrar("alcance")}
                    disabled={!cuentaSeleccionada || faseAlcance === "jumping"}
                    className="pill-btn flex-1 py-2.5 px-5 text-sm font-semibold"
                    style={
                      faseAlcance === "calibrating" && calibrationStatus === "calibrating"
                        ? { borderRadius: 50, background: "#fef3c7", color: "#92400e", border: "1.5px solid #fde68a", cursor: "default" }
                        : alcanceCalibracionDone
                        ? { borderRadius: 50, background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", boxShadow: "0 4px 14px rgba(5,150,105,.25)" }
                        : pillBtn(!cuentaSeleccionada || faseAlcance === "jumping" ? false : true, !cuentaSeleccionada || faseAlcance === "jumping")
                    }
                  >
                    {faseAlcance === "calibrating" && calibrationStatus === "calibrating" ? "Calibrando…" : alcanceCalibracionDone ? "✓ Recalibrar" : "Calibrar"}
                  </button>

                  {faseAlcance !== "jumping" ? (
                    <button
                      onClick={handleIniciarSalto}
                      className="pill-btn flex-1 py-2.5 px-5 text-sm font-semibold"
                      style={pillBtn(true, false)}
                    >
                      Iniciar
                    </button>
                  ) : (
                    <button
                      onClick={handleFinalizarSalto}
                      className="pill-btn flex-1 py-2.5 px-5 text-sm font-semibold animate-pulse"
                      style={{ borderRadius: 50, background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "#fff", boxShadow: "0 4px 14px rgba(220,38,38,.25)" }}
                    >
                      Detener
                    </button>
                  )}
                </div>

                {faseAlcance === "jumping" && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>{alcanceSegundos}s</span><span>{ALCANCE_DURACION_SEG}s</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((alcanceSegundos / ALCANCE_DURACION_SEG) * 100, 100)}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                      <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Sesión activa</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "pruebas" && (
              <>
                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 block mb-3">Prueba de Salto</span>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-1.5">
                    {[{ key: "salto simple", label: "Salto simple" }, { key: "salto conos", label: "Salto cono" }].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setTipoSalto(key)}
                        disabled={ejercicioEnCurso}
                        className="pill-btn px-3.5 py-1.5 text-xs font-semibold"
                        style={pillBtn(tipoSalto === key, ejercicioEnCurso && tipoSalto !== key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={tiempoPrueba}
                    onChange={(e) => setTiempoPrueba(e.target.value)}
                    placeholder="Seg."
                    min="10"
                    max="300"
                    disabled={ejercicioEnCurso}
                    className="w-20 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-200"
                    style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "7px 10px", opacity: ejercicioEnCurso ? .45 : 1 }}
                  />
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => handleCalibrar("pruebas")}
                      disabled={!cuentaSeleccionada || ejercicioEnCurso}
                      className="pill-btn py-2 px-4 text-sm font-semibold"
                      style={
                        pruebaCalibracionDone
                          ? { borderRadius: 50, background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", boxShadow: "0 4px 14px rgba(5,150,105,.25)" }
                          : pillBtn(true, !cuentaSeleccionada || ejercicioEnCurso)
                      }
                    >
                      {pruebaCalibracionDone ? "✓ Calibrado" : "Calibrar"}
                    </button>

                    {!ejercicioEnCurso ? (
                      <button
                        onClick={iniciarPrueba}
                        className="pill-btn py-2 px-4 text-sm font-semibold"
                        style={pillBtn(true, false)}
                      >
                        Iniciar
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={detenerPrueba}
                          className="pill-btn py-2 px-4 text-sm font-semibold animate-pulse"
                          style={{ borderRadius: 50, background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "#fff", boxShadow: "0 4px 14px rgba(220,38,38,.25)" }}
                        >
                          Detener
                        </button>
                        <button
                          onClick={cancelarPrueba}
                          className="pill-btn py-2 px-4 text-sm font-semibold"
                          style={{ borderRadius: 50, background: "#fee2e2", color: "#991b1b", border: "1.5px solid #fecaca", cursor: "pointer" }}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex justify-center">
          <div className="flex p-1 gap-1"
            style={{ background: "rgba(255,255,255,.9)", border: "1px solid rgba(148,163,184,.2)", borderRadius: 50, boxShadow: "0 2px 12px rgba(148,163,184,.1)" }}>
            {[["alcance", "Test Alcance"], ["pruebas", "Prueba Salto"]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="pill-btn px-8 py-2 text-sm font-semibold"
                style={{
                  borderRadius: 50,
                  background: activeTab === key ? "#1e293b" : "transparent",
                  color: activeTab === key ? "#fff" : "#94a3b8",
                  boxShadow: activeTab === key ? "0 2px 10px rgba(30,41,59,.2)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════ TAB ALCANCE ══════════════════ */}
        {activeTab === "alcance" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Pasos a seguir para el jugador</p>
              <div className="flex justify-center gap-4">
                {/* Card 1: Calibración */}
                {(() => {
                  const s = stepState(1)
                  const border = s === "done" ? "#10b981" : s === "active" ? "#818cf8" : "#e2e8f0"
                  const shadow = s === "done" ? "0 6px 24px rgba(16,185,129,.15)" : s === "active" ? "0 6px 24px rgba(99,102,241,.15)" : "0 2px 8px rgba(148,163,184,.07)"
                  const lc     = s === "done" ? "#059669" : s === "active" ? "#4f46e5" : "#94a3b8"
                  return (
                    <div className="flex flex-col gap-2" style={{ width: 280 }}>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-center" style={{ color: lc }}>Calibración</p>
                      <div className="step-card bg-white overflow-hidden" style={{ borderRadius: 18, border: `2px solid ${border}`, boxShadow: shadow }}>
                        <div className="overflow-hidden relative" style={{ height: 360 }}>
                          <img src="/calibraAlcance2.png" alt="Calibración"
                            className="w-full h-full object-contain"
                            style={{ background: "linear-gradient(160deg,#f8fafc,#fff)" }} />
                        </div>
                      </div>
                    </div>
                  )
                })()}
                {/* Card 2: Prueba */}
                {(() => {
                  const s = stepState(2)
                  const border = s === "done" ? "#10b981" : s === "active" ? "#818cf8" : "#e2e8f0"
                  const shadow = s === "done" ? "0 6px 24px rgba(16,185,129,.15)" : s === "active" ? "0 6px 24px rgba(99,102,241,.15)" : "0 2px 8px rgba(148,163,184,.07)"
                  const lc     = s === "done" ? "#059669" : s === "active" ? "#4f46e5" : "#94a3b8"
                  return (
                    <div className="flex flex-col gap-2" style={{ width: 280 }}>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-center" style={{ color: lc }}>Prueba</p>
                      <div className="step-card bg-white overflow-hidden" style={{ borderRadius: 18, border: `2px solid ${border}`, boxShadow: shadow }}>
                        <div className="overflow-hidden relative" style={{ height: 360 }}>
                          <Carrusel images={ALCANCE_INICIO_IMAGES} alt="Prueba de alcance" />
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Resultados */}
            <div className="flex justify-center">
              <div className="w-full max-w-md p-6" style={card}>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 text-center mb-5">Resultados</p>
                <div className="space-y-3">
                  {(() => {
                    const value = resultadoFinal?.alcanceTotal
                      ? `${resultadoFinal.alcanceTotal} cm`
                      : saltoRTActual?.alcanceTotal
                      ? `${saltoRTActual.alcanceTotal} cm`
                      : ""
                    const live = faseAlcance === "jumping" && !!saltoRTActual
                    return (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 shrink-0">Altura de alcance registrada</span>
                        <div className="relative shrink-0">
                          <input readOnly value={value} placeholder="—"
                            className={`w-36 text-xs text-center font-bold focus:outline-none ${live ? "field-live" : ""}`}
                            style={{
                              padding: "8px 14px", borderRadius: 12,
                              background: live ? "#ecfdf5" : "#f8fafc",
                              border: `1.5px solid ${live ? "#6ee7b7" : "#e2e8f0"}`,
                              color: live ? "#059669" : "#475569",
                            }} />
                          {live && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                        </div>
                      </div>
                    )
                  })()}
                </div>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleGuardarAlcance}
                    disabled={faseAlcance !== "done" || !resultadoFinal || resultadoFinal._tipo === "cono"}
                    className="pill-btn px-10 py-2.5 text-sm font-bold"
                    style={pillBtn(
                      faseAlcance === "done" && !!resultadoFinal && resultadoFinal._tipo !== "cono",
                      faseAlcance !== "done" || !resultadoFinal || resultadoFinal._tipo === "cono"
                    )}
                  >
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

        {/* ══════════════════ TAB PRUEBAS ══════════════════ */}
        {activeTab === "pruebas" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Pasos a seguir para el jugador</p>
              <div className="flex justify-center gap-4">
                {/* Card 1: Calibración */}
                {(() => {
                  const s = pruebaCalibracionDone ? "done" : "idle"
                  const border = s === "done" ? "#10b981" : "#e2e8f0"
                  const shadow = s === "done" ? "0 6px 24px rgba(16,185,129,.15)" : "0 2px 8px rgba(148,163,184,.07)"
                  const lc     = s === "done" ? "#059669" : "#94a3b8"
                  return (
                    <div className="flex flex-col gap-2" style={{ width: 280 }}>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-center" style={{ color: lc }}>Calibración</p>
                      <div className="step-card bg-white overflow-hidden" style={{ borderRadius: 18, border: `2px solid ${border}`, boxShadow: shadow }}>
                        <div className="overflow-hidden relative" style={{ height: 360 }}>
                          <img src="/calibraAlcance2.png" alt="Calibración"
                            className="w-full h-full object-contain"
                            style={{ background: "linear-gradient(160deg,#f8fafc,#fff)" }} />
                        </div>
                      </div>
                    </div>
                  )
                })()}
                {/* Card 2: Tipo de salto */}
                {(() => {
                  const s = resultadoFinal ? "done" : ejercicioEnCurso ? "active" : "idle"
                  const border = s === "done" ? "#10b981" : s === "active" ? "#818cf8" : "#e2e8f0"
                  const shadow = s === "done" ? "0 6px 24px rgba(16,185,129,.15)" : s === "active" ? "0 6px 24px rgba(99,102,241,.15)" : "0 2px 8px rgba(148,163,184,.07)"
                  const lc     = s === "done" ? "#059669" : s === "active" ? "#4f46e5" : "#94a3b8"
                  return (
                    <div className="flex flex-col gap-2" style={{ width: 280 }}>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-center" style={{ color: lc }}>
                        {tipoSalto === "salto conos" ? "Salto con Conos" : "Salto Simple"}
                      </p>
                      <div className="step-card bg-white overflow-hidden" style={{ borderRadius: 18, border: `2px solid ${border}`, boxShadow: shadow }}>
                        <div className="overflow-hidden relative" style={{ height: 360 }}>
                          <Carrusel images={getPruebasCarrusel()} alt="Prueba" />
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Progreso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Tiempo transcurrido</p>
                <p className="text-[10px] font-mono text-slate-400">
                  {progresoSegundos}s{tiempoPrueba ? ` / ${tiempoPrueba}s` : ""}
                </p>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: tiempoPrueba && progresoSegundos > 0
                      ? `${Math.min((progresoSegundos / parseFloat(tiempoPrueba)) * 100, 100)}%`
                      : "0%",
                    background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
                  }} />
              </div>
            </div>

            {/* Resultados */}
            <div className="flex justify-center">
              <div className="w-full max-w-md p-6" style={card}>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 text-center mb-5">Resultados</p>
                <div className="space-y-3">
                  {[
                    {
                      label: "Saltos detectados",
                      value: resultadoFinal ? `${resultadoFinal.saltos_validos}` : saltoRTActual ? `${saltoRTActual.num}` : "",
                      isLive: !!saltoRTActual && !resultadoFinal,
                    },
                    {
                      label: "Fuerza máxima alcanzada",
                      value: resultadoFinal
                        ? `Izq: ${resultadoFinal.pico_izq_kg} kgf  /  Der: ${resultadoFinal.pico_der_kg} kgf`
                        : saltoRTActual
                        ? `Izq: ${saltoRTActual.pico_izq.toFixed(2)} kgf  /  Der: ${saltoRTActual.pico_der.toFixed(2)} kgf`
                        : "",
                      isLive: !!saltoRTActual && !resultadoFinal,
                    },
                    {
                      label: "Altura promedio",
                      value: resultadoFinal
                        ? `${resultadoFinal.alt_promedio_cm} cm`
                        : saltoRTActual
                        ? `${saltoRTActual.altura_cm} cm`
                        : "",
                      isLive: !!saltoRTActual && !resultadoFinal,
                    },
                  ].map(({ label, value, isLive }) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-[9px] uppercase tracking-wide font-semibold text-slate-500 shrink-0">{label}</span>
                      <div className="relative shrink-0">
                        <input readOnly value={value} placeholder="—"
                          className={`w-44 text-xs text-center font-bold focus:outline-none ${isLive && value ? "field-live" : ""}`}
                          style={{
                            padding: "8px 14px", borderRadius: 12,
                            background: isLive && value ? "#ecfdf5" : "#f8fafc",
                            border: `1.5px solid ${isLive && value ? "#6ee7b7" : "#e2e8f0"}`,
                            color: isLive && value ? "#059669" : "#475569",
                          }} />
                        {isLive && value && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={finalizarPrueba}
                    disabled={!resultadoFinal || !pruebaId}
                    className="pill-btn px-10 py-2.5 text-sm font-bold"
                    style={pillBtn(!!resultadoFinal && !!pruebaId, !resultadoFinal || !pruebaId)}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>

            {primerSaltoSesion && (
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <FatigaCard primerSalto={primerSaltoSesion} ultimoSalto={ultimoSaltoSesion} totalSaltos={totalSaltosSesion} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}