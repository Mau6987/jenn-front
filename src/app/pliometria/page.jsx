"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Label } from "../../components/ui/label"
import {
  Activity,
  Play,
  Square,
  Clock,
  User,
  Trophy,
  Calendar,
  GraduationCap,
  Ruler,
  MapPin,
  Zap,
  TrendingUp,
} from "lucide-react"

const BACKEND_URL = "https://voley-backend-nhyl.onrender.com"

export default function PliometriaPage() {
  // State variables
  const [testActive, setTestActive] = useState(false)
  const [tiempoEjecucion, setTiempoEjecucion] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  const [pruebaActual, setPruebaActual] = useState(null)

  // ESP data from Pusher
  const [datosESP, setDatosESP] = useState({
    aceleracion: null,
    extensionI: null,
    extensionD: null,
  })

  // Player and exercise selection
  const [cuentas, setCuentas] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState("")
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([])
  const [tipoEjercicio, setTipoEjercicio] = useState("salto_simple")

  // Pusher connection
  const [pusherConnected, setPusherConnected] = useState(false)
  const [pusherStatus, setPusherStatus] = useState("Desconectado")
  const [espMessages, setEspMessages] = useState([])

  // Refs
  const testActiveRef = useRef(false)
  const timerIntervalRef = useRef(null)

  useEffect(() => {
    testActiveRef.current = testActive
    timerIntervalRef.current = timerInterval
  }, [testActive, timerInterval])

  useEffect(() => {
    console.log("[v0] Connecting to backend:", BACKEND_URL)
    cargarCuentas()
    loadPusher()

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  const cargarCuentas = async () => {
    console.log("[v0] Loading accounts from:", `${BACKEND_URL}/api/cuentas`)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${BACKEND_URL}/api/cuentas`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Accounts loaded:", data)

      if (data.success) {
        setCuentas(data.data)
        const jugadores = data.data.filter((cuenta) => cuenta.rol === "jugador")
        setJugadoresDisponibles(jugadores)
        console.log("[v0] Players filtered:", jugadores.length)

        if (jugadores.length === 0) {
          addMessage("warning", "No se encontraron jugadores disponibles")
        }
      } else {
        throw new Error(data.message || "Error en respuesta del servidor")
      }
    } catch (error) {
      console.error("[v0] Error loading accounts:", error)

      if (error.name === "AbortError") {
        setPusherStatus("Timeout cargando cuentas")
      } else {
        setPusherStatus(`Error cargando cuentas: ${error.message}`)
      }
    }
  }

  const jugadorSeleccionado = cuentas.find((c) => c.id === Number(cuentaSeleccionada))

  const loadPusher = async () => {
    if (typeof window === "undefined") return

    try {
      const script = document.createElement("script")
      script.src = "https://js.pusher.com/8.2.0/pusher.min.js"
      script.async = true
      document.head.appendChild(script)

      script.onload = () => {
        initializePusher()
      }
    } catch (error) {
      console.error("Error loading Pusher:", error)
      setPusherStatus("Error cargando Pusher")
    }
  }

  const initializePusher = () => {
    const pusherKey = "4f85ef5c792df94cebc9"
    const pusherCluster = "us2"

    const pusher = new window.Pusher(pusherKey, {
      cluster: pusherCluster,
      encrypted: true,
      authEndpoint: `${BACKEND_URL}/api/pusher/pusher/auth`,
      forceTLS: true,
    })

    console.log("Pusher instance created")

    pusher.connection.bind("connecting", () => {
      console.log("Pusher connecting...")
      setPusherStatus("Conectando...")
    })

    pusher.connection.bind("connected", () => {
      console.log("Pusher connected successfully!")
      console.log("Socket ID:", pusher.connection.socket_id)
      setPusherStatus("Conectado")
      setPusherConnected(true)

      subscribeToESP6Channel(pusher)
    })

    pusher.connection.bind("disconnected", () => {
      console.log("Pusher disconnected")
      setPusherStatus("Desconectado")
      setPusherConnected(false)
    })

    pusher.connection.bind("failed", () => {
      console.log("Pusher connection failed")
      setPusherStatus("Error de conexión")
      setPusherConnected(false)
    })

    pusher.connection.bind("error", (error) => {
      console.log("Pusher connection error:", error)
      setPusherStatus("Error: " + error.message)
      setPusherConnected(false)
    })
  }

  const subscribeToESP6Channel = (pusher) => {
    console.log("Subscribing to ESP-6 channel...")

    const channelName = "private-device-ESP-6"
    console.log("Subscribing to channel:", channelName)

    const channel = pusher.subscribe(channelName)

    channel.bind("pusher:subscription_succeeded", () => {
      console.log("Successfully subscribed to", channelName)
      addMessage("success", "Conectado a ESP-6")
    })

    channel.bind("pusher:subscription_error", (error) => {
      console.log("Subscription error for", channelName, ":", error)
      addMessage("error", "Error conectando a ESP-6")
    })

    channel.bind("client-response", (data) => {
      console.log("[v0] Received data from ESP-6:", data)

      if (testActiveRef.current) {
        // Parse the data from ESP
        const message = data.message || data

        // Expected format: { aceleracion: "value", extensionI: "value", extensionD: "value" }
        if (typeof message === "object") {
          setDatosESP({
            aceleracion: message.aceleracion || message.acceleration || null,
            extensionI: message.extensionI || message.extension_izq || null,
            extensionD: message.extensionD || message.extension_der || null,
          })
          addMessage(
            "success",
            `Datos recibidos: Acel=${message.aceleracion}, ExtI=${message.extensionI}, ExtD=${message.extensionD}`,
          )
        } else {
          addMessage("info", `Mensaje de ESP-6: ${JSON.stringify(message)}`)
        }
      }
    })

    channel.bind("client-heartbeat", (data) => {
      console.log("Heartbeat received from ESP-6:", data)
      addMessage("info", "Heartbeat de ESP-6")
    })

    channel.bind_global((eventName, data) => {
      if (eventName.startsWith("client-")) {
        console.log("Global event received:", eventName, "from ESP-6, data:", data)
      }
    })
  }

  const addMessage = (type, message) => {
    const msg = {
      type: type,
      message: message,
      timestamp: Date.now(),
    }
    setEspMessages((prev) => [...prev.slice(-9), msg])
  }

  const sendCommandToESP6 = async (command) => {
    try {
      const deviceId = "ESP-6"
      const response = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: deviceId,
          command: command,
          channel: `private-device-${deviceId}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al enviar comando")
      }

      console.log(`Command sent to ${deviceId}:`, data)
      addMessage("info", `Comando "${command}" enviado a ESP-6`)
    } catch (error) {
      console.error(`Error sending command to ESP-6:`, error)
      addMessage("error", `Error enviando comando: ${error.message}`)
    }
  }

  const iniciarPliometria = async () => {
    if (!cuentaSeleccionada) {
      addMessage("error", "Debe seleccionar un jugador")
      return
    }

    try {
      console.log("[v0] Starting pliometria for account:", cuentaSeleccionada)

      const response = await fetch(`${BACKEND_URL}/api/pliometrias/iniciar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cuentaId: cuentaSeleccionada,
          tipo_de_ejercicio: tipoEjercicio,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Pliometria start response:", data)

      if (data.success) {
        localStorage.setItem("pliometria_id", data.data.id.toString())

        setPruebaActual(data.data)
        setTestActive(true)
        setTiempoEjecucion(0)
        setDatosESP({ aceleracion: null, extensionI: null, extensionD: null })

        addMessage("success", `Pliometría iniciada - ${tipoEjercicio}`)

        await sendCommandToESP6("i")

        const interval = setInterval(() => {
          setTiempoEjecucion((prev) => prev + 0.1)
        }, 100)
        setTimerInterval(interval)
      } else {
        addMessage("error", "Error iniciando pliometría: " + data.message)
      }
    } catch (error) {
      console.error("[v0] Error starting pliometria:", error)
      addMessage("error", `Error iniciando pliometría: ${error.message}`)
    }
  }

  const finalizarPliometria = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      setTimerInterval(null)
    }

    const pliometriaId = localStorage.getItem("pliometria_id")

    if (pliometriaId) {
      try {
        console.log("[v0] Finalizing pliometria:", pliometriaId)

        const response = await fetch(`${BACKEND_URL}/api/pliometrias/finalizar/${pliometriaId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tiempo_ejecucion: Number.parseFloat(tiempoEjecucion.toFixed(2)),
            aceleracion: datosESP.aceleracion ? Number.parseFloat(datosESP.aceleracion) : 0,
            extension_pierna_izq: datosESP.extensionI ? Number.parseFloat(datosESP.extensionI) : 0,
            extension_pierna_der: datosESP.extensionD ? Number.parseFloat(datosESP.extensionD) : 0,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("[v0] Pliometria finalization response:", data)

        if (data.success) {
          addMessage("success", "Pliometría finalizada correctamente")
          localStorage.removeItem("pliometria_id")
        } else {
          addMessage("error", "Error finalizando pliometría: " + data.message)
        }
      } catch (error) {
        console.error("[v0] Error finalizing pliometria:", error)
        addMessage("error", `Error finalizando pliometría: ${error.message}`)
      }
    }

    limpiarPliometria()
  }

  const limpiarPliometria = () => {
    setTestActive(false)
    setPruebaActual(null)
    setTiempoEjecucion(0)
    setDatosESP({ aceleracion: null, extensionI: null, extensionD: null })

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      setTimerInterval(null)
    }

    addMessage("info", "Sistema limpio para nueva pliometría")
  }

  const formatTime = (seconds) => {
    return seconds.toFixed(1) + "s"
  }

  return (
    <div className="space-y-6 p-6">
      {/* Player Info Card */}
      {jugadorSeleccionado && jugadorSeleccionado.jugador && (
        <Card className="rounded-xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-900 to-purple-800 px-4 py-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {jugadorSeleccionado.jugador.nombres} {jugadorSeleccionado.jugador.apellidos}
                </h2>
                <div className="flex items-center space-x-2">
                  <Trophy className="h-3 w-3 text-purple-100" />
                  <span className="text-purple-100 text-xs font-medium">Jugador</span>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1">
                  Información de Contacto
                </h3>

                <div className="space-y-2">
                  {jugadorSeleccionado.jugador.fecha_nacimiento && (
                    <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200/50">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800">Edad</p>
                          <p className="text-xs text-gray-700">
                            {(() => {
                              const birthDate = new Date(jugadorSeleccionado.jugador.fecha_nacimiento)
                              const today = new Date()
                              let age = today.getFullYear() - birthDate.getFullYear()
                              const monthDiff = today.getMonth() - birthDate.getMonth()
                              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                age--
                              }
                              return `${age} años`
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {jugadorSeleccionado.jugador.carrera && (
                    <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200/50">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800">Carrera</p>
                          <p className="text-xs text-gray-700">{jugadorSeleccionado.jugador.carrera}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1">
                  Información del Jugador
                </h3>

                <div className="space-y-2">
                  {jugadorSeleccionado.jugador.posicion_principal && (
                    <div className="bg-purple-50/80 px-3 py-2 rounded-lg border border-purple-200/50">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-purple-800">Posición Principal</p>
                          <p className="text-xs text-purple-700 capitalize">
                            {jugadorSeleccionado.jugador.posicion_principal}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {jugadorSeleccionado.jugador.altura && (
                    <div className="bg-purple-50/80 px-3 py-2 rounded-lg border border-purple-200/50">
                      <div className="flex items-center space-x-2">
                        <Ruler className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-purple-800">Altura</p>
                          <p className="text-xs text-purple-700">{jugadorSeleccionado.jugador.altura} m</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Card */}
      {testActive && (
        <Card className="border-2 border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Activity className="h-5 w-5" />
              Pliometría en Progreso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Tiempo
                </p>
                <p className="text-2xl font-bold text-purple-600">{formatTime(tiempoEjecucion)}</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Aceleración
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {datosESP.aceleracion !== null ? datosESP.aceleracion : "--"}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Ext. Izq.
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {datosESP.extensionI !== null ? datosESP.extensionI : "--"}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Ext. Der.
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {datosESP.extensionD !== null ? datosESP.extensionD : "--"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-3 bg-white/60 rounded-lg border border-purple-200">
              <Badge variant="outline" className="bg-white capitalize">
                {tipoEjercicio.replace("_", " ")}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800">ESP-6 Activo</Badge>
              <Badge className="bg-green-100 text-green-800">
                Pusher: {pusherConnected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Configuración de Pliometría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="jugador">Seleccionar Jugador</Label>
              <Select value={cuentaSeleccionada} onValueChange={setCuentaSeleccionada} disabled={testActive}>
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
              <div className="text-sm text-gray-500 mt-1">{jugadoresDisponibles.length} jugador(es) disponible(s)</div>
            </div>

            <div>
              <Label htmlFor="tipo-ejercicio">Tipo de Ejercicio</Label>
              <Select value={tipoEjercicio} onValueChange={setTipoEjercicio} disabled={testActive}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salto_simple">Salto Simple</SelectItem>
                  <SelectItem value="salto_cajon">Salto Cajón</SelectItem>
                  <SelectItem value="salto_valla">Salto Valla</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              {!testActive ? (
                <Button onClick={iniciarPliometria} disabled={!cuentaSeleccionada} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Pliometría
                </Button>
              ) : (
                <Button onClick={finalizarPliometria} variant="destructive" className="w-full">
                  <Square className="h-4 w-4 mr-2" />
                  Finalizar Pliometría
                </Button>
              )}
            </div>
          </div>

          {testActive && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Pliometría en curso:</strong> El ESP-6 está enviando datos. Presiona "Finalizar" cuando el
                ejercicio termine o si deseas detenerlo manualmente.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Mensajes del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {espMessages.length === 0 ? (
              <p className="text-sm text-gray-500">No hay mensajes aún...</p>
            ) : (
              espMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg text-sm ${
                    msg.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : msg.type === "error"
                        ? "bg-red-50 text-red-800 border border-red-200"
                        : msg.type === "warning"
                          ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                  }`}
                >
                  <span className="font-medium">{new Date(msg.timestamp).toLocaleTimeString()}</span> - {msg.message}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
