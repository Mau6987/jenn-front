"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Label } from "../../components/ui/label"
import { Input } from "../../components/ui/input"
import { Activity, User, Trophy, Calendar, GraduationCap, Zap, Timer } from "lucide-react"

const BACKEND_URL = "https://voley-backend-nhyl.onrender.com"

export default function PliometriaPage() {
  const [cuentas, setCuentas] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState("")
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([])

  const [pusherConnected, setPusherConnected] = useState(false)
  const [pusherStatus, setPusherStatus] = useState("Desconectado")
  const [esp6Connected, setEsp6Connected] = useState(false)
  const [esp6Status, setEsp6Status] = useState("")

  const [calibracionData, setCalibracionData] = useState({
    punto0: "0",
    minimo: "0",
    maximo: "0",
  })
  const [sessionData, setSessionData] = useState({
    altura: "0",
    saltosValidos: "0",
  })
  const [tiempoSesion, setTiempoSesion] = useState("30")

  const [loadingCalibrar, setLoadingCalibrar] = useState(false)
  const [loadingIniciar, setLoadingIniciar] = useState(false)

  const [messages, setMessages] = useState([])

  const waitingForCommandRef = useRef(null)
  const commandTimeoutRef = useRef(null)

  useEffect(() => {
    console.log("[v0] Pliometría - Connecting to backend:", BACKEND_URL)
    cargarCuentas()
    loadPusher()
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

      if (currentCommand === "i") {
        // Parse calibration response: "punto0:X,min:Y,max:Z"
        try {
          const parts = responseMessage.split(",")
          const punto0 = parts[0]?.split(":")[1] || "0"
          const minimo = parts[1]?.split(":")[1] || "0"
          const maximo = parts[2]?.split(":")[1] || "0"

          setCalibracionData({ punto0, minimo, maximo })
          setLoadingCalibrar(false)
          addMessage("ESP-6", `Calibración: Punto0=${punto0}, Min=${minimo}, Max=${maximo}`, "success")
        } catch (error) {
          console.error("[v0] Error parsing calibration data:", error)
          addMessage("ESP-6", `Error parseando calibración: ${responseMessage}`, "error")
          setLoadingCalibrar(false)
        }
      } else if (currentCommand === "s") {
        // Parse session response: "altura:X,saltos:Y"
        try {
          const parts = responseMessage.split(",")
          const altura = parts[0]?.split(":")[1] || "0"
          const saltosValidos = parts[1]?.split(":")[1] || "0"

          setSessionData({ altura, saltosValidos })
          setLoadingIniciar(false)
          addMessage("ESP-6", `Sesión: Altura=${altura}cm, Saltos válidos=${saltosValidos}`, "success")
        } catch (error) {
          console.error("[v0] Error parsing session data:", error)
          addMessage("ESP-6", `Error parseando sesión: ${responseMessage}`, "error")
          setLoadingIniciar(false)
        }
      }

      waitingForCommandRef.current = null
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

    if (waitingForCommandRef.current) {
      addMessage("SISTEMA", "Esperando respuesta del comando anterior", "warning")
      return
    }

    try {
      console.log(`[v0] Sending command "${command}" to ESP-6 with params:`, params)

      if (command === "i") setLoadingCalibrar(true)
      else if (command === "s") setLoadingIniciar(true)

      waitingForCommandRef.current = command

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

      commandTimeoutRef.current = setTimeout(() => {
        console.log(`[v0] Timeout waiting for response to command: ${command}`)
        addMessage("ESP-6", `Timeout - sin respuesta para comando: ${command}`, "warning")

        if (command === "i") setLoadingCalibrar(false)
        else if (command === "s") setLoadingIniciar(false)

        waitingForCommandRef.current = null
      }, 30000) // 30 seconds timeout for calibration/session
    } catch (error) {
      console.error(`[v0] Error sending command to ESP-6:`, error)
      addMessage("ESP-6", `Error enviando comando: ${error.message}`, "error")

      if (command === "i") setLoadingCalibrar(false)
      else if (command === "s") setLoadingIniciar(false)

      waitingForCommandRef.current = null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-900 via-red-800 to-red-900 bg-clip-text text-transparent mb-2">
            Pliometría
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-red-900 to-red-800 mx-auto rounded-full" />
        </div>

        {jugadorSeleccionado && jugadorSeleccionado.jugador && (
          <Card className="rounded-xl shadow-lg border border-slate-200/60 overflow-hidden">
            <div className="bg-gradient-to-r from-red-900 to-red-800 px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {jugadorSeleccionado.jugador.nombres} {jugadorSeleccionado.jugador.apellidos}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-3 w-3 text-red-100" />
                    <span className="text-red-100 text-xs font-medium">Jugador</span>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1">
                    Información Personal
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
                    Estado de Conexión
                  </h3>

                  <div className="space-y-2">
                    <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200/50">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800">ESP-6</p>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${esp6Connected ? "bg-green-500" : "bg-red-500"}`} />
                            <p className="text-xs text-gray-700">{esp6Status || "Desconectado"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Seleccionar Jugador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
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
              <div className="text-sm text-gray-500 mt-1">{jugadoresDisponibles.length} jugador(es) disponible(s)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Calibración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={() => sendCommandToESP6("i")}
                disabled={!cuentaSeleccionada || !esp6Connected || loadingCalibrar}
                className="w-full h-16 text-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {loadingCalibrar ? "Calibrando..." : "Calibrar"}
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-600 mb-1">Punto 0</p>
                  <p className="text-2xl font-bold text-slate-800">{calibracionData.punto0}</p>
                </div>
                <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-600 mb-1">Mínimo</p>
                  <p className="text-2xl font-bold text-slate-800">{calibracionData.minimo}</p>
                </div>
                <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-600 mb-1">Máximo</p>
                  <p className="text-2xl font-bold text-slate-800">{calibracionData.maximo}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* </CHANGE> */}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Sesión de Saltos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="max-w-md">
                <Label htmlFor="tiempo">Tiempo de sesión (segundos)</Label>
                <Input
                  id="tiempo"
                  type="number"
                  min="10"
                  max="300"
                  value={tiempoSesion}
                  onChange={(e) => setTiempoSesion(e.target.value)}
                  placeholder="30"
                  className="mt-1"
                />
              </div>

              <Button
                onClick={() => sendCommandToESP6("s", { tiempo: Number.parseInt(tiempoSesion) })}
                disabled={!cuentaSeleccionada || !esp6Connected || loadingIniciar || !tiempoSesion}
                className="w-full h-16 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                {loadingIniciar ? "En sesión..." : "Iniciar Sesión"}
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-6">
                  <p className="text-sm font-medium text-slate-600 mb-1">Altura Promedio (cm)</p>
                  <p className="text-3xl font-bold text-slate-800">{sessionData.altura}</p>
                </div>
                <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-6">
                  <p className="text-sm font-medium text-slate-600 mb-1">Saltos Válidos</p>
                  <p className="text-3xl font-bold text-slate-800">{sessionData.saltosValidos}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* </CHANGE> */}

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
