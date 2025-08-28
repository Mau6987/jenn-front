"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Users,
  Trophy,
  LogOut,
  UserCheck,
  FileText,
  Calendar,
  Activity,
  Menu,
  User,
  TrendingUp,
  ClipboardList,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"


export default function AppSidebar({ ...props }) {
  const router = useRouter()
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()
  const { rol, isAuthenticated, logout } = useAuth()

  // No mostrar sidebar si estamos en login o no hay autenticación
  if (pathname === "/login" || !isAuthenticated) {
    return null
  }

  const getMenuItems = () => {
    switch (rol) {
      case "tecnico":
        return [
          { icon: UserCheck, label: "Entrenadores", href: "/entrenadores" },
          { icon: Activity, label: "Monitoreo", href: "/monitoreo" },
          { icon: User, label: "Perfil", href: "/perfil" },
        ]
      case "entrenador":
        return [
          { icon: Users, label: "Jugadores", href: "/jugadores" },
          { icon: Trophy, label: "Ranking Semanal", href: "/rankinsemanal" },
          { icon: Calendar, label: "Horarios", href: "/horarios" },
          { icon: ClipboardList, label: "Prueba", href: "/prueba" },
          { icon: FileText, label: "Resultados", href: "/resultados" },
          { icon: User, label: "Perfil", href: "/perfil" },
        ]
      case "jugador":
        return [
          { icon: FileText, label: "Resultados", href: "/resultados" },
          { icon: Calendar, label: "Horarios", href: "/horarios" },
          { icon: Trophy, label: "Ranking Semanal", href: "/rankinsemanal" },
          { icon: TrendingUp, label: "Ranking Mensual", href: "/rankinmensual" },
          { icon: User, label: "Perfil", href: "/perfil" },
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()
  const collapsed = state === "collapsed"

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const handleMenuClick = () => {
    toggleSidebar()
  }

  return (
    <Sidebar collapsible="icon" className="w-72" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={handleMenuClick}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-[#800020] hover:text-white cursor-pointer"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#800020] text-white">
                <Menu className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-[#800020]">Menú</span>
                <span className="text-xs text-[#a64d66] capitalize">{rol || "Usuario"}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#800020] capitalize">Panel {rol}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`${isActive ? "bg-[#800020] text-white hover:bg-[#800020] hover:text-white" : "text-black hover:bg-[#800020] hover:text-white"}`}
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-[#800020] hover:bg-[#800020] hover:text-white">
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
