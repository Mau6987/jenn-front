"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Activity, Zap, Timer, Rocket, LineChart, X, CheckCircle, ArrowUp, AlertCircle } from "lucide-react"
import { Chart } from "../../components/ui/chart"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"
const DEVICE_ID = "ESP-6"

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

function addMessage(device, message, status, setMessages) {
  const timestamp = new Date().toLocaleTimeString()
  setMessages((prev) => [...prev, { device, message, status, timestamp }])
}

async function cargarCuentas(setCuentas, setJugadoresDisponibles) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/cuentas`)
    const data = await response.json()

    if (data.success) {
      setCuentas(data.data)
      setJugadoresDisponibles(data.data)
      console.log("[v0] Cuentas cargadas:", data.data.length)
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId: DEVICE_ID,
        command: command,
        channel: `private-device-${DEVICE_ID}`,
      }),
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

function ResultModal({ isOpen, onClose, title, data }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600 animate-in spin-in duration-500" />
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:rotate-90"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(data).map(([key, value], index) => (
            <div
              key={key}
              className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200 animate-in slide-in-from-left duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <p className="text-xs text-gray-500 mb-1 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <Button onClick={onClose} className="w-full mt-6 bg-red-900 hover:bg-red-800 transition-all duration-300">
          Cerrar y Limpiar
        </Button>
      </div>
    </div>
  )
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

  // TAREA A: Salto Vertical
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

  // TAREA B: Ejercicio con Celdas
  const [masaJugador, setMasaJugador] = useState("")
  const [tiempoPliometria, setTiempoPliometria] = useState("")
  const [estadoB, setEstadoB] = useState("menu")
  const [datosEjercicio, setDatosEjercicio] = useState({
    F1: 0,
    F2: 0,
    Ftotal: 0,
    acelZ: 0,
    pitch: 0,
    potencia: 0,
  })
  const [pliometriaId, setPliometriaId] = useState(null)
  const [pliometriaIniciada, setPliometriaIniciada] = useState(false)
  const [tipoPliometria, setTipoPliometria] = useState("salto cajon")
  const [modalPliometriaOpen, setModalPliometriaOpen] = useState(false)
  const [pliometriaGuardada, setPliometriaGuardada] = useState(null)
  const [ejercicioEnCurso, setEjercicioEnCurso] = useState(false)

  // TAREA C: Gráfica en Tiempo Real
  const [chartData, setChartData] = useState([])
  const [dataPointCounter, setDataPointCounter] = useState(0)

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

      if (alcanceIniciado && alcanceId) {
        finalizarAlcanceAutomatico(data)
      }
    })

    channel.bind("client-exercise-data", (data) => {
      console.log("[v0] Exercise data received:", data)

      addMessage(
        "TRÁFICO",
        `client-exercise-data: F1=${data.F1?.toFixed(1)}, F2=${data.F2?.toFixed(1)}, Ftotal=${data.Ftotal?.toFixed(1)}, acelZ=${data.acelZ?.toFixed(2)}, pitch=${data.pitch?.toFixed(1)}, potencia=${data.potencia?.toFixed(1)}`,
        "info",
        setMessages,
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
          const newPoint = {
            point: newCounter,
            F1: data.F1 || 0,
            F2: data.F2 || 0,
            Ftotal: data.Ftotal || 0,
            acelZ: data.acelZ || 0,
            pitch: data.pitch || 0,
            potencia: data.potencia || 0,
          }
          const updatedData = [...prevData, newPoint]
          return updatedData.slice(-100)
        })
        return newCounter
      })
    })

    channel.bind("client-exercise-complete", (data) => {
      console.log("[v0] Exercise complete:", data)
      addMessage(DEVICE_ID, "Ejercicio completado", "success", setMessages)
      setEjercicioEnCurso(false)

      showNotification("success", "Ejercicio completado")

      if (pliometriaIniciada && pliometriaId) {
        finalizarPliometriaAutomatico()
      }
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cuentaId: Number(cuentaSeleccionada),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAlcanceId(data.data.id)
        setAlcanceIniciado(true)
        addMessage("SISTEMA", `Alcance iniciado con ID: ${data.data.id}`, "success", setMessages)
        showNotification("success", `Alcance iniciado con ID: ${data.data.id}`)
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
        headers: {
          "Content-Type": "application/json",
        },
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
        headers: {
          "Content-Type": "application/json",
        },
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

    try {
      const response = await fetch(`${BACKEND_URL}/api/pliometrias/iniciar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cuentaId: Number(cuentaSeleccionada),
          tipo: tipoPliometria,
          tiempo: Number.parseFloat(tiempoPliometria),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPliometriaId(data.data.id)
        setPliometriaIniciada(true)
        addMessage("SISTEMA", `Pliometría iniciada con ID: ${data.data.id}`, "success", setMessages)
        showNotification("success", `Pliometría iniciada con ID: ${data.data.id}`)
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
        headers: {
          "Content-Type": "application/json",
        },
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
          Tipo: tipoPliometria,
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
    setDatosEjercicio({
      F1: 0,
      F2: 0,
      Ftotal: 0,
      acelZ: 0,
      pitch: 0,
      potencia: 0,
    })
    setChartData([])
    setDataPointCounter(0)
    setMasaJugador("")
    setTiempoPliometria("")
    setEstadoB("menu")
    setEjercicioEnCurso(false)
    addMessage("SISTEMA", "Datos de pliometría limpiados", "info", setMessages)
  }

  // TAREA A: Funciones
  const iniciarModoSalto = () => sendCommand("A", setMessages)
  const enviarDatosJugador = () => {
    const pesoNum = Number.parseFloat(peso)
    const alturaNum = Number.parseFloat(altura)

    console.log("[v0] Peso input:", peso, "-> parsed:", pesoNum)
    console.log("[v0] Altura input:", altura, "-> parsed:", alturaNum)

    if (isNaN(pesoNum) || pesoNum <= 0 || isNaN(alturaNum) || alturaNum <= 0) {
      showNotification("error", "Peso y altura deben ser válidos")
      addMessage("SISTEMA", "Peso y altura deben ser válidos", "error", setMessages)
      return
    }
    sendCommand(`D:${pesoNum}:${alturaNum}`, setMessages)
  }
  const calibrarSalto = () => sendCommand("C", setMessages)
  const iniciarSalto = () => sendCommand("S", setMessages)

  // TAREA B: Funciones
  const iniciarModoEjercicio = () => {
    const masaNum = Number.parseFloat(masaJugador)
    if (isNaN(masaNum) || masaNum <= 0) {
      showNotification("error", "Masa del jugador debe ser válida")
      addMessage("SISTEMA", "Masa del jugador debe ser válida", "error", setMessages)
      return
    }
    setDatosEjercicio({
      F1: 0,
      F2: 0,
      Ftotal: 0,
      acelZ: 0,
      pitch: 0,
      potencia: 0,
    })
    sendCommand("B", setMessages)
    setTimeout(() => sendCommand(`M:${masaNum}`, setMessages), 300)
  }

  const calibrarEjercicio = () => sendCommand("I", setMessages)

  const iniciarEjercicio = () => {
    const duracionNum = Number.parseFloat(tiempoPliometria)
    if (isNaN(duracionNum) || duracionNum <= 0) {
      showNotification("error", "Duración debe ser válida")
      addMessage("SISTEMA", "Duración debe ser válida", "error", setMessages)
      return
    }
    setChartData([])
    setDataPointCounter(0)
    setDatosEjercicio({
      F1: 0,
      F2: 0,
      Ftotal: 0,
      acelZ: 0,
      pitch: 0,
      potencia: 0,
    })
    setEjercicioEnCurso(true)
    sendCommand(`T:${duracionNum}`, setMessages)
    setTimeout(() => sendCommand("S", setMessages), 500)
  }

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Notification notification={notification} onClose={() => setNotification(null)} />

      <ResultModal
        isOpen={modalAlcanceOpen}
        onClose={cerrarModalAlcance}
        title="Alcance Guardado"
        data={alcanceGuardado || {}}
      />

      <ResultModal
        isOpen={modalPliometriaOpen}
        onClose={cerrarModalPliometria}
        title="Pliometría Guardada"
        data={pliometriaGuardada || {}}
      />

      <div className="w-full p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-900 via-red-800 to-red-900 bg-clip-text text-transparent mb-2">
              Sistema Unificado de Pruebas
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-red-800 to-transparent mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Sistema de evaluación de rendimiento deportivo</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">Seleccionar Jugador</h2>
            <select
              value={cuentaSeleccionada}
              onChange={(e) => setCuentaSeleccionada(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-900 focus:border-transparent"
            >
              <option value="">
                {jugadoresDisponibles.length === 0 ? "No hay jugadores..." : "Selecciona un jugador"}
              </option>
              {jugadoresDisponibles.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id.toString()}>
                  {cuenta.jugador ? `${cuenta.jugador.nombres} ${cuenta.jugador.apellidos}` : cuenta.usuario}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Datos del Jugador Seleccionado
            </h2>
            {jugadorSeleccionado && jugadorSeleccionado.jugador ? (
              <div className="space-y-3">
                <p className="text-2xl font-bold text-gray-900">
                  {jugadorSeleccionado.jugador.nombres} {jugadorSeleccionado.jugador.apellidos}
                </p>
                {jugadorSeleccionado.jugador.carrera && (
                  <p className="text-sm text-gray-600">Carrera: {jugadorSeleccionado.jugador.carrera}</p>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <Zap className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">{DEVICE_ID}</span>
                  <div
                    className={`w-2 h-2 rounded-full ${espConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                  />
                  <span className="text-sm text-gray-700">{espStatus || "Desconectado"}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic py-4">Seleccione un jugador para ver sus datos</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden mb-6">
            <div className="grid grid-cols-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("alcance")}
                className={`px-6 py-4 text-center font-semibold transition-colors ${
                  activeTab === "alcance" ? "bg-red-900 text-white" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                alcance
              </button>
              <button
                onClick={() => setActiveTab("plimetria")}
                className={`px-6 py-4 text-center font-semibold transition-colors ${
                  activeTab === "plimetria" ? "bg-red-900 text-white" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                plimetria
              </button>
            </div>

            <div className="p-6">
              {activeTab === "alcance" && (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    {!alcanceIniciado ? (
                      <button
                        onClick={iniciarAlcance}
                        disabled={!cuentaSeleccionada || loading}
                        className="px-12 py-3 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Iniciar alcance
                      </button>
                    ) : (
                      <div className="flex gap-4 items-center">
                        <div className="bg-green-50 border-2 border-green-400 rounded-lg px-6 py-3 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm font-semibold text-green-700">Alcance Activo - ID: {alcanceId}</span>
                        </div>
                        <button
                          onClick={finalizarAlcanceManual}
                          disabled={loading}
                          className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                        >
                          Finalizar Alcance
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-4">
                    <button
                      onClick={iniciarModoSalto}
                      disabled={!espConnected || loading || !alcanceIniciado}
                      className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Procesando..." : "1. Iniciar Modo Salto (A)"}
                    </button>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Peso (kg)</label>
                          <input
                            type="number"
                            value={peso}
                            onChange={(e) => setPeso(e.target.value)}
                            placeholder="70"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Alcance de Pie (cm)</label>
                          <input
                            type="number"
                            value={altura}
                            onChange={(e) => setAltura(e.target.value)}
                            placeholder="240"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <button
                        onClick={enviarDatosJugador}
                        disabled={!espConnected || loading || !peso || !altura || !alcanceIniciado}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Enviando..." : "2. Enviar Peso y Altura (D)"}
                      </button>
                    </div>

                    <button
                      onClick={calibrarSalto}
                      disabled={!espConnected || loading || !alcanceIniciado}
                      className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Calibrando..." : "3. Calibrar Sensor (C)"}
                    </button>

                    <button
                      onClick={iniciarSalto}
                      disabled={!espConnected || loading || !alcanceIniciado}
                      className="w-full px-6 py-4 text-lg bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Esperando salto..." : "4. Iniciar Salto (S)"}
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wide flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Resultados del Salto
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-green-50 rounded-xl p-4 text-center border-2 border-green-300">
                        <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                          <Timer className="h-5 w-5" />
                          <span className="text-xs font-medium">Tiempo de vuelo</span>
                        </div>
                        <p className="text-3xl font-bold text-green-800">{tiempoVuelo}</p>
                        <p className="text-xs text-green-700 mt-1">ms</p>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-300">
                        <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                          <Rocket className="h-5 w-5" />
                          <span className="text-xs font-medium">Velocidad</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-800">{velocidad}</p>
                        <p className="text-xs text-blue-700 mt-1">m/s</p>
                      </div>

                      <div className="bg-amber-50 rounded-xl p-4 text-center border-2 border-amber-300">
                        <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
                          <Zap className="h-5 w-5" />
                          <span className="text-xs font-medium">Potencia Pico</span>
                        </div>
                        <p className="text-3xl font-bold text-amber-800">{potencia}</p>
                        <p className="text-xs text-amber-700 mt-1">W</p>
                      </div>

                      <div className="bg-purple-50 rounded-xl p-4 text-center border-2 border-purple-300">
                        <div className="flex items-center justify-center gap-2 text-purple-700 mb-2">
                          <ArrowUp className="h-5 w-5" />
                          <span className="text-xs font-medium">Altura</span>
                        </div>
                        <p className="text-3xl font-bold text-purple-800">{alturaCalculada}</p>
                        <p className="text-xs text-purple-700 mt-1">cm</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "plimetria" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Pliometría</label>
                        <select
                          value={tipoPliometria}
                          onChange={(e) => setTipoPliometria(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                        >
                          <option value="salto cajon">Salto Cajón</option>
                          <option value="salto simple">Salto Simple</option>
                          <option value="salto valla">Salto Valla</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tiempo (segundos)</label>
                        <input
                          type="number"
                          value={tiempoPliometria}
                          onChange={(e) => setTiempoPliometria(e.target.value)}
                          placeholder="30"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                        />
                      </div>

                      {!pliometriaIniciada ? (
                        <button
                          onClick={iniciarPliometria}
                          disabled={!cuentaSeleccionada || loading || !tiempoPliometria}
                          className="w-full px-6 py-3 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Iniciar Pliometría
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-green-50 border-2 border-green-400 rounded-lg px-4 py-3 text-center">
                            <span className="text-sm font-semibold text-green-700">
                              Pliometría Activa - ID: {pliometriaId}
                            </span>
                          </div>
                          <button
                            onClick={finalizarPliometriaManual}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                          >
                            Finalizar Pliometría
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Masa del Jugador (kg)</label>
                        <input
                          type="number"
                          value={masaJugador}
                          onChange={(e) => setMasaJugador(e.target.value)}
                          placeholder="75"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
                        />
                      </div>

                      <button
                        onClick={iniciarModoEjercicio}
                        disabled={!espConnected || loading || !masaJugador || !pliometriaIniciada}
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Procesando..." : "1. Iniciar Modo Ejercicio (B)"}
                      </button>

                      <button
                        onClick={calibrarEjercicio}
                        disabled={!espConnected || loading || !pliometriaIniciada}
                        className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Calibrando..." : "2. Calibrar Sensores (I)"}
                      </button>

                      <button
                        onClick={iniciarEjercicio}
                        disabled={!espConnected || loading || !tiempoPliometria || !pliometriaIniciada}
                        className="w-full px-6 py-4 text-lg bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Iniciando ejercicio..." : "3. Iniciar Ejercicio (S)"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wide flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Datos en Tiempo Real (Valores Máximos)
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-300">
                        <p className="text-xs font-medium text-blue-700 mb-2">Fuerza 1 (Máx)</p>
                        <p className="text-2xl font-bold text-blue-800">{datosEjercicio.F1.toFixed(1)}</p>
                        <p className="text-xs text-blue-700 mt-1">N</p>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-300">
                        <p className="text-xs font-medium text-blue-700 mb-2">Fuerza 2 (Máx)</p>
                        <p className="text-2xl font-bold text-blue-800">{datosEjercicio.F2.toFixed(1)}</p>
                        <p className="text-xs text-blue-700 mt-1">N</p>
                      </div>

                      <div className="bg-indigo-50 rounded-xl p-4 text-center border-2 border-indigo-300">
                        <p className="text-xs font-medium text-indigo-700 mb-2">Fuerza Total (Máx)</p>
                        <p className="text-2xl font-bold text-indigo-800">{datosEjercicio.Ftotal.toFixed(1)}</p>
                        <p className="text-xs text-indigo-700 mt-1">N</p>
                      </div>

                      <div className="bg-green-50 rounded-xl p-4 text-center border-2 border-green-300">
                        <p className="text-xs font-medium text-green-700 mb-2">Aceleración Z (Máx)</p>
                        <p className="text-2xl font-bold text-green-800">{datosEjercicio.acelZ.toFixed(2)}</p>
                        <p className="text-xs text-green-700 mt-1">m/s²</p>
                      </div>

                      <div className="bg-purple-50 rounded-xl p-4 text-center border-2 border-purple-300">
                        <p className="text-xs font-medium text-purple-700 mb-2">Pitch (Máx)</p>
                        <p className="text-2xl font-bold text-purple-800">{datosEjercicio.pitch.toFixed(1)}</p>
                        <p className="text-xs text-purple-700 mt-1">°</p>
                      </div>

                      <div className="bg-amber-50 rounded-xl p-4 text-center border-2 border-amber-300">
                        <p className="text-xs font-medium text-amber-700 mb-2">Potencia (Máx)</p>
                        <p className="text-2xl font-bold text-amber-800">{datosEjercicio.potencia.toFixed(1)}</p>
                        <p className="text-xs text-amber-700 mt-1">W</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wide flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Gráfica en Tiempo Real
                    </h2>
                    {chartData.length === 0 ? (
                      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-gray-500">Esperando datos del ejercicio...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Chart
                          title="Fuerza Total en Tiempo Real"
                          type="line"
                          data={chartData}
                          xKey="point"
                          yKey="Ftotal"
                          color="#6366f1"
                        />
                      </div>
                    )}
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
