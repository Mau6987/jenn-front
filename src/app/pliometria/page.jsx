"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, User, CheckCircle, X } from "lucide-react"
import { ImageSequence } from "../../components/image-sequence"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"
const DEVICE_ID = "ESP-6"
const PUSHER_KEY = "4f85ef5c792df94cebc9"
const PUSHER_CLUSTER = "us2"
const ALCANCE_DURACION_SEG = 15

const SALTO_SIMPLE_IMAGES = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/conos-removebg-preview__2_-removebg-preview-ZdpOb2qgOJERfCssbovE9QRaOX5m1U.png",
]
const SALTO_CONOS_IMAGES = SALTO_SIMPLE_IMAGES

const CMD = {
  CALIBRAR:       "CALIBRAR",
  CANCELAR:       "CANCELAR",
  STOP:           "STOP",
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

// ── TOAST ──────────────────────────────────────────────────────────────────
function Toast({ notification, onClose }) {
  if (!notification) return null
  const isOk = notification.type === "success"
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium max-w-sm"
      style={{
        background: isOk ? "linear-gradient(135deg,#ecfdf5,#d1fae5)" : "linear-gradient(135deg,#fff1f2,#ffe4e6)",
        border: `1px solid ${isOk ? "#6ee7b7" : "#fca5a5"}`,
        color: isOk ? "#065f46" : "#991b1b",
        boxShadow: isOk ? "0 8px 32px rgba(16,185,129,.18)" : "0 8px 32px rgba(239,68,68,.15)",
      }}>
      {isOk ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <X className="w-4 h-4 text-red-400 shrink-0" />}
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
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-7" style={{ boxShadow: "0 24px 64px rgba(0,0,0,.18)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-400 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
              <p className="text-sm font-bold text-slate-800">{v}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-5 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg,#1e293b,#334155)", color: "#fff" }}>
          Cerrar y Limpiar
        </button>
      </div>
    </div>
  )
}

// ── MODAL CALIBRACIÓN ──────────────────────────────────────────────────────
function CalibrationModal({ isOpen, isCalibrated, onClose, onCancel }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-10 text-center relative" style={{ boxShadow: "0 24px 64px rgba(0,0,0,.18)" }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
        {!isCalibrated ? (
          <>
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-5 animate-pulse">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/calibrar-removebg-preview-1y4aBupjFQ9WApv9Ru1gxKoxsOdMqW.png"
                alt="Calibrando" className="w-12 h-12 object-contain animate-spin" style={{ animationDuration: "2s" }} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Calibrando...</h3>
            <p className="text-sm text-slate-400 mb-6">Jugador <strong className="text-slate-600">quieto y de pie</strong> sobre las celdas (~5 segundos)</p>
            <button onClick={onCancel} className="w-full py-3 rounded-2xl bg-red-50 text-red-500 border border-red-100 text-sm font-semibold hover:bg-red-100 transition-colors">
              Cancelar calibración
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-700 mb-1">¡Calibrado!</h3>
            <p className="text-sm text-slate-400">MPU6050 y celdas HX711 listas</p>
          </>
        )}
      </div>
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
    slate:   { grad: "from-slate-50 to-white",   accent: "#64748b", bar: "#94a3b8", label: "Sin datos suficientes",                      badgeBg: "#f1f5f9", badgeText: "#475569" },
    blue:    { grad: "from-blue-50 to-white",    accent: "#2563eb", bar: "#60a5fa", label: "↑ Fuerza en aumento — activación progresiva", badgeBg: "#eff6ff", badgeText: "#1d4ed8" },
    emerald: { grad: "from-emerald-50 to-white", accent: "#059669", bar: "#34d399", label: "✓ Fatiga baja — rendimiento sostenido",       badgeBg: "#ecfdf5", badgeText: "#065f46" },
    amber:   { grad: "from-amber-50 to-white",   accent: "#d97706", bar: "#fbbf24", label: "⚠ Fatiga moderada — monitorear",             badgeBg: "#fffbeb", badgeText: "#92400e" },
    red:     { grad: "from-red-50 to-white",     accent: "#dc2626", bar: "#f87171", label: "✗ Fatiga alta — considerar descanso",         badgeBg: "#fff1f2", badgeText: "#991b1b" },
  }
  const p = palettes[nivel]
  const barPct = IF === null ? 0 : parseFloat(IF) < 0 ? Math.min(Math.abs(parseFloat(IF)) * 3, 30) : Math.min(parseFloat(IF) * 3, 100)

  return (
    <div className={`rounded-3xl bg-gradient-to-br ${p.grad} p-6 space-y-5`}
      style={{ border: `1.5px solid ${p.accent}22`, boxShadow: `0 4px 24px ${p.accent}12` }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Índice de Fatiga</p>
        <span className="text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-full"
          style={{ background: p.badgeBg, color: p.badgeText }}>{totalSaltos} saltos</span>
      </div>
      <div className="bg-white/80 rounded-2xl border border-slate-100 p-4 flex flex-col items-center gap-1.5">
        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Fórmula</p>
        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
          <span className="font-bold text-slate-700 text-sm">IF</span>
          <span className="text-slate-300 text-lg">=</span>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-slate-600 whitespace-nowrap">F<sub>i</sub> − F<sub>f</sub></span>
            <div className="w-full h-px bg-slate-200 my-0.5" />
            <span className="text-slate-400 whitespace-nowrap">F<sub>i</sub></span>
          </div>
          <span className="text-slate-300">×</span><span className="font-medium">100</span>
        </div>
        <p className="text-[9px] text-slate-300 mt-0.5">F = pico izq. + pico der. (kg)</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "F inicial", main: fInicial, sub: [`Izq: ${fInicialIzq}`, `Der: ${fInicialDer}`], hi: false },
          { label: "F final",   main: fFinal,   sub: [`Izq: ${fFinalIzq}`,   `Der: ${fFinalDer}`],   hi: false },
          { label: "IF (%)",    main: IF !== null ? `${IF}%` : "—",
            sub: [IF === null ? "—" : parseFloat(IF) < 0 ? "↑ mejora" : parseFloat(IF) < 10 ? "baja" : parseFloat(IF) < 20 ? "moderada" : "alta"],
            hi: true },
        ].map(({ label, main, sub, hi }) => (
          <div key={label} className="flex flex-col items-center bg-white rounded-2xl p-3 gap-1"
            style={{ border: hi ? `1.5px solid ${p.accent}33` : "1px solid #f1f5f9", boxShadow: hi ? `0 2px 12px ${p.accent}10` : "none" }}>
            <p className="text-[9px] uppercase tracking-wide text-slate-400 text-center font-medium">{label}</p>
            <p className="text-base font-bold" style={{ color: hi ? p.accent : "#1e293b" }}>{main}</p>
            {sub.map((s, i) => <p key={i} className="text-[9px] text-slate-400 text-center">{s}</p>)}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barPct}%`, background: p.bar }} />
        </div>
        <p className="text-[10px] font-semibold text-center" style={{ color: p.accent }}>{p.label}</p>
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

  const [faseAlcance, setFaseAlcance]                   = useState("idle")
  const [incrementoAnterior, setIncrementoAnterior]     = useState("")
  const [ultimoAlcance, setUltimoAlcance]               = useState(null)
  const [alcanceGuardado, setAlcanceGuardado]           = useState(null)
  const [modalAlcanceOpen, setModalAlcanceOpen]         = useState(false)
  const [alcanceSegundos, setAlcanceSegundos]           = useState(0)

  const [calibrationModalOpen, setCalibrationModalOpen] = useState(false)
  const [isCalibrated, setIsCalibrated]                 = useState(false)
  const calibrationTimerRef = useRef(null)
  const calibrandoRef       = useRef(false)
  const alcanceTimerRef     = useRef(null)

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

  const [primerSaltoSesion, setPrimerSaltoSesion]       = useState(null)
  const [ultimoSaltoSesion, setUltimoSaltoSesion]       = useState(null)
  const [totalSaltosSesion, setTotalSaltosSesion]       = useState(0)

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

  const resetFatiga = () => { setPrimerSaltoSesion(null); setUltimoSaltoSesion(null); setTotalSaltosSesion(0) }

  const subscribeToESP = (pusher) => {
    const channel = pusher.subscribe(`private-device-${DEVICE_ID}`)
    channel.bind("pusher:subscription_succeeded", () => { setEspConnected(true); addMessage(DEVICE_ID, "Conectado", "success", setMessages); notify("success", "ESP-6 conectado") })
    channel.bind("pusher:subscription_error", (err) => { addMessage("SISTEMA", `Error: ${JSON.stringify(err)}`, "error", setMessages) })
    channel.bind("client-response", (data) => {
      let rawMsg = data.message || ""
      if (typeof rawMsg === "object") rawMsg = JSON.stringify(rawMsg)
      try { const p = JSON.parse(rawMsg); if (p?.message) rawMsg = p.message } catch (_) {}
      const msg = String(rawMsg).trim()
      addMessage(DEVICE_ID, msg, "success", setMessages)

      if (msg.includes("CALIBRADO_OK")) {
        if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }
        calibrandoRef.current = false
        setIsCalibrated(true); setPliometriaCalibrada(true); setFaseAlcance("calibrated"); setCalibrationModalOpen(true)
        setTimeout(() => { setCalibrationModalOpen(false); setIsCalibrated(false) }, 2000)
        notify("success", "¡Calibrado! — listo para iniciar"); return
      }
      if (msg.includes("CALIBRACION_CANCELADA")) {
        if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }
        calibrandoRef.current = false
        setFaseAlcance("idle"); setCalibrationModalOpen(false); setIsCalibrated(false); setPliometriaCalibrada(false)
        notify("error", "Calibración cancelada"); return
      }
      if (msg.includes("SESION_INICIADA")) {
        setFaseAlcance("jumping"); setEjercicioEnCurso(true); setSaltoRTActual(null); setResultadoFinal(null)
        saltoConosContadorRef.current = 0; resetFatiga(); return
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
          const saltoFatiga = { pico_izq: json.pico_izq ?? 0, pico_der: json.pico_der ?? 0 }
          setPrimerSaltoSesion((prev) => prev ?? saltoFatiga)
          setUltimoSaltoSesion(saltoFatiga)
          setTotalSaltosSesion((prev) => prev + 1)
          saltoConosContadorRef.current += 1
          const numSalto = saltoConosContadorRef.current
          setSaltoFlash(true); setTimeout(() => setSaltoFlash(false), 400)
          const saltoData = { num: numSalto, altura_cm: json.altura_cm, alcanceTotal, pico_izq: json.pico_izq ?? 0, pico_der: json.pico_der ?? 0 }
          if (currentTipo === "salto conos") { setSaltoRTActual(saltoData); setUltimaAlturaCono(json.altura_cm) }
          else { setSaltoRTActual((prev) => (!prev || json.altura_cm > prev.altura_cm) ? saltoData : prev) }
          addMessage(DEVICE_ID, `Salto #${numSalto} — ${json.altura_cm}cm`, "success", setMessages)
        } catch (e) { addMessage(DEVICE_ID, `Error SALTO_JSON: ${e.message}`, "error", setMessages) }
        return
      }
      if (msg.startsWith("RESULTADO_JSON:")) {
        try {
          const json = JSON.parse(msg.slice("RESULTADO_JSON:".length))
          const currentTipo = tipoSaltoRef.current
          const alcanceEstaticoCm = getAlcanceEstaticoCm()
          const alcanceTotal = parseFloat((alcanceEstaticoCm + Number(json.alt_max_cm)).toFixed(1))
          const picoIzq   = json.fuerza_izq  ?? json.pico_izq_kg ?? json.pico_izq  ?? 0
          const picoDer   = json.fuerza_der  ?? json.pico_der_kg ?? json.pico_der  ?? 0
          const numSaltos = json.saltos       ?? json.saltos_validos               ?? saltoConosContadorRef.current
          const resultado = {
            _tipo: json.modo ?? (currentTipo === "salto conos" ? "cono" : "vertical"),
            saltos_validos: numSaltos,
            alt_max_cm: Number(json.alt_max_cm).toFixed(1),
            pico_izq_kg: Number(picoIzq).toFixed(2),
            pico_der_kg: Number(picoDer).toFixed(2),
            alcanceEstaticoCm: parseFloat(alcanceEstaticoCm.toFixed(1)),
            alcanceTotal,
          }
          if (resultado._tipo !== "cono") {
            const previo = ultimoAlcanceRef.current
            setIncrementoAnterior(previo?.alcance != null
              ? `${(alcanceTotal - parseFloat(previo.alcance)) >= 0 ? "+" : ""}${(alcanceTotal - parseFloat(previo.alcance)).toFixed(1)} cm`
              : "Sin registro previo")
          }
          setResultadoFinal(resultado); setEjercicioEnCurso(false)
          if (progresoTimerRef.current) { clearInterval(progresoTimerRef.current); progresoTimerRef.current = null }
          if (alcanceTimerRef.current)  { clearInterval(alcanceTimerRef.current);  alcanceTimerRef.current  = null }
          setFaseAlcance("done")
          notify("success", "Prueba finalizada — presiona Guardar")
        } catch (e) { addMessage(DEVICE_ID, `Error RESULTADO_JSON: ${e.message}`, "error", setMessages) }
        return
      }
    })
    channel.bind("client-status", (data) => { if (data?.status === "connected") setEspConnected(true) })
  }

  const handleCalibrar = async () => {
    if (!jugadorSeleccionado) { notify("error", "Selecciona un jugador primero"); return }
    if (calibrandoRef.current) return
    if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }
    calibrandoRef.current = true
    setFaseAlcance("calibrating"); setPliometriaCalibrada(false); setSaltoRTActual(null); setResultadoFinal(null)
    setIncrementoAnterior(""); setIsCalibrated(false); setCalibrationModalOpen(true); resetFatiga()
    await sendCommand(CMD.CALIBRAR, setMessages)
    calibrationTimerRef.current = setTimeout(() => {
      calibrationTimerRef.current = null
      if (calibrandoRef.current) {
        calibrandoRef.current = false; setFaseAlcance("idle"); setCalibrationModalOpen(false); setIsCalibrated(false)
        notify("error", "Calibración sin respuesta — intenta nuevamente")
      }
    }, 25000)
  }

  const handleCancelarCalibracion = async () => {
    if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null }
    calibrandoRef.current = false
    setCalibrationModalOpen(false); setIsCalibrated(false); setFaseAlcance("idle"); setPliometriaCalibrada(false)
    await sendCommand(CMD.CANCELAR, setMessages)
    notify("error", "Cancelación enviada al ESP")
  }

  const handleIniciarSalto = async () => {
    if (faseAlcance !== "calibrated") { notify("error", "Calibra primero el sensor"); return }
    setSaltoRTActual(null); setResultadoFinal(null); setIncrementoAnterior(""); setAlcanceSegundos(0)
    saltoConosContadorRef.current = 0; resetFatiga()
    await sendCommand(CMD.VERTICAL_TIMED(ALCANCE_DURACION_SEG), setMessages)
    if (alcanceTimerRef.current) clearInterval(alcanceTimerRef.current)
    alcanceTimerRef.current = setInterval(() => {
      setAlcanceSegundos((prev) => {
        const next = prev + 1
        if (next >= ALCANCE_DURACION_SEG) { clearInterval(alcanceTimerRef.current); alcanceTimerRef.current = null }
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
    try {
      const res = await fetch(`${BACKEND_URL}/api/alcances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: Number(cuentaSeleccionada), alcance: resultadoFinal.alcanceTotal }),
      })
      const d = await res.json()
      if (d.success) {
        setAlcanceGuardado({
          "Alcance registrado": `${resultadoFinal.alcanceTotal} cm`,
          "Altura del salto (ESP)": `${resultadoFinal.alt_max_cm} cm`,
          "Alcance estático": `${resultadoFinal.alcanceEstaticoCm} cm`,
          "Saltos válidos": `${resultadoFinal.saltos_validos}`,
          "Fuerza máx. izquierda": `${resultadoFinal.pico_izq_kg} kg`,
          "Fuerza máx. derecha": `${resultadoFinal.pico_der_kg} kg`,
        })
        setModalAlcanceOpen(true); notify("success", "Guardado correctamente")
      }
    } catch (e) { console.error(e); notify("error", "Error al guardar") }
  }

  const cerrarModalAlcance = () => {
    setModalAlcanceOpen(false); setAlcanceGuardado(null); setFaseAlcance("idle")
    setSaltoRTActual(null); setResultadoFinal(null); setIncrementoAnterior(""); setAlcanceSegundos(0); resetFatiga()
    if (cuentaSeleccionada) {
      fetch(`${BACKEND_URL}/api/alcances/ultimo/${cuentaSeleccionada}`).then((r) => r.json())
        .then((d) => { setUltimoAlcance(d.data ?? null); ultimoAlcanceRef.current = d.data ?? null }).catch(console.error)
    }
  }

  const iniciarPliometria = async () => {
    if (!cuentaSeleccionada)  { notify("error", "Selecciona un jugador primero"); return }
    if (!pliometriaCalibrada) { notify("error", "Calibra primero el sensor"); return }
    const duracion = Math.round(Number.parseFloat(tiempoPliometria))
    if (!tiempoPliometria || duracion <= 0) { notify("error", "Ingresa un tiempo válido"); return }
    try {
      const res = await fetch(`${BACKEND_URL}/api/pliometrias/iniciar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: Number(cuentaSeleccionada), tipo: tipoSalto, tiempo: duracion }),
      })
      const d = await res.json()
      if (d.success) setPliometriaId(d.data.id)
    } catch (e) { console.error(e) }
    setSaltoRTActual(null); setResultadoFinal(null); setProgresoSegundos(0); setSaltoFlash(false); setUltimaAlturaCono(null)
    saltoConosContadorRef.current = 0; resetFatiga()
    await sendCommand(tipoSaltoRef.current === "salto conos" ? CMD.CONO_TIMED(duracion) : CMD.VERTICAL_TIMED(duracion), setMessages)
    if (progresoTimerRef.current) clearInterval(progresoTimerRef.current)
    progresoTimerRef.current = setInterval(() => {
      setProgresoSegundos((prev) => {
        const next = prev + 1
        if (next >= duracion) { clearInterval(progresoTimerRef.current); progresoTimerRef.current = null; sendCommand(CMD.STOP, setMessages) }
        return next
      })
    }, 1000)
    setPliometriaIniciada(true); notify("success", `Prueba de ${duracion}s iniciada`)
  }

  const detenerPliometria = async () => {
    if (!pliometriaIniciada) { notify("error", "No hay prueba activa"); return }
    if (progresoTimerRef.current) { clearInterval(progresoTimerRef.current); progresoTimerRef.current = null }
    await sendCommand(CMD.STOP, setMessages)
  }

  const finalizarPliometria = async () => {
    if (!pliometriaId || !resultadoFinal) { notify("error", "No hay datos para guardar"); return }
    const IF = calcularIndiceFatiga(primerSaltoSesion, ultimoSaltoSesion)
    try {
      const res = await fetch(`${BACKEND_URL}/api/pliometrias/finalizar/${pliometriaId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saltos_validos: resultadoFinal.saltos_validos, alt_max_cm: resultadoFinal.alt_max_cm,
          pico_izq_kg: resultadoFinal.pico_izq_kg, pico_der_kg: resultadoFinal.pico_der_kg, indice_fatiga: IF,
          ...(resultadoFinal._tipo !== "cono" && { alcanceTotal: resultadoFinal.alcanceTotal }),
        }),
      })
      const d = await res.json()
      if (d.success) {
        setPliometriaGuardada({
          "Tipo de salto": tipoSalto, "Saltos válidos": `${resultadoFinal.saltos_validos}`,
          "Altura máxima": `${resultadoFinal.alt_max_cm} cm`, "Fuerza pico izq.": `${resultadoFinal.pico_izq_kg} kg`,
          "Fuerza pico der.": `${resultadoFinal.pico_der_kg} kg`,
          ...(IF !== null && { "Índice de fatiga": `${IF}%` }),
          ...(resultadoFinal.alcanceTotal && { "Alcance total": `${resultadoFinal.alcanceTotal} cm` }),
        })
        setModalPliometriaOpen(true); notify("success", "Pliometría guardada")
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

  const saltoImages = tipoSalto === "salto conos" ? SALTO_CONOS_IMAGES : SALTO_SIMPLE_IMAGES

  const stepState = (step) => {
    if (step === 1) return faseAlcance === "calibrating" ? "active" : ["calibrated","jumping","done"].includes(faseAlcance) ? "done" : "idle"
    if (step === 2) return faseAlcance === "jumping" ? "active" : faseAlcance === "done" ? "done" : "idle"
    return faseAlcance === "done" ? "done" : faseAlcance === "jumping" ? "active" : "idle"
  }

  // ── Estilos reutilizables ─────────────────────────────────────────────────
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
      `}</style>

      <Toast notification={notification} onClose={() => setNotification(null)} />
      <ResultModal isOpen={modalAlcanceOpen}    onClose={cerrarModalAlcance}    title="Alcance Guardado"    data={alcanceGuardado    || {}} />
      <ResultModal isOpen={modalPliometriaOpen} onClose={cerrarModalPliometria} title="Pliometría Guardada" data={pliometriaGuardada  || {}} />
      <CalibrationModal isOpen={calibrationModalOpen} isCalibrated={isCalibrated} onClose={handleCancelarCalibracion} onCancel={handleCancelarCalibracion} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* ══ FILA SUPERIOR ═══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Card jugador */}
          <div style={card} className="p-5 flex items-center gap-4">
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Jugador</span>
              <div className="relative">
                <select value={cuentaSeleccionada}
                  onChange={(e) => {
                    setCuentaSeleccionada(e.target.value)
                    setFaseAlcance("idle"); setSaltoRTActual(null); setResultadoFinal(null); setIncrementoAnterior("")
                  }}
                  style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "9px 36px 9px 14px", fontSize: 13, color: "#374151", width: 168, cursor: "pointer" }}
                  className="focus:outline-none focus:ring-2 focus:ring-slate-200">
                  <option value="">Seleccionar...</option>
                  {jugadoresDisponibles.map((c) => (
                    <option key={c.id} value={c.id.toString()}>
                      {c.jugador ? `${c.jugador.nombres} ${c.jugador.apellidos}` : c.usuario}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="w-px self-stretch bg-slate-100 shrink-0" />

            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 shrink-0 overflow-hidden"
                style={{ borderRadius: 16, background: "#f1f5f9", border: "1.5px solid #e2e8f0" }}>
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

          {/* Panel control */}
          <div style={card} className="p-5">
            {activeTab === "alcance" && (
              <>
                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 block mb-3">Inicio de test</span>
                <div className="flex gap-2.5 mb-3">
                  <button onClick={handleCalibrar}
                    disabled={!cuentaSeleccionada || faseAlcance === "jumping"}
                    className="pill-btn flex-1 py-2.5 px-5 text-sm font-semibold"
                    style={faseAlcance === "calibrating"
                      ? { borderRadius: 50, background: "#fef3c7", color: "#92400e", border: "1.5px solid #fde68a", cursor: "default" }
                      : faseAlcance === "calibrated"
                      ? { borderRadius: 50, background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", boxShadow: "0 4px 14px rgba(5,150,105,.25)" }
                      : pillBtn(!cuentaSeleccionada || faseAlcance === "jumping" ? false : true, !cuentaSeleccionada || faseAlcance === "jumping")}>
                    {faseAlcance === "calibrating" ? "Calibrando…" : faseAlcance === "calibrated" ? "✓ Recalibrar" : "Calibrar"}
                  </button>
                  {faseAlcance !== "jumping" ? (
                    <button onClick={handleIniciarSalto} disabled={faseAlcance !== "calibrated"}
                      className="pill-btn flex-1 py-2.5 px-5 text-sm font-semibold"
                      style={pillBtn(faseAlcance === "calibrated", faseAlcance !== "calibrated")}>
                      Iniciar
                    </button>
                  ) : (
                    <button onClick={handleFinalizarSalto}
                      className="pill-btn flex-1 py-2.5 px-5 text-sm font-semibold animate-pulse"
                      style={{ borderRadius: 50, background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "#fff", boxShadow: "0 4px 14px rgba(220,38,38,.25)" }}>
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
                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 block mb-3">Configuración</span>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-1.5">
                    {[{ key: "salto simple", label: "Salto simple" }, { key: "salto conos", label: "Salto cono" }].map(({ key, label }) => (
                      <button key={key} onClick={() => setTipoSalto(key)} disabled={ejercicioEnCurso}
                        className="pill-btn px-3.5 py-1.5 text-xs font-semibold"
                        style={pillBtn(tipoSalto === key, ejercicioEnCurso && tipoSalto !== key)}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <input type="number" value={tiempoPliometria} onChange={(e) => setTiempoPliometria(e.target.value)}
                    placeholder="Seg." min="10" max="300" disabled={ejercicioEnCurso}
                    className="w-20 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-200"
                    style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "7px 10px", opacity: ejercicioEnCurso ? .45 : 1 }} />
                  <div className="flex gap-2 ml-auto">
                    <button onClick={handleCalibrar} disabled={!cuentaSeleccionada || ejercicioEnCurso}
                      className="pill-btn py-2 px-4 text-sm font-semibold"
                      style={pliometriaCalibrada
                        ? { borderRadius: 50, background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", boxShadow: "0 4px 14px rgba(5,150,105,.25)" }
                        : pillBtn(true, !cuentaSeleccionada || ejercicioEnCurso)}>
                      {pliometriaCalibrada ? "✓ Calibrado" : "Calibrar"}
                    </button>
                    {!ejercicioEnCurso ? (
                      <button onClick={iniciarPliometria} disabled={!pliometriaCalibrada || !tiempoPliometria}
                        className="pill-btn py-2 px-4 text-sm font-semibold"
                        style={pillBtn(pliometriaCalibrada && !!tiempoPliometria, !pliometriaCalibrada || !tiempoPliometria)}>
                        Iniciar
                      </button>
                    ) : (
                      <button onClick={detenerPliometria}
                        className="pill-btn py-2 px-4 text-sm font-semibold animate-pulse"
                        style={{ borderRadius: 50, background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "#fff", boxShadow: "0 4px 14px rgba(220,38,38,.25)" }}>
                        Detener
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ══ TABS ════════════════════════════════════════════════════════ */}
        <div className="flex justify-center">
          <div className="flex p-1 gap-1"
            style={{ background: "rgba(255,255,255,.9)", border: "1px solid rgba(148,163,184,.2)", borderRadius: 50, boxShadow: "0 2px 12px rgba(148,163,184,.1)" }}>
            {[["alcance", "Test de Alcance"], ["pruebas", "Pruebas"]].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className="pill-btn px-8 py-2 text-sm font-semibold"
                style={{
                  borderRadius: 50,
                  background: activeTab === key ? "#1e293b" : "transparent",
                  color: activeTab === key ? "#fff" : "#94a3b8",
                  boxShadow: activeTab === key ? "0 2px 10px rgba(30,41,59,.2)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ══ TAB ALCANCE ═════════════════════════════════════════════════ */}
        {activeTab === "alcance" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Pasos a seguir para el jugador</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { step: 1, label: "Calibración" },
                  { step: 2, label: "Inicio de prueba" },
                  { step: 3, label: "Finalización de prueba" },
                ].map(({ step, label }) => {
                  const s = stepState(step)
                  const border = s === "done" ? "#10b981" : s === "active" ? "#818cf8" : "#e2e8f0"
                  const shadow = s === "done" ? "0 6px 24px rgba(16,185,129,.15)" : s === "active" ? "0 6px 24px rgba(99,102,241,.15)" : "0 2px 8px rgba(148,163,184,.07)"
                  const lc     = s === "done" ? "#059669" : s === "active" ? "#4f46e5" : "#94a3b8"
                  const sc     = s === "done" ? "#10b981" : s === "active" ? "#6366f1" : "#cbd5e1"
                  return (
                    <div key={step} className="flex flex-col gap-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-center" style={{ color: lc }}>{label}</p>
                      <div className="step-card bg-white overflow-hidden" style={{ borderRadius: 20, border: `2px solid ${border}`, boxShadow: shadow }}>
                        <div className="aspect-[3/4] flex items-center justify-center" style={{ background: "linear-gradient(160deg,#f8fafc,#fff)" }}>
                          <svg viewBox="0 0 100 140" className="w-20 sm:w-24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            {step === 1 && <>
                              <circle cx="50" cy="24" r="11" stroke={sc} strokeWidth="2.2" />
                              <line x1="50" y1="35" x2="50" y2="82" stroke={sc} strokeWidth="2.2" />
                              <line x1="50" y1="52" x2="30" y2="68" stroke={sc} strokeWidth="2" />
                              <line x1="50" y1="52" x2="70" y2="68" stroke={sc} strokeWidth="2" />
                              <line x1="50" y1="82" x2="35" y2="110" stroke={sc} strokeWidth="2" />
                              <line x1="50" y1="82" x2="65" y2="110" stroke={sc} strokeWidth="2" />
                            </>}
                            {step === 2 && <>
                              <circle cx="50" cy="32" r="11" stroke={sc} strokeWidth="2.2" />
                              <path d="M50 43 Q46 58 38 70" stroke={sc} strokeWidth="2" />
                              <path d="M50 43 Q54 58 62 70" stroke={sc} strokeWidth="2" />
                              <path d="M44 64 Q36 82 30 96" stroke={sc} strokeWidth="2" />
                              <path d="M56 64 Q64 82 70 96" stroke={sc} strokeWidth="2" />
                              <path d="M80 55 L80 30" stroke="#e2e8f0" strokeWidth="1.5" />
                              <path d="M75 36 L80 30 L85 36" stroke="#e2e8f0" strokeWidth="1.5" />
                            </>}
                            {step === 3 && <>
                              <circle cx="50" cy="24" r="11" stroke={sc} strokeWidth="2.2" />
                              <path d="M50 35 Q46 52 40 64" stroke={sc} strokeWidth="2" />
                              <path d="M50 35 Q54 52 60 64" stroke={sc} strokeWidth="2" />
                              <path d="M40 64 Q34 82 28 98" stroke={sc} strokeWidth="2" />
                              <path d="M60 64 Q66 82 72 98" stroke={sc} strokeWidth="2" />
                              <line x1="20" y1="108" x2="80" y2="108" stroke={sc} strokeWidth="2.5" />
                              {s === "done" && <path d="M36 120 l8 8 l18 -14" stroke="#10b981" strokeWidth="2.5" />}
                            </>}
                          </svg>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Resultados alcance */}
            <div className="flex justify-center">
              <div className="w-full max-w-md p-6" style={card}>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 text-center mb-5">Resultados</p>
                <div className="space-y-3">
                  {[
                    {
                      label: "Altura de alcance registrada",
                      value: resultadoFinal?.alcanceTotal ? `${resultadoFinal.alcanceTotal} cm` : saltoRTActual?.alcanceTotal ? `${saltoRTActual.alcanceTotal} cm` : "",
                      live: faseAlcance === "jumping" && !!saltoRTActual,
                    },
                    { label: "Incremento respecto al anterior", value: incrementoAnterior, special: true },
                  ].map(({ label, value, live, special }) => {
                    const isPos = special && value.startsWith("+")
                    const isNeg = special && value.startsWith("-")
                    return (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 shrink-0">{label}</span>
                        <div className="relative shrink-0">
                          <input readOnly value={value} placeholder="—"
                            className={`w-36 text-xs text-center font-bold focus:outline-none ${live ? "field-live" : ""}`}
                            style={{
                              padding: "8px 14px", borderRadius: 12,
                              background: live || isPos ? "#ecfdf5" : isNeg ? "#fff1f2" : "#f8fafc",
                              border: `1.5px solid ${live || isPos ? "#6ee7b7" : isNeg ? "#fca5a5" : "#e2e8f0"}`,
                              color: live || isPos ? "#059669" : isNeg ? "#dc2626" : "#475569",
                            }} />
                          {live && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-center mt-6">
                  <button onClick={handleGuardarAlcance}
                    disabled={faseAlcance !== "done" || !resultadoFinal || resultadoFinal._tipo === "cono"}
                    className="pill-btn px-10 py-2.5 text-sm font-bold"
                    style={pillBtn(faseAlcance === "done" && !!resultadoFinal && resultadoFinal._tipo !== "cono", faseAlcance !== "done" || !resultadoFinal || resultadoFinal._tipo === "cono")}>
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

        {/* ══ TAB PRUEBAS ═════════════════════════════════════════════════ */}
        {activeTab === "pruebas" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Pasos a seguir para el jugador</p>
              <div className="grid grid-cols-3 gap-4">
                {["Calibración", "Inicio de prueba", "Finalización"].map((label, idx) => (
                  <div key={idx} className="flex flex-col gap-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-center text-slate-400">{label}</p>
                    <div className="step-card bg-white overflow-hidden" style={{ borderRadius: 20, border: "2px solid #e2e8f0", boxShadow: "0 2px 8px rgba(148,163,184,.07)" }}>
                      <div className="aspect-[3/4] flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(160deg,#f8fafc,#fff)" }}>
                        <ImageSequence images={saltoImages} alt={label} delay={3000} className="w-full h-full object-contain" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Tiempo transcurrido</p>
                <p className="text-[10px] font-mono text-slate-400">{progresoSegundos}s{tiempoPliometria ? ` / ${tiempoPliometria}s` : ""}</p>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: tiempoPliometria && progresoSegundos > 0 ? `${Math.min((progresoSegundos / parseFloat(tiempoPliometria)) * 100, 100)}%` : "0%",
                    background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
                  }} />
              </div>
            </div>

            {/* Resultados pruebas */}
            <div className="flex justify-center">
              <div className="w-full max-w-md p-6" style={card}>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 text-center mb-5">Resultados</p>
                <div className="space-y-3">
                  {[
                    { label: "Saltos detectados",       value: resultadoFinal ? `${resultadoFinal.saltos_validos}` : saltoRTActual ? `${saltoRTActual.num}` : "",                                                                                isLive: !!saltoRTActual && !resultadoFinal },
                    { label: "Índice de fatiga (%)",    value: (() => { const IF = calcularIndiceFatiga(primerSaltoSesion, ultimoSaltoSesion); return IF !== null ? `${IF}%` : "" })(),                                                          isLive: false },
                    { label: "Fuerza máxima alcanzada", value: resultadoFinal ? `Izq: ${resultadoFinal.pico_izq_kg} kg  /  Der: ${resultadoFinal.pico_der_kg} kg` : saltoRTActual ? `Izq: ${saltoRTActual.pico_izq} kg  /  Der: ${saltoRTActual.pico_der} kg` : "", isLive: !!saltoRTActual && !resultadoFinal },
                    { label: "Altura promedio",         value: resultadoFinal ? `${resultadoFinal.alt_max_cm} cm` : saltoRTActual ? `${saltoRTActual.altura_cm} cm` : "",                                                                        isLive: !!saltoRTActual && !resultadoFinal },
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
                  <button onClick={finalizarPliometria} disabled={!resultadoFinal || !pliometriaId}
                    className="pill-btn px-10 py-2.5 text-sm font-bold"
                    style={pillBtn(!!resultadoFinal && !!pliometriaId, !resultadoFinal || !pliometriaId)}>
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