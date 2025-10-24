"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  Activity,
  Play,
  Square,
  Clock,
  Shuffle,
  Hand,
  Mail,
  Phone,
  MapPin,
  Ruler,
  Calendar,
  Trophy,
  User,
  GraduationCap,
} from "lucide-react"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

export default function PruebasCompleto() {
  // Sequential mode variables
  const [testActiveSequential, setTestActiveSequential] = useState(false)
  const [currentActiveESPSequential, setCurrentActiveESPSequential] = useState(null)
  const [waitingForResponseSequential, setWaitingForResponseSequential] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)
  const [totalRounds, setTotalRounds] = useState(1)
  const [currentSequence, setCurrentSequence] = useState(0)
  const [pruebaActualSequential, setPruebaActualSequential] = useState(null)
  const [estadisticasSequential, setEstadisticasSequential] = useState({
    intentos: 0,
    aciertos: 0,
    errores: 0,
  })

  // Random mode variables
  const [testActiveRandom, setTestActiveRandom] = useState(false)
  const [currentActiveESPRandom, setCurrentActiveESPRandom] = useState(null)
  const [waitingForResponseRandom, setWaitingForResponseRandom] = useState(false)
  const [tiempoPrueba, setTiempoPrueba] = useState(60)
  const [tiempoRestante, setTiempoRestante] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  const [pruebaActualRandom, setPruebaActualRandom] = useState(null)
  const [estadisticasRandom, setEstadisticasRandom] = useState({
    intentos: 0,
    aciertos: 0,
    errores: 0,
  })

  const [testActiveManual, setTestActiveManual] = useState(false)
  const [currentActiveESPManual, setCurrentActiveESPManual] = useState(null)
  const [waitingForResponseManual, setWaitingForResponseManual] = useState(false)
  const [pruebaActualManual, setPruebaActualManual] = useState(null)
  const [estadisticasManual, setEstadisticasManual] = useState({
    intentos: 0,
    aciertos: 0,
    errores: 0,
  })

  // Shared variables
  const [modoActual, setModoActual] = useState("secuencial")

  const [microControllers, setMicroControllers] = useState([
    { id: 1, label: "A", active: false, connected: false, lastSeen: null, lastResponse: null },
    { id: 2, label: "B", active: false, connected: false, lastSeen: null, lastResponse: null },
    { id: 3, label: "C", active: false, connected: false, lastSeen: null, lastResponse: null },
    { id: 4, label: "D", active: false, connected: false, lastSeen: null, lastResponse: null },
    { id: 5, label: "E", active: false, connected: false, lastSeen: null, lastResponse: null },
  ])

  const [pusherConnected, setPusherConnected] = useState(false)
  const [pusherStatus, setPusherStatus] = useState("Desconectado")
  const [espResponses, setEspResponses] = useState([])

  const [cuentas, setCuentas] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState("")
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([])

  const testActiveSequentialRef = useRef(false)
  const currentActiveESPSequentialRef = useRef(null)
  const waitingForResponseSequentialRef = useRef(false)
  const processingResponseSequentialRef = useRef(false)
  const responseTimeoutSequentialRef = useRef(null)

  const testActiveRandomRef = useRef(false)
  const currentActiveESPRandomRef = useRef(null)
  const waitingForResponseRandomRef = useRef(false)
  const processingResponseRandomRef = useRef(false)
  const responseTimeoutRandomRef = useRef(null)

  const testActiveManualRef = useRef(false)
  const currentActiveESPManualRef = useRef(null)
  const waitingForResponseManualRef = useRef(false)
  const processingResponseManualRef = useRef(false)
  const responseTimeoutManualRef = useRef(null)

  useEffect(() => {
    testActiveSequentialRef.current = testActiveSequential
    currentActiveESPSequentialRef.current = currentActiveESPSequential
    waitingForResponseSequentialRef.current = waitingForResponseSequential

    testActiveRandomRef.current = testActiveRandom
    currentActiveESPRandomRef.current = currentActiveESPRandom
    waitingForResponseRandomRef.current = waitingForResponseRandom

    testActiveManualRef.current = testActiveManual
    currentActiveESPManualRef.current = currentActiveESPManual
    waitingForResponseManualRef.current = waitingForResponseManual
  }, [
    testActiveSequential,
    currentActiveESPSequential,
    waitingForResponseSequential,
    testActiveRandom,
    currentActiveESPRandom,
    waitingForResponseRandom,
    testActiveManual,
    currentActiveESPManual,
    waitingForResponseManual,
  ])

  useEffect(() => {
    console.log("[v0] Connecting to backend:", BACKEND_URL)
    cargarCuentas()
    loadPusher()
  }, [])

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])

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
          addMessage("SISTEMA", "warning", "No se encontraron jugadores disponibles", "warning")
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

    console.log("Pusher instance created")

    pusher.connection.bind("connecting", () => {
      console.log("Pusher connecting...")
      setPusherStatus("Conectando...")
    })

    pusher.connection.bind("connected", () => {
      console.log("Pusher connected successfully!")
      console.log("Socket ID:", pusher.connection.socket_id)
      setPusherStatus("Conectado")
      setPusherConnected(true)

      subscribeToMicrocontrollerChannels(pusher)
    })

    pusher.connection.bind("disconnected", () => {
      console.log("Pusher disconnected")
      setPusherStatus("Desconectado")
      setPusherConnected(false)
    })

    pusher.connection.bind("failed", () => {
      console.log("Pusher connection failed")
      setPusherStatus("Error de conexión")
      setPusherConnected(false)
    })

    pusher.connection.bind("error", (error) => {
      console.log("Pusher connection error:", error)
      setPusherStatus("Error: " + error.message)
      setPusherConnected(false)
    })
  }

  const subscribeToMicrocontrollerChannels = (pusher) => {
    console.log("Subscribing to microcontroller channels...")

    for (let i = 1; i <= 5; i++) {
      const channelName = `private-device-ESP-${i}`
      console.log("Subscribing to channel:", channelName)

      const channel = pusher.subscribe(channelName)

      channel.bind("pusher:subscription_succeeded", () => {
        console.log("Successfully subscribed to", channelName)
        setMicroControllers((prev) =>
          prev.map((mc) => (mc.id === i ? { ...mc, connected: true, lastSeen: new Date() } : mc)),
        )
      })

      channel.bind("pusher:subscription_error", (error) => {
        console.log("Subscription error for", channelName, ":", error)
        setMicroControllers((prev) => prev.map((mc) => (mc.id === i ? { ...mc, connected: false } : mc)))
      })

      channel.bind("client-response", (data) => {
        const espId = Number.parseInt(channelName.split("-").pop())
        const responseMessage = data.message?.toLowerCase() || ""

        setMicroControllers((prev) =>
          prev.map((mc) => (mc.id === espId ? { ...mc, connected: true, lastSeen: new Date() } : mc)),
        )

        console.log(
          `[v0] Sequential state: testActive=${testActiveSequentialRef.current}, currentActiveESP=${currentActiveESPSequentialRef.current}, waitingForResponse=${waitingForResponseSequentialRef.current}`,
        )
        console.log(
          `[v0] Random state: testActive=${testActiveRandomRef.current}, currentActiveESP=${currentActiveESPRandomRef.current}, waitingForResponse=${waitingForResponseRandomRef.current}`,
        )

        if (
          testActiveSequentialRef.current &&
          waitingForResponseSequentialRef.current &&
          currentActiveESPSequentialRef.current === espId
        ) {
          if (processingResponseSequentialRef.current) {
            console.log(`[v0] Already processing sequential response, ignoring duplicate from ESP-${espId}`)
            return
          }

          console.log(`[v0] Sequential test is active and waiting for response from ESP-${espId}, processing message`)
          processingResponseSequentialRef.current = true

          if (responseMessage.includes("acierto") || responseMessage.includes("success")) {
            console.log(`[v0] *** SEQUENTIAL ACIERTO detected from ESP-${espId} ***`)
            handleSequentialResponse(espId, "acierto")
          } else if (
            responseMessage.includes("error") ||
            responseMessage.includes("fallo") ||
            responseMessage.includes("timeout") ||
            responseMessage.includes("fail")
          ) {
            console.log(`[v0] *** SEQUENTIAL ERROR detected from ESP-${espId} ***`)
            handleSequentialResponse(espId, "error")
          } else {
            console.log(
              `[v0] Unknown sequential message type from ESP-${espId}: "${responseMessage}" - treating as error`,
            )
            handleSequentialResponse(espId, "error")
          }
        } else if (
          testActiveRandomRef.current &&
          waitingForResponseRandomRef.current &&
          currentActiveESPRandomRef.current === espId
        ) {
          if (processingResponseRandomRef.current) {
            console.log(`[v0] Already processing random response, ignoring duplicate from ESP-${espId}`)
            return
          }

          console.log(`[v0] Random test is active and waiting for response from ESP-${espId}, processing message`)
          processingResponseRandomRef.current = true

          if (responseMessage.includes("acierto") || responseMessage.includes("success")) {
            console.log(`[v0] *** RANDOM ACIERTO detected from ESP-${espId} ***`)
            handleRandomResponse(espId, "acierto")
          } else if (
            responseMessage.includes("error") ||
            responseMessage.includes("fallo") ||
            responseMessage.includes("timeout") ||
            responseMessage.includes("fail")
          ) {
            console.log(`[v0] *** RANDOM ERROR detected from ESP-${espId} ***`)
            handleRandomResponse(espId, "error")
          } else {
            console.log(`[v0] Unknown random message type from ESP-${espId}: "${responseMessage}" - treating as error`)
            handleRandomResponse(espId, "error")
          }
        } else if (
          testActiveManualRef.current &&
          waitingForResponseManualRef.current &&
          currentActiveESPManualRef.current === espId
        ) {
          if (processingResponseManualRef.current) {
            console.log(`[v0] Already processing manual response, ignoring duplicate from ESP-${espId}`)
            return
          }

          console.log(`[v0] Manual test is active and waiting for response from ESP-${espId}, processing message`)
          processingResponseManualRef.current = true

          if (responseMessage.includes("acierto") || responseMessage.includes("success")) {
            console.log(`[v0] *** MANUAL ACIERTO detected from ESP-${espId} ***`)
            handleManualResponse(espId, "acierto")
          } else if (
            responseMessage.includes("error") ||
            responseMessage.includes("fallo") ||
            responseMessage.includes("timeout") ||
            responseMessage.includes("fail")
          ) {
            console.log(`[v0] *** MANUAL ERROR detected from ESP-${espId} ***`)
            handleManualResponse(espId, "error")
          } else {
            console.log(`[v0] Unknown manual message type from ESP-${espId}: "${responseMessage}" - treating as error`)
            handleManualResponse(espId, "error")
          }
        } else {
          console.log(`[v0] Ignoring message from ESP-${espId}: no active test waiting for this ESP`)
        }
      })

      channel.bind("client-heartbeat", (data) => {
        console.log("Heartbeat received from", channelName, ":", data)
        addMessage(`ESP-${i}`, "heartbeat", data, "info")

        setMicroControllers((prev) =>
          prev.map((mc) => (mc.id === i ? { ...mc, connected: true, lastSeen: new Date() } : mc)),
        )
      })

      channel.bind("client-sensor_change", (data) => {
        console.log("Sensor change received from", channelName, ":", data)
        addMessage(`ESP-${i}`, "sensor_change", data, "warning")
      })

      channel.bind("client-status", (data) => {
        console.log("Status update from", channelName, ":", data)
        addMessage(`ESP-${i}`, "status", data, "info")

        if (typeof data === "object" && data.status === "connected") {
          setMicroControllers((prev) =>
            prev.map((mc) => (mc.id === i ? { ...mc, connected: true, lastSeen: new Date() } : mc)),
          )
        }
      })

      channel.bind_global((eventName, data) => {
        if (eventName.startsWith("client-")) {
          console.log("Global event received:", eventName, "from", channelName, "data:", data)
          addMessage(`ESP-${i}`, eventName, data, "info")
        }
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
          channel: `private-device-${deviceId}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al enviar comando")
      }

      console.log(`Command sent to ${deviceId}:`, data)
      addMessage(`ESP-${espId}`, "info", JSON.stringify({ command: command?.command || "ON", from: "server" }), "info")
    } catch (error) {
      console.error(`Error sending command to ESP-${espId}:`, error)
      addMessage(`ESP-${espId}`, "error", `Error enviando comando: ${error.message}`, "error")
    }
  }

  const iniciarPruebaSecuencial = async () => {
    if (!cuentaSeleccionada) {
      addMessage("SISTEMA", "error", "Debe seleccionar un jugador", "error")
      return
    }

    try {
      console.log("[v0] Starting sequential test for account:", cuentaSeleccionada)

      const response = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "secuencial",
          cuentaId: cuentaSeleccionada,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Sequential test start response:", data)

      if (data.success) {
        localStorage.setItem("prueba_secuencial_id", data.data.id.toString())

        setPruebaActualSequential(data.data)
        setTestActiveSequential(true)
        setModoActual("secuencial")
        setCurrentRound(1)
        setCurrentSequence(1)
        setEstadisticasSequential({ intentos: 0, aciertos: 0, errores: 0 })

        addMessage("SISTEMA", "info", `Prueba secuencial iniciada - ${totalRounds} rondas`, "info")

        setTimeout(() => {
          activateNextMicrocontrollerSequential(1)
        }, 1000)
      } else {
        addMessage("SISTEMA", "error", "Error iniciando prueba: " + data.message, "error")
      }
    } catch (error) {
      console.error("[v0] Error starting sequential test:", error)
      addMessage("SISTEMA", "error", `Error iniciando prueba: ${error.message}`, "error")
    }
  }

  const activateNextMicrocontrollerSequential = (espId) => {
    console.log(`[v0] Activating sequential ESP-${espId}`)

    if (responseTimeoutSequentialRef.current) {
      clearTimeout(responseTimeoutSequentialRef.current)
      responseTimeoutSequentialRef.current = null
    }

    setCurrentActiveESPSequential(espId)
    setWaitingForResponseSequential(true)

    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: mc.id === espId,
        status: mc.id === espId ? "Esperando respuesta" : mc.status,
      })),
    )

    const command = { command: "ON", from: "server" }
    sendCommandToESP(espId, command)

    addMessage(`ESP-${espId}`, "command", JSON.stringify(command), "info")

    responseTimeoutSequentialRef.current = setTimeout(() => {
      console.log(`[v0] Sequential timeout for ESP-${espId}`)
      addMessage(`ESP-${espId}`, "timeout", "Timeout - sin respuesta", "warning")
      handleSequentialResponse(espId, "error")
    }, 10000)
  }

  const handleSequentialResponse = (espId, responseType) => {
    console.log(`[v0] Processing sequential response from ESP-${espId}: ${responseType}`)

    if (
      !testActiveSequentialRef.current ||
      !waitingForResponseSequentialRef.current ||
      currentActiveESPSequentialRef.current !== espId
    ) {
      console.log(`[v0] Ignoring sequential response from ESP-${espId} - test not active or not waiting`)
      processingResponseSequentialRef.current = false
      return
    }

    if (responseTimeoutSequentialRef.current) {
      clearTimeout(responseTimeoutSequentialRef.current)
      responseTimeoutSequentialRef.current = null
    }

    setEstadisticasSequential((prev) => ({
      intentos: prev.intentos + 1,
      aciertos: responseType === "acierto" ? prev.aciertos + 1 : prev.aciertos,
      errores: responseType === "error" ? prev.errores + 1 : prev.errores,
    }))

    setWaitingForResponseSequential(false)
    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: false,
        lastResponse: mc.id === espId ? responseType : mc.lastResponse,
        status: mc.id === espId ? (responseType === "acierto" ? "Acierto" : "Error") : mc.status,
      })),
    )

    addMessage(
      `ESP-${espId}`,
      "result",
      responseType === "acierto" ? "ACIERTO" : "ERROR",
      responseType === "acierto" ? "success" : "error",
    )

    setTimeout(() => {
      const nextEspId = espId + 1

      if (nextEspId <= 5) {
        console.log(`[v0] Sequential mode: moving to next ESP: ${nextEspId}`)
        setCurrentSequence(nextEspId)
        activateNextMicrocontrollerSequential(nextEspId)
      } else {
        // Completed all 5 ESPs, check if more rounds needed
        setCurrentRound((prevRound) => {
          console.log(
            `[v0] Sequential mode: completed sequence, current round: ${prevRound}, total rounds: ${totalRounds}`,
          )

          if (prevRound < totalRounds) {
            console.log(`[v0] Sequential mode: starting next round: ${prevRound + 1}`)
            limpiarEntreRondasSequential()
            addMessage("SISTEMA", "info", `Iniciando ronda ${prevRound + 1}`, "info")

            setTimeout(() => {
              setCurrentSequence(1)
              activateNextMicrocontrollerSequential(1)
            }, 2000)
            return prevRound + 1
          } else {
            console.log(`[v0] Sequential mode: all rounds completed, finalizing test`)
            addMessage("SISTEMA", "info", "Todas las rondas completadas - Finalizando prueba", "success")
            setTimeout(() => {
              finalizarPruebaSecuencial()
            }, 1000)
            return prevRound
          }
        })
      }
      processingResponseSequentialRef.current = false
    }, 1500)
  }

  const iniciarPruebaAleatoria = async () => {
    if (!cuentaSeleccionada) {
      addMessage("SISTEMA", "error", "Debe seleccionar un jugador", "error")
      return
    }

    try {
      console.log("[v0] Starting random test for account:", cuentaSeleccionada)

      const response = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "aleatorio",
          cuentaId: cuentaSeleccionada,
          duracion: tiempoPrueba,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Random test start response:", data)

      if (data.success) {
        localStorage.setItem("prueba_aleatoria_id", data.data.id.toString())

        setPruebaActualRandom(data.data)
        setTestActiveRandom(true)
        setModoActual("aleatorio")
        setTiempoRestante(tiempoPrueba)
        setEstadisticasRandom({ intentos: 0, aciertos: 0, errores: 0 })

        addMessage("SISTEMA", "info", `Prueba aleatoria iniciada - ${tiempoPrueba} segundos`, "info")

        // Start timer
        const interval = setInterval(() => {
          setTiempoRestante((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              addMessage("SISTEMA", "info", "Tiempo agotado - Finalizando prueba", "warning")
              setTimeout(() => {
                finalizarPruebaAleatoria()
              }, 1000)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        setTimerInterval(interval)

        // Start first random ESP
        setTimeout(() => {
          activateRandomMicrocontroller()
        }, 1000)
      } else {
        addMessage("SISTEMA", "error", "Error iniciando prueba: " + data.message, "error")
      }
    } catch (error) {
      console.error("[v0] Error starting random test:", error)
      addMessage("SISTEMA", "error", `Error iniciando prueba: ${error.message}`, "error")
    }
  }

  const activateRandomMicrocontroller = () => {
    const randomEspId = Math.floor(Math.random() * 5) + 1
    console.log(`[v0] Activating random ESP-${randomEspId}`)

    if (responseTimeoutRandomRef.current) {
      clearTimeout(responseTimeoutRandomRef.current)
      responseTimeoutRandomRef.current = null
    }

    setCurrentActiveESPRandom(randomEspId)
    setWaitingForResponseRandom(true)

    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: mc.id === randomEspId,
        status: mc.id === randomEspId ? "Esperando respuesta" : mc.status,
      })),
    )

    const command = { command: "ON", from: "server" }
    sendCommandToESP(randomEspId, command)

    addMessage(`ESP-${randomEspId}`, "command", JSON.stringify(command), "info")

    responseTimeoutRandomRef.current = setTimeout(() => {
      console.log(`[v0] Random timeout for ESP-${randomEspId}`)
      addMessage(`ESP-${randomEspId}`, "timeout", "Timeout - sin respuesta", "warning")
      handleRandomResponse(randomEspId, "error") // Fixed: used randomEspId instead of espId
    }, 10000)
  }

  const handleRandomResponse = (espId, responseType) => {
    console.log(`[v0] Processing random response from ESP-${espId}: ${responseType}`)

    if (
      !testActiveRandomRef.current ||
      !waitingForResponseRandomRef.current ||
      currentActiveESPRandomRef.current !== espId
    ) {
      console.log(`[v0] Ignoring random response from ESP-${espId} - test not active or not waiting`)
      processingResponseRandomRef.current = false
      return
    }

    if (responseTimeoutRandomRef.current) {
      clearTimeout(responseTimeoutRandomRef.current)
      responseTimeoutRandomRef.current = null
    }

    setEstadisticasRandom((prev) => ({
      intentos: prev.intentos + 1,
      aciertos: responseType === "acierto" ? prev.aciertos + 1 : prev.aciertos,
      errores: responseType === "error" ? prev.errores + 1 : prev.errores,
    }))

    setWaitingForResponseRandom(false)
    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: false,
        lastResponse: mc.id === espId ? responseType : mc.lastResponse,
        status: mc.id === espId ? (responseType === "acierto" ? "Acierto" : "Error") : mc.status,
      })),
    )

    addMessage(
      `ESP-${espId}`,
      "result",
      responseType === "acierto" ? "ACIERTO" : "ERROR",
      responseType === "acierto" ? "success" : "error",
    )

    setTimeout(() => {
      if (testActiveRandomRef.current) {
        console.log(`[v0] Random mode: continuing with another random ESP`)
        activateRandomMicrocontroller()
      } else {
        console.log(`[v0] Random mode: test stopped`)
      }
      processingResponseRandomRef.current = false
    }, 1000)
  }

  const finalizarPruebaSecuencial = async () => {
    const pruebaId = localStorage.getItem("prueba_secuencial_id")

    if (pruebaId) {
      try {
        console.log("[v0] Finalizing sequential test:", pruebaId)

        const response = await fetch(`${BACKEND_URL}/api/pruebas/finalizar/${pruebaId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cantidad_intentos: estadisticasSequential.intentos,
            cantidad_aciertos: estadisticasSequential.aciertos,
            cantidad_errores: estadisticasSequential.errores,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("[v0] Sequential test finalization response:", data)

        if (data.success) {
          addMessage("SISTEMA", "info", "Prueba secuencial finalizada correctamente", "success")
          localStorage.removeItem("prueba_secuencial_id")
        } else {
          addMessage("SISTEMA", "error", "Error finalizando prueba: " + data.message, "error")
        }
      } catch (error) {
        console.error("[v0] Error finalizing sequential test:", error)
        addMessage("SISTEMA", "error", `Error finalizando prueba: ${error.message}`, "error")
      }
    }

    limpiarPruebaSecuencial()
  }

  const finalizarPruebaAleatoria = async () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }

    const pruebaId = localStorage.getItem("prueba_aleatoria_id")

    if (pruebaId) {
      try {
        console.log("[v0] Finalizing random test:", pruebaId)

        const response = await fetch(`${BACKEND_URL}/api/pruebas/finalizar/${pruebaId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cantidad_intentos: estadisticasRandom.intentos,
            cantidad_aciertos: estadisticasRandom.aciertos,
            cantidad_errores: estadisticasRandom.errores,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("[v0] Random test finalization response:", data)

        if (data.success) {
          addMessage("SISTEMA", "info", "Prueba aleatoria finalizada correctamente", "success")
          localStorage.removeItem("prueba_aleatoria_id")
        } else {
          addMessage("SISTEMA", "error", "Error finalizando prueba: " + data.message, "error")
        }
      } catch (error) {
        console.error("[v0] Error finalizing random test:", error)
        addMessage("SISTEMA", "error", `Error finalizando prueba: ${error.message}`, "error")
      }
    }

    limpiarPruebaAleatoria()
  }

  const limpiarPruebaSecuencial = () => {
    setTestActiveSequential(false)
    setCurrentActiveESPSequential(null)
    setWaitingForResponseSequential(false)
    setCurrentRound(0)
    setCurrentSequence(0)
    setPruebaActualSequential(null)
    setEstadisticasSequential({ intentos: 0, aciertos: 0, errores: 0 })

    if (responseTimeoutSequentialRef.current) {
      clearTimeout(responseTimeoutSequentialRef.current)
      responseTimeoutSequentialRef.current = null
    }

    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: false,
        status: "",
        lastResponse: null,
      })),
    )

    processingResponseSequentialRef.current = false
    addMessage("SISTEMA", "info", "Sistema limpio para nueva prueba secuencial", "info")
  }

  const limpiarPruebaAleatoria = () => {
    setTestActiveRandom(false)
    setCurrentActiveESPRandom(null)
    setWaitingForResponseRandom(false)
    setPruebaActualRandom(null)
    setEstadisticasRandom({ intentos: 0, aciertos: 0, errores: 0 })

    setTiempoRestante(0)
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }

    if (responseTimeoutRandomRef.current) {
      clearTimeout(responseTimeoutRandomRef.current)
      responseTimeoutRandomRef.current = null
    }

    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: false,
        status: "",
        lastResponse: null,
      })),
    )

    processingResponseRandomRef.current = false
    addMessage("SISTEMA", "info", "Sistema limpio para nueva prueba aleatoria", "info")
  }

  const limpiarEntreRondasSequential = () => {
    setCurrentActiveESPSequential(null)
    setWaitingForResponseSequential(false)
    setCurrentSequence(0)

    if (responseTimeoutSequentialRef.current) {
      clearTimeout(responseTimeoutSequentialRef.current)
      responseTimeoutSequentialRef.current = null
    }

    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: false,
        status: "",
        lastResponse: null,
      })),
    )

    processingResponseSequentialRef.current = false
    addMessage("SISTEMA", "info", `Limpieza entre rondas completada`, "info")
  }

  const iniciarPruebaManual = async () => {
    if (!cuentaSeleccionada) {
      addMessage("SISTEMA", "error", "Debe seleccionar un jugador", "error")
      return
    }

    try {
      console.log("[v0] Starting manual test")

      const response = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cuentaId: Number.parseInt(cuentaSeleccionada),
          tipo: "manual",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Manual test start response:", data)

      if (data.success) {
        localStorage.setItem("prueba_manual_id", data.data.id.toString())

        setPruebaActualManual(data.data)
        setTestActiveManual(true)
        setModoActual("manual")
        setEstadisticasManual({ intentos: 0, aciertos: 0, errores: 0 })

        addMessage("SISTEMA", "info", "Prueba manual iniciada - Presiona cualquier ESP para enviar comando", "info")
      } else {
        addMessage("SISTEMA", "error", "Error iniciando prueba: " + data.message, "error")
      }
    } catch (error) {
      console.error("[v0] Error starting manual test:", error)
      addMessage("SISTEMA", "error", `Error iniciando prueba: ${error.message}`, "error")
    }
  }

  const activateManualMicrocontroller = (espId) => {
    if (!testActiveManualRef.current || waitingForResponseManualRef.current) {
      console.log(`[v0] Cannot activate ESP-${espId} - test not active or waiting for response`)
      return
    }

    console.log(`[v0] Activating manual ESP-${espId}`)

    if (responseTimeoutManualRef.current) {
      clearTimeout(responseTimeoutManualRef.current)
      responseTimeoutManualRef.current = null
    }

    setCurrentActiveESPManual(espId)
    setWaitingForResponseManual(true)

    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: mc.id === espId,
        status: mc.id === espId ? "Esperando respuesta" : mc.status,
      })),
    )

    const command = { command: "ON", from: "server" }
    sendCommandToESP(espId, command)

    addMessage(`ESP-${espId}`, "command", JSON.stringify(command), "info")

    responseTimeoutManualRef.current = setTimeout(() => {
      console.log(`[v0] Manual timeout for ESP-${espId}`)
      addMessage(`ESP-${espId}`, "timeout", "Timeout - sin respuesta", "warning")
      handleManualResponse(espId, "error")
    }, 10000)
  }

  const handleManualResponse = (espId, responseType) => {
    console.log(`[v0] Processing manual response from ESP-${espId}: ${responseType}`)

    if (
      !testActiveManualRef.current ||
      !waitingForResponseManualRef.current ||
      currentActiveESPManualRef.current !== espId
    ) {
      console.log(`[v0] Ignoring manual response from ESP-${espId} - test not active or not waiting`)
      processingResponseManualRef.current = false
      return
    }

    if (responseTimeoutManualRef.current) {
      clearTimeout(responseTimeoutManualRef.current)
      responseTimeoutManualRef.current = null
    }

    setEstadisticasManual((prev) => ({
      intentos: prev.intentos + 1,
      aciertos: responseType === "acierto" ? prev.aciertos + 1 : prev.aciertos,
      errores: responseType === "error" ? prev.errores + 1 : prev.errores,
    }))

    setWaitingForResponseManual(false)
    setCurrentActiveESPManual(null)
    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: false,
        lastResponse: mc.id === espId ? responseType : mc.lastResponse,
        status: mc.id === espId ? (responseType === "acierto" ? "Acierto" : "Error") : mc.status,
      })),
    )

    addMessage(
      `ESP-${espId}`,
      "result",
      responseType === "acierto" ? "ACIERTO" : "ERROR",
      responseType === "acierto" ? "success" : "error",
    )

    processingResponseManualRef.current = false
  }

  const finalizarPruebaManual = async () => {
    const pruebaId = localStorage.getItem("prueba_manual_id")

    if (pruebaId) {
      try {
        console.log("[v0] Finalizing manual test:", pruebaId)

        const response = await fetch(`${BACKEND_URL}/api/pruebas/finalizar/${pruebaId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cantidad_intentos: estadisticasManual.intentos,
            cantidad_aciertos: estadisticasManual.aciertos,
            cantidad_errores: estadisticasManual.errores,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("[v0] Manual test finalization response:", data)

        if (data.success) {
          addMessage("SISTEMA", "info", "Prueba manual finalizada correctamente", "success")
          localStorage.removeItem("prueba_manual_id")
        } else {
          addMessage("SISTEMA", "error", "Error finalizando prueba: " + data.message, "error")
        }
      } catch (error) {
        console.error("[v0] Error finalizing manual test:", error)
        addMessage("SISTEMA", "error", `Error finalizando prueba: ${error.message}`, "error")
      }
    }

    limpiarSistemaManual()
  }

  const limpiarSistemaManual = () => {
    setTestActiveManual(false)
    setCurrentActiveESPManual(null)
    setWaitingForResponseManual(false)
    setPruebaActualManual(null)
    setEstadisticasManual({ intentos: 0, aciertos: 0, errores: 0 })

    if (responseTimeoutManualRef.current) {
      clearTimeout(responseTimeoutManualRef.current)
      responseTimeoutManualRef.current = null
    }

    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: false,
        status: "",
        lastResponse: null,
      })),
    )

    processingResponseManualRef.current = false
    addMessage("SISTEMA", "info", "Sistema limpio para nueva prueba manual", "info")
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const testActive = testActiveSequential || testActiveRandom || testActiveManual
  const currentActiveESP = testActiveSequential
    ? currentActiveESPSequential
    : testActiveRandom
      ? currentActiveESPRandom
      : currentActiveESPManual
  const estadisticas = testActiveSequential
    ? estadisticasSequential
    : testActiveRandom
      ? estadisticasRandom
      : estadisticasManual

  return (
    <div className="space-y-6 p-6">
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
              {/* Información de Contacto */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1">
                  Información de Contacto
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

              {/* Información del Jugador */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1">
                  Información del Jugador
                </h3>

                <div className="space-y-2">
                  {jugadorSeleccionado.jugador.posicion_principal && (
                    <div className="bg-red-50/80 px-3 py-2 rounded-lg border border-red-200/50">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-red-800">Posición Principal</p>
                          <p className="text-xs text-red-700 capitalize">
                            {jugadorSeleccionado.jugador.posicion_principal}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {jugadorSeleccionado.jugador.altura && (
                    <div className="bg-red-50/80 px-3 py-2 rounded-lg border border-red-200/50">
                      <div className="flex items-center space-x-2">
                        <Ruler className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-red-800">Altura</p>
                          <p className="text-xs text-red-700">{jugadorSeleccionado.jugador.altura} m</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {testActive && (
        <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Activity className="h-5 w-5" />
              Progreso de la prueba
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Tipo de Prueba</p>
                <p className="text-lg font-bold text-blue-900 capitalize">{modoActual}</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Intentos</p>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.intentos}</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                <p className="text-xs text-gray-600 mb-1">Aciertos</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.aciertos}</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200">
                <p className="text-xs text-gray-600 mb-1">Errores</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.errores}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-3 bg-white/60 rounded-lg border border-blue-200">
              {modoActual === "secuencial" ? (
                <>
                  <Badge variant="outline" className="bg-white">
                    Ronda {currentRound}/{totalRounds}
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    Secuencia {currentSequence}/5
                  </Badge>
                </>
              ) : modoActual === "aleatorio" ? (
                <>
                  <Badge variant="outline" className="flex items-center gap-1 bg-white">
                    <Clock className="h-3 w-3" />
                    {formatTime(tiempoRestante)}
                  </Badge>
                </>
              ) : (
                <>
                  {waitingForResponseManual && (
                    <Badge className="bg-orange-100 text-orange-800">Esperando respuesta...</Badge>
                  )}
                </>
              )}
              {currentActiveESP && <Badge className="bg-green-100 text-green-800">ESP-{currentActiveESP} Activo</Badge>}
              {estadisticas.intentos > 0 && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  Precisión: {Math.round((estadisticas.aciertos / estadisticas.intentos) * 100)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Configuración de Pruebas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="secuencial" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="secuencial" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Secuencial
              </TabsTrigger>
              <TabsTrigger value="aleatorio" className="flex items-center gap-2">
                <Shuffle className="h-4 w-4" />
                Aleatorio
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Hand className="h-4 w-4" />
                Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="secuencial" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="jugador">Seleccionar Jugador</Label>
                  <Select value={cuentaSeleccionada} onValueChange={setCuentaSeleccionada} disabled={testActive}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          jugadoresDisponibles.length === 0
                            ? "No hay jugadores disponibles..."
                            : "Seleccionar jugador..."
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
                  <div className="text-sm text-gray-500 mt-1">
                    {jugadoresDisponibles.length} jugador(es) disponible(s)
                  </div>
                </div>

                <div>
                  <Label htmlFor="rondas">Número de Rondas</Label>
                  <Input
                    id="rondas"
                    type="number"
                    min="1"
                    max="10"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(Number.parseInt(e.target.value) || 1)}
                    disabled={testActive}
                  />
                </div>

                <div className="flex items-end">
                  {!testActiveSequential ? (
                    <Button
                      onClick={iniciarPruebaSecuencial}
                      disabled={!cuentaSeleccionada || testActiveRandom || testActiveManual}
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar Prueba Secuencial
                    </Button>
                  ) : (
                    <Button onClick={finalizarPruebaSecuencial} variant="destructive" className="w-full">
                      <Square className="h-4 w-4 mr-2" />
                      Finalizar Prueba
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="aleatorio" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="jugador-aleatorio">Seleccionar Jugador</Label>
                  <Select value={cuentaSeleccionada} onValueChange={setCuentaSeleccionada} disabled={testActive}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          jugadoresDisponibles.length === 0
                            ? "No hay jugadores disponibles..."
                            : "Seleccionar jugador..."
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
                  <div className="text-sm text-gray-500 mt-1">
                    {jugadoresDisponibles.length} jugador(es) disponible(s)
                  </div>
                </div>

                <div>
                  <Label htmlFor="tiempo">Tiempo (segundos)</Label>
                  <Input
                    id="tiempo"
                    type="number"
                    min="30"
                    max="300"
                    value={tiempoPrueba}
                    onChange={(e) => setTiempoPrueba(Number.parseInt(e.target.value) || 60)}
                    disabled={testActive}
                  />
                </div>

                <div className="flex items-end">
                  {!testActiveRandom ? (
                    <Button
                      onClick={iniciarPruebaAleatoria}
                      disabled={!cuentaSeleccionada || testActiveSequential || testActiveManual}
                      className="w-full"
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                      Iniciar Prueba Aleatoria
                    </Button>
                  ) : (
                    <Button onClick={finalizarPruebaAleatoria} variant="destructive" className="w-full">
                      <Square className="h-4 w-4 mr-2" />
                      Finalizar Prueba
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jugador-manual">Seleccionar Jugador</Label>
                  <Select value={cuentaSeleccionada} onValueChange={setCuentaSeleccionada} disabled={testActive}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          jugadoresDisponibles.length === 0
                            ? "No hay jugadores disponibles..."
                            : "Seleccionar jugador..."
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
                  <div className="text-sm text-gray-500 mt-1">
                    {jugadoresDisponibles.length} jugador(es) disponible(s)
                  </div>
                </div>

                <div className="flex items-end">
                  {!testActiveManual ? (
                    <Button
                      onClick={iniciarPruebaManual}
                      disabled={!cuentaSeleccionada || testActiveSequential || testActiveRandom}
                      className="w-full"
                    >
                      <Hand className="h-4 w-4 mr-2" />
                      Iniciar Prueba Manual
                    </Button>
                  ) : (
                    <Button onClick={finalizarPruebaManual} variant="destructive" className="w-full">
                      <Square className="h-4 w-4 mr-2" />
                      Finalizar Prueba
                    </Button>
                  )}
                </div>
              </div>

              {testActiveManual && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Modo Manual:</strong> Presiona cualquier ESP para enviar comando. Debes esperar la respuesta
                    antes de poder enviar otro comando.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Estado de Microcontroladores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {microControllers.map((mc) => (
              <Card
                key={mc.id}
                className={`transition-all duration-200 ${
                  mc.connected
                    ? mc.active
                      ? "border-blue-500 bg-blue-50"
                      : "border-green-500 bg-green-50"
                    : "border-gray-300 bg-gray-50"
                } ${
                  testActiveManual && mc.connected && !waitingForResponseManual
                    ? "cursor-pointer hover:shadow-md hover:scale-105"
                    : ""
                }`}
                onClick={() => {
                  if (testActiveManual && mc.connected && !waitingForResponseManual) {
                    activateManualMicrocontroller(mc.id)
                  }
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    ESP-{mc.id}
                    <div className="flex items-center gap-1">
                      {mc.connected && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                      {mc.active && <Badge className="bg-green-100 text-green-800">ESP-{mc.id} Activo</Badge>}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-xs">
                    <div>Estado: {mc.connected ? "Conectado" : "Desconectado"}</div>
                    {mc.status && (
                      <div>
                        Status:{" "}
                        <span
                          className={
                            mc.status === "Acierto"
                              ? "text-green-600 font-medium"
                              : mc.status === "Error"
                                ? "text-red-600 font-medium"
                                : "text-gray-600"
                          }
                        >
                          {mc.status}
                        </span>
                      </div>
                    )}
                    {testActiveManual && mc.connected && (
                      <div className="text-blue-600 font-medium">
                        {waitingForResponseManual ? "Esperando..." : "Clic para enviar"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
