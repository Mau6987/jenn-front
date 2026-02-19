"use client"

import { Loader2 } from "lucide-react"

interface LoadingModalProps {
  isOpen: boolean
  message?: string
}

export function LoadingModal({ isOpen, message = "Procesando..." }: LoadingModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-card rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-lg font-semibold text-foreground">{message}</p>
      </div>
    </div>
  )
}
