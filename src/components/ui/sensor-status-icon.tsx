"use client"

import { Zap } from "lucide-react"
import { cn } from "../../lib/utils"

export type SensorState = "idle" | "waiting" | "success" | "error"

interface SensorStatusIconProps {
  state: SensorState
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function SensorStatusIcon({ state, size = "md", showLabel = false }: SensorStatusIconProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  const colorClasses = {
    idle: "text-gray-400",
    waiting: "text-blue-500",
    success: "text-green-500",
    error: "text-red-500",
  }

  const animationClasses = {
    idle: "",
    waiting: "animate-pulse",
    success: "",
    error: "animate-pulse",
  }

  const glowClasses = {
    idle: "",
    waiting: "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
    success: "drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]",
    error: "drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]",
  }

  const labelMap = {
    idle: "En reposo",
    waiting: "Esperando...",
    success: "OK",
    error: "Error",
  }

  return (
    <div className="flex items-center gap-2">
      <Zap
        className={cn(
          sizeClasses[size],
          colorClasses[state],
          animationClasses[state],
          glowClasses[state],
          "transition-all duration-300",
        )}
      />
      {showLabel && <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{labelMap[state]}</span>}
    </div>
  )
}
