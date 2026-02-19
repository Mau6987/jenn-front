"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, User, CheckCircle, X } from "lucide-react"
import { ImageSequence } from "../../components/image-sequence"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

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

// ─── helpers ─────────────────────────────────────────────────────────────────

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

// ─── sub-components ───────────────────────────────────────────────────────────

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

function CalibrationModal({ isOpen, onClose, isCalibrated }) {
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

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SistemaUnificadoPage() {
  const [cuentas, setCuentas] = useState([])
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState("")
  const [espConnected, setEspConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [notification, setNotification] = useState(null)
  const [activeTab, setActiveTab] = useState("alcance")

  // ── ALCANCE ──
  const [faseAlcance, setFaseAlcance] = useState("idle")
  const [alturaRegistrada, setAlturaRegistrada] = useState("")
  const [incrementoAnterior, setIncrementoAnterior] = useState("")
  const [jumpRaw, setJumpRaw] = useState(null)
  const [alcanceGuardado, setAlcanceGuardado] = useState(null)
  const [modalAlcanceOpen, setModalAlcanceOpen] = useState(false)
  const [calibrationModalOpen, setCalibrationModalOpen] = useState(false)
  const [isCalibrated, setIsCalibrated] = useState(false)
  const [ultimoAlcance, setUltimoAlcance] = useState(null)

  // ── PLIOMETRÍA ──
  const [masaJugador, setMasaJugador] = useState("")
  const [tiempoPliometria, setTiempoPliometria] = useState("")
  const [tipoSalto, setTipoSalto] = useState("salto cajon")
  const [pliometriaId, setPliometriaId] = useState(null)
  const [pliometriaIniciada, setPliometriaIniciada] = useState(false)
  const [ejercicioEnCurso, setEjercicioEnCurso] = useState(false)
  const [datosEjercicio, setDatosEjercicio] = useState({ F1: 0, F2: 0, Ftotal: 0, acelZ: 0, pitch: 0, potencia: 0 })
  const [chartData, setChartData] = useState([])
  const [dataPointCounter, setDataPointCounter] = useState(0)
  const [pliometriaGuardada, setPliometriaGuardada] = useState(null)
  const [modalPliometriaOpen, setModalPliometriaOpen] = useState(false)

  const jugadorRef = useRef(null)
  const jugadorSeleccionado = cuentas.find((c) => c.id === Number(cuentaSeleccionada))

  useEffect(() => { jugadorRef.current = jugadorSeleccionado }, [jugadorSeleccionado])

  useEffect(() => {
    cargarCuentas(setCuentas, setJugadoresDisponibles)
    loadPusher(subscribeToESP)
  }, [])

  useEffect(() => {
    if (!cuentaSeleccionada) { setUltimoAlcance(null); return }
    fetch(`${BACKEND_URL}/api/alcances/ultimo/${cuentaSeleccionada}`)
      .then((r) => r.json())
      .then((d) => setUltimoAlcance(d.data ?? null))
      .catch(console.error)
  }, [cuentaSeleccionada])

  const notify = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── pusher ──────────────────────────────────────────────────────────────────
  const subscribeToESP = (pusher) => {
    const channel = pusher.subscribe(`private-device-${DEVICE_ID}`)

    channel.bind("pusher:subscription_succeeded", () => {
      setEspConnected(true)
      addMessage(DEVICE_ID, "Conectado", "success", setMessages)
      notify("success", "ESP conectado")
    })

    channel.bind("client-response", (data) => {
      const msg = (data.message || "")
      addMessage(DEVICE_ID, data.message || "", "success", setMessages)

      if (msg.includes("CALIBRADO_OK")) {
        setFaseAlcance("calibrated")
        setIsCalibrated(true)
        setTimeout(() => { setCalibrationModalOpen(false); setIsCalibrated(false) }, 1500)
        notify("success", "Calibrado — presiona Iniciar")
      } else if (msg.includes("SESION_INICIADA")) {
        addMessage(DEVICE_ID, "Esperando resultado del salto...", "info", setMessages)
      }
    })

    // ── CORRECCIÓN: el ESP manda mejor_m y saltos_validos directamente en data,
    //    NO dentro de data.message. Pusher deserializa el campo data automáticamente.
    channel.bind("client-resultado", (data) => {
      console.log("[resultado] Datos recibidos del ESP:", data)
      try {
        // data llega ya como objeto: { device, mejor_m, saltos_validos, timestamp }
        const mejor_m = parseFloat(data.mejor_m ?? 0)
        const alturaESP = mejor_m * 100  // convertir metros → centímetros

        const jugadorActual = jugadorRef.current

        // Leer alcance_estatico del jugador (viene en metros desde la BD)
        let alcanceEstaticoCm = 0
        if (jugadorActual?.jugador?.alcance_estatico != null) {
          alcanceEstaticoCm = parseFloat(jugadorActual.jugador.alcance_estatico) * 100
        } else if (jugadorActual?.alcance_estatico != null) {
          alcanceEstaticoCm = parseFloat(jugadorActual.alcance_estatico) * 100
        }

        // Alcance total = altura del salto + alcance estático de pie
        const alcanceTotal = alcanceEstaticoCm + alturaESP

        console.log(
          "[resultado] mejor_m=", mejor_m,
          "| alturaESP=", alturaESP.toFixed(1), "cm",
          "| alcanceEstatico=", alcanceEstaticoCm.toFixed(1), "cm",
          "| alcanceTotal=", alcanceTotal.toFixed(1), "cm"
        )

        setAlturaRegistrada(alcanceTotal.toFixed(1))
        setJumpRaw({
          mejor_m,
          saltos_validos: data.saltos_validos || 0,
          alcanceTotal,
          alturaESP,
          alcanceEstaticoCm,
        })
        setFaseAlcance("done")
        notify("success", "Salto registrado — revisa los resultados")
        addMessage(
          DEVICE_ID,
          `Salto completado: ${alturaESP.toFixed(1)} cm (alcance total: ${alcanceTotal.toFixed(1)} cm)`,
          "success",
          setMessages
        )
      } catch (e) {
        console.error("[resultado] Error al procesar:", e)
        addMessage(DEVICE_ID, `Error al procesar resultado: ${e.message}`, "error", setMessages)
      }
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

  useEffect(() => {
    if (!jumpRaw) return
    if (ultimoAlcance?.alcance != null) {
      const inc = jumpRaw.alcanceTotal - parseFloat(ultimoAlcance.alcance)
      setIncrementoAnterior(`${inc >= 0 ? "+" : ""}${inc.toFixed(1)} cm`)
    } else {
      setIncrementoAnterior("Sin registro previo")
    }
  }, [jumpRaw])

  // ── ALCANCE acciones ────────────────────────────────────────────────────────
  const handleCalibrar = async () => {
    if (!jugadorSeleccionado) { notify("error", "Selecciona un jugador primero"); return }
    if (!espConnected) { notify("error", "Sin conexión con el dispositivo"); return }
    setFaseAlcance("calibrating")
    setAlturaRegistrada("")
    setIncrementoAnterior("")
    setJumpRaw(null)
    setCalibrationModalOpen(true)
    setIsCalibrated(false)
    addMessage("SISTEMA", "Iniciando calibración... mantente quieto", "info", setMessages)
    await sendCommand("CALIBRAR", setMessages)
  }

  const handleIniciarSalto = async () => {
    if (faseAlcance !== "calibrated") { notify("error", "Calibra primero el sensor"); return }
    setFaseAlcance("jumping")
    setAlturaRegistrada("")
    setIncrementoAnterior("")
    addMessage("SISTEMA", "Iniciando test de alcance...", "info", setMessages)
    await sendCommand("INICIAR", setMessages)
  }

  const handleGuardarAlcance = async () => {
    if (!jumpRaw || !cuentaSeleccionada) return
    try {
      const res = await fetch(`${BACKEND_URL}/api/alcances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: Number(cuentaSeleccionada), alcance: jumpRaw.alcanceTotal }),
      })
      const d = await res.json()
      if (d.success) {
        setAlcanceGuardado({
          "Alcance registrado": `${jumpRaw.alcanceTotal.toFixed(1)} cm`,
          "Altura del salto (ESP)": `${jumpRaw.alturaESP.toFixed(1)} cm`,
          "Alcance estático": `${jumpRaw.alcanceEstaticoCm.toFixed(1)} cm`,
        })
        setModalAlcanceOpen(true)
        notify("success", "Guardado correctamente")
      }
    } catch (e) { console.error(e) }
  }

  const cerrarModalAlcance = () => {
    setModalAlcanceOpen(false)
    setAlcanceGuardado(null)
    setFaseAlcance("idle")
    setAlturaRegistrada("")
    setIncrementoAnterior("")
    setJumpRaw(null)
    if (cuentaSeleccionada) {
      fetch(`${BACKEND_URL}/api/alcances/ultimo/${cuentaSeleccionada}`)
        .then((r) => r.json())
        .then((d) => setUltimoAlcance(d.data ?? null))
        .catch(console.error)
    }
  }

  // ── PLIOMETRÍA acciones ─────────────────────────────────────────────────────
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
        notify("success", `Pliometría iniciada`)
        await sendCommand("START_PLIOMETRICS", setMessages)
        setTimeout(async () => {
          await sendCommand(`MASS:${Number.parseFloat(masaJugador)}`, setMessages)
        }, 300)
      } else { notify("error", d.message) }
    } catch (e) { console.error(e) }
  }

  const calibrarEjercicio = async () => {
    await sendCommand("CALIBRATE_EXERCISE", setMessages)
    notify("success", "Sensores calibrados")
  }

  const iniciarEjercicio = async () => {
    const dur = Number.parseFloat(tiempoPliometria)
    if (isNaN(dur) || dur <= 0) { notify("error", "Duración inválida"); return }
    setChartData([])
    setDataPointCounter(0)
    setDatosEjercicio({ F1: 0, F2: 0, Ftotal: 0, acelZ: 0, pitch: 0, potencia: 0 })
    setEjercicioEnCurso(true)
    await sendCommand(`START_EXERCISE:${dur}`, setMessages)
    setTimeout(async () => {
      await sendCommand("MEASURE", setMessages)
    }, 500)
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
        notify("success", "Pliometría guardada")
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
    tipoSalto === "salto cajon" ? SALTO_CAJON_IMAGES :
    tipoSalto === "salto valla" ? SALTO_VALLA_IMAGES :
    SALTO_SIMPLE_IMAGES

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f3f3f1]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <Toast notification={notification} onClose={() => setNotification(null)} />
      <ResultModal isOpen={modalAlcanceOpen}    onClose={cerrarModalAlcance}    title="Alcance Guardado"    data={alcanceGuardado || {}} />
      <ResultModal isOpen={modalPliometriaOpen} onClose={cerrarModalPliometria} title="Pliometría Guardada" data={pliometriaGuardada || {}} />
      <CalibrationModal
        isOpen={calibrationModalOpen}
        onClose={() => { setCalibrationModalOpen(false); setIsCalibrated(false) }}
        isCalibrated={isCalibrated}
      />

      <div className="max-w-6xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-3">

        <div className="flex flex-col lg:flex-row gap-3">

          {/* ① SELECCIONAR JUGADOR + PERFIL */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4
                          flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
            <div className="flex flex-col gap-1.5 w-full sm:w-auto shrink-0">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">
                Seleccionar jugador
              </span>
              <div className="relative">
                <select
                  value={cuentaSeleccionada}
                  onChange={(e) => {
                    setCuentaSeleccionada(e.target.value)
                    setFaseAlcance("idle")
                    setAlturaRegistrada("")
                    setIncrementoAnterior("")
                    setJumpRaw(null)
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
                    ALTURA: {jugadorSeleccionado.jugador.alcance_estatico ?? "N"}(m)
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-300">—</p>
              )}
            </div>
          </div>

          {/* ② INICIO DE TEST — tab alcance */}
          {activeTab === "alcance" && (
            <div className="w-full lg:w-52 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4
                            flex flex-col gap-3">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">
                Inicio de test
              </span>
              <div className="flex gap-2 flex-1 items-end">
                <button
                  onClick={handleCalibrar}
                  disabled={!cuentaSeleccionada || !espConnected || faseAlcance === "calibrating"}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95
                    ${faseAlcance === "calibrating"
                      ? "bg-amber-100 text-amber-600 border border-amber-200 animate-pulse"
                      : "bg-slate-700 text-white hover:bg-slate-600"}
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {faseAlcance === "calibrating" ? "…" : "Calibrar"}
                </button>
                <button
                  onClick={handleIniciarSalto}
                  disabled={faseAlcance !== "calibrated" || !espConnected}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95
                    ${faseAlcance === "jumping"
                      ? "bg-indigo-100 text-indigo-600 border border-indigo-200 animate-pulse"
                      : "bg-slate-700 text-white hover:bg-slate-600"}
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {faseAlcance === "jumping" ? "…" : "Iniciar"}
                </button>
              </div>
            </div>
          )}

          {/* ③ RESULTADOS — tab alcance */}
          {activeTab === "alcance" && (
            <div className="w-full lg:w-80 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4
                            flex flex-col gap-3">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">
                Resultados
              </span>
              <div className="space-y-2.5 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <span className="text-[9px] uppercase tracking-wide text-slate-400 sm:w-36 shrink-0 leading-tight">
                    Altura de alcance registrada
                  </span>
                  <input
                    readOnly
                    value={alturaRegistrada ? `${alturaRegistrada} cm` : ""}
                    className="w-full sm:flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5
                               text-xs text-slate-700 bg-slate-50 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <span className="text-[9px] uppercase tracking-wide text-slate-400 sm:w-36 shrink-0 leading-tight">
                    Incremento respecto al anterior
                  </span>
                  <input
                    readOnly
                    value={incrementoAnterior}
                    className="w-full sm:flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5
                               text-xs text-slate-700 bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleGuardarAlcance}
                  disabled={faseAlcance !== "done"}
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
                <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">
                  Tipo de prueba
                </span>
                <div className="flex gap-1 flex-wrap">
                  {[
                    { key: "salto simple", label: "Simple" },
                    { key: "salto cajon",  label: "Cajón"  },
                    { key: "salto valla",  label: "Valla"  },
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
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Peso (Kg)</span>
                  <input
                    type="number"
                    value={masaJugador}
                    onChange={(e) => setMasaJugador(e.target.value)}
                    placeholder="0"
                    className="w-full sm:w-24 border border-slate-200 rounded-lg px-2.5 py-2 text-sm
                               text-slate-600 bg-slate-50 placeholder-slate-300
                               focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1 sm:flex-none">
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400">Tiempo (s)</span>
                  <input
                    type="number"
                    value={tiempoPliometria}
                    onChange={(e) => setTiempoPliometria(e.target.value)}
                    placeholder="0"
                    className="w-full sm:w-24 border border-slate-200 rounded-lg px-2.5 py-2 text-sm
                               text-slate-600 bg-slate-50 placeholder-slate-300
                               focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>

              <div className="hidden sm:block w-px self-stretch bg-slate-100 shrink-0" />

              <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                <button
                  onClick={calibrarEjercicio}
                  disabled={!espConnected || !pliometriaIniciada}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-semibold bg-slate-700 text-white
                             hover:bg-slate-600 transition-all active:scale-95
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Calibrar
                </button>
                <button
                  onClick={pliometriaIniciada ? iniciarEjercicio : iniciarPliometria}
                  disabled={!cuentaSeleccionada || !espConnected || !tiempoPliometria || !masaJugador}
                  className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95
                    ${ejercicioEnCurso
                      ? "bg-slate-400 text-white animate-pulse"
                      : "bg-slate-600 text-white hover:bg-slate-500"}
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {ejercicioEnCurso ? "En curso…" : "Iniciar Prueba"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══ TABS ══ */}
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

        {/* ══ TAB ALCANCE ══ */}
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
                  <p className="text-[11px] font-bold text-red-500 uppercase leading-tight">
                    Indicar que jugador se quede quieto
                  </p>
                  <p className="text-[11px] text-red-400 leading-tight">
                    Mostrar mensaje de calibración
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-semibold uppercase tracking-widest text-center ${titleCls(stepState(2))}`}>
                  Inicio de prueba
                </p>
                <div className={`rounded-xl border-2 ${borderCls(stepState(2))} bg-white overflow-hidden transition-all duration-300`}>
                  <div className="aspect-[3/4] flex items-center justify-center bg-slate-50">
                    <svg viewBox="0 0 100 140" className="w-20 sm:w-28" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <p className="text-[11px] text-slate-400 leading-tight px-1">
                  El jugador realiza el salto al recibir la señal
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <p className={`text-[10px] font-semibold uppercase tracking-widest text-center ${titleCls(stepState(3))}`}>
                  Finalización de prueba
                </p>
                <div className={`rounded-xl border-2 ${borderCls(stepState(3))} bg-white overflow-hidden transition-all duration-300`}>
                  <div className="aspect-[3/4] flex items-center justify-center bg-slate-50">
                    <svg viewBox="0 0 100 140" className="w-20 sm:w-28" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="50" cy="24" r="11" />
                      <path d="M50 35 Q46 52 40 64" />
                      <path d="M50 35 Q54 52 60 64" />
                      <path d="M40 64 Q34 82 28 98" />
                      <path d="M60 64 Q66 82 72 98" />
                      <line x1="20" y1="108" x2="80" y2="108" strokeWidth="2.5" />
                      {stepState(3) === "done" && (
                        <path d="M36 120 l8 8 l18 -14" stroke="#10b981" strokeWidth="2.5" />
                      )}
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight px-1">
                  Datos registrados automáticamente al aterrizar
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB PRUEBAS ══ */}
        {activeTab === "pruebas" && (
          <div className="flex flex-col lg:flex-row gap-6 pt-2 items-start">
            <div className="w-full lg:flex-1 min-w-0 space-y-5">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
                Pasos a seguir para el jugador
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {[
                  { label: "Calibración",      sub: "Jugador en posición inicial, quieto" },
                  { label: "Inicio de prueba",  sub: "El jugador realiza los saltos continuos" },
                  { label: "Finalización",      sub: "Datos registrados al finalizar el tiempo" },
                ].map(({ label, sub }, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-center text-slate-400">
                      {label}
                    </p>
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
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-widest font-semibold text-slate-500 text-right">
                  Tiempo transcurrido
                </p>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                    style={{ width: ejercicioEnCurso && tiempoPliometria ? "40%" : "0%" }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-5 space-y-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-600 text-center">
                  Resultados
                </p>
                {[
                  { label: "Saltos detectados",       value: datosEjercicio.Ftotal > 0 ? "—" : "" },
                  { label: "Fuerza máxima alcanzada", value: datosEjercicio.Ftotal > 0 ? `${datosEjercicio.Ftotal.toFixed(1)} N` : "" },
                  { label: "Índice de fatiga (%)",    value: "" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <span className="text-[9px] uppercase tracking-wide text-slate-400 leading-tight">
                      {label}
                    </span>
                    <input
                      readOnly
                      value={value}
                      className="w-full sm:w-32 border border-slate-200 rounded-lg px-2.5 py-1.5
                                 text-xs text-slate-700 bg-slate-50 focus:outline-none text-center"
                    />
                  </div>
                ))}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={finalizarPliometria}
                    disabled={!pliometriaIniciada}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-700 text-white
                               hover:bg-slate-600 active:scale-95 transition-all
                               disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Guardar
                  </button>
                </div>
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
            {messages.length === 0 ? (
              <p className="text-slate-500">Sin mensajes…</p>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.status === "error" ? "text-red-400" :
                    m.status === "success" ? "text-emerald-400" :
                    "text-slate-400"
                  }
                >
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