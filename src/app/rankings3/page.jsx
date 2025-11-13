"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Trophy } from "lucide-react"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"
import { Target, Award, Zap, Activity } from "lucide-react"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

// --- Podio reutilizable ---
const Podium = ({ players, valueKey, valueSuffix = "", valueLabel = "", onPlayerClick }) => {
  const [first, second, third] = players

  const getPodiumHeight = (position) => (position === 1 ? "h-56" : position === 2 ? "h-44" : "h-36")
  const getPodiumColor = (position) =>
    position === 1
      ? "from-yellow-400 via-yellow-500 to-yellow-600"
      : position === 2
        ? "from-gray-300 via-gray-400 to-gray-500"
        : "from-orange-400 via-orange-500 to-orange-600"

  const renderPodiumPlayer = (player, position) => {
    if (!player) return null
    return (
      <div
        className="flex flex-col items-center animate-podium-rise cursor-pointer group"
        style={{ animationDelay: `${position * 0.2}s` }}
        onClick={() => onPlayerClick && onPlayerClick(player)}
      >
        <div className="relative mb-4 transform transition-all duration-300 hover:scale-110">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
          <Avatar className="w-24 h-24 border-4 border-white shadow-2xl relative z-10">
            <AvatarImage src={player.imagen || "/placeholder.svg"} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-2xl">
              {player.nombre?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="text-center mb-3 px-2 group-hover:scale-105 transition-transform duration-300">
          <p className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{player.nombre}</p>
          <p className="text-3xl font-black text-blue-600">
            {player[valueKey]}
            {valueSuffix}
          </p>
          {valueLabel && <p className="text-xs text-gray-500">{valueLabel}</p>}
        </div>

        <div
          className={`w-32 ${getPodiumHeight(position)} bg-gradient-to-b ${getPodiumColor(position)} rounded-t-2xl shadow-2xl flex items-center justify-center relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <p className="text-white text-6xl font-black drop-shadow-lg">{position}</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end justify-center gap-8 mb-12">
      {second && renderPodiumPlayer(second, 2)}
      {first && renderPodiumPlayer(first, 1)}
      {third && renderPodiumPlayer(third, 3)}
    </div>
  )
}

export default function RankingPage() {
  const [alcanceData, setAlcanceData] = useState([])
  const [pliometriaData, setPliometriaData] = useState([])
  const [loading, setLoading] = useState(true)
  const [carrera, setCarrera] = useState("general")
  const [posicion, setPosicion] = useState("general")
  const [periodo, setPeriodo] = useState("general")
  const [activeTab, setActiveTab] = useState("alcance")
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerDetails, setPlayerDetails] = useState(null)

  useEffect(() => {
    cargarRankings()
  }, [carrera, posicion, periodo])

  const cargarRankings = async () => {
    try {
      setLoading(true)

      // Alcance
      let alcanceUrl = `${BACKEND_URL}/api/ranking/alcance?limit=10`
      if (periodo !== "general") alcanceUrl += `&periodo=${periodo}`
      if (carrera !== "general") alcanceUrl += `&carrera=${carrera}`
      if (posicion !== "general") alcanceUrl += `&posicion=${posicion}`
      const alcanceResponse = await fetch(alcanceUrl)
      const alcanceResult = await alcanceResponse.json()
      if (alcanceResult.success) {
        const mappedAlcance = (alcanceResult.data?.top || []).map((item, index) => ({
          cuentaId: item.cuentaId,
          nombre: `${item.jugador.nombres} ${item.jugador.apellidos}`,
          imagen: getPositionIcon(item.jugador.posicion_principal) || item.jugador.imagen || "/placeholder.svg",
          mejor_alcance: item.mejor_alcance,
          mejor_potencia: item.mejor_potencia,
          promedio_alcance: item.promedio_alcance,
          promedio_potencia: item.promedio_potencia,
          posicion: index + 1,
          jugador: item.jugador,
        }))
        setAlcanceData(mappedAlcance)
      } else setAlcanceData([])

      // Pliometría
      let pliometriaUrl = `${BACKEND_URL}/api/ranking/pliometria?limit=10`
      if (periodo !== "general") pliometriaUrl += `&periodo=${periodo}`
      if (carrera !== "general") pliometriaUrl += `&carrera=${carrera}`
      if (posicion !== "general") pliometriaUrl += `&posicion=${posicion}`
      const pliometriaResponse = await fetch(pliometriaUrl)
      const pliometriaResult = await pliometriaResponse.json()
      if (pliometriaResult.success) {
        const mappedPliometria = (pliometriaResult.data?.top || []).map((item, index) => ({
          cuentaId: item.cuentaId,
          nombre: `${item.jugador.nombres} ${item.jugador.apellidos}`,
          imagen: getPositionIcon(item.jugador.posicion_principal) || item.jugador.imagen || "/placeholder.svg",
          mejor_promedio_fuerzas: item.mejor_fuerza_total,
          mejor_potencia: item.mejor_potencia,
          promedio_fuerzas: item.promedio_fuerza_total,
          promedio_potencia: item.promedio_potencia,
          posicion: index + 1,
          jugador: item.jugador,
        }))
        setPliometriaData(mappedPliometria)
      } else setPliometriaData([])
    } catch (e) {
      console.error("Error loading rankings:", e)
      setAlcanceData([])
      setPliometriaData([])
    } finally {
      setLoading(false)
    }
  }

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player)
    setPlayerDetails(player)
  }

  const getBadgeColor = (position) => {
    if (position === 1) return "bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/50"
    if (position === 2) return "bg-gray-300 text-gray-900 shadow-lg shadow-gray-300/50"
    if (position === 3) return "bg-orange-400 text-white shadow-lg shadow-orange-400/50"
    if (position <= 5) return "bg-green-400 text-white shadow-md shadow-green-400/50"
    return "bg-gray-300 text-gray-700"
  }

  const renderRestOfList = (data, metricKey, metricSuffix = "") => {
    const rest = data.slice(3)
    if (rest.length === 0) return null
    return (
      <div className="space-y-3">
        {rest.map((player, index) => (
          <div
            key={player.cuentaId || `${metricKey}-${index}`}
            className="flex items-center gap-4 p-4 bg-white hover:bg-gray-50 rounded-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-400 hover:shadow-lg group animate-fade-in-up"
            style={{ animationDelay: `${index * 0.06}s` }}
            onClick={() => handlePlayerClick(player)}
          >
            <Avatar className="w-14 h-14 border-2 border-gray-200 shadow-md group-hover:border-blue-400 transition-all duration-300">
              <AvatarImage src={player.imagen || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-teal-400 to-teal-600 text-white font-bold text-lg">
                {player.nombre?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 text-lg">
                {player.nombre}
              </p>
              <p className="text-sm text-gray-500 font-medium">
                {(player.jugador?.posicion_principal && getPositionName(player.jugador.posicion_principal)) || ""} •
                Potencia: {player.mejor_potencia}
              </p>
            </div>

            <div className="text-right mr-2">
              <p className="text-3xl font-black text-blue-600">
                {player[metricKey]}
                {metricSuffix}
              </p>
            </div>

            <div
              className={`w-14 h-14 rounded-full ${getBadgeColor(player.posicion)} flex items-center justify-center font-black text-xl shrink-0`}
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Cargando rankings...</p>
        </div>
      </div>
    )
  }

  const alcanceTop3 = alcanceData.slice(0, 3)
  const plioTop3 = pliometriaData.slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* HEADER AZUL con Tabs, termina antes del podio */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 pt-6 pb-8 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl mb-3">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-1">Rankings</h1>
              <p className="text-white/80 text-xs font-medium">Tabla de liderazgo</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
              <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-sm rounded-xl p-1">
                <TabsTrigger
                  value="alcance"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 text-white font-semibold transition-all duration-300"
                >
                  Alcance
                </TabsTrigger>
                <TabsTrigger
                  value="pliometria"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 text-white font-semibold transition-all duration-300"
                >
                  Pliometría
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPeriodo("general")}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  periodo === "general"
                    ? "bg-white text-blue-700 shadow-lg scale-105"
                    : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                General
              </button>
              <button
                onClick={() => setPeriodo("mensual")}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  periodo === "mensual"
                    ? "bg-white text-blue-700 shadow-lg scale-105"
                    : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setPeriodo("semanal")}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  periodo === "semanal"
                    ? "bg-yellow-400 text-gray-900 shadow-lg scale-105"
                    : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                Semana
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-t-3xl -mt-6 relative z-20 shadow-2xl">
          <div className="p-6 md:p-8 pt-8">
            {activeTab === "alcance" ? (
              alcanceTop3.length > 0 ? (
                <Podium
                  players={alcanceTop3}
                  valueKey="mejor_alcance"
                  valueSuffix=" cm"
                  valueLabel=" alcance"
                  onPlayerClick={handlePlayerClick}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">No hay datos</div>
              )
            ) : plioTop3.length > 0 ? (
              <Podium
                players={plioTop3}
                valueKey="mejor_promedio_fuerzas"
                valueLabel="fuerzas"
                onPlayerClick={handlePlayerClick}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">No hay datos</div>
            )}

            {/* Lista inferior */}
            {activeTab === "alcance"
              ? renderRestOfList(alcanceData, "mejor_alcance", " cm")
              : renderRestOfList(pliometriaData, "mejor_promedio_fuerzas")}
          </div>
        </div>
      </div>

      {/* MODAL */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-md bg-white border-gray-200 animate-scale-in rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="h-6 w-6 text-blue-600" />
              Detalles del Jugador
            </DialogTitle>
          </DialogHeader>

          {playerDetails && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                  <AvatarImage src={playerDetails.imagen || "/placeholder.svg"} />
                  <AvatarFallback className="bg-white text-blue-600 font-bold text-xl">
                    {playerDetails.nombre?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-xl text-white">{playerDetails.nombre}</p>
                  <p className="text-sm text-white/80">
                    {playerDetails.jugador?.carrera || "N/A"} •{" "}
                    {(playerDetails.jugador?.posicion_principal &&
                      getPositionName(playerDetails.jugador.posicion_principal)) ||
                      "N/A"}
                  </p>
                </div>
              </div>

              {playerDetails.por_tipo_prueba && (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900">Resumen de desempeño</h3>

                  {Object.keys(playerDetails.por_tipo_prueba).map((tipo) => {
                    const data = playerDetails.por_tipo_prueba[tipo]
                    if (!data) return null

                    const colors = {
                      secuencial: { bg: "from-blue-50 to-blue-100", border: "border-blue-200", text: "text-blue-600" },
                      aleatorio: {
                        bg: "from-yellow-50 to-yellow-100",
                        border: "border-yellow-200",
                        text: "text-yellow-600",
                      },
                      manual: { bg: "from-green-50 to-green-100", border: "border-green-200", text: "text-green-600" },
                    }
                    const color = colors[tipo] || {
                      bg: "from-gray-50 to-gray-100",
                      border: "border-gray-200",
                      text: "text-gray-600",
                    }
                    const intentos = (data.total_aciertos || 0) + (data.total_errores || 0)
                    const pct = intentos > 0 ? ((data.total_aciertos / intentos) * 100).toFixed(1) : "0.0"

                    return (
                      <Card key={tipo} className={`bg-gradient-to-br ${color.bg} border ${color.border}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-bold text-gray-900 capitalize">{tipo}</p>
                            <p className={`text-2xl font-bold ${color.text}`}>{pct}%</p>
                          </div>

                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12 border border-white shadow">
                              <AvatarImage
                                src={getPositionIcon(playerDetails.jugador?.posicion_principal) || "/placeholder.svg"}
                              />
                              <AvatarFallback>?</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm text-gray-700 font-semibold">Icon</p>
                              <p className="text-xs text-gray-500">
                                {getPositionName(playerDetails.jugador?.posicion_principal) || "Rol"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  <div className="mt-2">
                    <h3 className="font-bold text-gray-900 mb-2">Distribución y balance global</h3>
                    <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="w-12 h-12 border border-white shadow">
                          <AvatarImage
                            src={getPositionIcon(playerDetails.jugador?.posicion_principal) || "/placeholder.svg"}
                          />
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-gray-700 font-semibold">Icon</p>
                          <p className="text-xs text-gray-500">
                            {getPositionName(playerDetails.jugador?.posicion_principal) || "Rol"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {playerDetails.mejor_alcance !== undefined && (
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{playerDetails.mejor_alcance} cm</p>
                      <p className="text-xs text-blue-600 font-semibold">Alcance</p>
                    </CardContent>
                  </Card>
                )}
                {playerDetails.mejor_potencia !== undefined && (
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{playerDetails.mejor_potencia}</p>
                      <p className="text-xs text-purple-600 font-semibold">Potencia</p>
                    </CardContent>
                  </Card>
                )}
                {playerDetails.mejor_promedio_fuerzas !== undefined && (
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4 text-center">
                      <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{playerDetails.mejor_promedio_fuerzas}</p>
                      <p className="text-xs text-green-600 font-semibold">Mejor Fuerzas</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Animaciones */}
      <style jsx global>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes podium-rise { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
        .animate-podium-rise { animation: podium-rise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; opacity: 0; }
      `}</style>
    </div>
  )
}
