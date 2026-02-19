"use client"

import { Lightbulb } from "lucide-react"
import { cn } from "../../lib/utils"

export type LEDState = "idle" | "on"

interface LEDStatusIconProps {
  state: LEDState
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function LEDStatusIcon({ state, size = "md", showLabel = false }: LEDStatusIconProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  const colorClasses = {
    idle: "text-gray-400",
    on: "text-blue-500",
  }

  const glowClasses = {
    idle: "",
    on: "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
  }

  return (
    <div className="flex items-center gap-2">
      <Lightbulb
        className={cn(sizeClasses[size], colorClasses[state], glowClasses[state], "transition-all duration-300")}
      />
      {showLabel && (
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {state === "on" ? "Encendido" : "Apagado"}
        </span>
      )}
    </div>
  )
}
