"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Trophy, TrendingUp, Target, Zap, Calendar, User, GraduationCap, MapPin } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { getPositionIcon, getPositionName } from "../lib/position-icons"
import Image from "next/image"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

const COLORS = {
  secuencial: "#3b82f6",
  aleatorio: "#f59e0b",
  manual: "#10b981",
  aciertos: "#22c55e",
  errores: "#ef4444",
}
const TOTAL_COLOR = "#8b5cf6"
const PANEL_HEIGHT = "h-[560px]"

export default function ResultadosPersonalPage() {
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
      const cuentaResponse = await fetch(`${BACKEND_URL}/api/cuentas/${userId}`)
      const cuentaData = await cuentaResponse.json()
      if (cuentaData.success) setJugadorData(cuentaData.data)

      const rankingUrl = `${BACKEND_URL}/api/ranking/personal/${userId}?periodo=${periodoActual}`
      const rankingResponse = await fetch(rankingUrl)
      const rankingDataRes = await rankingResponse.json()
      if (rankingDataRes.success) setRankingData(rankingDataRes.data)
    } catch (e) {
      console.error("Error cargando datos:", e)
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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A"
    const date = new Date(fecha)
    return date.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800020] mx-auto" />
          <p className="mt-4 text-gray-700">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (!jugadorData || !rankingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-gray-700">No se encontraron datos del jugador</p>
      </div>
    )
  }

  const jugador = jugadorData.jugador || jugadorData.entrenador || jugadorData.tecnico

  const tiposPrueba = ["secuencial", "aleatorio", "manual"]
  const chartDataPorTipo = tiposPrueba.map((tipo) => {
    const datos = rankingData?.por_tipo_prueba?.[tipo]
    const aciertos = datos?.total_aciertos || 0
    const errores = datos?.total_errores || 0
    const intentos = aciertos + errores
    const porcentaje = intentos > 0 ? (aciertos / intentos) * 100 : 0

    const mp = datos?.mejor_prueba
    let mejorPruebaFormateada = null
    if (mp) {
      const mpA = mp.aciertos || 0
      const mpE = mp.errores || 0
      const mpI = mpA + mpE
      const mpP = mpI > 0 ? (mpA / mpI) * 100 : 0
      mejorPruebaFormateada = { ...mp, intentos: mpI, porcentaje: mpP.toFixed(1) }
    }

    return {
      tipo,
      intentos,
      aciertos,
      errores,
      porcentaje,
      cantidadPruebas: datos?.total_realizadas || 0,
      mejorPrueba: mejorPruebaFormateada,
    }
  })

  const distribucionPruebas = chartDataPorTipo
    .filter((d) => d.cantidadPruebas > 0)
    .map((d) => ({
      name: d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1),
      value: d.cantidadPruebas,
      color: COLORS[d.tipo],
    }))

  const totalPruebasRealizadas = distribucionPruebas.reduce((acc, curr) => acc + curr.value, 0)
  const totalIntentos =
    rankingData?.totales_generales?.total_intentos ||
    (rankingData?.totales_generales?.total_aciertos || 0) + (rankingData?.totales_generales?.total_errores || 0)
  const totalAciertos = rankingData?.totales_generales?.total_aciertos || 0
  const totalErrores = rankingData?.totales_generales?.total_errores || 0
  const precisionPromedio = totalIntentos > 0 ? ((totalAciertos / totalIntentos) * 100).toFixed(1) : 0

  // Línea de meta-datos tipo: "medicina | Receptor | Jugador | 25 años"
  const metaLine = [
    jugador.carrera || null,
    jugador.posicion_principal ? getPositionName(jugador.posicion_principal) : null,
    jugadorData?.rol ? jugadorData.rol.charAt(0).toUpperCase() + jugadorData.rol.slice(1) : null,
    jugador.fecha_nacimiento ? `${calcularEdad(jugador.fecha_nacimiento)} años` : null,
  ].filter(Boolean).join(" | ")

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* ===== BANNER GUINDO → PLOMO con franjas ===== */}
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
          {/* Fondo: guindo -> plomo */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#800020] via-[#7a2e40] to-[#6b7280]" />
          {/* Franjas diagonales sutiles */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "repeating-linear-gradient(112deg, rgba(255,255,255,.16) 0 60px, rgba(255,255,255,0) 60px 140px)",
            }}
          />
          {/* Contenido */}
          <div className="relative px-6 md:px-10 py-8 md:py-10">
            <div className="flex items-center gap-6 md:gap-10">
              {/* Avatar circular */}
              {jugador.posicion_principal && (
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-white/15 blur-2xl" />
                  <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden ring-8 ring-white/30 bg-white/20 backdrop-blur-sm">
                    <Image
                      src={getPositionIcon(jugador.posicion_principal) || "/placeholder.svg"}
                      alt={getPositionName(jugador.posicion_principal)}
                      width={140}
                      height={140}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Texto (tipografía sans original) */}
              <div className="flex-1 min-w-0">
                <h1 className="text-white text-4xl md:text-6xl font-extrabold tracking-tight">
                  {jugador.nombres} {jugador.apellidos}
                </h1>
                {/* Línea de metadatos como texto */}
                <p className="mt-3 text-white/90 text-base md:text-lg font-medium">
                  {metaLine}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* ===== FIN BANNER ===== */}

        {/* Panel principal: izquierda (gráfico) | derecha (métricas) */}
        <Tabs value={periodoActual} className="w-full" onValueChange={setPeriodoActual}>
          <TabsList className="grid w-full grid-cols-3 h-12 bg-white border border-gray-200 shadow-sm">
            <TabsTrigger value="semanal" className="text-sm data-[state=active]:bg-[#800020] data-[state=active]:text-white">
              Semanal
            </TabsTrigger>
            <TabsTrigger value="mensual" className="text-sm data-[state=active]:bg-[#800020] data-[state=active]:text-white">
              Mensual
            </TabsTrigger>
            <TabsTrigger value="general" className="text-sm data-[state=active]:bg-[#800020] data-[state=active]:text-white">
              General
            </TabsTrigger>
          </TabsList>

          <TabsContent value={periodoActual} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* IZQUIERDA: Card grande con gráfico */}
              <div className={`md:col-span-9 ${PANEL_HEIGHT}`}>
                {distribucionPruebas.length > 0 && (
                  <Card className="shadow-lg bg-white border-2 border-gray-200 h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-center text-gray-900">Distribución de Pruebas por Tipo</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[calc(100%-56px)] flex flex-col">
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={distribucionPruebas}
                              cx="50%"
                              cy="48%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={110}
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

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {distribucionPruebas.map((tipo) => (
                          <div key={tipo.name} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600">{tipo.name}</p>
                            <p className="text-2xl font-bold" style={{ color: tipo.color }}>
                              {tipo.value}
                            </p>
                            <p className="text-xs text-gray-500">pruebas</p>
                          </div>
                        ))}
                        <div className="text-center p-3 bg-white rounded-lg border-2" style={{ borderColor: TOTAL_COLOR }}>
                          <p className="text-xs text-gray-700 font-semibold">Total</p>
                          <p className="text-2xl font-extrabold" style={{ color: TOTAL_COLOR }}>
                            {totalPruebasRealizadas}
                          </p>
                          <p className="text-xs text-gray-500">pruebas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* DERECHA: 4 tarjetas de mismo tamaño */}
              <div className={`md:col-span-3 ${PANEL_HEIGHT}`}>
                <div className="grid grid-rows-4 gap-4 h-full">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                    <CardContent className="p-4 h-full flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-700 font-medium">Total Intentos</p>
                        <p className="text-2xl font-bold text-blue-900">{totalIntentos}</p>
                      </div>
                      <Target className="h-8 w-8 text-blue-600" />
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                    <CardContent className="p-4 h-full flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-700 font-medium">Total Aciertos</p>
                        <p className="text-2xl font-bold text-green-900">{totalAciertos}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
                    <CardContent className="p-4 h-full flex items-center justify-between">
                      <div>
                        <p className="text-xs text-red-700 font-medium">Total Errores</p>
                        <p className="text-2xl font-bold text-red-900">{totalErrores}</p>
                      </div>
                      <Zap className="h-8 w-8 text-red-600" />
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
                    <CardContent className="p-4 h-full flex items-center justify-between">
                      <div>
                        <p className="text-xs text-purple-700 font-medium">Precisión Promedio</p>
                        <p className="text-2xl font-bold text-purple-900">{precisionPromedio}%</p>
                      </div>
                      <Trophy className="h-8 w-8 text-purple-600" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Tarjetas por tipo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {chartDataPorTipo.map((d) => (
                <Card key={d.tipo} className="shadow-lg bg-white border-2 border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-sm font-bold uppercase" style={{ color: COLORS[d.tipo] }}>
                      Prueba {d.tipo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Aciertos", value: d.aciertos || 1, color: COLORS.aciertos },
                              { name: "Errores", value: d.errores || 1, color: COLORS.errores },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[{ name: "Aciertos", value: d.aciertos, color: COLORS.aciertos },
                              { name: "Errores", value: d.errores, color: COLORS.errores }].map((e, i) => (
                              <Cell key={i} fill={e.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                          <p className="text-2xl font-bold" style={{ color: COLORS[d.tipo] }}>
                            {d.porcentaje.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-600">Precisión</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center text-sm"><span className="text-gray-600">Intentos:</span><span className="font-bold text-gray-900">{d.intentos}</span></div>
                      <div className="flex justify-between items-center text-sm"><span className="text-green-600">Aciertos:</span><span className="font-bold text-green-700">{d.aciertos}</span></div>
                      <div className="flex justify-between items-center text-sm"><span className="text-red-600">Errores:</span><span className="font-bold text-red-700">{d.errores}</span></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mejor prueba (barra) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {chartDataPorTipo.map((d) => (
                <Card
                  key={`best-${d.tipo}`}
                  className="border-2 bg-white"
                  style={{ borderColor: COLORS[d.tipo], backgroundColor: `${COLORS[d.tipo]}10` }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-center text-gray-900">
                      Mejor Prueba {d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {d.mejorPrueba ? (() => {
                      const mp = d.mejorPrueba
                      const total = mp.intentos ?? (mp.aciertos || 0) + (mp.errores || 0)
                      const accPct = total > 0 ? (mp.aciertos / total) * 100 : 0
                      const errPct = total > 0 ? (mp.errores / total) * 100 : 0
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-600">
                              <span className="block">Fecha</span>
                              <span className="font-semibold text-gray-700">{formatearFecha(mp.fecha)}</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-xs text-gray-600">Precisión</span>
                              <span className="text-lg font-extrabold text-green-600">{mp.porcentaje}%</span>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-gray-200 bg-gray-100 h-8 px-1 flex items-center">
                            <div className="relative w-full h-5 overflow-hidden rounded-full">
                              <div className="absolute left-0 top-0 h-full bg-green-500" style={{ width: `${accPct}%` }} />
                              <div className="absolute right-0 top-0 h-full bg-red-500" style={{ width: `${errPct}%` }} />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
                              <span className="text-gray-700 font-medium">Aciertos:</span>
                              <span className="font-bold text-gray-900">{mp.aciertos}</span>
                              <span className="text-gray-400">/ {total}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
                              <span className="text-gray-700 font-medium">Errores:</span>
                              <span className="font-bold text-red-600">{mp.errores}</span>
                            </div>
                          </div>
                        </>
                      )
                    })() : (
                      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                        <p className="text-sm text-gray-600">No hay pruebas registradas</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
