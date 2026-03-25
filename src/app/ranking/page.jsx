"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  shadow:    "0 4px 24px rgba(15,23,42,0.08)",
  shadowSm:  "0 1px 6px rgba(15,23,42,0.05)",
  gold:      "#f59e0b",
  silver:    "#94a3b8",
  bronze:    "#d97706",
  aciertos:  "#16a34a",
  errores:   "#dc2626",
}

const MEDAL_COLORS = {
  1: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", glow: "rgba(245,158,11,0.3)"  },
  2: { bg: "#f1f5f9", border: "#94a3b8", text: "#475569", glow: "rgba(148,163,184,0.3)" },
  3: { bg: "#fff7ed", border: "#d97706", text: "#92400e", glow: "rgba(217,119,6,0.3)"   },
}

const PERIODO_OPTIONS = [
  { key: "general",  label: "General"  },
  { key: "mensual",  label: "Mensual"  },
  { key: "semanal",  label: "Semanal"  },
]

// ─── Avatar ───────────────────────────────────────────────────────────────────
function PlayerAvatar({ jugador, size = 56 }) {
  const icon  = getPositionIcon(jugador?.posicion_principal)
  return (
    <div className="rounded-full grid place-items-center overflow-hidden shrink-0"
      style={{
        width: size, height: size,
        background: icon ? "transparent" : "#e2e8f0",
        border: `2px solid ${T.border}`,
      }}>
      {icon
        ? <img src={icon} alt="" style={{ width: size * 0.6, height: size * 0.6, objectFit: "contain" }} />
        : <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none"
            stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
      }
    </div>
  )
}

// ─── Precision badge ──────────────────────────────────────────────────────────
function PrecisionBadge({ value, size = "md" }) {
  const isLg = size === "lg"
  return (
    <span className="inline-flex items-center rounded-full font-bold tabular-nums"
      style={{
        background: T.accent,
        color: "#fff",
        fontSize: isLg ? 13 : 11,
        padding: isLg ? "4px 12px" : "3px 9px",
        boxShadow: "0 2px 8px rgba(29,78,216,0.25)",
      }}>
      {Number(value).toFixed(1)}%
    </span>
  )
}

// ─── Podium card (top 3) ──────────────────────────────────────────────────────
function PodiumCard({ player, position, delay = 0, onClick }) {
  const mc = MEDAL_COLORS[position]
  const podiumHeights = { 1: 90, 2: 68, 3: 52 }
  const avatarSizes   = { 1: 72, 2: 60, 3: 56 }
  const order         = { 1: 2, 2: 1, 3: 3 }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer"
      style={{ order: order[position] }}
    >
      <p className="text-[12px] font-semibold text-center mb-2 max-w-[100px] leading-tight"
        style={{ color: T.text }}>
        {player.jugador.nombres} {player.jugador.apellidos}
      </p>

      <PrecisionBadge value={player.totales_generales.precision} size="md" />

      <motion.div className="my-3 relative"
        whileHover={{ scale: 1.07 }} transition={{ type: "spring", stiffness: 300 }}>
        <div className="absolute inset-0 rounded-full blur-xl" style={{ background: mc.glow, transform: "scale(1.3)" }} />
        <div className="relative rounded-full overflow-hidden grid place-items-center"
          style={{
            width: avatarSizes[position],
            height: avatarSizes[position],
            background: "#e2e8f0",
            border: `3px solid ${mc.border}`,
            boxShadow: `0 0 0 3px #fff`,
          }}>
          {getPositionIcon(player.jugador.posicion_principal)
            ? <img src={getPositionIcon(player.jugador.posicion_principal)} alt=""
                style={{ width: avatarSizes[position] * 0.58, height: avatarSizes[position] * 0.58, objectFit: "contain" }} />
            : <svg width={avatarSizes[position] * 0.55} height={avatarSizes[position] * 0.55} viewBox="0 0 24 24"
                fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
          }
        </div>
      </motion.div>

      <div className="w-24 rounded-t-xl flex items-center justify-center relative overflow-hidden"
        style={{
          height: podiumHeights[position],
          background: `linear-gradient(160deg, ${mc.bg}, #fff)`,
          border: `1.5px solid ${mc.border}`,
          boxShadow: T.shadowSm,
        }}>
        <span className="text-5xl font-black" style={{ color: mc.border }}>{position}</span>
      </div>
    </motion.div>
  )
}

// ─── Row card (position 4+) ───────────────────────────────────────────────────
function RankingRow({ player, position, delay = 0, onClick, isCurrentUser = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all"
      style={{
        background: isCurrentUser ? "#eff6ff" : T.bg,
        border: `1.5px solid ${isCurrentUser ? T.accent : T.border}`,
        boxShadow: T.shadowSm,
      }}
      whileHover={{ scale: 1.01, boxShadow: T.shadow }}
    >
      <span className="text-lg font-black tabular-nums shrink-0 w-7 text-center"
        style={{ color: T.mutedSoft }}>
        {position}
      </span>

      <PlayerAvatar jugador={player.jugador} size={44} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: T.text }}>
          {player.jugador.nombres} {player.jugador.apellidos}
          {isCurrentUser && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: T.accent, color: "#fff" }}>Tú</span>}
        </p>
        <p className="text-[12px] truncate" style={{ color: T.mutedSoft }}>
          {player.jugador.posicion_principal ? getPositionName(player.jugador.posicion_principal) : ""}
          {player.jugador.carrera ? ` · ${player.jugador.carrera}` : ""}
        </p>
      </div>

      <PrecisionBadge value={player.totales_generales.precision} />
    </motion.div>
  )
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
function PlayerDetailModal({ player, onClose }) {
  if (!player) return null

  const tipos = [
    { key: "aleatorio",  label: "Aleatorio",  color: "#0891b2", bg: "#ecfeff" },
    { key: "secuencial", label: "Secuencial", color: "#7c3aed", bg: "#f5f3ff" },
    { key: "manual",     label: "Manual",     color: "#d97706", bg: "#fffbeb" },
  ]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ background: "rgba(15,23,42,0.35)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ background: T.bg, boxShadow: "0 24px 60px rgba(15,23,42,0.18)", border: `1.5px solid ${T.border}` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 flex items-center gap-4" style={{ borderBottom: `1px solid ${T.border}` }}>
            <PlayerAvatar jugador={player.jugador} size={56} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base truncate" style={{ color: T.text }}>
                {player.jugador.nombres} {player.jugador.apellidos}
              </p>
              <p className="text-[12px] truncate" style={{ color: T.mutedSoft }}>
                {player.jugador.posicion_principal ? getPositionName(player.jugador.posicion_principal) : ""}
                {player.jugador.carrera ? ` · ${player.jugador.carrera}` : ""}
              </p>
              <PrecisionBadge value={player.totales_generales.precision} size="md" />
            </div>
            <button onClick={onClose} className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-slate-100"
              style={{ color: T.mutedSoft }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Por tipo */}
          <div className="px-6 py-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.mutedSoft }}>
              Rendimiento por tipo
            </p>
            {tipos.map(({ key, label, color, bg }) => {
              {/* ✅ FIX: por_tipo_reaccion en lugar de por_tipo_prueba */}
              const d = player.por_tipo_reaccion?.[key]
              if (!d || d.total_realizadas === 0) return null
              const total = (d.total_aciertos + d.total_errores) || 1
              const aPct  = (d.total_aciertos / total) * 100
              const ePct  = (d.total_errores  / total) * 100
              return (
                <div key={key} className="rounded-xl p-3" style={{ background: bg, border: `1px solid ${color}22` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-semibold" style={{ color }}>{label}</span>
                    <span className="text-[12px] font-bold tabular-nums" style={{ color }}>
                      {Number(d.precision).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] mb-2" style={{ color: T.muted }}>
                    <span style={{ color: T.aciertos }}>✓ {d.total_aciertos}</span>
                    <span style={{ color: T.errores }}>✗ {d.total_errores}</span>
                    <span>{d.total_realizadas} pruebas</span>
                  </div>
                  <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                    <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${aPct}%`, background: T.aciertos }} />
                    <div className="absolute right-0 top-0 h-full rounded-full" style={{ width: `${ePct}%`, background: T.errores }} />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen py-10 px-4" style={{ background: T.pageBg }}>
      <style>{`.sh{position:relative;overflow:hidden}.sh::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);animation:shim 1.5s infinite}@keyframes shim{100%{transform:translateX(100%)}}`}</style>
      <div className="max-w-lg mx-auto space-y-5">
        <div className="h-10 rounded-xl bg-slate-200 sh w-48 mx-auto" />
        <div className="h-64 rounded-2xl bg-slate-200 sh" />
        {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-slate-200 sh" />)}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ResultadosGeneralPage() {
  const [ranking,       setRanking]       = useState([])
  const [userPos,       setUserPos]       = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [periodo,       setPeriodo]       = useState("general")
  const [selected,      setSelected]      = useState(null)

  useEffect(() => {
    const uid = typeof window !== "undefined" ? localStorage.getItem("idUser") : null
    setCurrentUserId(uid)
  }, [])

  useEffect(() => { cargarRanking() }, [periodo])

  const cargarRanking = async () => {
    setLoading(true)
    try {
      const userId = typeof window !== "undefined" ? localStorage.getItem("idUser") : null

      const [rankRes, posRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/ranking/general?periodo=${periodo}&limite=20`),
        userId ? fetch(`${BACKEND_URL}/api/ranking/posicion/${userId}?periodo=${periodo}`) : Promise.resolve(null),
      ])

      const rankJson = await rankRes.json()
      if (rankJson.success) setRanking(rankJson.data?.ranking || rankJson.data?.top_5 || [])

      if (posRes) {
        const posJson = await posRes.json()
        if (posJson.success) setUserPos(posJson.data)
      }
    } catch (err) {
      console.error(err)
      setRanking([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Skeleton />

  const top3 = ranking.slice(0, 3)
  const rest  = ranking.slice(3)

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: T.pageBg }}>
      <div className="max-w-lg mx-auto space-y-8">

        {/* ── TÍTULO + selector ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }} className="text-center space-y-4">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: T.text }}>Ranking</h1>

          <div className="inline-flex rounded-xl overflow-hidden"
            style={{ border: `1.5px solid ${T.border}`, background: T.bg, boxShadow: T.shadowSm }}>
            {PERIODO_OPTIONS.map(({ key, label }) => {
              const active = periodo === key
              return (
                <button key={key} onClick={() => setPeriodo(key)}
                  className="px-5 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: active ? T.accent : "transparent",
                    color: active ? "#fff" : T.muted,
                    boxShadow: active ? "0 2px 8px rgba(29,78,216,0.2)" : "none",
                  }}>
                  {label}
                </button>
              )
            })}
          </div>

          {userPos && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "#eff6ff", border: `1.5px solid ${T.accent}`, color: T.accent }}>
                Tu posición: #{userPos.posicion_ranking}
                <span style={{ color: T.mutedSoft, fontWeight: 400 }}>de {userPos.total_jugadores}</span>
              </span>
            </motion.div>
          )}
        </motion.div>

        {ranking.length === 0 ? (
          <div className="text-center py-16 rounded-2xl"
            style={{ background: T.bg, border: `1.5px solid ${T.border}` }}>
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-sm font-medium" style={{ color: T.mutedSoft }}>
              No hay datos para este periodo
            </p>
          </div>
        ) : (
          <>
            {/* ── PODIUM ── */}
            {top3.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-2xl px-6 pt-6 pb-0"
                style={{ background: T.bg, border: `1.5px solid ${T.border}`, boxShadow: T.shadow }}>
                <div className="flex items-end justify-center gap-4">
                  {top3.map((player, i) => (
                    <PodiumCard
                      key={player.cuentaId}
                      player={player}
                      position={i + 1}
                      delay={0.15 + i * 0.1}
                      onClick={() => setSelected(player)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── LISTA 4+ ── */}
            {rest.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest px-1"
                  style={{ color: T.mutedSoft }}>
                  Posiciones siguientes
                </p>
                {rest.map((player, i) => (
                  <RankingRow
                    key={player.cuentaId}
                    player={player}
                    position={i + 4}
                    delay={0.05 * i}
                    isCurrentUser={String(player.cuentaId) === String(currentUserId)}
                    onClick={() => setSelected(player)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODAL ── */}
      {selected && (
        <PlayerDetailModal player={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}