"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp, TrendingDown, Minus, Download,
  Activity, Target, Zap, User, Calendar, BarChart2, List,
  AlertCircle, Loader2, ChevronRight, ChevronLeft, X,
} from "lucide-react"

const BASE_URL = "https://jenn-back-reac.onrender.com"
const MODOS = ["todos", "aleatorio", "secuencial", "manual"]
const POR_PAGINA = 15

const MODO_COLORS = {
  aleatorio:  { line: "#6366f1", bg: "bg-indigo-100",   text: "text-indigo-700",  dot: "bg-indigo-500",  border: "border-indigo-200" },
  secuencial: { line: "#f59e0b", bg: "bg-amber-100",    text: "text-amber-700",   dot: "bg-amber-500",   border: "border-amber-200"  },
  manual:     { line: "#10b981", bg: "bg-emerald-100",  text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200"},
}

const POS_COLORS = {
  armador: "bg-violet-100 text-violet-700 border-violet-200",
  opuesto: "bg-amber-100  text-amber-700  border-amber-200",
  central: "bg-sky-100    text-sky-700    border-sky-200",
  punta:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  libero:  "bg-rose-100   text-rose-700   border-rose-200",
}

const precisionColor = (p) => p >= 85 ? "text-emerald-600" : p >= 75 ? "text-amber-600" : "text-red-500"
const precisionBg    = (p) =>
  p >= 85 ? "bg-emerald-50 border-emerald-200 text-emerald-700"
  : p >= 75 ? "bg-amber-50 border-amber-200 text-amber-700"
  : "bg-red-50 border-red-200 text-red-600"

const formatFecha      = (f) => !f ? "—" : new Date(f).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })
const formatFechaCorta = (f) => !f ? "—" : new Date(f).toLocaleDateString("es-BO", { day: "2-digit", month: "short" })
const toInputDate      = (d) => d ? new Date(d).toISOString().split("T")[0] : ""

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
const LineChart = ({ data, labels }) => {
  const W = 800, H = 360, PAD = { t: 36, r: 28, b: 56, l: 52 }
  const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b
  const n = labels.length
  const xOf = (i) => PAD.l + (i / Math.max(n - 1, 1)) * IW
  const yOf = (v) => PAD.t + IH - (v / 100) * IH

  const hayDatos = ["aleatorio", "secuencial", "manual"].some(m =>
    (data[m] || []).some(p => p.total > 0)
  )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid */}
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={PAD.l} y1={yOf(v)} x2={W - PAD.r} y2={yOf(v)}
            stroke={v === 0 ? "#cbd5e1" : "#e2e8f0"} strokeWidth="1"
            strokeDasharray={v === 0 ? "none" : "4,4"} />
          <text x={PAD.l - 8} y={yOf(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8" fontFamily="inherit">{v}%</text>
        </g>
      ))}
      {/* X labels */}
      {labels.map((lbl, i) => (
        <text key={i} x={xOf(i)} y={H - PAD.b + 20} textAnchor="middle" fontSize="11" fill="#94a3b8" fontFamily="inherit">
          {lbl}
        </text>
      ))}
      {!hayDatos && (
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="13" fill="#94a3b8" fontFamily="inherit">
          Sin datos para este período
        </text>
      )}
      {["aleatorio", "secuencial", "manual"].map(modo => {
        const conDatos = (data[modo] || [])
          .map((p, i) => ({ ...p, idx: i }))
          .filter(p => p.total > 0)
        if (!conDatos.length) return null
        const c = MODO_COLORS[modo].line
        const pathD = conDatos.length >= 2
          ? conDatos.map((p, j) => `${j === 0 ? "M" : "L"}${xOf(p.idx).toFixed(1)},${yOf(p.precision).toFixed(1)}`).join(" ")
          : null
        return (
          <g key={modo}>
            {pathD && (
              <path d={pathD} fill="none" stroke={c} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
            )}
            {conDatos.map(p => (
              <g key={p.idx}>
                <circle cx={xOf(p.idx)} cy={yOf(p.precision)} r={conDatos.length === 1 ? 7 : 5}
                  fill="white" stroke={c} strokeWidth="2.5" />
                <text x={xOf(p.idx)} y={yOf(p.precision) - 11}
                  textAnchor="middle" fontSize="10" fill={c} fontWeight="700" fontFamily="inherit">
                  {p.precision}%
                </text>
              </g>
            ))}
          </g>
        )
      })}
      <line x1={PAD.l} y1={PAD.t + IH} x2={W - PAD.r} y2={PAD.t + IH} stroke="#cbd5e1" strokeWidth="1.5" />
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
    if (pagina > 3) paginas.push("...")
    for (let i = Math.max(2, pagina - 1); i <= Math.min(totalPaginas - 1, pagina + 1); i++) paginas.push(i)
    if (pagina < totalPaginas - 2) paginas.push("...")
    paginas.push(totalPaginas)
  }
  return (
    <div className="px-4 sm:px-6 py-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50">
      <p className="text-[11px] text-slate-400 flex-shrink-0">
        Mostrando <span className="text-slate-600 font-bold">{inicio}–{fin}</span> de{" "}
        <span className="text-slate-600 font-bold">{totalItems}</span> registros
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(pagina - 1)} disabled={pagina === 1}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {paginas.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="w-7 text-center text-xs text-slate-400 select-none">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                p === pagina ? "bg-indigo-600 text-white shadow shadow-indigo-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(pagina + 1)} disabled={pagina === totalPaginas}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── PillGroup ────────────────────────────────────────────────────────────────
const PillGroup = ({ options, value, onChange, getLabel }) => (
  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200 overflow-x-auto scrollbar-none flex-shrink-0">
    {options.map(o => (
      <button key={o} onClick={() => onChange(o)}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
          value === o ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
        }`}>
        {getLabel ? getLabel(o) : o}
      </button>
    ))}
  </div>
)

// ─── DateRangePicker ──────────────────────────────────────────────────────────
const DateRangePicker = ({ desde, hasta, onDesde, onHasta, onLimpiar }) => (
  <div className="flex items-center gap-2 flex-wrap">
    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Desde</span>
      <input type="date" value={desde} onChange={e => onDesde(e.target.value)}
        className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer" />
    </div>
    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Hasta</span>
      <input type="date" value={hasta} onChange={e => onHasta(e.target.value)}
        className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer" />
    </div>
    {(desde || hasta) && (
      <button onClick={onLimpiar}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-all">
        <X className="w-3 h-3" /> Limpiar
      </button>
    )}
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
export default function ResultadosReaccion() {
  const [jugadores, setJugadores]       = useState([])
  const [selectedJugador, setSelected]  = useState(null)
  const [desde, setDesde]               = useState("")
  const [hasta, setHasta]               = useState("")
  const [modoFiltro, setModoFiltro]     = useState("todos")
  const [loadingJugadores, setLoadingJ] = useState(true)
  const [loadingDatos, setLoadingD]     = useState(false)
  const [resultados, setResultados]     = useState(null)
  const [sesiones, setSesiones]         = useState([])
  const [chartData, setChartData]       = useState({})
  const [chartLabels, setChartLabels]   = useState([])
  const [error, setError]               = useState("")
  const [showSidebar, setShowSidebar]   = useState(false)
  const [pagina, setPagina]             = useState(1)

  const token = () => typeof window !== "undefined" ? localStorage.getItem("token") : ""

  useEffect(() => { setPagina(1) }, [modoFiltro, desde, hasta, selectedJugador])

  // ─── Cargar jugadores ──────────────────────────────────────────────────────
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

  // ─── Construir params ──────────────────────────────────────────────────────
  const buildParams = useCallback(() => {
    const params = new URLSearchParams()
    if (desde) { params.set("desde", desde); if (hasta) params.set("hasta", hasta) }
    else params.set("periodo", "general")
    return params
  }, [desde, hasta])

  // ─── Cargar datos ──────────────────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    if (!selectedJugador) return
    setLoadingD(true); setError("")
    try {
      const params = buildParams()
      const [resStats, resSesiones] = await Promise.all([
        fetch(`${BASE_URL}/api/resultados/personal/${selectedJugador.cuentaId}?${params}`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${BASE_URL}/api/resultados/personal/${selectedJugador.cuentaId}/sesiones?${params}`, { headers: { Authorization: `Bearer ${token()}` } }),
      ])
      const dataStats    = await resStats.json()
      const dataSesiones = await resSesiones.json()
      if (dataStats.success)    setResultados(dataStats.data)
      if (dataSesiones.success) setSesiones(dataSesiones.data.sesiones || [])
      await construirChartData(selectedJugador.cuentaId)
    } catch { setError("Error al cargar datos") }
    finally  { setLoadingD(false) }
  }, [selectedJugador, desde, hasta])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // ─── Chart: agrupar sesiones por mes ──────────────────────────────────────
  const construirChartData = async (cuentaId) => {
    try {
      const params = buildParams()
      const res    = await fetch(`${BASE_URL}/api/resultados/personal/${cuentaId}/sesiones?${params}`, { headers: { Authorization: `Bearer ${token()}` } })
      const data   = await res.json()
      if (!data.success) return
      const allSes = data.data.sesiones || []
      if (!allSes.length) { setChartData({}); setChartLabels([]); return }

      // Agrupar por mes
      const meses = {}
      allSes.forEach(s => {
        const d   = new Date(s.fecha)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        if (!meses[key]) meses[key] = { aleatorio: [], secuencial: [], manual: [] }
        if (meses[key][s.modo]) meses[key][s.modo].push(s.precision)
      })

      const sortedKeys = Object.keys(meses).sort()
      const labels = sortedKeys.map(k => {
        const [y, m] = k.split("-")
        return new Date(+y, +m - 1).toLocaleDateString("es-BO", { month: "short", year: "2-digit" })
      })

      const result = { aleatorio: [], secuencial: [], manual: [] }
      sortedKeys.forEach(k => {
        ;["aleatorio", "secuencial", "manual"].forEach(modo => {
          const arr = meses[k][modo]
          result[modo].push({
            precision: arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 0,
            total:     arr.length,
          })
        })
      })

      setChartData(result)
      setChartLabels(labels)
    } catch {}
  }

  // ─── Sesiones filtradas ───────────────────────────────────────────────────
  const sesionesFiltradas = sesiones
    .filter(s => modoFiltro === "todos" || s.modo === modoFiltro)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  const totalPaginas   = Math.max(1, Math.ceil(sesionesFiltradas.length / POR_PAGINA))
  const paginaSegura   = Math.min(pagina, totalPaginas)
  const sesionesPagina = sesionesFiltradas.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA)

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = (() => {
    if (!resultados) return null
    const tipos = resultados.por_tipo_reaccion || {}
    if (modoFiltro !== "todos") {
      const info = tipos[modoFiltro] || {}
      const conDatos = (chartData[modoFiltro] || []).filter(p => p.total > 0)
      const tendencia = conDatos.length >= 2
        ? conDatos[conDatos.length - 1].precision - conDatos[conDatos.length - 2].precision : null
      return { precision: info.precision ?? 0, mejorModo: modoFiltro, mejorPrec: info.precision ?? 0, tendencia, totalReacciones: info.total_realizadas ?? 0 }
    }
    const tg = resultados.totales_generales || {}
    let mejorModo = null, mejorPrec = -1
    Object.entries(tipos).forEach(([modo, info]) => {
      if ((info.total_realizadas || 0) > 0 && info.precision > mejorPrec) { mejorPrec = info.precision; mejorModo = modo }
    })
    const allConDatos = [
      ...(chartData.aleatorio || []), ...(chartData.secuencial || []), ...(chartData.manual || [])
    ].filter(p => p.total > 0)
    const tendencia = allConDatos.length >= 2
      ? allConDatos[allConDatos.length - 1].precision - allConDatos[allConDatos.length - 2].precision : null
    return { precision: tg.precision ?? 0, mejorModo, mejorPrec, tendencia, totalReacciones: tg.total_reacciones ?? 0 }
  })()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ════ HEADER ════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800 leading-none">Resultados</h1>
                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">Sistema de Reacción</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setShowSidebar(v => !v)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-all">
                <User className="w-3.5 h-3.5" />
                <span className="max-w-[80px] truncate">{selectedJugador ? selectedJugador.nombres.split(" ")[0] : "Jugadoras"}</span>
                <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${showSidebar ? "rotate-90" : ""}`} />
              </button>
              {selectedJugador && (
                <button onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-all">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exportar PDF</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="pb-3 flex flex-wrap gap-2 items-center">
            <DateRangePicker
              desde={desde} hasta={hasta}
              onDesde={setDesde} onHasta={setHasta}
              onLimpiar={() => { setDesde(""); setHasta("") }}
            />
            <PillGroup
              options={MODOS}
              value={modoFiltro}
              onChange={setModoFiltro}
              getLabel={m => m.charAt(0).toUpperCase() + m.slice(1)}
            />
          </div>

          {/* Indicador de filtros */}
          {(modoFiltro !== "todos" || desde || hasta) && (
            <div className="pb-2 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Filtros activos:</span>
              {(desde || hasta) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200">
                  {desde ? formatFecha(desde) : "Inicio"} → {hasta ? formatFecha(hasta) : "Hoy"}
                </span>
              )}
              {modoFiltro !== "todos" && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${MODO_COLORS[modoFiltro]?.bg} ${MODO_COLORS[modoFiltro]?.text} ${MODO_COLORS[modoFiltro]?.border}`}>
                  Modo: {modoFiltro}
                </span>
              )}
              <button onClick={() => { setDesde(""); setHasta(""); setModoFiltro("todos") }}
                className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-1 transition-colors">
                Limpiar todo
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ════ PANEL JUGADORAS MÓVIL ════ */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${showSidebar ? "max-h-[600px]" : "max-h-0"}`}>
        <div className="bg-white border-b border-slate-200 px-4 py-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Jugadoras</p>
          {loadingJugadores
            ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
            : jugadores.map(j => (
              <button key={j.id} onClick={() => { setSelected(j); setShowSidebar(false) }}
                className={`w-full text-left rounded-2xl border p-3 flex items-center gap-3 transition-all ${
                  selectedJugador?.id === j.id ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}>
                <div className="w-9 h-9 rounded-xl bg-slate-200 flex-shrink-0 overflow-hidden">
                  {j.path ? <img src={j.path} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                    : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-slate-400" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{j.nombres} {j.apellidos}</p>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border inline-block mt-0.5 ${POS_COLORS[j.posicion_principal] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
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
          <div className="sticky top-[130px] space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-3">Jugadoras</p>
            {loadingJugadores
              ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              : jugadores.map(j => (
                <button key={j.id} onClick={() => setSelected(j)}
                  className={`w-full text-left rounded-2xl border transition-all p-3 flex items-center gap-3 ${
                    selectedJugador?.id === j.id
                      ? "bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                    {j.path ? <img src={j.path} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                      : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-slate-400" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate leading-tight">{j.nombres} {j.apellidos}</p>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border inline-block mt-0.5 ${POS_COLORS[j.posicion_principal] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
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
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
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
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-200 flex-shrink-0">
                  {selectedJugador.path
                    ? <img src={selectedJugador.path} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                    : <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-slate-400" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-xl font-black text-slate-800 tracking-tight truncate">
                      {selectedJugador.nombres} {selectedJugador.apellidos}
                    </h2>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border flex-shrink-0 ${POS_COLORS[selectedJugador.posicion_principal] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {selectedJugador.posicion_principal}
                    </span>
                    {modoFiltro !== "todos" && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border flex-shrink-0 ${MODO_COLORS[modoFiltro]?.bg} ${MODO_COLORS[modoFiltro]?.text} ${MODO_COLORS[modoFiltro]?.border}`}>
                        {modoFiltro}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <BarChart2 className="w-3 h-3" />
                      {sesionesFiltradas.length} sesión{sesionesFiltradas.length !== 1 ? "es" : ""}
                    </span>
                    {sesionesFiltradas.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
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
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent pointer-events-none" />
                    <div className="relative flex sm:block items-center gap-4">
                      <div className="flex items-center justify-between mb-0 sm:mb-3 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          % Aciertos {modoFiltro !== "todos" ? `(${modoFiltro})` : "general"}
                        </p>
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-indigo-600" />
                        </div>
                      </div>
                      <div>
                        <p className={`text-3xl sm:text-4xl font-black tracking-tight ${precisionColor(kpis.precision)}`}>
                          {kpis.precision.toFixed(1)}<span className="text-xl text-slate-400">%</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{kpis.totalReacciones} sesiones</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent pointer-events-none" />
                    <div className="relative flex sm:block items-center gap-4">
                      <div className="flex items-center justify-between mb-0 sm:mb-3 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {modoFiltro !== "todos" ? "Modo seleccionado" : "Mejor modo"}
                        </p>
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                      {kpis.mejorModo ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${MODO_COLORS[kpis.mejorModo]?.dot}`} />
                            <p className="text-xl sm:text-2xl font-black capitalize text-slate-800">{kpis.mejorModo}</p>
                          </div>
                          <p className="text-emerald-600 font-bold text-base sm:text-lg mt-0.5">{kpis.mejorPrec.toFixed(1)}%</p>
                        </div>
                      ) : <p className="text-slate-400 text-sm">Sin datos</p>}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-transparent pointer-events-none" />
                    <div className="relative flex sm:block items-center gap-4">
                      <div className="flex items-center justify-between mb-0 sm:mb-3 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tendencia</p>
                        <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-4 h-4 text-sky-600" />
                        </div>
                      </div>
                      {kpis.tendencia !== null ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            {kpis.tendencia > 0
                              ? <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                              : kpis.tendencia < 0
                                ? <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0" />
                                : <Minus className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                            <p className={`text-2xl sm:text-3xl font-black ${kpis.tendencia > 0 ? "text-emerald-600" : kpis.tendencia < 0 ? "text-red-500" : "text-slate-400"}`}>
                              {kpis.tendencia > 0 ? "+" : ""}{kpis.tendencia.toFixed(1)}%
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">vs período anterior</p>
                        </div>
                      ) : <p className="text-slate-400 text-sm">Sin datos suficientes</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── C: Gráfico de evolución ── */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Evolución – % aciertos
                      {modoFiltro !== "todos" ? ` · ${modoFiltro}` : " por modo"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Agrupado por mes · solo períodos con sesiones reales</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {(modoFiltro === "todos" ? ["aleatorio", "secuencial", "manual"] : [modoFiltro]).map(m => (
                      <div key={m} className="flex items-center gap-1.5">
                        <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: MODO_COLORS[m].line }} />
                        <span className="text-[10px] sm:text-xs text-slate-500 capitalize">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {chartLabels.length > 0 ? (
                  <div className="h-72 sm:h-96">
                    <LineChart
                      data={
                        modoFiltro !== "todos"
                          ? { aleatorio: [], secuencial: [], manual: [], [modoFiltro]: chartData[modoFiltro] || [] }
                          : chartData
                      }
                      labels={chartLabels}
                    />
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sin datos</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── D: Historial ── */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <List className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Historial{modoFiltro !== "todos" ? ` · ${modoFiltro}` : ""}
                  </h3>
                  <span className="ml-auto text-xs text-slate-400 flex-shrink-0">
                    {sesionesFiltradas.length} registro{sesionesFiltradas.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {sesionesPagina.length > 0 ? (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            {["Semana", "Día", "Fecha", "Modo", "Intentos", "Aciertos", "Fallos", "% Aciertos"].map(h => (
                              <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sesionesPagina.map((s, i) => {
                            const prec = s.precision ?? (
                              (s.aciertos || 0) + (s.errores || 0) > 0
                                ? ((s.aciertos || 0) / ((s.aciertos || 0) + (s.errores || 0))) * 100 : 0
                            )
                            const d = new Date(s.fecha)
                            const c = MODO_COLORS[s.modo]
                            return (
                              <tr key={s.id ?? i} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                                <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                                  Sem {Math.ceil(d.getDate() / 7)} {d.toLocaleString("es-BO", { month: "short" })}
                                </td>
                                <td className="px-5 py-3.5 text-slate-400 text-xs">{d.getDate()}</td>
                                <td className="px-5 py-3.5 text-slate-600 text-xs font-medium whitespace-nowrap">{formatFecha(s.fecha)}</td>
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${c?.bg || "bg-slate-100"} ${c?.text || "text-slate-600"} ${c?.border || "border-slate-200"}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${c?.dot || "bg-slate-400"}`} />{s.modo}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-slate-600 text-xs font-mono">{s.intentos ?? (s.aciertos || 0) + (s.errores || 0)}</td>
                                <td className="px-5 py-3.5 text-emerald-600 text-xs font-mono font-bold">{s.aciertos || 0}</td>
                                <td className="px-5 py-3.5 text-red-500 text-xs font-mono">{s.errores || 0}</td>
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
                    <div className="md:hidden divide-y divide-slate-100">
                      {sesionesPagina.map((s, i) => {
                        const prec = s.precision ?? (
                          (s.aciertos || 0) + (s.errores || 0) > 0
                            ? ((s.aciertos || 0) / ((s.aciertos || 0) + (s.errores || 0))) * 100 : 0
                        )
                        const c = MODO_COLORS[s.modo]
                        return (
                          <div key={s.id ?? i} className="px-4 py-3.5 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c?.dot || "bg-slate-400"}`} />
                                <span className={`text-[10px] font-bold uppercase ${c?.text || "text-slate-500"}`}>{s.modo}</span>
                                <span className="text-[10px] text-slate-400 ml-auto">{formatFechaCorta(s.fecha)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="text-emerald-600 font-bold">{s.aciertos || 0}</span>
                                <span>aciertos</span>
                                <span className="text-slate-300">·</span>
                                <span className="text-red-500">{s.errores || 0}</span>
                                <span>fallos</span>
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
                  <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                    <List className="w-7 h-7 opacity-30" />
                    <p className="text-sm">No hay sesiones para este período{modoFiltro !== "todos" ? ` en modo ${modoFiltro}` : ""}</p>
                  </div>
                )}

                <Paginador pagina={paginaSegura} totalPaginas={totalPaginas} totalItems={sesionesFiltradas.length} onChange={setPagina} />
              </div>

              {/* ── E: Detalle por tipo ── */}
              {resultados?.por_tipo_reaccion && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {(modoFiltro !== "todos" ? [modoFiltro] : ["aleatorio", "secuencial", "manual"]).map(modo => {
                    const info      = resultados.por_tipo_reaccion[modo] || {}
                    const c         = MODO_COLORS[modo]
                    const sparkVals = (chartData[modo] || []).map(p => p.precision)
                    return (
                      <div key={modo} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className="text-sm font-bold capitalize text-slate-800">{modo}</span>
                          </div>
                          <Sparkline values={sparkVals} color={c.line} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Sesiones",  val: info.total_realizadas ?? 0, cls: "text-slate-800" },
                            { label: "Precisión", val: `${(info.precision ?? 0).toFixed(1)}%`, cls: precisionColor(info.precision ?? 0) },
                            { label: "Aciertos",  val: info.total_aciertos ?? 0, cls: "text-emerald-600" },
                            { label: "Errores",   val: info.total_errores  ?? 0, cls: "text-red-500" },
                          ].map(({ label, val, cls }) => (
                            <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                              <p className="text-[10px] text-slate-400 mb-1">{label}</p>
                              <p className={`font-black text-base ${cls}`}>{val}</p>
                            </div>
                          ))}
                        </div>
                        {info.mejor_reaccion && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Mejor sesión</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">{formatFechaCorta(info.mejor_reaccion?.fecha)}</span>
                              <span className="text-xs font-black text-emerald-600">{(info.mejor_reaccion?.precision ?? 0).toFixed(1)}%</span>
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
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,900&display=swap');
        .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }
        @media print {
          header { position: static !important; }
          aside, .lg\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}