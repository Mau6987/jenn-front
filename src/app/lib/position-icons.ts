export const getPositionIcon = (position: string | null | undefined): string => {
  if (!position) return "/images/posiciones/oso.png"

  const normalizedPosition = position.toLowerCase().trim()

  const positionMap: Record<string, string> = {
    central: "/images/posiciones/oso.png",
    armador: "/images/posiciones/delfin.png",
    libero: "/images/posiciones/zorro.png",
    líbero: "/images/posiciones/zorro.png",
    nexo: "/images/posiciones/tigre.png",
    punta: "/images/posiciones/puma.png",
  }

  return positionMap[normalizedPosition] || "/images/posiciones/oso.png"
}

export const getPositionName = (position: string | null | undefined): string => {
  if (!position) return "Sin posición"
  return position.charAt(0).toUpperCase() + position.slice(1).toLowerCase()
}
