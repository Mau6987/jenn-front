"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Target, Zap, TrendingUp, Award, Activity, ArrowLeft } from "lucide-react"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

export default function ResultadosPage() {
  const [alcanceData, setAlcanceData] = useState(null)
  const [pliometriaData, setPliometriaData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("general")
  const [tipoPliometria, setTipoPliometria] = useState("todos")

  useEffect(() => {
    cargarResultados()
  }, [periodo, tipoPliometria])

  const cargarResultados = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem("idUser")

      if (!userId) {
        console.error("No user ID found")
        setLoading(false)
        return
      }

      // Cargar resultados de alcance
      const alcanceUrl = `${BACKEND_URL}/api/ranking/alcance/personal/${userId}?periodo=${periodo}`
      const alcanceResponse = await fetch(alcanceUrl)
      const alcanceResult = await alcanceResponse.json()

      if (alcanceResult.success) {
        setAlcanceData(alcanceResult.data)
      }

      // Cargar resultados de pliometría
      const pliometriaUrl = `${BACKEND_URL}/api/ranking/pliometria/personal/${userId}?periodo=${periodo}&tipo=${tipoPliometria}`
      const pliometriaResponse = await fetch(pliometriaUrl)
      const pliometriaResult = await pliometriaResponse.json()

      if (pliometriaResult.success) {
        setPliometriaData(pliometriaResult.data)
      }
    } catch (error) {
      console.error("Error loading results:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#800020] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Cargando resultados personales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="mb-6 p-2 bg-white hover:bg-gray-50 rounded-xl transition-all duration-300 shadow-md"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>

          <div className="bg-gradient-to-br from-[#800020] to-[#a00028] rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black">Mis Resultados</h1>
                <p className="text-white/80 text-sm font-medium">Estadísticas personales de rendimiento</p>
              </div>
            </div>

            {/* Periodo Filter */}
            <div className="mt-6">
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-full md:w-64 bg-white/20 backdrop-blur-sm text-white border-white/30 rounded-xl h-11 font-medium hover:bg-white/30 transition-all duration-300">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="general">General (Todo el tiempo)</SelectItem>
                  <SelectItem value="mensual">Último mes</SelectItem>
                  <SelectItem value="semanal">Última semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="alcance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white rounded-xl p-1 shadow-md mb-6">
            <TabsTrigger
              value="alcance"
              className="rounded-lg data-[state=active]:bg-[#800020] data-[state=active]:text-white font-semibold transition-all duration-300"
            >
              <Target className="h-4 w-4 mr-2" />
              Alcance
            </TabsTrigger>
            <TabsTrigger
              value="pliometria"
              className="rounded-lg data-[state=active]:bg-[#800020] data-[state=active]:text-white font-semibold transition-all duration-300"
            >
              <Zap className="h-4 w-4 mr-2" />
              Pliometría
            </TabsTrigger>
          </TabsList>

          {/* Alcance Tab */}
          <TabsContent value="alcance" className="space-y-6">
            {alcanceData ? (
              <>
                {/* Ranking Position Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Award className="h-6 w-6" />
                      Tu Posición en el Ranking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-5xl font-black text-blue-600">#{alcanceData.ranking?.posicion || "-"}</p>
                        <p className="text-sm text-blue-700 font-medium mt-1">
                          de {alcanceData.ranking?.total_jugadores || 0} jugadores
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-700 font-semibold">
                          {alcanceData.jugador?.nombres} {alcanceData.jugador?.apellidos}
                        </p>
                        <p className="text-xs text-blue-600">{alcanceData.jugador?.carrera}</p>
                        <p className="text-xs text-blue-600">{alcanceData.jugador?.posicion_principal}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6 text-center">
                      <Target className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                      <p className="text-4xl font-black text-gray-900">
                        {alcanceData.estadisticas?.mejor_alcance || 0} cm
                      </p>
                      <p className="text-sm text-blue-600 font-semibold mt-2">Mejor Alcance</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6 text-center">
                      <Zap className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                      <p className="text-4xl font-black text-gray-900">
                        {alcanceData.estadisticas?.mejor_potencia || 0}
                      </p>
                      <p className="text-sm text-purple-600 font-semibold mt-2">Mejor Potencia</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <p className="text-4xl font-black text-gray-900">
                        {alcanceData.estadisticas?.promedio_alcance || 0} cm
                      </p>
                      <p className="text-sm text-green-600 font-semibold mt-2">Promedio Alcance</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6 text-center">
                      <Award className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                      <p className="text-4xl font-black text-gray-900">
                        {alcanceData.estadisticas?.promedio_potencia || 0}
                      </p>
                      <p className="text-sm text-yellow-600 font-semibold mt-2">Promedio Potencia</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Total Records */}
                <Card className="bg-white shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Activity className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Total de Registros</p>
                          <p className="text-2xl font-black text-gray-900">
                            {alcanceData.estadisticas?.total_registros || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-12 text-center">
                  <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No hay datos de alcance disponibles</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pliometria Tab */}
          <TabsContent value="pliometria" className="space-y-6">
            {/* Tipo Filter */}
            <div className="flex justify-end">
              <Select value={tipoPliometria} onValueChange={setTipoPliometria}>
                <SelectTrigger className="w-full md:w-64 bg-white border-gray-200 rounded-xl h-11 font-medium hover:border-[#800020] transition-all duration-300">
                  <SelectValue placeholder="Tipo de prueba" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="salto">Salto</SelectItem>
                  <SelectItem value="caida">Caída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pliometriaData ? (
              <>
                {/* Ranking Position Card */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-900">
                      <Award className="h-6 w-6" />
                      Tu Posición en el Ranking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-5xl font-black text-purple-600">
                          #{pliometriaData.ranking?.posicion || "-"}
                        </p>
                        <p className="text-sm text-purple-700 font-medium mt-1">
                          de {pliometriaData.ranking?.total_jugadores || 0} jugadores
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-purple-700 font-semibold">
                          {pliometriaData.jugador?.nombres} {pliometriaData.jugador?.apellidos}
                        </p>
                        <p className="text-xs text-purple-600">{pliometriaData.jugador?.carrera}</p>
                        <p className="text-xs text-purple-600">{pliometriaData.jugador?.posicion_principal}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6 text-center">
                      <Activity className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                      <p className="text-4xl font-black text-gray-900">
                        {pliometriaData.estadisticas?.mejor_promedio_fuerzas || 0}
                      </p>
                      <p className="text-sm text-blue-600 font-semibold mt-2">Mejor Promedio Fuerzas</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6 text-center">
                      <Zap className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                      <p className="text-4xl font-black text-gray-900">
                        {pliometriaData.estadisticas?.mejor_potencia || 0}
                      </p>
                      <p className="text-sm text-purple-600 font-semibold mt-2">Mejor Potencia</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <p className="text-4xl font-black text-gray-900">
                        {pliometriaData.estadisticas?.promedio_fuerzas || 0}
                      </p>
                      <p className="text-sm text-green-600 font-semibold mt-2">Promedio Fuerzas</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6 text-center">
                      <Award className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                      <p className="text-4xl font-black text-gray-900">
                        {pliometriaData.estadisticas?.promedio_potencia || 0}
                      </p>
                      <p className="text-sm text-yellow-600 font-semibold mt-2">Promedio Potencia</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Total Records */}
                <Card className="bg-white shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Activity className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Total de Registros</p>
                          <p className="text-2xl font-black text-gray-900">
                            {pliometriaData.estadisticas?.total_registros || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-12 text-center">
                  <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No hay datos de pliometría disponibles</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
