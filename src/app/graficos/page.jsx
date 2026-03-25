"use client"

import { useState, useEffect, useRef } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"
import { Loader2, TrendingUp, BarChart2, BoxSelect, AlertCircle } from "lucide-react"

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
)

const BASE_URL = "https://jenn-back-reac.onrender.com"

const COLORES = {
  manual:           { line: "#10b981", bg: "rgba(16,185,129,0.15)", point: "#059669" },
  secuencial:       { line: "#f59e0b", bg: "rgba(245,158,11,0.15)",  point: "#d97706" },
  aleatorio:        { line: "#6366f1", bg: "rgba(99,102,241,0.15)",  point: "#4f46e5" },
  promedio_general: { line: "#1e293b", bg: "rgba(30,41,59,0.08)",    point: "#0f172a" },
}

const LABELS = {
  manual: "Manual", secuencial: "Secuencial", aleatorio: "Aleatorio",
  promedio_general: "Promedio general",
}

// ── Trendline helper ──────────────────────────────────────────────────────────
const calcTrendline = (valores) => {
  const pts = valores.map((v, i) => [i, v]).filter(([, v]) => v !== null)
  if (pts.length < 2) return valores.map(() => null)
  const n  = pts.length
  const sx = pts.reduce((s, [x]) => s + x, 0)
  const sy = pts.reduce((s, [, y]) => s + y, 0)
  const sx2= pts.reduce((s, [x]) => s + x * x, 0)
  const sxy= pts.reduce((s, [x, y]) => s + x * y, 0)
  const m  = (n * sxy - sx * sy) / (n * sx2 - sx * sx)
  const b  = (sy - m * sx) / n
  return valores.map((_, i) => Number((m * i + b).toFixed(2)))
}

// ── Boxplot canvas draw ───────────────────────────────────────────────────────
const BoxplotCanvas = ({ data }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !data) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const modos = ["aleatorio", "secuencial", "manual"]
    const colores = { aleatorio: "#6366f1", secuencial: "#f59e0b", manual: "#10b981" }
    const labels  = { aleatorio: "Aleatorio", secuencial: "Secuencial", manual: "Manual" }

    const padLeft = 55, padRight = 20, padTop = 30, padBottom = 50
    const plotW = W - padLeft - padRight
    const plotH = H - padTop - padBottom

    // Escala Y
    const allVals = modos.flatMap((m) => data[m]
      ? [data[m].min, data[m].q1, data[m].median, data[m].q3, data[m].max, ...(data[m].outliers || [])]
      : []
    ).filter((v) => v !== null)
    const yMin = Math.floor(Math.max(0, Math.min(...allVals) - 5))
    const yMax = Math.ceil(Math.min(100, Math.max(...allVals) + 5))

    const toY = (v) => padTop + plotH - ((v - yMin) / (yMax - yMin)) * plotH
    const toX = (i) => padLeft + (i + 0.5) * (plotW / modos.length)

    // Grilla Y
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineWidth = 1
    ctx.fillStyle = "#94a3b8"
    ctx.font = "11px Inter, sans-serif"
    ctx.textAlign = "right"
    for (let v = yMin; v <= yMax; v += 10) {
      const y = toY(v)
      ctx.beginPath()
      ctx.moveTo(padLeft, y)
      ctx.lineTo(W - padRight, y)
      ctx.stroke()
      ctx.fillText(`${v}%`, padLeft - 6, y + 4)
    }

    // Eje X
    ctx.strokeStyle = "#cbd5e1"
    ctx.beginPath()
    ctx.moveTo(padLeft, padTop + plotH)
    ctx.lineTo(W - padRight, padTop + plotH)
    ctx.stroke()

    const boxW = (plotW / modos.length) * 0.4

    modos.forEach((modo, i) => {
      const d = data[modo]
      if (!d || d.min === null) return
      const x = toX(i)
      const color = colores[modo]

      // Bigotes
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(x, toY(d.max))
      ctx.lineTo(x, toY(d.q3))
      ctx.moveTo(x, toY(d.q1))
      ctx.lineTo(x, toY(d.min))
      ctx.stroke()
      ctx.setLineDash([])

      // Caps
      ;[d.min, d.max].forEach((v) => {
        ctx.beginPath()
        ctx.moveTo(x - boxW / 3, toY(v))
        ctx.lineTo(x + boxW / 3, toY(v))
        ctx.stroke()
      })

      // Caja Q1–Q3
      ctx.fillStyle = color + "33"
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      const boxTop = toY(d.q3)
      const boxBot = toY(d.q1)
      ctx.fillRect(x - boxW / 2, boxTop, boxW, boxBot - boxTop)
      ctx.strokeRect(x - boxW / 2, boxTop, boxW, boxBot - boxTop)

      // Mediana
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x - boxW / 2, toY(d.median))
      ctx.lineTo(x + boxW / 2, toY(d.median))
      ctx.stroke()

      // Media (x)
      ctx.fillStyle = color
      ctx.font = "bold 12px Inter, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("×", x, toY(d.mean) + 4)

      // Outliers
      ;(d.outliers || []).forEach((v) => {
        ctx.beginPath()
        ctx.arc(x, toY(v), 4, 0, Math.PI * 2)
        ctx.fillStyle = color + "99"
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.fill()
        ctx.stroke()
      })

      // Label eje X
      ctx.fillStyle = "#475569"
      ctx.font = "12px Inter, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(labels[modo], x, H - 12)

      // Stats tooltip-like
      ctx.fillStyle = "#64748b"
      ctx.font = "10px Inter, sans-serif"
      ctx.fillText(`Med: ${d.median}%`, x, padTop - 10)
    })
  }, [data])

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={380}
      className="w-full"
      style={{ maxWidth: "100%" }}
    />
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function GraficosAnalisisPage() {
  const [evolucion, setEvolucion] = useState(null)
  const [ranking,   setRanking]   = useState(null)
  const [boxplot,   setBoxplot]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState("")
  const [mostrarTendencia, setMostrarTendencia] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

        const [r1, r2, r3] = await Promise.all([
          fetch(`${BASE_URL}/api/graficos/evolucion-grupal`, { headers }),
          fetch(`${BASE_URL}/api/graficos/ranking-grupal`,   { headers }),
          fetch(`${BASE_URL}/api/graficos/boxplot`,          { headers }),
            ])
        const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()])

        if (d1.success) setEvolucion(d1.data)
        if (d2.success) setRanking(d2.data)
        if (d3.success) setBoxplot(d3.data)
        setError("")
      } catch (err) {
        setError("Error al cargar los datos. Verifica la conexión.")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // ── Gráfico 1: Evolución semanal ────────────────────────────────────────────
  const evolucionChartData = evolucion ? {
    labels: evolucion.semanas,
    datasets: [
      ...["aleatorio", "secuencial", "manual"].map((modo) => ({
        label: LABELS[modo],
        data: evolucion.series[modo],
        borderColor: COLORES[modo].line,
        backgroundColor: COLORES[modo].bg,
        pointBackgroundColor: COLORES[modo].point,
        pointRadius: 6,
        pointHoverRadius: 9,
        borderWidth: 2.5,
        tension: 0.3,
        fill: false,
        spanGaps: true,
      })),
      ...(mostrarTendencia
        ? ["aleatorio", "secuencial", "manual"].map((modo) => ({
            label: `Tendencia ${LABELS[modo]}`,
            data: calcTrendline(evolucion.series[modo]),
            borderColor: COLORES[modo].line + "66",
            borderDash: [6, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            tension: 0,
            spanGaps: true,
          }))
        : []),
      {
        label: LABELS["promedio_general"],
        data: evolucion.series["promedio_general"],
        borderColor: COLORES["promedio_general"].line,
        backgroundColor: "transparent",
        borderWidth: 3,
        borderDash: [8, 4],
        pointRadius: 5,
        pointStyle: "rectRot",
        fill: false,
        spanGaps: true,
      },
    ],
  } : null

  const evolucionOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true, padding: 16, font: { size: 12 } } },
      title: {
        display: true,
        text: "Evolución del % de aciertos por modo – Promedio grupal (n=6 jugadoras)",
        font: { size: 13, weight: "600" },
        color: "#1e293b",
        padding: { bottom: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y !== null ? ctx.parsed.y + "%" : "—"}`,
        },
      },
    },
    scales: {
      y: {
        min: 0, max: 100,
        ticks: { callback: (v) => `${v}%`, font: { size: 11 } },
        title: { display: true, text: "% Aciertos promedio", font: { size: 11 } },
        grid: { color: "#f1f5f9" },
      },
      x: {
        title: { display: true, text: "Semana", font: { size: 11 } },
        grid: { display: false },
      },
    },
  }

  // ── Gráfico 2: Ranking barras horizontales ──────────────────────────────────
  const rankingChartData = ranking ? {
    labels: ranking.map((j) => j.nombre),
    datasets: [
      {
        label: "Aleatorio",
        data: ranking.map((j) => j.precisiones.aleatorio),
        backgroundColor: COLORES.aleatorio.line + "cc",
        borderColor: COLORES.aleatorio.line,
        borderWidth: 1.5,
        borderRadius: 4,
      },
      {
        label: "Secuencial",
        data: ranking.map((j) => j.precisiones.secuencial),
        backgroundColor: COLORES.secuencial.line + "cc",
        borderColor: COLORES.secuencial.line,
        borderWidth: 1.5,
        borderRadius: 4,
      },
      {
        label: "Manual",
        data: ranking.map((j) => j.precisiones.manual),
        backgroundColor: COLORES.manual.line + "cc",
        borderColor: COLORES.manual.line,
        borderWidth: 1.5,
        borderRadius: 4,
      },
    ],
  } : null

  const rankingOptions = {
    indexAxis: "y",
    responsive: true,
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true, padding: 16, font: { size: 12 } } },
      title: {
        display: true,
        text: "Ranking grupal de % de aciertos promedio por modo (n=6 jugadoras)",
        font: { size: 13, weight: "600" },
        color: "#1e293b",
        padding: { bottom: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.x !== null ? ctx.parsed.x + "%" : "—"}`,
        },
      },
    },
    scales: {
      x: {
        min: 0, max: 100,
        ticks: { callback: (v) => `${v}%`, font: { size: 11 } },
        title: { display: true, text: "% Aciertos promedio", font: { size: 11 } },
        grid: { color: "#f1f5f9" },
      },
      y: {
        ticks: { font: { size: 12 } },
        grid: { display: false },
      },
    },
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium">Cargando análisis...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm">
        <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 font-sans">
      <div className="px-6 md:px-12 xl:px-20 py-10 max-w-[1400px] mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Análisis grupal – Tiempos de reacción</h1>
          <p className="text-sm text-slate-500 mt-1">Evolución, ranking y distribución del porcentaje de aciertos por modo (n=6 jugadoras)</p>
        </div>

        {/* Gráfico 1 – Evolución semanal */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Gráfico 1 — Evolución semanal</h2>
                <p className="text-xs text-slate-400">Promedio grupal de % aciertos por modo a lo largo de las semanas</p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mostrarTendencia}
                onChange={(e) => setMostrarTendencia(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              Líneas de tendencia
            </label>
          </div>
          {evolucionChartData ? (
            <Line data={evolucionChartData} options={evolucionOptions} />
          ) : (
            <p className="text-center text-slate-400 py-12 text-sm">Sin datos de evolución disponibles.</p>
          )}
        </div>

        {/* Gráfico 2 – Ranking barras */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-200">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Gráfico 2 — Ranking grupal</h2>
              <p className="text-xs text-slate-400">% de aciertos promedio por jugadora y modo (ordenado por promedio general)</p>
            </div>
          </div>
          {rankingChartData ? (
            <Bar data={rankingChartData} options={rankingOptions} />
          ) : (
            <p className="text-center text-slate-400 py-12 text-sm">Sin datos de ranking disponibles.</p>
          )}
        </div>

        {/* Gráfico 3 – Boxplot */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200">
              <BoxSelect className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Gráfico 3 — Distribución por modo (Boxplot)</h2>
              <p className="text-xs text-slate-400">Mediana, Q1–Q3, rango y valores atípicos del % de aciertos por modo</p>
            </div>
          </div>

          {boxplot ? (
            <>
              <BoxplotCanvas data={boxplot} />
              {/* Tabla de estadísticas */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wide text-[10px]">
                      <th className="px-4 py-2 text-left font-semibold">Modo</th>
                      <th className="px-4 py-2 text-center font-semibold">N</th>
                      <th className="px-4 py-2 text-center font-semibold">Min</th>
                      <th className="px-4 py-2 text-center font-semibold">Q1</th>
                      <th className="px-4 py-2 text-center font-semibold">Mediana</th>
                      <th className="px-4 py-2 text-center font-semibold">Media</th>
                      <th className="px-4 py-2 text-center font-semibold">Q3</th>
                      <th className="px-4 py-2 text-center font-semibold">Max</th>
                      <th className="px-4 py-2 text-center font-semibold">Atípicos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["aleatorio", "secuencial", "manual"].map((modo) => {
                      const d = boxplot[modo]
                      const color = COLORES[modo].line
                      return (
                        <tr key={modo} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: color }} />
                              <span className="font-semibold capitalize">{modo}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">{d?.total ?? "—"}</td>
                          <td className="px-4 py-2.5 text-center">{d?.min !== null ? `${d.min}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-center">{d?.q1 !== null ? `${d.q1}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-center font-semibold">{d?.median !== null ? `${d.median}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-center text-indigo-600 font-semibold">{d?.mean !== null ? `${d.mean}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-center">{d?.q3 !== null ? `${d.q3}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-center">{d?.max !== null ? `${d.max}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-center">{d?.outliers?.length ?? 0}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 mt-3">
                × = media aritmética · Bigotes = rango sin atípicos (±1.5×IQR) · Puntos = valores atípicos
              </p>
            </>
          ) : (
            <p className="text-center text-slate-400 py-12 text-sm">Sin datos de distribución disponibles.</p>
          )}
        </div>

      </div>
    </div>
  )
}