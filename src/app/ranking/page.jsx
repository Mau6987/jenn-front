"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "../componentes/sidebar"
import { Trophy, Medal, Award, Target, Zap, BarChart3 } from "lucide-react"

const API_URL = "https://jenn.onrender.com"

export default function RankingSimple() {
  const router = useRouter()
  const [rankingGeneral, setRankingGeneral] = useState([])
  const [rankingAlfombra, setRankingAlfombra] = useState([])
  const [rankingReaccion, setRankingReaccion] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    fetchRankings()
  }, [])

  const fetchRankings = async () => {
    try {
      setLoading(true)

      const [generalRes, alfombraRes, reaccionRes] = await Promise.all([
        fetch(`${API_URL}/ranking/general?limite=10`),
        fetch(`${API_URL}/ranking/alfombra?limite=10`),
        fetch(`${API_URL}/ranking/reaccion?limite=10`),
      ])

      if (!generalRes.ok || !alfombraRes.ok || !reaccionRes.ok) {
        throw new Error("Error al obtener los rankings")
      }

      const [generalData, alfombraData, reaccionData] = await Promise.all([
        generalRes.json(),
        alfombraRes.json(),
        reaccionRes.json(),
      ])

      setRankingGeneral(generalData.data?.ranking || [])
      setRankingAlfombra(alfombraData.data?.ranking || [])
      setRankingReaccion(reaccionData.data?.ranking || [])
    } catch (error) {
      console.error("Error:", error)
      setError("Error al cargar los rankings")
    } finally {
      setLoading(false)
    }
  }

  const getPosicionIcon = (posicion) => {
    switch (posicion) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <span className="h-6 w-6 flex items-center justify-center text-gray-500 font-bold">#{posicion}</span>
    }
  }

  const renderRanking = (data, tipo) => {
    if (!data || data.length === 0) {
      return <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
    }

    return (
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded border border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getPosicionIcon(item.posicion)}
              <div>
                <p className="font-semibold text-gray-800">
                  {item.nombre} {item.apellido}
                </p>
                <p className="text-sm text-gray-600">{item.carrera || "Sin carrera"}</p>
              </div>
            </div>

            <div className="text-right">
              {tipo === "general" && (
                <div>
                  <p className="font-bold text-[#1E3A8A]">{item.puntuacion_general}</p>
                  <p className="text-xs text-gray-500">Puntuación</p>
                </div>
              )}
              {tipo === "alfombra" && (
                <div>
                  <p className="font-bold text-green-600">{item.porcentaje_aciertos}%</p>
                  <p className="text-xs text-gray-500">Precisión</p>
                </div>
              )}
              {tipo === "reaccion" && (
                <div>
                  <p className="font-bold text-blue-600">{item.mejor_tiempo}s</p>
                  <p className="text-xs text-gray-500">Mejor tiempo</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl font-medium text-gray-800">Cargando rankings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md">
          <p className="text-red-500 mb-4 font-medium">{error}</p>
          <button
            onClick={() => router.push("/inicio")}
            className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#2D4BA0] transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto p-4 mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
            <Trophy className="mr-2 h-8 w-8 text-[#1E3A8A]" />
            Rankings
          </h1>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm flex items-center justify-center ${
                activeTab === "general" ? "bg-[#1E3A8A] text-white" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              General
            </button>
            <button
              onClick={() => setActiveTab("alfombra")}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm flex items-center justify-center ${
                activeTab === "alfombra" ? "bg-[#1E3A8A] text-white" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Target className="mr-2 h-4 w-4" />
              Alfombra
            </button>
            <button
              onClick={() => setActiveTab("reaccion")}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm flex items-center justify-center ${
                activeTab === "reaccion" ? "bg-[#1E3A8A] text-white" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Zap className="mr-2 h-4 w-4" />
              Reacción
            </button>
          </div>

          {/* Contenido del ranking */}
          <div className="bg-[#F0F4FF] p-4 rounded border border-[#D0D8F0]">
            <h2 className="text-lg font-semibold mb-4 text-[#1E3A8A]">
              Top 10 -{" "}
              {activeTab === "general" ? "Ranking General" : activeTab === "alfombra" ? "Alfombra" : "Reacción"}
            </h2>

            {activeTab === "general" && renderRanking(rankingGeneral, "general")}
            {activeTab === "alfombra" && renderRanking(rankingAlfombra, "alfombra")}
            {activeTab === "reaccion" && renderRanking(rankingReaccion, "reaccion")}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={fetchRankings}
              className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#2D4BA0] transition-colors"
            >
              Actualizar Rankings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
