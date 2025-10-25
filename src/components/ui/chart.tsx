"use client"

import * as React from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"
import type { TooltipProps } from "recharts"
import { cn } from "../../lib/utils"

const THEMES = { light: "", dark: ".dark" } as const

// ----- Tipos -----
export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
    theme?: Record<keyof typeof THEMES, string>
  }
}

type ChartContextProps = { config: ChartConfig }
const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error("useChart must be used within a <ChartContainer />")
  return context
}

// ----- Contenedor -----
export function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ReactNode
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn("flex aspect-video justify-center text-xs", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

// ----- Estilos dinámicos -----
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, c]) => c.theme || c.color)
  if (!colorConfig.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, c]) => {
    const color = c.theme?.[theme as keyof typeof c.theme] || c.color
    return color ? `  --color-${key}: ${color};` : ""
  })
  .join("\n")}
}`,
          )
          .join("\n"),
      }}
    />
  )
}

// Tooltip completamente tipado y sin errores
export function ChartTooltipContent(props: TooltipProps<any, any>) {
  // extraemos dentro, no en la firma
  const { active, payload, label } = props as {
    active?: boolean
    payload?: any[]
    label?: string | number
  }

  const { config } = useChart()

  if (!active || !payload?.length) return null

  const item = payload[0]
  const key = item.name || item.dataKey
  const conf = config[key as keyof typeof config]
  const color = conf?.color || item.color

  return (
    <div className="rounded-md border bg-background px-2 py-1.5 text-xs shadow">
      <div className="font-medium text-foreground">{conf?.label || label}</div>
      <div className="text-muted-foreground flex items-center gap-1">
        {item.value?.toLocaleString()}
        {color && <span style={{ color }}>●</span>}
      </div>
    </div>
  )
}

// ----- Leyenda -----
export function ChartLegendContent({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>
}) {
  const { config } = useChart()
  if (!payload?.length) return null

  return (
    <div className="flex items-center justify-center gap-4 pt-3">
      {payload.map((item) => {
        const conf = config[item.value]
        return (
          <div key={item.value} className="flex items-center gap-1.5 text-xs">
            <div
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: conf?.color || item.color }}
            />
            {conf?.label || item.value}
          </div>
        )
      })}
    </div>
  )
}

// ----- Componente principal -----
export function Chart({
  title,
  type = "line",
  data,
  xKey,
  yKey,
  color = "#6366f1",
  className,
}: {
  title?: string
  type?: "line" | "bar"
  data: any[]
  xKey: string
  yKey: string
  color?: string
  className?: string
}) {
  const config = {
    [yKey]: { label: yKey, color },
  } satisfies ChartConfig

  return (
    <div className={cn("w-full", className)}>
      {title && <h3 className="mb-4 text-center text-lg font-semibold">{title}</h3>}
      <ChartContainer config={config} className="h-[300px] w-full">
        {type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend content={<ChartLegendContent />} />
            <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend content={<ChartLegendContent />} />
            <Bar dataKey={yKey} fill={color} />
          </BarChart>
        )}
      </ChartContainer>
    </div>
  )
}
