"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  ArrowLeft,
  Menu,
  X,
  User,
  Briefcase,
  Shield,
  Activity,
  TrendingUp,
  Trophy,
  ClipboardList,
  Users,
  UserCheck,
  Home,
  Award,
  LogOut,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { useAuth } from "../../contexts/auth-context"
import { getPositionIcon } from "../../lib/position-icons"
import Image from "next/image"
import { LogoutDialog } from "../../components/ui/logout-dialog"
import { LogoutLoading } from "../../components/ui/logout-loading"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { idUser, rol, posicion, nombre, token, isAuthenticated, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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

  const getMenuItems = () => {
    switch (rol) {
      case "jugador":
        return [
          { icon: Activity, label: "Resultados Reacción", href: "/resultados-reaccion" },
          { icon: TrendingUp, label: "Resultados Salto", href: "/resultados-salto" },
          { icon: Trophy, label: "Ranking Reacción", href: "/ranking-reaccion" },
          { icon: Award, label: "Ranking Salto", href: "/ranking-salto" },
          { icon: User, label: "Perfil", href: "/perfil" },
        ]
      case "entrenador":
        return [
          { icon: ClipboardList, label: "Pruebas de reaccion", href: "/pruebas" },
          { icon: Activity, label: "Pruebas de salto", href: "/pliometria" },

          { icon: Users, label: "Jugadores", href: "/jugadores" },
          { icon: User, label: "Perfil", href: "/perfil" },
        ]
      case "tecnico":
        return [
          { icon: Users, label: "Jugadores", href: "/jugadores" },
          { icon: UserCheck, label: "Entrenadores", href: "/entrenadores" },
          { icon: Shield, label: "Técnicos", href: "/tecnicos" },
          { icon: Activity, label: "Monitoreo", href: "/monitoreo" },
          { icon: User, label: "Perfil", href: "/perfil" },
        ]
      default:
        return []
    }
  }

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 px-6 py-6 bg-white shadow-md border-b border-gray-200">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3 group">
            <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110">
              <Image src="/logojenn.png" alt="Puma" width={56} height={56} className="w-full h-full object-cover" />
            </div>
            <span className="text-[#800020] font-bold text-2xl transition-colors duration-300 group-hover:text-[#a64d66]">
              Tech Volley UNV
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-[#800020] hover:text-[#a64d66] font-medium text-lg transition-all duration-300 hover:scale-105"
            >
              <Home className="w-5 h-5" />
              <span>Inicio</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white transition-all duration-300 hover:scale-110"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
            <Button
              asChild
              className="bg-[#800020] hover:bg-[#a64d66] text-white h-11 px-6 text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </div>
        </nav>
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg animate-slide-down">
            <div className="px-6 py-4 space-y-2">
              <Link
                href="/"
                className="flex items-center gap-3 text-[#800020] hover:text-[#a64d66] font-medium py-3 text-lg transition-colors duration-300 hover:bg-gray-50 px-3 rounded-lg"
                onClick={closeMobileMenu}
              >
                <Home className="w-5 h-5" />
                <span>Inicio</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    )
  }

  if (pathname === "/login") {
    return (
      <header className="sticky top-0 z-50 flex h-20 items-center gap-2 border-b border-gray-300 bg-white px-6 shadow-lg">
        <Link
          href="/"
          className="flex items-center gap-2 p-2 rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="hidden sm:inline text-base">Volver</span>
        </Link>
        <div className="flex items-center space-x-3 mx-auto">
          <div className="hidden sm:block">
            <h1 className="text-[#800020] font-bold text-xl">Tech Volley UNV </h1>
          </div>
        </div>
      </header>
    )
  }

  const menuItems = getMenuItems()

  return (
    <>
      <header className="sticky top-0 z-50 flex h-24 items-center gap-4 border-b border-gray-300 bg-white px-6 shadow-lg relative">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#800020] via-[#a64d66] to-[#800020] opacity-50"></div>

        <div className="flex items-center space-x-3 group">
          <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
            <Image src="/logoJenn.png" alt="Puma" width={48} height={48} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[#800020] font-bold text-xl hidden sm:block transition-colors duration-300 group-hover:text-[#a64d66]">
            Tech Volley UNV
          </h1>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                  isActive
                    ? "bg-[#800020] text-white shadow-lg"
                    : "text-gray-700 hover:bg-[#800020] hover:text-white hover:shadow-md"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden ml-auto p-2 rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white transition-all duration-300 hover:scale-110 hover:rotate-90"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* User Profile & Logout */}
        <div className="hidden lg:flex items-center space-x-3">
          <Link
            href="/perfil"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300 group hover:scale-105"
          >
            <div className="w-10 h-10 bg-[#800020] rounded-full flex items-center justify-center group-hover:bg-[#a64d66] transition-all duration-300 overflow-hidden group-hover:scale-110">
              {getRoleIconComponent()}
            </div>
            <p className="text-sm font-medium text-[#800020] group-hover:text-[#a64d66] transition-colors">
              Bienvenido: <span className="capitalize">{nombre || "Usuario"}</span>
            </p>
          </Link>

          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-md"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-24 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40 animate-slide-down">
          <div className="px-6 py-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-[#800020] text-white shadow-md"
                      : "text-gray-700 hover:bg-[#800020] hover:text-white hover:shadow-sm"
                  }`}
                  onClick={closeMobileMenu}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
            <div className="pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={() => {
                  closeMobileMenu()
                  handleLogoutClick()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white transition-all duration-300 hover:shadow-sm"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <LogoutDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} onConfirm={handleLogoutConfirm} />

      {isLoggingOut && <LogoutLoading />}
    </>
  )
}
