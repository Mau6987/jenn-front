"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle, X, Users, Play, Clock, List, Shuffle, Hand } from "lucide-react"

const BACKEND_URL = "https://voley-backend-nhyl.onrender.com"

export default function PruebasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notification, setNotification] = useState(null)

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

  // Manual mode variables
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

  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0)
  const [timerGeneralInterval, setTimerGeneralInterval] = useState(null)

  const [microControllers, setMicroControllers] = useState([
    { id: 1, label: "A", active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
    { id: 2, label: "B", active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
    { id: 3, label: "C", active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
    { id: 4, label: "D", active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
    { id: 5, label: "E", active: false, connected: false, lastSeen: null, lastResponse: null, status: "" },
  ])

  const [pusherConnected, setPusherConnected] = useState(false)
  const [pusherStatus, setPusherStatus] = useState("Desconectado")
  const [espResponses, setEspResponses] = useState([])

  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [jugadores, setJugadores] = useState([])

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
    fetchJugadores()
    loadPusher()
  }, [])

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
      if (timerGeneralInterval) {
        clearInterval(timerGeneralInterval)
      }
    }
  }, [timerInterval, timerGeneralInterval])

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const fetchJugadores = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const response = await fetch("https://voley-backend-nhyl.onrender.com/api/cuentas", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar jugadores")
      }

      if (data.success) {
        const jugadores = data.data
          .filter((cuenta) => cuenta.rol === "jugador" && cuenta.jugador)
          .map((cuenta) => ({
            ...cuenta.jugador,
            id: cuenta.jugador.id,
            usuario: cuenta.usuario,
            cuentaId: cuenta.id,
          }))

        setJugadores(jugadores)
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("error", "Error al cargar jugadores")
    } finally {
      setLoading(false)
    }
  }

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null
    const birthDate = new Date(fechaNacimiento)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

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
        setMicroControllers((prev) =>
          prev.map((mc) => (mc.id === i ? { ...mc, connected: true, lastSeen: new Date() } : mc)),
        )
      })

      channel.bind("client-response", (data) => {
        const espId = Number.parseInt(channelName.split("-").pop())
        const responseMessage = data.message?.toLowerCase() || ""

        setMicroControllers((prev) =>
          prev.map((mc) => (mc.id === espId ? { ...mc, connected: true, lastSeen: new Date() } : mc)),
        )

        // Sequential mode response handling
        if (
          testActiveSequentialRef.current &&
          waitingForResponseSequentialRef.current &&
          currentActiveESPSequentialRef.current === espId
        ) {
          if (processingResponseSequentialRef.current) return

          processingResponseSequentialRef.current = true

          if (responseMessage.includes("acierto") || responseMessage.includes("success")) {
            handleSequentialResponse(espId, "acierto")
          } else {
            handleSequentialResponse(espId, "error")
          }
        }
        // Random mode response handling
        else if (
          testActiveRandomRef.current &&
          waitingForResponseRandomRef.current &&
          currentActiveESPRandomRef.current === espId
        ) {
          if (processingResponseRandomRef.current) return

          processingResponseRandomRef.current = true

          if (responseMessage.includes("acierto") || responseMessage.includes("success")) {
            handleRandomResponse(espId, "acierto")
          } else {
            handleRandomResponse(espId, "error")
          }
        }
        // Manual mode response handling
        else if (
          testActiveManualRef.current &&
          waitingForResponseManualRef.current &&
          currentActiveESPManualRef.current === espId
        ) {
          if (processingResponseManualRef.current) return

          processingResponseManualRef.current = true

          if (responseMessage.includes("acierto") || responseMessage.includes("success")) {
            handleManualResponse(espId, "acierto")
          } else {
            handleManualResponse(espId, "error")
          }
        }
      })
    }
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
    } catch (error) {
      console.error(`Error sending command to ESP-${espId}:`, error)
    }
  }

  const iniciarCronometroGeneral = () => {
    setTiempoTranscurrido(0)
    const interval = setInterval(() => {
      setTiempoTranscurrido((prev) => prev + 1)
    }, 1000)
    setTimerGeneralInterval(interval)
  }

  const detenerCronometroGeneral = () => {
    if (timerGeneralInterval) {
      clearInterval(timerGeneralInterval)
      setTimerGeneralInterval(null)
    }
  }

  const iniciarPruebaSecuencial = async () => {
    if (!selectedPlayer) {
      showNotification("error", "Debe seleccionar un jugador")
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "secuencial",
          cuentaId: selectedPlayer.cuentaId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("prueba_secuencial_id", data.data.id.toString())

        setPruebaActualSequential(data.data)
        setTestActiveSequential(true)
        setModoActual("secuencial")
        setCurrentRound(1)
        setCurrentSequence(1)
        setEstadisticasSequential({ intentos: 0, aciertos: 0, errores: 0 })

        iniciarCronometroGeneral()

        showNotification("success", `Prueba secuencial iniciada - ${totalRounds} rondas`)

        setTimeout(() => {
          activateNextMicrocontrollerSequential(1)
        }, 1000)
      } else {
        showNotification("error", "Error iniciando prueba: " + data.message)
      }
    } catch (error) {
      console.error("Error starting sequential test:", error)
      showNotification("error", "Error iniciando prueba")
    }
  }

  const activateNextMicrocontrollerSequential = (espId) => {
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

    responseTimeoutSequentialRef.current = setTimeout(() => {
      handleSequentialResponse(espId, "error")
    }, 10000)
  }

  const handleSequentialResponse = (espId, responseType) => {
    if (
      !testActiveSequentialRef.current ||
      !waitingForResponseSequentialRef.current ||
      currentActiveESPSequentialRef.current !== espId
    ) {
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

    setTimeout(() => {
      const nextEspId = espId + 1

      if (nextEspId <= 5) {
        setCurrentSequence(nextEspId)
        activateNextMicrocontrollerSequential(nextEspId)
      } else {
        setCurrentRound((prevRound) => {
          if (prevRound < totalRounds) {
            limpiarEntreRondasSequential()
            showNotification("success", `Iniciando ronda ${prevRound + 1}`)

            setTimeout(() => {
              setCurrentSequence(1)
              activateNextMicrocontrollerSequential(1)
            }, 2000)
            return prevRound + 1
          } else {
            showNotification("success", "Todas las rondas completadas")
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

  const finalizarPruebaSecuencial = async () => {
    detenerCronometroGeneral()

    const pruebaId = localStorage.getItem("prueba_secuencial_id")

    if (pruebaId) {
      try {
        await fetch(`${BACKEND_URL}/api/pruebas/finalizar/${pruebaId}`, {
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

        localStorage.removeItem("prueba_secuencial_id")
        showNotification("success", "Prueba secuencial finalizada correctamente")
      } catch (error) {
        console.error("Error finalizing sequential test:", error)
      }
    }

    limpiarPruebaSecuencial()
  }

  const limpiarPruebaSecuencial = () => {
    setTestActiveSequential(false)
    setCurrentActiveESPSequential(null)
    setWaitingForResponseSequential(false)
    setCurrentRound(0)
    setCurrentSequence(0)
    setPruebaActualSequential(null)
    setEstadisticasSequential({ intentos: 0, aciertos: 0, errores: 0 })

    setTiempoTranscurrido(0)

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
  }

  const iniciarPruebaAleatoria = async () => {
    if (!selectedPlayer) {
      showNotification("error", "Debe seleccionar un jugador")
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "aleatorio",
          cuentaId: selectedPlayer.cuentaId,
          duracion: tiempoPrueba,
        }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("prueba_aleatoria_id", data.data.id.toString())

        setPruebaActualRandom(data.data)
        setTestActiveRandom(true)
        setModoActual("aleatorio")
        setTiempoRestante(tiempoPrueba)
        setEstadisticasRandom({ intentos: 0, aciertos: 0, errores: 0 })

        iniciarCronometroGeneral()

        showNotification("success", `Prueba aleatoria iniciada - ${tiempoPrueba} segundos`)

        const interval = setInterval(() => {
          setTiempoRestante((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              showNotification("success", "Tiempo agotado - Finalizando prueba")
              setTimeout(() => {
                finalizarPruebaAleatoria()
              }, 1000)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        setTimerInterval(interval)

        setTimeout(() => {
          activateRandomMicrocontroller()
        }, 1000)
      } else {
        showNotification("error", "Error iniciando prueba: " + data.message)
      }
    } catch (error) {
      console.error("Error starting random test:", error)
      showNotification("error", "Error iniciando prueba")
    }
  }

  const activateRandomMicrocontroller = () => {
    const randomEspId = Math.floor(Math.random() * 5) + 1

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

    responseTimeoutRandomRef.current = setTimeout(() => {
      handleRandomResponse(randomEspId, "error")
    }, 10000)
  }

  const handleRandomResponse = (espId, responseType) => {
    if (
      !testActiveRandomRef.current ||
      !waitingForResponseRandomRef.current ||
      currentActiveESPRandomRef.current !== espId
    ) {
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

    setTimeout(() => {
      if (testActiveRandomRef.current) {
        activateRandomMicrocontroller()
      }
      processingResponseRandomRef.current = false
    }, 1000)
  }

  const finalizarPruebaAleatoria = async () => {
    detenerCronometroGeneral()

    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }

    const pruebaId = localStorage.getItem("prueba_aleatoria_id")

    if (pruebaId) {
      try {
        await fetch(`${BACKEND_URL}/api/pruebas/finalizar/${pruebaId}`, {
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

        localStorage.removeItem("prueba_aleatoria_id")
        showNotification("success", "Prueba aleatoria finalizada correctamente")
      } catch (error) {
        console.error("Error finalizing random test:", error)
      }
    }

    limpiarPruebaAleatoria()
  }

  const limpiarPruebaAleatoria = () => {
    setTestActiveRandom(false)
    setCurrentActiveESPRandom(null)
    setWaitingForResponseRandom(false)
    setPruebaActualRandom(null)
    setEstadisticasRandom({ intentos: 0, aciertos: 0, errores: 0 })

    setTiempoRestante(0)
    setTiempoTranscurrido(0)

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
  }

  const iniciarPruebaManual = async () => {
    if (!selectedPlayer) {
      showNotification("error", "Debe seleccionar un jugador")
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cuentaId: selectedPlayer.cuentaId,
          tipo: "manual",
        }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("prueba_manual_id", data.data.id.toString())

        setPruebaActualManual(data.data)
        setTestActiveManual(true)
        setModoActual("manual")
        setEstadisticasManual({ intentos: 0, aciertos: 0, errores: 0 })

        iniciarCronometroGeneral()

        showNotification("success", "Prueba manual iniciada - Presiona cualquier ESP para enviar comando")
      } else {
        showNotification("error", "Error iniciando prueba: " + data.message)
      }
    } catch (error) {
      console.error("Error starting manual test:", error)
      showNotification("error", "Error iniciando prueba")
    }
  }

  const activateManualMicrocontroller = (espId) => {
    if (!testActiveManualRef.current || waitingForResponseManualRef.current) {
      return
    }

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

    responseTimeoutManualRef.current = setTimeout(() => {
      handleManualResponse(espId, "error")
    }, 10000)
  }

  const handleManualResponse = (espId, responseType) => {
    if (
      !testActiveManualRef.current ||
      !waitingForResponseManualRef.current ||
      currentActiveESPManualRef.current !== espId
    ) {
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

    processingResponseManualRef.current = false
  }

  const finalizarPruebaManual = async () => {
    detenerCronometroGeneral()

    const pruebaId = localStorage.getItem("prueba_manual_id")

    if (pruebaId) {
      try {
        await fetch(`${BACKEND_URL}/api/pruebas/finalizar/${pruebaId}`, {
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

        localStorage.removeItem("prueba_manual_id")
        showNotification("success", "Prueba manual finalizada correctamente")
      } catch (error) {
        console.error("Error finalizing manual test:", error)
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

    setTiempoTranscurrido(0)

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
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getMicroImage = (mc) => {
    const testActive = testActiveSequential || testActiveRandom || testActiveManual

    if (!testActive) {
      return "/gris.png"
    }

    if (mc.active) {
      return "/azul.png"
    }

    if (mc.lastResponse === "acierto") {
      return "/verde.png"
    }

    if (mc.lastResponse === "error") {
      return "/rojo.png"
    }

    return "/gris.png"
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
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-fade-in">
          <div
            className={`rounded-xl shadow-lg p-4 flex items-center min-w-80 ${
              notification.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
            )}
            <span
              className={`font-medium text-sm ${notification.type === "success" ? "text-green-800" : "text-red-800"}`}
            >
              {notification.message}
            </span>
            <button
              onClick={() => setNotification(null)}
              className={`ml-4 ${notification.type === "success" ? "text-green-600 hover:text-green-800" : "text-red-600 hover:text-red-800"}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-900 via-red-800 to-red-900 bg-clip-text text-transparent mb-2">
              Pruebas de Rendimiento
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-red-800 to-transparent mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Sistema de evaluación de jugadores</p>
          </div>

          {/* Player Selection */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">Seleccionar Jugador</h2>
            <select
              value={selectedPlayer?.id || ""}
              onChange={(e) => {
                const player = jugadores.find((j) => j.id === Number.parseInt(e.target.value))
                setSelectedPlayer(player)
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-900 focus:border-transparent"
              disabled={testActive}
            >
              <option value="">Selecciona un jugador</option>
              {jugadores.map((jugador) => (
                <option key={jugador.id} value={jugador.id}>
                  {jugador.nombres} {jugador.apellidos} - {jugador.posicion_principal}
                </option>
              ))}
            </select>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column: Player Info */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">Datos del Jugador</h2>
              {selectedPlayer ? (
                <div className="flex gap-6">
                  {/* Left side: Photo and name */}
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-red-900 shadow-lg mb-2">
                      {selectedPlayer.imagen ? (
                        <img
                          src={selectedPlayer.imagen || "/placeholder.svg"}
                          alt={`${selectedPlayer.nombres} ${selectedPlayer.apellidos}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 text-center">
                      {selectedPlayer.nombres} {selectedPlayer.apellidos}
                    </p>
                  </div>

                  {/* Right side: Data fields stacked vertically */}
                  <div className="flex-1 space-y-3">
                    {selectedPlayer.fecha_nacimiento && (
                      <div className="bg-gray-50 px-3 py-2 rounded border">
                        <p className="text-xs text-gray-500 mb-1">Edad</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {calcularEdad(selectedPlayer.fecha_nacimiento)} años
                        </p>
                      </div>
                    )}
                    <div className="bg-gray-50 px-3 py-2 rounded border">
                      <p className="text-xs text-gray-500 mb-1">Carrera</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedPlayer.carrera}</p>
                    </div>
                    <div className="bg-gray-50 px-3 py-2 rounded border">
                      <p className="text-xs text-gray-500 mb-1">Posición</p>
                      <p className="text-sm font-semibold text-red-700 capitalize">
                        {selectedPlayer.posicion_principal}
                      </p>
                    </div>
                    <div className="bg-gray-50 px-3 py-2 rounded border">
                      <p className="text-xs text-gray-500 mb-1">Altura</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedPlayer.altura} m</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No hay jugador seleccionado</p>
                </div>
              )}
            </div>

            {/* Right Column: Test Progress */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">Progreso de la Prueba</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-300">
                    <p className="text-xs text-gray-600 mb-1 text-center">tipo de prueba</p>
                    <p className="text-lg font-bold text-blue-900 capitalize text-center flex items-center justify-center gap-2">
                      {modoActual === "secuencial" && <List className="h-5 w-5" />}
                      {modoActual === "aleatorio" && <Shuffle className="h-5 w-5" />}
                      {modoActual === "manual" && <Hand className="h-5 w-5" />}
                      {modoActual}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-300">
                    <p className="text-xs text-gray-600 mb-2 text-center font-semibold">Intentos aciertos y errores</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Int</p>
                        <p className="text-lg font-bold text-blue-600">{estadisticas.intentos}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Aci</p>
                        <p className="text-lg font-bold text-green-600">{estadisticas.aciertos}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Err</p>
                        <p className="text-lg font-bold text-red-600">{estadisticas.errores}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-300">
                  <p className="text-xs text-gray-600 mb-3 text-center font-semibold">
                    cronometro, y datos del progreso de la prueba
                  </p>
                  <div className="space-y-2">
                    {testActive && (
                      <div className="flex justify-center mb-3">
                        <div className="bg-white px-6 py-3 rounded-lg border-2 border-blue-300 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-6 w-6 text-blue-600" />
                            <span className="text-3xl font-bold text-blue-900">{formatTime(tiempoTranscurrido)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {modoActual === "secuencial" && testActive && (
                      <>
                        <div className="flex justify-between items-center bg-white px-3 py-2 rounded border">
                          <span className="text-sm text-gray-600">Ronda:</span>
                          <span className="text-sm font-bold">
                            {currentRound}/{totalRounds}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-white px-3 py-2 rounded border">
                          <span className="text-sm text-gray-600">Secuencia:</span>
                          <span className="text-sm font-bold">{currentSequence}/5</span>
                        </div>
                      </>
                    )}

                    {currentActiveESP && testActive && (
                      <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded border border-green-200">
                        <span className="text-sm text-gray-600">ESP Activo:</span>
                        <span className="text-sm font-bold text-green-600">ESP-{currentActiveESP}</span>
                      </div>
                    )}

                    {!testActive && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No hay prueba activa</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Configuration */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">Configuración de Pruebas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Prueba</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setModoActual("secuencial")}
                    disabled={testActive}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      modoActual === "secuencial"
                        ? "bg-red-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } disabled:opacity-50`}
                  >
                    <List className="h-4 w-4" />
                    <span>Secuencial</span>
                  </button>
                  <button
                    onClick={() => setModoActual("aleatorio")}
                    disabled={testActive}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      modoActual === "aleatorio"
                        ? "bg-red-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } disabled:opacity-50`}
                  >
                    <Shuffle className="h-4 w-4" />
                    <span>Aleatorio</span>
                  </button>
                  <button
                    onClick={() => setModoActual("manual")}
                    disabled={testActive}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      modoActual === "manual" ? "bg-red-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } disabled:opacity-50`}
                  >
                    <Hand className="h-4 w-4" />
                    <span>Manual</span>
                  </button>
                </div>
              </div>

              {modoActual === "secuencial" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Rondas</label>
                  <input
                    type="number"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(Number.parseInt(e.target.value) || 1)}
                    min="1"
                    max="10"
                    disabled={testActive}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              )}

              {modoActual === "aleatorio" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tiempo (segundos)</label>
                  <input
                    type="number"
                    value={tiempoPrueba}
                    onChange={(e) => setTiempoPrueba(Number.parseInt(e.target.value) || 60)}
                    min="30"
                    max="300"
                    disabled={testActive}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              )}

              <div className="flex items-end">
                {!testActive ? (
                  <button
                    onClick={() => {
                      if (modoActual === "secuencial") iniciarPruebaSecuencial()
                      else if (modoActual === "aleatorio") iniciarPruebaAleatoria()
                      else iniciarPruebaManual()
                    }}
                    className="w-full px-6 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors font-semibold flex items-center justify-center space-x-2"
                  >
                    <Play className="h-5 w-5" />
                    <span>Iniciar Prueba</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (modoActual === "secuencial") finalizarPruebaSecuencial()
                      else if (modoActual === "aleatorio") finalizarPruebaAleatoria()
                      else finalizarPruebaManual()
                    }}
                    className="w-full px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    Finalizar Prueba
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Microcontroller Status */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wide">
              Estado de Microcontroladores
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {microControllers.map((mc, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center space-y-3 ${
                    testActiveManual && mc.connected && !waitingForResponseManual ? "cursor-pointer" : ""
                  }`}
                  onClick={() => {
                    if (testActiveManual && mc.connected && !waitingForResponseManual) {
                      activateManualMicrocontroller(mc.id)
                    }
                  }}
                >
                  <div
                    className={`w-full aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-300 ${
                      !testActive
                        ? "border-gray-300"
                        : mc.active
                          ? "border-blue-500 animate-pulse"
                          : mc.lastResponse === "acierto"
                            ? "border-green-500"
                            : mc.lastResponse === "error"
                              ? "border-red-500"
                              : "border-gray-300"
                    }`}
                  >
                    <img
                      src={getMicroImage(mc) || "/placeholder.svg"}
                      alt={`ESP-${mc.id}`}
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900">ESP-{mc.id}</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {!testActive
                        ? "Esperando"
                        : mc.active
                          ? "Procesando..."
                          : mc.lastResponse === "acierto"
                            ? "Correcto"
                            : mc.lastResponse === "error"
                              ? "Incorrecto"
                              : "Esperando"}
                    </p>
                  </div>
                  {testActiveManual && mc.connected && (
                    <button
                      onClick={() => activateManualMicrocontroller(mc.id)}
                      disabled={waitingForResponseManual}
                      className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Enviar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
