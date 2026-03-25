"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
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
}

const MEDAL = {
  1: { ring: "#F59E0B", bg: "#FFFBEB", text: "#B45309", bar: "linear-gradient(160deg,#FCD34D,#F59E0B)" },
  2: { ring: "#9CA3AF", bg: "#F9FAFB", text: "#6B7280", bar: "linear-gradient(160deg,#E5E7EB,#9CA3AF)" },
  3: { ring: "#F97316", bg: "#FFF7ED", text: "#C2410C", bar: "linear-gradient(160deg,#FED7AA,#F97316)" },
}

const TIPOS_SALTO = [
  { key: "todos",        label: "Filtrar por tipo de ejercicio de salto" },
  { key: "salto simple", label: "Salto simple" },
  { key: "salto conos",  label: "Salto conos"  },
]

const PERIODOS = [
  { key: "general", label: "General" },
  { key: "mensual", label: "Mensual" },
  { key: "semanal", label: "Semanal" },
]

function Skeleton() {
  return (
    <div className="py-10 px-4 min-h-screen" style={{ background: T.pageBg }}>
      <style>{`.sh{position:relative;overflow:hidden}.sh::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);animation:shim 1.5s infinite}@keyframes shim{100%{transform:translateX(100%)}}`}</style>
      <div className="max-w-xl mx-auto space-y-5">
        <div className="h-8 w-52 rounded-lg bg-slate-200 sh" />
        <div className="h-8 w-32 rounded-lg bg-slate-200 sh mx-auto" />
        <div className="h-[480px] rounded-2xl bg-slate-200 sh" />
      </div>
    </div>
  )
}

function Dropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = options.find(o => o.key === value) || options[0]
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:border-slate-400"
        style={{ background: T.bg, border: `1.5px solid ${T.border}`, color: T.muted, boxShadow: T.shadowSm }}>
        <span>{current.label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: T.mutedSoft }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-2 left-0 rounded-xl py-1 min-w-[220px]"
            style={{ background: T.bg, border: `1.5px solid ${T.border}`, boxShadow: T.shadow }}>
            {options.slice(1).map(opt => (
              <button key={opt.key} onClick={() => { onChange(opt.key); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-50"
                style={{ color: value === opt.key ? T.accent : T.muted, fontWeight: value === opt.key ? 600 : 400 }}>
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Podium({ players, onPlayerClick }) {
  const [p1, p2, p3] = players
  const slots = [
    { player: p2, pos: 2 },
    { player: p1, pos: 1 },
    { player: p3, pos: 3 },
  ]
  const barH  = { 1: 96, 2: 70, 3: 54 }
  const avSize = { 1: "w-16 h-16", 2: "w-14 h-14", 3: "w-12 h-12" }

  return (
    <div className="flex items-end justify-center gap-0 pt-8 px-4">
      {slots.map(({ player, pos }) => {
        if (!player) return <div key={`e-${pos}`} style={{ flex: 1 }} />
        const mc = MEDAL[pos]
        return (
          <motion.div key={player.cuentaId || pos} style={{ flex: 1 }}
            className="flex flex-col items-center cursor-pointer group"
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: pos * 0.09, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onPlayerClick?.(player)}>
            <p className="text-[10px] font-semibold text-center mb-2 line-clamp-2 leading-tight px-1 transition-colors group-hover:text-blue-600"
              style={{ color: T.muted }}>{player.nombre}</p>
            <div className="relative mb-1.5 transition-transform duration-200 group-hover:scale-105">
              <Avatar className={`${avSize[pos]} border-[3px]`}
                style={{ borderColor: mc.ring, boxShadow: `0 0 0 3px ${mc.bg}, 0 2px 10px rgba(0,0,0,0.08)` }}>
                <AvatarImage src={player.imagen || "/placeholder.svg"} />
                <AvatarFallback className="font-bold text-base" style={{ background: mc.bg, color: mc.text }}>
                  {player.nombre?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md"
                style={{ background: mc.ring }}>{pos}</span>
            </div>
            {/* Badge — ahora muestra mejor altura */}
            <div className="text-[9px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full mb-2"
              style={{ background: mc.bg, color: mc.text, border: `1px solid ${mc.ring}` }}>
              {player.mejor_altura ?? "—"} cm
            </div>
            <div className="w-full rounded-t-xl flex items-center justify-center transition-opacity duration-200 group-hover:opacity-85"
              style={{ height: barH[pos], background: mc.bar }}>
              <span className="font-black text-3xl text-white drop-shadow">{pos}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function RankRow({ player, delay = 0, onPlayerClick }) {
  return (
    <motion.div className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer group transition-all"
      style={{ border: `1.5px solid ${T.border}`, background: T.bg, boxShadow: T.shadowSm }}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      whileHover={{ borderColor: "#bfdbfe" }}
      onClick={() => onPlayerClick?.(player)}>
      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: T.pageBg, color: T.muted }}>{player.posicion}</span>
      <Avatar className="w-9 h-9 shrink-0" style={{ border: `1.5px solid ${T.border}` }}>
        <AvatarImage src={player.imagen || "/placeholder.svg"} />
        <AvatarFallback className="text-xs font-bold" style={{ background: "#f1f5f9", color: T.muted }}>
          {player.nombre?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate group-hover:text-blue-600 transition-colors" style={{ color: T.text }}>
          {player.nombre}
        </p>
        <p className="text-[11px] truncate" style={{ color: T.mutedSoft }}>
          {getPositionName(player.jugador?.posicion_principal) || "Jugadora"}
        </p>
      </div>
      {/* Valor principal: mejor altura */}
      <div className="text-right shrink-0">
        <p className="text-sm font-extrabold tabular-nums" style={{ color: T.accent }}>
          {player.mejor_altura ?? "—"} cm
        </p>
        <p className="text-[10px] uppercase tracking-wide" style={{ color: T.mutedSoft }}>
          {player.mejor_cantidad ?? "—"} saltos · {player.mejor_fuerza_total ?? "—"} kg
        </p>
      </div>
    </motion.div>
  )
}

function PlayerModal({ player, tipoSalto, onClose }) {
  if (!player) return null
  const posIcon  = getPositionIcon(player.jugador?.posicion_principal)
  const isSimple = tipoSalto === "salto simple"
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ background: "rgba(15,23,42,0.35)", backdropFilter: "blur(4px)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}>
        <motion.div className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ background: T.bg, border: `1.5px solid ${T.border}`, boxShadow: T.shadow }}
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-4 px-5 py-4" style={{ background: T.text }}>
            <div className="w-12 h-12 rounded-full grid place-items-center overflow-hidden"
              style={{ background: "#1e293b", boxShadow: "0 0 0 3px #334155" }}>
              {posIcon
                ? <img src={posIcon} alt="" style={{ width: 30, height: 30, objectFit: "contain" }} />
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
              }
            </div>
            <div>
              <p className="font-extrabold text-white leading-tight">{player.nombre}</p>
              <p className="text-[11px] text-white/50">
                {getPositionName(player.jugador?.posicion_principal) || "Jugadora"}
              </p>
            </div>
            {player.posicion <= 3
              ? <span className="ml-auto text-xs font-black px-2.5 py-1 rounded-full text-white"
                  style={{ background: MEDAL[player.posicion].ring }}>#{player.posicion}</span>
              : <span className="ml-auto text-xs font-black px-2.5 py-1 rounded-full bg-white/10 text-white">
                  #{player.posicion}</span>
            }
          </div>
          <div className="px-5 py-5 grid grid-cols-2 gap-3">
            {[
              { label: "Altura",   value: `${player.mejor_altura       ?? "—"} cm`, color: T.accent  },
              { label: "Saltos",   value: `${player.mejor_cantidad     ?? "—"}`,     color: "#7c3aed" },
              { label: "Fuerza",   value: `${player.mejor_fuerza_total ?? "—"} kg`, color: "#0891b2" },
              ...(isSimple
                ? [{ label: "Potencia", value: `${player.mejor_potencia ?? "—"} W`, color: "#d97706" }]
                : []
              ),
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background: T.pageBg, border: `1.5px solid ${T.border}` }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: T.mutedSoft }}>
                  {label}
                </p>
                <p className="text-xl font-black" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5">
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-slate-50"
              style={{ background: T.pageBg, color: T.muted, border: `1.5px solid ${T.border}` }}>
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function RankingPage() {
  const [data,           setData]           = useState([])
  const [loading,        setLoading]        = useState(true)
  const [tipoSalto,      setTipoSalto]      = useState("todos")
  const [periodo,        setPeriodo]        = useState("general")
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  useEffect(() => { cargarRanking() }, [tipoSalto, periodo])

  async function cargarRanking() {
    try {
      setLoading(true)
      // CAMBIO: Endpoint actualizado de /pliometria a /salto
      let url = `${BACKEND_URL}/api/ranking/salto?limit=10`
      if (periodo   !== "general") url += `&periodo=${periodo}`
      if (tipoSalto !== "todos")  url += `&tipo=${encodeURIComponent(tipoSalto)}`
      const res    = await fetch(url)
      const result = await res.json()
      if (result.success) {
        setData((result.data?.top || []).map((item, i) => ({
          cuentaId:           item.cuentaId,
          nombre:             `${item.jugador.nombres} ${item.jugador.apellidos}`,
          imagen:             getPositionIcon(item.jugador.posicion_principal) || item.jugador.imagen || "/placeholder.svg",
          mejor_fuerza_total: item.mejor_fuerza_total,
          mejor_altura:       item.mejor_altura,
          mejor_cantidad:     item.mejor_cantidad,
          mejor_potencia:     item.mejor_potencia,
          posicion:           i + 1,
          jugador:            item.jugador,
        })))
      } else setData([])
    } catch (e) {
      console.error(e)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Skeleton />

  const top3 = data.slice(0, 3)
  const rest  = data.slice(3)

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: T.pageBg }}>
      <div className="max-w-xl mx-auto">
        <motion.div className="mb-6" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}>
          <Dropdown options={TIPOS_SALTO} value={tipoSalto} onChange={setTipoSalto} />
        </motion.div>
        <motion.div className="flex justify-center mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}>
          <span className="text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white"
            style={{ background: T.text }}>Ranking</span>
        </motion.div>
        <motion.div className="rounded-2xl overflow-hidden"
          style={{ background: T.bg, border: `1.5px solid ${T.border}`, boxShadow: T.shadow }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex justify-center gap-0 py-3 px-4" style={{ borderBottom: `1.5px solid ${T.border}` }}>
            <div className="flex items-center gap-0 rounded-xl overflow-hidden"
              style={{ border: `1.5px solid ${T.border}`, background: T.pageBg }}>
              {PERIODOS.map(({ key, label }, i, arr) => {
                const active = periodo === key
                return (
                  <button key={key} onClick={() => setPeriodo(key)}
                    className="px-4 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: active ? "#f1f5f9" : "transparent",
                      color:      active ? T.text    : T.mutedSoft,
                      boxShadow:  active ? "inset 0 1px 3px rgba(0,0,0,0.07)" : "none",
                      borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : "none",
                    }}>{label}</button>
                )
              })}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={`${tipoSalto}-${periodo}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}>
              {data.length === 0
                ? <p className="text-center text-sm py-16" style={{ color: T.mutedSoft }}>Sin datos disponibles.</p>
                : <>
                    {top3.length > 0 && <Podium players={top3} onPlayerClick={setSelectedPlayer} />}
                    {rest.length > 0 && (
                      <div className="px-5 py-5 space-y-2">
                        {rest.map((player, i) => (
                          <RankRow key={player.cuentaId || player.posicion} player={player}
                            delay={i * 0.04} onPlayerClick={setSelectedPlayer} />
                        ))}
                      </div>
                    )}
                  </>
              }
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      {selectedPlayer && (
        <PlayerModal player={selectedPlayer} tipoSalto={tipoSalto} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  )
}