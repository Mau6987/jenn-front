"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Label } from "../../components/ui/label"
import { Input } from "../../components/ui/input"
import { Activity, User, Calendar, GraduationCap, Zap, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const BACKEND_URL = "https://voley-backend-nhyl.onrender.com"

export default function AlcancePage() {
  const [cuentas, setCuentas] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState("")
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([])

  const [pusherConnected, setPusherConnected] = useState(false)
  const [pusherStatus, setPusherStatus] = useState("Desconectado")
  const [esp6Connected, setEsp6Connected] = useState(false)
  const [esp6Status, setEsp6Status] = useState("")

  // Alcance data
  const [peso, setPeso] = useState("")
  const [altura, setAltura] = useState("")
  const [alcanceActual, setAlcanceActual] = useState("0")
  const [alcanceRealizado, setAlcanceRealizado] = useState("0")

  // Calibración data
  const [calibracionData, setCalibracionData] = useState({
    p0: "0",
    pmin: "0",
    pmax: "0",
  })

  // Prueba configuration
  const [tiempoPrueba, setTiempoPrueba] = useState("30")
  const [tipoPrueba, setTipoPrueba] = useState("cajon")

  // Session data
  const [sessionActive, setSessionActive] = useState(false)
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0)
  const [alcancePico, setAlcancePico] = useState("0")
  const [extensionIzqPico, setExtensionIzqPico] = useState("0")
  const [extensionDerPico, setExtensionDerPico] = useState("0")

  // Real-time graph data
  const [graphData, setGraphData] = useState([])

  const [loadingAlcance, setLoadingAlcance] = useState(false)
  const [loadingCalibrar, setLoadingCalibrar] = useState(false)
  const [loadingIniciar, setLoadingIniciar] = useState(false)

  const [messages, setMessages] = useState([])

  const waitingForCommandRef = useRef(null)
  const commandTimeoutRef = useRef(null)
  const sessionTimerRef = useRef(null)
  const sessionStartTimeRef = useRef(null)

  useEffect(() => {
    console.log("[v0] Alcance - Connecting to backend:", BACKEND_URL)
    cargarCuentas()
    loadPusher()

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
      }
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current)
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
          addMessage("SISTEMA", "No se encontraron jugadores disponibles", "warning")
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
      console.error("[v0] Error loading Pusher:", error)
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

    console.log("[v0] Pusher instance created")

    pusher.connection.bind("connecting", () => {
      console.log("[v0] Pusher connecting...")
      setPusherStatus("Conectando...")
    })

    pusher.connection.bind("connected", () => {
      console.log("[v0] Pusher connected successfully!")
      console.log("[v0] Socket ID:", pusher.connection.socket_id)
      setPusherStatus("Conectado")
      setPusherConnected(true)

      subscribeToESP6(pusher)
    })

    pusher.connection.bind("disconnected", () => {
      console.log("[v0] Pusher disconnected")
      setPusherStatus("Desconectado")
      setPusherConnected(false)
    })

    pusher.connection.bind("failed", () => {
      console.log("[v0] Pusher connection failed")
      setPusherStatus("Error de conexión")
      setPusherConnected(false)
    })

    pusher.connection.bind("error", (error) => {
      console.log("[v0] Pusher connection error:", error)
      setPusherStatus("Error: " + error.message)
      setPusherConnected(false)
    })
  }

  const subscribeToESP6 = (pusher) => {
    const channelName = "private-device-ESP-6"
    console.log("[v0] Subscribing to channel:", channelName)

    const channel = pusher.subscribe(channelName)

    channel.bind("pusher:subscription_succeeded", () => {
      console.log("[v0] Successfully subscribed to", channelName)
      setEsp6Connected(true)
      setEsp6Status("Conectado")
      addMessage("ESP-6", "Conectado exitosamente", "success")
    })

    channel.bind("pusher:subscription_error", (error) => {
      console.log("[v0] Subscription error for", channelName, ":", error)
      setEsp6Connected(false)
      setEsp6Status("Error de conexión")
      addMessage("ESP-6", "Error de conexión", "error")
    })

    channel.bind("client-response", (data) => {
      console.log("[v0] Response received from ESP-6:", data)

      const responseMessage = data.message || ""
      const currentCommand = waitingForCommandRef.current

      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current)
        commandTimeoutRef.current = null
      }

      if (currentCommand === "A") {
        // Parse alcance response: "alcance:X"
        try {
          const alcance = responseMessage.split(":")[1] || "0"
          setAlcanceRealizado(alcance)
          setLoadingAlcance(false)
          addMessage("ESP-6", `Alcance calculado: ${alcance}`, "success")
        } catch (error) {
          console.error("[v0] Error parsing alcance data:", error)
          addMessage("ESP-6", `Error parseando alcance: ${responseMessage}`, "error")
          setLoadingAlcance(false)
        }
      } else if (currentCommand === "C") {
        // Parse calibration response: "p0:X,pmin:Y,pmax:Z"
        try {
          const parts = responseMessage.split(",")
          const p0 = parts[0]?.split(":")[1] || "0"
          const pmin = parts[1]?.split(":")[1] || "0"
          const pmax = parts[2]?.split(":")[1] || "0"

          setCalibracionData({ p0, pmin, pmax })
          setLoadingCalibrar(false)
          addMessage("ESP-6", `Calibración: p0=${p0}, pmin=${pmin}, pmax=${pmax}`, "success")
        } catch (error) {
          console.error("[v0] Error parsing calibration data:", error)
          addMessage("ESP-6", `Error parseando calibración: ${responseMessage}`, "error")
          setLoadingCalibrar(false)
        }
      }

      waitingForCommandRef.current = null
    })

    // Real-time sensor data during session
    channel.bind("client-sensor-data", (data) => {
      console.log("[v0] Sensor data received:", data)

      if (sessionActive) {
        const { alcance, extensionIzq, extensionDer, timestamp } = data

        // Add to graph
        const elapsed = (Date.now() - sessionStartTimeRef.current) / 1000
        setGraphData((prev) => [
          ...prev,
          {
            tiempo: elapsed.toFixed(1),
            alcance: Number.parseFloat(alcance) || 0,
          },
        ])

        // Update peak values
        const alcanceNum = Number.parseFloat(alcance) || 0
        const extIzqNum = Number.parseFloat(extensionIzq) || 0
        const extDerNum = Number.parseFloat(extensionDer) || 0

        setAlcancePico((prev) => {
          const prevNum = Number.parseFloat(prev) || 0
          return alcanceNum > prevNum ? alcance : prev
        })

        setExtensionIzqPico((prev) => {
          const prevNum = Number.parseFloat(prev) || 0
          return extIzqNum > prevNum ? extensionIzq : prev
        })

        setExtensionDerPico((prev) => {
          const prevNum = Number.parseFloat(prev) || 0
          return extDerNum > prevNum ? extensionDer : prev
        })
      }
    })

    channel.bind("client-heartbeat", (data) => {
      console.log("[v0] Heartbeat received from ESP-6:", data)
      setEsp6Connected(true)
      addMessage("ESP-6", "Heartbeat recibido", "info")
    })

    channel.bind("client-status", (data) => {
      console.log("[v0] Status update from ESP-6:", data)
      addMessage("ESP-6", JSON.stringify(data), "info")

      if (typeof data === "object" && data.status === "connected") {
        setEsp6Connected(true)
        setEsp6Status("Conectado")
      }
    })

    channel.bind_global((eventName, data) => {
      if (eventName.startsWith("client-")) {
        console.log("[v0] Global event received:", eventName, "data:", data)
        addMessage("ESP-6", `${eventName}: ${JSON.stringify(data)}`, "info")
      }
    })
  }

  const addMessage = (device, message, status) => {
    const newMessage = {
      device: device,
      message: message,
      timestamp: new Date().toLocaleTimeString(),
      status: status,
    }
    setMessages((prev) => [...prev.slice(-19), newMessage])
  }

  const sendCommandToESP6 = async (command, params = {}) => {
    if (!cuentaSeleccionada) {
      addMessage("SISTEMA", "Debe seleccionar un jugador primero", "error")
      return
    }

    if (waitingForCommandRef.current && command !== "S") {
      addMessage("SISTEMA", "Esperando respuesta del comando anterior", "warning")
      return
    }

    try {
      console.log(`[v0] Sending command "${command}" to ESP-6 with params:`, params)

      if (command === "A") setLoadingAlcance(true)
      else if (command === "C") setLoadingCalibrar(true)
      else if (command === "S") setLoadingIniciar(true)

      if (command !== "S") {
        waitingForCommandRef.current = command
      }

      const deviceId = "ESP-6"
      const response = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: deviceId,
          command: command,
          params: params,
          channel: `private-device-${deviceId}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al enviar comando")
      }

      console.log(`[v0] Command sent to ESP-6:`, data)
      addMessage("ESP-6", `Comando enviado: ${command}`, "info")

      // For command S, start the session timer
      if (command === "S") {
        startSession(params.tiempo)
      } else {
        // For other commands, set timeout
        commandTimeoutRef.current = setTimeout(() => {
          console.log(`[v0] Timeout waiting for response to command: ${command}`)
          addMessage("ESP-6", `Timeout - sin respuesta para comando: ${command}`, "warning")

          if (command === "A") setLoadingAlcance(false)
          else if (command === "C") setLoadingCalibrar(false)

          waitingForCommandRef.current = null
        }, 30000)
      }
    } catch (error) {
      console.error(`[v0] Error sending command to ESP-6:`, error)
      addMessage("ESP-6", `Error enviando comando: ${error.message}`, "error")

      if (command === "A") setLoadingAlcance(false)
      else if (command === "C") setLoadingCalibrar(false)
      else if (command === "S") setLoadingIniciar(false)

      waitingForCommandRef.current = null
    }
  }

  const startSession = (duracion) => {
    setSessionActive(true)
    setTiempoTranscurrido(0)
    setGraphData([])
    setAlcancePico("0")
    setExtensionIzqPico("0")
    setExtensionDerPico("0")
    sessionStartTimeRef.current = Date.now()

    sessionTimerRef.current = setInterval(() => {
      setTiempoTranscurrido((prev) => {
        const newTime = prev + 0.1
        if (newTime >= duracion) {
          endSession()
          return duracion
        }
        return newTime
      })
    }, 100)
  }

  const endSession = () => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current)
      sessionTimerRef.current = null
    }
    setSessionActive(false)
    setLoadingIniciar(false)
    addMessage("SISTEMA", "Sesión finalizada", "success")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 bg-clip-text text-transparent mb-2">
            Prueba de Alcance
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-blue-900 to-blue-800 mx-auto rounded-full" />
        </div>

        {/* Top buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <Label htmlFor="jugador" className="mb-2 block">
                Seleccionar Jugador
              </Label>
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
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-4 flex items-end">
              <Button
                onClick={() => {
                  if (!peso || !altura) {
                    addMessage("SISTEMA", "Debe ingresar peso y altura", "error")
                    return
                  }
                  sendCommandToESP6("A", { peso: Number.parseFloat(peso), altura: Number.parseFloat(altura) })
                }}
                disabled={!cuentaSeleccionada || !esp6Connected || loadingAlcance || !peso || !altura}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                {loadingAlcance ? "Calculando..." : "Iniciar Alcance"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-4 flex items-end">
              <Button
                onClick={() => sendCommandToESP6("C")}
                disabled={!cuentaSeleccionada || !esp6Connected || loadingCalibrar}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {loadingCalibrar ? "Calibrando..." : "Iniciar Calibración"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Player info and alcance data */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player info */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Datos del Jugador
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jugadorSeleccionado && jugadorSeleccionado.jugador ? (
                <div className="space-y-3">
                  <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-3">
                    <p className="text-sm font-medium text-slate-600">Nombre</p>
                    <p className="text-lg font-bold text-slate-800">
                      {jugadorSeleccionado.jugador.nombres} {jugadorSeleccionado.jugador.apellidos}
                    </p>
                  </div>

                  {jugadorSeleccionado.jugador.fecha_nacimiento && (
                    <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-600">Edad</p>
                          <p className="text-base text-slate-800">
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
                    <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-slate-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-600">Carrera</p>
                          <p className="text-base text-slate-800">{jugadorSeleccionado.jugador.carrera}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-600">ESP-6</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${esp6Connected ? "bg-green-500" : "bg-red-500"}`} />
                          <p className="text-base text-slate-800">{esp6Status || "Desconectado"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Seleccione un jugador</p>
              )}
            </CardContent>
          </Card>

          {/* Alcance actual */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">Datos del Alcance Actual (si tiene registrado)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 text-center">
                <p className="text-sm font-medium text-blue-600 mb-2">Alcance Registrado</p>
                <p className="text-4xl font-bold text-blue-800">{alcanceActual}</p>
                <p className="text-sm text-blue-600 mt-1">cm</p>
              </div>
            </CardContent>
          </Card>

          {/* Alcance realizado */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">Datos del Alcance Realizado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="peso" className="text-xs">
                      Peso (kg)
                    </Label>
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
                    <Label htmlFor="altura" className="text-xs">
                      Altura (cm)
                    </Label>
                    <Input
                      id="altura"
                      type="number"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      placeholder="180"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-green-600 mb-1">Alcance Calculado</p>
                  <p className="text-3xl font-bold text-green-800">{alcanceRealizado}</p>
                  <p className="text-sm text-green-600 mt-1">cm</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calibration and test data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Calibración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-slate-600 mb-1">Punto 0</p>
                  <p className="text-2xl font-bold text-slate-800">{calibracionData.p0}</p>
                </div>
                <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-slate-600 mb-1">Punto Min</p>
                  <p className="text-2xl font-bold text-slate-800">{calibracionData.pmin}</p>
                </div>
                <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-slate-600 mb-1">Punto Max</p>
                  <p className="text-2xl font-bold text-slate-800">{calibracionData.pmax}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Datos de la Prueba</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-orange-600 mb-1">Tiempo (cronómetro)</p>
                  <p className="text-2xl font-bold text-orange-800">{tiempoTranscurrido.toFixed(1)}s</p>
                </div>
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-purple-600 mb-1">Alcance Pico</p>
                  <p className="text-2xl font-bold text-purple-800">{alcancePico}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration and Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Configuración de la Prueba</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tiempo-prueba">Tiempo del ejercicio (segundos)</Label>
                  <Input
                    id="tiempo-prueba"
                    type="number"
                    min="10"
                    max="300"
                    value={tiempoPrueba}
                    onChange={(e) => setTiempoPrueba(e.target.value)}
                    placeholder="30"
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Prueba</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={tipoPrueba === "cajon" ? "default" : "outline"}
                      onClick={() => setTipoPrueba("cajon")}
                      className="w-full"
                    >
                      Cajón
                    </Button>
                    <Button
                      variant={tipoPrueba === "vallas" ? "default" : "outline"}
                      onClick={() => setTipoPrueba("vallas")}
                      className="w-full"
                    >
                      Vallas
                    </Button>
                    <Button
                      variant={tipoPrueba === "salto-simple" ? "default" : "outline"}
                      onClick={() => setTipoPrueba("salto-simple")}
                      className="w-full"
                    >
                      Salto Simple
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    sendCommandToESP6("S", {
                      tiempo: Number.parseInt(tiempoPrueba),
                      tipo: tipoPrueba,
                    })
                  }
                  disabled={!cuentaSeleccionada || !esp6Connected || loadingIniciar || sessionActive || !tiempoPrueba}
                  className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {loadingIniciar || sessionActive ? "Sesión en Curso..." : "Empezar Prueba"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Graph */}
          <Card className="shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Gráfica en Tiempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {graphData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tiempo" label={{ value: "Tiempo (s)", position: "insideBottom", offset: -5 }} />
                      <YAxis label={{ value: "Alcance", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="alcance" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p>Inicie una prueba para ver la gráfica en tiempo real</p>
                  </div>
                )}
              </div>

              {/* Peak values */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-center">
                  <p className="text-xs font-medium text-blue-600 mb-1">Ext. Izq. Pico</p>
                  <p className="text-xl font-bold text-blue-800">{extensionIzqPico}</p>
                </div>
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-center">
                  <p className="text-xs font-medium text-blue-600 mb-1">Ext. Der. Pico</p>
                  <p className="text-xl font-bold text-blue-800">{extensionDerPico}</p>
                </div>
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-center">
                  <p className="text-xs font-medium text-blue-600 mb-1">Alcance Máximo</p>
                  <p className="text-xl font-bold text-blue-800">{alcancePico}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
