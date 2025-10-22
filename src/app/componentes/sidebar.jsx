"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Users, Trophy, LogOut, UserCheck, FileText, Calendar, Activity, Menu, User, ClipboardList } from "lucide-react"
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
} from "../../components/ui/sidebar"
import { useAuth } from "../../contexts/auth-context"
import { LogoutDialog } from "../../components/ui/logout-dialog"
import { LogoutLoading } from "../../components/ui/logout-loading"

export default function AppSidebar({ ...props }) {
  const router = useRouter()
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()
  const { rol, isAuthenticated, logout } = useAuth()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
          { icon: ClipboardList, label: "Pruebas", href: "/pruebas" },
          { icon: FileText, label: "Resultados", href: "/resultados" },
          { icon: User, label: "Perfil", href: "/perfil" },
        ]
      case "jugador":
        return [
          { icon: FileText, label: "Resultados", href: "/resultados-personal" },
          { icon: Trophy, label: "Ranking General", href: "/resultados-general" },
          { icon: Calendar, label: "Horarios", href: "/horarios" },
          { icon: User, label: "Perfil", href: "/perfil" },
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()
  const collapsed = state === "collapsed"

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

  const handleMenuClick = () => {
    toggleSidebar()
  }

  return (
    <>
      <Sidebar collapsible="icon" className="w-80" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={handleMenuClick}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-[#800020] hover:text-white cursor-pointer h-20"
              >
                <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-[#800020] text-white">
                  <Menu className="size-6" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-[#800020] text-lg">Menú</span>
                  <span className="text-sm text-[#a64d66] capitalize">{rol || "Usuario"}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[#800020] capitalize text-base font-semibold">
              Panel {rol}
            </SidebarGroupLabel>
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
                        className={`${isActive ? "bg-[#800020] text-white hover:bg-[#800020] hover:text-white" : "text-black hover:bg-[#800020] hover:text-white"} ${collapsed ? "h-12 w-full p-2" : "h-14 text-base"}`}
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <Icon className={collapsed ? "h-5 w-5" : "h-6 w-6"} />
                          {!collapsed && <span className="font-medium">{item.label}</span>}
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
              <SidebarMenuButton
                onClick={handleLogoutClick}
                className={`text-[#800020] hover:bg-[#800020] hover:text-white ${collapsed ? "h-12 w-full p-2" : "h-14 text-base"}`}
              >
                <LogOut className={collapsed ? "h-5 w-5" : "h-6 w-6"} />
                {!collapsed && <span className="font-medium">Cerrar Sesión</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <LogoutDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} onConfirm={handleLogoutConfirm} />

      {isLoggingOut && <LogoutLoading />}
    </>
  )
}
