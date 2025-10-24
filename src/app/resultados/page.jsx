"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { User, Trophy, TrendingUp, Target, Zap } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

const COLORS = {
  secuencial: "#3b82f6",
  aleatorio: "#f59e0b",
  manual: "#10b981",
  aciertos: "#22c55e",
  errores: "#ef4444",
}

export default function ResultadosPage() {
  const [jugadorData, setJugadorData] = useState(null)
  const [rankingData, setRankingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodoActual, setPeriodoActual] = useState("general")

  useEffect(() => {
    cargarDatos()
  }, [periodoActual])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem("idUser")

      if (!userId) {
        console.error("No se encontró idUser en localStorage")
        return
      }

      // Fetch player data
      const cuentaResponse = await fetch(`${BACKEND_URL}/api/cuentas/${userId}`)
      const cuentaData = await cuentaResponse.json()

      if (cuentaData.success) {
        setJugadorData(cuentaData.data)
      }

      // Fetch ranking data
      const rankingResponse = await fetch(`${BACKEND_URL}/api/ranking/personal/${userId}`)
      const rankingDataRes = await rankingResponse.json()

      if (rankingDataRes.success) {
        setRankingData(rankingDataRes.data)
      }
    } catch (error) {
      console.error("Error cargando datos:", error)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (!jugadorData || !rankingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No se encontraron datos del jugador</p>
        </div>
      </div>
    )
  }

  const jugador = jugadorData.jugador || jugadorData.entrenador || jugadorData.tecnico

  // Prepare data for charts
  const tiposPrueba = ["secuencial", "aleatorio", "manual"]
  const chartDataPorTipo = tiposPrueba.map((tipo) => {
    const datos = rankingData.resumenPorTipo[tipo]
    return {
      tipo,
      intentos: datos?.totalIntentos || 0,
      aciertos: datos?.totalAciertos || 0,
      errores: datos?.totalErrores || 0,
      porcentaje: Number.parseFloat(datos?.porcentajePromedio || 0),
      cantidadPruebas: datos?.cantidadPruebas || 0,
    }
  })

  // Pie chart data for test type distribution
  const distribucionPruebas = chartDataPorTipo
    .filter((d) => d.cantidadPruebas > 0)
    .map((d) => ({
      name: d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1),
      value: d.cantidadPruebas,
      color: COLORS[d.tipo],
    }))

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Player Header */}
      <Card className="rounded-2xl shadow-xl border-2 border-slate-200/60 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {jugador.nombres} {jugador.apellidos}
              </h1>
              <div className="flex items-center space-x-3 mt-2">
                <Badge className="bg-white/20 text-white border-white/30">
                  <Trophy className="h-3 w-3 mr-1" />
                  {jugadorData.rol.charAt(0).toUpperCase() + jugadorData.rol.slice(1)}
                </Badge>
                {jugador.posicion_principal && (
                  <Badge className="bg-blue-500/80 text-white border-blue-400">
                    {jugador.posicion_principal.charAt(0).toUpperCase() + jugador.posicion_principal.slice(1)}
                  </Badge>
                )}
                {jugador.fecha_nacimiento && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {calcularEdad(jugador.fecha_nacimiento)} años
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs for time periods */}
      <Tabs defaultValue="general" className="w-full" onValueChange={setPeriodoActual}>
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="semanal" className="text-sm">
            Semanal
          </TabsTrigger>
          <TabsTrigger value="mensual" className="text-sm">
            Mensual
          </TabsTrigger>
          <TabsTrigger value="general" className="text-sm">
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value={periodoActual} className="space-y-6 mt-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-700 font-medium">Total Intentos</p>
                    <p className="text-2xl font-bold text-blue-900">{rankingData.totalIntentos}</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-700 font-medium">Total Aciertos</p>
                    <p className="text-2xl font-bold text-green-900">{rankingData.totalAciertos}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-700 font-medium">Total Errores</p>
                    <p className="text-2xl font-bold text-red-900">{rankingData.totalErrores}</p>
                  </div>
                  <Zap className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-700 font-medium">Precisión Promedio</p>
                    <p className="text-2xl font-bold text-purple-900">{rankingData.porcentajePromedio}%</p>
                  </div>
                  <Trophy className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Donut Charts for each test type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chartDataPorTipo.map((datos) => (
              <Card key={datos.tipo} className="shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-sm font-bold uppercase" style={{ color: COLORS[datos.tipo] }}>
                    Prueba {datos.tipo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Aciertos", value: datos.aciertos, color: COLORS.aciertos },
                            { name: "Errores", value: datos.errores, color: COLORS.errores },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[
                            { name: "Aciertos", value: datos.aciertos, color: COLORS.aciertos },
                            { name: "Errores", value: datos.errores, color: COLORS.errores },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-2xl font-bold" style={{ color: COLORS[datos.tipo] }}>
                          {datos.porcentaje.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">Precisión</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Intentos:</span>
                      <span className="font-bold text-gray-900">{datos.intentos}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600">Aciertos:</span>
                      <span className="font-bold text-green-700">{datos.aciertos}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-red-600">Errores:</span>
                      <span className="font-bold text-red-700">{datos.errores}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Best test data cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chartDataPorTipo.map((datos) => (
              <Card
                key={`best-${datos.tipo}`}
                className="border-2"
                style={{ borderColor: COLORS[datos.tipo], backgroundColor: `${COLORS[datos.tipo]}10` }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-center">
                    Mejor Prueba {datos.tipo.charAt(0).toUpperCase() + datos.tipo.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-600">Total de Pruebas</p>
                    <p className="text-xl font-bold" style={{ color: COLORS[datos.tipo] }}>
                      {datos.cantidadPruebas}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-600">Mejor Precisión</p>
                    <p className="text-xl font-bold text-green-600">{datos.porcentaje.toFixed(1)}%</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-600">Total Intentos</p>
                    <p className="text-lg font-bold text-gray-900">{datos.intentos}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pie chart for test type distribution */}
          {distribucionPruebas.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-center">Distribución de Pruebas por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribucionPruebas}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {distribucionPruebas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  {distribucionPruebas.map((tipo) => (
                    <div key={tipo.name} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">{tipo.name}</p>
                      <p className="text-2xl font-bold" style={{ color: tipo.color }}>
                        {tipo.value}
                      </p>
                      <p className="text-xs text-gray-500">pruebas</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
