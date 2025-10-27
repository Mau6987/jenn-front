"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { SidebarTrigger } from "../../components/ui/sidebar"
import { Separator } from "../../components/ui/separator"
import { useSidebar } from "../../components/ui/sidebar"
import { ArrowLeft, Menu, X, User, Briefcase, Shield } from "lucide-react"
import { Button } from "../../components/ui/button"
import { useAuth } from "../../contexts/auth-context"
import { getPositionIcon } from "../../lib/position-icons"
import Image from "next/image"
import { LogoutDialog } from "../../components/ui/logout-dialog"
import { LogoutLoading } from "../../components/ui/logout-loading"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { idUser, rol, posicion, token, isAuthenticated, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { state: sidebarState, toggleSidebar } = useSidebar()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const handleLogoutConfirm = async () => {
    setShowLogoutDialog(false)
    setIsLoggingOut(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    await logout()
    setIsLoggingOut(false)
    router.push("/")
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const getRoleIconComponent = () => {
    if (rol === "jugador" && posicion) {
      return (
        <img
          src={getPositionIcon(posicion) || "/placeholder.svg"}
          alt={posicion}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log("[v0] Error loading position icon:", getPositionIcon(posicion))
          }}
        />
      )
    }

    const iconMap = {
      tecnico: <Shield className="w-5 h-5 text-white" />,
      entrenador: <Briefcase className="w-5 h-5 text-white" />,
      jugador: <User className="w-5 h-5 text-white" />,
    }

    return iconMap[rol] || <User className="w-5 h-5 text-white" />
  }

  if (!isAuthenticated) {
    return (
      <header className="relative z-50 px-6 py-6 bg-white shadow-sm border-b border-gray-200">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden">
              <Image src="/puma.png" alt="Puma" width={56} height={56} className="w-full h-full object-cover" />
            </div>
            <span className="text-[#800020] font-bold text-2xl">Voley</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-[#800020] hover:text-[#a64d66] font-medium text-lg">
              Inicio
            </Link>

            <Link href="/horarios-entrenamiento" className="text-gray-700 hover:text-[#800020] text-lg">
              Horarios
            </Link>

            <Link href="/campeonatos" className="text-gray-700 hover:text-[#800020] text-lg">
              Campeonatos
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
            <Button asChild className="bg-[#800020] hover:bg-[#a64d66] text-white h-11 px-6 text-base">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </div>
        </nav>
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <div className="px-6 py-4 space-y-4">
              <Link
                href="/"
                className="block text-[#800020] hover:text-[#a64d66] font-medium py-2 text-lg"
                onClick={closeMobileMenu}
              >
                Inicio
              </Link>

              <Link
                href="/horarios-entrenamiento"
                className="block text-gray-700 hover:text-[#800020] py-2 text-lg"
                onClick={closeMobileMenu}
              >
                Horarios
              </Link>

              <Link
                href="/campeonatos"
                className="block text-gray-700 hover:text-[#800020] py-2 text-lg"
                onClick={closeMobileMenu}
              >
                Campeonatos
              </Link>
            </div>
          </div>
        )}
      </header>
    )
  }

  if (pathname === "/login") {
    return (
      <header className="flex h-20 items-center gap-2 border-b border-gray-300 bg-white px-6 shadow-lg">
        <Link
          href="/"
          className="flex items-center gap-2 p-2 rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="hidden sm:inline text-base">Volver</span>
        </Link>
        <div className="flex items-center space-x-3 mx-auto">
          
          <div className="hidden sm:block">
            <h1 className="text-[#800020] font-bold text-xl">Volleyball </h1>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="flex h-24 items-center gap-2 border-b border-gray-300 bg-white px-6 shadow-lg">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        {sidebarState === "collapsed" && (
          <>
            <SidebarTrigger className="-ml-1 text-[#800020] hover:bg-[#800020] hover:text-white hidden lg:flex" />
            <Separator orientation="vertical" className="mr-2 h-6 hidden lg:block" />
          </>
        )}

        <div className="flex-1 flex justify-center">
          <div className="flex items-center space-x-3 cursor-default">
            <div className="hidden sm:block">
              <h1 className="text-[#800020] font-bold text-2xl">Volleyball System</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/perfil"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <div className="w-12 h-12 bg-[#800020] rounded-full flex items-center justify-center group-hover:bg-[#a64d66] transition-colors overflow-hidden">
              {getRoleIconComponent()}
            </div>
            <div className="hidden sm:flex items-center gap-2 text-left">
              <p className="text-base font-medium text-[#800020] capitalize group-hover:text-[#a64d66] transition-colors">
                {rol}
              </p>
            </div>
          </Link>

          <button
            onClick={handleLogoutClick}
            className="px-4 py-2 text-base rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <LogoutDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} onConfirm={handleLogoutConfirm} />

      {isLoggingOut && <LogoutLoading />}
    </>
  )
}
