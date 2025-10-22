"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { Trophy, TrendingUp, Target, Zap, Calendar, User, GraduationCap, MapPin } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"
import Image from "next/image"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

const COLORS = {
  secuencial: "#3b82f6",
  aleatorio: "#f59e0b",
  manual: "#10b981",
  aciertos: "#22c55e",
  errores: "#ef4444",
}

export default function ResultadosPersonalPage() {
  const [jugadorData, setJugadorData] = useState(null)
  const [rankingData, setRankingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodoActual, setPeriodoActual] = useState("general")

  useEffect(() => {
    cargarDatos()
  }, [periodoActual])

  const calcularRangoFechas = (periodo) => {
    const hoy = new Date()
    let fechaInicio, fechaFin

    if (periodo === "semanal") {
      fechaInicio = new Date(hoy)
      fechaInicio.setDate(hoy.getDate() - 7)
      fechaFin = hoy
    } else if (periodo === "mensual") {
      fechaInicio = new Date(hoy)
      fechaInicio.setDate(hoy.getDate() - 30)
      fechaFin = hoy
    } else {
      return { fechaInicio: null, fechaFin: null }
    }

    return {
      fechaInicio: fechaInicio.toISOString().split("T")[0],
      fechaFin: fechaFin.toISOString().split("T")[0],
    }
  }

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem("idUser")

      if (!userId) {
        console.error("No se encontró idUser en localStorage")
        return
      }

      const cuentaResponse = await fetch(`${BACKEND_URL}/api/cuentas/${userId}`)
      const cuentaData = await cuentaResponse.json()

      if (cuentaData.success) {
        setJugadorData(cuentaData.data)
      }

      const { fechaInicio, fechaFin } = calcularRangoFechas(periodoActual)
      const params = new URLSearchParams()

      if (fechaInicio && fechaFin) {
        params.append("fechaInicio", fechaInicio)
        params.append("fechaFin", fechaFin)
      }

      const rankingUrl = `${BACKEND_URL}/api/ranking/personal/${userId}${params.toString() ? `?${params.toString()}` : ""}`

      const rankingResponse = await fetch(rankingUrl)
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

  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A"
    const date = new Date(fecha)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800020] mx-auto"></div>
          <p className="mt-4 text-gray-700">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (!jugadorData || !rankingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-gray-700">No se encontraron datos del jugador</p>
        </div>
      </div>
    )
  }

  const jugador = jugadorData.jugador || jugadorData.entrenador || jugadorData.tecnico

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
      mejorPrueba: datos?.mejorPrueba || null,
    }
  })

  const distribucionPruebas = chartDataPorTipo
    .filter((d) => d.cantidadPruebas > 0)
    .map((d) => ({
      name: d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1),
      value: d.cantidadPruebas,
      color: COLORS[d.tipo],
    }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="space-y-6 max-w-7xl mx-auto">
        <Card className="rounded-3xl shadow-2xl border-none overflow-hidden animate-fade-in bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-8">
              {/* Icono circular del jugador */}
              {jugador.posicion_principal && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#800020]/20 to-[#a64d66]/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  <div className="relative w-40 h-40 rounded-full overflow-hidden border-8 border-white shadow-2xl transform transition-all duration-500 group-hover:scale-110 animate-float bg-gradient-to-br from-gray-100 to-gray-200">
                    <Image
                      src={getPositionIcon(jugador.posicion_principal) || "/placeholder.svg"}
                      alt={jugador.posicion_principal}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Información del jugador */}
              <div className="flex-1 text-center md:text-left space-y-5">
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-3 animate-slide-in">
                    {jugador.nombres} {jugador.apellidos}
                  </h1>
                  <div className="h-1.5 w-32 bg-gradient-to-r from-[#800020] via-[#a64d66] to-[#800020] rounded-full mx-auto md:mx-0 animate-pulse-slow"></div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Badge className="bg-gradient-to-r from-[#800020] to-[#a64d66] text-white border-none px-5 py-2.5 text-base font-bold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 animate-fade-in-up rounded-full">
                    <Trophy className="h-5 w-5 mr-2" />
                    {jugadorData.rol.charAt(0).toUpperCase() + jugadorData.rol.slice(1)}
                  </Badge>
                  {jugador.posicion_principal && (
                    <Badge className="bg-white text-gray-800 border-2 border-gray-300 px-5 py-2.5 text-base font-semibold shadow-md hover:shadow-xl transition-all duration-300 hover:scale-110 animate-fade-in-up rounded-full">
                      <MapPin className="h-5 w-5 mr-2" />
                      {getPositionName(jugador.posicion_principal)}
                    </Badge>
                  )}
                  {jugador.fecha_nacimiento && (
                    <Badge className="bg-white text-gray-800 border-2 border-gray-300 px-5 py-2.5 text-base font-semibold shadow-md hover:shadow-xl transition-all duration-300 hover:scale-110 animate-fade-in-up rounded-full">
                      <User className="h-5 w-5 mr-2" />
                      {calcularEdad(jugador.fecha_nacimiento)} años
                    </Badge>
                  )}
                  {jugador.carrera && (
                    <Badge className="bg-white text-gray-800 border-2 border-gray-300 px-5 py-2.5 text-base font-semibold shadow-md hover:shadow-xl transition-all duration-300 hover:scale-110 animate-fade-in-up rounded-full">
                      <GraduationCap className="h-5 w-5 mr-2" />
                      {jugador.carrera}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={periodoActual} className="w-full" onValueChange={setPeriodoActual}>
          <TabsList className="grid w-full grid-cols-3 h-12 bg-white border border-gray-200 shadow-sm">
            <TabsTrigger
              value="semanal"
              className="text-sm data-[state=active]:bg-[#800020] data-[state=active]:text-white"
            >
              Semanal
            </TabsTrigger>
            <TabsTrigger
              value="mensual"
              className="text-sm data-[state=active]:bg-[#800020] data-[state=active]:text-white"
            >
              Mensual
            </TabsTrigger>
            <TabsTrigger
              value="general"
              className="text-sm data-[state=active]:bg-[#800020] data-[state=active]:text-white"
            >
              General
            </TabsTrigger>
          </TabsList>

          <TabsContent value={periodoActual} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 backdrop-blur-sm transform transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in-up">
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

              <Card
                className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 backdrop-blur-sm transform transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
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

              <Card
                className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 backdrop-blur-sm transform transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
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

              <Card
                className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 backdrop-blur-sm transform transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {chartDataPorTipo.map((datos) => (
                <Card
                  key={datos.tipo}
                  className="shadow-lg bg-white border-2 border-gray-200 backdrop-blur-sm animate-fade-in-up"
                >
                  <CardHeader className="pb-2">
                    <CardTitle
                      className="text-center text-sm font-bold uppercase"
                      style={{ color: COLORS[datos.tipo] }}
                    >
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
                          <p className="text-xs text-gray-600">Precisión</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {chartDataPorTipo.map((datos) => (
                <Card
                  key={`best-${datos.tipo}`}
                  className="border-2 bg-white backdrop-blur-sm animate-fade-in-up"
                  style={{ borderColor: COLORS[datos.tipo], backgroundColor: `${COLORS[datos.tipo]}10` }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-center text-gray-900">
                      Mejor Prueba {datos.tipo.charAt(0).toUpperCase() + datos.tipo.slice(1)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {datos.mejorPrueba ? (
                      <>
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                          <p className="text-xs text-gray-600">Precisión Máxima</p>
                          <p className="text-xl font-bold text-green-600">{datos.mejorPrueba.porcentaje}%</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                          <p className="text-xs text-gray-600">Aciertos / Intentos</p>
                          <p className="text-lg font-bold text-gray-900">
                            {datos.mejorPrueba.aciertos} / {datos.mejorPrueba.intentos}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                          <p className="text-xs text-gray-600">Errores</p>
                          <p className="text-lg font-bold text-red-600">{datos.mejorPrueba.errores}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600">Fecha</p>
                            <p className="text-sm font-semibold text-gray-700">
                              {formatearFecha(datos.mejorPrueba.fecha)}
                            </p>
                          </div>
                          <Calendar className="h-5 w-5 text-gray-500" />
                        </div>
                      </>
                    ) : (
                      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                        <p className="text-sm text-gray-600">No hay pruebas registradas</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {distribucionPruebas.length > 0 && (
              <Card className="shadow-lg bg-white border-2 border-gray-200 backdrop-blur-sm animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="text-center text-gray-900">Distribución de Pruebas por Tipo</CardTitle>
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
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4">
                    {distribucionPruebas.map((tipo) => (
                      <div key={tipo.name} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
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

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
            transform: scaleX(1);
          }
          50% {
            opacity: 0.8;
            transform: scaleX(1.05);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in {
          animation: slide-in 0.6s ease-out forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
