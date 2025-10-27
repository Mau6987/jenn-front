"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { ArrowLeft, Target, Award, Star, Zap, Activity } from "lucide-react"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

export default function RankingPage() {
  const [alcanceData, setAlcanceData] = useState([])
  const [pliometriaData, setPliometriaData] = useState([])
  const [loading, setLoading] = useState(true)
  const [carrera, setCarrera] = useState("general")
  const [posicion, setPosicion] = useState("general")
  const [tipoPliometria, setTipoPliometria] = useState("todos")
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerDetails, setPlayerDetails] = useState(null)

  useEffect(() => {
    cargarRankings()
  }, [carrera, posicion, tipoPliometria])

  const cargarRankings = async () => {
    try {
      setLoading(true)

      // Cargar ranking de alcance
      let alcanceUrl = `${BACKEND_URL}/api/ranking/alcance?limit=10`
      if (carrera !== "general") alcanceUrl += `&carrera=${carrera}`
      if (posicion !== "general") alcanceUrl += `&posicion=${posicion}`

      const alcanceResponse = await fetch(alcanceUrl)
      const alcanceResult = await alcanceResponse.json()

      if (alcanceResult.success) {
        const mappedAlcance = (alcanceResult.data?.top || []).map((item, index) => ({
          cuentaId: item.cuentaId,
          nombre: `${item.jugador.nombres} ${item.jugador.apellidos}`,
          imagen: item.jugador.imagen || "/placeholder.svg",
          mejor_alcance: item.mejor_alcance,
          mejor_potencia: item.mejor_potencia,
          promedio_alcance: item.promedio_alcance,
          promedio_potencia: item.promedio_potencia,
          posicion: index + 1,
          jugador: item.jugador,
        }))
        setAlcanceData(mappedAlcance)
      }

      // Cargar ranking de pliometría
      let pliometriaUrl = `${BACKEND_URL}/api/ranking/pliometria?limit=10`
      if (carrera !== "general") pliometriaUrl += `&carrera=${carrera}`
      if (posicion !== "general") pliometriaUrl += `&posicion=${posicion}`
      if (tipoPliometria !== "todos") pliometriaUrl += `&tipo=${tipoPliometria}`

      const pliometriaResponse = await fetch(pliometriaUrl)
      const pliometriaResult = await pliometriaResponse.json()

      if (pliometriaResult.success) {
        const mappedPliometria = (pliometriaResult.data?.top || []).map((item, index) => ({
          cuentaId: item.cuentaId,
          nombre: `${item.jugador.nombres} ${item.jugador.apellidos}`,
          imagen: item.jugador.imagen || "/placeholder.svg",
          mejor_promedio_fuerzas: item.mejor_promedio_fuerzas,
          mejor_potencia: item.mejor_potencia,
          promedio_fuerzas: item.promedio_fuerzas,
          promedio_potencia: item.promedio_potencia,
          posicion: index + 1,
          jugador: item.jugador,
        }))
        setPliometriaData(mappedPliometria)
      }
    } catch (error) {
      console.error("Error loading rankings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player)
    setPlayerDetails(player)
  }

  const getPodiumHeight = (position) => {
    if (position === 1) return "h-40"
    if (position === 2) return "h-32"
    if (position === 3) return "h-28"
    return "h-24"
  }

  const getBadgeColor = (position) => {
    if (position === 1) return "bg-[#800020] text-white shadow-lg shadow-[#800020]/50"
    if (position === 2) return "bg-[#800020] text-white shadow-lg shadow-[#800020]/50"
    if (position === 3) return "bg-[#800020] text-white shadow-lg shadow-[#800020]/50"
    if (position <= 5) return "bg-green-400 text-white shadow-md shadow-green-400/50"
    return "bg-gray-300 text-gray-700"
  }

  const renderPodium = (data, metricKey, metricLabel, icon) => {
    const top3 = data.slice(0, 3)

    return (
      <div className="flex items-end justify-center gap-4 px-4">
        {/* 2nd Place */}
        {top3.length > 1 && top3[1] && (
          <div
            className="flex-1 max-w-[140px] cursor-pointer group animate-slide-up"
            style={{ animationDelay: "0.2s" }}
            onClick={() => handlePlayerClick(top3[1])}
          >
            <div className="text-center mb-3">
              <div className="relative inline-block">
                <Avatar className="w-20 h-20 border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <AvatarImage src={top3[1].imagen || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white font-bold text-2xl">
                    {top3[1].nombre.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -top-2 -right-2 w-9 h-9 rounded-full ${getBadgeColor(2)} flex items-center justify-center font-black text-base z-20`}
                >
                  2
                </div>
              </div>
              <p className="font-bold text-white mt-2 text-xs truncate px-1">{top3[1].nombre}</p>
            </div>
            <div
              className={`bg-gradient-to-b from-pink-100 to-pink-200 ${getPodiumHeight(2)} rounded-t-2xl flex flex-col items-center justify-center shadow-xl`}
            >
              {icon}
              <p className="text-gray-900 text-2xl font-black">{top3[1][metricKey]}</p>
              <p className="text-gray-600 text-[10px] font-bold mt-0.5">{metricLabel}</p>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {top3.length > 0 && top3[0] && (
          <div
            className="flex-1 max-w-[160px] cursor-pointer group animate-slide-up"
            style={{ animationDelay: "0.1s" }}
            onClick={() => handlePlayerClick(top3[0])}
          >
            <div className="text-center mb-3">
              <div className="relative inline-block">
                <Avatar className="w-28 h-28 border-4 border-yellow-400 shadow-2xl shadow-yellow-500/50 group-hover:scale-110 transition-transform duration-300 animate-pulse-slow">
                  <AvatarImage src={top3[0].imagen || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-3xl">
                    {top3[0].nombre.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -top-3 -right-3 w-11 h-11 rounded-full ${getBadgeColor(1)} flex items-center justify-center font-black text-lg z-20 animate-bounce-slow`}
                >
                  1
                </div>
                <Star className="absolute -top-1 -left-1 h-5 w-5 text-yellow-400 fill-yellow-400 animate-spin-slow z-20" />
              </div>
              <p className="font-bold text-white mt-2 text-sm truncate px-1">{top3[0].nombre}</p>
            </div>
            <div
              className={`bg-gradient-to-b from-yellow-100 to-yellow-200 ${getPodiumHeight(1)} rounded-t-2xl flex flex-col items-center justify-center shadow-2xl`}
            >
              {icon}
              <p className="text-gray-900 text-3xl font-black">{top3[0][metricKey]}</p>
              <p className="text-gray-700 text-xs font-bold mt-0.5">{metricLabel}</p>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {top3.length > 2 && top3[2] && (
          <div
            className="flex-1 max-w-[140px] cursor-pointer group animate-slide-up"
            style={{ animationDelay: "0.3s" }}
            onClick={() => handlePlayerClick(top3[2])}
          >
            <div className="text-center mb-3">
              <div className="relative inline-block">
                <Avatar className="w-20 h-20 border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <AvatarImage src={top3[2].imagen || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-2xl">
                    {top3[2].nombre.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -top-2 -right-2 w-9 h-9 rounded-full ${getBadgeColor(3)} flex items-center justify-center font-black text-base z-20`}
                >
                  3
                </div>
              </div>
              <p className="font-bold text-white mt-2 text-xs truncate px-1">{top3[2].nombre}</p>
            </div>
            <div
              className={`bg-gradient-to-b from-purple-100 to-purple-200 ${getPodiumHeight(3)} rounded-t-2xl flex flex-col items-center justify-center shadow-xl`}
            >
              {icon}
              <p className="text-gray-900 text-2xl font-black">{top3[2][metricKey]}</p>
              <p className="text-gray-600 text-[10px] font-bold mt-0.5">{metricLabel}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRestOfList = (data, metricKey) => {
    const rest = data.slice(3)

    if (rest.length === 0) return null

    return (
      <div className="space-y-3">
        {rest.map((player, index) => (
          <div
            key={player.cuentaId}
            className="flex items-center gap-4 p-4 bg-white hover:bg-gray-50 rounded-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-[#800020] hover:shadow-lg group"
            onClick={() => handlePlayerClick(player)}
          >
            <Avatar className="w-12 h-12 border-2 border-gray-200 shadow-md group-hover:border-[#800020] transition-all duration-300">
              <AvatarImage src={player.imagen || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-teal-400 to-teal-600 text-white font-bold text-lg">
                {player.nombre.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="font-bold text-gray-900 group-hover:text-[#800020] transition-colors duration-300">
                {player.nombre}
              </p>
              <p className="text-sm text-gray-500 font-medium">Potencia: {player.mejor_potencia}</p>
            </div>

            <div className="text-right mr-2">
              <p className="text-2xl font-black text-blue-600">{player[metricKey]}</p>
            </div>

            <div
              className={`w-12 h-12 rounded-full ${getBadgeColor(player.posicion)} flex items-center justify-center font-black text-lg shrink-0`}
            >
              {player.posicion}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#800020] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Cargando rankings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-[#800020] via-[#a00028] to-[#800020] pt-8 pb-32 px-4 relative overflow-hidden">
          <div className="relative z-10">
            <button
              onClick={() => window.history.back()}
              className="mb-6 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Rankings Generales</h1>
              <p className="text-white/80 text-sm font-medium">Mejores marcas de todos los jugadores</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="alcance" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-sm rounded-xl p-1 mb-8">
                <TabsTrigger
                  value="alcance"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#800020] text-white font-semibold transition-all duration-300"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Alcance
                </TabsTrigger>
                <TabsTrigger
                  value="pliometria"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#800020] text-white font-semibold transition-all duration-300"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Pliometría
                </TabsTrigger>
              </TabsList>

              {/* Alcance Tab */}
              <TabsContent value="alcance">
                {alcanceData.length > 0 &&
                  renderPodium(
                    alcanceData,
                    "mejor_alcance",
                    "Alcance",
                    <Target className="h-8 w-8 text-blue-600 mb-1 animate-bounce-slow" />,
                  )}
              </TabsContent>

              {/* Pliometria Tab */}
              <TabsContent value="pliometria">
                {/* Tipo Filter */}
                <div className="mb-6">
                  <Select value={tipoPliometria} onValueChange={setTipoPliometria}>
                    <SelectTrigger className="w-full md:w-64 bg-white/20 backdrop-blur-sm text-white border-white/30 rounded-xl h-11 font-medium hover:bg-white/30 transition-all duration-300 mx-auto">
                      <SelectValue placeholder="Tipo de prueba" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="salto">Salto</SelectItem>
                      <SelectItem value="caida">Caída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {pliometriaData.length > 0 &&
                  renderPodium(
                    pliometriaData,
                    "mejor_promedio_fuerzas",
                    "Fuerzas",
                    <Activity className="h-8 w-8 text-purple-600 mb-1 animate-bounce-slow" />,
                  )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="bg-white rounded-t-3xl -mt-16 relative z-20 shadow-2xl">
          <div className="p-6">
            {/* Filters */}
            <div className="flex gap-3 mb-6">
              <Select value={carrera} onValueChange={setCarrera}>
                <SelectTrigger className="flex-1 bg-gray-50 text-gray-700 border-gray-200 rounded-xl h-11 font-medium hover:border-[#800020] transition-all duration-300">
                  <SelectValue placeholder="Carrera" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="general">Todas las carreras</SelectItem>
                  <SelectItem value="derecho">Derecho</SelectItem>
                  <SelectItem value="ingeniera de sistemas">Ingeniería de Sistemas</SelectItem>
                  <SelectItem value="ingeniera industrial">Ingeniería Industrial</SelectItem>
                  <SelectItem value="medicina">Medicina</SelectItem>
                </SelectContent>
              </Select>

              <Select value={posicion} onValueChange={setPosicion}>
                <SelectTrigger className="flex-1 bg-gray-50 text-gray-700 border-gray-200 rounded-xl h-11 font-medium hover:border-[#800020] transition-all duration-300">
                  <SelectValue placeholder="Posición" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="general">Todas las posiciones</SelectItem>
                  <SelectItem value="armador">Armador</SelectItem>
                  <SelectItem value="central">Central</SelectItem>
                  <SelectItem value="punta">Punta</SelectItem>
                  <SelectItem value="libero">Líbero</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="alcance" className="w-full">
              <TabsContent value="alcance">{renderRestOfList(alcanceData, "mejor_alcance")}</TabsContent>
              <TabsContent value="pliometria">{renderRestOfList(pliometriaData, "mejor_promedio_fuerzas")}</TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Player Details Modal */}
      <Dialog open={selectedPlayer !== null} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-md bg-white border-gray-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="h-6 w-6 text-[#800020]" />
              Detalles del Jugador
            </DialogTitle>
          </DialogHeader>

          {playerDetails && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-[#800020] to-[#a00028] rounded-xl">
                <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                  <AvatarImage src={playerDetails.imagen || "/placeholder.svg"} />
                  <AvatarFallback className="bg-white text-[#800020] font-bold text-xl">
                    {playerDetails.nombre.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-xl text-white">{playerDetails.nombre}</p>
                  <p className="text-sm text-white/80">{playerDetails.jugador?.carrera}</p>
                  <p className="text-sm text-white/80">{playerDetails.jugador?.posicion_principal}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {playerDetails.mejor_alcance !== undefined && (
                  <>
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-4 text-center">
                        <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{playerDetails.mejor_alcance} cm</p>
                        <p className="text-xs text-blue-600 font-semibold">Mejor Alcance</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="p-4 text-center">
                        <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{playerDetails.mejor_potencia}</p>
                        <p className="text-xs text-purple-600 font-semibold">Mejor Potencia</p>
                      </CardContent>
                    </Card>
                  </>
                )}
                {playerDetails.mejor_promedio_fuerzas !== undefined && (
                  <>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardContent className="p-4 text-center">
                        <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{playerDetails.mejor_promedio_fuerzas}</p>
                        <p className="text-xs text-green-600 font-semibold">Mejor Fuerzas</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                      <CardContent className="p-4 text-center">
                        <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{playerDetails.mejor_potencia}</p>
                        <p className="text-xs text-yellow-600 font-semibold">Mejor Potencia</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
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

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
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

        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  )
}
