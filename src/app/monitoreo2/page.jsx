"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Activity, Wifi, Settings, Power, PowerOff, TrendingUp } from "lucide-react"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

export default function ESP6Monitor() {
  const [pusherConnected, setPusherConnected] = useState(false)
  const [pusherStatus, setPusherStatus] = useState("Desconectado")
  const [espResponses, setEspResponses] = useState([])

  const [streamingStates, setStreamingStates] = useState({
    cell1: false,
    cell2: false,
    mpuX: false,
    mpuY: false,
    mpuZ: false,
  })

  const [sensorData, setSensorData] = useState([])
  const sensorDataRef = useRef([])

  const MAX_CHART_POINTS = 100

  useEffect(() => {
    console.log("[v0] Conectando al backend:", BACKEND_URL)
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
      console.log("Pusher conectado correctamente!")
      setPusherStatus("Conectado")
      setPusherConnected(true)
      subscribeToChannel(pusher)
    })

    pusher.connection.bind("disconnected", () => {
      setPusherStatus("Desconectado")
      setPusherConnected(false)
    })
  }

  const subscribeToChannel = (pusher) => {
    const channelName = "private-device-ESP-6"
    const channel = pusher.subscribe(channelName)

    channel.bind("pusher:subscription_succeeded", () => {
      console.log(`[v0] Suscrito al canal: ${channelName}`)
    })

    channel.bind("client-sensor-data", (data) => {
      console.log("[v0] Datos de sensor recibidos:", data)
      const sensorInfo = data.sensorType
      const value = data.value

      setSensorData((prev) => {
        const newData = [...prev]
        const lastPoint = newData[newData.length - 1] || { timestamp: Date.now() }

        const updatedPoint = {
          ...lastPoint,
          timestamp: Date.now(),
          [sensorInfo]: value,
        }

        if (newData.length === 0 || updatedPoint.timestamp !== lastPoint.timestamp) {
          newData.push(updatedPoint)
        } else {
          newData[newData.length - 1] = updatedPoint
        }

        if (newData.length > MAX_CHART_POINTS) {
          newData.shift()
        }

        sensorDataRef.current = newData
        return newData
      })

      addMessage("ESP-6", "sensor", `${sensorInfo}: ${value.toFixed(2)}`, "success")
    })

    channel.bind("client-response", (data) => {
      const message = data.message || ""
      const statusType = message.includes("error") ? "error" : message.includes("iniciado") ? "success" : "info"
      addMessage("ESP-6", "response", message, statusType)
    })

    channel.bind("client-status", (data) => {
      addMessage("ESP-6", "status", typeof data === "string" ? data : JSON.stringify(data), "info")
    })

    channel.bind("client-error", (data) => {
      addMessage("ESP-6", "error", data.message || "Error desconocido", "error")
    })
  }

  const addMessage = (device, type, msg, status) => {
    const message = {
      device,
      message: msg,
      timestamp: Date.now(),
      type,
      status,
    }
    setEspResponses((prev) => [...prev.slice(-19), message])
  }

  const sendCommand = async (command) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: "ESP-6",
          command: command,
          data: {},
          channel: "private-device-ESP-6",
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Error enviando comando")
      }

      addMessage("ESP-6", "command", `Comando enviado: ${command}`, "info")
    } catch (error) {
      console.error("Error:", error)
      addMessage("ESP-6", "error", `Error: ${error.message}`, "error")
    }
  }

  const toggleStreamCell1 = async () => {
    const newState = !streamingStates.cell1
    const cmd = newState ? "START_CELL1" : "STOP_CELL1"
    await sendCommand(cmd)
    setStreamingStates((prev) => ({ ...prev, cell1: newState }))
  }

  const toggleStreamCell2 = async () => {
    const newState = !streamingStates.cell2
    const cmd = newState ? "START_CELL2" : "STOP_CELL2"
    await sendCommand(cmd)
    setStreamingStates((prev) => ({ ...prev, cell2: newState }))
  }

  const toggleStreamMpuX = async () => {
    const newState = !streamingStates.mpuX
    const cmd = newState ? "START_MPUX" : "STOP_MPUX"
    await sendCommand(cmd)
    setStreamingStates((prev) => ({ ...prev, mpuX: newState }))
  }

  const toggleStreamMpuY = async () => {
    const newState = !streamingStates.mpuY
    const cmd = newState ? "START_MPUY" : "STOP_MPUY"
    await sendCommand(cmd)
    setStreamingStates((prev) => ({ ...prev, mpuY: newState }))
  }

  const toggleStreamMpuZ = async () => {
    const newState = !streamingStates.mpuZ
    const cmd = newState ? "START_MPUZ" : "STOP_MPUZ"
    await sendCommand(cmd)
    setStreamingStates((prev) => ({ ...prev, mpuZ: newState }))
  }

  const checkConnection = async () => {
    await sendCommand("CHECK")
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
        {/* Header */}
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-top duration-700">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-900 via-red-800 to-red-900 bg-clip-text text-transparent">
            Monitor ESP-6
          </h1>
          <p className="text-gray-600">Control y monitoreo de sensores (Celdas de Carga + MPU6050)</p>
        </div>

        {/* Estado de conexión */}
        <Card className="bg-white rounded-2xl shadow-xl border border-slate-200/60">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Wifi className="h-6 w-6 text-red-900" />
                <div>
                  <h3 className="font-semibold text-gray-900">Pusher</h3>
                  <p className="text-sm text-gray-600">Protocolo de comunicación</p>
                </div>
              </div>
              <Badge
                variant={pusherConnected ? "default" : "destructive"}
                className={`flex items-center gap-2 px-4 py-2 text-sm ${
                  pusherConnected ? "bg-green-600 animate-pulse" : "bg-red-600"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${pusherConnected ? "bg-green-200" : "bg-red-200"}`} />
                {pusherStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabs de control y Gráficos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Tabs */}
            <Card className="bg-white rounded-2xl shadow-xl border border-slate-200/60">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-gray-900">
                  <div className="p-2 rounded-lg bg-red-900">
                    <Settings className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  Control de Sensores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <Tabs defaultValue="celdas" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 gap-2 bg-gray-100 p-2 h-auto">
                    <TabsTrigger
                      value="celdas"
                      className="data-[state=active]:bg-red-900 data-[state=active]:text-white"
                    >
                      Celdas
                    </TabsTrigger>
                    <TabsTrigger value="mpu" className="data-[state=active]:bg-red-900 data-[state=active]:text-white">
                      MPU
                    </TabsTrigger>
                    <TabsTrigger
                      value="conexion"
                      className="data-[state=active]:bg-red-900 data-[state=active]:text-white"
                    >
                      Conexión
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab: Celdas */}
                  <TabsContent value="celdas" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gray-50 rounded-xl border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-red-900" />
                            Celda 1
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-gray-600">
                            {streamingStates.cell1 ? "Streaming activo..." : "Streaming inactivo"}
                          </p>
                          <Button
                            onClick={toggleStreamCell1}
                            className={`w-full h-12 ${
                              streamingStates.cell1 ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                            } transition-all`}
                          >
                            {streamingStates.cell1 ? (
                              <>
                                <PowerOff className="h-5 w-5 mr-2" />
                                Detener
                              </>
                            ) : (
                              <>
                                <Power className="h-5 w-5 mr-2" />
                                Iniciar
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-50 rounded-xl border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-red-900" />
                            Celda 2
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-gray-600">
                            {streamingStates.cell2 ? "Streaming activo..." : "Streaming inactivo"}
                          </p>
                          <Button
                            onClick={toggleStreamCell2}
                            className={`w-full h-12 ${
                              streamingStates.cell2 ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                            } transition-all`}
                          >
                            {streamingStates.cell2 ? (
                              <>
                                <PowerOff className="h-5 w-5 mr-2" />
                                Detener
                              </>
                            ) : (
                              <>
                                <Power className="h-5 w-5 mr-2" />
                                Iniciar
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Tab: MPU */}
                  <TabsContent value="mpu" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gray-50 rounded-xl border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-lg text-gray-900">Eje X</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-gray-600">
                            {streamingStates.mpuX ? "Streaming activo..." : "Streaming inactivo"}
                          </p>
                          <Button
                            onClick={toggleStreamMpuX}
                            className={`w-full h-12 ${
                              streamingStates.mpuX ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {streamingStates.mpuX ? "Detener" : "Iniciar"}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-50 rounded-xl border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-lg text-gray-900">Eje Y</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-gray-600">
                            {streamingStates.mpuY ? "Streaming activo..." : "Streaming inactivo"}
                          </p>
                          <Button
                            onClick={toggleStreamMpuY}
                            className={`w-full h-12 ${
                              streamingStates.mpuY ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {streamingStates.mpuY ? "Detener" : "Iniciar"}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-50 rounded-xl border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-lg text-gray-900">Eje Z</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-gray-600">
                            {streamingStates.mpuZ ? "Streaming activo..." : "Streaming inactivo"}
                          </p>
                          <Button
                            onClick={toggleStreamMpuZ}
                            className={`w-full h-12 ${
                              streamingStates.mpuZ ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {streamingStates.mpuZ ? "Detener" : "Iniciar"}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Tab: Conexión */}
                  <TabsContent value="conexion" className="space-y-4 mt-6">
                    <Card className="bg-gray-50 rounded-xl border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-gray-900">Prueba de Conexión</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-gray-600">Verifica que el ESP-6 responde correctamente</p>
                        <Button onClick={checkConnection} className="w-full h-12 bg-blue-600 hover:bg-blue-700">
                          <Wifi className="h-5 w-5 mr-2" />
                          Comprobar Conexión
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Gráficos siempre visibles */}
            <div className="grid grid-cols-1 gap-6">
              <Card className="bg-white rounded-2xl shadow-xl border border-slate-200/60">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Celdas de Carga</CardTitle>
                </CardHeader>
                <CardContent>
                  {sensorData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={sensorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} />
                        <YAxis />
                        <Tooltip labelFormatter={(ts) => new Date(ts).toLocaleTimeString()} />
                        <Legend />
                        {sensorData.some((d) => d.CELL1 !== undefined) && (
                          <Line type="monotone" dataKey="CELL1" stroke="#dc2626" dot={false} name="Celda 1" />
                        )}
                        {sensorData.some((d) => d.CELL2 !== undefined) && (
                          <Line type="monotone" dataKey="CELL2" stroke="#ea580c" dot={false} name="Celda 2" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-500">
                      Sin datos - Inicia el streaming
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white rounded-2xl shadow-xl border border-slate-200/60">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Aceleración MPU6050</CardTitle>
                </CardHeader>
                <CardContent>
                  {sensorData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={sensorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} />
                        <YAxis />
                        <Tooltip labelFormatter={(ts) => new Date(ts).toLocaleTimeString()} />
                        <Legend />
                        {sensorData.some((d) => d.MPUX !== undefined) && (
                          <Line type="monotone" dataKey="MPUX" stroke="#2563eb" dot={false} name="Eje X" />
                        )}
                        {sensorData.some((d) => d.MPUY !== undefined) && (
                          <Line type="monotone" dataKey="MPUY" stroke="#059669" dot={false} name="Eje Y" />
                        )}
                        {sensorData.some((d) => d.MPUZ !== undefined) && (
                          <Line type="monotone" dataKey="MPUZ" stroke="#7c3aed" dot={false} name="Eje Z" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-500">
                      Sin datos - Inicia el streaming
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Monitor siempre visible en la derecha */}
          <Card className="bg-white rounded-2xl shadow-xl border border-slate-200/60 lg:col-span-1 h-fit sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg text-gray-900">
                <Activity className="h-5 w-5 text-red-900" />
                Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-3 h-96 overflow-y-auto border-2 border-gray-200">
                {espResponses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Activity className="h-8 w-8 mb-2" />
                    <p className="text-xs">Esperando mensajes...</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {espResponses.map((msg, idx) => (
                      <div key={idx} className="text-xs font-mono bg-white p-1.5 rounded border border-gray-200">
                        <span className="text-blue-600">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                        <span className="text-red-900 mx-1 font-semibold">{msg.device}</span>
                        <span className={getMessageColor(msg.status)}>{msg.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
