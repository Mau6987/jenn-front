"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Star, ChevronDown, ChevronUp, Info } from "lucide-react"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

export default function PerfilPage() {
  const [alcanceData, setAlcanceData] = useState(null)
  const [pliometriaData, setPliometriaData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("general")
  const [tipoPliometria, setTipoPliometria] = useState("todos")
  const [showRatingBreakdown, setShowRatingBreakdown] = useState(true)
  const [activeTab, setActiveTab] = useState("alcance")
  const [activeStatTab, setActiveStatTab] = useState("stats")

  useEffect(() => {
    cargarResultados()
  }, [periodo, tipoPliometria])

  const cargarResultados = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem("idUser") || "19"

      const alcanceUrl = `${BACKEND_URL}/api/ranking/alcance/personal/${userId}?periodo=${periodo}`
      const alcanceResponse = await fetch(alcanceUrl)
      const alcanceResult = await alcanceResponse.json()

      if (alcanceResult.success) {
        setAlcanceData(alcanceResult.data)
      }

      const pliometriaUrl = `${BACKEND_URL}/api/ranking/pliometria/personal/${userId}?periodo=${periodo}`
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

  const calculateRating = (stats) => {
    if (activeTab === "alcance") {
      const alcance = stats.mejor_alcance || 0
      const potencia = stats.mejor_potencia || 0
      return Math.min(10, Math.round((alcance / 100 + potencia / 100) * 5))
    } else {
      const fuerza = stats.mejor_fuerza_total || 0
      const potencia = stats.mejor_potencia || 0
      return Math.min(10, Math.round((fuerza / 200 + potencia / 100) * 5))
    }
  }

  const normalizeValue = (value, max) => {
    return Math.min(100, (value / max) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#4361ee] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[#495057] font-medium">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  const currentData = activeTab === "alcance" ? alcanceData : pliometriaData

  if (!currentData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <p className="text-[#6c757d]">No hay datos disponibles</p>
      </div>
    )
  }

  const rating = calculateRating(currentData.estadisticas)

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-6 px-4">
      <div className="max-w-md mx-auto">
        <Card className="bg-white shadow-sm border border-[#e9ecef] overflow-hidden">
          <CardContent className="p-0">
            {/* Header Section */}
            <div className="p-5 pb-4">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
                    {currentData.jugador.nombres.charAt(0)}
                    {currentData.jugador.apellidos.charAt(0)}
                  </div>

                  {/* Player Info */}
                  <div>
                    <h1 className="text-xl font-bold text-[#212529] leading-tight mb-1.5">
                      {currentData.jugador.nombres} {currentData.jugador.apellidos}
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className="bg-[#4361ee] text-white px-2.5 py-1 rounded font-bold text-base flex items-center gap-1.5">
                        <span className="text-lg">{rating}</span>
                      </div>
                      <span className="text-sm text-[#6c757d]">Sofascore Rating</span>
                    </div>
                  </div>
                </div>

                <button className="p-1.5 hover:bg-[#f8f9fa] rounded-lg transition-colors">
                  <Star className="h-5 w-5 text-[#adb5bd] hover:text-[#ffc107] transition-colors" />
                </button>
              </div>

              <div className="bg-[#f8f9fa] rounded-lg p-3.5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#212529]">{currentData.jugador.posicion_principal}</p>
                    <p className="text-xs text-[#6c757d] mt-0.5">{currentData.jugador.carrera}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#6c757d] font-medium">Ranking</p>
                    <p className="text-sm font-bold text-[#212529]">#{currentData.ranking.posicion}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#6c757d] pt-2 border-t border-[#dee2e6]">
                  <span className="font-medium">Total registros:</span>
                  <span className="font-semibold text-[#212529]">{currentData.estadisticas.total_registros}</span>
                </div>
              </div>

              {/* Period Filter */}
              <div className="mb-4">
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger className="w-full bg-[#f8f9fa] border-[#dee2e6] rounded-lg h-9 text-sm font-medium">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t border-[#e9ecef]">
              <button
                onClick={() => setShowRatingBreakdown(!showRatingBreakdown)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#f8f9fa] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-[#4361ee] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{rating}</span>
                  </div>
                  <span className="font-semibold text-[#212529] text-sm">Rating breakdown</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-[#adb5bd]" />
                  {showRatingBreakdown ? (
                    <ChevronUp className="h-4 w-4 text-[#6c757d]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#6c757d]" />
                  )}
                </div>
              </button>

              {showRatingBreakdown && (
                <div className="px-5 pb-5 space-y-3 animate-fade-in">
                  <div className="text-xs text-[#6c757d] mb-3 flex items-center justify-between">
                    <span>Impact</span>
                    <span className="flex items-center gap-8">
                      <span>-</span>
                      <span>0</span>
                      <span>+</span>
                    </span>
                  </div>

                  {activeTab === "alcance" && alcanceData && (
                    <>
                      <StatBar
                        label="Shooting"
                        value={alcanceData.estadisticas.mejor_alcance || 0}
                        maxValue={200}
                        color="bg-[#4361ee]"
                        displayValue={alcanceData.estadisticas.mejor_alcance?.toFixed(0)}
                      />
                      <StatBar
                        label="Passing"
                        value={alcanceData.estadisticas.mejor_potencia || 0}
                        maxValue={100}
                        color="bg-[#4361ee]"
                        displayValue={alcanceData.estadisticas.mejor_potencia?.toFixed(0)}
                      />
                      <StatBar
                        label="Dribbling"
                        value={alcanceData.estadisticas.mejor_aceleracion || 0}
                        maxValue={50}
                        color="bg-[#4cc9f0]"
                        displayValue={alcanceData.estadisticas.mejor_aceleracion?.toFixed(0)}
                      />
                      <StatBar
                        label="Defending"
                        value={alcanceData.estadisticas.promedio_alcance || 0}
                        maxValue={200}
                        color="bg-[#f77f00]"
                        displayValue={alcanceData.estadisticas.promedio_alcance?.toFixed(0)}
                      />
                    </>
                  )}

                  {activeTab === "pliometria" && pliometriaData && (
                    <>
                      <StatBar
                        label="Shooting"
                        value={pliometriaData.estadisticas.mejor_fuerza_total || 0}
                        maxValue={500}
                        color="bg-[#4361ee]"
                        displayValue={pliometriaData.estadisticas.mejor_fuerza_total?.toFixed(0)}
                      />
                      <StatBar
                        label="Passing"
                        value={pliometriaData.estadisticas.mejor_potencia || 0}
                        maxValue={100}
                        color="bg-[#4361ee]"
                        displayValue={pliometriaData.estadisticas.mejor_potencia?.toFixed(0)}
                      />
                      <StatBar
                        label="Dribbling"
                        value={pliometriaData.estadisticas.promedio_fuerza_total || 0}
                        maxValue={500}
                        color="bg-[#4cc9f0]"
                        displayValue={pliometriaData.estadisticas.promedio_fuerza_total?.toFixed(0)}
                      />
                      <StatBar
                        label="Defending"
                        value={pliometriaData.estadisticas.promedio_potencia || 0}
                        maxValue={100}
                        color="bg-[#f77f00]"
                        displayValue={pliometriaData.estadisticas.promedio_potencia?.toFixed(0)}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-[#e9ecef] px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#212529] text-sm">Statistics</h3>
                <button className="p-1.5 hover:bg-[#f8f9fa] rounded transition-colors">
                  <svg className="h-5 w-5 text-[#6c757d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setActiveStatTab("shot")}
                  className={`py-2.5 px-3 rounded-full text-xs font-semibold transition-all ${
                    activeStatTab === "shot"
                      ? "bg-[#212529] text-white"
                      : "bg-[#f8f9fa] text-[#495057] hover:bg-[#e9ecef]"
                  }`}
                >
                  Shot
                </button>
                <button
                  onClick={() => setActiveStatTab("pass")}
                  className={`py-2.5 px-3 rounded-full text-xs font-semibold transition-all ${
                    activeStatTab === "pass"
                      ? "bg-[#212529] text-white"
                      : "bg-[#f8f9fa] text-[#495057] hover:bg-[#e9ecef]"
                  }`}
                >
                  Pass
                </button>
                <button
                  onClick={() => setActiveStatTab("drib")}
                  className={`py-2.5 px-3 rounded-full text-xs font-semibold transition-all ${
                    activeStatTab === "drib"
                      ? "bg-[#212529] text-white"
                      : "bg-[#f8f9fa] text-[#495057] hover:bg-[#e9ecef]"
                  }`}
                >
                  Drib
                </button>
                <button
                  onClick={() => setActiveStatTab("def")}
                  className={`py-2.5 px-3 rounded-full text-xs font-semibold transition-all ${
                    activeStatTab === "def"
                      ? "bg-[#212529] text-white"
                      : "bg-[#f8f9fa] text-[#495057] hover:bg-[#e9ecef]"
                  }`}
                >
                  Def
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setActiveTab(activeTab === "alcance" ? "pliometria" : "alcance")}
            className="bg-[#4361ee] text-white px-5 py-3 rounded-full shadow-lg hover:bg-[#3a0ca3] transition-all font-semibold text-sm"
          >
            {activeTab === "alcance" ? "Ver Pliometría" : "Ver Alcance"}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatBar({ label, value, maxValue, color, displayValue }) {
  const percentage = Math.min(100, (value / maxValue) * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#495057]">{label}</span>
        <span className="text-xs font-semibold text-[#212529]">{displayValue}</span>
      </div>
      <div className="relative h-1.5 bg-[#e9ecef] rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
