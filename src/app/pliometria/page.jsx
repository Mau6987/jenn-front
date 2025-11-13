"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { X, CheckCircle, AlertCircle, Users, ChevronDown, Zap, Gauge, Dumbbell, Play, Wrench } from "lucide-react"
import { ChartContainer, ChartTooltipContent } from "../../components/ui/chart"
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"
import { ImageSequence } from "../../components/image-sequence"
import { MetricCard } from "../../components/metric-card"

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

function Notification({ notification, onClose }) {
  if (!notification) return null
  return (
    <div className="fixed top-20 right-6 z-50 animate-fade-in">
      <div
        className={`rounded-xl shadow-lg p-4 flex items-center min-w-80 ${
          notification.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
        }`}
      >
        {notification.type === "success" ? (
          <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
        )}
        <span className={`font-medium text-sm ${notification.type === "success" ? "text-green-800" : "text-red-800"}`}>
          {notification.message}
        </span>
        <button
          onClick={onClose}
          className={`ml-4 ${notification.type === "success" ? "text-green-600 hover:text-green-800" : "text-red-600 hover:text-red-800"}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function ResultModal({ isOpen, onClose, title, data }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600 animate-in spin-in duration-500" />
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-all duration-200 hover:rotate-90">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(data).map(([key, value], index) => (
            <div
              key={key}
              className="bg-gradient-to-r from-slate-50 to-white rounded-lg p-3 border border-slate-200 animate-in slide-in-from-left duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <p className="text-xs text-slate-500 mb-1 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
              <p className="text-lg font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <Button onClick={onClose} className="w-full mt-6 bg-indigo-700 hover:bg-indigo-800 transition-all duration-300">
          Cerrar y Limpiar
        </Button>
      </div>
    </div>
  )
}

function CalibrationModal({ isOpen, onClose, isCalibrated }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in zoom-in-95 duration-300 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-all duration-200 hover:rotate-90">
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-center justify-center py-6">
          {!isCalibrated ? (
            <>
              <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center animate-pulse">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/calibrar-removebg-preview-1y4aBupjFQ9WApv9Ru1gxKoxsOdMqW.png"
                  alt="Calibrando"
                  className="w-24 h-24 object-contain animate-spin"
                  style={{ animationDuration: "2s" }}
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Calibrando...</h3>
              <p className="text-slate-600 text-center">Por favor espere mientras se calibran los sensores</p>
            </>
          ) : (
            <>
              <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <CheckCircle className="h-16 w-16 text-green-600 animate-in zoom-in duration-500" />
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">Calibrado correctamente</h3>
              <p className="text-slate-600 text-center">Los sensores han sido calibrados exitosamente</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function addMessage(device, message, status, setMessages) {
  const timestamp = new Date().toLocaleTimeString()
  setMessages((prev) => [...prev, { device, message, status, timestamp }])
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

async function cargarCuentas(setCuentas, setJugadoresDisponibles) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/cuentas`)
    const data = await response.json()
    if (data.success) {
      setCuentas(data.data)
      const jugadores = data.data.filter((cuenta) => cuenta.rol === "jugador")
      setJugadoresDisponibles(jugadores)
      console.log("[v0] Jugadores cargados:", jugadores.length)
    }
  } catch (error) {
    console.error("[v0] Error loading cuentas:", error)
  }
}

function loadPusher(setPusherConnected, setPusherStatus, subscribeToESP) {
  if (typeof window !== "undefined" && !window.Pusher) {
    const script = document.createElement("script")
    script.src = "https://js.pusher.com/8.2.0/pusher.min.js"
    script.async = true
    script.onload = () => {
      console.log("[v0] Pusher script loaded")
      initializePusher(setPusherConnected, setPusherStatus, subscribeToESP)
    }
    document.body.appendChild(script)
  } else if (window.Pusher) {
    initializePusher(setPusherConnected, setPusherStatus, subscribeToESP)
  }
}

function initializePusher(setPusherConnected, setPusherStatus, subscribeToESP) {
  const Pusher = window.Pusher
  const pusher = new Pusher("4f85ef5c792df94cebc9", {
    cluster: "us2",
    encrypted: true,
    authEndpoint: `${BACKEND_URL}/api/pusher/pusher/auth`,
    forceTLS: true,
  })

  pusher.connection.bind("connected", () => {
    console.log("[v0] Pusher connected")
    setPusherConnected(true)
    setPusherStatus("Conectado")
  })

  pusher.connection.bind("disconnected", () => {
    console.log("[v0] Pusher disconnected")
    setPusherConnected(false)
    setPusherStatus("Desconectado")
  })

  pusher.connection.bind("error", (err) => {
    console.error("[v0] Pusher error:", err)
    setPusherStatus("Error")
  })

  subscribeToESP(pusher)
}

async function sendCommand(command, setMessages) {
  try {
    addMessage("SISTEMA", `Enviando comando: ${command}`, "info", setMessages)
    const response = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: DEVICE_ID, command, channel: `private-device-${DEVICE_ID}` }),
    })
    const data = await response.json()
    if (data.success || response.ok) {
      addMessage("SISTEMA", `Comando enviado: ${command}`, "success", setMessages)
    } else {
      addMessage("SISTEMA", `Error al enviar comando: ${data.message || "Error desconocido"}`, "error", setMessages)
    }
  } catch (error) {
    console.error("[v0] Error sending command:", error)
    addMessage("SISTEMA", "Error al enviar comando", "error", setMessages)
  }
}

export default function SistemaUnificadoPage() {
  const [activeTab, setActiveTab] = useState("alcance")
  const [notification, setNotification] = useState(null)

  const [cuentas, setCuentas] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState("")
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([])

  const [pusherConnected, setPusherConnected] = useState(false)
  const [pusherStatus, setPusherStatus] = useState("Desconectado")
  const [espConnected, setEspConnected] = useState(false)
  const [espStatus, setEspStatus] = useState("")

  const [peso, setPeso] = useState("")
  const [altura, setAltura] = useState("")
  const [tiempoVuelo, setTiempoVuelo] = useState("0")
  const [velocidad, setVelocidad] = useState("0")
  const [potencia, setPotencia] = useState("0")
  const [alturaCalculada, setAlturaCalculada] = useState("0")
  const [estadoA, setEstadoA] = useState("menu")
  const [alcanceId, setAlcanceId] = useState(null)
  const [alcanceIniciado, setAlcanceIniciado] = useState(false)
  const [modalAlcanceOpen, setModalAlcanceOpen] = useState(false)
  const [alcanceGuardado, setAlcanceGuardado] = useState(null)
  const [calibrationModalOpen, setCalibrationModalOpen] = useState(false)
  const [isCalibrated, setIsCalibrated] = useState(false)

  const [masaJugador, setMasaJugador] = useState("")
  const [tiempoPliometria, setTiempoPliometria] = useState("")
  const [estadoB, setEstadoB] = useState("menu")
  const [datosEjercicio, setDatosEjercicio] = useState({ F1: 0, F2: 0, Ftotal: 0, acelZ: 0, pitch: 0, potencia: 0 })
  const [pliometriaId, setPliometriaId] = useState(null)
  const [pliometriaIniciada, setPliometriaIniciada] = useState(false)
  const [tipoSalto, setTipoSalto] = useState("salto cajon")
  const [modalPliometriaOpen, setModalPliometriaOpen] = useState(false)
  const [pliometriaGuardada, setPliometriaGuardada] = useState(null)
  const [ejercicioEnCurso, setEjercicioEnCurso] = useState(false)

  const [chartData, setChartData] = useState([])
  const [dataPointCounter, setDataPointCounter] = useState(0)

  const [showFuerza1, setShowFuerza1] = useState(true)
  const [showFuerza2, setShowFuerza2] = useState(true)
  const [showFuerzaTotal, setShowFuerzaTotal] = useState(true)

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log("[v0] Sistema Unificado - Connecting to backend:", BACKEND_URL)
    cargarCuentas(setCuentas, setJugadoresDisponibles)
    loadPusher(setPusherConnected, setPusherStatus, subscribeToESP)
  }, [])

  const jugadorSeleccionado = cuentas.find((c) => c.id === Number(cuentaSeleccionada))

  const subscribeToESP = (pusher) => {
    const channelName = `private-device-${DEVICE_ID}`
    console.log("[v0] Subscribing to channel:", channelName)
    const channel = pusher.subscribe(channelName)

    channel.bind("pusher:subscription_succeeded", () => {
      console.log("[v0] Successfully subscribed to", channelName)
      setEspConnected(true)
      setEspStatus("Conectado")
      addMessage(DEVICE_ID, "Conectado exitosamente", "success", setMessages)
      showNotification("success", "ESP conectado exitosamente")
    })

    channel.bind("pusher:subscription_error", (error) => {
      console.log("[v0] Subscription error:", error)
      setEspConnected(false)
      setEspStatus("Error de conexión")
      addMessage(DEVICE_ID, "Error de conexión", "error", setMessages)
      showNotification("error", "Error de conexión con ESP")
    })

    channel.bind("client-response", (data) => {
      console.log("[v0] Response received:", data)
      const message = data.message || ""
      setLoading(false)
      addMessage(DEVICE_ID, message, "success", setMessages)
      addMessage("TRÁFICO", `client-response: ${JSON.stringify(data)}`, "info", setMessages)
      if (message.toLowerCase().includes("calibra")) {
        setIsCalibrated(true)
        setTimeout(() => {
          setCalibrationModalOpen(false)
          setIsCalibrated(false)
        }, 2000)
      }
      showNotification("success", message)
    })

    channel.bind("client-jump-results", (data) => {
      console.log("[v0] Jump results received:", data)
      if (data.tiempoVuelo !== undefined) setTiempoVuelo(String(data.tiempoVuelo))
      if (data.velocidad !== undefined) setVelocidad(String(data.velocidad))
      if (data.potencia !== undefined) setPotencia(String(data.potencia))
      if (data.altura !== undefined) setAlturaCalculada(String(data.altura))
      setEstadoA("completado")
      addMessage(DEVICE_ID, "Salto completado. Resultados recibidos.", "success", setMessages)
      addMessage("TRÁFICO", `client-jump-results: ${JSON.stringify(data)}`, "info", setMessages)
      showNotification("success", "Salto completado. Resultados recibidos.")
      if (alcanceIniciado && alcanceId) finalizarAlcanceAutomatico(data)
    })

    channel.bind("client-exercise-data", (data) => {
      console.log("[v0] Exercise data received:", data)
      addMessage(
        "TRÁFICO",
        `client-exercise-data: F1=${data.F1?.toFixed(1)}, F2=${data.F2?.toFixed(1)}, Ftotal=${data.Ftotal?.toFixed(1)}, acelZ=${data.acelZ?.toFixed(2)}, pitch=${data.pitch?.toFixed(1)}, potencia=${data.potencia?.toFixed(1)}`,
        "info",
        setMessages
      )

      setDatosEjercicio((prev) => ({
        F1: Math.max(prev.F1, data.F1 || 0),
        F2: Math.max(prev.F2, data.F2 || 0),
        Ftotal: Math.max(prev.Ftotal, data.Ftotal || 0),
        acelZ: Math.max(prev.acelZ, data.acelZ || 0),
        pitch: Math.max(prev.pitch, data.pitch || 0),
        potencia: Math.max(prev.potencia, data.potencia || 0),
      }))

      setDataPointCounter((prev) => {
        const newCounter = prev + 1
        setChartData((prevData) => {
          const newPoint = { point: newCounter, acelZ: data.acelZ || 0, potencia: data.potencia || 0 }
          const updatedData = [...prevData, newPoint]
          return updatedData.slice(-100)
        })
        return newCounter
      })
    })

    channel.bind("client-exercise-complete", () => {
      console.log("[v0] Exercise complete")
      addMessage(DEVICE_ID, "Ejercicio completado", "success", setMessages)
      setEjercicioEnCurso(false)
      showNotification("success", "Ejercicio completado")
      if (pliometriaIniciada && pliometriaId) finalizarPliometriaAutomatico()
    })

    channel.bind("client-status", (data) => {
      console.log("[v0] Status update:", data)
      const message = data.message || JSON.stringify(data)
      addMessage(DEVICE_ID, message, "info", setMessages)
      addMessage("TRÁFICO", `client-status: ${JSON.stringify(data)}`, "info", setMessages)
      showNotification("success", message)
      if (typeof data === "object" && data.status === "connected") {
        setEspConnected(true)
        setEspStatus("Conectado")
      }
    })
  }

  const iniciarAlcance = async () => {
    if (!cuentaSeleccionada) {
      showNotification("error", "Debe seleccionar un jugador primero")
      addMessage("SISTEMA", "Debe seleccionar un jugador primero", "error", setMessages)
      return
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/alcances/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: Number(cuentaSeleccionada) }),
      })
      const data = await response.json()
      if (data.success) {
        setAlcanceId(data.data.id)
        setAlcanceIniciado(true)
        addMessage("SISTEMA", `Alcance iniciado con ID: ${data.data.id}`, "success", setMessages)
        showNotification("success", `Alcance iniciado con ID: ${data.data.id}`)
        await sendCommand("A", setMessages)
      } else {
        addMessage("SISTEMA", `Error al iniciar alcance: ${data.message}`, "error", setMessages)
        showNotification("error", `Error al iniciar alcance: ${data.message}`)
      }
    } catch (error) {
      console.error("[v0] Error starting alcance:", error)
      addMessage("SISTEMA", "Error al iniciar alcance", "error", setMessages)
      showNotification("error", "Error al iniciar alcance")
    }
  }
  const finalizarAlcanceAutomatico = async (jumpData) => {
    if (!alcanceId) return
    try {
      const response = await fetch(`${BACKEND_URL}/api/alcances/finalizar/${alcanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiempodevuelo: Number(jumpData.tiempoVuelo) || 0,
          potencia: Number(jumpData.potencia) || 0,
          velocidad: Number(jumpData.velocidad) || 0,
          alcance: Number(jumpData.altura) || 0,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setAlcanceGuardado({
          "Tiempo de Vuelo": `${jumpData.tiempoVuelo} ms`,
          Velocidad: `${jumpData.velocidad} m/s`,
          Potencia: `${jumpData.potencia} W`,
          Alcance: `${jumpData.altura} cm`,
        })
        setModalAlcanceOpen(true)
        addMessage("SISTEMA", "Alcance finalizado y guardado correctamente", "success", setMessages)
        showNotification("success", "Alcance finalizado y guardado correctamente")
      } else {
        addMessage("SISTEMA", `Error al finalizar alcance: ${data.message}`, "error", setMessages)
        showNotification("error", `Error al finalizar alcance: ${data.message}`)
      }
    } catch (error) {
      console.error("[v0] Error finalizing alcance:", error)
      addMessage("SISTEMA", "Error al finalizar alcance", "error", setMessages)
      showNotification("error", "Error al finalizar alcance")
    }
  }

  const finalizarAlcanceManual = async () => {
    if (!alcanceId) {
      addMessage("SISTEMA", "No hay alcance iniciado", "error", setMessages)
      showNotification("error", "No hay alcance iniciado")
      return
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/alcances/finalizar/${alcanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiempodevuelo: Number(tiempoVuelo) || 0,
          potencia: Number(potencia) || 0,
          velocidad: Number(velocidad) || 0,
          alcance: Number(alturaCalculada) || 0,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setAlcanceGuardado({
          "Tiempo de Vuelo": `${tiempoVuelo} ms`,
          Velocidad: `${velocidad} m/s`,
          Potencia: `${potencia} W`,
          Alcance: `${alturaCalculada} cm`,
        })
        setModalAlcanceOpen(true)
        addMessage("SISTEMA", "Alcance finalizado y guardado correctamente", "success", setMessages)
        showNotification("success", "Alcance finalizado y guardado correctamente")
      } else {
        addMessage("SISTEMA", `Error al finalizar alcance: ${data.message}`, "error", setMessages)
        showNotification("error", `Error al finalizar alcance: ${data.message}`)
      }
    } catch (error) {
      console.error("[v0] Error finalizing alcance:", error)
      addMessage("SISTEMA", "Error al finalizar alcance", "error", setMessages)
      showNotification("error", "Error al finalizar alcance")
    }
  }

  const cerrarModalAlcance = () => {
    setModalAlcanceOpen(false)
    setAlcanceId(null)
    setAlcanceIniciado(false)
    setAlcanceGuardado(null)
    setTiempoVuelo("0")
    setVelocidad("0")
    setPotencia("0")
    setAlturaCalculada("0")
    setPeso("")
    setAltura("")
    setEstadoA("menu")
    addMessage("SISTEMA", "Datos de alcance limpiados", "info", setMessages)
  }

  const iniciarPliometria = async () => {
    if (!cuentaSeleccionada) {
      showNotification("error", "Debe seleccionar un jugador primero")
      addMessage("SISTEMA", "Debe seleccionar un jugador primero", "error", setMessages)
      return
    }
    if (!tiempoPliometria || Number.parseFloat(tiempoPliometria) <= 0) {
      showNotification("error", "Debe ingresar un tiempo válido para la pliometría")
      addMessage("SISTEMA", "Debe ingresar un tiempo válido para la pliometría", "error", setMessages)
      return
    }
    if (!masaJugador || Number.parseFloat(masaJugador) <= 0) {
      showNotification("error", "Debe ingresar una masa válida")
      addMessage("SISTEMA", "Debe ingresar una masa válida", "error", setMessages)
      return
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/pliometrias/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuentaId: Number(cuentaSeleccionada),
          tipo: tipoSalto,
          tiempo: Number.parseFloat(tiempoPliometria),
        }),
      })
      const data = await response.json()
      if (data.success) {
        setPliometriaId(data.data.id)
        setPliometriaIniciada(true)
        addMessage("SISTEMA", `Pliometría iniciada con ID: ${data.data.id}`, "success", setMessages)
        showNotification("success", `Pliometría iniciada con ID: ${data.data.id}`)
        await sendCommand("B", setMessages)
        const masaNum = Number.parseFloat(masaJugador)
        setTimeout(async () => {
          await sendCommand(`M:${masaNum}`, setMessages)
        }, 300)
      } else {
        addMessage("SISTEMA", `Error al iniciar pliometría: ${data.message}`, "error", setMessages)
        showNotification("error", `Error al iniciar pliometría: ${data.message}`)
      }
    } catch (error) {
      console.error("[v0] Error starting pliometria:", error)
      addMessage("SISTEMA", "Error al iniciar pliometría", "error", setMessages)
      showNotification("error", "Error al iniciar pliometría")
    }
  }

  const finalizarPliometriaAutomatico = async () => {
    if (!pliometriaId) return
    try {
      const response = await fetch(`${BACKEND_URL}/api/pliometrias/finalizar/${pliometriaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fuerzaizquierda: datosEjercicio.F1,
          fuerzaderecha: datosEjercicio.F2,
          aceleracion: datosEjercicio.acelZ,
          potencia: datosEjercicio.potencia,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setPliometriaGuardada({
          Tipo: tipoSalto,
          "Fuerza Izquierda": `${datosEjercicio.F1.toFixed(1)} N`,
          "Fuerza Derecha": `${datosEjercicio.F2.toFixed(1)} N`,
          Aceleración: `${datosEjercicio.acelZ.toFixed(2)} m/s²`,
          Potencia: `${datosEjercicio.potencia.toFixed(1)} W`,
        })
        setModalPliometriaOpen(true)
        addMessage("SISTEMA", "Pliometría finalizada y guardada correctamente", "success", setMessages)
        showNotification("success", "Pliometría finalizada y guardada correctamente")
      } else {
        addMessage("SISTEMA", `Error al finalizar pliometría: ${data.message}`, "error", setMessages)
        showNotification("error", `Error al finalizar pliometría: ${data.message}`)
      }
    } catch (error) {
      console.error("[v0] Error finalizing pliometria:", error)
      addMessage("SISTEMA", "Error al finalizar pliometría", "error", setMessages)
      showNotification("error", "Error al finalizar pliometría")
    }
  }

  const finalizarPliometriaManual = async () => {
    if (!pliometriaId) {
      addMessage("SISTEMA", "No hay pliometría iniciada", "error", setMessages)
      showNotification("error", "No hay pliometría iniciada")
      return
    }
    await finalizarPliometriaAutomatico()
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
    setEstadoB("menu")
    setEjercicioEnCurso(false)
    addMessage("SISTEMA", "Datos de pliometría limpiados", "info", setMessages)
  }

  const enviarDatosJugador = async () => {
    const pesoNum = Number.parseFloat(peso)
    const alturaNum = Number.parseFloat(altura)
    if (isNaN(pesoNum) || pesoNum <= 0 || isNaN(alturaNum) || alturaNum <= 0) {
      showNotification("error", "Peso y altura deben ser válidos")
      addMessage("SISTEMA", "Peso y altura deben ser válidos", "error", setMessages)
      return
    }
    await sendCommand(`D:${pesoNum}:${alturaNum}`, setMessages)
    showNotification("success", "Peso y altura enviados correctamente")
  }

  const calibrarSalto = async () => {
    setCalibrationModalOpen(true)
    setIsCalibrated(false)
    await sendCommand("C", setMessages)
  }

  const iniciarSalto = async () => {
    await sendCommand("S", setMessages)
    showNotification("success", "Comando S enviado")
  }

  const calibrarEjercicio = async () => {
    await sendCommand("I", setMessages)
    showNotification("success", "Sensores calibrados correctamente")
  }

  const iniciarEjercicio = async () => {
    const duracionNum = Number.parseFloat(tiempoPliometria)
    if (isNaN(duracionNum) || duracionNum <= 0) {
      showNotification("error", "Duración debe ser válida")
      addMessage("SISTEMA", "Duración debe ser válida", "error", setMessages)
      return
    }
    setChartData([])
    setDataPointCounter(0)
    setDatosEjercicio({ F1: 0, F2: 0, Ftotal: 0, acelZ: 0, pitch: 0, potencia: 0 })
    setEjercicioEnCurso(true)
    await sendCommand(`T:${duracionNum}`, setMessages)
    setTimeout(async () => {
      await sendCommand("S", setMessages)
      showNotification("success", "Ejercicio iniciado")
    }, 500)
  }

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const aceleracionChartConfig = {
    acelZ: { label: "Aceleración", color: "#4f46e5" }, // indigo-600
  }

  const potenciaChartConfig = {
    potencia: { label: "Potencia", color: "#0ea5e9" }, // sky-500
  }

  return (
    <div className="min-h-screen bg-white">
      <Notification notification={notification} onClose={() => setNotification(null)} />

      <ResultModal isOpen={modalAlcanceOpen} onClose={cerrarModalAlcance} title="Alcance Guardado" data={alcanceGuardado || {}} />
      <ResultModal isOpen={modalPliometriaOpen} onClose={cerrarModalPliometria} title="Pliometría Guardada" data={pliometriaGuardada || {}} />

      <CalibrationModal
        isOpen={calibrationModalOpen}
        onClose={() => { setCalibrationModalOpen(false); setIsCalibrated(false) }}
        isCalibrated={isCalibrated}
      />

      <div className="w-full p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Selector de jugador */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 uppercase tracking-wide">Seleccionar Jugador</h2>
            <div className="relative">
              <select
                value={cuentaSeleccionada}
                onChange={(e) => setCuentaSeleccionada(e.target.value)}
                className="w-full appearance-none px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10 text-slate-900"
              >
                <option value="">
                  {jugadoresDisponibles.length === 0 ? "No hay jugadores..." : "Selecciona un jugador"}
                </option>
                {jugadoresDisponibles.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id.toString()}>
                    {cuenta.jugador
                      ? `${cuenta.jugador.nombres} ${cuenta.jugador.apellidos} — ${cuenta.jugador.posicion_principal}`
                      : cuenta.usuario}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Perfil del jugador */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mb-6">
            {jugadorSeleccionado && jugadorSeleccionado.jugador ? (
              <div className="flex flex-col sm:flex-row gap-6 border-b-8 border-indigo-900 pb-6">
                <div className="flex flex-col items-center sm:items-start">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center overflow-hidden">
                    <img
                      src={getPositionIcon(jugadorSeleccionado.jugador?.posicion_principal) || "/placeholder.svg"}
                      alt={getPositionName(jugadorSeleccionado.jugador?.posicion_principal)}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = "/oso.png" }}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="mb-3">
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                      {jugadorSeleccionado.jugador.nombres} {jugadorSeleccionado.jugador.apellidos}
                    </h2>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs md:text-sm font-semibold text-slate-800 shadow-sm">
                      <img
                        src={getPositionIcon(jugadorSeleccionado.jugador?.posicion_principal) || "/placeholder.svg"}
                        alt={getPositionName(jugadorSeleccionado.jugador?.posicion_principal)}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      {getPositionName(jugadorSeleccionado.jugador?.posicion_principal)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs md:text-sm font-medium text-slate-700 shadow-sm truncate">
                      {jugadorSeleccionado.jugador?.carrera || "Sin carrera"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {jugadorSeleccionado.jugador.fecha_nacimiento && (
                      <div className="rounded-xl border bg-slate-50 px-3 py-2">
                        <p className="text-[11px] text-slate-500 mb-1">Edad</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {calcularEdad(jugadorSeleccionado.jugador.fecha_nacimiento)} años
                        </p>
                      </div>
                    )}
                    {jugadorSeleccionado.jugador.altura && (
                      <div className="rounded-xl border bg-slate-50 px-3 py-2">
                        <p className="text-[11px] text-slate-500 mb-1">Altura</p>
                        <p className="text-sm font-semibold text-slate-900">{jugadorSeleccionado.jugador.altura} m</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p>Selecciona un jugador para ver sus datos</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
            <div className="flex border-b-2 border-slate-200 bg-white p-2 gap-2">
              <button
                onClick={() => setActiveTab("alcance")}
                className={`flex-1 px-6 py-4 text-center font-semibold text-base transition rounded-xl ${
                  activeTab === "alcance"
                    ? "bg-gradient-to-br from-indigo-700 to-indigo-800 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                ALCANCE
              </button>
              <button
                onClick={() => setActiveTab("plimetria")}
                className={`flex-1 px-6 py-4 text-center font-semibold text-base transition rounded-xl ${
                  activeTab === "plimetria"
                    ? "bg-gradient-to-br from-indigo-700 to-indigo-800 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                PLIOMETRÍA
              </button>
            </div>

            <div className="p-6">
              {activeTab === "alcance" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center uppercase tracking-wide">
                      Evaluación de Alcance
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Peso (kg)</label>
                        <input
                          type="number"
                          value={peso}
                          onChange={(e) => setPeso(e.target.value)}
                          placeholder="Ej: 75"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Altura (cm)</label>
                        <input
                          type="number"
                          value={altura}
                          onChange={(e) => setAltura(e.target.value)}
                          placeholder="Ej: 180"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                      <button
                        onClick={enviarDatosJugador}
                        disabled={!peso || !altura || loading || !espConnected}
                        className="px-6 py-3 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Gauge className="h-5 w-5" />
                        Enviar Datos
                      </button>

                      {!alcanceIniciado ? (
                        <button
                          onClick={iniciarAlcance}
                          disabled={!cuentaSeleccionada || loading || !espConnected}
                          className="px-6 py-3 bg-white text-indigo-700 rounded-lg border border-indigo-600 hover:bg-indigo-50 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Play className="h-5 w-5" />
                          Iniciar Alcance
                        </button>
                      ) : (
                        <div className="px-6 py-3 bg-green-100 border border-green-500 rounded-lg flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-base font-semibold text-green-900">Alcance Activo</span>
                        </div>
                      )}

                      <button
                        onClick={calibrarSalto}
                        disabled={!espConnected || loading}
                        className="px-6 py-3 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-50 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Wrench className="h-5 w-5" />
                        Calibrar
                      </button>

                      <button
                        onClick={iniciarSalto}
                        disabled={!espConnected || loading || !alcanceIniciado}
                        className="px-6 py-3 text-white rounded-lg bg-gradient-to-r from-indigo-700 to-slate-800 hover:from-indigo-800 hover:to-slate-900 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Zap className="h-5 w-5" />
                        Realizar Salto
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <MetricCard label="Tiempo de Vuelo" value={tiempoVuelo} unit="ms" variant="default" />
                      <MetricCard label="Velocidad" value={velocidad} unit="m/s" variant="default" />
                      <MetricCard label="Potencia" value={potencia} unit="W" variant="default" />
                      <MetricCard label="Alcance" value={alturaCalculada} unit="cm" variant="default" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "plimetria" && (
                <div className="space-y-6">
                  {/* Selección de tipo de salto */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <button
                      onClick={() => setTipoSalto("salto cajon")}
                      className={`relative rounded-2xl border p-6 transition ${
                        tipoSalto === "salto cajon"
                          ? "border-indigo-600 bg-gradient-to-br from-slate-50 to-white shadow-md"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-full h-48 mb-4 rounded-lg bg-gradient-to-b from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden border border-dashed border-slate-300">
                          <ImageSequence images={SALTO_CAJON_IMAGES} alt="salto cajon" delay={3000} className="w-full h-full" />
                        </div>
                        <h3 className={`text-lg font-semibold ${tipoSalto === "salto cajon" ? "text-slate-900" : "text-slate-900"}`}>Salto Cajón</h3>
                      </div>
                    </button>

                    <button
                      onClick={() => setTipoSalto("salto valla")}
                      className={`relative rounded-2xl border p-6 transition ${
                        tipoSalto === "salto valla"
                          ? "border-indigo-600 bg-gradient-to-br from-slate-50 to-white shadow-md"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-full h-48 mb-4 rounded-lg bg-gradient-to-b from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden border border-dashed border-slate-300">
                          <ImageSequence images={SALTO_VALLA_IMAGES} alt="salto valla" delay={3000} className="w-full h-full" />
                        </div>
                        <h3 className={`text-lg font-semibold ${tipoSalto === "salto valla" ? "text-slate-900" : "text-slate-900"}`}>Salto Valla</h3>
                      </div>
                    </button>

                    <button
                      onClick={() => setTipoSalto("salto simple")}
                      className={`relative rounded-2xl border p-6 transition ${
                        tipoSalto === "salto simple"
                          ? "border-indigo-600 bg-gradient-to-br from-slate-50 to-white shadow-md"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-full h-48 mb-4 rounded-lg bg-gradient-to-b from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden border border-dashed border-slate-300">
                          <ImageSequence images={SALTO_SIMPLE_IMAGES} alt="salto simple" delay={3000} className="w-full h-full" />
                        </div>
                        <h3 className={`text-lg font-semibold ${tipoSalto === "salto simple" ? "text-slate-900" : "text-slate-900"}`}>Salto Simple</h3>
                      </div>
                    </button>
                  </div>

                  {/* Configuración */}
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 text-center uppercase tracking-wide">
                      Configuración del Ejercicio
                    </h3>

                    <div className="flex justify-center gap-6 mb-8">
                      <div className="w-40">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 text-center">Tiempo (s)</label>
                        <input
                          type="number"
                          value={tiempoPliometria}
                          onChange={(e) => setTiempoPliometria(e.target.value)}
                          placeholder="30"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                        />
                      </div>

                      <div className="w-40">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 text-center">Masa (kg)</label>
                        <input
                          type="number"
                          value={masaJugador}
                          onChange={(e) => setMasaJugador(e.target.value)}
                          placeholder="75"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                      {!pliometriaIniciada ? (
                        <button
                          onClick={iniciarPliometria}
                          disabled={!cuentaSeleccionada || loading || !tiempoPliometria || !masaJugador}
                          className="px-6 py-3 bg-white text-indigo-700 rounded-lg border border-indigo-600 hover:bg-indigo-50 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Play className="h-5 w-5" />
                          Iniciar Pliometría
                        </button>
                      ) : (
                        <div className="px-6 py-3 bg-green-100 border border-green-500 rounded-lg flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-base font-semibold text-green-900">Pliometría Activa</span>
                        </div>
                      )}

                      <button
                        onClick={calibrarEjercicio}
                        disabled={!espConnected || loading || !pliometriaIniciada}
                        className="px-6 py-3 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-50 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Wrench className="h-5 w-5" />
                        Calibrar
                      </button>

                      <button
                        onClick={iniciarEjercicio}
                        disabled={!espConnected || loading || !tiempoPliometria || !pliometriaIniciada}
                        className="px-6 py-3 text-white rounded-lg bg-gradient-to-r from-indigo-700 to-slate-800 hover:from-indigo-800 hover:to-slate-900 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Dumbbell className="h-5 w-5" />
                        Realizar Salto
                      </button>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
                    <MetricCard
                      icon="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fuerza-rQwaYzHNkSayDm1ezPNPlEptppC9WK.png"
                      label="Fuerza Máxima"
                      value={datosEjercicio.Ftotal.toFixed(1)}
                      unit="N"
                      variant="accent"
                    />
                    <MetricCard
                      icon="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/aceleracion-uT5p8f2u0RXiZNGhtYUvC4SBe4v74F.png"
                      label="Aceleración Máxima"
                      value={datosEjercicio.acelZ.toFixed(2)}
                      unit="m/s²"
                      variant="default"
                    />
                    <MetricCard
                      icon="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pontencia-r31E1tQpn0cCurnFjLCnR6GIo7IZwh.png"
                      label="Potencia Máxima"
                      value={datosEjercicio.potencia.toFixed(1)}
                      unit="W"
                      variant="success"
                    />
                  </div>

                  {/* Gráficos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Gráfico de Fuerza</h3>
                      <div className="h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                        <p className="text-slate-500 text-sm">Gráfico de fuerza</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Gráfico de Aceleración</h3>
                      {chartData.length === 0 ? (
                        <div className="h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                          <p className="text-slate-500 text-sm">Esperando datos...</p>
                        </div>
                      ) : (
                        <ChartContainer config={aceleracionChartConfig} className="h-64">
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

                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Gráfico de Potencia</h3>
                      {chartData.length === 0 ? (
                        <div className="h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                          <p className="text-slate-500 text-sm">Esperando datos...</p>
                        </div>
                      ) : (
                        <ChartContainer config={potenciaChartConfig} className="h-64">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
