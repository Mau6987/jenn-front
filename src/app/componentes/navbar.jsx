"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { SidebarTrigger } from "../../components/ui/sidebar"
import { Separator } from "../../components/ui/separator"
import { useSidebar } from "../../components/ui/sidebar"
import { ArrowLeft, Facebook, Instagram, MessageCircle, Menu, X } from "lucide-react"
import { Button } from "../../components/ui/button"
import { useAuth } from "../../contexts/auth-context"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { idUser, rol, token, isAuthenticated, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { state: sidebarState } = useSidebar()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  if (!isAuthenticated) {
    return (
      <header className="relative z-50 px-6 py-4 bg-white shadow-sm border-b border-gray-200">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-[#800020] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">UV</span>
            </div>
            <span className="text-[#800020] font-bold text-xl">Voley</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-[#800020] hover:text-[#a64d66] font-medium">
              Inicio
            </Link>
            <Link href="/sobre-nosotros" className="text-gray-700 hover:text-[#800020]">
              Sobre Nosotros
            </Link>
            <Link href="/horarios-entrenamiento" className="text-gray-700 hover:text-[#800020]">
              Horarios
            </Link>
            <Link href="/logros" className="text-gray-700 hover:text-[#800020]">
              Logros
            </Link>
            <Link href="/categorias/damas" className="text-gray-700 hover:text-[#800020]">
              Equipo
            </Link>

            <Link href="/campeonatos" className="text-gray-700 hover:text-[#800020]">
              Campeonatos
            </Link>
            <Link href="/contacto" className="text-gray-700 hover:text-[#800020]">
              Contacto
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <Facebook className="w-5 h-5 text-gray-600 hover:text-[#800020] cursor-pointer" />
              <Instagram className="w-5 h-5 text-gray-600 hover:text-[#800020] cursor-pointer" />
              <MessageCircle className="w-5 h-5 text-gray-600 hover:text-[#800020] cursor-pointer" />
            </div>
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Button asChild className="bg-[#800020] hover:bg-[#a64d66] text-white">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </div>
        </nav>
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <div className="px-6 py-4 space-y-4">
              <Link
                href="/"
                className="block text-[#800020] hover:text-[#a64d66] font-medium py-2"
                onClick={closeMobileMenu}
              >
                Inicio
              </Link>
              <Link
                href="/sobre-nosotros"
                className="block text-gray-700 hover:text-[#800020] py-2"
                onClick={closeMobileMenu}
              >
                Sobre Nosotros
              </Link>
              <Link
                href="/horarios-entrenamiento"
                className="block text-gray-700 hover:text-[#800020] py-2"
                onClick={closeMobileMenu}
              >
                Horarios
              </Link>
              <Link href="/logros" className="block text-gray-700 hover:text-[#800020] py-2" onClick={closeMobileMenu}>
                Logros
              </Link>
              <Link href="/categorias/damas" className="text-gray-700 hover:text-[#800020]">
                Equipo
              </Link>
              <Link
                href="/campeonatos"
                className="block text-gray-700 hover:text-[#800020] py-2"
                onClick={closeMobileMenu}
              >
                Campeonatos
              </Link>
              <Link
                href="/contacto"
                className="block text-gray-700 hover:text-[#800020] py-2"
                onClick={closeMobileMenu}
              >
                Contacto
              </Link>
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                <Facebook className="w-6 h-6 text-gray-600 hover:text-[#800020] cursor-pointer" />
                <Instagram className="w-6 h-6 text-gray-600 hover:text-[#800020] cursor-pointer" />
                <MessageCircle className="w-6 h-6 text-gray-600 hover:text-[#800020] cursor-pointer" />
              </div>
            </div>
          </div>
        )}
      </header>
    )
  }

  if (pathname === "/login") {
    return (
      <header className="flex h-14 items-center gap-2 border-b border-gray-300 bg-white px-4 shadow-lg">
        <Link
          href="/"
          className="flex items-center gap-2 p-2 rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Volver</span>
        </Link>
        <div className="flex items-center space-x-3 mx-auto">
          <div className="w-8 h-8 bg-[#800020] rounded-lg flex items-center justify-center">
            <div className="w-5 h-5 bg-white rounded"></div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-[#800020] font-bold text-lg">Univalle</h1>
            <p className="text-[#a64d66] text-xs">Volleyball System</p>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="flex h-14 items-center gap-2 border-b border-gray-300 bg-white px-4 shadow-lg">
      {sidebarState === "collapsed" && (
        <>
          <SidebarTrigger className="-ml-1 text-[#800020] hover:bg-[#800020] hover:text-white" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </>
      )}

      <div className="flex-1 flex justify-center">
        <div className="flex items-center space-x-3 cursor-default">
          <div className="w-8 h-8 bg-[#800020] rounded-lg flex items-center justify-center">
            <div className="w-5 h-5 bg-white rounded"></div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-[#800020] font-bold text-lg">Univalle</h1>
            <p className="text-[#a64d66] text-xs">Volleyball System</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Link
          href="/perfil"
          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
        >
          <div className="w-8 h-8 bg-[#800020] rounded-full flex items-center justify-center group-hover:bg-[#a64d66] transition-colors">
            <span className="text-white text-sm font-medium">{rol.charAt(0).toUpperCase()}</span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-[#800020] capitalize group-hover:text-[#a64d66] transition-colors">
              {rol}
            </p>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="px-3 py-2 text-sm rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  )
}
