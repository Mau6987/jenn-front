"use client"

import { useState, useEffect } from "react"
import {
  Trophy,
  Users,
  Clock,
  Target,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  User,
  GraduationCap,
} from "lucide-react"

export default function RankingPage() {
  const [rankingData, setRankingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("secuencial")
  const [expandedPlayer, setExpandedPlayer] = useState(null)

  const fetchRanking = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("https://voley-backend-nhyl.onrender.com/api/ranking/general")

      if (!response.ok) {
        throw new Error("Error al obtener el ranking")
      }

      const data = await response.json()

      if (data.success) {
        setRankingData(data.data)
      } else {
        throw new Error(data.message || "Error al obtener el ranking")
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRanking()
  }, [])

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getPositionText = (position) => {
    switch (position) {
      case 0:
        return "1er Lugar"
      case 1:
        return "2do Lugar"
      case 2:
        return "3er Lugar"
      default:
        return `${position + 1}° Lugar`
    }
  }

  const calculateAge = (birthDate) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age
  }

  const tabs = [
    { id: "secuencial", label: "Secuencial", icon: Clock },
    { id: "aleatorio", label: "Aleatorio", icon: Target },
    { id: "manual", label: "Manual", icon: Users },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium text-lg">Cargando ranking...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Error al cargar el ranking</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={fetchRanking}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl hover:from-red-800 hover:to-red-700 font-medium mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        <div className="p-4 lg:p-6 max-w-full">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                  <span>Ranking de Pruebas de Reacción</span>
                </h1>
                <p className="text-gray-600 text-sm">Top 3 mejores jugadores de voleibol por categoría</p>
              </div>
              <button
                onClick={fetchRanking}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all duration-300 font-medium shadow-md hover:shadow-lg w-full sm:w-auto justify-center"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Actualizar</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-6 bg-white rounded-xl p-1 shadow-lg border border-slate-200/60">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-300 flex-1 justify-center ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-red-900 to-red-800 text-white shadow-lg"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm sm:text-base">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Ranking Content - Top 3 Only */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden backdrop-blur-sm">
              {!rankingData ||
              !rankingData.topPorTipo ||
              !rankingData.topPorTipo[activeTab] ||
              rankingData.topPorTipo[activeTab].length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No hay datos de ranking</h3>
                  <p className="text-slate-500">No se encontraron pruebas finalizadas para esta categoría.</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="bg-slate-600 px-4 sm:px-8 py-6 border-2 border-gray-900 relative overflow-hidden">
                    <div className="relative text-center">
                      <h2 className="text-lg sm:text-xl font-bold text-white uppercase tracking-wider">
                        Top 3 - {tabs.find((t) => t.id === activeTab)?.label}
                      </h2>
                    </div>
                  </div>

                  <div className="p-4 sm:p-8">
                    <div className="space-y-4">
                      {rankingData.topPorTipo[activeTab].slice(0, 3).map((item, index) => (
                        <div
                          key={item.cuenta.id}
                          className="relative bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl hover:bg-red-50 hover:border-red-200 transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                            {/* Position */}
                            <div className="flex-shrink-0 flex items-center justify-center lg:justify-start space-x-3">
                              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100">
                                <span className="text-lg font-bold text-slate-600">#{index + 1}</span>
                              </div>
                              <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                  {getPositionText(index)}
                                </h3>
                              </div>
                            </div>

                            {/* Player Info */}
                            <div className="flex-grow">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
                                </div>
                                <div>
                                  <h4 className="text-base sm:text-lg font-bold text-slate-900">
                                    {item.cuenta.jugador.nombres} {item.cuenta.jugador.apellidos}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-slate-600">
                                    {item.cuenta.jugador.posicion_principal}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-4 text-center">
                              <div>
                                <span className="text-xs font-medium text-slate-600 block">Aciertos</span>
                                <span className="text-sm sm:text-lg font-bold text-green-600">
                                  {item.totalAciertos}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-600 block">Errores</span>
                                <span className="text-sm sm:text-lg font-bold text-red-600">{item.totalErrores}</span>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-600 block">Intentos</span>
                                <span className="text-sm sm:text-lg font-bold text-slate-700">
                                  {item.totalIntentos}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-600 block">Efectividad</span>
                                <span className="text-sm sm:text-lg font-bold text-blue-600">
                                  {item.porcentajePromedio}%
                                </span>
                              </div>
                            </div>

                            {/* Cantidad de Pruebas - Highlighted */}
                            <div className="flex-shrink-0 bg-red-100 border border-red-200 rounded-lg p-3 sm:p-4 text-center">
                              <div className="flex items-center justify-center space-x-2 mb-1">
                                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                                <span className="text-xs font-medium text-red-700">Pruebas</span>
                              </div>
                              <span className="text-xl sm:text-2xl font-bold text-red-600">{item.cantidadPruebas}</span>
                            </div>

                            {/* View Details Button */}
                            <div className="flex-shrink-0">
                              <button
                                onClick={() =>
                                  setExpandedPlayer(expandedPlayer === item.cuenta.id ? null : item.cuenta.id)
                                }
                                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all duration-300 font-medium w-full lg:w-auto"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="text-sm">{expandedPlayer === item.cuenta.id ? "Ocultar" : "Ver"}</span>
                              </button>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {expandedPlayer === item.cuenta.id && (
                            <div className="mt-6 pt-6 border-t border-slate-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2 text-sm">
                                  <GraduationCap className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-600">Carrera:</span>
                                  <span className="font-medium text-slate-900">{item.cuenta.jugador.carrera}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <User className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-600">Edad:</span>
                                  <span className="font-medium text-slate-900">
                                    {calculateAge(item.cuenta.jugador.fecha_nacimiento)} años
                                  </span>
                                </div>
                                {item.cuenta.jugador.posicion_secundaria && (
                                  <div className="flex items-center space-x-2 text-sm">
                                    <Users className="h-4 w-4 text-slate-500" />
                                    <span className="text-slate-600">Posición secundaria:</span>
                                    <span className="font-medium text-slate-900">
                                      {item.cuenta.jugador.posicion_secundaria}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Top General section - Top 3 Only */}
            {rankingData && rankingData.topGeneral && rankingData.topGeneral.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden backdrop-blur-sm">
                <div className="bg-gradient-to-r from-red-900 to-red-800 px-4 sm:px-8 py-6">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-3">
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>Top 3 General (Todas las Categorías)</span>
                  </h2>
                </div>
                <div className="p-4 sm:p-8">
                  <div className="space-y-4">
                    {rankingData.topGeneral.slice(0, 3).map((item, index) => (
                      <div
                        key={item.cuenta.id}
                        className="relative bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl hover:bg-red-50 hover:border-red-200 transition-all duration-300 transform hover:-translate-y-1"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                          {/* Position */}
                          <div className="flex-shrink-0 flex items-center justify-center lg:justify-start space-x-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100">
                              <span className="text-lg font-bold text-slate-600">#{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                {getPositionText(index)}
                              </h3>
                            </div>
                          </div>

                          {/* Player Info */}
                          <div className="flex-grow">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
                              </div>
                              <div>
                                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                                  {item.cuenta.jugador.nombres} {item.cuenta.jugador.apellidos}
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-600">
                                  {item.cuenta.jugador.posicion_principal}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-4 text-center">
                            <div>
                              <span className="text-xs font-medium text-slate-600 block">Aciertos</span>
                              <span className="text-sm sm:text-lg font-bold text-green-600">{item.totalAciertos}</span>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-slate-600 block">Errores</span>
                              <span className="text-sm sm:text-lg font-bold text-red-600">{item.totalErrores}</span>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-slate-600 block">Intentos</span>
                              <span className="text-sm sm:text-lg font-bold text-slate-700">{item.totalIntentos}</span>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-slate-600 block">Efectividad</span>
                              <span className="text-sm sm:text-lg font-bold text-blue-600">
                                {item.porcentajePromedio}%
                              </span>
                            </div>
                          </div>

                          {/* Cantidad de Pruebas - Highlighted */}
                          <div className="flex-shrink-0 bg-red-100 border border-red-200 rounded-lg p-3 sm:p-4 text-center">
                            <div className="flex items-center justify-center space-x-2 mb-1">
                              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                              <span className="text-xs font-medium text-red-700">Pruebas</span>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-red-600">{item.cantidadPruebas}</span>
                          </div>

                          {/* View Details Button */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={() =>
                                setExpandedPlayer(
                                  expandedPlayer === `general-${item.cuenta.id}` ? null : `general-${item.cuenta.id}`,
                                )
                              }
                              className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all duration-300 font-medium w-full lg:w-auto"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="text-sm">
                                {expandedPlayer === `general-${item.cuenta.id}` ? "Ocultar" : "Ver"}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedPlayer === `general-${item.cuenta.id}` && (
                          <div className="mt-6 pt-6 border-t border-slate-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex items-center space-x-2 text-sm">
                                <GraduationCap className="h-4 w-4 text-slate-500" />
                                <span className="text-slate-600">Carrera:</span>
                                <span className="font-medium text-slate-900">{item.cuenta.jugador.carrera}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <User className="h-4 w-4 text-slate-500" />
                                <span className="text-slate-600">Edad:</span>
                                <span className="font-medium text-slate-900">
                                  {calculateAge(item.cuenta.jugador.fecha_nacimiento)} años
                                </span>
                              </div>
                              {item.cuenta.jugador.posicion_secundaria && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <Users className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-600">Posición secundaria:</span>
                                  <span className="font-medium text-slate-900">
                                    {item.cuenta.jugador.posicion_secundaria}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
