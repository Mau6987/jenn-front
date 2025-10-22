"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { ArrowLeft, Target, TrendingUp, Award, Trophy } from "lucide-react"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

export default function ResultadosGeneralPage() {
  const [rankingData, setRankingData] = useState([])
  const [userPosition, setUserPosition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("general")
  const [carrera, setCarrera] = useState("general")
  const [posicion, setPosicion] = useState("general")
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerDetails, setPlayerDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    cargarRanking()
  }, [periodo, carrera, posicion])

  const cargarRanking = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem("idUser")

      let url = `${BACKEND_URL}/api/ranking/general?periodo=${periodo}`
      if (carrera !== "general") url += `&carrera=${carrera}`
      if (posicion !== "general") url += `&posicion=${posicion}`
      if (userId) url += `&idUser=${userId}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setRankingData(data.data || [])
        setUserPosition(data.userPosition || null)
      }
    } catch (error) {
      console.error("Error loading ranking:", error)
    } finally {
      setLoading(false)
    }
  }

  const cargarDetallesJugador = async (cuentaId) => {
    try {
      setLoadingDetails(true)
      const response = await fetch(`${BACKEND_URL}/api/ranking/detalles/${cuentaId}?periodo=${periodo}`)
      const data = await response.json()

      if (data.success) {
        setPlayerDetails(data.data)
      }
    } catch (error) {
      console.error("Error loading player details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player)
    cargarDetallesJugador(player.cuentaId)
  }

  const getPodiumHeight = (position) => {
    if (position === 1) return "h-48"
    if (position === 2) return "h-36"
    if (position === 3) return "h-32"
    return "h-24"
  }

  const getPodiumColor = (position) => {
    if (position === 1) return "from-[#800020] to-[#600018]"
    if (position === 2) return "from-gray-400 to-gray-500"
    if (position === 3) return "from-gray-500 to-gray-600"
    return "from-gray-600 to-gray-700"
  }

  const getBadgeColor = (position) => {
    if (position === 1)
      return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/50"
    if (position === 2) return "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 shadow-lg shadow-gray-400/50"
    if (position === 3) return "bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/50"
    return "bg-gray-200 text-gray-700"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#800020] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Cargando ranking...</p>
        </div>
      </div>
    )
  }

  const top3 = rankingData.slice(0, 3)
  const rest = rankingData.slice(3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <button
            onClick={() => window.history.back()}
            className="p-3 bg-white hover:bg-gray-50 rounded-xl transition-all duration-300 hover:scale-105 shadow-md border border-gray-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900">Ranking</h1>
            <p className="text-gray-500 text-sm mt-1">Tabla de posiciones general</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white border-gray-200 shadow-lg mb-8 animate-fade-in-up">
          <CardContent className="p-6">
            <Tabs value={periodo} onValueChange={setPeriodo} className="w-full mb-6">
              <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 rounded-xl p-1">
                <TabsTrigger
                  value="semanal"
                  className="rounded-lg data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 font-semibold transition-all duration-300"
                >
                  Semanal
                </TabsTrigger>
                <TabsTrigger
                  value="mensual"
                  className="rounded-lg data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 font-semibold transition-all duration-300"
                >
                  Mensual
                </TabsTrigger>
                <TabsTrigger
                  value="general"
                  className="rounded-lg data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 font-semibold transition-all duration-300"
                >
                  General
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap gap-4">
              <Select value={carrera} onValueChange={setCarrera}>
                <SelectTrigger className="flex-1 min-w-[160px] bg-gray-50 text-gray-700 border-gray-200 rounded-xl h-11 font-medium hover:border-[#800020] transition-all duration-300">
                  <SelectValue placeholder="Carrera" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="general">Todas las carreras</SelectItem>
                  <SelectItem value="Ingeniería">Ingeniería</SelectItem>
                  <SelectItem value="Medicina">Medicina</SelectItem>
                  <SelectItem value="Derecho">Derecho</SelectItem>
                </SelectContent>
              </Select>

              <Select value={posicion} onValueChange={setPosicion}>
                <SelectTrigger className="flex-1 min-w-[160px] bg-gray-50 text-gray-700 border-gray-200 rounded-xl h-11 font-medium hover:border-[#800020] transition-all duration-300">
                  <SelectValue placeholder="Posición" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="general">Todas las posiciones</SelectItem>
                  <SelectItem value="armador">Armador</SelectItem>
                  <SelectItem value="opuesto">Opuesto</SelectItem>
                  <SelectItem value="central">Central</SelectItem>
                  <SelectItem value="receptor">Receptor</SelectItem>
                  <SelectItem value="libero">Líbero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {rankingData.length === 0 ? (
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardContent className="p-16 text-center">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No hay datos disponibles</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div className="mb-12 bg-gradient-to-br from-[#800020] to-[#600018] rounded-3xl p-8 shadow-2xl animate-fade-in-up">
                <div className="flex items-end justify-center gap-6 mb-8">
                  {/* 2nd Place */}
                  {top3[1] && (
                    <div
                      className="flex-1 max-w-[180px] cursor-pointer group animate-slide-up"
                      style={{ animationDelay: "0.2s" }}
                      onClick={() => handlePlayerClick(top3[1])}
                    >
                      <div className="text-center mb-4">
                        <div className="relative inline-block">
                          <Avatar className="w-24 h-24 border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                            <AvatarImage src={top3[1].imagen || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gray-200 text-gray-700 font-bold text-2xl">
                              {top3[1].nombre.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -top-2 -right-2 w-10 h-10 rounded-full ${getBadgeColor(2)} flex items-center justify-center font-black text-lg animate-bounce-slow`}
                          >
                            2
                          </div>
                        </div>
                        <p className="font-bold text-white mt-3 text-sm truncate">{top3[1].nombre}</p>
                      </div>
                      <div
                        className={`bg-gradient-to-b ${getPodiumColor(2)} ${getPodiumHeight(2)} rounded-t-2xl flex flex-col items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                      >
                        <p className="text-white text-3xl font-black">{top3[1].porcentajePromedio}%</p>
                        <p className="text-white/80 text-xs font-semibold mt-1">Precisión</p>
                      </div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {top3[0] && (
                    <div
                      className="flex-1 max-w-[200px] cursor-pointer group animate-slide-up"
                      style={{ animationDelay: "0.1s" }}
                      onClick={() => handlePlayerClick(top3[0])}
                    >
                      <div className="text-center mb-4">
                        <div className="relative inline-block">
                          <Avatar className="w-32 h-32 border-4 border-yellow-400 shadow-2xl shadow-yellow-500/50 group-hover:scale-110 transition-transform duration-300 animate-pulse-slow">
                            <AvatarImage src={top3[0].imagen || "/placeholder.svg"} />
                            <AvatarFallback className="bg-yellow-100 text-yellow-800 font-bold text-3xl">
                              {top3[0].nombre.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -top-3 -right-3 w-12 h-12 rounded-full ${getBadgeColor(1)} flex items-center justify-center font-black text-xl animate-bounce-slow`}
                          >
                            1
                          </div>
                        </div>
                        <p className="font-bold text-white mt-3 text-base truncate">{top3[0].nombre}</p>
                      </div>
                      <div
                        className={`bg-gradient-to-b ${getPodiumColor(1)} ${getPodiumHeight(1)} rounded-t-2xl flex flex-col items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-300`}
                      >
                        <Trophy className="h-8 w-8 text-yellow-400 mb-2 animate-bounce-slow" />
                        <p className="text-white text-4xl font-black">{top3[0].porcentajePromedio}%</p>
                        <p className="text-white/90 text-sm font-semibold mt-1">Precisión</p>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {top3[2] && (
                    <div
                      className="flex-1 max-w-[180px] cursor-pointer group animate-slide-up"
                      style={{ animationDelay: "0.3s" }}
                      onClick={() => handlePlayerClick(top3[2])}
                    >
                      <div className="text-center mb-4">
                        <div className="relative inline-block">
                          <Avatar className="w-24 h-24 border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                            <AvatarImage src={top3[2].imagen || "/placeholder.svg"} />
                            <AvatarFallback className="bg-amber-100 text-amber-800 font-bold text-2xl">
                              {top3[2].nombre.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -top-2 -right-2 w-10 h-10 rounded-full ${getBadgeColor(3)} flex items-center justify-center font-black text-lg animate-bounce-slow`}
                          >
                            3
                          </div>
                        </div>
                        <p className="font-bold text-white mt-3 text-sm truncate">{top3[2].nombre}</p>
                      </div>
                      <div
                        className={`bg-gradient-to-b ${getPodiumColor(3)} ${getPodiumHeight(3)} rounded-t-2xl flex flex-col items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                      >
                        <p className="text-white text-3xl font-black">{top3[2].porcentajePromedio}%</p>
                        <p className="text-white/80 text-xs font-semibold mt-1">Precisión</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rest of Players */}
            {rest.length > 0 && (
              <div className="space-y-3">
                {rest.map((player, index) => (
                  <Card
                    key={player.cuentaId}
                    className="bg-white border-gray-200 hover:border-[#800020] shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] animate-fade-in-up group"
                    style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                    onClick={() => handlePlayerClick(player)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-5">
                        {/* Position Number */}
                        <div className="w-12 text-center">
                          <div className="text-3xl font-black text-gray-300 group-hover:text-[#800020] transition-colors duration-300">
                            {player.posicion}
                          </div>
                        </div>

                        {/* Avatar */}
                        <Avatar className="w-14 h-14 border-2 border-gray-200 shadow-md group-hover:border-[#800020] transition-all duration-300">
                          <AvatarImage src={player.imagen || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gray-100 text-gray-700 font-bold text-lg">
                            {player.nombre.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Player Info */}
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg group-hover:text-[#800020] transition-colors duration-300">
                            {player.nombre}
                          </p>
                          <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {player.totalIntentos} intentos
                          </p>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <p className="text-3xl font-black text-[#800020]">{player.porcentajePromedio}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Player Details Modal */}
      <Dialog open={selectedPlayer !== null} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-md bg-white border-gray-200 animate-scale-in rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-[#800020]" />
              Detalles del Jugador
            </DialogTitle>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#800020] border-t-transparent"></div>
            </div>
          ) : playerDetails ? (
            <div className="space-y-6">
              {/* Player Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Avatar className="w-16 h-16 border-4 border-[#800020] shadow-lg">
                  <AvatarImage src={playerDetails.imagen || "/placeholder.svg"} />
                  <AvatarFallback className="bg-[#800020] text-white font-bold text-xl">
                    {playerDetails.nombre.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-xl text-gray-900">{playerDetails.nombre}</p>
                  <p className="text-sm text-gray-600">
                    {playerDetails.jugador?.carrera || "N/A"} • {playerDetails.jugador?.posicion_principal || "N/A"}
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-blue-50 border-blue-200 hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{playerDetails.totalIntentos}</p>
                    <p className="text-xs text-blue-600 font-semibold">Total Intentos</p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200 hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{playerDetails.porcentajePromedio}%</p>
                    <p className="text-xs text-green-600 font-semibold">Precisión</p>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200 hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-4 text-center">
                    <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{playerDetails.totalAciertos}</p>
                    <p className="text-xs text-purple-600 font-semibold">Aciertos</p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200 hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600 mx-auto mb-2">✕</div>
                    <p className="text-2xl font-bold text-gray-900">{playerDetails.totalErrores}</p>
                    <p className="text-xs text-red-600 font-semibold">Errores</p>
                  </CardContent>
                </Card>
              </div>

              {/* Test Type Breakdown */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900">Rendimiento por Tipo</h3>

                {["secuencial", "aleatorio", "manual"].map((tipo) => {
                  const data = playerDetails.resumenPorTipo[tipo]
                  const colors = {
                    secuencial: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
                    aleatorio: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-600" },
                    manual: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600" },
                  }
                  const color = colors[tipo]

                  return (
                    <Card
                      key={tipo}
                      className={`${color.bg} border ${color.border} hover:scale-[1.02] transition-transform duration-300`}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-900 capitalize">{tipo}</p>
                            <p className="text-sm text-gray-600">
                              {data.totalAciertos}/{data.totalIntentos} aciertos
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${color.text}`}>{data.porcentajePromedio}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
