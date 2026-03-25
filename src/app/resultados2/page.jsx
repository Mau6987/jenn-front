"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

const T = {
  accent:   "#1d4ed8",
  text:     "#0f172a",
  muted:    "#64748b",
  mutedSoft:"#94a3b8",
  border:   "#e2e8f0",
  bg:       "#ffffff",
  pageBg:   "#f8fafc",
  aciertos: "#16a34a",
  errores:  "#dc2626",
  shadow:   "0 4px 24px rgba(15,23,42,0.07)",
  shadowSm: "0 1px 6px rgba(15,23,42,0.05)",
}

const TIPOS = [
  { key: "aleatorio",  label: "Aleatorio",  color: "#0891b2" },
  { key: "secuencial", label: "Secuencial", color: "#7c3aed" },
  { key: "manual",     label: "Manual",     color: "#d97706" },
]

// ─── Animated number ──────────────────────────────────────────────────────────
function AnimatedNumber({ value = 0, duration = 550 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const to = Number(value) || 0
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, duration])
  return <span ref={ref}>0</span>
}

// ─── Mini progress bar ────────────────────────────────────────────────────────
function MiniBar({ aciertos = 0, errores = 0 }) {
  const total = (aciertos + errores) || 1
  const aPct  = (aciertos / total) * 100
  const ePct  = (errores  / total) * 100
  return (
    <div className="relative w-full h-1.5 rounded-full overflow-hidden mt-4"
      style={{ background: T.border }}>
      <motion.div className="absolute left-0 top-0 h-full rounded-full"
        style={{ backgroundColor: T.aciertos }}
        initial={{ width: 0 }} animate={{ width: `${aPct}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }} />
      <motion.div className="absolute right-0 top-0 h-full rounded-full"
        style={{ backgroundColor: T.errores }}
        initial={{ width: 0 }} animate={{ width: `${ePct}%` }}
        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }} />
    </div>
  )
}

// ─── Session card ─────────────────────────────────────────────────────────────
function SessionCard({ title, data, delay = 0 }) {
  const intentos = data?.intentos ?? ((data?.aciertos || 0) + (data?.errores || 0))

  const rows = [
    { label: "Aciertos", val: data?.aciertos || 0, color: T.aciertos, icon: "✓" },
    { label: "Fallos",   val: data?.errores  || 0, color: T.errores,  icon: "✗" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 rounded-2xl p-5 flex flex-col min-w-0"
      style={{
        background: T.bg,
        border: `1.5px solid ${T.border}`,
        boxShadow: T.shadowSm,
      }}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest mb-5"
        style={{ color: T.mutedSoft }}>
        {title}
      </p>

      {!data ? (
        <p className="text-sm" style={{ color: T.mutedSoft }}>Sin datos en este periodo</p>
      ) : (
        <>
          <div className="space-y-3 flex-1">
            {rows.map(({ label, val, color, icon }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm" style={{ color: T.muted }}>
                  <span className="text-[13px]" style={{ color }}>{icon}</span>
                  {label}
                </span>
                <span className="text-sm font-semibold tabular-nums" style={{ color }}>
                  <AnimatedNumber value={val} />
                </span>
              </div>
            ))}
          </div>

          <MiniBar aciertos={data.aciertos} errores={data.errores} />

          {data.fecha && (
            <p className="text-[11px] mt-3 text-right" style={{ color: T.mutedSoft }}>
              {new Date(data.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          )}
        </>
      )}
    </motion.div>
  )
}

// ─── Date range filter ────────────────────────────────────────────────────────
function DateRangeFilter({ desde, hasta, onChange }) {
  const [open,   setOpen]   = useState(false)
  const [localD, setLocalD] = useState(desde || "")
  const [localH, setLocalH] = useState(hasta || "")

  function off(days) {
    const d = new Date(); d.setDate(d.getDate() + days)
    return d.toISOString().split("T")[0]
  }

  const presets = [
    { label: "Todos los tiempos", d: "",       h: "" },
    { label: "Última semana",     d: off(-7),  h: "" },
    { label: "Último mes",        d: off(-30), h: "" },
    { label: "Últimos 3 meses",   d: off(-90), h: "" },
  ]

  const label = () => {
    if (!localD && !localH) return "Filtrar por fecha"
    const fmt = (s) => s
      ? new Date(s + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
      : "hoy"
    return `${fmt(localD)} – ${fmt(localH)}`
  }

  return (
    <div className="relative" style={{ userSelect: "none" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors"
        style={{
          border: `1.5px solid ${T.border}`,
          background: T.bg,
          color: T.muted,
          boxShadow: T.shadowSm,
          minWidth: 190,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="flex-1 text-left text-[13px]">{label()}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute z-50 top-full mt-2 left-0 rounded-2xl overflow-hidden"
            style={{
              background: T.bg,
              border: `1.5px solid ${T.border}`,
              boxShadow: "0 12px 36px rgba(15,23,42,0.12)",
              minWidth: 270,
            }}
          >
            <div className="py-1.5">
              {presets.map((p) => (
                <button key={p.label}
                  onClick={() => { setLocalD(p.d); setLocalH(p.h); onChange(p.d, p.h); setOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-50"
                  style={{ color: T.text }}>
                  {p.label}
                </button>
              ))}
            </div>

            <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: T.border }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.mutedSoft }}>
                Rango personalizado
              </p>
              <div className="flex gap-3">
                {[
                  { label: "Desde", val: localD, set: setLocalD },
                  { label: "Hasta", val: localH, set: setLocalH },
                ].map(({ label, val, set }) => (
                  <div key={label} className="flex-1">
                    <p className="text-[11px] mb-1" style={{ color: T.mutedSoft }}>{label}</p>
                    <input type="date" value={val} onChange={(e) => set(e.target.value)}
                      className="w-full rounded-xl px-3 py-1.5 text-[13px] outline-none"
                      style={{ border: `1.5px solid ${T.border}`, color: T.text }} />
                  </div>
                ))}
              </div>
              <button onClick={() => { onChange(localD, localH); setOpen(false) }}
                className="w-full rounded-xl py-2 text-sm font-semibold text-white"
                style={{ background: T.accent }}>
                Aplicar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Tabs + 3 cards ───────────────────────────────────────────────────────────
function TiposPanel({ tiposData }) {
  const [activo, setActivo] = useState("aleatorio")
  const stats = tiposData?.[activo] || {}

  return (
    <>
      <div className="flex items-center justify-center gap-1 border-b mb-6" style={{ borderColor: T.border }}>
        {TIPOS.map(({ key, label, color }) => {
          const isActive = activo === key
          return (
            <button key={key} onClick={() => setActivo(key)}
              className="relative pb-3 px-4 text-sm font-medium transition-colors"
              style={{ color: isActive ? color : T.mutedSoft }}>
              {label}
              {isActive && (
                <motion.div layoutId="tab-line"
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ background: color }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activo}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex gap-4 flex-col sm:flex-row">
          {/* ✅ FIX: ultima_sesion, mejor_reaccion, peor_reaccion */}
          <SessionCard title="Última Sesión" data={stats.ultima_sesion}  delay={0}    />
          <SessionCard title="Mejor Prueba"  data={stats.mejor_reaccion} delay={0.07} />
          <SessionCard title="Peor Prueba"   data={stats.peor_reaccion}  delay={0.14} />
        </motion.div>
      </AnimatePresence>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ResultadosPersonalPage() {
  const [jugadorData, setJugadorData] = useState(null)
  const [rankingData, setRankingData] = useState(null)
  const [rankingPos,  setRankingPos]  = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [desde,       setDesde]       = useState("")
  const [hasta,       setHasta]       = useState("")

  useEffect(() => { cargarDatos() }, [desde, hasta])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const userId = typeof window !== "undefined" ? localStorage.getItem("idUser") : null
      if (!userId) return

      const qs = new URLSearchParams()
      if (desde) qs.set("desde", desde)
      if (hasta) qs.set("hasta", hasta)
      const q = qs.toString() ? `?${qs}` : ""

      const [cR, rR, pR] = await Promise.all([
        fetch(`${BACKEND_URL}/api/cuentas/${userId}`),
        fetch(`${BACKEND_URL}/api/ranking/personal/${userId}${q}`),
        fetch(`${BACKEND_URL}/api/ranking/posicion/${userId}${q}`),
      ])
      const [cD, rD, pD] = await Promise.all([cR.json(), rR.json(), pR.json()])
      if (cD.success) setJugadorData(cD.data)
      if (rD.success) setRankingData(rD.data)
      if (pD.success) setRankingPos(pD.data?.posicion_ranking ?? null)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div className="min-h-screen py-10 px-4" style={{ background: T.pageBg }}>
      <style>{`.sh{position:relative;overflow:hidden}.sh::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);animation:shim 1.5s infinite}@keyframes shim{100%{transform:translateX(100%)}}`}</style>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="h-20 rounded-2xl bg-slate-200 sh" />
        <div className="h-[420px] rounded-2xl bg-slate-200 sh" />
      </div>
    </div>
  )

  if (!jugadorData || !rankingData) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: T.pageBg }}>
      <p className="text-sm" style={{ color: T.muted }}>No se encontraron datos del jugador</p>
    </div>
  )

  const jugador = jugadorData.jugador || jugadorData.entrenador || jugadorData.tecnico
  const posIcon = getPositionIcon(jugador.posicion_principal)

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: T.pageBg }}>
      <div className="max-w-4xl mx-auto space-y-7">

        {/* ── HEADER ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex items-center gap-5">
            <div className="h-[72px] w-[72px] shrink-0 rounded-full grid place-items-center overflow-hidden"
              style={{ background: "#e2e8f0", boxShadow: "0 0 0 4px #fff, 0 0 0 6px #e2e8f0" }}>
              {posIcon
                ? <img src={posIcon} alt="" className="w-10 h-10 object-contain" />
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
                {jugador.posicion_principal ? getPositionName(jugador.posicion_principal) : "Jugador"}
              </p>
              <h1 className="text-xl font-extrabold leading-snug" style={{ color: T.text }}>
                {jugador.nombres} {jugador.apellidos}
              </h1>
              {jugador.carrera && (
                <p className="text-[13px] mt-0.5" style={{ color: T.muted }}>{jugador.carrera}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── PANEL PRINCIPAL ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
          <div className="rounded-2xl"
            style={{
              background: T.bg,
              border: `1.5px solid ${T.border}`,
              boxShadow: T.shadow,
            }}>

            {/* Top bar */}
            <div className="relative px-6 pt-6 pb-5 flex items-center justify-between gap-4">
              <DateRangeFilter desde={desde} hasta={hasta}
                onChange={(d, h) => { setDesde(d); setHasta(h) }} />

              {/* Título centrado absolute */}
              <div className="absolute inset-x-0 top-6 flex justify-center pointer-events-none">
                <span className="inline-flex items-center px-6 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest text-white"
                  style={{ background: "#334155", boxShadow: "0 2px 8px rgba(15,23,42,0.15)" }}>
                  Resumen de Rendimiento
                </span>
              </div>

              {/* Mirror spacer */}
              <div style={{ minWidth: 190, visibility: "hidden" }} aria-hidden />
            </div>

            <div className="mx-6" style={{ height: 1, background: T.border }} />

            <div className="px-6 pt-5 pb-6">
              {/* ✅ FIX: por_tipo_reaccion */}
              <TiposPanel tiposData={rankingData.por_tipo_reaccion} />
            </div>

          </div>
        </motion.div>

      </div>
    </div>
  )
}