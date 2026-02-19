"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { LEDStatusIcon } from "../../components/ui/led-status-icon"
import { SensorStatusIcon } from "../../components/ui/sensor-status-icon"
import {
  Activity,
  Lightbulb,
  Volume2,
  Wifi,
  TestTube,
  Settings,
  Power,
  PowerOff,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"

// MISMA LÓGICA / ENDPOINTS
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
  const [allLedsOn, setAllLedsOn] = useState(false)
  const [allBuzzersOn, setAllBuzzersOn] = useState(false)
  const [connectionTestTimeouts, setConnectionTestTimeouts] = useState({})
  const [sensorTestTimeouts, setSensorTestTimeouts] = useState({})
  const [sensorTestStates, setSensorTestStates] = useState({})

  // === THEME: variable de marca (azules/morados oscuros) ===
  const brandStyle = { "--brand": "#1e1b4b" }

  useEffect(() => {
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
        // suscrito
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
              const t = { ...prev }
              delete t[espId]
              return t
            })
          }
        }

        if (responseMessage.includes("sensor_ok")) {
          setSensorTestStates((prev) => ({ ...prev, [espId]: "success" }))
          if (sensorTestTimeouts[espId]) {
            clearTimeout(sensorTestTimeouts[espId])
            setSensorTestTimeouts((prev) => {
              const t = { ...prev }
              delete t[espId]
              return t
            })
          }
          setTimeout(() => setSensorTestStates((prev) => ({ ...prev, [espId]: "idle" })), 3000)
        } else if (responseMessage.includes("sensor_error")) {
          setSensorTestStates((prev) => ({ ...prev, [espId]: "error" }))
          if (sensorTestTimeouts[espId]) {
            clearTimeout(sensorTestTimeouts[espId])
            setSensorTestTimeouts((prev) => {
              const t = { ...prev }
              delete t[espId]
              return t
            })
          }
        }

        if (responseMessage.includes("led_on")) {
          setMicroControllers((prev) => prev.map((mc) => (mc.id === espId ? { ...mc, ledOn: true } : mc)))
        } else if (responseMessage.includes("led_off")) {
          setMicroControllers((prev) => prev.map((mc) => (mc.id === espId ? { ...mc, ledOn: false } : mc)))
        }

        if (responseMessage.includes("buzzer")) {
          // feedback visual opcional
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
      device,
      message: typeof data === "string" ? data : JSON.stringify(data),
      timestamp: Date.now(),
      type,
      status,
    }
    setEspResponses((prev) => [...prev.slice(-19), message])
  }

  const sendCommandToESP = async (espId, command) => {
    try {
      const deviceId = `ESP-${espId}`
      const response = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          command: command?.command || "ON",
          data: command?.data || {},
          channel: `private-device-${deviceId}`,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error al enviar comando")
      addMessage(`ESP-${espId}`, "command", `Comando enviado: ${command?.command}`, "info")
    } catch (error) {
      console.error(`Error sending command to ESP-${espId}:`, error)
      addMessage(`ESP-${espId}`, "error", `Error enviando comando: ${error.message}`, "error")
    }
  }

  const sendCommandToAllESPs = async (command) => {
    for (let i = 1; i <= 5; i++) {
      await sendCommandToESP(i, command)
      await new Promise((r) => setTimeout(r, 200))
    }
    addMessage("SISTEMA", "info", `Comando enviado a todos los ESPs: ${command.command}`, "info")
  }

  const toggleLEDRing = async (espId = null) => {
    if (espId) {
      const currentState = microControllers.find((mc) => mc.id === espId)?.ledOn
      const ledCommand = { command: currentState ? "LED_OFF" : "LED_ON", data: {} }
      await sendCommandToESP(espId, ledCommand)
      setMicroControllers((prev) => prev.map((mc) => (mc.id === espId ? { ...mc, ledOn: !mc.ledOn } : mc)))
    } else {
      const ledCommand = { command: allLedsOn ? "LED_OFF" : "LED_ON", data: {} }
      await sendCommandToAllESPs(ledCommand)
      setAllLedsOn(!allLedsOn)
      setMicroControllers((prev) => prev.map((mc) => ({ ...mc, ledOn: !allLedsOn })))
    }
  }

  const toggleBuzzer = async (espId = null) => {
    const command = { command: "BUZZER", data: {} }
    if (espId) {
      await sendCommandToESP(espId, command)
      addMessage(`ESP-${espId}`, "command", "Buzzer activado por 50ms", "info")
    } else {
      await sendCommandToAllESPs(command)
      addMessage("SISTEMA", "info", "Buzzer activado en todos los ESPs por 50ms", "info")
    }
  }

  const testMagneticSensor = async (espId) => {
    setSensorTestStates((prev) => ({ ...prev, [espId]: "waiting" }))
    const timeoutId = setTimeout(() => {
      setSensorTestStates((prev) => ({ ...prev, [espId]: "error" }))
      addMessage(`ESP-${espId}`, "error", "Timeout - Sin respuesta del sensor magnético", "error")
    }, 10000)
    setSensorTestTimeouts((prev) => ({ ...prev, [espId]: timeoutId }))
    const command = { command: "TEST_SENSOR", data: {} }
    await sendCommandToESP(espId, command)
  }

  const testAllSensors = async () => {
    for (let i = 1; i <= 5; i++) {
      setSensorTestStates((prev) => ({ ...prev, [i]: "waiting" }))
      const timeoutId = setTimeout(() => {
        setSensorTestStates((prev) => ({ ...prev, [i]: "error" }))
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

  const getConnectionStatusDisplay = (status) => {
    switch (status) {
      case "online":
        return { color: "bg-emerald-600", text: "En Línea", icon: CheckCircle2 }
      case "testing":
        return { color: "bg-indigo-700", text: "Probando...", icon: Loader2 }
      case "failed":
        return { color: "bg-rose-600", text: "Sin Respuesta", icon: XCircle }
      default:
        return { color: "bg-zinc-400", text: "Desconocido", icon: Activity }
    }
  }

  const getSensorTestStatusDisplay = (espId) => {
    const status = sensorTestStates[espId] || "idle"
    switch (status) {
      case "waiting":
        return { color: "bg-indigo-700", text: "Probando...", icon: Loader2, animate: true }
      case "success":
        return { color: "bg-emerald-600", text: "OK", icon: CheckCircle2, animate: false }
      case "error":
        return { color: "bg-rose-600", text: "Error", icon: XCircle, animate: false }
      default:
        return { color: "bg-zinc-400", text: "Listo", icon: TestTube, animate: false }
    }
  }

  const getMessageColor = (status) => {
    switch (status) {
      case "success":
        return "text-emerald-700 dark:text-emerald-400"
      case "error":
        return "text-rose-700 dark:text-rose-400"
      case "info":
        return "text-indigo-700 dark:text-indigo-400"
      default:
        return "text-violet-700 dark:text-violet-400"
    }
  }

  return (
    <div
      className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 md:px-6 lg:px-8 pb-10 transition-colors"
      style={brandStyle}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="bg-[color:var(--brand)] text-white rounded-t-2xl px-6 py-4 flex items-center gap-4">
            <div className="p-2 rounded-md bg-white/10">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Panel de Control ESP32</h1>
              <p className="text-white/80 text-sm">LEDs, sensores y buzzers</p>
            </div>
           
          </div>
        </div>

        <Card className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-zinc-900 dark:text-zinc-100">
                <div className="p-2 rounded-md bg-indigo-50 dark:bg-zinc-800 ring-1 ring-indigo-100 dark:ring-zinc-700">
                  <Settings className="h-5 w-5 md:h-6 md:w-6 text-indigo-700 dark:text-indigo-400" />
                </div>
                <span className="tracking-tight">Control de Componentes</span>
              </CardTitle>
            
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="leds" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-zinc-100 dark:bg-zinc-800 p-2 h-auto rounded-lg">
                <TabsTrigger
                  value="leds"
                  className="flex items-center gap-2 data-[state=active]:bg-indigo-900 data-[state=active]:text-white dark:data-[state=active]:bg-violet-200 dark:data-[state=active]:text-zinc-900 transition-colors py-2.5 rounded-md"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">ANILLOS LED</span>
                  <span className="sm:hidden">LEDs</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sensors"
                  className="flex items-center gap-2 data-[state=active]:bg-indigo-900 data-[state=active]:text-white dark:data-[state=active]:bg-violet-200 dark:data-[state=active]:text-zinc-900 transition-colors py-2.5 rounded-md"
                >
                  <TestTube className="h-4 w-4" />
                  <span className="hidden sm:inline">SENSORES</span>
                  <span className="sm:hidden">Sensores</span>
                </TabsTrigger>
                <TabsTrigger
                  value="buzzers"
                  className="flex items-center gap-2 data-[state=active]:bg-indigo-900 data-[state=active]:text-white dark:data-[state=active]:bg-violet-200 dark:data-[state=active]:text-zinc-900 transition-colors py-2.5 rounded-md"
                >
                  <Volume2 className="h-4 w-4" />
                  <span className="hidden sm:inline">BUZZERS</span>
                  <span className="sm:hidden">Buzzers</span>
                </TabsTrigger>
                <TabsTrigger
                  value="connection"
                  className="flex items-center gap-2 data-[state=active]:bg-indigo-900 data-[state=active]:text-white dark:data-[state=active]:bg-violet-200 dark:data-[state=active]:text-zinc-900 transition-colors py-2.5 rounded-md"
                >
                  <Wifi className="h-4 w-4" />
                  <span className="hidden sm:inline">CONEXIÓN</span>
                  <span className="sm:hidden">Conexión</span>
                </TabsTrigger>
              </TabsList>

              {/* LEDs */}
              <TabsContent value="leds" className="space-y-4 mt-6">
                <Card className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl text-zinc-900 dark:text-zinc-100 flex items-center gap-2 tracking-tight">
                      <LEDStatusIcon state="idle" size="lg" />
                      Control Individual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6">
                      {microControllers.map((mc) => (
                        <div key={mc.id} className="text-center">
                          <Button
                            aria-label={`Alternar LED de ${mc.label}`}
                            variant={mc.ledOn ? "default" : "outline"}
                            size="lg"
                            className={`w-full h-24 md:h-28 flex flex-col items-center justify-center gap-2 transition-colors ${
                              mc.ledOn
                                ? "bg-[color:var(--brand)] text-white"
                                : "bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                            }`}
                            onClick={() => toggleLEDRing(mc.id)}
                          >
                            <LEDStatusIcon state={mc.ledOn ? "on" : "idle"} size="lg" />
                            <span className="text-xs md:text-sm font-medium">{mc.label}</span>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">
                              {mc.ledOn ? "Encendido" : "Apagado"}
                            </span>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <Button
                        variant="secondary"
                        onClick={() => toggleLEDRing()}
                        className="flex items-center justify-center gap-2 h-11 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        <PowerOff className="h-5 w-5" />
                        Apagar Todos
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => toggleLEDRing()}
                        className="flex items-center justify-center gap-2 h-11 bg-[color:var(--brand)] hover:brightness-110 text-white"
                      >
                        <Power className="h-5 w-5" />
                        Encender Todos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sensores */}
              <TabsContent value="sensors" className="space-y-4 mt-6">
                <Card className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl text-zinc-900 dark:text-zinc-100 flex items-center gap-2 tracking-tight">
                      <SensorStatusIcon state="idle" size="lg" />
                      Test Sensores Magnéticos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6">
                      {microControllers.map((mc) => {
                        const sensorState = sensorTestStates[mc.id] || "idle"
                        return (
                          <div key={mc.id} className="text-center">
                            <Button
                              aria-label={`Probar sensor magnético de ${mc.label}`}
                              variant="outline"
                              size="lg"
                              className={`w-full h-24 md:h-28 flex flex-col items-center justify-center gap-2 bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${sensorState === "waiting" || sensorState === "error" ? "motion-safe:animate-pulse" : ""}`}
                              onClick={() => testMagneticSensor(mc.id)}
                              disabled={sensorState === "waiting"}
                            >
                              <SensorStatusIcon state={sensorState} size="lg" />
                              <span className="text-xs md:text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {mc.label}
                              </span>
                              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                {sensorState === "waiting"
                                  ? "Probando..."
                                  : sensorState === "success"
                                    ? "OK"
                                    : sensorState === "error"
                                      ? "Error"
                                      : "Listo"}
                              </span>
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                    <Button
                      variant="default"
                      onClick={testAllSensors}
                      className="w-full h-11 flex items-center justify-center gap-2 bg-[color:var(--brand)] hover:brightness-110 text-white"
                    >
                      <TestTube className="h-5 w-5" />
                      Probar Todos los Sensores
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Buzzers */}
              <TabsContent value="buzzers" className="space-y-4 mt-6">
                <Card className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl text-zinc-900 dark:text-zinc-100 flex items-center gap-2 tracking-tight">
                      <Volume2 className="h-5 w-5 text-violet-700 dark:text-violet-300" />
                      Control Buzzers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6">
                      {microControllers.map((mc) => (
                        <div key={mc.id} className="text-center">
                          <Button
                            aria-label={`Probar buzzer de ${mc.label}`}
                            variant="outline"
                            size="lg"
                            className="w-full h-24 md:h-28 flex flex-col items-center justify-center gap-2 bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                            onClick={() => toggleBuzzer(mc.id)}
                          >
                            <Volume2 className="h-7 w-7 md:h-9 md:w-9 text-indigo-800 dark:text-indigo-300" />
                            <span className="text-xs md:text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {mc.label}
                            </span>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">Probar</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="default"
                      onClick={() => toggleBuzzer()}
                      className="w-full h-11 flex items-center justify-center gap-2 bg-[color:var(--brand)] hover:brightness-110 text-white"
                    >
                      <Volume2 className="h-5 w-5" />
                      Probar Todos los Buzzers (50ms)
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Conexión */}
              <TabsContent value="connection" className="space-y-4 mt-6">
                <Card className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl text-zinc-900 dark:text-zinc-100 flex items-center gap-2 tracking-tight">
                      <Wifi className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
                      Test de Conexión
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => testConnection()}
                      variant="outline"
                      className="w-full h-11 bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
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
                            aria-label={`Probar conexión de ${mc.label}`}
                            variant="outline"
                            size="sm"
                            onClick={() => testConnection(mc.id)}
                            className={`flex flex-col items-center gap-2 h-20 md:h-24 bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${mc.connectionStatus === "testing" ? "motion-safe:animate-pulse" : ""}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`} />
                              <StatusIcon
                                className={`h-5 w-5 text-indigo-800 dark:text-indigo-300 ${mc.connectionStatus === "testing" ? "motion-safe:animate-spin" : ""}`}
                              />
                            </div>
                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{mc.label}</span>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">{statusDisplay.text}</span>
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

        {/* Monitor de Comunicación */}
        <Card className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-zinc-900 dark:text-zinc-100">
              <div className="p-2 rounded-md bg-indigo-50 dark:bg-zinc-800 ring-1 ring-indigo-100 dark:ring-zinc-700">
                <Activity className="h-5 w-5 md:h-6 md:w-6 text-indigo-700 dark:text-indigo-400" />
              </div>
              <span className="tracking-tight">Monitor de Comunicación</span>
              
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="bg-zinc-50 dark:bg-zinc-950 rounded-lg p-4 h-80 md:h-96 overflow-y-auto border-2 border-zinc-200 dark:border-zinc-800">
              {espResponses.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400 space-y-4">
                  <Activity
                    className={`h-12 w-12 md:h-16 md:w-16 ${pusherConnected ? "text-emerald-600" : "text-zinc-400 dark:text-zinc-600"}`}
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
                      className="text-xs md:text-sm font-mono bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-start gap-2">
                        <span className="text-indigo-700 dark:text-indigo-400 font-medium">
                          [{new Date(response.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium">{response.device}:</span>
                        <span className={`flex-1 ${getMessageColor(response.status)}`}>{response.message}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs rounded-full ${
                            response.status === "success"
                              ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-500/10"
                              : response.status === "error"
                                ? "border-rose-600 text-rose-700 dark:text-rose-400 dark:border-rose-500 bg-rose-50/60 dark:bg-rose-500/10"
                                : "border-violet-700 text-violet-800 dark:text-violet-400 dark:border-violet-500 bg-violet-50/60 dark:bg-violet-500/10"
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
