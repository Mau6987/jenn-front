"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Trophy } from "lucide-react"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

const ProgressBar = ({ intentos, aciertos, errores }) => {
  const aciertosPorcentaje = intentos > 0 ? (aciertos / intentos) * 100 : 0
  const erroresPorcentaje = intentos > 0 ? (errores / intentos) * 100 : 0

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm text-gray-600 font-medium">Intentos: {intentos}</span>
      </div>
      <div className="relative w-full h-9 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300 shadow-inner">
        <div
          className="absolute left-0 top-0 h-full transition-all duration-500"
          style={{ width: `${aciertosPorcentaje}%`, backgroundColor: "rgb(34 197 94)" }}
        ></div>
        <div
          className="absolute top-0 h-full transition-all duration-500"
          style={{ left: `${aciertosPorcentaje}%`, width: `${erroresPorcentaje}%`, backgroundColor: "rgb(239 68 68)" }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-md">
            {aciertos} / {errores}
          </span>
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs font-semibold" style={{ color: "rgb(22 163 74)" }}>✓ {aciertos} aciertos</span>
        <span className="text-xs font-semibold" style={{ color: "rgb(220 38 38)" }}>✗ {errores} errores</span>
      </div>
    </div>
  )
}

const Podium = ({ players, onPlayerClick }) => {
  const [first, second, third] = players

  const getPodiumHeight = (position) => {
    if (position === 1) return "h-64"
    if (position === 2) return "h-52"
    return "h-44"
  }

  const getPodiumColor = (position) => {
    if (position === 1) return "from-yellow-400 via-yellow-500 to-yellow-600"
    if (position === 2) return "from-gray-300 via-gray-400 to-gray-500"
    return "from-orange-400 via-orange-500 to-orange-600"
  }

  const renderPodiumPlayer = (player, position) => {
    if (!player) return null

    const handleOpen = () => onPlayerClick?.(player)
    const handleKey = (e) => { if (e.key === "Enter" || e.key === " ") handleOpen() }

    return (
      <div
        className="flex flex-col items-center animate-podium-rise"
        style={{ animationDelay: `${position * 0.2}s` }}
      >
        {/* Avatar clickeable */}
        <div
          className="relative mb-4 group cursor-pointer transform transition-all duration-300 hover:scale-110"
          role="button"
          tabIndex={0}
          title={`Ver detalles de ${player.nombre}`}
          onClick={handleOpen}
          onKeyDown={handleKey}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
          <Avatar className="w-28 h-28 border-4 border-white shadow-2xl relative z-10">
            <AvatarImage src={player.imagen || "/placeholder.svg"} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-3xl">
              {player.nombre?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Texto */}
        <div className="text-center mb-3 px-2">
          <p className="font-bold text-gray-900 text-base mb-1 line-clamp-1">{player.nombre}</p>
          <p className="text-4xl font-black text-blue-600">{player.porcentajePromedio}%</p>
          <p className="text-sm text-gray-500">precisión</p>
        </div>

        {/* Base del podio (también clickeable) */}
        <div
          className={`w-36 ${getPodiumHeight(position)} bg-gradient-to-b ${getPodiumColor(position)} rounded-t-2xl shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-500 hover:shadow-3xl cursor-pointer`}
          role="button"
          tabIndex={0}
          aria-label={`Ver detalles de ${player.nombre} (posición ${position})`}
          onClick={handleOpen}
          onKeyDown={handleKey}
          title={`Ver detalles de ${player.nombre}`}
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <p className="text-white text-7xl font-black drop-shadow-lg">{position}</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end justify-center gap-10 mb-10">
      {second && renderPodiumPlayer(second, 2)}
      {first && renderPodiumPlayer(first, 1)}
      {third && renderPodiumPlayer(third, 3)}
    </div>
  )
}

export default function ResultadosGeneralPage() {
  const [rankingData, setRankingData] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("general")
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerDetails, setPlayerDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    cargarRanking()
  }, [periodo])

  const cargarRanking = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem("idUser")

      const rankingResponse = await fetch(`${BACKEND_URL}/api/ranking/general?periodo=${periodo}`)
      const rankingDataRes = await rankingResponse.json()

      if (rankingDataRes.success) {
        const top5 = rankingDataRes.data?.top_5 || []

        const transformedData = top5.map((player, index) => ({
          cuentaId: player.cuentaId,
          nombre: `${player.jugador.nombres} ${player.jugador.apellidos}`,
          imagen: getPositionIcon(player.jugador.posicion_principal),
          posicion: index + 1,
          totalIntentos: player.totales_generales.total_intentos,
          totalAciertos: player.totales_generales.total_aciertos,
          totalErrores: player.totales_generales.total_errores,
          porcentajePromedio:
            player.totales_generales.total_intentos > 0
              ? ((player.totales_generales.total_aciertos / player.totales_generales.total_intentos) * 100).toFixed(1)
              : 0,
          jugador: player.jugador,
          por_tipo_prueba: player.por_tipo_prueba,
        }))

        setRankingData(transformedData)

        // (Se quitó el bloque de "Tu posición")
        if (userId) {
          // Si en el futuro quieres recuperar esto, puedes volver a llamar /posicion
        }
      } else {
        setRankingData([])
      }
    } catch (error) {
      console.error("Error loading ranking:", error)
      setRankingData([])
    } finally {
      setLoading(false)
    }
  }

  const cargarDetallesJugador = async (player) => {
    try {
      setLoadingDetails(true)
      const resumenPorTipo = {}

      Object.keys(player.por_tipo_prueba || {}).forEach((tipo) => {
        const data = player.por_tipo_prueba[tipo]
        const totalIntentos = data.total_aciertos + data.total_errores

        resumenPorTipo[tipo] = {
          totalIntentos,
          totalAciertos: data.total_aciertos,
          totalErrores: data.total_errores,
          porcentajePromedio: totalIntentos > 0 ? ((data.total_aciertos / totalIntentos) * 100).toFixed(1) : 0,
        }
      })

      setPlayerDetails({
        nombre: player.nombre,
        imagen: player.imagen,
        jugador: player.jugador,
        resumenPorTipo,
      })
    } catch (error) {
      console.error("Error loading player details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player)
    cargarDetallesJugador(player)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Cargando ranking...</p>
        </div>
      </div>
    )
  }

  const safeRankingData = Array.isArray(rankingData) ? rankingData : []
  const top3 = safeRankingData.slice(0, 3)
  const rest = safeRankingData.slice(3, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Más ancho: 2xl */}
      <div className="max-w-screen-2xl mx-auto">
        {/* Header más alto, sin padding extra abajo innecesario */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 pt-8 pb-24 px-6 relative overflow-hidden rounded-b-[2rem]">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-18 h-18 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                <Trophy className="h-9 w-9 text-white" />
              </div>
              <h1 className="text-5xl font-black text-white mb-2">Ranking</h1>
              <p className="text-white/80 text-base font-medium">Tabla de liderazgo</p>
            </div>

            <div className="flex justify-center gap-3 mb-4">
              <button
                onClick={() => setPeriodo("general")}
                className={`px-7 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  periodo === "general"
                    ? "bg-white text-blue-700 shadow-lg scale-105"
                    : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                General
              </button>
              <button
                onClick={() => setPeriodo("mensual")}
                className={`px-7 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  periodo === "mensual"
                    ? "bg-white text-blue-700 shadow-lg scale-105"
                    : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setPeriodo("semanal")}
                className={`px-7 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
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

        {/* Contenedor blanco: SIN min-h-screen para evitar espacio vacío al final */}
        <div className="bg-white rounded-3xl -mt-16 relative z-20 shadow-2xl">
          <div className="px-10 pt-10 pb-8">
            {safeRankingData.length > 0 ? (
              <>
                {top3.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-4xl font-black text-center text-gray-900 mb-8 flex items-center justify-center gap-4">
                      <Trophy className="h-9 w-9" style={{ color: "rgb(234 179 8)" }} />
                      Top 3
                      <Trophy className="h-9 w-9" style={{ color: "rgb(234 179 8)" }} />
                    </h2>
                    <Podium players={top3} onPlayerClick={handlePlayerClick} />
                  </div>
                )}

                {rest.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-700 mb-4 text-center">Siguientes Posiciones</h3>
                    {rest.map((player, index) => {
                      if (!player || !player.nombre) return null

                      return (
                        <div
                          key={player.cuentaId || index}
                          className="flex items-center gap-6 p-5 bg-white hover:bg-gray-50 rounded-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-400 hover:shadow-lg group animate-fade-in-up"
                          style={{ animationDelay: `${index * 0.08}s` }}
                          onClick={() => handlePlayerClick(player)}
                        >
                          <Avatar className="w-16 h-16 border-2 border-gray-200 shadow-md group-hover:border-blue-400 transition-all duration-300">
                            <AvatarImage src={player.imagen || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-teal-600 text-white font-bold text-xl">
                              {player.nombre?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 text-xl">
                              {player.nombre || "Jugador"}
                            </p>
                            <p className="text-sm text-gray-500 font-medium">
                              {player.jugador?.posicion_principal && getPositionName(player.jugador.posicion_principal)}{" "}
                              • Intentos: {player.totalIntentos || 0}
                            </p>
                          </div>

                          <div className="text-right mr-2">
                            <p className="text-4xl font-black text-blue-600">{player.porcentajePromedio || 0}%</p>
                            <p className="text-xs text-gray-500">precisión</p>
                          </div>

                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg flex items-center justify-center font-black text-2xl shrink-0">
                            {player.posicion || "-"}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={selectedPlayer !== null} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-md bg-white border-gray-200 animate-scale-in rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-blue-600" />
              Detalles del Jugador
            </DialogTitle>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : playerDetails ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                  <AvatarImage src={playerDetails.imagen || "/placeholder.svg"} />
                  <AvatarFallback className="bg-white text-blue-600 font-bold text-xl">
                    {playerDetails.nombre?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-xl text-white">{playerDetails.nombre || "Jugador"}</p>
                  <p className="text-sm text-white/80">
                    {playerDetails.jugador?.carrera || "N/A"} •{" "}
                    {(playerDetails.jugador?.posicion_principal &&
                      getPositionName(playerDetails.jugador.posicion_principal)) ||
                      "N/A"}
                  </p>
                </div>
              </div>

              {playerDetails.resumenPorTipo && (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900">Rendimiento por Tipo</h3>

                  {["secuencial", "aleatorio", "manual"].map((tipo) => {
                    const data = playerDetails.resumenPorTipo[tipo]
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
                    const color = colors[tipo]

                    return (
                      <Card
                        key={tipo}
                        className={`bg-gradient-to-br ${color.bg} border ${color.border} hover:scale-[1.02] transition-transform duration-300`}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="font-bold text-gray-900 capitalize">{tipo}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${color.text}`}>{data.porcentajePromedio}%</p>
                            </div>
                          </div>
                          <ProgressBar
                            intentos={data.totalIntentos}
                            aciertos={data.totalAciertos}
                            errores={data.totalErrores}
                          />
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
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

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes podium-rise {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
          opacity: 0;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }

        .animate-podium-rise {
          animation: podium-rise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
