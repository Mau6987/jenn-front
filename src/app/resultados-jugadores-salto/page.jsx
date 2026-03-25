"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp, TrendingDown, Minus, Download,
  Activity, Zap, User, Calendar, BarChart2, List,
  AlertCircle, Loader2, ChevronRight, ChevronLeft,
  Layers, Wind, Flame,
} from "lucide-react"

const BASE_URL = "https://jenn-back-reac.onrender.com"

const SEMANAS = [
  { id: "oct1",  label: "Sem 1 oct", labelFull: "Semana 1 (oct)", desde: "2025-10-01", hasta: "2025-10-07" },
  { id: "oct2",  label: "Sem 2 oct", labelFull: "Semana 2 (oct)", desde: "2025-10-08", hasta: "2025-10-14" },
  { id: "oct3",  label: "Sem 3 oct", labelFull: "Semana 3 (oct)", desde: "2025-10-15", hasta: "2025-10-21" },
  { id: "feb1",  label: "Sem 1 feb", labelFull: "Semana 1 (feb)", desde: "2026-02-01", hasta: "2026-02-07" },
  { id: "feb2",  label: "Sem 2 feb", labelFull: "Semana 2 (feb)", desde: "2026-02-08", hasta: "2026-02-14" },
  { id: "todas", label: "Todas",     labelFull: "Todas las semanas", desde: null, hasta: null },
]

const MODOS_SALTO = ["todos", "salto simple", "salto conos"]
const POR_PAGINA  = 15

const TIPO_COLORS = {
  "salto simple": { line: "#3b82f6", bg: "bg-blue-500/15",  text: "text-blue-400",  dot: "bg-blue-500",  border: "border-blue-500/30"  },
  "salto conos":  { line: "#f97316", bg: "bg-orange-500/15",text: "text-orange-400",dot: "bg-orange-500",border: "border-orange-500/30"},
}

const METRICAS = [
  { id: "altura_promedio",        label: "Altura",          unit: "cm",  color: "#3b82f6" },
  { id: "fuerza_max",             label: "Fuerza máx.",     unit: "kg",  color: "#f97316" },
  { id: "indice_fatiga",          label: "Índice fatiga",   unit: "%",   color: "#10b981" },
]

const POS_COLORS = {
  armador: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  opuesto: "bg-amber-500/20  text-amber-300  border-amber-500/30",
  central: "bg-sky-500/20    text-sky-300    border-sky-500/30",
  punta:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  libero:  "bg-rose-500/20   text-rose-300   border-rose-500/30",
  receptor:"bg-cyan-500/20   text-cyan-300   border-cyan-500/30",
}

const fatigaColor  = (v) => v < 12 ? "text-emerald-400" : v <= 15 ? "text-amber-400" : "text-red-400"
const fatigaBg     = (v) =>
  v < 12  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
  : v <= 15 ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
  : "bg-red-500/15 border-red-500/30 text-red-400"

const alturaColor  = (v) => v >= 35 ? "text-emerald-400" : v >= 28 ? "text-amber-400" : "text-slate-400"
const fuerzaColor  = (v) => v >= 180 ? "text-emerald-400" : v >= 150 ? "text-amber-400" : "text-slate-400"

const formatFecha      = (f) => !f ? "—" : new Date(f).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })
const formatFechaCorta = (f) => !f ? "—" : new Date(f).toLocaleDateString("es-BO", { day: "2-digit", month: "short" })

// ─── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ values = [], color = "#3b82f6" }) => {
  const nonZero = values.filter(v => v > 0)
  if (nonZero.length < 2) return null
  const w = 72, h = 24
  const min = Math.min(...nonZero), max = Math.max(...nonZero), range = max - min || 1
  const pts = nonZero.map((v, i) =>
    `${(i / (nonZero.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`
  ).join(" ")
  const last = pts.split(" ").pop().split(",")
  return (
    <svg width={w} height={h} className="overflow-visible flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  )
}

// ─── Line Chart ───────────────────────────────────────────────────────────────
const LineChart = ({ data, semanas, metrica }) => {
  const W = 640, H = 240, PAD = { t: 28, r: 24, b: 48, l: 52 }
  const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b
  const xOf = (i) => PAD.l + (i / Math.max(semanas.length - 1, 1)) * IW

  const allVals = ["salto simple", "salto conos"].flatMap(tipo =>
    (data[tipo] || []).filter(p => p.total > 0).map(p => p[metrica] ?? 0)
  ).filter(v => v > 0)

  const minV = allVals.length ? Math.floor(Math.min(...allVals) * 0.92) : 0
  const maxV = allVals.length ? Math.ceil(Math.max(...allVals)  * 1.05) : 100
  const range = maxV - minV || 1
  const yOf = (v) => PAD.t + IH - ((v - minV) / range) * IH

  const ticks = Array.from({ length: 5 }, (_, i) => Math.round(minV + (range / 4) * i))

  const hayDatos = allVals.length > 0

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {ticks.map(v => (
        <g key={v}>
          <line x1={PAD.l} y1={yOf(v)} x2={W - PAD.r} y2={yOf(v)}
            stroke={v === minV ? "#334155" : "#1e293b"} strokeWidth="1"
            strokeDasharray={v === minV ? "none" : "3,3"} />
          <text x={PAD.l - 6} y={yOf(v) + 4} textAnchor="end" fontSize="10" fill="#475569">{v}</text>
        </g>
      ))}
      {semanas.map((s, i) => (
        <text key={s.id} x={xOf(i)} y={H - PAD.b + 18} textAnchor="middle" fontSize="10" fill="#64748b">
          {s.label}
        </text>
      ))}
      {!hayDatos && (
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="12" fill="#475569">
          Sin datos para este período
        </text>
      )}
      {["salto simple", "salto conos"].map(tipo => {
        const conDatos = (data[tipo] || [])
          .map((p, i) => ({ ...p, idx: i }))
          .filter(p => p.total > 0)
        if (!conDatos.length) return null
        const c = TIPO_COLORS[tipo].line
        const pathD = conDatos.length >= 2
          ? conDatos.map((p, j) =>
              `${j === 0 ? "M" : "L"}${xOf(p.idx).toFixed(1)},${yOf(p[metrica] ?? 0).toFixed(1)}`
            ).join(" ")
          : null
        return (
          <g key={tipo}>
            {pathD && (
              <path d={pathD} fill="none" stroke={c} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" />
            )}
            {conDatos.map(p => (
              <g key={p.idx}>
                <circle cx={xOf(p.idx)} cy={yOf(p[metrica] ?? 0)}
                  r={conDatos.length === 1 ? 6 : 4.5}
                  fill="#0f172a" stroke={c} strokeWidth="2.5" />
                <text x={xOf(p.idx)} y={yOf(p[metrica] ?? 0) - 10}
                  textAnchor="middle" fontSize="9.5" fill={c} fontWeight="700">
                  {(p[metrica] ?? 0).toFixed(1)}
                </text>
              </g>
            ))}
          </g>
        )
      })}
      <line x1={PAD.l} y1={PAD.t + IH} x2={W - PAD.r} y2={PAD.t + IH} stroke="#334155" strokeWidth="1" />
    </svg>
  )
}

// ─── Paginador ────────────────────────────────────────────────────────────────
const Paginador = ({ pagina, totalPaginas, onChange, totalItems }) => {
  if (totalPaginas <= 1) return null
  const inicio = (pagina - 1) * POR_PAGINA + 1
  const fin    = Math.min(pagina * POR_PAGINA, totalItems)
  const paginas = []
  if (totalPaginas <= 7) {
    for (let i = 1; i <= totalPaginas; i++) paginas.push(i)
  } else {
    paginas.push(1)
    if (pagina > 3)  paginas.push("...")
    for (let i = Math.max(2, pagina - 1); i <= Math.min(totalPaginas - 1, pagina + 1); i++) paginas.push(i)
    if (pagina < totalPaginas - 2) paginas.push("...")
    paginas.push(totalPaginas)
  }
  return (
    <div className="px-4 sm:px-6 py-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
      <p className="text-[11px] text-slate-500 flex-shrink-0">
        Mostrando <span className="text-slate-300 font-bold">{inicio}–{fin}</span> de{" "}
        <span className="text-slate-300 font-bold">{totalItems}</span> registros
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(pagina - 1)} disabled={pagina === 1}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {paginas.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="w-7 text-center text-xs text-slate-600 select-none">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                p === pagina ? "bg-blue-600 text-white shadow shadow-blue-900/50"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(pagina + 1)} disabled={pagina === totalPaginas}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── PillGroup ────────────────────────────────────────────────────────────────
const PillGroup = ({ options, value, onChange, getLabel }) => (
  <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800 overflow-x-auto scrollbar-none flex-shrink-0">
    {options.map(o => (
      <button key={o} onClick={() => onChange(o)}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
          value === o ? "bg-blue-600 text-white shadow shadow-blue-900/50"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}>
        {getLabel ? getLabel(o) : o}
      </button>
    ))}
  </div>
)

// ─── Agrupar sesiones por día ─────────────────────────────────────────────────
const agruparPorDia = (sesiones) => {
  const grupos = {}
  sesiones.forEach(s => {
    const dia = new Date(s.fecha).toISOString().slice(0, 10)
    if (!grupos[dia]) grupos[dia] = { fecha: s.fecha, sesiones: [], altura: 0, fuerza: 0, fatiga: 0 }
    grupos[dia].sesiones.push(s)
    grupos[dia].altura += s.altura_promedio || 0
    grupos[dia].fuerza += s.fuerza_max || 0
    grupos[dia].fatiga += s.indice_fatiga || 0
  })
  return Object.entries(grupos)
    .sort(([a], [b]) => new Date(b) - new Date(a))
    .map(([dia, g]) => {
      const n = g.sesiones.length
      return {
        ...g,
        dia,
        tipos:           [...new Set(g.sesiones.map(s => s.tipo))],
        cantidad_saltos: g.sesiones.reduce((a, s) => a + (s.cantidad_saltos || 0), 0),
        altura_prom:     +(g.altura / n).toFixed(2),
        fuerza_prom:     +(g.fuerza / n).toFixed(2),
        fatiga_prom:     +(g.fatiga / n).toFixed(2),
      }
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ResultadosSalto() {
  const [jugadores,        setJugadores]   = useState([])
  const [selectedJugador,  setSelected]    = useState(null)
  const [semanaActual,     setSemana]      = useState("todas")
  const [verPor,           setVerPor]      = useState("semana")
  const [modoFiltro,       setModoFiltro]  = useState("todos")
  const [metricaChart,     setMetrica]     = useState("altura_promedio")
  const [loadingJugadores, setLoadingJ]    = useState(true)
  const [loadingDatos,     setLoadingD]    = useState(false)
  const [resultados,       setResultados]  = useState(null)
  const [sesiones,         setSesiones]    = useState([])
  const [chartData,        setChartData]   = useState({})
  const [chartSemanas,     setChartSemanas]= useState([])
  const [error,            setError]       = useState("")
  const [showSidebar,      setShowSidebar] = useState(false)
  const [pagina,           setPagina]      = useState(1)

  const token = () => typeof window !== "undefined" ? localStorage.getItem("token") : ""

  useEffect(() => { setPagina(1) }, [modoFiltro, semanaActual, verPor, selectedJugador])

  // ─── Cargar jugadoras ──────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        setLoadingJ(true)
        const res  = await fetch(`${BASE_URL}/api/saltos/resultados/general`, {
          headers: { Authorization: `Bearer ${token()}` },
        })
        const data = await res.json()
        if (data.success) {
          setJugadores(data.data)
          if (data.data.length > 0) setSelected(data.data[0])
        }
      } catch { setError("Error al cargar jugadoras") }
      finally  { setLoadingJ(false) }
    })()
  }, [])

  // ─── Cargar datos al cambiar jugadora o semana ─────────────────────────────
  const cargarDatos = useCallback(async () => {
    if (!selectedJugador) return
    setLoadingD(true); setError("")
    try {
      const semInfo = SEMANAS.find(s => s.id === semanaActual)
      const params  = new URLSearchParams()
      if (semInfo?.desde) { params.set("desde", semInfo.desde); params.set("hasta", semInfo.hasta) }
      else params.set("periodo", "general")

      const [resStats, resSes] = await Promise.all([
        fetch(`${BASE_URL}/api/saltos/resultados/personal/${selectedJugador.cuentaId}?${params}`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
        fetch(`${BASE_URL}/api/saltos/resultados/personal/${selectedJugador.cuentaId}/sesiones?${params}`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
      ])

      const dStats = await resStats.json()
      const dSes   = await resSes.json()

      if (dStats.success) setResultados(dStats.data)
      if (dSes.success)   setSesiones(dSes.data.sesiones || [])

      await construirChartData(selectedJugador.cuentaId)
    } catch { setError("Error al cargar datos") }
    finally  { setLoadingD(false) }
  }, [selectedJugador, semanaActual])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // ─── Chart data por semanas ────────────────────────────────────────────────
  const construirChartData = async (cuentaId) => {
    const activas = semanaActual === "todas"
      ? SEMANAS.filter(s => s.id !== "todas")
      : SEMANAS.filter(s => s.id === semanaActual && s.id !== "todas")
    if (!activas.length) { setChartData({}); setChartSemanas([]); return }

    const tipos = ["salto simple", "salto conos"]
    const result = { "salto simple": [], "salto conos": [] }

    await Promise.all(activas.map(async sem => {
      const p = new URLSearchParams({ desde: sem.desde, hasta: sem.hasta })
      try {
        const res  = await fetch(`${BASE_URL}/api/saltos/resultados/personal/${cuentaId}/chart?${p}`, {
          headers: { Authorization: `Bearer ${token()}` },
        })
        const data = await res.json()
        tipos.forEach(tipo => {
          const info = data.success ? data.data[tipo] : null
          result[tipo].push({
            semana:          sem.label,
            altura_promedio: info?.altura_promedio        ?? 0,
            fuerza_max:      info?.fuerza_max_promedio    ?? 0,
            indice_fatiga:   info?.indice_fatiga_promedio ?? 0,
            total:           info?.total ?? 0,
          })
        })
      } catch {
        tipos.forEach(tipo => result[tipo].push({
          semana: sem.label, altura_promedio: 0, fuerza_max: 0, indice_fatiga: 0, total: 0,
        }))
      }
    }))

    setChartData(result)
    setChartSemanas(activas)
  }

  // ─── Sesiones filtradas ────────────────────────────────────────────────────
  const sesionesFiltradas = sesiones
    .filter(s => modoFiltro === "todos" || s.tipo === modoFiltro)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  const gruposDia = agruparPorDia(sesionesFiltradas)

  const listaPaginada  = verPor === "dia" ? gruposDia : sesionesFiltradas
  const totalPaginas   = Math.max(1, Math.ceil(listaPaginada.length / POR_PAGINA))
  const paginaSegura   = Math.min(pagina, totalPaginas)
  const itemsPag       = listaPaginada.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA)
  const sesionesPag    = verPor === "semana" ? itemsPag : []
  const gruposPag      = verPor === "dia"    ? itemsPag : []

  // ─── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = (() => {
    if (!resultados) return null
    const tot = resultados.totales || {}
    const pt  = resultados.por_tipo || {}
    const tipo = modoFiltro !== "todos" ? pt[modoFiltro] || {} : tot

    // Tendencia: últimas dos semanas con datos
    const tiposActivos = modoFiltro !== "todos"
      ? [modoFiltro]
      : ["salto simple", "salto conos"]

    const conDatos = tiposActivos.flatMap(t =>
      (chartData[t] || []).filter(p => p.total > 0)
    )
    const tendencia = conDatos.length >= 2
      ? (conDatos[conDatos.length - 1][metricaChart] ?? 0) -
        (conDatos[conDatos.length - 2][metricaChart] ?? 0)
      : null

    return {
      altura:        tipo.altura_promedio        ?? 0,
      fuerza:        tipo.fuerza_max_promedio     ?? 0,
      fatiga:        tipo.indice_fatiga_promedio  ?? 0,
      totalSaltos:   tipo.total_saltos            ?? 0,
      cantidad:      tipo.cantidad                ?? 0,
      tendencia,
    }
  })()

  const ultimaSesion = sesionesFiltradas[0]

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ════ HEADER ════ */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-none">Resultados</h1>
                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Sistema de Salto</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowSidebar(v => !v)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all">
                <User className="w-3.5 h-3.5" />
                <span className="max-w-[80px] truncate">
                  {selectedJugador ? selectedJugador.jugador.nombres.split(" ")[0] : "Jugadoras"}
                </span>
                <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${showSidebar ? "rotate-90" : ""}`} />
              </button>
              {selectedJugador && (
                <button onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exportar PDF</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="pb-3 flex gap-2 overflow-x-auto scrollbar-none">
            <PillGroup
              options={SEMANAS.map(s => s.id)}
              value={semanaActual}
              onChange={setSemana}
              getLabel={id => SEMANAS.find(s => s.id === id)?.label}
            />
            <PillGroup
              options={["semana", "dia"]}
              value={verPor}
              onChange={setVerPor}
              getLabel={v => v === "semana" ? "Por sesión" : "Por día"}
            />
            <PillGroup
              options={MODOS_SALTO}
              value={modoFiltro}
              onChange={setModoFiltro}
              getLabel={m => m === "todos" ? "Todos" : m === "salto simple" ? "Simple" : "Conos"}
            />
          </div>

          {/* Filtros activos */}
          {(modoFiltro !== "todos" || semanaActual !== "todas" || verPor !== "semana") && (
            <div className="pb-2 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Filtros:</span>
              {semanaActual !== "todas" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {SEMANAS.find(s => s.id === semanaActual)?.labelFull}
                </span>
              )}
              {modoFiltro !== "todos" && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${TIPO_COLORS[modoFiltro]?.bg} ${TIPO_COLORS[modoFiltro]?.text} ${TIPO_COLORS[modoFiltro]?.border}`}>
                  {modoFiltro}
                </span>
              )}
              {verPor === "dia" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  Agrupado por día
                </span>
              )}
              <button
                onClick={() => { setSemana("todas"); setModoFiltro("todos"); setVerPor("semana") }}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline ml-1 transition-colors">
                Limpiar
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ════ PANEL MÓVIL ════ */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${showSidebar ? "max-h-[600px]" : "max-h-0"}`}>
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Jugadoras</p>
          {loadingJugadores
            ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
            : jugadores.map(j => (
              <button key={j.cuentaId} onClick={() => { setSelected(j); setShowSidebar(false) }}
                className={`w-full text-left rounded-2xl border p-3 flex items-center gap-3 transition-all ${
                  selectedJugador?.cuentaId === j.cuentaId ? "bg-blue-600/15 border-blue-600/40" : "bg-slate-800/60 border-slate-700 hover:border-slate-600"
                }`}>
                <div className="w-9 h-9 rounded-xl bg-slate-700 flex-shrink-0 overflow-hidden">
                  {j.path
                    ? <img src={j.path} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                    : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-slate-500" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">{j.jugador.nombres} {j.jugador.apellidos}</p>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border inline-block mt-0.5 ${POS_COLORS[j.jugador.posicion_principal] || "bg-slate-700 text-slate-400 border-slate-600"}`}>
                    {j.jugador.posicion_principal}
                  </span>
                </div>
                {j.altura_promedio > 0 && (
                  <span className={`text-sm font-black flex-shrink-0 ${alturaColor(j.altura_promedio)}`}>
                    {j.altura_promedio}cm
                  </span>
                )}
              </button>
            ))
          }
        </div>
      </div>

      {/* ════ LAYOUT ════ */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-5 flex gap-5">

        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="sticky top-[148px] space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1 mb-3">Jugadoras</p>
            {loadingJugadores
              ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              : jugadores.map(j => (
                <button key={j.cuentaId} onClick={() => setSelected(j)}
                  className={`w-full text-left rounded-2xl border transition-all p-3 flex items-center gap-3 ${
                    selectedJugador?.cuentaId === j.cuentaId
                      ? "bg-blue-600/15 border-blue-600/40 shadow-lg shadow-blue-900/10"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700">
                    {j.path
                      ? <img src={j.path} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                      : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-slate-500" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate leading-tight">{j.jugador.nombres} {j.jugador.apellidos}</p>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border inline-block mt-0.5 ${POS_COLORS[j.jugador.posicion_principal] || "bg-slate-700 text-slate-400 border-slate-600"}`}>
                      {j.jugador.posicion_principal}
                    </span>
                  </div>
                  {j.altura_promedio > 0 && (
                    <span className={`text-sm font-black flex-shrink-0 ${alturaColor(j.altura_promedio)}`}>
                      {j.altura_promedio}cm
                    </span>
                  )}
                </button>
              ))
            }
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 space-y-4">
          {!selectedJugador ? (
            <div className="h-64 flex items-center justify-center text-slate-600">
              <div className="text-center">
                <User className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-semibold">Selecciona una jugadora</p>
              </div>
            </div>
          ) : loadingDatos ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* ── A: Header jugadora ── */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 overflow-hidden border-2 border-slate-700 flex-shrink-0">
                  {selectedJugador.path
                    ? <img src={selectedJugador.path} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                    : <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-slate-500" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-xl font-black text-white tracking-tight truncate">
                      {selectedJugador.jugador.nombres} {selectedJugador.jugador.apellidos}
                    </h2>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border flex-shrink-0 ${POS_COLORS[selectedJugador.jugador.posicion_principal] || "bg-slate-700 text-slate-400 border-slate-600"}`}>
                      {selectedJugador.jugador.posicion_principal}
                    </span>
                    {modoFiltro !== "todos" && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border flex-shrink-0 ${TIPO_COLORS[modoFiltro]?.bg} ${TIPO_COLORS[modoFiltro]?.text} ${TIPO_COLORS[modoFiltro]?.border}`}>
                        {modoFiltro}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <BarChart2 className="w-3 h-3" />
                      {sesionesFiltradas.length} prueba{sesionesFiltradas.length !== 1 ? "s" : ""}
                    </span>
                    {ultimaSesion && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        Última: {formatFechaCorta(ultimaSesion.fecha)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── B: KPIs ── */}
              {kpis && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Altura */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 to-transparent pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Altura prom.</p>
                        <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                      </div>
                      <p className={`text-2xl sm:text-3xl font-black tracking-tight ${alturaColor(kpis.altura)}`}>
                        {kpis.altura.toFixed(1)}<span className="text-base font-bold text-slate-500 ml-0.5">cm</span>
                      </p>
                    </div>
                  </div>
                  {/* Fuerza */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-600/8 to-transparent pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fuerza máx.</p>
                        <div className="w-7 h-7 rounded-lg bg-orange-600/20 flex items-center justify-center">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                      </div>
                      <p className={`text-2xl sm:text-3xl font-black tracking-tight ${fuerzaColor(kpis.fuerza)}`}>
                        {kpis.fuerza.toFixed(1)}<span className="text-base font-bold text-slate-500 ml-0.5">kg</span>
                      </p>
                    </div>
                  </div>
                  {/* Índice fatiga */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/8 to-transparent pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Índice fatiga</p>
                        <div className="w-7 h-7 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                          <Wind className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      </div>
                      <p className={`text-2xl sm:text-3xl font-black tracking-tight ${fatigaColor(kpis.fatiga)}`}>
                        {kpis.fatiga.toFixed(1)}<span className="text-base font-bold text-slate-500 ml-0.5">%</span>
                      </p>
                    </div>
                  </div>
                  {/* Total saltos */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-600/8 to-transparent pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total saltos</p>
                        <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        {kpis.totalSaltos}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{kpis.cantidad} sesión{kpis.cantidad !== 1 ? "es" : ""}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── C: Gráfico ── */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Mi evolución – {METRICAS.find(m => m.id === metricaChart)?.label} por modo
                      {modoFiltro !== "todos" ? ` · ${modoFiltro}` : ""}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Solo se grafican semanas con pruebas reales</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Toggle métrica */}
                    <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800">
                      {METRICAS.map(m => (
                        <button key={m.id} onClick={() => setMetrica(m.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                            metricaChart === m.id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
                          }`}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                    {/* Leyenda */}
                    <div className="flex items-center gap-3">
                      {(modoFiltro === "todos" ? ["salto simple", "salto conos"] : [modoFiltro]).map(t => (
                        <div key={t} className="flex items-center gap-1.5">
                          <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: TIPO_COLORS[t].line }} />
                          <span className="text-[10px] text-slate-400 capitalize">{t === "salto simple" ? "Simple" : "Conos"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {chartSemanas.length > 0 ? (
                  <div className="h-48 sm:h-64">
                    <LineChart
                      data={
                        modoFiltro !== "todos"
                          ? { "salto simple": [], "salto conos": [], [modoFiltro]: chartData[modoFiltro] || [] }
                          : chartData
                      }
                      semanas={chartSemanas}
                      metrica={metricaChart}
                    />
                  </div>
                ) : (
                  <div className="h-36 flex items-center justify-center text-slate-600">
                    <div className="text-center">
                      <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Sin datos</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── D: Tabla / historial ── */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center gap-3">
                  <List className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <h3 className="text-sm font-bold text-white">
                    Historial{verPor === "dia" ? " — por día" : " — por sesión"}
                    {modoFiltro !== "todos" ? ` · ${modoFiltro}` : ""}
                  </h3>
                  <span className="ml-auto text-xs text-slate-500 flex-shrink-0">
                    {listaPaginada.length} {verPor === "dia" ? "día" : "registro"}{listaPaginada.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Vista por sesión */}
                {verPor === "semana" && (
                  sesionesPag.length > 0 ? (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-800">
                              {["Semana","Día","Fecha","Modo","Altura prom (cm)","Fuerza máx (kg)","Índice fatiga (%)","Saltos"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sesionesPag.map((s, i) => {
                              const d = new Date(s.fecha)
                              const c = TIPO_COLORS[s.tipo]
                              return (
                                <tr key={s.id ?? i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                  <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                                    Sem {Math.ceil(d.getDate() / 7)} {d.toLocaleString("es-BO", { month: "short" })}
                                  </td>
                                  <td className="px-4 py-3.5 text-slate-400 text-xs">{d.getDate()}</td>
                                  <td className="px-4 py-3.5 text-slate-300 text-xs font-medium whitespace-nowrap">{formatFecha(s.fecha)}</td>
                                  <td className="px-4 py-3.5">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${c?.bg} ${c?.text} ${c?.border}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${c?.dot}`} />
                                      {s.tipo === "salto simple" ? "Simple" : "Conos"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <span className={`text-xs font-black ${alturaColor(s.altura_promedio)}`}>{(s.altura_promedio || 0).toFixed(2)}</span>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <span className={`text-xs font-black ${fuerzaColor(s.fuerza_max)}`}>{(s.fuerza_max || 0).toFixed(1)}</span>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${fatigaBg(s.indice_fatiga || 0)}`}>
                                      {(s.indice_fatiga || 0).toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-slate-300 text-xs font-mono">{s.cantidad_saltos || 0}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="md:hidden divide-y divide-slate-800/60">
                        {sesionesPag.map((s, i) => {
                          const c = TIPO_COLORS[s.tipo]
                          return (
                            <div key={s.id ?? i} className="px-4 py-3.5 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c?.dot}`} />
                                  <span className={`text-[10px] font-bold uppercase ${c?.text}`}>{s.tipo}</span>
                                  <span className="text-[10px] text-slate-500 ml-auto">{formatFechaCorta(s.fecha)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className={`font-bold ${alturaColor(s.altura_promedio)}`}>{(s.altura_promedio || 0).toFixed(1)}cm</span>
                                  <span className={`font-bold ${fuerzaColor(s.fuerza_max)}`}>{(s.fuerza_max || 0).toFixed(1)}kg</span>
                                  <span className={`font-black px-1.5 py-0.5 rounded border text-[10px] ${fatigaBg(s.indice_fatiga || 0)}`}>{(s.indice_fatiga || 0).toFixed(1)}%</span>
                                </div>
                              </div>
                              <span className="text-xs text-slate-500 flex-shrink-0">{s.cantidad_saltos || 0} saltos</span>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="py-12 flex flex-col items-center gap-2 text-slate-600">
                      <List className="w-7 h-7 opacity-20" />
                      <p className="text-sm">No hay pruebas para este período{modoFiltro !== "todos" ? ` en ${modoFiltro}` : ""}</p>
                    </div>
                  )
                )}

                {/* Vista por día */}
                {verPor === "dia" && (
                  gruposPag.length > 0 ? (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-800">
                              {["Fecha","Modos","Sesiones","Altura prom","Fuerza máx","Índice fatiga","Total saltos"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {gruposPag.map(g => (
                              <tr key={g.dia} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3.5 text-slate-300 text-xs font-medium whitespace-nowrap">{formatFecha(g.fecha)}</td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {g.tipos.map(t => {
                                      const c = TIPO_COLORS[t]
                                      return (
                                        <span key={t} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${c?.bg} ${c?.text} ${c?.border}`}>
                                          <span className={`w-1 h-1 rounded-full ${c?.dot}`} />{t === "salto simple" ? "Simple" : "Conos"}
                                        </span>
                                      )
                                    })}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-slate-400 text-xs font-mono">{g.sesiones.length}</td>
                                <td className="px-4 py-3.5"><span className={`text-xs font-black ${alturaColor(g.altura_prom)}`}>{g.altura_prom.toFixed(2)} cm</span></td>
                                <td className="px-4 py-3.5"><span className={`text-xs font-black ${fuerzaColor(g.fuerza_prom)}`}>{g.fuerza_prom.toFixed(1)} kg</span></td>
                                <td className="px-4 py-3.5"><span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${fatigaBg(g.fatiga_prom)}`}>{g.fatiga_prom.toFixed(1)}%</span></td>
                                <td className="px-4 py-3.5 text-slate-300 text-xs font-mono">{g.cantidad_saltos}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="md:hidden divide-y divide-slate-800/60">
                        {gruposPag.map(g => (
                          <div key={g.dia} className="px-4 py-3.5 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-bold text-slate-300">{formatFechaCorta(g.fecha)}</span>
                                <span className="text-[10px] text-slate-500">{g.sesiones.length} sesión{g.sesiones.length !== 1 ? "es" : ""}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className={`font-bold ${alturaColor(g.altura_prom)}`}>{g.altura_prom.toFixed(1)}cm</span>
                                <span className={`font-bold ${fuerzaColor(g.fuerza_prom)}`}>{g.fuerza_prom.toFixed(1)}kg</span>
                                <span className={`font-black px-1.5 py-0.5 rounded border text-[10px] ${fatigaBg(g.fatiga_prom)}`}>{g.fatiga_prom.toFixed(1)}%</span>
                              </div>
                            </div>
                            <span className="text-xs text-slate-500 flex-shrink-0">{g.cantidad_saltos} saltos</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-12 flex flex-col items-center gap-2 text-slate-600">
                      <List className="w-7 h-7 opacity-20" />
                      <p className="text-sm">No hay pruebas para este período</p>
                    </div>
                  )
                )}

                <Paginador pagina={paginaSegura} totalPaginas={totalPaginas} totalItems={listaPaginada.length} onChange={setPagina} />
              </div>

              {/* ── E: Detalle por tipo ── */}
              {resultados?.por_tipo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {(modoFiltro !== "todos" ? [modoFiltro] : ["salto simple", "salto conos"]).map(tipo => {
                    const info = resultados.por_tipo[tipo] || {}
                    const c    = TIPO_COLORS[tipo]
                    const sparkAltura = (chartData[tipo] || []).map(p => p.altura_promedio)
                    return (
                      <div key={tipo} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className="text-sm font-bold capitalize text-white">
                              {tipo === "salto simple" ? "Salto Simple (Vertical)" : "Salto con Conos"}
                            </span>
                          </div>
                          <Sparkline values={sparkAltura} color={c.line} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { label: "Sesiones",   val: info.cantidad ?? 0,                     cls: "text-white" },
                            { label: "Total saltos", val: info.total_saltos ?? 0,               cls: "text-white" },
                            { label: "Altura prom", val: `${(info.altura_promedio ?? 0).toFixed(1)} cm`, cls: alturaColor(info.altura_promedio ?? 0) },
                            { label: "Fuerza máx",  val: `${(info.fuerza_max_promedio ?? 0).toFixed(1)} kg`, cls: fuerzaColor(info.fuerza_max_promedio ?? 0) },
                            { label: "Fatiga prom", val: `${(info.indice_fatiga_promedio ?? 0).toFixed(1)} %`, cls: fatigaColor(info.indice_fatiga_promedio ?? 0) },
                            { label: "Mejor sesión",
                              val: info.mejor_salto ? `${(info.mejor_salto.altura_promedio || 0).toFixed(1)} cm` : "—",
                              cls: "text-emerald-400" },
                          ].map(({ label, val, cls }) => (
                            <div key={label} className="bg-slate-800/60 rounded-xl p-3">
                              <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                              <p className={`font-black text-sm sm:text-base ${cls}`}>{val}</p>
                            </div>
                          ))}
                        </div>
                        {info.mejor_salto && (
                          <div className="mt-3 pt-3 border-t border-slate-800">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Mejor prueba</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">{formatFechaCorta(info.mejor_salto?.fecha)}</span>
                              <span className="text-xs font-black text-emerald-400">{(info.mejor_salto?.altura_promedio ?? 0).toFixed(2)} cm</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 pb-4 print:hidden">
                <p className="text-[10px] text-slate-600">Sistema de Salto · {selectedJugador.jugador.nombres} {selectedJugador.jugador.apellidos}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all">
                    <Download className="w-3.5 h-3.5" />
                    Exportar PDF
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-950/50 border border-red-900/40 text-red-400 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,900&display=swap');
        .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        @media print {
          header { position: static !important; }
          aside, .lg\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}