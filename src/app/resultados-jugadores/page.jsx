"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp, TrendingDown, Minus, Download,
  Activity, Target, Zap, User, Calendar, BarChart2, List,
  AlertCircle, Loader2, ChevronRight, ChevronLeft,
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

const MODOS = ["todos", "aleatorio", "secuencial", "manual"]
const POR_PAGINA = 15

const MODO_COLORS = {
  aleatorio:  { line: "#6366f1", bg: "bg-indigo-500/15",  text: "text-indigo-400",  dot: "bg-indigo-500",  border: "border-indigo-500/30" },
  secuencial: { line: "#f59e0b", bg: "bg-amber-500/15",   text: "text-amber-400",   dot: "bg-amber-500",   border: "border-amber-500/30"  },
  manual:     { line: "#10b981", bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-500/30"},
}

const POS_COLORS = {
  armador: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  opuesto: "bg-amber-500/20  text-amber-300  border-amber-500/30",
  central: "bg-sky-500/20    text-sky-300    border-sky-500/30",
  punta:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  libero:  "bg-rose-500/20   text-rose-300   border-rose-500/30",
}

const precisionColor = (p) => p >= 85 ? "text-emerald-400" : p >= 75 ? "text-amber-400" : "text-red-400"
const precisionBg    = (p) =>
  p >= 85 ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
  : p >= 75 ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
  : "bg-red-500/15 border-red-500/30 text-red-400"

const formatFecha      = (f) => !f ? "—" : new Date(f).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })
const formatFechaCorta = (f) => !f ? "—" : new Date(f).toLocaleDateString("es-BO", { day: "2-digit", month: "short" })

// Agrupa sesiones por día (YYYY-MM-DD)
const agruparPorDia = (sesiones) => {
  const grupos = {}
  sesiones.forEach((s) => {
    const dia = new Date(s.fecha).toISOString().slice(0, 10)
    if (!grupos[dia]) grupos[dia] = { fecha: s.fecha, sesiones: [], aciertos: 0, errores: 0 }
    grupos[dia].sesiones.push(s)
    grupos[dia].aciertos += s.aciertos || 0
    grupos[dia].errores  += s.errores  || 0
  })
  return Object.entries(grupos)
    .sort(([a], [b]) => new Date(b) - new Date(a))
    .map(([dia, g]) => {
      const total = g.aciertos + g.errores
      return {
        ...g,
        dia,
        intentos:  total,
        precision: total > 0 ? Number(((g.aciertos / total) * 100).toFixed(2)) : 0,
        modos:     [...new Set(g.sesiones.map(s => s.modo))],
      }
    })
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ values = [], color = "#6366f1" }) => {
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

// ─── Line chart SVG ───────────────────────────────────────────────────────────
// Solo conecta puntos donde hay sesiones reales (total > 0)
const LineChart = ({ data, semanas }) => {
  const W = 640, H = 240, PAD = { t: 28, r: 20, b: 48, l: 44 }
  const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b
  const xOf = (i) => PAD.l + (i / Math.max(semanas.length - 1, 1)) * IW
  const yOf = (v) => PAD.t + IH - (v / 100) * IH

  const hayDatos = ["aleatorio", "secuencial", "manual"].some(m =>
    (data[m] || []).some(p => p.total > 0)
  )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={PAD.l} y1={yOf(v)} x2={W - PAD.r} y2={yOf(v)}
            stroke={v === 0 ? "#334155" : "#1e293b"} strokeWidth="1"
            strokeDasharray={v === 0 ? "none" : "3,3"} />
          <text x={PAD.l - 6} y={yOf(v) + 4} textAnchor="end" fontSize="10" fill="#475569">{v}%</text>
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

      {["aleatorio", "secuencial", "manual"].map(modo => {
        // Solo tomar los puntos donde hubo sesiones reales
        const conDatos = (data[modo] || [])
          .map((p, i) => ({ ...p, idx: i }))
          .filter(p => p.total > 0)
        if (!conDatos.length) return null
        const c = MODO_COLORS[modo].line

        // Línea que conecta únicamente los puntos con datos
        const pathD = conDatos.length >= 2
          ? conDatos.map((p, j) =>
              `${j === 0 ? "M" : "L"}${xOf(p.idx).toFixed(1)},${yOf(p.precision).toFixed(1)}`
            ).join(" ")
          : null

        return (
          <g key={modo}>
            {pathD && (
              <path d={pathD} fill="none" stroke={c} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" />
            )}
            {conDatos.map((p) => (
              <g key={p.idx}>
                {/* Punto con halo más grande si está solo */}
                <circle
                  cx={xOf(p.idx)} cy={yOf(p.precision)}
                  r={conDatos.length === 1 ? 6 : 4.5}
                  fill="#0f172a" stroke={c} strokeWidth="2.5"
                />
                <text
                  x={xOf(p.idx)} y={yOf(p.precision) - 10}
                  textAnchor="middle" fontSize="9.5" fill={c} fontWeight="700"
                >
                  {p.precision}%
                </text>
              </g>
            ))}
          </g>
        )
      })}
      <line x1={PAD.l} y1={PAD.t + IH} x2={W - PAD.r} y2={PAD.t + IH}
        stroke="#334155" strokeWidth="1" />
    </svg>
  )
}

// ─── Paginador ────────────────────────────────────────────────────────────────
const Paginador = ({ pagina, totalPaginas, onChange, totalItems }) => {
  if (totalPaginas <= 1) return null
  const inicio = (pagina - 1) * POR_PAGINA + 1
  const fin    = Math.min(pagina * POR_PAGINA, totalItems)

  // Genera array de páginas visibles (máx 7 botones con ellipsis)
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
        <button
          onClick={() => onChange(pagina - 1)}
          disabled={pagina === 1}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {paginas.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="w-7 text-center text-xs text-slate-600 select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                p === pagina
                  ? "bg-indigo-600 text-white shadow shadow-indigo-900/50"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(pagina + 1)}
          disabled={pagina === totalPaginas}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Scrollable pill group ────────────────────────────────────────────────────
const PillGroup = ({ options, value, onChange, getLabel }) => (
  <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800 overflow-x-auto scrollbar-none flex-shrink-0">
    {options.map(o => (
      <button key={o} onClick={() => onChange(o)}
        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
          value === o ? "bg-indigo-600 text-white shadow shadow-indigo-900/50" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}>
        {getLabel ? getLabel(o) : o}
      </button>
    ))}
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
export default function ResultadosReaccion() {
  const [jugadores, setJugadores]       = useState([])
  const [selectedJugador, setSelected]  = useState(null)
  const [semanaActual, setSemana]       = useState("todas")
  const [verPor, setVerPor]             = useState("semana")
  const [modoFiltro, setModoFiltro]     = useState("todos")
  const [loadingJugadores, setLoadingJ] = useState(true)
  const [loadingDatos, setLoadingD]     = useState(false)
  const [resultados, setResultados]     = useState(null)
  const [sesiones, setSesiones]         = useState([])
  const [chartData, setChartData]       = useState({})
  const [chartSemanas, setChartSemanas] = useState([])
  const [error, setError]               = useState("")
  const [showSidebar, setShowSidebar]   = useState(false)
  const [pagina, setPagina]             = useState(1)

  const token = () => typeof window !== "undefined" ? localStorage.getItem("token") : ""

  // Resetear página al cambiar cualquier filtro
  useEffect(() => { setPagina(1) }, [modoFiltro, semanaActual, verPor, selectedJugador])

  // ─── Cargar lista de jugadores ─────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        setLoadingJ(true)
        const res  = await fetch(`${BASE_URL}/api/cuentas`, { headers: { Authorization: `Bearer ${token()}` } })
        const data = await res.json()
        if (data.success) {
          const jgs = data.data.filter(c => c.rol === "jugador" && c.jugador)
            .map(c => ({ ...c.jugador, cuentaId: c.id, path: c.path || "" }))
          setJugadores(jgs)
          if (jgs.length > 0) setSelected(jgs[0])
        }
      } catch { setError("Error al cargar jugadoras") }
      finally  { setLoadingJ(false) }
    })()
  }, [])

  // ─── Cargar datos cuando cambia jugador o semana ───────────────────────────
  const cargarDatos = useCallback(async () => {
    if (!selectedJugador) return
    setLoadingD(true); setError("")
    try {
      const semInfo = SEMANAS.find(s => s.id === semanaActual)
      const params  = new URLSearchParams()
      if (semInfo?.desde) { params.set("desde", semInfo.desde); params.set("hasta", semInfo.hasta) }
      else params.set("periodo", "general")

      const [resStats, resSesiones] = await Promise.all([
        fetch(`${BASE_URL}/api/resultados/personal/${selectedJugador.cuentaId}?${params}`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
        fetch(`${BASE_URL}/api/resultados/personal/${selectedJugador.cuentaId}/sesiones?${params}`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
      ])

      const dataStats    = await resStats.json()
      const dataSesiones = await resSesiones.json()

      if (dataStats.success)    setResultados(dataStats.data)
      if (dataSesiones.success) setSesiones(dataSesiones.data.sesiones || [])

      await construirChartData(selectedJugador.cuentaId)
    } catch { setError("Error al cargar datos") }
    finally  { setLoadingD(false) }
  }, [selectedJugador, semanaActual])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // ─── Construir datos del gráfico — guarda total por punto ─────────────────
  const construirChartData = async (cuentaId) => {
    const activas = semanaActual === "todas"
      ? SEMANAS.filter(s => s.id !== "todas")
      : SEMANAS.filter(s => s.id === semanaActual && s.id !== "todas")
    if (!activas.length) { setChartData({}); setChartSemanas([]); return }
    const modos_ = ["aleatorio", "secuencial", "manual"]
    const result = { aleatorio: [], secuencial: [], manual: [] }
    await Promise.all(activas.map(async (sem) => {
      const p = new URLSearchParams({ desde: sem.desde, hasta: sem.hasta })
      try {
        const res  = await fetch(`${BASE_URL}/api/resultados/personal/${cuentaId}?${p}`, {
          headers: { Authorization: `Bearer ${token()}` },
        })
        const data = await res.json()
        modos_.forEach(m => {
          const info = data.success ? data.data.por_tipo_reaccion?.[m] : null
          result[m].push({
            semana:    sem.label,
            precision: info?.precision ?? 0,
            // total > 0 significa que hay sesiones reales en esa semana
            total:     info?.total_realizadas ?? 0,
          })
        })
      } catch {
        modos_.forEach(m => result[m].push({ semana: sem.label, precision: 0, total: 0 }))
      }
    }))
    setChartData(result)
    setChartSemanas(activas)
  }

  // ─── Sesiones filtradas ────────────────────────────────────────────────────
  const sesionesFiltradas = sesiones
    .filter(s => modoFiltro === "todos" || s.modo === modoFiltro)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  const sesionesAgrupadasPorDia = agruparPorDia(sesionesFiltradas)

  // ─── Paginación ────────────────────────────────────────────────────────────
  const listaPaginada  = verPor === "dia" ? sesionesAgrupadasPorDia : sesionesFiltradas
  const totalPaginas   = Math.max(1, Math.ceil(listaPaginada.length / POR_PAGINA))
  const paginaSegura   = Math.min(pagina, totalPaginas)
  const itemsPagActual = listaPaginada.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA)
  const sesionesPagina = verPor === "semana" ? itemsPagActual : []
  const gruposPagina   = verPor === "dia"    ? itemsPagActual : []

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = (() => {
    if (!resultados) return null
    const tipos = resultados.por_tipo_reaccion || {}

    if (modoFiltro !== "todos") {
      const info      = tipos[modoFiltro] || {}
      // Tendencia: últimos dos puntos con datos reales del modo
      const conDatos  = (chartData[modoFiltro] || []).filter(p => p.total > 0)
      const tendencia = conDatos.length >= 2
        ? conDatos[conDatos.length - 1].precision - conDatos[conDatos.length - 2].precision
        : null
      return {
        precision:       info.precision ?? 0,
        mejorModo:       modoFiltro,
        mejorPrec:       info.precision ?? 0,
        tendencia,
        totalReacciones: info.total_realizadas ?? 0,
      }
    }

    const tg = resultados.totales_generales || {}
    let mejorModo = null, mejorPrec = -1
    Object.entries(tipos).forEach(([modo, info]) => {
      if ((info.total_realizadas || 0) > 0 && info.precision > mejorPrec) {
        mejorPrec = info.precision; mejorModo = modo
      }
    })
    // Tendencia general: últimos dos puntos con datos de cualquier modo
    const allConDatos = [
      ...(chartData.aleatorio  || []).filter(p => p.total > 0),
      ...(chartData.secuencial || []).filter(p => p.total > 0),
      ...(chartData.manual     || []).filter(p => p.total > 0),
    ]
    const tendencia = allConDatos.length >= 2
      ? allConDatos[allConDatos.length - 1].precision - allConDatos[allConDatos.length - 2].precision
      : null
    return {
      precision:       tg.precision ?? 0,
      mejorModo,
      mejorPrec,
      tendencia,
      totalReacciones: tg.total_reacciones ?? 0,
    }
  })()

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ════ HEADER ════ */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-none">Resultados</h1>
                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Sistema de Reacción</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowSidebar(v => !v)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span className="max-w-[80px] truncate">
                  {selectedJugador ? selectedJugador.nombres.split(" ")[0] : "Jugadoras"}
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
              options={MODOS}
              value={modoFiltro}
              onChange={setModoFiltro}
              getLabel={m => m.charAt(0).toUpperCase() + m.slice(1)}
            />
          </div>

          {/* Indicador de filtros activos */}
          {(modoFiltro !== "todos" || semanaActual !== "todas" || verPor !== "semana") && (
            <div className="pb-2 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Filtros:</span>
              {semanaActual !== "todas" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  {SEMANAS.find(s => s.id === semanaActual)?.labelFull}
                </span>
              )}
              {modoFiltro !== "todos" && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${MODO_COLORS[modoFiltro]?.bg} ${MODO_COLORS[modoFiltro]?.text} ${MODO_COLORS[modoFiltro]?.border}`}>
                  Modo: {modoFiltro}
                </span>
              )}
              {verPor === "dia" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  Agrupado por día
                </span>
              )}
              <button
                onClick={() => { setSemana("todas"); setModoFiltro("todos"); setVerPor("semana") }}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline ml-1 transition-colors"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ════ PANEL JUGADORAS MÓVIL ════ */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${showSidebar ? "max-h-[600px]" : "max-h-0"}`}>
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Jugadoras</p>
          {loadingJugadores
            ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
            : jugadores.map(j => (
              <button key={j.id} onClick={() => { setSelected(j); setShowSidebar(false) }}
                className={`w-full text-left rounded-2xl border p-3 flex items-center gap-3 transition-all ${
                  selectedJugador?.id === j.id ? "bg-indigo-600/15 border-indigo-600/40" : "bg-slate-800/60 border-slate-700 hover:border-slate-600"
                }`}>
                <div className="w-9 h-9 rounded-xl bg-slate-700 flex-shrink-0 overflow-hidden">
                  {j.path
                    ? <img src={j.path} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                    : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-slate-500" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">{j.nombres} {j.apellidos}</p>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border inline-block mt-0.5 ${POS_COLORS[j.posicion_principal] || "bg-slate-700 text-slate-400 border-slate-600"}`}>
                    {j.posicion_principal}
                  </span>
                </div>
                {selectedJugador?.id === j.id && resultados && (
                  <span className={`text-sm font-black flex-shrink-0 ${precisionColor(resultados.totales_generales?.precision ?? 0)}`}>
                    {(resultados.totales_generales?.precision ?? 0).toFixed(0)}%
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
          <div className="sticky top-[140px] space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1 mb-3">Jugadoras</p>
            {loadingJugadores
              ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              : jugadores.map(j => (
                <button key={j.id} onClick={() => setSelected(j)}
                  className={`w-full text-left rounded-2xl border transition-all p-3 flex items-center gap-3 ${
                    selectedJugador?.id === j.id
                      ? "bg-indigo-600/15 border-indigo-600/40 shadow-lg shadow-indigo-900/10"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700">
                    {j.path
                      ? <img src={j.path} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                      : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-slate-500" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate leading-tight">{j.nombres} {j.apellidos}</p>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border inline-block mt-0.5 ${POS_COLORS[j.posicion_principal] || "bg-slate-700 text-slate-400 border-slate-600"}`}>
                      {j.posicion_principal}
                    </span>
                  </div>
                  {selectedJugador?.id === j.id && resultados && (
                    <span className={`text-sm font-black flex-shrink-0 ${precisionColor(resultados.totales_generales?.precision ?? 0)}`}>
                      {(resultados.totales_generales?.precision ?? 0).toFixed(0)}%
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
              <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
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
                      {selectedJugador.nombres} {selectedJugador.apellidos}
                    </h2>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border flex-shrink-0 ${POS_COLORS[selectedJugador.posicion_principal] || "bg-slate-700 text-slate-400 border-slate-600"}`}>
                      {selectedJugador.posicion_principal}
                    </span>
                    {modoFiltro !== "todos" && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border flex-shrink-0 ${MODO_COLORS[modoFiltro]?.bg} ${MODO_COLORS[modoFiltro]?.text} ${MODO_COLORS[modoFiltro]?.border}`}>
                        {modoFiltro}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <BarChart2 className="w-3 h-3" />
                      {sesionesFiltradas.length} sesión{sesionesFiltradas.length !== 1 ? "es" : ""}
                      {modoFiltro !== "todos" ? ` (${modoFiltro})` : ""}
                    </span>
                    {sesionesFiltradas.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        Última: {formatFechaCorta(sesionesFiltradas[0]?.fecha)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── B: KPIs ── */}
              {kpis && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/8 to-transparent pointer-events-none" />
                    <div className="relative flex sm:block items-center gap-4">
                      <div className="flex items-center justify-between mb-0 sm:mb-3 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          % Aciertos {modoFiltro !== "todos" ? `(${modoFiltro})` : "general"}
                        </p>
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-indigo-400" />
                        </div>
                      </div>
                      <div>
                        <p className={`text-3xl sm:text-4xl font-black tracking-tight ${precisionColor(kpis.precision)}`}>
                          {kpis.precision.toFixed(1)}<span className="text-xl">%</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{kpis.totalReacciones} sesiones</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/8 to-transparent pointer-events-none" />
                    <div className="relative flex sm:block items-center gap-4">
                      <div className="flex items-center justify-between mb-0 sm:mb-3 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {modoFiltro !== "todos" ? "Modo seleccionado" : "Mejor modo"}
                        </p>
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-emerald-400" />
                        </div>
                      </div>
                      {kpis.mejorModo ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${MODO_COLORS[kpis.mejorModo]?.dot}`} />
                            <p className="text-xl sm:text-2xl font-black capitalize text-white">{kpis.mejorModo}</p>
                          </div>
                          <p className="text-emerald-400 font-bold text-base sm:text-lg mt-0.5">{kpis.mejorPrec.toFixed(1)}%</p>
                        </div>
                      ) : <p className="text-slate-600 text-sm">Sin datos</p>}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-600/8 to-transparent pointer-events-none" />
                    <div className="relative flex sm:block items-center gap-4">
                      <div className="flex items-center justify-between mb-0 sm:mb-3 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tendencia</p>
                        <div className="w-8 h-8 rounded-lg bg-sky-600/20 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-4 h-4 text-sky-400" />
                        </div>
                      </div>
                      {kpis.tendencia !== null ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            {kpis.tendencia > 0
                              ? <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                              : kpis.tendencia < 0
                                ? <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0" />
                                : <Minus className="w-5 h-5 text-slate-500 flex-shrink-0" />}
                            <p className={`text-2xl sm:text-3xl font-black ${kpis.tendencia > 0 ? "text-emerald-400" : kpis.tendencia < 0 ? "text-red-400" : "text-slate-500"}`}>
                              {kpis.tendencia > 0 ? "+" : ""}{kpis.tendencia.toFixed(1)}%
                            </p>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">vs período anterior</p>
                        </div>
                      ) : <p className="text-slate-600 text-sm">Sin datos suficientes</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── C: Gráfico de evolución ── */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Mi evolución – % aciertos
                      {modoFiltro !== "todos" ? ` · ${modoFiltro}` : " por modo"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Solo se grafican semanas con sesiones reales</p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    {(modoFiltro === "todos" ? ["aleatorio", "secuencial", "manual"] : [modoFiltro]).map(m => (
                      <div key={m} className="flex items-center gap-1.5">
                        <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: MODO_COLORS[m].line }} />
                        <span className="text-[10px] sm:text-xs text-slate-400 capitalize">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {chartSemanas.length > 0 ? (
                  <div className="h-48 sm:h-64">
                    <LineChart
                      data={
                        modoFiltro !== "todos"
                          ? {
                              aleatorio:  [],
                              secuencial: [],
                              manual:     [],
                              [modoFiltro]: chartData[modoFiltro] || [],
                            }
                          : chartData
                      }
                      semanas={chartSemanas}
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

              {/* ── D: Historial con paginación ── */}
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

                {/* Vista POR SESIÓN */}
                {verPor === "semana" && (
                  sesionesPagina.length > 0 ? (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-800">
                              {["Semana", "Día", "Fecha", "Modo", "Intentos", "Aciertos", "Fallos", "% Aciertos"].map(h => (
                                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sesionesPagina.map((s, i) => {
                              const prec = s.precision ?? (
                                (s.aciertos || 0) + (s.errores || 0) > 0
                                  ? ((s.aciertos || 0) / ((s.aciertos || 0) + (s.errores || 0))) * 100
                                  : 0
                              )
                              const d = new Date(s.fecha)
                              const c = MODO_COLORS[s.modo]
                              return (
                                <tr key={s.id ?? i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                  <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                                    Sem {Math.ceil(d.getDate() / 7)} {d.toLocaleString("es-BO", { month: "short" })}
                                  </td>
                                  <td className="px-5 py-3.5 text-slate-400 text-xs">{d.getDate()}</td>
                                  <td className="px-5 py-3.5 text-slate-300 text-xs font-medium whitespace-nowrap">{formatFecha(s.fecha)}</td>
                                  <td className="px-5 py-3.5">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${c?.bg || "bg-slate-800"} ${c?.text || "text-slate-300"} ${c?.border || "border-slate-700"}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${c?.dot || "bg-slate-500"}`} />{s.modo}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-slate-300 text-xs font-mono">{s.intentos ?? (s.aciertos || 0) + (s.errores || 0)}</td>
                                  <td className="px-5 py-3.5 text-emerald-400 text-xs font-mono font-bold">{s.aciertos || 0}</td>
                                  <td className="px-5 py-3.5 text-red-400 text-xs font-mono">{s.errores || 0}</td>
                                  <td className="px-5 py-3.5">
                                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${precisionBg(prec)}`}>
                                      {prec.toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="md:hidden divide-y divide-slate-800/60">
                        {sesionesPagina.map((s, i) => {
                          const prec = s.precision ?? (
                            (s.aciertos || 0) + (s.errores || 0) > 0
                              ? ((s.aciertos || 0) / ((s.aciertos || 0) + (s.errores || 0))) * 100
                              : 0
                          )
                          const c = MODO_COLORS[s.modo]
                          return (
                            <div key={s.id ?? i} className="px-4 py-3.5 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c?.dot || "bg-slate-500"}`} />
                                  <span className={`text-[10px] font-bold uppercase ${c?.text || "text-slate-400"}`}>{s.modo}</span>
                                  <span className="text-[10px] text-slate-500 ml-auto">{formatFechaCorta(s.fecha)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span className="text-emerald-400 font-bold">{s.aciertos || 0}</span>
                                  <span className="text-slate-600">aciertos</span>
                                  <span className="text-slate-700">·</span>
                                  <span className="text-red-400">{s.errores || 0}</span>
                                  <span className="text-slate-600">fallos</span>
                                </div>
                              </div>
                              <span className={`text-sm font-black px-2.5 py-1 rounded-xl border flex-shrink-0 ${precisionBg(prec)}`}>
                                {prec.toFixed(1)}%
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="py-12 flex flex-col items-center gap-2 text-slate-600">
                      <List className="w-7 h-7 opacity-20" />
                      <p className="text-sm">No hay sesiones para este período{modoFiltro !== "todos" ? ` en modo ${modoFiltro}` : ""}</p>
                    </div>
                  )
                )}

                {/* Vista AGRUPADA POR DÍA */}
                {verPor === "dia" && (
                  gruposPagina.length > 0 ? (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-800">
                              {["Fecha", "Modos", "Sesiones", "Intentos", "Aciertos", "Fallos", "% Día"].map(h => (
                                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {gruposPagina.map((g) => (
                              <tr key={g.dia} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                <td className="px-5 py-3.5 text-slate-300 text-xs font-medium whitespace-nowrap">{formatFecha(g.fecha)}</td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {g.modos.map(m => {
                                      const c = MODO_COLORS[m]
                                      return (
                                        <span key={m} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${c?.bg} ${c?.text} ${c?.border}`}>
                                          <span className={`w-1 h-1 rounded-full ${c?.dot}`} />{m}
                                        </span>
                                      )
                                    })}
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-slate-400 text-xs font-mono">{g.sesiones.length}</td>
                                <td className="px-5 py-3.5 text-slate-300 text-xs font-mono">{g.intentos}</td>
                                <td className="px-5 py-3.5 text-emerald-400 text-xs font-mono font-bold">{g.aciertos}</td>
                                <td className="px-5 py-3.5 text-red-400 text-xs font-mono">{g.errores}</td>
                                <td className="px-5 py-3.5">
                                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${precisionBg(g.precision)}`}>
                                    {g.precision.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="md:hidden divide-y divide-slate-800/60">
                        {gruposPagina.map((g) => (
                          <div key={g.dia} className="px-4 py-3.5 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-bold text-slate-300">{formatFechaCorta(g.fecha)}</span>
                                <span className="text-[10px] text-slate-500">{g.sesiones.length} sesión{g.sesiones.length !== 1 ? "es" : ""}</span>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap mb-1">
                                {g.modos.map(m => {
                                  const c = MODO_COLORS[m]
                                  return (
                                    <span key={m} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${c?.bg} ${c?.text} ${c?.border}`}>{m}</span>
                                  )
                                })}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="text-emerald-400 font-bold">{g.aciertos}</span>
                                <span className="text-slate-600">aciertos</span>
                                <span className="text-slate-700">·</span>
                                <span className="text-red-400">{g.errores}</span>
                                <span className="text-slate-600">fallos</span>
                              </div>
                            </div>
                            <span className={`text-sm font-black px-2.5 py-1 rounded-xl border flex-shrink-0 ${precisionBg(g.precision)}`}>
                              {g.precision.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-12 flex flex-col items-center gap-2 text-slate-600">
                      <List className="w-7 h-7 opacity-20" />
                      <p className="text-sm">No hay sesiones para este período{modoFiltro !== "todos" ? ` en modo ${modoFiltro}` : ""}</p>
                    </div>
                  )
                )}

                {/* Paginador */}
                <Paginador
                  pagina={paginaSegura}
                  totalPaginas={totalPaginas}
                  totalItems={listaPaginada.length}
                  onChange={setPagina}
                />
              </div>

              {/* ── E: Detalle por tipo ── */}
              {resultados?.por_tipo_reaccion && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {(modoFiltro !== "todos" ? [modoFiltro] : ["aleatorio", "secuencial", "manual"]).map(modo => {
                    const info      = resultados.por_tipo_reaccion[modo] || {}
                    const c         = MODO_COLORS[modo]
                    const sparkVals = (chartData[modo] || []).map(p => p.precision)
                    return (
                      <div key={modo} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className="text-sm font-bold capitalize text-white">{modo}</span>
                            {modoFiltro === modo && (
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${c.bg} ${c.text} ${c.border}`}>activo</span>
                            )}
                          </div>
                          <Sparkline values={sparkVals} color={c.line} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Sesiones",  val: info.total_realizadas ?? 0, cls: "text-white" },
                            { label: "Precisión", val: `${(info.precision ?? 0).toFixed(1)}%`, cls: precisionColor(info.precision ?? 0) },
                            { label: "Aciertos",  val: info.total_aciertos ?? 0, cls: "text-emerald-400" },
                            { label: "Errores",   val: info.total_errores  ?? 0, cls: "text-red-400" },
                          ].map(({ label, val, cls }) => (
                            <div key={label} className="bg-slate-800/60 rounded-xl p-3">
                              <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                              <p className={`font-black text-base ${cls}`}>{val}</p>
                            </div>
                          ))}
                        </div>
                        {info.mejor_reaccion && (
                          <div className="mt-3 pt-3 border-t border-slate-800">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Mejor sesión</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">{formatFechaCorta(info.mejor_reaccion?.fecha)}</span>
                              <span className="text-xs font-black text-emerald-400">{(info.mejor_reaccion?.precision ?? 0).toFixed(1)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
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