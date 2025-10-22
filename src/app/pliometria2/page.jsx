"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Label } from "../../components/ui/label"
import { Input } from "../../components/ui/input"
import { Activity, User, Zap, TrendingUp, Timer, Gauge, Rocket } from "lucide-react"

const BACKEND_URL = "https://voley-backend-nhyl.onrender.com"

export default function SaltoVerticalPage() {
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

  const [loadingA, setLoadingA] = useState(false)
  const [loadingD, setLoadingD] = useState(false)
  const [loadingC, setLoadingC] = useState(false)
  const [loadingS, setLoadingS] = useState(false)

  const [messages, setMessages] = useState([])
  const [estadoActual, setEstadoActual] = useState("menu")

  const waitingForCommandRef = useRef(null)
  const commandTimeoutRef = useRef(null)

  useEffect(() => {
    console.log("[v0] Salto Vertical - Connecting to backend:", BACKEND_URL)
    cargarCuentas()
    loadPusher()

    return () => {
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    console.log("[v0] Estado actual cambió a:", estadoActual)
  }, [estadoActual])

  const cargarCuentas = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/cuentas`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Accounts loaded:", data)

      if (data.success) {
        setCuentas(data.data)
        const jugadores = data.data.filter((cuenta) => cuenta.rol === "jugador")
        setJugadoresDisponibles(jugadores)
      }
    } catch (error) {
      console.error("[v0] Error loading accounts:", error)
      setPusherStatus(`Error cargando cuentas: ${error.message}`)
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

    pusher.connection.bind("connected", () => {
      console.log("[v0] Pusher connected!")
      setPusherStatus("Conectado")
      setPusherConnected(true)
      subscribeToESP(pusher)
    })

    pusher.connection.bind("disconnected", () => {
      setPusherStatus("Desconectado")
      setPusherConnected(false)
    })
  }

  const subscribeToESP = (pusher) => {
    const channelName = "private-device-ESP-6"
    console.log("[v0] Subscribing to channel:", channelName)

    const channel = pusher.subscribe(channelName)

    channel.bind("pusher:subscription_succeeded", () => {
      console.log("[v0] Successfully subscribed to", channelName)
      setEspConnected(true)
      setEspStatus("Conectado")
      addMessage("ESP-6", "Conectado exitosamente", "success")
    })

    channel.bind("pusher:subscription_error", (error) => {
      console.log("[v0] Subscription error:", error)
      setEspConnected(false)
      setEspStatus("Error de conexión")
      addMessage("ESP-6", "Error de conexión", "error")
    })

    channel.bind("client-response", (data) => {
      console.log("[v0] ===== CLIENT-RESPONSE RECEIVED =====")
      console.log("[v0] Full data object:", data)
      console.log("[v0] Message:", data.message)
      console.log("[v0] Current waiting command:", waitingForCommandRef.current)
      console.log("[v0] Current estado BEFORE update:", estadoActual)

      const message = data.message || ""

      if (commandTimeoutRef.current) {
        console.log("[v0] Clearing timeout")
        clearTimeout(commandTimeoutRef.current)
        commandTimeoutRef.current = null
      }

      const currentCommand = waitingForCommandRef.current

      if (currentCommand === "A") {
        console.log("[v0] Processing command A response")
        setLoadingA(false)
        setEstadoActual("modo_salto")
        addMessage("ESP-6", message, "success")
      } else if (currentCommand === "D") {
        console.log("[v0] Processing command D response")
        setLoadingD(false)
        setEstadoActual("datos_enviados")
        addMessage("ESP-6", message, "success")
      } else if (currentCommand === "C") {
        console.log("[v0] ⚠️ Processing command C response - CALIBRATION ⚠️")
        console.log("[v0] About to set loadingC to false")
        setLoadingC(false)
        console.log("[v0] About to set estadoActual to 'calibrado'")
        setEstadoActual("calibrado")
        console.log("[v0] Called setEstadoActual('calibrado')")
        addMessage("ESP-6", message, "success")
        setTimeout(() => {
          console.log("[v0] Checking estado after timeout:", estadoActual)
        }, 100)
      } else if (currentCommand === "S") {
        console.log("[v0] Processing command S response")
        setLoadingS(false)
        setEstadoActual("saltando")
        addMessage("ESP-6", message, "info")
      } else {
        console.warn("[v0] ⚠️ Received response but no command was waiting!")
        console.warn("[v0] Current command:", currentCommand)
        console.warn("[v0] Message:", message)
      }

      console.log("[v0] Clearing waitingForCommandRef")
      waitingForCommandRef.current = null
      console.log("[v0] ===== END CLIENT-RESPONSE =====")
    })

    channel.bind("client-jump-results", (data) => {
      console.log("[v0] Jump results received:", data)

      if (data.tiempoVuelo !== undefined) setTiempoVuelo(String(data.tiempoVuelo))
      if (data.velocidad !== undefined) setVelocidad(String(data.velocidad))
      if (data.potencia !== undefined) setPotencia(String(data.potencia))
      if (data.altura !== undefined) setAlturaCalculada(String(data.altura))

      setEstadoActual("completado")
      addMessage("ESP-6", "Salto completado. Resultados recibidos.", "success")
    })

    channel.bind("client-status", (data) => {
      console.log("[v0] Status update (not response):", data)
      addMessage("ESP-6", data.message || JSON.stringify(data), "info")

      if (typeof data === "object" && data.status === "connected") {
        setEspConnected(true)
        setEspStatus("Conectado")
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

  const postCommand = async (command, params = {}) => {
    const deviceId = "ESP-6"
    const payload = {
      deviceId: deviceId,
      command: command,
      channel: `private-device-${deviceId}`,
      ...params,
    }

    console.log("[v0] Sending payload to backend:", JSON.stringify(payload))

    const response = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || "Error al enviar comando")
    }
    return data
  }

  const sendCommandToESP = async (command) => {
    if (!cuentaSeleccionada) {
      addMessage("SISTEMA", "Debe seleccionar un jugador primero", "error")
      return
    }

    if (waitingForCommandRef.current) {
      addMessage("SISTEMA", "Esperando respuesta del comando anterior", "warning")
      return
    }

    try {
      console.log(`[v0] Sending command "${command}"`)

      if (command === "A") setLoadingA(true)
      else if (command === "D") setLoadingD(true)
      else if (command === "C") setLoadingC(true)
      else if (command === "S") setLoadingS(true)

      waitingForCommandRef.current = command
      console.log("[v0] Set waitingForCommandRef to:", command)

      await postCommand(command)

      addMessage("ESP-6", `Comando enviado: ${command}`, "info")

      commandTimeoutRef.current = setTimeout(() => {
        console.log(`[v0] Timeout waiting for response to command: ${command}`)
        addMessage("ESP-6", `Timeout - sin respuesta para comando: ${command}`, "warning")

        if (command === "A") setLoadingA(false)
        else if (command === "D") setLoadingD(false)
        else if (command === "C") setLoadingC(false)
        else if (command === "S") setLoadingS(false)

        waitingForCommandRef.current = null
      }, 30000)
    } catch (error) {
      console.error(`[v0] Error sending command:`, error)
      addMessage("ESP-6", `Error enviando comando: ${error.message}`, "error")

      if (command === "A") setLoadingA(false)
      else if (command === "D") setLoadingD(false)
      else if (command === "C") setLoadingC(false)
      else if (command === "S") setLoadingS(false)

      waitingForCommandRef.current = null
    }
  }

  const enviarDatosJugador = () => {
    if (!peso || !altura) {
      addMessage("SISTEMA", "Debe ingresar peso y altura", "error")
      return
    }

    const pesoNum = Number.parseFloat(peso)
    const alturaNum = Number.parseFloat(altura)

    if (isNaN(pesoNum) || pesoNum <= 0) {
      addMessage("SISTEMA", "Peso inválido", "error")
      return
    }

    if (isNaN(alturaNum) || alturaNum <= 0) {
      addMessage("SISTEMA", "Altura inválida", "error")
      return
    }

    const commandWithData = `D:${pesoNum}:${alturaNum}`
    console.log("[v0] Sending command with encoded data:", commandWithData)

    if (waitingForCommandRef.current) {
      addMessage("SISTEMA", "Esperando respuesta del comando anterior", "warning")
      return
    }

    sendEncodedCommand(commandWithData, "D")
  }

  const sendEncodedCommand = async (fullCommand, baseCommand) => {
    if (!cuentaSeleccionada) {
      addMessage("SISTEMA", "Debe seleccionar un jugador primero", "error")
      return
    }

    try {
      console.log(`[v0] Sending encoded command "${fullCommand}" (tracking as "${baseCommand}")`)

      if (baseCommand === "D") setLoadingD(true)

      waitingForCommandRef.current = baseCommand

      await postCommand(fullCommand)

      addMessage("ESP-6", `Comando enviado: ${fullCommand}`, "info")

      commandTimeoutRef.current = setTimeout(() => {
        console.log(`[v0] Timeout waiting for response to command: ${baseCommand}`)
        addMessage("ESP-6", `Timeout - sin respuesta para comando: ${baseCommand}`, "warning")

        if (baseCommand === "D") setLoadingD(false)

        waitingForCommandRef.current = null
      }, 30000)
    } catch (error) {
      console.error(`[v0] Error sending command:`, error)
      addMessage("ESP-6", `Error enviando comando: ${error.message}`, "error")

      if (baseCommand === "D") setLoadingD(false)

      waitingForCommandRef.current = null
    }
  }

  const iniciarModoSalto = () => {
    sendCommandToESP("A")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Rocket className="h-6 w-6" />
              Sistema de Medición de Salto Vertical - ESP-6
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Player selection and data input */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <p className="text-sm font-medium text-slate-600">ESP-6</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${espConnected ? "bg-green-500" : "bg-red-500"}`} />
                      <p className="text-base text-slate-800">{espStatus || "Desconectado"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-blue-600">Estado Actual</p>
                <p className="text-lg font-bold text-blue-800 capitalize">{estadoActual.replace("_", " ")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Configuración del Salto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={iniciarModoSalto}
                disabled={!cuentaSeleccionada || !espConnected || loadingA || estadoActual !== "menu"}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
              >
                {loadingA ? "Iniciando modo salto..." : "1. Iniciar Modo Salto (A)"}
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
                    disabled={estadoActual === "menu"}
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
                    disabled={estadoActual === "menu"}
                  />
                </div>

                <Button
                  onClick={enviarDatosJugador}
                  disabled={!espConnected || loadingD || estadoActual !== "modo_salto" || !peso || !altura}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {loadingD ? "Enviando datos..." : "2. Enviar Peso y Altura (D)"}
                </Button>
              </div>

              <Button
                onClick={() => sendCommandToESP("C")}
                disabled={!espConnected || loadingC || estadoActual !== "datos_enviados"}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {loadingC ? "Calibrando..." : "3. Calibrar Sensor (C)"}
              </Button>

              <div className="text-xs text-slate-500 text-center">
                Estado: {estadoActual} | ESP: {espConnected ? "✓" : "✗"} | LoadingC: {loadingC ? "✓" : "✗"}
              </div>

              <Button
                onClick={() => sendCommandToESP("S")}
                disabled={!espConnected || loadingS || estadoActual !== "calibrado"}
                className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                {loadingS ? "Esperando salto..." : "4. Iniciar Salto (S)"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
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
