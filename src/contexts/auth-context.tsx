"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"

const AuthContext = createContext(undefined)

const INACTIVITY_TIMEOUT = 10 * 60 * 1000

export function AuthProvider({ children }) {
  const [idUser, setIdUser] = useState(null)
  const [rol, setRol] = useState("jugador")
  const [token, setToken] = useState(null)
  const [posicion, setPosicion] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const inactivityTimer = useRef(null)

  const logout = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }

    localStorage.removeItem("idUser")
    localStorage.removeItem("rol")
    localStorage.removeItem("token")
    localStorage.removeItem("posicion")

    setIdUser(null)
    setRol("jugador")
    setToken(null)
    setPosicion(null)
    setIsAuthenticated(false)
  }, [])

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
    const storedUserId = localStorage.getItem("idUser")
    const storedRol = localStorage.getItem("rol")
    const storedToken = localStorage.getItem("token")
    const storedPosicion = localStorage.getItem("posicion")

    if (storedUserId && storedRol && storedToken) {
      setIdUser(storedUserId)
      setRol(storedRol)
      setToken(storedToken)
      setPosicion(storedPosicion)
      setIsAuthenticated(true)
    }

    setIsLoading(false)

    if (typeof window !== "undefined") {
      const events = ["mousemove", "keydown", "click", "scroll", "touchstart"]
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
  }, [logout, resetInactivityTimer])

  const login = useCallback(
    (userId, userRole, authToken, userPosition) => {
      localStorage.setItem("idUser", userId)
      localStorage.setItem("rol", userRole)
      localStorage.setItem("token", authToken)
      if (userPosition) {
        localStorage.setItem("posicion", userPosition)
      }

      setIdUser(userId)
      setRol(userRole)
      setToken(authToken)
      setPosicion(userPosition || null)
      setIsAuthenticated(true)

      resetInactivityTimer()
    },
    [resetInactivityTimer],
  )

  return (
    <AuthContext.Provider
      value={{
        idUser,
        rol,
        token,
        posicion,
        isAuthenticated,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
