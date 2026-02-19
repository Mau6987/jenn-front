"use client"

interface MetricCardProps {
  icon?: string
  label: string
  value: string | number
  unit?: string
  variant?: "default" | "accent" | "success"
}

export function MetricCard({ icon, label, value, unit = "", variant = "default" }: MetricCardProps) {
  const variants = {
    default: "bg-white border-2 border-slate-200",
    accent: "bg-white border-2 border-red-200",
    success: "bg-white border-2 border-green-200",
  }

  return (
    <div className={`${variants[variant]} rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow`}>
      <div className="flex items-center gap-3">
        {icon && (
          <img src={icon || "/placeholder.svg"} alt={label} className="w-10 h-10 object-contain flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-600">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-bold text-slate-900">{value}</p>
            <span className="text-xs text-slate-500">{unit}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
