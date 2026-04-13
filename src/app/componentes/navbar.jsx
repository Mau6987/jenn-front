"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  ArrowLeft,
  User,
  Briefcase,
  Shield,
  Activity,
  TrendingUp,
  Trophy,
  ClipboardList,
  Users,
  UserCheck,
  LayoutDashboard,
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

  const { rol, posicion, nombre, isAuthenticated, logout, idUser, token } = useAuth()

  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userPhoto, setUserPhoto] = useState(null)
  const [loadingPhoto, setLoadingPhoto] = useState(false)

  useEffect(() => {
    const fetchUserPhoto = async () => {
      if (!isAuthenticated || !idUser || !token) return

      try {
        setLoadingPhoto(true)
        const response = await fetch(`https://jenn-back-reac.onrender.com/api/cuentas/perfil/${idUser}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data.path) {
            setUserPhoto(data.data.path)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching user photo:", error)
      } finally {
        setLoadingPhoto(false)
      }
    }

    fetchUserPhoto()
  }, [isAuthenticated, idUser, token])

  const homeRoutes = ["/homeJ", "/homeE", "/homeT"]
  const isRoleHome = homeRoutes.includes(pathname)

  const getHomeRoute = () => {
    switch (rol) {
      case "jugador":    return "/homeJ"
      case "entrenador": return "/homeE"
      case "tecnico":    return "/homeT"
      default:           return "/"
    }
  }

  const adminViews    = ["/jugadores", "/entrenadores", "/tecnicos"]
  const isAdminView   = adminViews.includes(pathname)
  const monitoreoRoutes = ["/monitoreo", "/monitoreo2"]
  const isMonitoreoView = monitoreoRoutes.includes(pathname)

  const handleLogoutClick   = () => setShowLogoutDialog(true)

  const handleLogoutConfirm = async () => {
    setShowLogoutDialog(false)
    setIsLoggingOut(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await logout()
    setIsLoggingOut(false)
    router.push("/")
  }

  const getRoleIconComponent = () => {
    if (rol === "jugador" && posicion) {
      return (
        <img
          src={getPositionIcon(posicion) || "/placeholder.svg"}
          alt={posicion}
          className="w-full h-full object-cover"
        />
      )
    }
    const iconMap = {
      tecnico:    <Shield className="w-5 h-5 text-white" />,
      entrenador: <Briefcase className="w-5 h-5 text-white" />,
      jugador:    <User className="w-5 h-5 text-white" />,
    }
    return iconMap[rol] || <User className="w-5 h-5 text-white" />
  }

  const getMenuItems = () => {
    switch (rol) {
      // ── Jugador: se quitó { Perfil } ──────────────────────────────────────
      case "jugador":
        return [
          { icon: Activity,   label: "Resultados Reacción", href: "/resultados2" },
          { icon: TrendingUp, label: "Resultados Salto",    href: "/rankings2"   },
          { icon: Trophy,     label: "Ranking Reacción",    href: "/ranking"     },
          { icon: Award,      label: "Ranking Salto",       href: "/rankings3"   },
        ]

      // ── Entrenador: se quitó { Perfil } ───────────────────────────────────
      case "entrenador":
        return [
          { icon: ClipboardList, label: "Pruebas de reacción", href: "/pruebas2"   },
          { icon: Activity,      label: "Pruebas de salto",    href: "/pliometria" },
          { icon: Users,         label: "Jugadores",           href: "/jugadores"  },
        ]

      // ── Técnico: se quitó { Perfil } en todas las vistas ──────────────────
      case "tecnico":
        if (isMonitoreoView) {
          return [
            { icon: Activity, label: "Monitoreo Cápsulas", href: "/monitoreo"  },
            { icon: Activity, label: "Monitoreo Cinturón", href: "/monitoreo2" },
          ]
        }
        if (isAdminView) {
          return [
            { icon: Users,     label: "Jugadores",    href: "/jugadores"    },
            { icon: UserCheck, label: "Entrenadores", href: "/entrenadores" },
            { icon: Shield,    label: "Técnicos",     href: "/tecnicos"     },
          ]
        }
        return [
          { icon: Users,     label: "Jugadores",    href: "/jugadores"    },
          { icon: UserCheck, label: "Entrenadores", href: "/entrenadores" },
          { icon: Shield,    label: "Técnicos",     href: "/tecnicos"     },
          { icon: Activity,  label: "Monitoreo",    href: "/monitoreo"    },
        ]

      default:
        return []
    }
  }

  /* ── NAVBAR SIN LOGIN ────────────────────────────────────────────────────── */
  if (!isAuthenticated) {
    const isLoginPage = pathname === "/login"
    return (
      <header className="sticky top-0 z-50 px-6 py-6 bg-white shadow-md border-b border-gray-200">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Image src="/logo2.png" alt="logo" width={64} height={64} />
            <span className="text-[#800020] font-bold text-2xl">Tech Volley UNV</span>
          </div>
          <Link
            href={isLoginPage ? "/" : "/login"}
            className="bg-[#800020] text-white px-5 py-2 rounded-lg font-medium hover:opacity-90"
          >
            {isLoginPage ? "Inicio" : "Iniciar Sesión"}
          </Link>
        </nav>
      </header>
    )
  }

  if (pathname === "/login") {
    return (
      <header className="sticky top-0 z-50 flex h-20 items-center gap-2 border-b bg-white px-6 shadow-lg">
        <Link href="/" className="flex items-center gap-2 text-[#800020]">
          <ArrowLeft className="h-6 w-6" />
          Volver
        </Link>
      </header>
    )
  }

  const menuItems = getMenuItems()

  return (
    <>
      <header className="sticky top-0 z-50 flex h-24 items-center gap-4 border-b bg-white px-6 shadow-lg">

        <div className="flex items-center space-x-3">
          <Image src="/logo2.png" alt="logo" width={56} height={56} />
          <h1 className="text-[#800020] font-bold text-xl">Tech Volley UNV</h1>
        </div>

        <Link
          href={getHomeRoute()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#800020] hover:bg-[#800020] hover:text-white"
        >
          <LayoutDashboard className="w-5 h-5" />
          Panel
        </Link>

        {!isRoleHome && (
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-2">
            {menuItems
              .filter((item) => item.href !== pathname)
              .map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-[#800020] hover:text-white"
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}
          </nav>
        )}

        {/* Avatar → enlace al perfil (reemplaza el ítem del menú) */}
        <div className="flex items-center gap-3 ml-auto">
          <Link href="/perfil" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#800020] rounded-full flex items-center justify-center overflow-hidden">
              {userPhoto && !loadingPhoto ? (
                <img src={userPhoto} alt={nombre} className="w-full h-full object-cover" />
              ) : (
                getRoleIconComponent()
              )}
            </div>
            <span className="text-[#800020] font-medium">{nombre}</span>
          </Link>

          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-2 text-[#800020]"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </header>

      <LogoutDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogoutConfirm}
      />

      {isLoggingOut && <LogoutLoading />}
    </>
  )
}