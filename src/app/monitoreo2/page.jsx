"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Activity, Settings, Power, PowerOff, TrendingUp, Cpu, Wifi, WifiOff } from "lucide-react"

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

  // Paleta: azules/morados oscuros sobre fondo blanco
  const brandStyle = {
    "--brand": "#1e1b4b",   // indigo-900
    "--brand-2": "#4c1d95", // violet-900
  }

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
      script.onload = () => initializePusher()
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
      // listo
    })

    channel.bind("client-sensor-data", (data) => {
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

        if (newData.length > MAX_CHART_POINTS) newData.shift()
        sensorDataRef.current = newData
        return newData
      })

      addMessage("ESP-6", "sensor", `${sensorInfo}: ${Number(value).toFixed(2)}`, "success")
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
    const message = { device, message: msg, timestamp: Date.now(), type, status }
    setEspResponses((prev) => [...prev.slice(-19), message])
  }

  const sendCommand = async (command) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "ESP-6", command, data: {}, channel: "private-device-ESP-6" }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error enviando comando")
      addMessage("ESP-6", "command", `Comando enviado: ${command}`, "info")
    } catch (error) {
      console.error("Error:", error)
      addMessage("ESP-6", "error", `Error: ${error.message}`, "error")
    }
  }

  const toggleStreamCell1 = async () => {
    const newState = !streamingStates.cell1
    await sendCommand(newState ? "START_CELL1" : "STOP_CELL1")
    setStreamingStates((p) => ({ ...p, cell1: newState }))
  }

  const toggleStreamCell2 = async () => {
    const newState = !streamingStates.cell2
    await sendCommand(newState ? "START_CELL2" : "STOP_CELL2")
    setStreamingStates((p) => ({ ...p, cell2: newState }))
  }

  const toggleStreamMpuX = async () => {
    const newState = !streamingStates.mpuX
    await sendCommand(newState ? "START_MPUX" : "STOP_MPUX")
    setStreamingStates((p) => ({ ...p, mpuX: newState }))
  }

  const toggleStreamMpuY = async () => {
    const newState = !streamingStates.mpuY
    await sendCommand(newState ? "START_MPUY" : "STOP_MPUY")
    setStreamingStates((p) => ({ ...p, mpuY: newState }))
  }

  const toggleStreamMpuZ = async () => {
    const newState = !streamingStates.mpuZ
    await sendCommand(newState ? "START_MPUZ" : "STOP_MPUZ")
    setStreamingStates((p) => ({ ...p, mpuZ: newState }))
  }

  const checkConnection = async () => {
    await sendCommand("CHECK")
  }

  const getMessageColor = (status) => {
    switch (status) {
      case "success":
        return "text-emerald-700"
      case "error":
        return "text-rose-700"
      case "info":
        return "text-indigo-700"
      default:
        return "text-violet-700"
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 px-4 md:px-6 lg:px-8 py-6" style={brandStyle}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[color:var(--brand)] text-white shadow-md">
                <Cpu className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">ESP 6 Monitor</h1>
                <p className="text-sm text-slate-600">Monitoreo del microcontrolador en tiempo real</p>
              </div>
            </div>
           
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-[color:var(--brand)] via-[color:var(--brand-2)] to-[color:var(--brand)]" />
        </div>

       
        {/* CONTROL & MONITOR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50">
                <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
                  <div className="p-2 rounded-lg bg-[color:var(--brand)] text-white">
                    <Settings className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  Control de Sensores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <Tabs defaultValue="celdas" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 gap-2 bg-slate-100 p-2 h-auto rounded-lg">
                    <TabsTrigger
                      value="celdas"
                      className="data-[state=active]:bg-[color:var(--brand)] data-[state=active]:text-white rounded-md"
                    >
                      Celdas
                    </TabsTrigger>
                    <TabsTrigger
                      value="mpu"
                      className="data-[state=active]:bg-[color:var(--brand)] data-[state=active]:text-white rounded-md"
                    >
                      MPU
                    </TabsTrigger>
                    <TabsTrigger
                      value="conexion"
                      className="data-[state=active]:bg-[color:var(--brand)] data-[state=active]:text-white rounded-md"
                    >
                      Conexión
                    </TabsTrigger>
                  </TabsList>

                  {/* CELDAS */}
                  <TabsContent value="celdas" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="rounded-xl border border-indigo-200 bg-white hover:border-indigo-300 transition-colors">
                        <CardHeader>
                          <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-700" />
                            Celda 1
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-slate-600">
                            {streamingStates.cell1 ? "✓ Streaming activo..." : "○ Streaming inactivo"}
                          </p>
                          <Button
                            onClick={toggleStreamCell1}
                            className={`w-full h-11 rounded-lg ${
                              streamingStates.cell1 ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                            } text-white`}
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

                      <Card className="rounded-xl border border-violet-200 bg-white hover:border-violet-300 transition-colors">
                        <CardHeader>
                          <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-violet-700" />
                            Celda 2
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-slate-600">
                            {streamingStates.cell2 ? "✓ Streaming activo..." : "○ Streaming inactivo"}
                          </p>
                          <Button
                            onClick={toggleStreamCell2}
                            className={`w-full h-11 rounded-lg ${
                              streamingStates.cell2 ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                            } text-white`}
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

                  {/* MPU */}
                  <TabsContent value="mpu" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="rounded-xl border border-indigo-200 bg-white hover:border-indigo-300 transition-colors">
                        <CardHeader>
                          <CardTitle className="text-lg">Eje X</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-slate-600">
                            {streamingStates.mpuX ? "✓ Streaming activo..." : "○ Streaming inactivo"}
                          </p>
                          <Button
                            onClick={toggleStreamMpuX}
                            className={`w-full h-11 rounded-lg ${
                              streamingStates.mpuX ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                            } text-white`}
                          >
                            {streamingStates.mpuX ? "Detener" : "Iniciar"}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="rounded-xl border border-indigo-200 bg-white hover:border-indigo-300 transition-colors">
                        <CardHeader>
                          <CardTitle className="text-lg">Eje Y</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-slate-600">
                            {streamingStates.mpuY ? "✓ Streaming activo..." : "○ Streaming inactivo"}
                          </p>
                          <Button
                            onClick={toggleStreamMpuY}
                            className={`w-full h-11 rounded-lg ${
                              streamingStates.mpuY ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                            } text-white`}
                          >
                            {streamingStates.mpuY ? "Detener" : "Iniciar"}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="rounded-xl border border-violet-200 bg-white hover:border-violet-300 transition-colors">
                        <CardHeader>
                          <CardTitle className="text-lg">Eje Z</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-slate-600">
                            {streamingStates.mpuZ ? "✓ Streaming activo..." : "○ Streaming inactivo"}
                          </p>
                          <Button
                            onClick={toggleStreamMpuZ}
                            className={`w-full h-11 rounded-lg ${
                              streamingStates.mpuZ ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                            } text-white`}
                          >
                            {streamingStates.mpuZ ? "Detener" : "Iniciar"}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* CONEXIÓN */}
                  <TabsContent value="conexion" className="space-y-4 mt-6">
                    <Card className="rounded-xl border border-slate-200 bg-white">
                      <CardHeader>
                        <CardTitle className="text-lg">Prueba de Conexión</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-slate-600">Verifica que el ESP-6 responde correctamente</p>
                        <Button
                          onClick={checkConnection}
                          className="w-full h-11 bg-[color:var(--brand)] hover:brightness-110 text-white rounded-lg"
                        >
                          Comprobar Conexión
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* MONITOR */}
          <Card className="rounded-2xl border border-slate-200 bg-white lg:col-span-1 h-fit shadow-sm">
            <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-3 text-lg">
                <Activity className="h-5 w-5 text-indigo-700" />
                Monitor en Vivo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-white rounded-b-2xl p-3 h-96 overflow-y-auto border-t border-slate-200">
                {espResponses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Activity className="h-8 w-8 mb-2 animate-pulse" />
                    <p className="text-xs">Esperando mensajes...</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {espResponses.map((msg, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-mono bg-white p-2 rounded border border-slate-200 hover:border-indigo-300 transition-colors"
                      >
                        <span className="text-indigo-700">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>{" "}
                        <span className="text-slate-900 font-semibold">{msg.device}:</span>{" "}
                        <span className={getMessageColor(msg.status)}>{msg.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
        </div>
         {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-2xl border border-indigo-200 bg-white shadow-sm">
            <CardHeader className="rounded-t-2xl border-b border-indigo-200 bg-indigo-50">
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-indigo-600 animate-pulse" />
                Celdas de Carga
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {sensorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                      stroke="#334155"
                    />
                    <YAxis stroke="#334155" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #c7d2fe",
                        borderRadius: "8px",
                        color: "#0f172a",
                      }}
                      labelFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                    />
                    <Legend wrapperStyle={{ color: "#334155" }} />
                    {sensorData.some((d) => d.CELL1 !== undefined) && (
                      <Line
                        type="monotone"
                        dataKey="CELL1"
                        stroke="#4338ca" // indigo-700
                        dot={false}
                        name="Celda 1"
                        strokeWidth={2}
                        animationDuration={400}
                      />
                    )}
                    {sensorData.some((d) => d.CELL2 !== undefined) && (
                      <Line
                        type="monotone"
                        dataKey="CELL2"
                        stroke="#6d28d9" // violet-700
                        dot={false}
                        name="Celda 2"
                        strokeWidth={2}
                        animationDuration={400}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-slate-400">
                  <TrendingUp className="h-12 w-12 mb-3 opacity-60" />
                  <p className="text-center text-sm">Sin datos - Inicia el streaming</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-violet-200 bg-white shadow-sm">
            <CardHeader className="rounded-t-2xl border-b border-violet-200 bg-violet-50">
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-violet-600 animate-pulse" />
                Aceleración MPU6050
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {sensorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                      stroke="#334155"
                    />
                    <YAxis stroke="#334155" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #ddd6fe",
                        borderRadius: "8px",
                        color: "#0f172a",
                      }}
                      labelFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                    />
                    <Legend wrapperStyle={{ color: "#334155" }} />
                    {sensorData.some((d) => d.MPUX !== undefined) && (
                      <Line
                        type="monotone"
                        dataKey="MPUX"
                        stroke="#4f46e5" // indigo-600
                        dot={false}
                        name="Eje X"
                        strokeWidth={2}
                        animationDuration={400}
                      />
                    )}
                    {sensorData.some((d) => d.MPUY !== undefined) && (
                      <Line
                        type="monotone"
                        dataKey="MPUY"
                        stroke="#7c3aed" // violet-600
                        dot={false}
                        name="Eje Y"
                        strokeWidth={2}
                        animationDuration={400}
                      />
                    )}
                    {sensorData.some((d) => d.MPUZ !== undefined) && (
                      <Line
                        type="monotone"
                        dataKey="MPUZ"
                        stroke="#0891b2" // cyan-700 para contraste
                        dot={false}
                        name="Eje Z"
                        strokeWidth={2}
                        animationDuration={400}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-slate-400">
                  <TrendingUp className="h-12 w-12 mb-3 opacity-60" />
                  <p className="text-center text-sm">Sin datos - Inicia el streaming</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
