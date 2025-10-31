"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  Activity,
  Lightbulb,
  Volume2,
  Wifi,
  TestTube,
  Zap,
  Settings,
  Power,
  PowerOff,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

export default function ESPMonitoringDashboard() {
  const [microControllers, setMicroControllers] = useState([
    {
      id: 1,
      label: "ESP-1",
      connected: false,
      lastSeen: null,
      ledOn: false,
      buzzerOn: false,
      connectionStatus: "unknown",
    },
    {
      id: 2,
      label: "ESP-2",
      connected: false,
      lastSeen: null,
      ledOn: false,
      buzzerOn: false,
      connectionStatus: "unknown",
    },
    {
      id: 3,
      label: "ESP-3",
      connected: false,
      lastSeen: null,
      ledOn: false,
      buzzerOn: false,
      connectionStatus: "unknown",
    },
    {
      id: 4,
      label: "ESP-4",
      connected: false,
      lastSeen: null,
      ledOn: false,
      buzzerOn: false,
      connectionStatus: "unknown",
    },
    {
      id: 5,
      label: "ESP-5",
      connected: false,
      lastSeen: null,
      ledOn: false,
      buzzerOn: false,
      connectionStatus: "unknown",
    },
  ])

  const [pusherConnected, setPusherConnected] = useState(false)
  const [pusherStatus, setPusherStatus] = useState("Desconectado")
  const [espResponses, setEspResponses] = useState([])
  const [customCommand, setCustomCommand] = useState("")
  const [allLedsOn, setAllLedsOn] = useState(false)
  const [allBuzzersOn, setAllBuzzersOn] = useState(false)
  const [connectionTestTimeouts, setConnectionTestTimeouts] = useState({})
  const [sensorTestTimeouts, setSensorTestTimeouts] = useState({})
  const [sensorTestStates, setSensorTestStates] = useState({})

  useEffect(() => {
    console.log("[v0] Connecting to backend:", BACKEND_URL)
    loadPusher()
  }, [])

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

    pusher.connection.bind("connected", () => {
      console.log("Pusher connected successfully!")
      setPusherStatus("Conectado")
      setPusherConnected(true)
      subscribeToMicrocontrollerChannels(pusher)
    })

    pusher.connection.bind("disconnected", () => {
      setPusherStatus("Desconectado")
      setPusherConnected(false)
    })
  }

  const subscribeToMicrocontrollerChannels = (pusher) => {
    for (let i = 1; i <= 5; i++) {
      const channelName = `private-device-ESP-${i}`
      const channel = pusher.subscribe(channelName)

      channel.bind("pusher:subscription_succeeded", () => {
        console.log(`[v0] Subscribed to channel: ${channelName}`)
      })

      channel.bind("client-response", (data) => {
        const espId = Number.parseInt(channelName.split("-").pop())
        const responseMessage = data.message?.toLowerCase() || ""

        if (
          responseMessage.includes("ok") ||
          responseMessage.includes("vivo") ||
          responseMessage.includes("con_vida")
        ) {
          setMicroControllers((prev) =>
            prev.map((mc) => (mc.id === espId ? { ...mc, connectionStatus: "online", lastSeen: new Date() } : mc)),
          )
          if (connectionTestTimeouts[espId]) {
            clearTimeout(connectionTestTimeouts[espId])
            setConnectionTestTimeouts((prev) => {
              const newTimeouts = { ...prev }
              delete newTimeouts[espId]
              return newTimeouts
            })
          }
        }

        if (responseMessage.includes("sensor_ok")) {
          setSensorTestStates((prev) => ({ ...prev, [espId]: "success" }))
          if (sensorTestTimeouts[espId]) {
            clearTimeout(sensorTestTimeouts[espId])
            setSensorTestTimeouts((prev) => {
              const newTimeouts = { ...prev }
              delete newTimeouts[espId]
              return newTimeouts
            })
          }
          setTimeout(() => {
            setSensorTestStates((prev) => ({ ...prev, [espId]: "idle" }))
          }, 3000)
        } else if (responseMessage.includes("sensor_error")) {
          setSensorTestStates((prev) => ({ ...prev, [espId]: "failed" }))
          if (sensorTestTimeouts[espId]) {
            clearTimeout(sensorTestTimeouts[espId])
            setSensorTestTimeouts((prev) => {
              const newTimeouts = { ...prev }
              delete newTimeouts[espId]
              return newTimeouts
            })
          }
        }

        if (responseMessage.includes("led_on")) {
          setMicroControllers((prev) => prev.map((mc) => (mc.id === espId ? { ...mc, ledOn: true } : mc)))
        } else if (responseMessage.includes("led_off")) {
          setMicroControllers((prev) => prev.map((mc) => (mc.id === espId ? { ...mc, ledOn: false } : mc)))
        }

        if (responseMessage.includes("buzzer")) {
          // Visual feedback for buzzer activation
        }

        addMessage(`ESP-${espId}`, "response", data.message, "success")
      })

      channel.bind("client-status", (data) => {
        const espId = Number.parseInt(channelName.split("-").pop())
        addMessage(`ESP-${espId}`, "status", typeof data === "string" ? data : JSON.stringify(data), "info")
      })

      channel.bind("client-error", (data) => {
        const espId = Number.parseInt(channelName.split("-").pop())
        addMessage(`ESP-${espId}`, "error", data.message || "Error desconocido", "error")
      })
    }
  }

  const addMessage = (device, type, data, status) => {
    const message = {
      device: device,
      message: typeof data === "string" ? data : JSON.stringify(data),
      timestamp: Date.now(),
      type: type,
      status: status,
    }
    setEspResponses((prev) => [...prev.slice(-19), message])
  }

  const sendCommandToESP = async (espId, command) => {
    try {
      const deviceId = `ESP-${espId}`
      const response = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: deviceId,
          command: command?.command || "ON",
          data: command?.data || {},
          channel: `private-device-${deviceId}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al enviar comando")
      }

      addMessage(`ESP-${espId}`, "command", `Comando enviado: ${command?.command}`, "info")
    } catch (error) {
      console.error(`Error sending command to ESP-${espId}:`, error)
      addMessage(`ESP-${espId}`, "error", `Error enviando comando: ${error.message}`, "error")
    }
  }

  const sendCommandToAllESPs = async (command) => {
    for (let i = 1; i <= 5; i++) {
      await sendCommandToESP(i, command)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    addMessage("SISTEMA", "info", `Comando enviado a todos los ESPs: ${command.command}`, "info")
  }

  const toggleLEDRing = async (espId = null) => {
    if (espId) {
      const currentState = microControllers.find((mc) => mc.id === espId)?.ledOn

      const ledCommand = {
        command: currentState ? "LED_OFF" : "LED_ON",
        data: {},
      }
      await sendCommandToESP(espId, ledCommand)
      setMicroControllers((prev) => prev.map((mc) => (mc.id === espId ? { ...mc, ledOn: !mc.ledOn } : mc)))
    } else {
      const ledCommand = {
        command: allLedsOn ? "LED_OFF" : "LED_ON",
        data: {},
      }
      await sendCommandToAllESPs(ledCommand)
      setAllLedsOn(!allLedsOn)
      setMicroControllers((prev) => prev.map((mc) => ({ ...mc, ledOn: !allLedsOn })))
    }
  }

  const toggleBuzzer = async (espId = null) => {
    const command = {
      command: "BUZZER",
      data: {},
    }

    if (espId) {
      await sendCommandToESP(espId, command)
      addMessage(`ESP-${espId}`, "command", "Buzzer activado por 50ms", "info")
    } else {
      await sendCommandToAllESPs(command)
      addMessage("SISTEMA", "info", "Buzzer activado en todos los ESPs por 50ms", "info")
    }
  }

  const testMagneticSensor = async (espId) => {
    setSensorTestStates((prev) => ({ ...prev, [espId]: "testing" }))

    const timeoutId = setTimeout(() => {
      setSensorTestStates((prev) => ({ ...prev, [espId]: "failed" }))
      addMessage(`ESP-${espId}`, "error", "Timeout - Sin respuesta del sensor magnético", "error")
    }, 10000)

    setSensorTestTimeouts((prev) => ({ ...prev, [espId]: timeoutId }))

    const command = { command: "TEST_SENSOR", data: {} }
    await sendCommandToESP(espId, command)
  }

  const testAllSensors = async () => {
    for (let i = 1; i <= 5; i++) {
      setSensorTestStates((prev) => ({ ...prev, [i]: "testing" }))

      const timeoutId = setTimeout(() => {
        setSensorTestStates((prev) => ({ ...prev, [i]: "failed" }))
        addMessage(`ESP-${i}`, "error", "Timeout - Sin respuesta del sensor magnético", "error")
      }, 10000)

      setSensorTestTimeouts((prev) => ({ ...prev, [i]: timeoutId }))
    }

    const command = { command: "TEST_SENSOR", data: {} }
    await sendCommandToAllESPs(command)
  }

  const testConnection = async (espId = null) => {
    const command = { command: "STATE", data: {} }

    if (espId) {
      setMicroControllers((prev) => prev.map((mc) => (mc.id === espId ? { ...mc, connectionStatus: "testing" } : mc)))

      const timeoutId = setTimeout(() => {
        setMicroControllers((prev) => prev.map((mc) => (mc.id === espId ? { ...mc, connectionStatus: "failed" } : mc)))
        addMessage(`ESP-${espId}`, "error", "Timeout - Sin respuesta al comando STATE", "error")
      }, 5000)

      setConnectionTestTimeouts((prev) => ({ ...prev, [espId]: timeoutId }))
      await sendCommandToESP(espId, command)
    } else {
      for (let i = 1; i <= 5; i++) {
        setMicroControllers((prev) => prev.map((mc) => (mc.id === i ? { ...mc, connectionStatus: "testing" } : mc)))

        const timeoutId = setTimeout(() => {
          setMicroControllers((prev) => prev.map((mc) => (mc.id === i ? { ...mc, connectionStatus: "failed" } : mc)))
          addMessage(`ESP-${i}`, "error", "Timeout - Sin respuesta al comando STATE", "error")
        }, 5000)

        setConnectionTestTimeouts((prev) => ({ ...prev, [i]: timeoutId }))
      }
      await sendCommandToAllESPs(command)
    }
  }

  const sendCustomCommand = async (espId = null) => {
    if (!customCommand.trim()) {
      addMessage("SISTEMA", "error", "Debe ingresar un comando personalizado", "error")
      return
    }

    const command = {
      command: "CUSTOM",
      data: { customCommand: customCommand.trim() },
    }

    if (espId) {
      await sendCommandToESP(espId, command)
    } else {
      await sendCommandToAllESPs(command)
    }
  }

  const getConnectionStatusDisplay = (status) => {
    switch (status) {
      case "online":
        return { color: "bg-green-500", text: "En Línea", icon: CheckCircle2 }
      case "testing":
        return { color: "bg-blue-500", text: "Probando...", icon: Loader2 }
      case "failed":
        return { color: "bg-red-500", text: "Sin Respuesta", icon: XCircle }
      default:
        return { color: "bg-gray-400", text: "Desconocido", icon: Activity }
    }
  }

  const getSensorTestStatusDisplay = (espId) => {
    const status = sensorTestStates[espId] || "idle"
    switch (status) {
      case "testing":
        return { color: "bg-blue-500", text: "Probando...", icon: Loader2, animate: true }
      case "success":
        return { color: "bg-green-500", text: "OK", icon: CheckCircle2, animate: false }
      case "failed":
        return { color: "bg-red-500", text: "Error", icon: XCircle, animate: false }
      default:
        return { color: "bg-gray-400", text: "Listo", icon: TestTube, animate: false }
    }
  }

  const getMessageColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600"
      case "error":
        return "text-red-600"
      case "info":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-top duration-700">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-900 via-red-800 to-red-900 bg-clip-text text-transparent">
            Monitoreo
          </h1>
          
        </div>

        <Card className="bg-white rounded-2xl shadow-xl border border-slate-200/60 animate-in fade-in slide-in-from-bottom duration-700">
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-gray-900">
                <div className="p-2 rounded-lg bg-red-900">
                  <Settings className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <span className="uppercase tracking-wide">Control de Componentes</span>
              </CardTitle>
              <Badge
                variant={pusherConnected ? "default" : "destructive"}
                className={`flex items-center gap-2 px-4 py-2 text-sm ${pusherConnected ? "bg-green-600 animate-pulse" : "bg-red-600"}`}
              >
                <div className={`w-2 h-2 rounded-full ${pusherConnected ? "bg-green-200" : "bg-red-200"}`} />
                {pusherStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="leds" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-gray-100 p-2 h-auto">
                <TabsTrigger
                  value="leds"
                  className="flex items-center gap-2 data-[state=active]:bg-red-900 data-[state=active]:text-white transition-all duration-300 py-3"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">ANILLOS LED</span>
                  <span className="sm:hidden">LEDs</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sensors"
                  className="flex items-center gap-2 data-[state=active]:bg-red-900 data-[state=active]:text-white transition-all duration-300 py-3"
                >
                  <TestTube className="h-4 w-4" />
                  <span className="hidden sm:inline">SENSORES</span>
                  <span className="sm:hidden">Sensores</span>
                </TabsTrigger>
                <TabsTrigger
                  value="buzzers"
                  className="flex items-center gap-2 data-[state=active]:bg-red-900 data-[state=active]:text-white transition-all duration-300 py-3"
                >
                  <Volume2 className="h-4 w-4" />
                  <span className="hidden sm:inline">BUZZERS</span>
                  <span className="sm:hidden">Buzzers</span>
                </TabsTrigger>
                <TabsTrigger
                  value="connection"
                  className="flex items-center gap-2 data-[state=active]:bg-red-900 data-[state=active]:text-white transition-all duration-300 py-3"
                >
                  <Wifi className="h-4 w-4" />
                  <span className="hidden sm:inline">CONEXIÓN</span>
                  <span className="sm:hidden">Conexión</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="leds" className="space-y-4 mt-6 animate-in fade-in slide-in-from-right duration-500">
                <Card className="bg-gray-50 rounded-xl border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                      <Lightbulb className="h-5 w-5 text-red-900" />
                      Control Individual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6">
                      {microControllers.map((mc) => (
                        <div key={mc.id} className="text-center group">
                          <Button
                            variant={mc.ledOn ? "default" : "outline"}
                            size="lg"
                            className={`w-full h-24 md:h-28 flex flex-col items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 ${
                              mc.ledOn
                                ? "bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 shadow-lg shadow-yellow-500/50 animate-pulse border-0"
                                : "bg-white hover:bg-gray-50 border-2 border-gray-300"
                            }`}
                            onClick={() => toggleLEDRing(mc.id)}
                          >
                            <Lightbulb
                              className={`h-8 w-8 md:h-10 md:w-10 transition-all duration-300 ${mc.ledOn ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "text-gray-400"}`}
                            />
                            <span className="text-xs md:text-sm font-semibold">{mc.label}</span>
                            <span className="text-xs text-gray-600">{mc.ledOn ? "Encendido" : "Apagado"}</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <Button
                        variant="destructive"
                        onClick={() => toggleLEDRing()}
                        className="flex items-center justify-center gap-2 h-12 bg-red-600 hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
                      >
                        <PowerOff className="h-5 w-5" />
                        Apagar Todos
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => toggleLEDRing()}
                        className="flex items-center justify-center gap-2 h-12 bg-green-600 hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
                      >
                        <Power className="h-5 w-5" />
                        Encender Todos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="sensors"
                className="space-y-4 mt-6 animate-in fade-in slide-in-from-right duration-500"
              >
                <Card className="bg-gray-50 rounded-xl border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                      <TestTube className="h-5 w-5 text-red-900" />
                      Test Sensores Magnéticos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6">
                      {microControllers.map((mc) => {
                        const statusDisplay = getSensorTestStatusDisplay(mc.id)
                        const StatusIcon = statusDisplay.icon
                        return (
                          <div key={mc.id} className="text-center">
                            <Button
                              variant="outline"
                              size="lg"
                              className={`w-full h-24 md:h-28 flex flex-col items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 ${
                                statusDisplay.animate ? "animate-pulse" : ""
                              }`}
                              onClick={() => testMagneticSensor(mc.id)}
                              disabled={sensorTestStates[mc.id] === "testing"}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${statusDisplay.color} ${statusDisplay.animate ? "animate-ping absolute" : ""}`}
                                />
                                <div className={`w-3 h-3 rounded-full ${statusDisplay.color}`} />
                                <StatusIcon
                                  className={`h-6 w-6 md:h-8 md:w-8 text-gray-700 ${statusDisplay.animate ? "animate-spin" : ""}`}
                                />
                              </div>
                              <span className="text-xs md:text-sm font-semibold text-gray-900">{mc.label}</span>
                              <span className="text-xs text-gray-600">{statusDisplay.text}</span>
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                    <Button
                      variant="default"
                      onClick={testAllSensors}
                      className="w-full h-12 flex items-center justify-center gap-2 bg-red-900 hover:bg-red-800 transition-all duration-300 transform hover:scale-105"
                    >
                      <TestTube className="h-5 w-5" />
                      Probar Todos los Sensores
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="buzzers"
                className="space-y-4 mt-6 animate-in fade-in slide-in-from-right duration-500"
              >
                <Card className="bg-gray-50 rounded-xl border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                      <Volume2 className="h-5 w-5 text-red-900" />
                      Control Buzzers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6">
                      {microControllers.map((mc) => (
                        <div key={mc.id} className="text-center">
                          <Button
                            variant="outline"
                            size="lg"
                            className="w-full h-24 md:h-28 flex flex-col items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 active:scale-95"
                            onClick={() => toggleBuzzer(mc.id)}
                          >
                            <Volume2 className="h-8 w-8 md:h-10 md:w-10 text-red-900" />
                            <span className="text-xs md:text-sm font-semibold text-gray-900">{mc.label}</span>
                            <span className="text-xs text-gray-600">Probar</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="default"
                      onClick={() => toggleBuzzer()}
                      className="w-full h-12 flex items-center justify-center gap-2 bg-red-900 hover:bg-red-800 transition-all duration-300 transform hover:scale-105"
                    >
                      <Volume2 className="h-5 w-5" />
                      Probar Todos los Buzzers (50ms)
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="connection"
                className="space-y-4 mt-6 animate-in fade-in slide-in-from-right duration-500"
              >
                <Card className="bg-gray-50 rounded-xl border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                      <Wifi className="h-5 w-5 text-red-900" />
                      Test de Conexión
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => testConnection()}
                      variant="outline"
                      className="w-full h-12 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                    >
                      <Wifi className="h-5 w-5 mr-2" />
                      Probar Conexión de Todos
                    </Button>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                      {microControllers.map((mc) => {
                        const statusDisplay = getConnectionStatusDisplay(mc.connectionStatus)
                        const StatusIcon = statusDisplay.icon
                        return (
                          <Button
                            key={mc.id}
                            variant="outline"
                            size="sm"
                            onClick={() => testConnection(mc.id)}
                            className={`flex flex-col items-center gap-2 h-20 md:h-24 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 ${
                              mc.connectionStatus === "testing" ? "animate-pulse" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${statusDisplay.color} ${mc.connectionStatus === "testing" ? "animate-ping absolute" : ""}`}
                              />
                              <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`} />
                              <StatusIcon
                                className={`h-5 w-5 text-gray-700 ${mc.connectionStatus === "testing" ? "animate-spin" : ""}`}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-900">{mc.label}</span>
                            <span className="text-xs text-gray-600">{statusDisplay.text}</span>
                          </Button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl shadow-xl border border-slate-200/60 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-gray-900">
              <div className="p-2 rounded-lg bg-red-900">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="uppercase tracking-wide">Comando Personalizado</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6">
            <div>
              <Label htmlFor="custom-command" className="text-gray-700 text-sm md:text-base font-semibold">
                Comando
              </Label>
              <Input
                id="custom-command"
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
                placeholder="Ej: RESET, INFO, DELAY_1000"
                className="mt-2 bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-900 focus:border-transparent transition-colors h-12"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <Button
                onClick={() => sendCustomCommand()}
                disabled={!customCommand.trim()}
                className="w-full h-12 bg-red-900 hover:bg-red-800 disabled:opacity-50 transition-all duration-300 transform hover:scale-105"
              >
                <Zap className="h-5 w-5 mr-2" />
                Enviar a Todos
              </Button>
              <Button
                variant="outline"
                onClick={() => setCustomCommand("")}
                className="w-full h-12 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all duration-300"
              >
                Limpiar
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {microControllers.map((mc) => (
                <Button
                  key={mc.id}
                  variant="outline"
                  size="sm"
                  onClick={() => sendCustomCommand(mc.id)}
                  disabled={!customCommand.trim()}
                  className="bg-white border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 h-10"
                >
                  {mc.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-2xl shadow-xl border border-slate-200/60 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-gray-900">
              <div className="p-2 rounded-lg bg-red-900">
                <Activity className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <span className="uppercase tracking-wide">Monitor de Comunicación</span>
              <Badge
                variant={pusherConnected ? "default" : "destructive"}
                className={`ml-auto ${pusherConnected ? "bg-green-600 animate-pulse" : "bg-red-600"}`}
              >
                {pusherStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="bg-gray-50 rounded-lg p-4 h-80 md:h-96 overflow-y-auto border-2 border-gray-200 shadow-inner">
              {espResponses.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                  <Activity
                    className={`h-12 w-12 md:h-16 md:w-16 ${pusherConnected ? "animate-pulse text-green-600" : "text-gray-400"}`}
                  />
                  <p className="text-center text-sm md:text-base">
                    {pusherConnected ? "Esperando mensajes del ESP32..." : "Conectando a Pusher..."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {espResponses.map((response, index) => (
                    <div
                      key={index}
                      className="text-xs md:text-sm font-mono bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 animate-in fade-in slide-in-from-bottom shadow-sm"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex flex-wrap items-start gap-2">
                        <span className="text-blue-600 font-semibold">
                          [{new Date(response.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className="text-red-900 font-semibold">{response.device}:</span>
                        <span className={`flex-1 ${getMessageColor(response.status)} font-medium`}>
                          {response.message}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            response.status === "success"
                              ? "border-green-500 text-green-600 bg-green-50"
                              : response.status === "error"
                                ? "border-red-500 text-red-600 bg-red-50"
                                : "border-blue-500 text-blue-600 bg-blue-50"
                          }`}
                        >
                          {response.type}
                        </Badge>
                      </div>
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
