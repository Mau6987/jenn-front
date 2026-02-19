"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    (rankingData?.totales_generales?.total_aciertos || 0) +
      (rankingData?.totales_generales?.total_errores || 0)
  const totalAciertos = rankingData?.totales_generales?.total_aciertos || 0
  const totalErrores = rankingData?.totales_generales?.total_errores || 0
  const precisionPromedio =
    totalIntentos > 0 ? ((totalAciertos / totalIntentos) * 100).toFixed(1) : 0

  // Línea de meta-datos minimal
  const metaLine = [
    jugador.carrera || null,
    jugador.posicion_principal ? getPositionName(jugador.posicion_principal) : null,
    jugadorData?.rol ? jugadorData.rol.charAt(0).toUpperCase() + jugadorData.rol.slice(1) : null,
    jugador.fecha_nacimiento ? `${calcularEdad(jugador.fecha_nacimiento)} años` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* ===== HEADER MINIMAL: Foto + Datos + Stats en un solo Card ===== */}
        <Card className="border border-gray-200 shadow-sm rounded-2xl">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              {/* Izquierda: avatar + nombre + meta */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  {jugador.posicion_principal ? (
                    <Image
                      src={getPositionIcon(jugador.posicion_principal) || "/placeholder.svg"}
                      alt={getPositionName(jugador.posicion_principal)}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="text-xl md:text-2xl font-semibold text-gray-900 truncate">
                    {jugador.nombres} {jugador.apellidos}
                  </h1>
                  <p className="text-sm text-gray-500">{metaLine}</p>
                </div>
              </div>

              {/* Derecha: 4 stats compactas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Intentos</p>
                  <p className="text-lg font-semibold text-gray-900">{totalIntentos}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Aciertos</p>
                  <p className="text-lg font-semibold text-gray-900">{totalAciertos}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Errores</p>
                  <p className="text-lg font-semibold text-gray-900">{totalErrores}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Precisión</p>
                  <p className="text-lg font-semibold text-gray-900">{precisionPromedio}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* ===== FIN HEADER ===== */}

        {/* Panel principal: tabs + gráfico */}
        <Tabs value={periodoActual} className="w-full" onValueChange={(v) => setPeriodoActual(v)}>
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
              {/* ÚNICA COLUMNA: Card grande con gráfico (12 cols) */}
              <div className={`md:col-span-12 ${PANEL_HEIGHT}`}>
                {distribucionPruebas.length > 0 && (
                  <Card className="shadow-sm bg-white border border-gray-200 h-full rounded-2xl">
                    <CardContent className="h-[calc(100%-0px)] p-5 flex flex-col">
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
                          <div
                            key={tipo.name}
                            className="text-center p-3 bg-white rounded-lg border border-gray-200"
                          >
                            <p className="text-xs text-gray-600">{tipo.name}</p>
                            <p className="text-2xl font-semibold" style={{ color: tipo.color }}>
                              {tipo.value}
                            </p>
                            <p className="text-xs text-gray-500">pruebas</p>
                          </div>
                        ))}
                        <div
                          className="text-center p-3 bg-white rounded-lg border"
                          style={{ borderColor: TOTAL_COLOR }}
                        >
                          <p className="text-xs text-gray-700 font-medium">Total</p>
                          <p className="text-2xl font-semibold" style={{ color: TOTAL_COLOR }}>
                            {totalPruebasRealizadas}
                          </p>
                          <p className="text-xs text-gray-500">pruebas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Tarjetas por tipo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {chartDataPorTipo.map((d) => (
                <Card key={d.tipo} className="shadow-sm bg-white border border-gray-200 rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle
                      className="text-center text-sm font-semibold uppercase"
                      style={{ color: COLORS[d.tipo] }}
                    >
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
                          <p className="text-2xl font-semibold" style={{ color: COLORS[d.tipo] }}>
                            {d.porcentaje.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-600">Precisión</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Intentos:</span>
                        <span className="font-medium text-gray-900">{d.intentos}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600">Aciertos:</span>
                        <span className="font-medium text-green-700">{d.aciertos}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-red-600">Errores:</span>
                        <span className="font-medium text-red-700">{d.errores}</span>
                      </div>
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
                  className="border bg-white rounded-2xl"
                  style={{ borderColor: COLORS[d.tipo], backgroundColor: `${COLORS[d.tipo]}10` }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-center text-gray-900">
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
                              <span className="font-medium text-gray-700">{formatearFecha(mp.fecha)}</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-xs text-gray-600">Precisión</span>
                              <span className="text-lg font-semibold text-green-600">{mp.porcentaje}%</span>
                            </div>
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-gray-100 h-8 px-1 flex items-center">
                            <div className="relative w-full h-5 overflow-hidden rounded-full">
                              <div className="absolute left-0 top-0 h-full bg-green-500" style={{ width: `${accPct}%` }} />
                              <div className="absolute right-0 top-0 h-full bg-red-500" style={{ width: `${errPct}%` }} />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
                              <span className="text-gray-700">Aciertos:</span>
                              <span className="font-medium text-gray-900">{mp.aciertos}</span>
                              <span className="text-gray-400">/ {total}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
                              <span className="text-gray-700">Errores:</span>
                              <span className="font-medium text-red-600">{mp.errores}</span>
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
