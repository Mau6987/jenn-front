"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import Pusher from "pusher-js"

export default function MonitoreoPage() {
  const [selectedEsp, setSelectedEsp] = useState("1")
  const [command, setCommand] = useState("")
  const [userId, setUserId] = useState("admin")
  const [messages, setMessages] = useState([])
  const [deviceStatus, setDeviceStatus] = useState({
    1: "unknown",
    2: "unknown",
    3: "unknown",
    4: "unknown",
    5: "unknown",
  })
  const [loading, setLoading] = useState(false)

  const handleResponse = useCallback((espId, data) => {
    console.log(`[v0] Mensaje recibido de ESP-${espId}:`, data)

    const newMessage = {
      id: Date.now(),
      espId: `esp-${espId}`,
      type: "received",
      message: data.message || JSON.stringify(data),
      timestamp: new Date().toLocaleTimeString(),
      data,
    }

    setMessages((prev) => [newMessage, ...prev].slice(0, 100))

    // Actualizar status si es heartbeat o status
    if (data.type === "heartbeat" || data.type === "status") {
      setDeviceStatus((prev) => ({
        ...prev,
        [espId]: "online",
      }))
    }
  }, [])

  const handleHeartbeat = useCallback((espId) => {
    setDeviceStatus((prev) => ({
      ...prev,
      [espId]: "online",
    }))
  }, [])

  useEffect(() => {
    const pusher = new Pusher("4f85ef5c792df94cebc9", {
      cluster: "us2",
    })

    // Suscribirse a todos los canales ESP
    const channels = ["esp-1", "esp-2", "esp-3", "esp-4", "esp-5"]
    const channelInstances = []

    channels.forEach((espChannel) => {
      const channel = pusher.subscribe(espChannel)
      channelInstances.push(channel)

      // Extract device ID from channel name (esp-1 -> 1)
      const deviceId = espChannel.split("-")[1]

      // Escuchar respuestas
      const responseHandler = (data) => handleResponse(deviceId, data)
      const heartbeatHandler = () => handleHeartbeat(deviceId)

      channel.bind("response", responseHandler)
      channel.bind("heartbeat", heartbeatHandler)
    })

    return () => {
      channelInstances.forEach((channel) => {
        channel.unbind_all()
      })
      channels.forEach((espId) => pusher.unsubscribe(espId))
      pusher.disconnect()
    }
  }, [handleResponse, handleHeartbeat])

  const sendCommand = async (deviceId, cmd) => {
    setLoading(true)

    try {
      const response = await fetch("https://voley-backend-nhyl.onrender.com/api/pusher/send-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comando: cmd,
          deviceId: Number.parseInt(deviceId),
          userId: userId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Agregar mensaje enviado al historial
        const sentMessage = {
          id: Date.now(),
          espId: `esp-${deviceId}`,
          type: "sent",
          message: cmd,
          timestamp: new Date().toLocaleTimeString(),
        }

        setMessages((prev) => [sentMessage, ...prev].slice(0, 100))
        setCommand("")

        console.log(`[v0] Comando enviado exitosamente a ESP-${deviceId}:`, cmd)
      } else {
        console.error("[v0] Error enviando comando:", result.message)
        alert(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error("[v0] Error en la petición:", error)
      alert("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // Comandos rápidos
  const quickCommands = [
    { label: "LED ON", value: "LED_ON" },
    { label: "LED OFF", value: "LED_OFF" },
    { label: "Status", value: "STATUS" },
    { label: "Sensor", value: "SENSOR" },
    { label: "Reset", value: "RESET" },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Monitoreo ESP32</h1>
        <Badge variant="outline">5 Dispositivos</Badge>
      </div>

      {/* Panel de Control */}
      <Card>
        <CardHeader>
          <CardTitle>Panel de Control</CardTitle>
          <CardDescription>Envía comandos a los microcontroladores ESP32</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Dispositivo</label>
              <Select key={selectedEsp} value={selectedEsp} onValueChange={setSelectedEsp}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ESP" />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5"].map((deviceId) => (
                    <SelectItem key={deviceId} value={deviceId}>
                      ESP-{deviceId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Usuario ID</label>
              <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="admin" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Comando Personalizado</label>
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Escribe un comando..."
                onKeyPress={(e) => {
                  if (e.key === "Enter" && command.trim()) {
                    sendCommand(selectedEsp, command.trim())
                  }
                }}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => command.trim() && sendCommand(selectedEsp, command.trim())}
                disabled={loading || !command.trim()}
                className="w-full"
              >
                {loading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>

          {/* Comandos Rápidos */}
          <div>
            <label className="text-sm font-medium mb-2 block">Comandos Rápidos</label>
            <div className="flex flex-wrap gap-2">
              {quickCommands.map((cmd) => (
                <Button
                  key={cmd.value}
                  variant="outline"
                  size="sm"
                  onClick={() => sendCommand(selectedEsp, cmd.value)}
                  disabled={loading}
                >
                  {cmd.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado de Dispositivos */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Dispositivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(deviceStatus).map(([deviceId, status]) => (
              <div key={deviceId} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">ESP-{deviceId}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                  <span className="text-sm capitalize">{status}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historial de Mensajes */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Comunicación</CardTitle>
          <CardDescription>Mensajes enviados y recibidos en tiempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay mensajes aún</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg border ${
                      msg.type === "sent" ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={msg.type === "sent" ? "default" : "secondary"}>{msg.espId.toUpperCase()}</Badge>
                        <Badge variant="outline">{msg.type === "sent" ? "Enviado" : "Recibido"}</Badge>
                      </div>
                      <span className="text-xs text-gray-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-sm font-mono">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
