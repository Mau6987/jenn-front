export const getPositionIcon = (position: string | null | undefined): string => {
  if (!position) return "/images/posiciones/oso.png"

  const normalizedPosition = position.toLowerCase().trim()

  const positionMap: Record<string, string> = {
    central: "/oso.png",
    armador: "/delfin.png",
    libero: "/zorro.png",
    líbero: "/zorro.png",
    nexo: "/tigre.png",
    punta: "/puma.png",
    receptor: "/puma.png",
  }

  return positionMap[normalizedPosition] || "/oso.png"
}

export const getPositionName = (position: string | null | undefined): string => {
  if (!position) return "Sin posición"
  return position.charAt(0).toUpperCase() + position.slice(1).toLowerCase()
}
