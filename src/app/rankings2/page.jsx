"use client"

import { useState, useEffect } from "react"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

export default function PerfilJugador() {
  const BACKEND_URL = "https://jenn-back-reac.onrender.com"

  const [alcanceData, setAlcanceData] = useState(null)
  const [pliometriaData, setPliometriaData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("general")
  const [activeTab, setActiveTab] = useState("alcance")

  useEffect(() => {
    cargarResultados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo])

  async function cargarResultados() {
    try {
      setLoading(true)
      const userId = typeof window !== "undefined" ? localStorage.getItem("idUser") || "19" : "19"

      const alcanceUrl = `${BACKEND_URL}/api/ranking/alcance/personal/${userId}?periodo=${periodo}`
      const alcanceRes = await fetch(alcanceUrl)
      const alcanceJson = await alcanceRes.json()
      setAlcanceData(alcanceRes.ok && alcanceJson.success ? alcanceJson.data : null)

      const plioUrl = `${BACKEND_URL}/api/ranking/pliometria/personal/${userId}?periodo=${periodo}`
      const plioRes = await fetch(plioUrl)
      const plioJson = await plioRes.json()
      setPliometriaData(plioRes.ok && plioJson.success ? plioJson.data : null)
    } catch (e) {
      console.error(e)
      setAlcanceData(null)
      setPliometriaData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          Cargando perfil...
        </div>
      </div>
    )
  }

  const currentData = activeTab === "alcance" ? alcanceData : pliometriaData

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <main className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-10">
        {/* Encabezado del jugador (CARD MÁS ANCHA) */}
        {currentData && (
          <section>
            {/* Card principal ensanchada mediante mayor fracción en el grid */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-5 md:p-6 flex items-start gap-4">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center overflow-hidden">
                  <img
                    src={getPositionIcon(currentData?.jugador?.posicion_principal)}
                    alt={getPositionName(currentData?.jugador?.posicion_principal)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/oso.png"
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 truncate leading-tight">
                        {currentData.jugador?.nombres} {currentData.jugador?.apellidos}
                      </h2>
                      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs md:text-sm font-semibold text-slate-800 shadow-sm">
                            <img
                              src={getPositionIcon(currentData?.jugador?.posicion_principal)}
                              alt={getPositionName(currentData?.jugador?.posicion_principal)}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            {getPositionName(currentData?.jugador?.posicion_principal)}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs md:text-sm font-medium text-slate-700 shadow-sm truncate">
                            {currentData?.jugador?.carrera || "Sin carrera"}
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-3 py-1 text-xs md:text-sm font-bold shadow">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="opacity-90">
                            <path d="M7 4h10v3h3v3c0 3.866-3.134 7-7 7s-7-3.134-7-7V7h1V4Zm10 0v3h-2V4h2ZM9 4v3H7V4h2Z"/>
                          </svg>
                          Ranking: #{currentData?.ranking?.posicion}
                        </span>
                      </div>
                    </div>

                    {/* Controles a la derecha */}
                    <div className="min-w-[260px] text-right flex flex-col items-end gap-3">
                      <div className="flex flex-wrap items-center justify-end gap-3 w-full">
                        {/* Tabs de periodo (reemplaza el select) */}
                        <div className="inline-flex rounded-full border border-slate-200 overflow-hidden">
                          {[
                            { key: "general", label: "General" },
                            { key: "mensual", label: "Mensual" },
                            { key: "semanal", label: "Semanal" },
                          ].map((p) => (
                            <button
                              key={p.key}
                              onClick={() => setPeriodo(p.key)}
                              className={`px-5 py-2 text-sm font-semibold transition ${
                                periodo === p.key
                                  ? "bg-slate-900 text-white"
                                  : "bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>

                        {/* Tabs de métrica */}
                        <div className="inline-flex rounded-full border border-slate-200 overflow-hidden">
                          <button
                            onClick={() => setActiveTab("alcance")}
                            className={`px-5 py-2 text-sm font-semibold transition ${
                              activeTab === "alcance"
                                ? "bg-slate-900 text-white"
                                : "bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            Alcance
                          </button>
                          <button
                            onClick={() => setActiveTab("pliometria")}
                            className={`px-5 py-2 text-sm font-semibold transition ${
                              activeTab === "pliometria"
                                ? "bg-slate-900 text-white"
                                : "bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            Pliometría
                          </button>
                        </div>
                      </div>

                      </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* MÉTRICAS */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
          <h4 className="text-sm font-bold text-slate-900 mb-4">Estadísticas detalladas</h4>
          {currentData && (
            <MetricMatrix mode={activeTab} stats={currentData.estadisticas} />
          )}
        </section>
      </main>
    </div>
  )
}

// ===================== UI helpers =====================
function StatTile({ label, value, subtle }) {
  return (
    <div className={`rounded-xl border ${subtle ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white"} px-4 py-3`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  )
}

/**
 * Nueva matriz de métricas
 * - 3 tarjetas (Actual / Mejor / Promedio)
 * - Cada tarjeta contiene filas: Potencia, Velocidad/Aceleración y Alcance/Fuerza según la pestaña
 * - Iconos: aceleracion.png para velocidad y aceleración; fuerza.png para fuerza; potencia.png para potencia
 */
function MetricMatrix({ mode, stats }) {
  const rows =
    mode === "alcance"
      ? [
          { key: "potencia", label: "Potencia" },
          { key: "velocidad", label: "Velocidad" },
          { key: "alcance", label: "Alcance" },
        ]
      : [
          { key: "fuerza", label: "Fuerza" },
          { key: "aceleracion", label: "Aceleración" },
          { key: "potencia", label: "Potencia" },
        ]

  const ICONS = {
    potencia: "/pontencia.png", // corregido el nombre del archivo
    fuerza: "/fuerza.png",
    velocidad: "/aceleracion.png",
    aceleracion: "/aceleracion.png",
  }

  const columns = [
    { key: "actual", title: "Actual" },
    { key: "mejor", title: "Mejor" },
    { key: "promedio", title: "Promedio" },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {columns.map((col) => (
        <div
          key={col.key}
          className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-bold text-slate-900 text-base md:text-lg">{col.title}</h5>
          </div>

          <div className="space-y-4 md:space-y-5">
            {rows.map((r) => {
              const data = stats?.[r.key] || { actual: 0, mejor: 0, promedio: 0 }
              const max = Number(data.mejor) || 0
              const value = Number(data[col.key]) || 0
              return (
                <MetricRowCompact
                  key={`${r.key}-${col.key}`}
                  name={r.label}
                  value={value}
                  max={max}
                  icon={ICONS[r.key]}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function MetricRowCompact({ name, value = 0, max = 0, icon }) {
  const pct = widthPct(value, max)
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-4">
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        {icon ? (
          <img src={icon} alt={name} className="w-10 h-10 md:w-12 md:h-12 object-contain" />
        ) : (
          <span className="w-10 h-10 md:w-12 md:h-12" />
        )}
        <div className="text-sm md:text-base text-slate-800 font-semibold truncate">{name}</div>
      </div>

      <div className="relative h-3 md:h-3.5 rounded-full bg-slate-200 border border-slate-300 overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-indigo-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="text-xs md:text-sm font-semibold text-slate-700 tabular-nums w-12 text-right">
        {Number(value || 0).toFixed(0)}
      </div>
    </div>
  )
}

function widthPct(value, max) {
  const m = Number(max) || 0
  const v = Number(value) || 0
  if (m <= 0) return 0
  const pct = (v / m) * 100
  return Math.max(0, Math.min(100, pct))
}
