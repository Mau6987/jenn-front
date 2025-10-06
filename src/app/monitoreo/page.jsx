"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Activity, Lightbulb, Volume2, Wifi, TestTube, Zap, Settings, Power, PowerOff } from "lucide-react"

const BACKEND_URL = "https://voley-backend-nhyl.onrender.com"

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

        // Handle connection test responses
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

        // Handle sensor test responses
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
          // Reset state after 3 seconds
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

        addMessage(`ESP-${espId}`, "response", data.message, "info")
      })

      channel.bind("client-status", (data) => {
        addMessage(`ESP-${i}`, "status", data, "info")
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
    setEspResponses((prev) => [...prev.slice(-9), message])
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
      // For all ESPs - Simplified to only send LED_ON or LED_OFF directly
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
    // Set testing state
    setSensorTestStates((prev) => ({ ...prev, [espId]: "testing" }))

    // Set timeout for sensor test
    const timeoutId = setTimeout(() => {
      setSensorTestStates((prev) => ({ ...prev, [espId]: "failed" }))
      addMessage(`ESP-${espId}`, "error", "Timeout - Sin respuesta del sensor magnético", "error")
    }, 10000) // 10 second timeout to match Arduino

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
      }, 5000) // 5 second timeout

      setConnectionTestTimeouts((prev) => ({ ...prev, [espId]: timeoutId }))
      await sendCommandToESP(espId, command)
    } else {
      for (let i = 1; i <= 5; i++) {
        setMicroControllers((prev) => prev.map((mc) => (mc.id === i ? { ...mc, connectionStatus: "testing" } : mc)))

        const timeoutId = setTimeout(() => {
          setMicroControllers((prev) => prev.map((mc) => (mc.id === i ? { ...mc, connectionStatus: "failed" } : mc)))
          addMessage(`ESP-${i}`, "error", "Timeout - Sin respuesta al comando STATE", "error")
        }, 5000)
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
        return { color: "bg-green-500", text: "En Línea" }
      case "testing":
        return { color: "bg-yellow-500", text: "Probando..." }
      case "failed":
        return { color: "bg-red-500", text: "Sin Respuesta" }
      default:
        return { color: "bg-gray-500", text: "Desconocido" }
    }
  }

  const getSensorTestStatusDisplay = (espId) => {
    const status = sensorTestStates[espId] || "idle"
    switch (status) {
      case "testing":
        return { color: "bg-yellow-500", text: "Probando..." }
      case "success":
        return { color: "bg-green-500", text: "OK" }
      case "failed":
        return { color: "bg-red-500", text: "Error" }
      default:
        return { color: "bg-gray-500", text: "Listo" }
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Monitoreo y Control de Componentes ESP32
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="leds" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="leds" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                ANILLOS LED
              </TabsTrigger>
              <TabsTrigger value="sensors" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                SENSORES
              </TabsTrigger>
              <TabsTrigger value="buzzers" className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                BUZZERS
              </TabsTrigger>
              <TabsTrigger value="connection" className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                CONEXIÓN
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leds" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Control Individual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    {microControllers.map((mc) => (
                      <div key={mc.id} className="text-center">
                        <Button
                          variant={mc.ledOn ? "default" : "outline"}
                          size="lg"
                          className="w-full h-16 flex flex-col items-center justify-center"
                          onClick={() => toggleLEDRing(mc.id)}
                        >
                          <Lightbulb className={`h-6 w-6 ${mc.ledOn ? "text-yellow-400" : ""}`} />
                          <span className="text-xs mt-1">{mc.label}</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="destructive" onClick={() => toggleLEDRing()} className="flex items-center gap-2">
                      <PowerOff className="h-4 w-4" />
                      Apagar Todos
                    </Button>
                    <Button variant="default" onClick={() => toggleLEDRing()} className="flex items-center gap-2">
                      <Power className="h-4 w-4" />
                      Encender Todos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sensors" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Sensores Magnéticos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    {microControllers.map((mc) => {
                      const statusDisplay = getSensorTestStatusDisplay(mc.id)
                      return (
                        <div key={mc.id} className="text-center">
                          <Button
                            variant="outline"
                            size="lg"
                            className="w-full h-16 flex flex-col items-center justify-center bg-transparent"
                            onClick={() => testMagneticSensor(mc.id)}
                            disabled={sensorTestStates[mc.id] === "testing"}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`} />
                              <TestTube className="h-6 w-6" />
                            </div>
                            <span className="text-xs mt-1">{mc.label}</span>
                            <span className="text-xs text-muted-foreground">{statusDisplay.text}</span>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                  <Button variant="default" onClick={testAllSensors} className="w-full flex items-center gap-2">
                    <TestTube className="h-4 w-4" />
                    Probar Todos los Sensores
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="buzzers" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Control Buzzers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    {microControllers.map((mc) => (
                      <div key={mc.id} className="text-center">
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full h-16 flex flex-col items-center justify-center bg-transparent"
                          onClick={() => toggleBuzzer(mc.id)}
                        >
                          <Volume2 className="h-6 w-6" />
                          <span className="text-xs mt-1">{mc.label}</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="default" onClick={() => toggleBuzzer()} className="w-full flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Probar Todos los Buzzers (50ms)
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="connection" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test de Conexión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={() => testConnection()} variant="outline" className="w-full">
                    <Wifi className="h-4 w-4 mr-2" />
                    Probar Conexión de Todos
                  </Button>
                  <div className="grid grid-cols-5 gap-2">
                    {microControllers.map((mc) => {
                      const statusDisplay = getConnectionStatusDisplay(mc.connectionStatus)
                      return (
                        <Button
                          key={mc.id}
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection(mc.id)}
                          className="flex flex-col items-center gap-1 h-16"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`} />
                            <span className="text-xs">{mc.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{statusDisplay.text}</span>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Comando Personalizado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="custom-command">Comando</Label>
            <Input
              id="custom-command"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              placeholder="Ej: RESET, INFO, DELAY_1000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => sendCustomCommand()} disabled={!customCommand.trim()} className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              Enviar a Todos
            </Button>
            <Button variant="outline" onClick={() => setCustomCommand("")} className="w-full">
              Limpiar
            </Button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {microControllers.map((mc) => (
              <Button
                key={mc.id}
                variant="outline"
                size="sm"
                onClick={() => sendCustomCommand(mc.id)}
                disabled={!customCommand.trim()}
              >
                {mc.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitor de Comunicación
            <Badge variant={pusherConnected ? "default" : "destructive"}>{pusherStatus}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto">
            {espResponses.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                {pusherConnected ? "Esperando mensajes del ESP32..." : "Conectando a Pusher..."}
              </div>
            ) : (
              <div className="space-y-1">
                {espResponses.map((response, index) => (
                  <div key={index} className="text-sm font-mono">
                    <span className="text-green-400">[{new Date(response.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-blue-400 ml-2">{response.device}:</span>
                    <span className="text-white ml-2">{response.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
