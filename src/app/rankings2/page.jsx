"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

const T = {
  text:      "#0f172a",
  muted:     "#64748b",
  mutedSoft: "#94a3b8",
  border:    "#e2e8f0",
  bg:        "#ffffff",
  pageBg:    "#f8fafc",
  accent:    "#1d4ed8",
  shadow:    "0 4px 24px rgba(15,23,42,0.07)",
  shadowSm:  "0 1px 6px rgba(15,23,42,0.05)",
  barLight:  "#dde3ec",
  barUp:     "#16a34a",
  barDown:   "#dc2626",
  barUpBg:   "#dcfce7",
  barDownBg: "#fee2e2",
}

const METRIC_COLORS = {
  alcance:         { bar: "#1d4ed8", bg: "#dbeafe" },
  cantidad_saltos: { bar: "#7c3aed", bg: "#ede9fe" },
  indice_fatiga:   { bar: "#db2777", bg: "#fce7f3" },
  fuerza:          { bar: "#d97706", bg: "#fef3c7" },
  altura_promedio: { bar: "#059669", bg: "#d1fae5" },
  potencia:        { bar: "#0891b2", bg: "#cffafe" },
  aceleracion:     { bar: "#9333ea", bg: "#f3e8ff" },
}

const DEFAULT_COLOR = { bar: "#1d4ed8", bg: "#dbeafe" }

// METRIC_META - SOLO alcance tiene conversión de metros a cm
// altura_promedio ya viene en cm del backend, no se convierte
const METRIC_META = {
  alcance:         { unit: "cm",   decimals: 0, multiplier: 100 },  // metros → cm
  cantidad_saltos: { unit: "",     decimals: 0, multiplier: 1 },
  indice_fatiga:   { unit: "%",    decimals: 2, multiplier: 1 },
  fuerza:          { unit: "kg",   decimals: 1, multiplier: 1 },
  altura_promedio: { unit: "cm",   decimals: 1, multiplier: 1 },    // ya viene en cm
  potencia:        { unit: "W",    decimals: 1, multiplier: 1 },
  aceleracion:     { unit: "m/s²", decimals: 2, multiplier: 1 },
}

// Tipos de salto
const TIPOS_SALTO = [
  { key: "salto simple", label: "Simple" },
  { key: "salto conos",  label: "Conos"  },
]

const getMetricasSalto = (tipo) => {
  const base = [
    { label: "Cantidad de saltos",        dataKey: "cantidad_saltos" },
    { label: "Índice de fatiga",           dataKey: "indice_fatiga"   },
    { label: "Fuerza máxima (izq + der)", dataKey: "fuerza"          },
    { label: "Altura promedio",            dataKey: "altura_promedio" },
  ]
  if (tipo === "salto simple") {
    return [
      ...base,
      { label: "Potencia estimada",       dataKey: "potencia"    },
      { label: "Aceleración de despegue", dataKey: "aceleracion" },
    ]
  }
  return base
}

// Función para convertir valor según métrica (solo alcance se convierte)
function convertValue(value, dataKey) {
  if (value === null || value === undefined) return 0
  const multiplier = METRIC_META[dataKey]?.multiplier || 1
  return value * multiplier
}

function BarRow({ label, value = 0, max = 1, unit = "", decimals = 2, barColor, barBg, dataKey }) {
  const convertedValue = convertValue(value, dataKey)
  const convertedMax = convertValue(max, dataKey)
  
  const pct = convertedMax > 0 ? Math.min(100, (Math.abs(convertedValue) / Math.abs(convertedMax)) * 100) : 0
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const to = Number(convertedValue) || 0
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / 600)
      const v = to * (1 - Math.pow(1 - p, 3))
      el.textContent = decimals === 0 ? Math.round(v) : v.toFixed(decimals)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [convertedValue, decimals])

  return (
    <div className="space-y-1">
      <span className="text-[11px]" style={{ color: T.muted }}>{label}</span>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: barBg || T.barLight }}>
        <motion.div className="absolute left-0 top-0 h-full rounded-full"
          style={{ background: barColor || DEFAULT_COLOR.bar }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }} />
      </div>
      <p className="text-[11px] text-right tabular-nums" style={{ color: T.mutedSoft }}>
        <span ref={ref}>0</span>{unit ? ` ${unit}` : ""}
      </p>
    </div>
  )
}

function MetricCard({ title, colKey, mode, stats, tipoSalto, delay = 0 }) {
  const empty = (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex-1 rounded-2xl p-5 min-w-0"
      style={{ border: `1.5px solid ${T.border}`, background: T.bg, boxShadow: T.shadowSm }}>
      <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: T.mutedSoft }}>{title}</p>
      <p className="text-sm" style={{ color: T.mutedSoft }}>Sin datos</p>
    </motion.div>
  )

  if (!stats) return empty

  const metricas = mode === "alcance"
    ? [{ label: "Altura de alcance", dataKey: "alcance" }]
    : getMetricasSalto(tipoSalto)

  const validRows = metricas.filter((m) => stats[m.dataKey] && stats[m.dataKey].mejor > 0)
  if (validRows.length === 0) return empty

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 rounded-2xl p-5 min-w-0"
      style={{ border: `1.5px solid ${T.border}`, background: T.bg, boxShadow: T.shadowSm }}>
      <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: T.mutedSoft }}>{title}</p>
      <div className="space-y-4">
        {validRows.map(({ label, dataKey }) => {
          const data    = stats[dataKey]
          const val     = data?.[colKey] ?? 0
          const maxVal  = Math.max(data?.mejor ?? 0, 0.001)
          const meta    = METRIC_META[dataKey]  ?? { unit: "", decimals: 2, multiplier: 1 }
          const colors  = METRIC_COLORS[dataKey] ?? DEFAULT_COLOR

          const incKey = `incremento_${colKey}`
          const inc    = mode === "alcance" ? (data?.[incKey] ?? null) : null
          const incPos = inc !== null && inc > 0
          const incNeg = inc !== null && inc < 0
          const incBar = incPos ? T.barUp   : incNeg ? T.barDown   : colors.bar
          const incBg  = incPos ? T.barUpBg : incNeg ? T.barDownBg : colors.bg

          return (
            <div key={dataKey} className="space-y-2">
              <BarRow 
                label={label} 
                value={val} 
                max={maxVal} 
                unit={meta.unit} 
                decimals={meta.decimals} 
                barColor={colors.bar} 
                barBg={colors.bg}
                dataKey={dataKey}
              />
              {mode === "alcance" && inc !== null && (
                <BarRow 
                  label="Incremento respecto anterior" 
                  value={inc} 
                  max={maxVal} 
                  unit={meta.unit} 
                  decimals={meta.decimals} 
                  barColor={incBar} 
                  barBg={incBg}
                  dataKey={dataKey}
                />
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

function Skeleton() {
  return (
    <div className="min-h-screen py-10 px-4" style={{ background: T.pageBg }}>
      <style>{`.sh{position:relative;overflow:hidden}.sh::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);animation:shim 1.5s infinite}@keyframes shim{100%{transform:translateX(100%)}}`}</style>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-20 rounded-2xl bg-slate-200 sh" />
        <div className="h-72 rounded-2xl bg-slate-200 sh" />
      </div>
    </div>
  )
}

export default function PerfilJugador() {
  const [alcanceData, setAlcanceData]       = useState(null)
  const [saltoData,   setSaltoData]         = useState(null)
  const [loading,     setLoading]           = useState(true)
  const [periodo,     setPeriodo]           = useState("general")
  const [activeTab,   setActiveTab]         = useState("alcance")
  const [tipoSalto,   setTipoSalto]         = useState("salto simple")

  useEffect(() => { cargarResultados() }, [periodo, tipoSalto])

  async function cargarResultados() {
    try {
      setLoading(true)
      const userId = typeof window !== "undefined" ? localStorage.getItem("idUser") || "19" : "19"

      const [alcRes, saltoRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/ranking/alcance/resultados-personales/${userId}?periodo=${periodo}`),
        fetch(`${BACKEND_URL}/api/ranking/salto/resultados-personales/${userId}?periodo=${periodo}&tipo=${tipoSalto}`),
      ])
      const [alcJson, saltoJson] = await Promise.all([alcRes.json(), saltoRes.json()])
      setAlcanceData(alcRes.ok   && alcJson.success   ? alcJson.data   : null)
      setSaltoData(saltoRes.ok && saltoJson.success ? saltoJson.data : null)
    } catch (e) {
      console.error(e)
      setAlcanceData(null)
      setSaltoData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Skeleton />

  const currentData = activeTab === "alcance" ? alcanceData : saltoData
  const jugador     = alcanceData?.jugador ?? saltoData?.jugador
  const posIcon     = getPositionIcon(jugador?.posicion_principal)
  const rankingPos  = currentData?.ranking?.posicion

  const COLS = [
    { key: "actual", title: "ACTUAL" },
    { key: "mejor",  title: "MEJOR"  },
    { key: "peor",   title: "PEOR"   },
  ]

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: T.pageBg }}>
      <div className="max-w-5xl mx-auto space-y-7">

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5">
              <div className="h-[72px] w-[72px] shrink-0 rounded-full grid place-items-center overflow-hidden"
                style={{ background: "#e2e8f0", boxShadow: "0 0 0 4px #fff, 0 0 0 6px #e2e8f0" }}>
                {posIcon
                  ? <img src={posIcon} alt="" style={{ width: 44, height: 44, objectFit: "contain" }} />
                  : <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                      stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                }
              </div>
              <div className="min-w-0">
                {rankingPos && (
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white mb-1.5"
                    style={{ background: T.accent }}>
                    Ranking #{rankingPos}
                  </span>
                )}
                <p className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: T.mutedSoft }}>
                  {jugador?.posicion_principal ? getPositionName(jugador.posicion_principal) : "Jugador"}
                </p>
                <h1 className="text-xl font-extrabold leading-snug" style={{ color: T.text }}>
                  {jugador ? `${jugador.nombres} ${jugador.apellidos}` : "Sin datos"}
                </h1>
              </div>
            </div>

            <div className="flex items-center shrink-0 rounded-xl overflow-hidden"
              style={{ border: `1.5px solid ${T.border}`, background: T.bg, boxShadow: T.shadowSm }}>
              {[
                { key: "alcance", label: "Alcance" },
                { key: "salto",   label: "Saltos"  },
              ].map(({ key, label }, i, arr) => {
                const active = activeTab === key
                return (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className="px-5 py-2.5 text-sm font-semibold transition-all"
                    style={{
                      background: active ? "#f1f5f9" : "transparent",
                      color: active ? T.text : T.mutedSoft,
                      boxShadow: active ? "inset 0 1px 3px rgba(0,0,0,0.07)" : "none",
                      borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : "none",
                    }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>
          <div className="rounded-2xl"
            style={{ background: T.bg, border: `1.5px solid ${T.border}`, boxShadow: T.shadow }}>

            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b flex-wrap gap-3"
              style={{ borderColor: T.border }}>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: T.mutedSoft }}>
                  Filtrar por fecha
                </span>
                <div className="relative">
                  <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}
                    className="appearance-none border rounded-lg px-3 py-1.5 text-sm pr-8 focus:outline-none"
                    style={{ borderColor: T.border, color: T.muted, background: T.bg }}>
                    <option value="general">General</option>
                    <option value="mensual">Mensual</option>
                    <option value="semanal">Semanal</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: T.mutedSoft }} />
                </div>
              </div>

              <span className="text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white"
                style={{ background: T.text }}>
                Resumen de Rendimiento
              </span>

              <div className="w-28" />
            </div>

            {activeTab === "salto" && (
              <div className="flex items-center gap-8 px-6 pt-4 pb-0">
                {TIPOS_SALTO.map(({ key, label }) => {
                  const active = tipoSalto === key
                  return (
                    <button key={key} onClick={() => setTipoSalto(key)}
                      className="relative pb-3 text-sm font-semibold transition-colors"
                      style={{ color: active ? T.accent : T.mutedSoft }}>
                      {label}
                      {active && (
                        <motion.div layoutId="tipo-underline"
                          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                          style={{ background: T.accent }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {activeTab === "alcance" && (
              <div className="flex items-center justify-center gap-8 px-6 pt-4 pb-0">
                {[
                  { key: "general", label: "General" },
                  { key: "mensual", label: "Mensual" },
                  { key: "semanal", label: "Semanal" },
                ].map(({ key, label }) => {
                  const active = periodo === key
                  return (
                    <button key={key} onClick={() => setPeriodo(key)}
                      className="relative pb-3 text-sm font-semibold transition-colors"
                      style={{ color: active ? T.accent : T.mutedSoft }}>
                      {label}
                      {active && (
                        <motion.div layoutId="periodo-underline"
                          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                          style={{ background: T.accent }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div key={`${activeTab}-${periodo}-${tipoSalto}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}>
                  {!currentData || currentData.estadisticas?.total_registros === 0 ? (
                    <p className="text-center text-sm py-10" style={{ color: T.mutedSoft }}>
                      No hay datos disponibles para este período.
                    </p>
                  ) : (
                    <div className="flex gap-4 flex-col sm:flex-row">
                      {COLS.map((col, i) => (
                        <MetricCard
                          key={col.key}
                          title={col.title}
                          colKey={col.key}
                          mode={activeTab}
                          stats={currentData.estadisticas}
                          tipoSalto={tipoSalto}
                          delay={i * 0.07}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </motion.div>

      </div>
    </div>
  )
}