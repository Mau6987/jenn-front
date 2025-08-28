"use client"

import { useState, useEffect, useCallback } from "react"

const initialAuthState = {
  idUser: "",
  rol: "",
  token: "",
  isAuthenticated: false,
}

// Custom event for auth changes
const AUTH_CHANGE_EVENT = "authStateChange"

export function useAuth() {
  const [authState, setAuthState] = useState(initialAuthState)

  // Function to update auth state from localStorage
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

  // Function to trigger auth state change
  const triggerAuthChange = useCallback(() => {
    updateAuthState()
    // Dispatch custom event to notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT))
    }
  }, [updateAuthState])

  // Function to login
  const login = useCallback(
    (idUser, rol, token) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("idUser", idUser)
        localStorage.setItem("rol", rol)
        localStorage.setItem("token", token)
        triggerAuthChange()
      }
    },
    [triggerAuthChange],
  )

  // Function to logout
  const logout = useCallback(async () => {
    const token = localStorage.getItem("token")
    try {
      if (token) {
        await fetch("https://voley-backend-nhyl.onrender.com/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  // Initialize auth state on mount
  useEffect(() => {
    updateAuthState()
  }, [updateAuthState])

  // Listen for auth changes from other components
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
