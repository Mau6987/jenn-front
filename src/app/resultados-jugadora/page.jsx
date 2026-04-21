"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  TrendingUp, TrendingDown, Minus, Download,
  Activity, Target, Zap, User, Calendar, BarChart2, List,
  AlertCircle, Loader2, ChevronRight, ChevronLeft, X, Eye, EyeOff,
} from "lucide-react"

const BASE_URL = "https://jenn-back-reac.onrender.com"
const MODOS_FILTRO = ["todos", "aleatorio", "secuencial", "manual"]
const MODOS_CHART  = ["aleatorio", "secuencial", "manual"]
const POR_PAGINA   = 15

const MODO_COLORS = {
  aleatorio:  { line: "#6366f1", bg: "bg-indigo-100",   text: "text-indigo-700",  dot: "bg-indigo-500",  border: "border-indigo-200", hex: "#6366f1" },
  secuencial: { line: "#f59e0b", bg: "bg-amber-100",    text: "text-amber-700",   dot: "bg-amber-500",   border: "border-amber-200",  hex: "#f59e0b" },
  manual:     { line: "#10b981", bg: "bg-emerald-100",  text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200", hex: "#10b981" },
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

function agruparEnSemanas(sesiones) {
  if (!sesiones.length) return []
  const semSet = new Set()
  sesiones.forEach(s => {
    const d = new Date(s.fecha)
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
    const lunes = new Date(d)
    lunes.setDate(d.getDate() - dow)
    lunes.setHours(0, 0, 0, 0)
    semSet.add(lunes.toISOString().slice(0, 10))
  })
  const semanas = Array.from(semSet).sort()
  return semanas.map((lunesISO, idx) => {
    const lunes   = new Date(lunesISO)
    const domingo = new Date(lunes)
    domingo.setDate(lunes.getDate() + 6)
    const mes = lunes.toLocaleDateString("es-BO", { month: "short", year: "2-digit" })
    return { idx, desde: lunesISO, hasta: domingo.toISOString().slice(0, 10), label: `S${idx + 1}`, mes, lunes }
  })
}

function agruparPorMes(semanas) {
  const grupos = []
  let actual = null
  semanas.forEach((sem, i) => {
    if (!actual || sem.mes !== actual.mes) {
      actual = { mes: sem.mes, inicio: i, fin: i }
      grupos.push(actual)
    } else { actual.fin = i }
  })
  return grupos
}

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

const LineChart = ({ sesiones, modosVisibles }) => {
  const W = 1000, H = 420
  const PAD = { t: 48, r: 48, b: 96, l: 68 }
  const IW = W - PAD.l - PAD.r
  const IH = H - PAD.t - PAD.b

  const semanas = useMemo(() => agruparEnSemanas(sesiones), [sesiones])
  const grupos  = useMemo(() => agruparPorMes(semanas), [semanas])
  const n = semanas.length

  const chartData = useMemo(() => {
    const result = {}
    MODOS_CHART.forEach(modo => {
      result[modo] = semanas.map(sem => {
        const enSem = sesiones.filter(s => {
          const f = s.fecha.slice(0, 10)
          return s.modo === modo && f >= sem.desde && f <= sem.hasta
        })
        if (!enSem.length) return { precision: 0, total: 0 }
        const totalA = enSem.reduce((s, r) => s + (r.aciertos || 0), 0)
        const totalI = enSem.reduce((s, r) => s + (r.intentos || (r.aciertos || 0) + (r.errores || 0)), 0)
        return { precision: totalI > 0 ? +((totalA / totalI) * 100).toFixed(1) : 0, total: enSem.length }
      })
    })
    return result
  }, [sesiones, semanas])

  const allValues = useMemo(() => {
    const vals = []
    MODOS_CHART.forEach(modo => {
      if (!modosVisibles[modo]) return
      ;(chartData[modo] || []).forEach(p => { if (p.total > 0) vals.push(p.precision) })
    })
    return vals
  }, [chartData, modosVisibles])

  const yMin = allValues.length > 0 ? Math.max(0, Math.floor((Math.min(...allValues) - 5) / 5) * 5) : 0
  const yMax = allValues.length > 0 ? Math.min(100, Math.ceil((Math.max(...allValues) + 5) / 5) * 5) : 100
  const yRange = yMax - yMin || 1

  const yTicks = useMemo(() => {
    const step = yRange <= 30 ? 5 : 10
    const ticks = []
    for (let v = yMin; v <= yMax; v += step) ticks.push(v)
    if (ticks[ticks.length - 1] !== yMax) ticks.push(yMax)
    return ticks
  }, [yMin, yMax, yRange])

  const xOf = (i) => n === 1 ? PAD.l + IW / 2 : PAD.l + (i / (n - 1)) * IW
  const yOf = (v) => PAD.t + IH - ((v - yMin) / yRange) * IH

  if (n === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="14" fill="#94a3b8" fontFamily="inherit">
          Sin datos para este período
        </text>
      </svg>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {grupos.map((g, gi) => {
        const x1 = gi === 0 ? PAD.l : (xOf(g.inicio) + xOf(grupos[gi - 1].fin)) / 2
        const x2 = gi === grupos.length - 1 ? PAD.l + IW : (xOf(g.fin) + xOf(grupos[gi + 1]?.inicio ?? g.fin)) / 2
        return <rect key={g.mes} x={x1} y={PAD.t} width={x2 - x1} height={IH} fill={gi % 2 === 0 ? "rgba(241,245,249,0.6)" : "transparent"} />
      })}
      {grupos.slice(1).map((g) => {
        const x = n > 1 ? (xOf(g.inicio) + xOf(g.inicio - 1)) / 2 : xOf(g.inicio)
        return <line key={`sep-${g.mes}`} x1={x} y1={PAD.t - 8} x2={x} y2={PAD.t + IH} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4,3" />
      })}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={PAD.l} y1={yOf(v)} x2={PAD.l + IW} y2={yOf(v)}
            stroke={v === yMin ? "#cbd5e1" : "#e2e8f0"}
            strokeWidth={v === yMin ? 1.5 : 1}
            strokeDasharray={v === yMin ? "none" : "4,4"} />
          <text x={PAD.l - 12} y={yOf(v) + 4} textAnchor="end" fontSize="12" fill="#94a3b8" fontFamily="inherit">{v}%</text>
        </g>
      ))}
      {semanas.map((sem) => (
        <text key={sem.desde} x={xOf(sem.idx)} y={H - PAD.b + 20} textAnchor="middle" fontSize="11" fill="#94a3b8" fontFamily="inherit">
          {sem.label}
        </text>
      ))}
      {grupos.map((g) => {
        const xMid = (xOf(g.inicio) + xOf(g.fin)) / 2
        return (
          <g key={`mes-${g.mes}`}>
            <line x1={xOf(g.inicio) - 14} y1={H - PAD.b + 30} x2={xOf(g.fin) + 14} y2={H - PAD.b + 30} stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
            <text x={xMid} y={H - PAD.b + 46} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#64748b" fontFamily="inherit">{g.mes}</text>
          </g>
        )
      })}
      {MODOS_CHART.filter(m => modosVisibles[m]).map(modo => {
        const puntos = (chartData[modo] || []).map((p, i) => ({ ...p, i })).filter(p => p.total > 0)
        if (!puntos.length) return null
        const c = MODO_COLORS[modo].line
        const pathD = puntos.length >= 2
          ? puntos.map((p, j) => `${j === 0 ? "M" : "L"}${xOf(p.i).toFixed(1)},${yOf(p.precision).toFixed(1)}`).join(" ")
          : null
        return (
          <g key={modo}>
            {pathD && (() => {
              const first = puntos[0], last = puntos[puntos.length - 1]
              const area = `${pathD} L${xOf(last.i).toFixed(1)},${yOf(yMin).toFixed(1)} L${xOf(first.i).toFixed(1)},${yOf(yMin).toFixed(1)} Z`
              return <path d={area} fill={c} opacity="0.07" />
            })()}
            {pathD && <path d={pathD} fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />}
            {puntos.map(p => (
              <g key={p.i}>
                <circle cx={xOf(p.i)} cy={yOf(p.precision)} r={puntos.length === 1 ? 8 : 5} fill="white" stroke={c} strokeWidth="2.5" />
                <text x={xOf(p.i)} y={yOf(p.precision) - 12} textAnchor="middle" fontSize="11" fill={c} fontWeight="700" fontFamily="inherit">
                  {p.precision}%
                </text>
              </g>
            ))}
          </g>
        )
      })}
      <line x1={PAD.l} y1={PAD.t + IH} x2={PAD.l + IW} y2={PAD.t + IH} stroke="#cbd5e1" strokeWidth="1.5" />
    </svg>
  )
}

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

const ModoToggle = ({ modosVisibles, onToggle }) => (
  <div className="flex items-center gap-2">
    {MODOS_CHART.map(modo => {
      const c = MODO_COLORS[modo]
      const activo = modosVisibles[modo]
      return (
        <button key={modo} onClick={() => onToggle(modo)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            activo ? `${c.bg} ${c.text} ${c.border}` : "bg-slate-100 text-slate-400 border-slate-200 opacity-50"
          }`}>
          {activo ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span className="capitalize">{modo}</span>
        </button>
      )
    })}
  </div>
)

export default function ResultadosReaccion() {
  const [jugadores, setJugadores]      = useState([])
  const [selectedJugador, setSelected] = useState(null)
  const [desde, setDesde]              = useState("")
  const [hasta, setHasta]              = useState("")
  const [modoFiltro, setModoFiltro]    = useState("todos")
  const [loadingJugadores, setLoadingJ]= useState(true)
  const [loadingDatos, setLoadingD]    = useState(false)
  const [resultados, setResultados]    = useState(null)
  const [sesiones, setSesiones]        = useState([])
  const [error, setError]              = useState("")
  const [showSidebar, setShowSidebar]  = useState(false)
  const [pagina, setPagina]            = useState(1)

  const [modosVisibles, setModosVisibles] = useState({ aleatorio: true, secuencial: true, manual: true })

  const toggleModo = (modo) => {
    setModosVisibles(prev => {
      const nuevos = { ...prev, [modo]: !prev[modo] }
      if (!Object.values(nuevos).some(Boolean)) return prev
      return nuevos
    })
  }

  const token = () => typeof window !== "undefined" ? localStorage.getItem("token") : ""

  useEffect(() => { setPagina(1) }, [modoFiltro, desde, hasta, selectedJugador])

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

  const buildParams = useCallback(() => {
    const params = new URLSearchParams()
    if (desde) { params.set("desde", desde); if (hasta) params.set("hasta", hasta) }
    else params.set("periodo", "general")
    return params
  }, [desde, hasta])

  const cargarDatos = useCallback(async () => {
    if (!selectedJugador) return
    setLoadingD(true); setError("")
    try {
      const params = buildParams()
      const [resStats, resSesiones] = await Promise.all([
        fetch(`${BASE_URL}/api/resultados/personal/${selectedJugador.cuentaId}?${params}`,
          { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${BASE_URL}/api/resultados/personal/${selectedJugador.cuentaId}/sesiones?periodo=general`,
          { headers: { Authorization: `Bearer ${token()}` } }),
      ])
      const dataStats    = await resStats.json()
      const dataSesiones = await resSesiones.json()
      if (dataStats.success)    setResultados(dataStats.data)
      if (dataSesiones.success) setSesiones(dataSesiones.data.sesiones || [])
    } catch { setError("Error al cargar datos") }
    finally  { setLoadingD(false) }
  }, [selectedJugador, desde, hasta])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const sesionesParaGrafico = useMemo(() => {
    if (modoFiltro === "todos") return sesiones
    return sesiones.filter(s => s.modo === modoFiltro)
  }, [sesiones, modoFiltro])

  const sesionesFiltradas = useMemo(() =>
    sesiones.filter(s => {
      if (modoFiltro !== "todos" && s.modo !== modoFiltro) return false
      if (desde) { const f = s.fecha?.slice(0, 10) ?? ""; if (f < desde) return false }
      if (hasta) { const f = s.fecha?.slice(0, 10) ?? ""; if (f > hasta) return false }
      return true
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  , [sesiones, modoFiltro, desde, hasta])

  const totalPaginas   = Math.max(1, Math.ceil(sesionesFiltradas.length / POR_PAGINA))
  const paginaSegura   = Math.min(pagina, totalPaginas)
  const sesionesPagina = sesionesFiltradas.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA)

  const kpis = useMemo(() => {
    if (!resultados) return null
    const tipos = resultados.por_tipo_reaccion || {}
    if (modoFiltro !== "todos") {
      const info = tipos[modoFiltro] || {}
      const semanas = agruparEnSemanas(sesionesParaGrafico)
      const ultimas2 = semanas.slice(-2)
      let tendencia = null
      if (ultimas2.length === 2) {
        const calcPrec = (sem) => {
          const en = sesionesParaGrafico.filter(s => { const f = s.fecha.slice(0, 10); return s.modo === modoFiltro && f >= sem.desde && f <= sem.hasta })
          if (!en.length) return 0
          const tA = en.reduce((a, r) => a + (r.aciertos || 0), 0)
          const tI = en.reduce((a, r) => a + (r.intentos || (r.aciertos || 0) + (r.errores || 0)), 0)
          return tI > 0 ? (tA / tI) * 100 : 0
        }
        tendencia = calcPrec(ultimas2[1]) - calcPrec(ultimas2[0])
      }
      return { precision: info.precision ?? 0, mejorModo: modoFiltro, mejorPrec: info.precision ?? 0, tendencia, totalReacciones: info.total_realizadas ?? 0 }
    }
    const tg = resultados.totales_generales || {}
    let mejorModo = null, mejorPrec = -1
    Object.entries(tipos).forEach(([modo, info]) => {
      if ((info.total_realizadas || 0) > 0 && info.precision > mejorPrec) { mejorPrec = info.precision; mejorModo = modo }
    })
    const semanas = agruparEnSemanas(sesiones)
    const ultimas2 = semanas.slice(-2)
    let tendencia = null
    if (ultimas2.length === 2) {
      const calcPrec = (sem) => {
        const en = sesiones.filter(s => { const f = s.fecha.slice(0, 10); return f >= sem.desde && f <= sem.hasta })
        if (!en.length) return 0
        const tA = en.reduce((a, r) => a + (r.aciertos || 0), 0)
        const tI = en.reduce((a, r) => a + (r.intentos || (r.aciertos || 0) + (r.errores || 0)), 0)
        return tI > 0 ? (tA / tI) * 100 : 0
      }
      tendencia = calcPrec(ultimas2[1]) - calcPrec(ultimas2[0])
    }
    return { precision: tg.precision ?? 0, mejorModo, mejorPrec, tendencia, totalReacciones: tg.total_reacciones ?? 0 }
  }, [resultados, modoFiltro, sesiones, sesionesParaGrafico])

  const sparkData = useMemo(() => {
    const semanas = agruparEnSemanas(sesiones)
    const result  = {}
    MODOS_CHART.forEach(modo => {
      result[modo] = semanas.map(sem => {
        const en = sesiones.filter(s => { const f = s.fecha.slice(0, 10); return s.modo === modo && f >= sem.desde && f <= sem.hasta })
        if (!en.length) return 0
        const tA = en.reduce((a, r) => a + (r.aciertos || 0), 0)
        const tI = en.reduce((a, r) => a + (r.intentos || (r.aciertos || 0) + (r.errores || 0)), 0)
        return tI > 0 ? +((tA / tI) * 100).toFixed(1) : 0
      })
    })
    return result
  }, [sesiones])

  const modosVisiblesEfectivos = useMemo(() => {
    if (modoFiltro !== "todos") return { aleatorio: false, secuencial: false, manual: false, [modoFiltro]: true }
    return modosVisibles
  }, [modoFiltro, modosVisibles])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {selectedJugador && (
        <div className="print-only-header" style={{ display: "none" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10pt", marginBottom:"12pt", borderBottom:"2pt solid #6366f1", paddingBottom:"8pt" }}>
            <div style={{ width:"32pt", height:"32pt", background:"#6366f1", borderRadius:"6pt", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ color:"white", fontSize:"14pt", fontWeight:"900" }}>R</span>
            </div>
            <div>
              <div style={{ fontSize:"13pt", fontWeight:"900", color:"#1e293b" }}>Resultados · Sistema de Reacción</div>
              <div style={{ fontSize:"8pt", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em" }}>Tech Volley UNV</div>
            </div>
            <div style={{ marginLeft:"auto", fontSize:"8pt", color:"#94a3b8" }}>
              Generado: {new Date().toLocaleDateString("es-BO", { day:"2-digit", month:"long", year:"numeric" })}
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm print-hide-nav">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
          <div className="pb-3 flex flex-wrap gap-2 items-center">
            <DateRangePicker desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} onLimpiar={() => { setDesde(""); setHasta("") }} />
            <PillGroup options={MODOS_FILTRO} value={modoFiltro} onChange={setModoFiltro} getLabel={m => m.charAt(0).toUpperCase() + m.slice(1)} />
          </div>
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

      <div className={`lg:hidden print-hide-nav overflow-hidden transition-all duration-300 ${showSidebar ? "max-h-[600px]" : "max-h-0"}`}>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex gap-5">
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="sticky top-[130px] space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-3">Jugadoras</p>
            {loadingJugadores
              ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              : jugadores.map(j => (
                <button key={j.id} onClick={() => setSelected(j)}
                  className={`w-full text-left rounded-2xl border transition-all p-3 flex items-center gap-3 ${
                    selectedJugador?.id === j.id ? "bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
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

        <main className="flex-1 min-w-0 space-y-4">
          {!selectedJugador ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center"><User className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm font-semibold">Selecciona una jugadora</p></div>
            </div>
          ) : loadingDatos ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-indigo-500" /></div>
          ) : (
            <>
              {/* A: Header jugadora */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-200 flex-shrink-0">
                  {selectedJugador.path ? <img src={selectedJugador.path} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                    : <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-slate-400" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-xl font-black text-slate-800 tracking-tight truncate">{selectedJugador.nombres} {selectedJugador.apellidos}</h2>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border flex-shrink-0 ${POS_COLORS[selectedJugador.posicion_principal] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {selectedJugador.posicion_principal}
                    </span>
                    {modoFiltro !== "todos" && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border flex-shrink-0 ${MODO_COLORS[modoFiltro]?.bg} ${MODO_COLORS[modoFiltro]?.text} ${MODO_COLORS[modoFiltro]?.border}`}>{modoFiltro}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-400"><BarChart2 className="w-3 h-3" />{sesionesFiltradas.length} sesión{sesionesFiltradas.length !== 1 ? "es" : ""}</span>
                    {sesionesFiltradas.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-400"><Calendar className="w-3 h-3" />Última: {formatFechaCorta(sesionesFiltradas[0]?.fecha)}</span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-400"><Activity className="w-3 h-3" />{sesiones.length} total histórico</span>
                  </div>
                </div>
              </div>

              {/* B: KPIs */}
              {kpis && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent pointer-events-none" />
                    <div className="relative flex sm:block items-center gap-4">
                      <div className="flex items-center justify-between mb-0 sm:mb-3 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">% Aciertos {modoFiltro !== "todos" ? `(${modoFiltro})` : "general"}</p>
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0"><Target className="w-4 h-4 text-indigo-600" /></div>
                      </div>
                      <div>
                        <p className={`text-3xl sm:text-4xl font-black tracking-tight ${precisionColor(kpis.precision)}`}>{kpis.precision.toFixed(1)}<span className="text-xl text-slate-400">%</span></p>
                        <p className="text-xs text-slate-400 mt-0.5">{kpis.totalReacciones} sesiones</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent pointer-events-none" />
                    <div className="relative flex sm:block items-center gap-4">
                      <div className="flex items-center justify-between mb-0 sm:mb-3 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{modoFiltro !== "todos" ? "Modo seleccionado" : "Mejor modo"}</p>
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0"><Zap className="w-4 h-4 text-emerald-600" /></div>
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
                        <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-4 h-4 text-sky-600" /></div>
                      </div>
                      {kpis.tendencia !== null ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            {kpis.tendencia > 0 ? <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : kpis.tendencia < 0 ? <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0" /> : <Minus className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                            <p className={`text-2xl sm:text-3xl font-black ${kpis.tendencia > 0 ? "text-emerald-600" : kpis.tendencia < 0 ? "text-red-500" : "text-slate-400"}`}>
                              {kpis.tendencia > 0 ? "+" : ""}{kpis.tendencia.toFixed(1)}%
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">vs semana anterior</p>
                        </div>
                      ) : <p className="text-slate-400 text-sm">Sin datos suficientes</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* C: Gráfico — título actualizado, sin subtextos */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col gap-3 mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 justify-between">
                    <div>
                      {/* ── Título actualizado: sin "—", sin subtextos ── */}
                      <h3 className="text-sm font-bold text-slate-800">
                        Evolución de % aciertos
                        {modoFiltro !== "todos" ? ` · ${modoFiltro}` : " por modo"}
                      </h3>
                    </div>
                    {modoFiltro === "todos" && (
                      <ModoToggle modosVisibles={modosVisibles} onToggle={toggleModo} />
                    )}
                  </div>
                  {/* Subtextos eliminados */}
                </div>
                <div className="h-[22rem] sm:h-[28rem]">
                  <LineChart sesiones={sesionesParaGrafico} modosVisibles={modosVisiblesEfectivos} />
                </div>
              </div>

              {/* D: Historial */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <List className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <h3 className="text-sm font-bold text-slate-800">Historial{modoFiltro !== "todos" ? ` · ${modoFiltro}` : ""}{(desde || hasta) ? " · filtrado" : ""}</h3>
                  <span className="ml-auto text-xs text-slate-400 flex-shrink-0">{sesionesFiltradas.length} registro{sesionesFiltradas.length !== 1 ? "s" : ""}</span>
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
                            const prec = s.precision ?? ((s.aciertos || 0) + (s.errores || 0) > 0 ? ((s.aciertos || 0) / ((s.aciertos || 0) + (s.errores || 0))) * 100 : 0)
                            const d = new Date(s.fecha)
                            const c = MODO_COLORS[s.modo]
                            return (
                              <tr key={s.id ?? i} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                                <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">Sem {Math.ceil(d.getDate() / 7)} {d.toLocaleString("es-BO", { month: "short" })}</td>
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
                                <td className="px-5 py-3.5"><span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${precisionBg(prec)}`}>{prec.toFixed(1)}%</span></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="md:hidden divide-y divide-slate-100">
                      {sesionesPagina.map((s, i) => {
                        const prec = s.precision ?? ((s.aciertos || 0) + (s.errores || 0) > 0 ? ((s.aciertos || 0) / ((s.aciertos || 0) + (s.errores || 0))) * 100 : 0)
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
                                <span className="text-emerald-600 font-bold">{s.aciertos || 0}</span><span>aciertos</span>
                                <span className="text-slate-300">·</span>
                                <span className="text-red-500">{s.errores || 0}</span><span>fallos</span>
                              </div>
                            </div>
                            <span className={`text-sm font-black px-2.5 py-1 rounded-xl border flex-shrink-0 ${precisionBg(prec)}`}>{prec.toFixed(1)}%</span>
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

              {/* E: Detalle por tipo */}
              {resultados?.por_tipo_reaccion && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {(modoFiltro !== "todos" ? [modoFiltro] : MODOS_CHART).map(modo => {
                    const info = resultados.por_tipo_reaccion[modo] || {}
                    const c    = MODO_COLORS[modo]
                    return (
                      <div key={modo} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className="text-sm font-bold capitalize text-slate-800">{modo}</span>
                          </div>
                          <Sparkline values={sparkData[modo] || []} color={c.line} />
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
          @page { size: A4 portrait; margin: 14mm 12mm 14mm 12mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-only-header { display: block !important; }
          nav, body > header, [class*="navbar"], [class*="nav-bar"],
          [id*="navbar"], [id*="nav-bar"], .print-hide-nav,
          .lg\\:hidden { display: none !important; }
          body, html { background: white !important; }
          .min-h-screen { min-height: unset !important; background: white !important; }
          .bg-slate-50 { background: white !important; }
          .max-w-6xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .flex.gap-5 { display: block !important; }
          aside { display: none !important; }
          main { width: 100% !important; min-width: 0 !important; }
          .py-5 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .space-y-4 > * + * { margin-top: 8pt !important; }
          .rounded-2xl { break-inside: avoid !important; page-break-inside: avoid !important; border: 1px solid #e2e8f0 !important; box-shadow: none !important; margin-bottom: 8pt !important; background: white !important; }
          .absolute.inset-0 { display: none !important; }
          .shadow-sm { box-shadow: none !important; }
          .grid { display: grid !important; }
          .sm\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr) !important; gap: 6pt !important; }
          .h-\\[22rem\\], .h-\\[28rem\\], .sm\\:h-\\[28rem\\] { height: 200pt !important; width: 100% !important; overflow: visible !important; }
          svg { overflow: visible !important; }
          .hidden.md\\:block { display: block !important; }
          .md\\:hidden { display: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; font-size: 7.5pt !important; }
          th { font-size: 6.5pt !important; padding: 4pt 5pt !important; background: #f8fafc !important; }
          td { padding: 4pt 5pt !important; }
          thead { display: table-header-group !important; }
          tr { break-inside: avoid !important; }
          .bg-slate-50\\/50 { display: none !important; }
          .backdrop-blur-md { backdrop-filter: none !important; }
          .bg-white\\/95 { background: white !important; }
          body { font-size: 9pt !important; color: #1e293b !important; }
        }
      `}</style>
    </div>
  )
}