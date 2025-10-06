"use client"

import { useState, useEffect, useCallback, useRef } from "react"

const initialAuthState = {
  idUser: "",
  rol: "",
  token: "",
  isAuthenticated: false,
}

const AUTH_CHANGE_EVENT = "authStateChange"
const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutos

export function useAuth() {
  const [authState, setAuthState] = useState(initialAuthState)
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)

  const updateAuthState = useCallback(() => {
    if (typeof window !== "undefined") {
      const idUser = localStorage.getItem("idUser") || ""
      const rol = localStorage.getItem("rol") || ""
      const token = localStorage.getItem("token") || ""
      const isAuthenticated = !!(idUser && rol && token)

      setAuthState({
        idUser,
        rol,
        token,
        isAuthenticated,
      })
    }
  }, [])

  const triggerAuthChange = useCallback(() => {
    updateAuthState()
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT))
    }
  }, [updateAuthState])

  const login = useCallback(
    (idUser: string, rol: string, token: string) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("idUser", idUser)
        localStorage.setItem("rol", rol)
        localStorage.setItem("token", token)
        triggerAuthChange()
      }
    },
    [triggerAuthChange],
  )

  const logout = useCallback(async () => {
    const token = localStorage.getItem("token")
    try {
      if (token) {
        await fetch("https://voley-backend-nhyl.onrender.com/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      if (typeof window !== "undefined") {
        localStorage.clear()
        triggerAuthChange()
      }
    }
  }, [triggerAuthChange])

  // 🔥 Timer de inactividad
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }
    inactivityTimer.current = setTimeout(() => {
      console.warn("Sesión cerrada por inactividad")
      logout()
    }, INACTIVITY_TIMEOUT)
  }, [logout])

  useEffect(() => {
    updateAuthState()

    if (typeof window !== "undefined") {
      // ⚡ Si está en el HOME "/" → limpiar auth
      if (window.location.pathname === "/") {
        console.log("En Home, limpiando datos de sesión...")
        logout()
      }

      const events = ["mousemove", "keydown", "click", "scroll"]
      events.forEach((event) => {
        window.addEventListener(event, resetInactivityTimer)
      })

      resetInactivityTimer()

      return () => {
        events.forEach((event) => {
          window.removeEventListener(event, resetInactivityTimer)
        })
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current)
        }
      }
    }
  }, [updateAuthState, resetInactivityTimer, logout])

  // sincronizar entre tabs
  useEffect(() => {
    const handleAuthChange = () => {
      updateAuthState()
    }
    if (typeof window !== "undefined") {
      window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
      return () => {
        window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
      }
    }
  }, [updateAuthState])

  return {
    ...authState,
    login,
    logout,
    triggerAuthChange,
  }
}
