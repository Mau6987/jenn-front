"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

// ===== THEME =====
const THEME = {
  white: "#ffffff",
  gris: "#9ca3af",
  plomo: "#4b5563",
  plomoOscuro: "#6b7280",
  texto: "#0f172a",
  borde: "#e5e7eb",
  guindo: "#0f172a",
  rojo: "#ef4444",
  guindoSuave: "#94a3b8",
  sombra: "0 10px 30px rgba(2,6,23,0.08)",
  verdeOscuro: "#16a34a",
  azulOscuro: "#1d4ed8",
}

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

// Paleta armónica (suaves y combinan entre sí)
const COLORS = {
  secuencial: "#A78BFA",          // lila
  aleatorio:  "#FB7185",          // rosado
  manual:     "#60A5FA",          // celeste
  aciertos:   "#7ED957",          // verde lechuga
  errores:    "#8F1D3F",          // rojo medio guindo
}

// Paleta para la franja de distribución (ligeras del mismo tono)
const RESUMEN_COLORS = {
  secuencial: "#E9D5FF",  // lila light
  aleatorio:  "#FECDD3",  // rosado light
  manual:     "#BFDBFE",  // celeste light
}

// Icono “rayo” para chip (reacción)
const ICON_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/reaccionicono-TMS3yUL4gH0wOyc3ruyWBmtvc2Cw6X.png"

export default function ResultadosPersonalPage() {
  const [jugadorData, setJugadorData] = useState(null)
  const [rankingData, setRankingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodoActual, setPeriodoActual] = useState("general")

  useEffect(() => { cargarDatos() }, [periodoActual])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const userId = typeof window !== "undefined" ? localStorage.getItem("idUser") : null
      if (!userId) { setJugadorData(null); setRankingData(null); return }
      const cuentaResponse = await fetch(`${BACKEND_URL}/api/cuentas/${userId}`)
      const cuentaData = await cuentaResponse.json()
      if (cuentaData.success) setJugadorData(cuentaData.data)

      const rankingResponse = await fetch(`${BACKEND_URL}/api/ranking/personal/${userId}?periodo=${periodoActual}`)
      const rankingDataRes = await rankingResponse.json()
      if (rankingDataRes.success) setRankingData(rankingDataRes.data)
    } catch { setJugadorData(null); setRankingData(null) }
    finally { setLoading(false) }
  }

  const calcularEdad = (fecha) => {
    if (!fecha) return null
    const b = new Date(fecha), t = new Date()
    let age = t.getFullYear() - b.getFullYear()
    const m = t.getMonth() - b.getMonth()
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--
    return age
  }

  const tiposPrueba = ["secuencial", "aleatorio", "manual"]
  const chartDataPorTipo = useMemo(() => {
    if (!rankingData) return []
    return tiposPrueba.map((tipo) => {
      const datos = rankingData?.por_tipo_prueba?.[tipo]
      const aciertos = datos?.total_aciertos || 0
      const errores = datos?.total_errores || 0
      const intentos = aciertos + errores
      const porcentaje = intentos > 0 ? (aciertos / intentos) * 100 : 0

      const mp = datos?.mejor_prueba
      let mejorPruebaFormateada = null
      if (mp) {
        const mpA = mp.aciertos || 0, mpE = mp.errores || 0
        const mpI = mpA + mpE
        const mpP = mpI > 0 ? (mpA / mpI) * 100 : 0
        mejorPruebaFormateada = { ...mp, intentos: mpI, porcentaje: mpP.toFixed(1) }
      }
      return {
        tipo,
        intentos,
        aciertos,
        errores,
        porcentaje,
        cantidadPruebas: datos?.total_realizadas || 0,
        mejorPrueba: mejorPruebaFormateada
      }
    })
  }, [rankingData])

  const distribucionPruebas = useMemo(() => {
    return chartDataPorTipo.filter(d => d.cantidadPruebas > 0)
      .map(d => ({ name: d.tipo, valor: d.cantidadPruebas, color: RESUMEN_COLORS[d.tipo] }))
  }, [chartDataPorTipo])

  const totalPruebasRealizadas = distribucionPruebas.reduce((a, c) => a + c.valor, 0)
  const totalIntentos = rankingData?.totales_generales?.total_intentos
    || (rankingData?.totales_generales?.total_aciertos || 0) + (rankingData?.totales_generales?.total_errores || 0)
  const totalAciertos = rankingData?.totales_generales?.total_aciertos || 0
  const totalErrores = rankingData?.totales_generales?.total_errores || 0
  const precisionPromedio = totalIntentos > 0 ? ((totalAciertos / totalIntentos) * 100).toFixed(1) : "0.0"

  if (loading) return (
    <div className="relative min-h-screen flex items-center justify-center bg-white">
      <InlineStyles />
      <div className="w-full max-w-3xl px-6"><SkeletonCard /></div>
    </div>
  )

  if (!jugadorData || !rankingData) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <p className="text-gray-700 text-sm">No se encontraron datos del jugador</p>
    </div>
  )

  const jugador = jugadorData.jugador || jugadorData.entrenador || jugadorData.tecnico

  return (
    <div className="relative min-h-screen bg-white">
      <InlineStyles />

      <main className="mx-auto max-w-6xl px-3 py-6 space-y-6">
        {/* Card jugador + selector periodo */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <PlayerHeader jugador={jugador} calcularEdad={calcularEdad} periodoActual={periodoActual} setPeriodoActual={setPeriodoActual} />
        </motion.div>

        {/* ==== Resumen ==== */}
        <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}>
          <GlowCard>
            <CardContent className="px-5 pb-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-x-8 gap-y-4">
                {/* ====== Título/Leyenda izquierda (Distribución por tipo) ====== */}
                <div className="md:col-start-1 md:row-start-1">
                  <h4 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider"
                      style={{ color: THEME.texto }}>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS.secuencial }} />
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS.aleatorio }} />
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS.manual }} />
                    <span>Pruebas realizadas</span>
                    <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: "#F1F5F9", border: `1px solid ${THEME.borde}`, color: THEME.plomo }}>
                      Total: {totalPruebasRealizadas}
                    </span>
                  </h4>

                  <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[13px]" style={{ color: THEME.plomo }}>
                    <LegendPill color={COLORS.secuencial} label={`Secuencial: ${distribucionPruebas.find(d => d.name === "secuencial")?.valor || 0}`} />
                    <LegendPill color={COLORS.aleatorio}  label={`Aleatorio: ${distribucionPruebas.find(d => d.name === "aleatorio")?.valor || 0}`} />
                    <LegendPill color={COLORS.manual}     label={`Manual: ${distribucionPruebas.find(d => d.name === "manual")?.valor || 0}`} />
                  </div>
                </div>

                {/* ====== Leyenda derecha (A/E/Intentos + etiqueta) ====== */}
                <div className="md:col-start-2 md:row-start-1">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="inline-block text-[12px] font-extrabold tracking-widest uppercase"
                      style={{ color: THEME.texto }}
                    >
                      Resultados obtenidos
                    </span>

                    <div className="flex items-center gap-5 text-[13px]">
                      <IconLegendItem color={COLORS.aciertos} icon={<CheckIcon />}><AnimatedNumber value={totalAciertos} /></IconLegendItem>
                      <IconLegendItem color={COLORS.errores} icon={<XIcon />}><AnimatedNumber value={totalErrores} /></IconLegendItem>
                      {/* Intentos con diana.png */}
                      <IconLegendItem color={THEME.plomo} icon={<DianaIcon />}>
                        <AnimatedNumber value={totalIntentos} />
                      </IconLegendItem>
                    </div>
                    {/* Chip de reacción mostrando "Prescion" */}
                    <PercentageChip icon={ICON_URL} label="Prescion" value={`${precisionPromedio}%`} iconSize={22} />
                  </div>
                </div>

                {/* ====== Barra izquierda (Distribución por tipo) ====== */}
                <div className="md:col-start-1 md:row-start-2">
                  <ProgressPill>
                    <AnimatedBar
                      percent={pct(distribucionPruebas.find(d => d.name === "secuencial")?.valor, totalPruebasRealizadas)}
                      color={RESUMEN_COLORS.secuencial}
                      delay={0.05}
                    />
                    <AnimatedBar
                      percent={pct(distribucionPruebas.find(d => d.name === "aleatorio")?.valor, totalPruebasRealizadas)}
                      color={RESUMEN_COLORS.aleatorio}
                      delay={0.1}
                    />
                    <AnimatedBar
                      percent={pct(distribucionPruebas.find(d => d.name === "manual")?.valor, totalPruebasRealizadas)}
                      color={RESUMEN_COLORS.manual}
                      delay={0.15}
                    />
                  </ProgressPill>
                </div>

                {/* ====== Barra derecha (Aciertos/Errores) ====== */}
                <div className="md:col-start-2 md:row-start-2">
                  <ProgressPill>
                    <AnimatedBar percent={pct(totalAciertos, totalIntentos)} color={COLORS.aciertos} delay={0.05} />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct(totalErrores, totalIntentos)}%` }}
                      transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                      className="absolute top-0 right-0 h-full"
                      style={{ backgroundColor: COLORS.errores }}
                    />
                  </ProgressPill>
                </div>
              </div>
            </CardContent>
          </GlowCard>
        </motion.div>

        {/* ==== Cards por tipo ==== */}
        <AnimatePresence initial={false}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chartDataPorTipo.map((d, idx) => (
              <motion.div key={`combo-${d.tipo}`} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: idx * 0.06 }}>
                <CombinedTypeCard data={d} colorTitle={COLORS[d.tipo]} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </main>
    </div>
  )
}

/** ===== Player Header + PeriodSelector ===== */
function PlayerHeader({ jugador, calcularEdad, periodoActual, setPeriodoActual }) {
  const meta = [
    jugador.posicion_principal && { label: getPositionName(jugador.posicion_principal) },
    jugador.carrera && { label: jugador.carrera },
    jugador.fecha_nacimiento && { label: `${calcularEdad(jugador.fecha_nacimiento)} años` },
  ].filter(Boolean)

  const initials = `${jugador.nombres?.[0] || ""}${jugador.apellidos?.[0] || ""}`.toUpperCase()
  const posIcon = getPositionIcon(jugador.posicion_principal)

  return (
    <Card className="relative overflow-hidden rounded-2xl"
      style={{ background: THEME.white, boxShadow: THEME.sombra, border: `1px solid ${THEME.borde}` }}>
      <div className="absolute inset-x-0 top-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${THEME.azulOscuro}, ${THEME.plomo})` }} />
      <CardContent className="relative p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ rotate: -1.5, scale: 1.02 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="shrink-0 grid place-items-center h-16 w-16 rounded-2xl text-white text-xl font-bold shadow-md ring-4 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${THEME.azulOscuro} 0%, ${THEME.plomo} 100%)`, ringColor: THEME.white }}>
              {posIcon ? <img src={posIcon} alt={getPositionName(jugador.posicion_principal)} className="w-full h-full object-contain" /> : (initials || "JD")}
            </motion.div>

            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-extrabold tracking-tight" style={{ color: THEME.texto }}>
                {jugador.nombres} {jugador.apellidos}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {meta.map((m, i) => (
                  <span key={i} className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: "#f3f4f6", color: THEME.plomo, border: `1px solid ${THEME.borde}` }}>
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <PeriodSelector value={periodoActual} onChange={setPeriodoActual} options={["semanal", "mensual", "general"]} />
        </div>
      </CardContent>
    </Card>
  )
}

function PeriodSelector({ value, onChange, options }) {
  const idx = options.indexOf(value)
  return (
    <div className="relative flex items-center rounded-full p-1 shadow-inner select-none"
      style={{ width: 260, background: "#f3f4f6", border: `1px solid ${THEME.borde}` }} role="tablist" aria-label="Periodo">
      <motion.div layout initial={false} animate={{ x: `${idx * 100}%` }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute top-1 bottom-1 left-1 w-1/3 rounded-full" style={{ background: THEME.azulOscuro, boxShadow: THEME.sombra }} aria-hidden />
      {options.map((opt) => {
        const active = value === opt
        return (
          <button key={opt} type="button" role="tab" aria-selected={active} onClick={() => onChange(opt)}
            className="relative z-10 h-8 flex-1 rounded-full px-3 text-xs font-medium transition-colors"
            style={{ color: active ? THEME.white : THEME.plomo, background: "transparent" }}>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        )
      })}
    </div>
  )
}

/** ===== Iconos ===== */
function CheckIcon({ size = 18, color = COLORS.aciertos }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.14" />
      <path d="M7 12l3 3 7-7" />
    </svg>
  )
}
function XIcon({ size = 18, color = COLORS.errores }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.14" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  )
}

// NUEVO: icono de diana para Intentos
function DianaIcon({ size = 18 }) {
  return <img src="/diana.png" alt="Intentos" className="object-contain" style={{ width: size, height: size }} />
}

function IconLegendItem({ color, icon, children }) {
  return (
    <div className="flex items-center gap-2" style={{ color }}>
      <span className="inline-flex items-center justify-center">{icon}</span>
      <span className="tabular-nums">{children}</span>
    </div>
  )
}

/** ===== Card por tipo ===== */
function CombinedTypeCard({ data, colorTitle }) {
  const { tipo, aciertos, errores, intentos, porcentaje, mejorPrueba } = data
  const total = Number(intentos) || Number(aciertos) + Number(errores) || 0
  const aPct = total > 0 ? (aciertos / total) * 100 : 0
  const ePct = total > 0 ? (errores / total) * 100 : 0
  const bestA = mejorPrueba?.aciertos || 0
  const bestE = mejorPrueba?.errores || 0
  const bestT = mejorPrueba ? (mejorPrueba?.intentos ?? bestA + bestE) : 0
  const bestAPct = bestT > 0 ? (bestA / bestT) * 100 : 0
  const bestEPct = bestT > 0 ? (bestE / bestT) * 100 : 0
  const bestPerc = Number(mejorPrueba?.porcentaje || 0)

  return (
    <motion.div whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.995 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
      <Card className="rounded-[24px]" style={{ border: `2px solid ${THEME.borde}`, background: THEME.white, boxShadow: THEME.sombra }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold capitalize" style={{ color: colorTitle }}>{`Prueba ${tipo}`}</CardTitle>
            </div>
            {/* Chip con label Prescion */}
            <PercentageChip value={`${Number(porcentaje || 0).toFixed(1)}%`} iconSize={22} label="Prescion" />
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Global */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: THEME.plomo }}>Global</span>
              <div className="flex items-center gap-5 text-[13px]">
                <IconLegendItem color={COLORS.aciertos} icon={<CheckIcon />}><AnimatedNumber value={aciertos} /></IconLegendItem>
                <IconLegendItem color={COLORS.errores} icon={<XIcon />}><AnimatedNumber value={errores} /></IconLegendItem>
                {/* Intentos con diana.png */}
                <IconLegendItem color={THEME.plomo} icon={<DianaIcon />}><AnimatedNumber value={total} /></IconLegendItem>
              </div>
            </div>
            <div className="px-1">
              <ProgressPill>
                <AnimatedBar percent={aPct} color={COLORS.aciertos} delay={0.05} />
                <motion.div initial={{ width: 0 }} animate={{ width: `${ePct}%` }} transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                  className="absolute top-0 right-0 h-full" style={{ backgroundColor: COLORS.errores }} />
              </ProgressPill>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full" style={{ background: THEME.borde }} />

          {/* Mejor */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: THEME.plomo }}>Mejor prueba</span>
              {/* Chip con label Prescion */}
              <PercentageChip value={`${bestPerc.toFixed(1)}%`} iconSize={22} label="Prescion" />
            </div>
            <div className="flex items-center gap-5 text-[13px]">
              <IconLegendItem color={COLORS.aciertos} icon={<CheckIcon />}><AnimatedNumber value={bestA} /></IconLegendItem>
              <IconLegendItem color={COLORS.errores} icon={<XIcon />}><AnimatedNumber value={bestE} /></IconLegendItem>
              {/* Intentos con diana.png */}
              <IconLegendItem color={THEME.plomo} icon={<DianaIcon />}><AnimatedNumber value={bestT} /></IconLegendItem>
            </div>
            <div className="px-1">
              <ProgressPill>
                <AnimatedBar percent={bestAPct} color={COLORS.aciertos} delay={0.05} />
                <motion.div initial={{ width: 0 }} animate={{ width: `${bestEPct}%` }} transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                  className="absolute top-0 right-0 h-full" style={{ backgroundColor: COLORS.errores }} />
              </ProgressPill>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ===== Chips / UI ===== */
function PercentageChip({ value, label, icon = ICON_URL, iconSize = 24 }) {
  return (
    <span
      className="inline-flex items-center gap-2.5 rounded-full pl-3 pr-3 py-1.5 text-xs font-semibold"
      style={{ background: "rgba(15, 23, 42, 0.06)", color: THEME.texto, border: `1px solid ${THEME.borde}`, boxShadow: "none" }}
    >
      <img src={icon} alt="icon" className="object-contain shrink-0" style={{ width: iconSize, height: iconSize }} />
      {label ? <span className="hidden sm:inline" style={{ color: THEME.plomo }}>{label}</span> : null}
      <span>{value}</span>
    </span>
  )
}

function LegendPill({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-medium"
          style={{ background: "#F8FAFC", border: `1px solid ${THEME.borde}`, color: THEME.plomo }}>
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function pct(value, total) {
  const v = Number(value) || 0
  const t = Math.max(1, Number(total) || 0)
  return Math.max(0, Math.min(100, (v / t) * 100))
}

function DotLegendItem() { return null } // ya no se usa en la cabecera del resumen

function AnimatedBar({ percent = 0, color, delay = 0.05, absolute = false }) {
  const clamped = Math.max(0, Math.min(100, Number(percent)))
  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${clamped}%` }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={absolute ? "absolute top-0 left-0 h-full" : "h-full"}
      style={{ backgroundColor: color }}
    />
  )
}

function ProgressPill({ children }) {
  return (
    <div className="relative w-full h-4 rounded-full overflow-hidden shadow-inner"
      style={{ border: `1px solid ${THEME.borde}`, background: THEME.white }}>
      <div className="flex w-full h-full rounded-full overflow-hidden">{children}</div>
    </div>
  )
}

function GlowCard({ children }) {
  return (
    <Card className="relative rounded-xl" style={{ background: THEME.white, border: `1px solid ${THEME.borde}`, boxShadow: THEME.sombra }}>
      <div className="pointer-events-none absolute -inset-px rounded-xl opacity-60 blur-[6px]"
        style={{ background: `linear-gradient(120deg, rgba(29,78,216,.08), rgba(124,58,237,.08))` }} />
      {children}
    </Card>
  )
}

function SectionTitle({ title, subtitle, align = "left" }) {
  return (
    <div className={align === "center" ? "text-center w-full" : ""}>
      <h3 className="text-[12px] font-semibold tracking-wide" style={{ color: THEME.texto }}>{title}</h3>
      {subtitle && <p className="text-[11px] mt-1" style={{ color: THEME.plomo }}>{subtitle}</p>}
    </div>
  )
}

function AnimatedNumber({ value = 0, duration = 600 }) {
  const nodeRef = useRef(null)
  useEffect(() => {
    const el = nodeRef.current; if (!el) return
    const start = performance.now(), from = 0, to = Number(value) || 0
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      el.textContent = String(Math.round(from + (to - from) * eased))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value, duration])
  return <span ref={nodeRef} aria-live="polite">0</span>
}

function SkeletonCard() {
  return (
    <div className="space-y-6">
      <div className="h-16 rounded-2xl bg-gray-200/60 shimmer" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-36 rounded-2xl bg-gray-200/60 shimmer" />
        <div className="h-36 rounded-2xl bg-gray-200/60 shimmer" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="h-40 rounded-2xl bg-gray-200/60 shimmer" />
        <div className="h-40 rounded-2xl bg-gray-200/60 shimmer" />
        <div className="h-40 rounded-2xl bg-gray-200/60 shimmer" />
      </div>
    </div>
  )
}

// ===== Inline global styles =====
function InlineStyles() {
  if (typeof document !== "undefined") {
    const id = "custom-inline-styles-guindo"
    if (!document.getElementById(id)) {
      const style = document.createElement("style")
      style.id = id
      style.innerHTML = `
        .shimmer { position: relative; overflow: hidden; }
        .shimmer::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent); animation: shimmer 1.6s infinite; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `
      document.head.appendChild(style)
    }
  }
  return null
}
