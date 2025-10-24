"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Label } from "../../components/ui/label"
import { Input } from "../../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  Activity,
  User,
  Zap,
  TrendingUp,
  Timer,
  Gauge,
  Rocket,
  Dumbbell,
  LineChart,
  X,
  CheckCircle,
} from "lucide-react"
import { Chart } from "../../components/ui/chart"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"
const DEVICE_ID = "ESP-6"

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <Button
          onClick={onClose}
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          Cerrar y Limpiar
        </Button>
      </div>
    </div>
  )
}

export default function SistemaUnificadoPage() {
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
  const [duracionEjercicio, setDuracionEjercicio] = useState("")
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
    })

    channel.bind("pusher:subscription_error", (error) => {
      console.log("[v0] Subscription error:", error)
      setEspConnected(false)
      setEspStatus("Error de conexión")
      addMessage(DEVICE_ID, "Error de conexión", "error", setMessages)
    })

    channel.bind("client-response", (data) => {
      console.log("[v0] Response received:", data)
      const message = data.message || ""

      setLoading(false)
      addMessage(DEVICE_ID, message, "success", setMessages)
      addMessage("TRÁFICO", `client-response: ${JSON.stringify(data)}`, "info", setMessages)
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

      if (pliometriaIniciada && pliometriaId) {
        finalizarPliometriaAutomatico()
      }
    })

    channel.bind("client-status", (data) => {
      console.log("[v0] Status update:", data)
      addMessage(DEVICE_ID, data.message || JSON.stringify(data), "info", setMessages)
      addMessage("TRÁFICO", `client-status: ${JSON.stringify(data)}`, "info", setMessages)

      if (typeof data === "object" && data.status === "connected") {
        setEspConnected(true)
        setEspStatus("Conectado")
      }
    })
  }

  const iniciarAlcance = async () => {
    if (!cuentaSeleccionada) {
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
      } else {
        addMessage("SISTEMA", `Error al iniciar alcance: ${data.message}`, "error", setMessages)
      }
    } catch (error) {
      console.error("[v0] Error starting alcance:", error)
      addMessage("SISTEMA", "Error al iniciar alcance", "error", setMessages)
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
      } else {
        addMessage("SISTEMA", `Error al finalizar alcance: ${data.message}`, "error", setMessages)
      }
    } catch (error) {
      console.error("[v0] Error finalizing alcance:", error)
      addMessage("SISTEMA", "Error al finalizar alcance", "error", setMessages)
    }
  }

  const finalizarAlcanceManual = async () => {
    if (!alcanceId) {
      addMessage("SISTEMA", "No hay alcance iniciado", "error", setMessages)
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
      } else {
        addMessage("SISTEMA", `Error al finalizar alcance: ${data.message}`, "error", setMessages)
      }
    } catch (error) {
      console.error("[v0] Error finalizing alcance:", error)
      addMessage("SISTEMA", "Error al finalizar alcance", "error", setMessages)
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
      addMessage("SISTEMA", "Debe seleccionar un jugador primero", "error", setMessages)
      return
    }

    if (!tiempoPliometria || Number.parseFloat(tiempoPliometria) <= 0) {
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
      } else {
        addMessage("SISTEMA", `Error al iniciar pliometría: ${data.message}`, "error", setMessages)
      }
    } catch (error) {
      console.error("[v0] Error starting pliometria:", error)
      addMessage("SISTEMA", "Error al iniciar pliometría", "error", setMessages)
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
      } else {
        addMessage("SISTEMA", `Error al finalizar pliometría: ${data.message}`, "error", setMessages)
      }
    } catch (error) {
      console.error("[v0] Error finalizing pliometria:", error)
      addMessage("SISTEMA", "Error al finalizar pliometría", "error", setMessages)
    }
  }

  const finalizarPliometriaManual = async () => {
    if (!pliometriaId) {
      addMessage("SISTEMA", "No hay pliometría iniciada", "error", setMessages)
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
    setDuracionEjercicio("")
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
    const duracionNum = Number.parseFloat(duracionEjercicio)
    if (isNaN(duracionNum) || duracionNum <= 0) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
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

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Sistema Unificado de Medición - {DEVICE_ID}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Player selection */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Selección de Jugador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jugador">Jugador</Label>
              <Select value={cuentaSeleccionada} onValueChange={setCuentaSeleccionada}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      jugadoresDisponibles.length === 0 ? "No hay jugadores disponibles..." : "Seleccionar jugador..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {jugadoresDisponibles.map((cuenta) => (
                    <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                      {cuenta.jugador ? `${cuenta.jugador.nombres} ${cuenta.jugador.apellidos}` : cuenta.usuario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {jugadorSeleccionado && jugadorSeleccionado.jugador && (
              <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-slate-600">Información del Jugador</p>
                <p className="text-lg font-bold text-slate-800">
                  {jugadorSeleccionado.jugador.nombres} {jugadorSeleccionado.jugador.apellidos}
                </p>
                {jugadorSeleccionado.jugador.carrera && (
                  <p className="text-sm text-slate-600">Carrera: {jugadorSeleccionado.jugador.carrera}</p>
                )}
              </div>
            )}

            <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-600">{DEVICE_ID}</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${espConnected ? "bg-green-500" : "bg-red-500"}`} />
                    <p className="text-base text-slate-800">{espStatus || "Desconectado"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for tasks */}
        <Tabs defaultValue="tarea-a" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tarea-a" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Tarea A: Salto Vertical
            </TabsTrigger>
            <TabsTrigger value="tarea-b" className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Tarea B: Ejercicio con Celdas
            </TabsTrigger>
          </TabsList>

          {/* TAREA A: Salto Vertical */}
          <TabsContent value="tarea-a" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Configuración del Salto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!alcanceIniciado ? (
                  <Button
                    onClick={iniciarAlcance}
                    disabled={!cuentaSeleccionada || loading}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    {loading ? "Procesando..." : "Iniciar Alcance"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-green-700">Alcance Iniciado - ID: {alcanceId}</p>
                    </div>
                    <Button
                      onClick={finalizarAlcanceManual}
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    >
                      {loading ? "Finalizando..." : "Finalizar Alcance Manualmente"}
                    </Button>
                  </div>
                )}

                <Button
                  onClick={iniciarModoSalto}
                  disabled={!cuentaSeleccionada || !espConnected || loading || !alcanceIniciado}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                >
                  {loading ? "Procesando..." : "1. Iniciar Modo Salto (A)"}
                </Button>

                <div className="space-y-2">
                  <div>
                    <Label htmlFor="peso">Peso (kg)</Label>
                    <Input
                      id="peso"
                      type="number"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      placeholder="70"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="altura">Alcance de Pie (cm)</Label>
                    <Input
                      id="altura"
                      type="number"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      placeholder="240"
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={enviarDatosJugador}
                    disabled={!espConnected || loading || !peso || !altura}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {loading ? "Enviando..." : "2. Enviar Peso y Altura (D)"}
                  </Button>
                </div>

                <Button
                  onClick={calibrarSalto}
                  disabled={!espConnected || loading}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  {loading ? "Calibrando..." : "3. Calibrar Sensor (C)"}
                </Button>

                <Button
                  onClick={iniciarSalto}
                  disabled={!espConnected || loading}
                  className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  {loading ? "Esperando salto..." : "4. Iniciar Salto (S)"}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Resultados del Salto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-emerald-700 mb-2">
                      <Timer className="h-5 w-5" />
                      <span className="text-sm font-medium">Tiempo de Vuelo</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-800">{tiempoVuelo}</p>
                    <p className="text-sm text-emerald-700 mt-1">ms</p>
                  </div>

                  <div className="bg-sky-50 border-2 border-sky-300 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-sky-700 mb-2">
                      <Rocket className="h-5 w-5" />
                      <span className="text-sm font-medium">Velocidad</span>
                    </div>
                    <p className="text-3xl font-bold text-sky-800">{velocidad}</p>
                    <p className="text-sm text-sky-700 mt-1">m/s</p>
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
                      <Gauge className="h-5 w-5" />
                      <span className="text-sm font-medium">Potencia Pico</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-800">{potencia}</p>
                    <p className="text-sm text-amber-700 mt-1">W</p>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-purple-700 mb-2">
                      <TrendingUp className="h-5 w-5" />
                      <span className="text-sm font-medium">Altura</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800">{alturaCalculada}</p>
                    <p className="text-sm text-purple-700 mt-1">cm</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAREA B: Ejercicio con Celdas */}
          <TabsContent value="tarea-b" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Configuración del Ejercicio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!pliometriaIniciada ? (
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="tipoPliometria">Tipo de Pliometría</Label>
                      <Select value={tipoPliometria} onValueChange={setTipoPliometria}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salto cajon">Salto Cajón</SelectItem>
                          <SelectItem value="salto simple">Salto Simple</SelectItem>
                          <SelectItem value="salto valla">Salto Valla</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tiempoPliometria">Tiempo de Pliometría (segundos)</Label>
                      <Input
                        id="tiempoPliometria"
                        type="number"
                        value={tiempoPliometria}
                        onChange={(e) => setTiempoPliometria(e.target.value)}
                        placeholder="30"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={iniciarPliometria}
                      disabled={!cuentaSeleccionada || loading || !tiempoPliometria}
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      {loading ? "Procesando..." : "Iniciar Pliometría"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-green-700">
                        Pliometría Iniciada - ID: {pliometriaId} - Tipo: {tipoPliometria}
                      </p>
                    </div>
                    <Button
                      onClick={finalizarPliometriaManual}
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    >
                      {loading ? "Finalizando..." : "Finalizar Pliometría"}
                    </Button>
                  </div>
                )}

                <div>
                  <Label htmlFor="masaJugador">Masa del Jugador (kg)</Label>
                  <Input
                    id="masaJugador"
                    type="number"
                    value={masaJugador}
                    onChange={(e) => setMasaJugador(e.target.value)}
                    placeholder="75"
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={iniciarModoEjercicio}
                  disabled={!cuentaSeleccionada || !espConnected || loading || !masaJugador || !pliometriaIniciada}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                >
                  {loading ? "Procesando..." : "1. Iniciar Modo Ejercicio (B)"}
                </Button>

                <Button
                  onClick={calibrarEjercicio}
                  disabled={!espConnected || loading}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  {loading ? "Calibrando..." : "2. Calibrar Sensores (I)"}
                </Button>

                <div>
                  <Label htmlFor="duracion">Duración del Ejercicio (segundos)</Label>
                  <Input
                    id="duracion"
                    type="number"
                    value={duracionEjercicio}
                    onChange={(e) => setDuracionEjercicio(e.target.value)}
                    placeholder="30"
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={iniciarEjercicio}
                  disabled={!espConnected || loading || !duracionEjercicio}
                  className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  {loading ? "Iniciando ejercicio..." : "3. Iniciar Ejercicio (S)"}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Datos en Tiempo Real (Valores Máximos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-blue-700 mb-2">Fuerza 1 (Máx)</p>
                    <p className="text-2xl font-bold text-blue-800">{datosEjercicio.F1.toFixed(1)}</p>
                    <p className="text-xs text-blue-700 mt-1">N</p>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-blue-700 mb-2">Fuerza 2 (Máx)</p>
                    <p className="text-2xl font-bold text-blue-800">{datosEjercicio.F2.toFixed(1)}</p>
                    <p className="text-xs text-blue-700 mt-1">N</p>
                  </div>

                  <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-indigo-700 mb-2">Fuerza Total (Máx)</p>
                    <p className="text-2xl font-bold text-indigo-800">{datosEjercicio.Ftotal.toFixed(1)}</p>
                    <p className="text-xs text-indigo-700 mt-1">N</p>
                  </div>

                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-green-700 mb-2">Aceleración Z (Máx)</p>
                    <p className="text-2xl font-bold text-green-800">{datosEjercicio.acelZ.toFixed(2)}</p>
                    <p className="text-xs text-green-700 mt-1">m/s²</p>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-purple-700 mb-2">Pitch (Máx)</p>
                    <p className="text-2xl font-bold text-purple-800">{datosEjercicio.pitch.toFixed(1)}</p>
                    <p className="text-xs text-purple-700 mt-1">°</p>
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-amber-700 mb-2">Potencia (Máx)</p>
                    <p className="text-2xl font-bold text-amber-800">{datosEjercicio.potencia.toFixed(1)}</p>
                    <p className="text-xs text-amber-700 mt-1">W</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {chartData.length === 0 ? (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Gráfica en Tiempo Real
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                      <p className="text-slate-500">Esperando datos del ejercicio...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Chart
                    title="Fuerza Total en Tiempo Real"
                    type="line"
                    data={chartData}
                    xKey="point"
                    yKey="Ftotal"
                    color="#6366f1"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Chart
                      title="Aceleración Z"
                      type="bar"
                      data={chartData}
                      xKey="point"
                      yKey="acelZ"
                      color="#10b981"
                    />
                    <Chart title="Potencia" type="line" data={chartData} xKey="point" yKey="potencia" color="#f59e0b" />
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Messages monitor */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Monitor de Mensajes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {messages.length === 0 ? (
                <p className="text-slate-400">No hay mensajes aún...</p>
              ) : (
                <div className="space-y-1">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 ${
                        msg.status === "error"
                          ? "text-red-400"
                          : msg.status === "success"
                            ? "text-green-400"
                            : msg.status === "warning"
                              ? "text-yellow-400"
                              : "text-slate-300"
                      }`}
                    >
                      <span className="text-slate-500">[{msg.timestamp}]</span>
                      <span className="font-semibold">{msg.device}:</span>
                      <span>{msg.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
