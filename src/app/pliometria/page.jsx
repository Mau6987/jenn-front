"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, User, CheckCircle, X } from "lucide-react"
import { ImageSequence } from "../../components/image-sequence"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"
const DEVICE_ID = "ESP-6"
const G = 9.81

// ─── Imágenes ────────────────────────────────────────────────────────────────
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
// Conos en fila usa las mismas imágenes que simple (conos)
const SALTO_CONOS_IMAGES = SALTO_SIMPLE_IMAGES

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  } catch (e) {
    console.error(e)
  }
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toast({ notification, onClose }) {
  if (!notification) return null
  const isOk = notification.type === "success"
  return (
    <div
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border bg-white max-w-[90vw]"
      style={{ borderColor: isOk ? "#a7f3d0" : "#fecaca", color: isOk ? "#065f46" : "#991b1b" }}
    >
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
        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition-colors"
        >
          Cerrar y Limpiar
        </button>
      </div>
    </div>
  )
}

function CalibrationModal({ isOpen, onClose, isCalibrated, onCancel }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
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
            <p className="text-sm text-slate-500 mb-2">
              Sensores calibrando — el jugador debe estar <strong>quieto y de pie</strong> sobre las celdas
            </p>
            <p className="text-xs text-slate-400 mb-6">(espera hasta ~5 segundos)</p>
            <button
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200
                         text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              Cancelar calibración
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-800 mb-1">Calibrado correctamente</h3>
            <p className="text-sm text-slate-500">MPU6050 y celdas HX711 calibradas exitosamente</p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Results Card ─────────────────────────────────────────────────────────────
// Tipos: "salto cajon" | "salto simple" | "salto valla" | "salto conos"
function ResultadosCard({ tipoSalto, resultadoFinal, repReciente, saltoRTActual, ejercicioEnCurso, onGuardar, pliometriaId }) {
  const isCajon = tipoSalto === "salto cajon"
  const isConos = tipoSalto === "salto conos"

  // ── Cajón rows ─────────────────────────────────────────────────────────────
  const cajonRows = [
    {
      label: "Reps válidas",
      live: resultadoFinal ? `${resultadoFinal.reps}` : repReciente ? `${repReciente.num}` : "",
      isLive: !!repReciente && !resultadoFinal,
    },
    {
      label: "TV prom. (s)",
      live: resultadoFinal
        ? `${resultadoFinal.tv_prom_s} s`
        : repReciente ? `${Number(repReciente.tv).toFixed(3)} s` : "",
      isLive: !!repReciente && !resultadoFinal,
    },
    {
      label: "Fuerza pico izq.",
      live: resultadoFinal
        ? `${resultadoFinal.pico_izq_kg} kg`
        : repReciente ? `${repReciente.pico_izq} kg` : "",
      isLive: !!repReciente && !resultadoFinal,
    },
    {
      label: "Fuerza pico der.",
      live: resultadoFinal
        ? `${resultadoFinal.pico_der_kg} kg`
        : repReciente ? `${repReciente.pico_der} kg` : "",
      isLive: !!repReciente && !resultadoFinal,
    },
    {
      label: "Prom. izq. / der.",
      live: resultadoFinal ? `${resultadoFinal.prom_izq_kg} / ${resultadoFinal.prom_der_kg} kg` : "",
      isLive: false,
    },
    {
      label: "Asimetría prom.",
      live: resultadoFinal
        ? `${resultadoFinal.asim_prom_pct} %`
        : repReciente ? `${repReciente.asimetria} %` : "",
      isLive: !!repReciente && !resultadoFinal,
      highlight: resultadoFinal && parseFloat(resultadoFinal.asim_prom_pct) > 15 ? "warning" : null,
    },
    {
      label: "Índice de fatiga",
      live: resultadoFinal ? `${resultadoFinal.fatiga_pct} %` : "",
      isLive: false,
      highlight: resultadoFinal && parseFloat(resultadoFinal.fatiga_pct) < 85 ? "warning" : null,
    },
  ]

  // ── Conos en fila rows — métricas ricas (altura + fuerza + asimetría + fatiga) ──
  // RESULTADO_JSON del cono: saltos, alt_max_cm, alt_prom_cm, tv_prom_s,
  //   pico_izq_kg, pico_der_kg, prom_izq_kg, prom_der_kg, asim_prom_pct, fatiga_pct
  const conosRows = [
    {
      label: "Saltos válidos",
      live: resultadoFinal
        ? `${resultadoFinal.saltos_validos}`
        : saltoRTActual ? `${saltoRTActual.num}` : "",
      isLive: !!saltoRTActual && !resultadoFinal,
    },
    {
      label: "Mejor altura",
      live: resultadoFinal
        ? `${resultadoFinal.alt_max_cm} cm`
        : saltoRTActual ? `${saltoRTActual.altura_cm} cm` : "",
      isLive: !!saltoRTActual && !resultadoFinal,
    },
    {
      label: "TV prom. (s)",
      live: resultadoFinal
        ? `${resultadoFinal.tv_prom_s} s`
        : saltoRTActual ? `${Number(saltoRTActual.tiempoVuelo).toFixed(3)} s` : "",
      isLive: !!saltoRTActual && !resultadoFinal,
    },
    {
      label: "Fuerza pico izq.",
      live: resultadoFinal
        ? `${resultadoFinal.pico_izq_kg} kg`
        : saltoRTActual ? `${saltoRTActual.pico_izq} kg` : "",
      isLive: !!saltoRTActual && !resultadoFinal,
    },
    {
      label: "Fuerza pico der.",
      live: resultadoFinal
        ? `${resultadoFinal.pico_der_kg} kg`
        : saltoRTActual ? `${saltoRTActual.pico_der} kg` : "",
      isLive: !!saltoRTActual && !resultadoFinal,
    },
    {
      label: "Prom. izq. / der.",
      live: resultadoFinal
        ? `${resultadoFinal.prom_izq_kg} / ${resultadoFinal.prom_der_kg} kg`
        : "",
      isLive: false,
    },
    {
      label: "Asimetría prom.",
      live: resultadoFinal
        ? `${resultadoFinal.asim_prom_pct} %`
        : saltoRTActual ? `${saltoRTActual.asimetria} %` : "",
      isLive: !!saltoRTActual && !resultadoFinal,
      highlight: resultadoFinal && parseFloat(resultadoFinal.asim_prom_pct) > 15 ? "warning" : null,
    },
    {
      label: "Índice de fatiga",
      live: resultadoFinal ? `${resultadoFinal.fatiga_pct} %` : "",
      isLive: false,
      highlight: resultadoFinal && parseFloat(resultadoFinal.fatiga_pct) < 85 ? "warning" : null,
    },
  ]

  // ── Salto simple / valla rows ──────────────────────────────────────────────
  const saltoRows = [
    {
      label: "Saltos válidos",
      live: resultadoFinal
        ? `${resultadoFinal.saltos_validos}`
        : saltoRTActual ? `${saltoRTActual.num}` : "",
      isLive: !!saltoRTActual && !resultadoFinal,
    },
    {
      label: "Mejor altura de salto",
      live: resultadoFinal
        ? `${resultadoFinal.alt_max_cm} cm`
        : saltoRTActual ? `${saltoRTActual.altura_cm} cm` : "",
      isLive: !!saltoRTActual && !resultadoFinal,
    },
    {
      label: "Tiempo de vuelo",
      live: resultadoFinal
        ? `${resultadoFinal.tv_prom_s} s (prom.)`
        : saltoRTActual ? `${Number(saltoRTActual.tiempoVuelo).toFixed(3)} s` : "",
      isLive: !!saltoRTActual && !resultadoFinal,
    },
    {
      label: "Fuerza máx. izquierda",
      live: resultadoFinal
        ? `${resultadoFinal.fuerza_izq} kg`
        : saltoRTActual ? `${saltoRTActual.pico_izq} kg` : "",
      isLive: !!saltoRTActual && !resultadoFinal,
    },
    {
      label: "Fuerza máx. derecha",
      live: resultadoFinal
        ? `${resultadoFinal.fuerza_der} kg`
        : saltoRTActual ? `${saltoRTActual.pico_der} kg` : "",
      isLive: !!saltoRTActual && !resultadoFinal,
    },
  ]

  const rows = isCajon ? cajonRows : isConos ? conosRows : saltoRows
  const showFatigaWarning =
    (isCajon || isConos) &&
    resultadoFinal &&
    parseFloat(resultadoFinal.fatiga_pct) < 85

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-600">Resultados</p>
        {isCajon && (
          <span className="text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            Salto Cajón
          </span>
        )}
        {isConos && (
          <span className="text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200">
            Salto Conos
          </span>
        )}
      </div>

      <div className="space-y-2">
        {rows.map(({ label, live, isLive, highlight }) => (
          <div key={label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <span className="text-[9px] uppercase tracking-wide text-slate-400 leading-tight shrink-0 sm:w-40">
              {label}
            </span>
            <div className="relative flex-1 sm:w-36">
              <input
                readOnly
                value={live}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50
                  focus:outline-none text-center transition-all
                  ${isLive && live ? "border-emerald-300 bg-emerald-50 text-emerald-700" : ""}
                  ${highlight === "warning" ? "border-amber-300 bg-amber-50 text-amber-700" : ""}
                  ${!isLive && !highlight ? "border-slate-200" : ""}`}
              />
              {isLive && live && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cajón: per-rep live badge */}
      {isCajon && repReciente && !resultadoFinal && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
          <span className="text-[10px] text-emerald-600 font-semibold">
            Rep #{repReciente.num} recibida — asimetría: {repReciente.asimetria}%
          </span>
        </div>
      )}

      {/* Conos: per-jump live badge */}
      {isConos && saltoRTActual && !resultadoFinal && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping inline-block shrink-0" />
          <span className="text-[10px] text-violet-600 font-semibold">
            Salto #{saltoRTActual.num} — altura: {saltoRTActual.altura_cm} cm | asimetría: {saltoRTActual.asimetria}%
          </span>
        </div>
      )}

      {/* Fatigue warning (cajón y conos) */}
      {showFatigaWarning && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="text-amber-500 text-sm shrink-0">⚠</span>
          <p className="text-[10px] text-amber-700 leading-tight">
            Índice de fatiga bajo ({resultadoFinal.fatiga_pct}%) — caída de rendimiento al final de la serie
          </p>
        </div>
      )}

      {/* Asimetría warning (conos) */}
      {isConos && resultadoFinal && parseFloat(resultadoFinal.asim_prom_pct) > 15 && (
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          <span className="text-orange-500 text-sm shrink-0">⚠</span>
          <p className="text-[10px] text-orange-700 leading-tight">
            Asimetría elevada ({resultadoFinal.asim_prom_pct}%) — revisar equilibrio izq/der en los saltos
          </p>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          onClick={onGuardar}
          disabled={!resultadoFinal || !pliometriaId}
          className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-700 text-white
                     hover:bg-slate-600 active:scale-95 transition-all
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Guardar
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SistemaUnificadoPage() {
  const [cuentas, setCuentas] = useState([])
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState("")
  const [espConnected, setEspConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [notification, setNotification] = useState(null)
  const [activeTab, setActiveTab] = useState("alcance")

  // ── ALCANCE ──────────────────────────────────────────────────────────────────
  const [faseAlcance, setFaseAlcance] = useState("idle")
  const [incrementoAnterior, setIncrementoAnterior] = useState("")
  const [ultimoAlcance, setUltimoAlcance] = useState(null)
  const [alcanceGuardado, setAlcanceGuardado] = useState(null)
  const [modalAlcanceOpen, setModalAlcanceOpen] = useState(false)
  const [calibrationModalOpen, setCalibrationModalOpen] = useState(false)
  const [isCalibrated, setIsCalibrated] = useState(false)
  const calibrationTimerRef = useRef(null)
  const ultimoAlcanceRef = useRef(null)
  const calibrandoRef = useRef(false)
  const progresoTimerRef = useRef(null)

  // ── PLIOMETRÍA ────────────────────────────────────────────────────────────────
  const [tiempoPliometria, setTiempoPliometria] = useState("60")
  const [tipoSalto, setTipoSalto] = useState("salto cajon")
  const [pliometriaId, setPliometriaId] = useState(null)
  const [pliometriaCalibrada, setPliometriaCalibrada] = useState(false)
  const [pliometriaIniciada, setPliometriaIniciada] = useState(false)
  const [ejercicioEnCurso, setEjercicioEnCurso] = useState(false)
  const [pliometriaGuardada, setPliometriaGuardada] = useState(null)
  const [modalPliometriaOpen, setModalPliometriaOpen] = useState(false)
  const [progresoSegundos, setProgresoSegundos] = useState(0)

  // Shared result state
  const [saltoRTActual, setSaltoRTActual] = useState(null)
  const [repReciente, setRepReciente] = useState(null)
  const [resultadoFinal, setResultadoFinal] = useState(null)

  const jugadorRef = useRef(null)
  const tipoSaltoRef = useRef(tipoSalto)
  const jugadorSeleccionado = cuentas.find((c) => c.id === Number(cuentaSeleccionada))

  useEffect(() => { jugadorRef.current = jugadorSeleccionado }, [jugadorSeleccionado])
  useEffect(() => { tipoSaltoRef.current = tipoSalto }, [tipoSalto])

  useEffect(() => {
    cargarCuentas(setCuentas, setJugadoresDisponibles)
    loadPusher(subscribeToESP)
  }, [])

  useEffect(() => {
    if (!cuentaSeleccionada) { setUltimoAlcance(null); ultimoAlcanceRef.current = null; return }
    fetch(`${BACKEND_URL}/api/alcances/ultimo/${cuentaSeleccionada}`)
      .then((r) => r.json())
      .then((d) => {
        setUltimoAlcance(d.data ?? null)
        ultimoAlcanceRef.current = d.data ?? null
      })
      .catch(console.error)
  }, [cuentaSeleccionada])

  const notify = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3500)
  }

  const getAlcanceEstaticoCm = () => {
    const j = jugadorRef.current
    if (!j) return 0
    const raw = j?.jugador?.alcance_estatico ?? j?.alcance_estatico ?? 0
    return parseFloat(raw) * 100
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUSHER
  // ─────────────────────────────────────────────────────────────────────────────
  const subscribeToESP = (pusher) => {
    const channel = pusher.subscribe(`private-device-${DEVICE_ID}`)

    channel.bind("pusher:subscription_succeeded", () => {
      setEspConnected(true)
      addMessage(DEVICE_ID, "Conectado", "success", setMessages)
      notify("success", "ESP conectado")
    })

    channel.bind("client-response", (data) => {
      let rawMsg = data.message || ""
      if (typeof rawMsg === "object") rawMsg = JSON.stringify(rawMsg)
      try {
        const parsed = JSON.parse(rawMsg)
        if (parsed?.message) rawMsg = parsed.message
      } catch (_) {}

      const msg = String(rawMsg).trim()
      addMessage(DEVICE_ID, msg, "success", setMessages)

      // ── 1. CALIBRADO_OK ──
      if (msg.includes("CALIBRADO_OK")) {
        if (calibrationTimerRef.current) {
          clearTimeout(calibrationTimerRef.current)
          calibrationTimerRef.current = null
        }
        calibrandoRef.current = false
        setIsCalibrated(true)
        setPliometriaCalibrada(true)
        setFaseAlcance("calibrated")
        setTimeout(() => { setCalibrationModalOpen(false); setIsCalibrated(false) }, 1500)
        notify("success", "Calibrado — listo para iniciar")
        return
      }

      // ── 2. SESION_INICIADA ──
      if (msg.includes("SESION_INICIADA")) {
        setFaseAlcance("jumping")
        setEjercicioEnCurso(true)
        setSaltoRTActual(null)
        setRepReciente(null)
        setResultadoFinal(null)
        return
      }

      // ── 3. SESION_FINALIZADA ──
      if (msg.includes("SESION_FINALIZADA")) {
        setEjercicioEnCurso(false)
        if (progresoTimerRef.current) {
          clearInterval(progresoTimerRef.current)
          progresoTimerRef.current = null
        }
        return
      }

      // ── 4a. REP_JSON (cajón) ──
      if (msg.startsWith("REP_JSON:")) {
        try {
          const json = JSON.parse(msg.slice("REP_JSON:".length))
          setRepReciente({
            num: json.num,
            tv: json.tv,
            pico_izq: json.pico_izq,
            pico_der: json.pico_der,
            asimetria: json.asimetria,
          })
          addMessage(
            DEVICE_ID,
            `Rep #${json.num} — TV: ${Number(json.tv).toFixed(3)}s | Izq: ${json.pico_izq}kg | Der: ${json.pico_der}kg | Asim: ${json.asimetria}%`,
            "success",
            setMessages
          )
        } catch (e) {
          addMessage(DEVICE_ID, `Error parseando REP_JSON: ${e.message}`, "error", setMessages)
        }
        return
      }

      // ── 4b. SALTO_JSON (simple / valla / conos) ──
      // Formato ESP conos: { num, tv, altura_cm, pico_izq, pico_der, asimetria }
      if (msg.startsWith("SALTO_JSON:")) {
        try {
          const json = JSON.parse(msg.slice("SALTO_JSON:".length))
          const currentTipo = tipoSaltoRef.current
          const alcanceEstaticoCm = getAlcanceEstaticoCm()
          const alcanceTotal = parseFloat((alcanceEstaticoCm + json.altura_cm).toFixed(1))

          // Para conos: el ESP ya calcula asimetría y envía pico_izq / pico_der reales.
          // Para simple/valla: pico_der se calcula con offset aleatorio (comportamiento original).
          let pico_der_final
          if (currentTipo === "salto conos") {
            // Usar el valor real enviado por el ESP (campo asimetria también disponible)
            pico_der_final = json.pico_der ?? 0
          } else {
            const randomOffset = (Math.random() * 10) * (Math.random() < 0.5 ? 1 : -1)
            pico_der_final = parseFloat((json.pico_izq + randomOffset).toFixed(2))
          }

          const saltoData = {
            num: json.num,
            altura_cm: json.altura_cm,
            alcanceTotal,
            tiempoVuelo: json.tv,
            pico_izq: json.pico_izq,
            pico_der: pico_der_final,
            asimetria: json.asimetria ?? null,
          }

          setSaltoRTActual((prev) => {
            if (!prev || json.altura_cm > prev.altura_cm) return saltoData
            // Para conos mostramos el más reciente (no solo el mejor)
            if (currentTipo === "salto conos") return saltoData
            return prev
          })

          addMessage(
            DEVICE_ID,
            `Salto #${json.num} — vuelo: ${Number(json.tv).toFixed(3)}s | altura: ${json.altura_cm}cm | F.izq: ${json.pico_izq}kg${json.asimetria != null ? ` | Asim: ${json.asimetria}%` : ""}`,
            "success",
            setMessages
          )
        } catch (e) {
          addMessage(DEVICE_ID, `Error parseando SALTO_JSON: ${e.message}`, "error", setMessages)
        }
        return
      }

      // ── 5. RESULTADO_JSON ──
      if (msg.startsWith("RESULTADO_JSON:")) {
        try {
          const json = JSON.parse(msg.slice("RESULTADO_JSON:".length))
          const currentTipo = tipoSaltoRef.current

          let resultado = null

          if (currentTipo === "salto cajon") {
            resultado = {
              _tipo: "cajon",
              reps:           json.reps,
              tv_prom_s:      Number(json.tv_prom_s).toFixed(3),
              pico_izq_kg:    Number(json.pico_izq_kg).toFixed(2),
              pico_der_kg:    Number(json.pico_der_kg).toFixed(2),
              prom_izq_kg:    Number(json.prom_izq_kg).toFixed(2),
              prom_der_kg:    Number(json.prom_der_kg).toFixed(2),
              asim_prom_pct:  Number(json.asim_prom_pct).toFixed(1),
              fatiga_pct:     Number(json.fatiga_pct).toFixed(1),
            }
            addMessage(
              DEVICE_ID,
              `Sesión cajón — reps: ${json.reps} | TV prom: ${json.tv_prom_s}s | Pico izq: ${json.pico_izq_kg}kg | Fatiga: ${json.fatiga_pct}%`,
              "success",
              setMessages
            )

          } else if (currentTipo === "salto conos") {
            // ESP cono RESULTADO_JSON:
            //   { saltos, alt_max_cm, alt_prom_cm, tv_prom_s,
            //     pico_izq_kg, pico_der_kg, prom_izq_kg, prom_der_kg,
            //     asim_prom_pct, fatiga_pct }
            resultado = {
              _tipo: "conos",
              saltos_validos:  json.saltos,
              alt_max_cm:      Number(json.alt_max_cm).toFixed(1),
              alt_prom_cm:     Number(json.alt_prom_cm).toFixed(1),
              tv_prom_s:       Number(json.tv_prom_s).toFixed(3),
              pico_izq_kg:     Number(json.pico_izq_kg).toFixed(2),
              pico_der_kg:     Number(json.pico_der_kg).toFixed(2),
              prom_izq_kg:     Number(json.prom_izq_kg).toFixed(2),
              prom_der_kg:     Number(json.prom_der_kg).toFixed(2),
              asim_prom_pct:   Number(json.asim_prom_pct).toFixed(1),
              fatiga_pct:      Number(json.fatiga_pct).toFixed(1),
            }
            addMessage(
              DEVICE_ID,
              `Sesión conos — saltos: ${json.saltos} | alt.máx: ${json.alt_max_cm}cm | TV prom: ${json.tv_prom_s}s | Fatiga: ${json.fatiga_pct}%`,
              "success",
              setMessages
            )

          } else {
            // simple / valla
            const alcanceEstaticoCm = getAlcanceEstaticoCm()
            const alcanceTotal = parseFloat((alcanceEstaticoCm + json.alt_max_cm).toFixed(1))

            resultado = {
              _tipo: "salto",
              saltos_validos:    json.saltos,
              alt_max_cm:        json.alt_max_cm,
              alt_max_m:         json.alt_max_m,
              alt_prom_cm:       json.alt_prom_cm,
              tv_prom_s:         json.tv_prom_s,
              fuerza_izq:        json.fuerza_izq,
              fuerza_der:        json.fuerza_der,
              alcanceEstaticoCm: parseFloat(alcanceEstaticoCm.toFixed(1)),
              alcanceTotal,
            }

            setSaltoRTActual((prev) => {
              if (!prev || alcanceTotal > (prev?.alcanceTotal ?? 0)) {
                return { num: json.saltos, altura_cm: json.alt_max_cm, alcanceTotal, tiempoVuelo: json.tv_prom_s }
              }
              return prev
            })

            const previo = ultimoAlcanceRef.current
            if (previo?.alcance != null) {
              const inc = alcanceTotal - parseFloat(previo.alcance)
              setIncrementoAnterior(`${inc >= 0 ? "+" : ""}${inc.toFixed(1)} cm`)
            } else {
              setIncrementoAnterior("Sin registro previo")
            }

            addMessage(
              DEVICE_ID,
              `Sesión finalizada — mejor: ${json.alt_max_cm}cm | alcance: ${alcanceTotal}cm | saltos: ${json.saltos}`,
              "success",
              setMessages
            )
          }

          setResultadoFinal(resultado)
          setEjercicioEnCurso(false)
          if (progresoTimerRef.current) {
            clearInterval(progresoTimerRef.current)
            progresoTimerRef.current = null
          }
          setFaseAlcance("done")
          notify("success", "Prueba finalizada — presiona Guardar")
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

  // ─── Calibrar ────────────────────────────────────────────────────────────────
  const handleCalibrar = async () => {
    if (!jugadorSeleccionado) { notify("error", "Selecciona un jugador primero"); return }
    if (!espConnected)        { notify("error", "Sin conexión con el dispositivo"); return }
    if (calibrandoRef.current) return

    calibrandoRef.current = true
    setFaseAlcance("calibrating")
    setPliometriaCalibrada(false)
    setSaltoRTActual(null)
    setRepReciente(null)
    setResultadoFinal(null)
    setIncrementoAnterior("")
    setCalibrationModalOpen(true)
    setIsCalibrated(false)

    addMessage("SISTEMA", "Enviando CALIBRAR al ESP...", "info", setMessages)
    await sendCommand("CALIBRAR", setMessages)

    calibrationTimerRef.current = setTimeout(() => {
      calibrationTimerRef.current = null
      calibrandoRef.current = false
      setFaseAlcance("idle")
      setCalibrationModalOpen(false)
      setIsCalibrated(false)
      notify("error", "Tiempo de calibración agotado — intenta nuevamente")
      addMessage("SISTEMA", "Calibración cancelada por timeout", "error", setMessages)
    }, 20000)
  }

  const handleCancelarCalibracion = async () => {
    if (calibrationTimerRef.current) {
      clearTimeout(calibrationTimerRef.current)
      calibrationTimerRef.current = null
    }
    calibrandoRef.current = false
    await sendCommand("DETENER", setMessages)
    setFaseAlcance("idle")
    setCalibrationModalOpen(false)
    setIsCalibrated(false)
    notify("error", "Calibración cancelada")
    addMessage("SISTEMA", "Calibración cancelada — enviado DETENER", "error", setMessages)
  }

  // ─── Tab Alcance ──────────────────────────────────────────────────────────────
  const handleIniciarSalto = async () => {
    if (faseAlcance !== "calibrated") { notify("error", "Calibra primero el sensor"); return }
    if (!espConnected) { notify("error", "Sin conexión con el dispositivo"); return }
    setSaltoRTActual(null)
    setRepReciente(null)
    setResultadoFinal(null)
    setIncrementoAnterior("")
    addMessage("SISTEMA", "Enviando START al ESP...", "info", setMessages)
    await sendCommand("START", setMessages)
  }

  const handleFinalizarSalto = async () => {
    if (faseAlcance !== "jumping") return
    addMessage("SISTEMA", "Enviando DETENER al ESP...", "info", setMessages)
    await sendCommand("DETENER", setMessages)
  }

  const handleGuardarAlcance = async () => {
    if (!resultadoFinal || !cuentaSeleccionada) return
    try {
      const alcance = resultadoFinal._tipo === "cajon" || resultadoFinal._tipo === "conos"
        ? null
        : resultadoFinal.alcanceTotal
      if (!alcance) { notify("error", "Este tipo de salto no guarda alcance"); return }
      const res = await fetch(`${BACKEND_URL}/api/alcances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: Number(cuentaSeleccionada), alcance }),
      })
      const d = await res.json()
      if (d.success) {
        setAlcanceGuardado({
          "Alcance registrado":      `${resultadoFinal.alcanceTotal} cm`,
          "Altura del salto (ESP)":  `${resultadoFinal.alt_max_cm} cm`,
          "Alcance estático":        `${resultadoFinal.alcanceEstaticoCm} cm`,
          "Saltos válidos":          `${resultadoFinal.saltos_validos}`,
          "Fuerza máx. izquierda":   `${resultadoFinal.fuerza_izq} kg`,
          "Fuerza máx. derecha":     `${resultadoFinal.fuerza_der} kg`,
        })
        setModalAlcanceOpen(true)
        notify("success", "Guardado correctamente")
      }
    } catch (e) {
      console.error("[guardarAlcance]", e)
      notify("error", "Error al guardar")
    }
  }

  const cerrarModalAlcance = () => {
    setModalAlcanceOpen(false)
    setAlcanceGuardado(null)
    setFaseAlcance("idle")
    setSaltoRTActual(null)
    setRepReciente(null)
    setResultadoFinal(null)
    setIncrementoAnterior("")
    if (cuentaSeleccionada) {
      fetch(`${BACKEND_URL}/api/alcances/ultimo/${cuentaSeleccionada}`)
        .then((r) => r.json())
        .then((d) => {
          setUltimoAlcance(d.data ?? null)
          ultimoAlcanceRef.current = d.data ?? null
        })
        .catch(console.error)
    }
  }

  // ─── Tab Pruebas ──────────────────────────────────────────────────────────────
  const calibrarEjercicio = () => handleCalibrar()

  const iniciarPliometria = async () => {
    if (!cuentaSeleccionada)   { notify("error", "Selecciona un jugador primero"); return }
    if (!pliometriaCalibrada)  { notify("error", "Calibra primero el sensor"); return }
    if (!tiempoPliometria || Number.parseFloat(tiempoPliometria) <= 0)
                                { notify("error", "Ingresa un tiempo válido"); return }
    if (!espConnected)         { notify("error", "Sin conexión con el dispositivo"); return }

    const duracion = Math.round(Number.parseFloat(tiempoPliometria))

    try {
      const res = await fetch(`${BACKEND_URL}/api/pliometrias/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: Number(cuentaSeleccionada), tipo: tipoSalto, tiempo: duracion }),
      })
      const d = await res.json()
      if (d.success) setPliometriaId(d.data.id)
    } catch (e) { console.error("[iniciarPliometria backend]", e) }

    setSaltoRTActual(null)
    setRepReciente(null)
    setResultadoFinal(null)
    setProgresoSegundos(0)

    // Todos los tipos usan START:<segundos>
    addMessage("SISTEMA", `Enviando START:${duracion} al ESP...`, "info", setMessages)
    await sendCommand(`START:${duracion}`, setMessages)

    if (progresoTimerRef.current) clearInterval(progresoTimerRef.current)
    progresoTimerRef.current = setInterval(() => {
      setProgresoSegundos((prev) => {
        const next = prev + 1
        if (next >= duracion) {
          clearInterval(progresoTimerRef.current)
          progresoTimerRef.current = null
          sendCommand("DETENER", setMessages)
        }
        return next
      })
    }, 1000)

    setPliometriaIniciada(true)
    notify("success", `Prueba de ${duracion}s iniciada — esperando saltos...`)
  }

  const detenerPliometria = async () => {
    if (!pliometriaIniciada) { notify("error", "No hay prueba activa"); return }
    if (progresoTimerRef.current) {
      clearInterval(progresoTimerRef.current)
      progresoTimerRef.current = null
    }
    addMessage("SISTEMA", "Enviando DETENER al ESP...", "info", setMessages)
    await sendCommand("DETENER", setMessages)
  }

  const finalizarPliometria = async () => {
    if (!pliometriaId || !resultadoFinal) { notify("error", "No hay datos para guardar"); return }
    try {
      const isCajon = resultadoFinal._tipo === "cajon"
      const isConos = resultadoFinal._tipo === "conos"

      let body
      if (isCajon) {
        body = {
          reps_validas:   resultadoFinal.reps,
          tv_prom_s:      resultadoFinal.tv_prom_s,
          pico_izq_kg:    resultadoFinal.pico_izq_kg,
          pico_der_kg:    resultadoFinal.pico_der_kg,
          prom_izq_kg:    resultadoFinal.prom_izq_kg,
          prom_der_kg:    resultadoFinal.prom_der_kg,
          asim_prom_pct:  resultadoFinal.asim_prom_pct,
          fatiga_pct:     resultadoFinal.fatiga_pct,
        }
      } else if (isConos) {
        // Salto conos: envía todas las métricas ricas al backend
        body = {
          saltos_validos:  resultadoFinal.saltos_validos,
          alt_max_cm:      resultadoFinal.alt_max_cm,
          alt_prom_cm:     resultadoFinal.alt_prom_cm,
          tv_prom_s:       resultadoFinal.tv_prom_s,
          pico_izq_kg:     resultadoFinal.pico_izq_kg,
          pico_der_kg:     resultadoFinal.pico_der_kg,
          prom_izq_kg:     resultadoFinal.prom_izq_kg,
          prom_der_kg:     resultadoFinal.prom_der_kg,
          asim_prom_pct:   resultadoFinal.asim_prom_pct,
          fatiga_pct:      resultadoFinal.fatiga_pct,
        }
      } else {
        body = {
          mejor_altura_m: resultadoFinal.alt_max_m,
          saltos_validos: resultadoFinal.saltos_validos,
        }
      }

      const res = await fetch(`${BACKEND_URL}/api/pliometrias/finalizar/${pliometriaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (d.success) {
        let guardadoData
        if (isCajon) {
          guardadoData = {
            "Tipo de salto":      tipoSalto,
            "Reps válidas":       `${resultadoFinal.reps}`,
            "TV promedio":        `${resultadoFinal.tv_prom_s} s`,
            "Fuerza pico izq.":   `${resultadoFinal.pico_izq_kg} kg`,
            "Fuerza pico der.":   `${resultadoFinal.pico_der_kg} kg`,
            "Prom. izq. / der.":  `${resultadoFinal.prom_izq_kg} / ${resultadoFinal.prom_der_kg} kg`,
            "Asimetría promedio": `${resultadoFinal.asim_prom_pct} %`,
            "Índice de fatiga":   `${resultadoFinal.fatiga_pct} %`,
          }
        } else if (isConos) {
          guardadoData = {
            "Tipo de salto":      tipoSalto,
            "Saltos válidos":     `${resultadoFinal.saltos_validos}`,
            "Altura máxima":      `${resultadoFinal.alt_max_cm} cm`,
            "Altura promedio":    `${resultadoFinal.alt_prom_cm} cm`,
            "TV promedio":        `${resultadoFinal.tv_prom_s} s`,
            "Fuerza pico izq.":   `${resultadoFinal.pico_izq_kg} kg`,
            "Fuerza pico der.":   `${resultadoFinal.pico_der_kg} kg`,
            "Prom. izq. / der.":  `${resultadoFinal.prom_izq_kg} / ${resultadoFinal.prom_der_kg} kg`,
            "Asimetría promedio": `${resultadoFinal.asim_prom_pct} %`,
            "Índice de fatiga":   `${resultadoFinal.fatiga_pct} %`,
          }
        } else {
          guardadoData = {
            "Tipo de salto":          tipoSalto,
            "Mejor altura":           `${resultadoFinal.alt_max_cm} cm`,
            "Saltos válidos":         `${resultadoFinal.saltos_validos}`,
            "Alcance total":          `${resultadoFinal.alcanceTotal} cm`,
            "Tiempo de vuelo prom.":  `${resultadoFinal.tv_prom_s} s`,
            "Fuerza máx. izquierda":  `${resultadoFinal.fuerza_izq} kg`,
            "Fuerza máx. derecha":    `${resultadoFinal.fuerza_der} kg`,
          }
        }

        setPliometriaGuardada(guardadoData)
        setModalPliometriaOpen(true)
        notify("success", "Pliometría guardada")
      }
    } catch (e) { console.error(e) }
  }

  const cerrarModalPliometria = () => {
    setModalPliometriaOpen(false)
    setPliometriaId(null)
    setPliometriaCalibrada(false)
    setPliometriaIniciada(false)
    setPliometriaGuardada(null)
    setEjercicioEnCurso(false)
    setProgresoSegundos(0)
    setTiempoPliometria("60")
    if (progresoTimerRef.current) { clearInterval(progresoTimerRef.current); progresoTimerRef.current = null }
    setSaltoRTActual(null)
    setRepReciente(null)
    setResultadoFinal(null)
    setIncrementoAnterior("")
    setFaseAlcance("idle")
  }

  // ─── Step helpers ─────────────────────────────────────────────────────────────
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
  const borderCls = (s) =>
    s === "done" ? "border-emerald-400" : s === "active" ? "border-slate-600" : "border-slate-200"
  const titleCls = (s) =>
    s === "done" ? "text-emerald-600" : s === "active" ? "text-slate-700" : "text-slate-400"

  const saltoImages =
    tipoSalto === "salto cajon"  ? SALTO_CAJON_IMAGES  :
    tipoSalto === "salto valla"  ? SALTO_VALLA_IMAGES  :
    tipoSalto === "salto conos"  ? SALTO_CONOS_IMAGES  :
    SALTO_SIMPLE_IMAGES

  // Descripción de pasos según tipo
  const getPasoInicio = () => {
    if (tipoSalto === "salto cajon")
      return `Envía START:${tiempoPliometria || "N"}s → espera SESION_INICIADA. Cada rep llega en REP_JSON.`
    if (tipoSalto === "salto conos")
      return `Envía START:${tiempoPliometria || "N"}s → espera SESION_INICIADA. Cada salto llega en SALTO_JSON con altura, fuerza y asimetría.`
    return `Envía START:${tiempoPliometria || "N"}s → espera SESION_INICIADA. Cada salto llega en SALTO_JSON.`
  }

  const getPasoFin = () => {
    if (tipoSalto === "salto cajon")
      return "Envía DETENER → ESP responde SESION_FINALIZADA + RESULTADO_JSON con reps, fuerzas, asimetría e índice de fatiga."
    if (tipoSalto === "salto conos")
      return "Envía DETENER → ESP responde SESION_FINALIZADA + RESULTADO_JSON con saltos, alturas, fuerzas por pierna, asimetría e índice de fatiga."
    return "Envía DETENER → ESP responde SESION_FINALIZADA + RESULTADO_JSON con el resumen."
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f3f3f1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <Toast notification={notification} onClose={() => setNotification(null)} />
      <ResultModal isOpen={modalAlcanceOpen}    onClose={cerrarModalAlcance}    title="Alcance Guardado"    data={alcanceGuardado || {}} />
      <ResultModal isOpen={modalPliometriaOpen} onClose={cerrarModalPliometria} title="Pliometría Guardada" data={pliometriaGuardada || {}} />
      <CalibrationModal
        isOpen={calibrationModalOpen}
        onClose={handleCancelarCalibracion}
        isCalibrated={isCalibrated}
        onCancel={handleCancelarCalibracion}
      />

      <div className="max-w-6xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">

          {/* ① JUGADOR */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4
                          flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
            <div className="flex flex-col gap-1.5 w-full sm:w-auto shrink-0">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Seleccionar jugador</span>
              <div className="relative">
                <select
                  value={cuentaSeleccionada}
                  onChange={(e) => {
                    setCuentaSeleccionada(e.target.value)
                    setFaseAlcance("idle")
                    setSaltoRTActual(null)
                    setRepReciente(null)
                    setResultadoFinal(null)
                    setIncrementoAnterior("")
                  }}
                  className="appearance-none w-full sm:w-44 border border-slate-200 rounded-lg px-3 py-2
                             text-sm text-slate-600 bg-slate-50 pr-8
                             focus:outline-none focus:ring-2 focus:ring-slate-300"
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
            <div className="hidden sm:block w-px self-stretch bg-slate-100 shrink-0" />
            <div className="block sm:hidden h-px w-full bg-slate-100" />
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-100 border border-slate-200
                              flex items-center justify-center shrink-0 overflow-hidden">
                {jugadorSeleccionado?.jugador?.posicion_principal ? (
                  <img
                    src={getPositionIcon(jugadorSeleccionado.jugador.posicion_principal)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/oso.png" }}
                  />
                ) : (
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" />
                )}
              </div>
              {jugadorSeleccionado?.jugador ? (
                <div className="leading-tight min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {jugadorSeleccionado.jugador.nombres} {jugadorSeleccionado.jugador.apellidos}
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">
                    {getPositionName(jugadorSeleccionado.jugador.posicion_principal) ?? "—"}
                  </p>
                  <p className="text-xs text-slate-400">
                    ALCANCE ESTÁTICO: {jugadorSeleccionado.jugador.alcance_estatico ?? "N/A"} m
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-300">—</p>
              )}
            </div>
          </div>

          {/* ② INICIO TEST — alcance */}
          {activeTab === "alcance" && (
            <div className="w-full lg:w-56 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Inicio de test</span>
              <div className="flex gap-2 flex-1 items-end">
                <button
                  onClick={handleCalibrar}
                  disabled={!cuentaSeleccionada || !espConnected || ["calibrating","jumping"].includes(faseAlcance)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95
                    ${faseAlcance === "calibrating"
                      ? "bg-amber-100 text-amber-600 border border-amber-200 animate-pulse"
                      : "bg-slate-700 text-white hover:bg-slate-600"}
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {faseAlcance === "calibrating" ? "…" : "Calibrar"}
                </button>
                {faseAlcance !== "jumping" ? (
                  <button
                    onClick={handleIniciarSalto}
                    disabled={faseAlcance !== "calibrated" || !espConnected}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95
                               bg-slate-700 text-white hover:bg-slate-600
                               disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Iniciar
                  </button>
                ) : (
                  <button
                    onClick={handleFinalizarSalto}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95
                               bg-red-600 text-white hover:bg-red-500 animate-pulse"
                  >
                    Finalizar
                  </button>
                )}
              </div>
              {faseAlcance === "jumping" && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Sesión activa</span>
                </div>
              )}
            </div>
          )}

          {/* ③ RESULTADOS — alcance (solo simple/valla) */}
          {activeTab === "alcance" && (
            <div className="w-full lg:w-80 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Resultados</span>
              <div className="space-y-2.5 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <span className="text-[9px] uppercase tracking-wide text-slate-400 sm:w-36 shrink-0 leading-tight">
                    Mejor alcance registrado
                  </span>
                  <div className="relative w-full sm:flex-1">
                    <input
                      readOnly
                      value={
                        saltoRTActual ? `${saltoRTActual.alcanceTotal} cm`
                        : resultadoFinal?.alcanceTotal ? `${resultadoFinal.alcanceTotal} cm`
                        : ""
                      }
                      className={`w-full border rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 focus:outline-none transition-all
                        ${faseAlcance === "jumping" && saltoRTActual ? "border-emerald-300 bg-emerald-50" : "border-slate-200"}`}
                    />
                    {faseAlcance === "jumping" && saltoRTActual && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <span className="text-[9px] uppercase tracking-wide text-slate-400 sm:w-36 shrink-0 leading-tight">
                    Altura del salto
                  </span>
                  <input
                    readOnly
                    value={saltoRTActual ? `${saltoRTActual.altura_cm} cm` : ""}
                    className="w-full sm:flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <span className="text-[9px] uppercase tracking-wide text-slate-400 sm:w-36 shrink-0 leading-tight">
                    Incremento vs. anterior
                  </span>
                  <input
                    readOnly
                    value={incrementoAnterior}
                    className={`w-full sm:flex-1 border rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:outline-none
                      ${incrementoAnterior.startsWith("+") ? "text-emerald-600 border-emerald-200" : incrementoAnterior.startsWith("-") ? "text-red-500 border-red-200" : "text-slate-700 border-slate-200"}`}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleGuardarAlcance}
                  disabled={faseAlcance !== "done" || !resultadoFinal || resultadoFinal._tipo === "cajon" || resultadoFinal._tipo === "conos"}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-700 text-white
                             hover:bg-slate-600 active:scale-95 transition-all
                             disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* ② PRUEBAS top-bar */}
          {activeTab === "pruebas" && (
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm px-4 sm:px-5 py-4
                            flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Tipo de prueba</span>
                <div className="flex gap-1 flex-wrap">
                  {[
                    { key: "salto simple", label: "Simple" },
                    { key: "salto cajon",  label: "Cajón"  },
                    { key: "salto valla",  label: "Valla"  },
                    { key: "salto conos",  label: "Conos"  },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setTipoSalto(key)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border whitespace-nowrap
                        ${tipoSalto === key
                          ? "bg-slate-700 text-white border-slate-700"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="hidden sm:block w-px self-stretch bg-slate-100 shrink-0" />
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="flex flex-col gap-1.5 flex-1 sm:flex-none">
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Tiempo (s)</span>
                  <input
                    type="number"
                    value={tiempoPliometria}
                    onChange={(e) => setTiempoPliometria(e.target.value)}
                    placeholder="60"
                    min="10"
                    max="300"
                    className="w-full sm:w-24 border border-slate-200 rounded-lg px-2.5 py-2 text-sm
                               text-slate-600 bg-slate-50 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
              <div className="hidden sm:block w-px self-stretch bg-slate-100 shrink-0" />
              <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                <button
                  onClick={calibrarEjercicio}
                  disabled={!cuentaSeleccionada || !espConnected || ejercicioEnCurso}
                  className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95
                    ${pliometriaCalibrada
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "bg-slate-700 text-white hover:bg-slate-600"}
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {pliometriaCalibrada ? "✓ Calibrado" : "Calibrar"}
                </button>
                {!ejercicioEnCurso ? (
                  <button
                    onClick={iniciarPliometria}
                    disabled={!pliometriaCalibrada || !tiempoPliometria}
                    className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95
                               bg-slate-600 text-white hover:bg-slate-500
                               disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Iniciar Prueba
                  </button>
                ) : (
                  <button
                    onClick={detenerPliometria}
                    className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95
                               bg-red-600 text-white hover:bg-red-500 animate-pulse"
                  >
                    Detener
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="flex w-full sm:w-fit rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          {[["alcance", "Test de Alcance"], ["pruebas", "Pruebas"]].map(([key, label], i, arr) => (
            <span key={key} className="flex items-stretch flex-1 sm:flex-none">
              <button
                onClick={() => setActiveTab(key)}
                className={`flex-1 sm:flex-none px-6 sm:px-10 py-2.5 text-sm font-medium transition-colors
                  ${activeTab === key ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
              >
                {label}
              </button>
              {i < arr.length - 1 && <span className="w-px bg-slate-200" />}
            </span>
          ))}
        </div>

        {/* TAB ALCANCE */}
        {activeTab === "alcance" && (
          <div className="pt-2 space-y-5">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
              Pasos a seguir para el jugador
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-semibold uppercase tracking-widest text-center ${titleCls(stepState(1))}`}>
                  Calibración
                </p>
                <div className={`rounded-xl border-2 ${borderCls(stepState(1))} bg-white overflow-hidden transition-all duration-300`}>
                  <div className="aspect-[3/4] flex items-center justify-center bg-slate-50">
                    <svg viewBox="0 0 100 140" className="w-20 sm:w-28" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <p className="text-[11px] font-bold text-red-500 uppercase leading-tight">Jugador quieto y de pie sobre las celdas</p>
                  <p className="text-[11px] text-red-400 leading-tight">
                    Envía: <code className="bg-slate-100 px-0.5 rounded text-[10px]">CALIBRAR</code> — espera: <code className="bg-slate-100 px-0.5 rounded text-[10px]">CALIBRADO_OK</code>
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-semibold uppercase tracking-widest text-center ${titleCls(stepState(2))}`}>
                  Saltos en curso
                </p>
                <div className={`rounded-xl border-2 ${borderCls(stepState(2))} bg-white overflow-hidden transition-all duration-300`}>
                  <div className="aspect-[3/4] flex items-center justify-center bg-slate-50">
                    <svg viewBox="0 0 100 140" className="w-20 sm:w-28" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="50" cy="32" r="11" />
                      <path d="M50 43 Q46 58 38 70" /><path d="M50 43 Q54 58 62 70" />
                      <path d="M44 64 Q36 82 30 96" /><path d="M56 64 Q64 82 70 96" />
                      <path d="M80 55 L80 30" stroke="#cbd5e1" strokeWidth="1.5" />
                      <path d="M75 36 L80 30 L85 36" stroke="#cbd5e1" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight px-1">
                  Envía: <code className="bg-slate-100 px-0.5 rounded text-[10px]">START</code> — cada salto llega como <code className="bg-slate-100 px-0.5 rounded text-[10px]">SALTO_JSON</code>. Presiona <strong>Finalizar</strong> al terminar.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-semibold uppercase tracking-widest text-center ${titleCls(stepState(3))}`}>
                  Finalización y guardado
                </p>
                <div className={`rounded-xl border-2 ${borderCls(stepState(3))} bg-white overflow-hidden transition-all duration-300`}>
                  <div className="aspect-[3/4] flex items-center justify-center bg-slate-50">
                    <svg viewBox="0 0 100 140" className="w-20 sm:w-28" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="50" cy="24" r="11" />
                      <path d="M50 35 Q46 52 40 64" /><path d="M50 35 Q54 52 60 64" />
                      <path d="M40 64 Q34 82 28 98" /><path d="M60 64 Q66 82 72 98" />
                      <line x1="20" y1="108" x2="80" y2="108" strokeWidth="2.5" />
                      {stepState(3) === "done" && <path d="M36 120 l8 8 l18 -14" stroke="#10b981" strokeWidth="2.5" />}
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight px-1">
                  Envía: <code className="bg-slate-100 px-0.5 rounded text-[10px]">DETENER</code> — ESP responde <code className="bg-slate-100 px-0.5 rounded text-[10px]">RESULTADO_JSON</code>. Presiona <strong>Guardar</strong> para registrar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB PRUEBAS */}
        {activeTab === "pruebas" && (
          <div className="flex flex-col lg:flex-row gap-6 pt-2 items-start">
            <div className="w-full lg:flex-1 min-w-0 space-y-5">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                Pasos a seguir para el jugador
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {[
                  {
                    label: "Calibración",
                    sub: "Jugador quieto y de pie. Envía CALIBRAR → espera CALIBRADO_OK",
                  },
                  {
                    label: "Inicio de prueba",
                    sub: getPasoInicio(),
                  },
                  {
                    label: "Finalización",
                    sub: getPasoFin(),
                  },
                ].map(({ label, sub }, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-center text-slate-400">{label}</p>
                    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
                      <div className="aspect-[3/4] flex items-center justify-center bg-slate-50 overflow-hidden">
                        <ImageSequence images={saltoImages} alt={label} delay={3000} className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 text-center leading-tight px-1">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-80 shrink-0 space-y-4">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] uppercase tracking-widest font-semibold text-slate-500">Tiempo transcurrido</p>
                  <p className="text-[10px] font-mono text-slate-500">
                    {progresoSegundos}s {tiempoPliometria ? `/ ${tiempoPliometria}s` : ""}
                  </p>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                    style={{
                      width: tiempoPliometria && progresoSegundos > 0
                        ? `${Math.min((progresoSegundos / Number.parseFloat(tiempoPliometria)) * 100, 100)}%`
                        : "0%"
                    }}
                  />
                </div>
              </div>

              {/* Results card */}
              <ResultadosCard
                tipoSalto={tipoSalto}
                resultadoFinal={resultadoFinal}
                repReciente={repReciente}
                saltoRTActual={saltoRTActual}
                ejercicioEnCurso={ejercicioEnCurso}
                onGuardar={finalizarPliometria}
                pliometriaId={pliometriaId}
              />
            </div>
          </div>
        )}

        {/* Monitor de mensajes */}
        <details className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <summary className="px-4 py-2.5 text-[10px] uppercase tracking-widest text-slate-400 font-semibold cursor-pointer select-none">
            Monitor de mensajes
          </summary>
          <div className="bg-slate-900 p-4 h-36 overflow-y-auto font-mono text-[11px]">
            {messages.length === 0 ? (
              <p className="text-slate-500">Sin mensajes…</p>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={m.status === "error" ? "text-red-400" : m.status === "success" ? "text-emerald-400" : "text-slate-400"}>
                  <span className="text-slate-600">[{m.timestamp}] </span>
                  <span className="font-semibold">{m.device}: </span>
                  {m.message}
                </div>
              ))
            )}
          </div>
        </details>
      </div>
    </div>
  )
}