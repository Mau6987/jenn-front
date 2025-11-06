"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { Wifi, WifiOff, Activity, ChevronDown, ChevronUp, Info } from "lucide-react"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

export default function ESPMonitoringReadOnlyStyled() {
  const [deviceId, setDeviceId] = useState("ESP-6")
  const [pusherConnected, setPusherConnected] = useState(false)
  const [espOnline, setEspOnline] = useState(false)

  // Streams (Modo B continuo / Modo A por eventos)
  const [exerciseData, setExerciseData] = useState([])
  const [jumpResults, setJumpResults] = useState([])
  const [messages, setMessages] = useState([])

  // UI state similar al ejemplo
  const [periodo, setPeriodo] = useState("general")
  const [activeTab, setActiveTab] = useState("stream") // stream | jumps
  const [showBreakdown, setShowBreakdown] = useState(true)

  const channelRef = useRef(null)
  const pusherRef = useRef(null)

  // ---- PUSHER ----
  useEffect(() => {
    if (typeof window === "undefined") return

    const ensurePusher = () => {
      if (window.Pusher) init()
      else {
        const s = document.createElement("script")
        s.src = "https://js.pusher.com/8.2.0/pusher.min.js"
        s.async = true
        s.onload = init
        s.onerror = () => addMsg("SISTEMA", "Error cargando Pusher", "error")
        document.head.appendChild(s)
      }
    }

    const init = () => {
      try {
        const p = new window.Pusher("4f85ef5c792df94cebc9", {
          cluster: "us2",
          encrypted: true,
          authEndpoint: `${BACKEND_URL}/api/pusher/pusher/auth`,
          forceTLS: true,
        })
        p.connection.bind("connected", () => setPusherConnected(true))
        p.connection.bind("disconnected", () => setPusherConnected(false))
        pusherRef.current = p
      } catch (e) {
        addMsg("SISTEMA", "No se pudo inicializar Pusher", "error")
      }
    }

    ensurePusher()

    return () => {
      try {
        channelRef.current?.unsubscribe?.()
        pusherRef.current?.disconnect?.()
      } catch {}
    }
  }, [])

  // Resuscribir al cambiar deviceId/estado
  useEffect(() => {
    if (!pusherRef.current || !pusherConnected) return

    setExerciseData([])
    setJumpResults([])
    setMessages([])
    setEspOnline(false)

    try {
      if (channelRef.current) {
        try { channelRef.current.unsubscribe?.() } catch {}
      }
      const channelName = `private-device-${deviceId}`
      const ch = pusherRef.current.subscribe(channelName)

      ch.bind("pusher:subscription_succeeded", () => addMsg(deviceId, `Suscripto a ${channelName}`, "info"))

      ch.bind("client-exercise-data", (data) => {
        const row = {
          timestamp: Date.now(),
          F1: Number(data?.F1) || 0,
          F2: Number(data?.F2) || 0,
          Ftotal: Number(data?.Ftotal) || 0,
          acelZ: Number(data?.acelZ) || 0,
          pitch: Number(data?.pitch) || 0,
          potencia: Number(data?.potencia) || 0,
        }
        setExerciseData((prev) => [...prev, row].slice(-400))
      })

      ch.bind("client-jump-results", (data) => {
        const jr = {
          timestamp: Date.now(),
          tiempoVuelo: Number(data?.tiempoVuelo) || 0,
          velocidad: Number(data?.velocidad) || 0,
          potencia: Number(data?.potencia) || 0,
          altura: Number(data?.altura) || 0,
          alcanceTotal: Number(data?.alcanceTotal) || 0,
        }
        setJumpResults((prev) => [...prev, jr].slice(-200))
        addMsg(deviceId, `Salto: altura ${jr.altura.toFixed(1)} cm`, "success")
      })

      ch.bind("client-response", (data) => {
        const msg = String(data?.message || "").toLowerCase()
        if (msg.includes("ok") || msg.includes("vivo")) setEspOnline(true)
        addMsg(deviceId, data?.message || "(sin mensaje)", "info")
      })

      ch.bind("client-status", (data) => addMsg(deviceId, typeof data === "string" ? data : JSON.stringify(data), "info"))
      ch.bind("client-error", (data) => addMsg(deviceId, data?.message || "Error desconocido", "error"))

      channelRef.current = ch
    } catch (e) {
      addMsg("SISTEMA", `Error suscribiendo a ${deviceId}`, "error")
    }
  }, [deviceId, pusherConnected])

  const addMsg = (device, message, type) => {
    setMessages((prev) => [...prev.slice(-499), { device, message, timestamp: Date.now(), type }])
  }

  // Métricas derivadas para usar en la UI tipo "rating"
  const derived = useMemo(() => {
    const total = exerciseData.length
    const maxF = total ? Math.max(...exerciseData.map((d) => d.Ftotal)) : 0
    const maxP = total ? Math.max(...exerciseData.map((d) => d.potencia)) : 0
    const avgF = total ? exerciseData.reduce((s, d) => s + d.Ftotal, 0) / total : 0
    const avgP = total ? exerciseData.reduce((s, d) => s + d.potencia, 0) / total : 0
    const accelZmax = total ? Math.max(...exerciseData.map((d) => d.acelZ)) : 0
    // Un "score" simple 0..10 basado en fuerza/potencia
    const score = Math.min(10, Math.round(((maxF / 500) + (maxP / 200)) * 5)) || 0
    return { total, maxF, maxP, avgF, avgP, accelZmax, score }
  }, [exerciseData])

  const percent = (value, max) => Math.min(100, max ? (value / max) * 100 : 0)

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#f8f9fa] py-6 px-4">
      <div className="max-w-md mx-auto">
        <Card className="bg-white shadow-sm border border-[#e9ecef] overflow-hidden">
          <CardContent className="p-0">
            {/* Header estilizado tipo perfil */}
            <div className="p-5 pb-4">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
                    {deviceId.replace("ESP-", "E")}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#212529] leading-tight mb-1.5">{deviceId}</h1>
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-1 rounded font-bold text-base flex items-center gap-1.5 ${espOnline ? "bg-[#4361ee] text-white" : "bg-[#e9ecef] text-[#6c757d]"}`}>
                        <span className="text-lg">{derived.score}</span>
                      </div>
                      <span className="text-sm text-[#6c757d]">Signal Score</span>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="flex items-center justify-end gap-2">
                    {pusherConnected ? <Wifi className="h-5 w-5 text-[#22c55e]" /> : <WifiOff className="h-5 w-5 text-[#ef4444]" />}
                    <Badge variant={pusherConnected ? "default" : "destructive"} className={pusherConnected ? "bg-green-600" : ""}>
                      {pusherConnected ? "Pusher OK" : "Pusher Off"}
                    </Badge>
                  </div>
                  <Badge variant={espOnline ? "default" : "secondary"} className={`mt-1 ${espOnline ? "bg-green-600" : ""}`}>
                    {espOnline ? "En línea" : "Esperando ok/vivo"}
                  </Badge>
                </div>
              </div>

              {/* Selector de Dispositivo y Periodo (solo UI, periodo no afecta al stream) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[13px] text-[#495057]">Dispositivo</Label>
                  <Select value={deviceId} onValueChange={setDeviceId}>
                    <SelectTrigger className="w-full bg-[#f8f9fa] border-[#dee2e6] rounded-lg h-9 text-sm font-medium">
                      <SelectValue placeholder="ESP-1" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }).map((_, i) => {
                        const id = `ESP-${i + 1}`
                        return (
                          <SelectItem key={id} value={id}>{id}</SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[13px] text-[#495057]">Periodo</Label>
                  <Select value={periodo} onValueChange={setPeriodo}>
                    <SelectTrigger className="w-full bg-[#f8f9fa] border-[#dee2e6] rounded-lg h-9 text-sm font-medium">
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Breakdown tipo Sofascore */}
            <div className="border-t border-[#e9ecef]">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#f8f9fa] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-[#4361ee] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{derived.score}</span>
                  </div>
                  <span className="font-semibold text-[#212529] text-sm">Live metrics breakdown</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-[#adb5bd]" />
                  {showBreakdown ? (
                    <ChevronUp className="h-4 w-4 text-[#6c757d]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#6c757d]" />
                  )}
                </div>
              </button>

              {showBreakdown && (
                <div className="px-5 pb-5 space-y-3 animate-in fade-in">
                  <div className="text-xs text-[#6c757d] mb-3 flex items-center justify-between">
                    <span>Impact</span>
                    <span className="flex items-center gap-8"><span>-</span><span>0</span><span>+</span></span>
                  </div>

                  {/* Barras con valores reales del stream */}
                  <StatBar label="Fuerza total (max)" value={derived.maxF} maxValue={500} color="bg-[#4361ee]" displayValue={`${derived.maxF.toFixed(0)} N`} />
                  <StatBar label="Potencia (max)" value={derived.maxP} maxValue={200} color="bg-[#f77f00]" displayValue={`${derived.maxP.toFixed(0)} W`} />
                  <StatBar label="Fuerza (prom)" value={derived.avgF} maxValue={500} color="bg-[#4cc9f0]" displayValue={`${derived.avgF.toFixed(0)} N`} />
                  <StatBar label="Aceleración Z (max)" value={derived.accelZmax} maxValue={50} color="bg-[#3a0ca3]" displayValue={`${derived.accelZmax.toFixed(1)} m/s²`} />
                </div>
              )}
            </div>

            {/* Tabs: stream vs jumps */}
            <div className="border-t border-[#e9ecef]">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#f8f9fa] p-2">
                  <TabsTrigger value="stream">Streaming (Modo B)</TabsTrigger>
                  <TabsTrigger value="jumps">Resultados (Modo A)</TabsTrigger>
                </TabsList>

                {/* STREAM */}
                <TabsContent value="stream" className="px-5 pb-5 space-y-5">
                  <ChartCard title="Fuerzas de Celdas (N)" subtitle="F1, F2, Ftotal" type="force" data={exerciseData} />
                  <ChartCard title="Aceleración Z (m/s²)" subtitle="IMU eje Z" type="acelZ" data={exerciseData} />
                  <ChartCard title="Ángulo Pitch (°)" subtitle="Postura" type="pitch" data={exerciseData} />
                  <ChartCard title="Potencia (W)" subtitle="Instantánea" type="potencia" data={exerciseData} />
                </TabsContent>

                {/* JUMPS */}
                <TabsContent value="jumps" className="px-5 pb-5 space-y-5">
                  <Card className="bg-white border border-[#e9ecef]">
                    <CardContent className="pt-5">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={jumpResults.map((r, i) => ({ ...r, salto: `Salto ${i + 1}` }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="salto" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="altura" fill="#3b82f6" name="Altura (cm)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-[#e9ecef]">
                    <CardContent className="pt-5">
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={jumpResults.map((r, i) => ({ ...r, salto: i + 1 }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="salto" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="velocidad" stroke="#22c55e" name="Velocidad (m/s)" strokeWidth={2} />
                          <Line yAxisId="right" type="monotone" dataKey="potencia" stroke="#f59e0b" name="Potencia (W)" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {jumpResults.length > 0 && (
                    <Card className="bg-white border border-[#e9ecef]">
                      <CardContent className="pt-5">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa]">
                              <tr>
                                <th className="p-2 text-left">#</th>
                                <th className="p-2 text-right">Altura (cm)</th>
                                <th className="p-2 text-right">Velocidad (m/s)</th>
                                <th className="p-2 text-right">Potencia (W)</th>
                                <th className="p-2 text-right">T. Vuelo (ms)</th>
                                <th className="p-2 text-right">Alcance (cm)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {jumpResults.map((r, i) => (
                                <tr key={i} className="border-b hover:bg-[#f8f9fa]">
                                  <td className="p-2">{i + 1}</td>
                                  <td className="p-2 text-right">{Number(r.altura).toFixed(1)}</td>
                                  <td className="p-2 text-right">{Number(r.velocidad).toFixed(2)}</td>
                                  <td className="p-2 text-right">{Number(r.potencia).toFixed(0)}</td>
                                  <td className="p-2 text-right">{Number(r.tiempoVuelo).toFixed(0)}</td>
                                  <td className="p-2 text-right">{Number(r.alcanceTotal).toFixed(1)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Monitor de Comunicación */}
            <div className="border-t border-[#e9ecef] px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#212529] text-sm">Monitor</h3>
                <button className="p-1.5 hover:bg-[#f8f9fa] rounded transition-colors" title="Ordenar">
                  <svg className="h-5 w-5 text-[#6c757d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <div className="bg-[#f8f9fa] rounded-lg p-4 h-56 overflow-y-auto border border-[#e9ecef]">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-[#6c757d]">
                    <p>Esperando mensajes...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg, index) => (
                      <div key={index} className="text-xs font-mono bg-white p-2 rounded border border-[#e9ecef]">
                        <span className="text-[#4361ee]">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                        <span className="text-[#3a0ca3] font-semibold ml-2">{msg.device}:</span>
                        <span className={`ml-2 ${msg.type === "error" ? "text-[#ef4444]" : msg.type === "success" ? "text-[#22c55e]" : "text-[#495057]"}`}>
                          {msg.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón flotante para alternar pestañas */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setActiveTab(activeTab === "stream" ? "jumps" : "stream")}
            className="bg-[#4361ee] text-white px-5 py-3 rounded-full shadow-lg hover:bg-[#3a0ca3] transition-all font-semibold text-sm"
          >
            {activeTab === "stream" ? "Ver Resultados" : "Ver Streaming"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, type, data }) {
  return (
    <Card className="bg-white border border-[#e9ecef]">
      <CardContent className="pt-5">
        <div className="mb-3">
          <h3 className="font-semibold text-[#212529] text-sm">{title}</h3>
          <p className="text-xs text-[#6c757d]">{subtitle}</p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          {type === "force" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) => {
                  const base = data[0]?.timestamp || ts
                  const seconds = Math.floor((Number(ts) - base) / 1000)
                  return `${seconds}s`
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(ts) => {
                  const base = data[0]?.timestamp || Number(ts)
                  const seconds = ((Number(ts) - base) / 1000).toFixed(1)
                  return `Tiempo: ${seconds}s`
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="F1" stroke="#ef4444" name="Fuerza 1 (N)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="F2" stroke="#3b82f6" name="Fuerza 2 (N)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Ftotal" stroke="#22c55e" name="Fuerza Total (N)" strokeWidth={2} dot={false} />
            </LineChart>
          ) : type === "acelZ" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(ts) => {
                const base = data[0]?.timestamp || ts
                const seconds = Math.floor((Number(ts) - base) / 1000)
                return `${seconds}s`
              }} />
              <YAxis />
              <Tooltip labelFormatter={(ts) => {
                const base = data[0]?.timestamp || Number(ts)
                const seconds = ((Number(ts) - base) / 1000).toFixed(1)
                return `Tiempo: ${seconds}s`
              }} />
              <Legend />
              <Line type="monotone" dataKey="acelZ" stroke="#8b5cf6" name="Aceleración Z (m/s²)" strokeWidth={2} dot={false} />
            </LineChart>
          ) : type === "pitch" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(ts) => {
                const base = data[0]?.timestamp || ts
                const seconds = Math.floor((Number(ts) - base) / 1000)
                return `${seconds}s`
              }} />
              <YAxis />
              <Tooltip labelFormatter={(ts) => {
                const base = data[0]?.timestamp || Number(ts)
                const seconds = ((Number(ts) - base) / 1000).toFixed(1)
                return `Tiempo: ${seconds}s`
              }} />
              <Legend />
              <Line type="monotone" dataKey="pitch" stroke="#0369A1" name="Ángulo Pitch (°)" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(ts) => {
                const base = data[0]?.timestamp || ts
                const seconds = Math.floor((Number(ts) - base) / 1000)
                return `${seconds}s`
              }} />
              <YAxis />
              <Tooltip labelFormatter={(ts) => {
                const base = data[0]?.timestamp || Number(ts)
                const seconds = ((Number(ts) - base) / 1000).toFixed(1)
                return `Tiempo: ${seconds}s`
              }} />
              <Legend />
              <Line type="monotone" dataKey="potencia" stroke="#f59e0b" name="Potencia (W)" strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function StatBar({ label, value, maxValue, color, displayValue }) {
  const percentage = Math.min(100, (Number(value) / Number(maxValue || 1)) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#495057]">{label}</span>
        <span className="text-xs font-semibold text-[#212529]">{displayValue}</span>
      </div>
      <div className="relative h-1.5 bg-[#e9ecef] rounded-full overflow-hidden">
        <div className={`absolute top-0 left-0 h-full ${color} rounded-full transition-all duration-700 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
