"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Play, Square, Target, Hand, CheckCircle, XCircle, Clock, Zap, User, Activity, Cpu, Wifi } from "lucide-react"

export default function PruebasPage() {
  // State management
  const [players, setPlayers] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [testMode, setTestMode] = useState("secuencial")
  const [testStatus, setTestStatus] = useState("idle")
  const [currentTest, setCurrentTest] = useState(null)

  // Test configuration
  const [rounds, setRounds] = useState(1)
  const [duration, setDuration] = useState(60) // seconds for random mode
  const [manualSequence, setManualSequence] = useState("")

  // Test execution state
  const [currentRound, setCurrentRound] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [results, setResults] = useState({ aciertos: 0, errores: 0 })
  const [startTime, setStartTime] = useState(null)

  // Microcontrollers state
  const [microControllers, setMicroControllers] = useState([
    { id: 1, label: "A", active: false },
    { id: 2, label: "B", active: false },
    { id: 3, label: "C", active: false },
    { id: 4, label: "D", active: false },
    { id: 5, label: "E", active: false },
  ])

  // Refs and timers
  const timerRef = useRef(null)
  const responseTimeoutRef = useRef(null)
  const randomIntervalRef = useRef(null)

  // Load players on component mount
  useEffect(() => {
    loadPlayers()
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current)
      if (randomIntervalRef.current) clearTimeout(randomIntervalRef.current)
    }
  }, [])

  const loadPlayers = async () => {
    try {
      const response = await fetch("https://voley-backend-nhyl.onrender.com/api/cuentas")
      const data = await response.json()
      setPlayers(data)
    } catch (error) {
      console.error("Error loading players:", error)
    }
  }

  const startTest = async () => {
    if (!selectedPlayer) {
      alert("Por favor selecciona un jugador")
      return
    }

    try {
      const response = await fetch("https://voley-backend-nhyl.onrender.com/api/pruebas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: testMode,
          cuentaId: selectedPlayer,
        }),
      })

      const data = await response.json()
      if (data.success || response.ok) {
        setCurrentTest(data.data || data)
        setTestStatus("running")
        setStartTime(new Date())
        setResults({ aciertos: 0, errores: 0 })
        setCurrentRound(1)
        setCurrentStep(0)

        // Start test execution based on mode
        if (testMode === "secuencial") {
          startSequentialTest()
        } else if (testMode === "aleatorio") {
          startRandomTest()
        } else if (testMode === "manual") {
          startManualTest()
        }
      }
    } catch (error) {
      console.error("Error starting test:", error)
    }
  }

  const startSequentialTest = () => {
    executeSequentialStep()
  }

  const executeSequentialStep = () => {
    if (currentStep >= 5) {
      // Round completed
      if (currentRound >= rounds) {
        finishTest()
        return
      }
      setCurrentRound((prev) => prev + 1)
      setCurrentStep(0)
    }

    const deviceIndex = currentStep
    const command = microControllers[deviceIndex].label

    // Light up microcontroller
    setMicroControllers((prev) =>
      prev.map((mc, index) => ({
        ...mc,
        active: index === deviceIndex,
        lastResponse: null,
      })),
    )

    // Send command to device
    sendCommandToDevice(deviceIndex + 1, command)

    // Set timeout for response (5 seconds)
    responseTimeoutRef.current = setTimeout(() => {
      handleDeviceResponse("error")
    }, 5000)
  }

  const startRandomTest = () => {
    setTimeRemaining(duration)

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          finishTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Start random command generation
    executeRandomCommand()
  }

  const executeRandomCommand = () => {
    if (testStatus !== "running") return

    const randomIndex = Math.floor(Math.random() * 5)
    const command = microControllers[randomIndex].label

    // Light up random microcontroller
    setMicroControllers((prev) =>
      prev.map((mc, index) => ({
        ...mc,
        active: index === randomIndex,
        lastResponse: null,
      })),
    )

    // Send command to device
    sendCommandToDevice(randomIndex + 1, command)

    // Set timeout for response (5 seconds)
    responseTimeoutRef.current = setTimeout(() => {
      handleDeviceResponse("error")
      // Schedule next random command
      randomIntervalRef.current = setTimeout(executeRandomCommand, 1000)
    }, 5000)
  }

  const startManualTest = () => {
    if (!manualSequence.trim()) {
      alert("Por favor ingresa la secuencia manual")
      return
    }

    const sequences = manualSequence.split(" ").filter((seq) => seq.length > 0)
    if (sequences.length !== rounds) {
      alert(`Debes ingresar exactamente ${rounds} secuencias`)
      return
    }

    executeManualSequence(sequences)
  }

  const executeManualSequence = (sequences) => {
    // Implementation for manual sequence execution
    console.log("Executing manual sequences:", sequences)
    // This would follow similar pattern to sequential but with custom order
  }

  const sendCommandToDevice = async (deviceId, command) => {
    try {
      // Mock sending command via Pusher - replace with actual implementation
      console.log(`[v0] Sending command ${command} to device ${deviceId}`)

      // Simulate device response after random delay (1-4 seconds)
      setTimeout(
        () => {
          const isSuccess = Math.random() > 0.3 // 70% success rate for demo
          handleDeviceResponse(isSuccess ? "acierto" : "error")
        },
        Math.random() * 3000 + 1000,
      )
    } catch (error) {
      console.error("Error sending command:", error)
    }
  }

  const handleDeviceResponse = (response) => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current)
    }

    // Update results
    setResults((prev) => ({
      ...prev,
      [response === "acierto" ? "aciertos" : "errores"]: prev[response === "acierto" ? "aciertos" : "errores"] + 1,
    }))

    // Update microcontroller state
    setMicroControllers((prev) =>
      prev.map((mc) => ({
        ...mc,
        active: false,
        lastResponse: mc.active ? response : mc.lastResponse,
      })),
    )

    // Continue test based on mode
    if (testMode === "secuencial") {
      setCurrentStep((prev) => prev + 1)
      setTimeout(executeSequentialStep, 500)
    } else if (testMode === "aleatorio") {
      randomIntervalRef.current = setTimeout(executeRandomCommand, 1000)
    }
  }

  const finishTest = async () => {
    setTestStatus("finished")

    // Clear all timers
    if (timerRef.current) clearInterval(timerRef.current)
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current)
    if (randomIntervalRef.current) clearTimeout(randomIntervalRef.current)

    // Turn off all microcontrollers
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false })))

    if (!currentTest) return

    try {
      // Prepare data based on test mode
      const finalizationData = {
        aciertos: results.aciertos,
        errores: results.errores,
      }

      if (testMode === "secuencial" || testMode === "manual") {
        finalizationData.tiempo_fin = new Date()
        finalizationData.cantidad_intentos = results.aciertos + results.errores
      }

      if (testMode === "manual") {
        finalizationData.ejercicios_realizados = manualSequence
      }

      const response = await fetch(`https://voley-backend-nhyl.onrender.com/api/pruebas/${currentTest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalizationData),
      })

      const data = await response.json()
      if (data.success || response.ok) {
        console.log("Test finished successfully")
      }
    } catch (error) {
      console.error("Error finishing test:", error)
    }
  }

  const emergencyStop = () => {
    finishTest()
  }

  const resetTest = () => {
    setTestStatus("idle")
    setCurrentTest(null)
    setCurrentRound(0)
    setCurrentStep(0)
    setTimeRemaining(0)
    setResults({ aciertos: 0, errores: 0 })
    setStartTime(null)
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, active: false, lastResponse: null })))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-8 max-w-full">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Control de Pruebas</h1>
                <p className="text-gray-600">Sistema de control para pruebas de reacción</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{results.aciertos + results.errores}</div>
                    <div className="text-gray-500">Total Intentos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{results.aciertos}</div>
                    <div className="text-gray-500">Aciertos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Configuration Panel */}
            <div className="xl:col-span-1">
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardHeader className="bg-red-800 text-white p-4 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Target className="h-4 w-4" />
                    Configuración
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Player Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Jugador
                    </Label>
                    <Select
                      value={selectedPlayer}
                      onValueChange={setSelectedPlayer}
                      disabled={testStatus === "running"}
                    >
                      <SelectTrigger className="w-full h-10 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500">
                        <SelectValue placeholder="Selecciona un jugador" />
                      </SelectTrigger>
                     
                    </Select>
                  </div>

                  {/* Test Mode Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Tipo de Prueba
                    </Label>
                    <Select
                      value={testMode}
                      onValueChange={(value) => setTestMode(value)}
                      disabled={testStatus === "running"}
                    >
                      <SelectTrigger className="w-full h-10 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="secuencial">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium">Secuencial</div>
                              <div className="text-xs text-gray-500">A→B→C→D→E</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="aleatorio">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-purple-600" />
                            <div>
                              <div className="font-medium">Aleatorio</div>
                              <div className="text-xs text-gray-500">Orden aleatorio</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="manual">
                          <div className="flex items-center gap-2">
                            <Hand className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium">Manual</div>
                              <div className="text-xs text-gray-500">Secuencia personalizada</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mode-specific configuration */}
                  {testMode === "secuencial" && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Rondas</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={rounds}
                        onChange={(e) => setRounds(Number.parseInt(e.target.value) || 1)}
                        disabled={testStatus === "running"}
                        className="w-full h-10 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  )}

                  {testMode === "aleatorio" && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Duración (seg)
                      </Label>
                      <Input
                        type="number"
                        min="10"
                        max="300"
                        value={duration}
                        onChange={(e) => setDuration(Number.parseInt(e.target.value) || 60)}
                        disabled={testStatus === "running"}
                        className="w-full h-10 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  )}

                  {testMode === "manual" && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Rondas</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={rounds}
                          onChange={(e) => setRounds(Number.parseInt(e.target.value) || 1)}
                          disabled={testStatus === "running"}
                          className="w-full h-10 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Secuencia</Label>
                        <Textarea
                          placeholder="Ej: ABDCE BDCAE"
                          value={manualSequence}
                          onChange={(e) => setManualSequence(e.target.value)}
                          disabled={testStatus === "running"}
                          className="w-full rounded-lg border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2 pt-4">
                    {testStatus === "idle" && (
                      <Button
                        onClick={startTest}
                        className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                        disabled={!selectedPlayer}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar Prueba
                      </Button>
                    )}

                    {testStatus === "running" && (
                      <Button
                        onClick={emergencyStop}
                        className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Parada de Emergencia
                      </Button>
                    )}

                    {testStatus === "finished" && (
                      <Button
                        onClick={resetTest}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Nueva Prueba
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="xl:col-span-3 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Sensores
                </h3>
                <div className="grid grid-cols-5 gap-4">
                  {microControllers.map((mc) => (
                    <div
                      key={mc.id}
                      className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                        mc.active
                          ? "border-yellow-400 bg-yellow-50 shadow-lg scale-105"
                          : mc.lastResponse === "acierto"
                            ? "border-green-400 bg-green-50"
                            : mc.lastResponse === "error"
                              ? "border-red-400 bg-red-50"
                              : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="text-center">
                        <div
                          className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                            mc.active
                              ? "bg-yellow-400 text-white"
                              : mc.lastResponse === "acierto"
                                ? "bg-green-500 text-white"
                                : mc.lastResponse === "error"
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          <Wifi className={`h-6 w-6 ${mc.active ? "animate-pulse" : ""}`} />
                        </div>
                        <div className="text-lg font-bold text-gray-900">{mc.label}</div>
                        <div className="text-xs text-gray-500">Sensor {mc.id}</div>

                        {mc.lastResponse && (
                          <div className="absolute -top-1 -right-1">
                            {mc.lastResponse === "acierto" ? (
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                <XCircle className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Test Status */}
                <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Clock className="h-4 w-4" />
                      Estado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center space-y-2">
                      <Badge
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          testStatus === "idle"
                            ? "bg-gray-100 text-gray-800"
                            : testStatus === "running"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {testStatus === "idle" ? "Inactivo" : testStatus === "running" ? "En Curso" : "Finalizado"}
                      </Badge>

                      {testStatus === "running" && (
                        <>
                          {testMode === "secuencial" && (
                            <div>
                              <div className="text-2xl font-bold text-gray-900">{currentRound}</div>
                              <div className="text-xs text-gray-500">de {rounds} rondas</div>
                            </div>
                          )}

                          {testMode === "aleatorio" && (
                            <div>
                              <div className="text-2xl font-bold text-red-600">{timeRemaining}</div>
                              <div className="text-xs text-gray-500">segundos restantes</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Results - Aciertos */}
                <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Aciertos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">{results.aciertos}</div>
                      {results.aciertos + results.errores > 0 && (
                        <div className="text-xs text-gray-500">
                          {Math.round((results.aciertos / (results.aciertos + results.errores)) * 100)}% precisión
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Results - Errores */}
                <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Errores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 mb-1">{results.errores}</div>
                      <div className="text-xs text-gray-500">Total: {results.aciertos + results.errores}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
