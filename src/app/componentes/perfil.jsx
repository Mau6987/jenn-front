"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { User, Mail, Phone, Calendar, GraduationCap, Shield, Loader2, AlertCircle, CheckCircle, X } from "lucide-react"

export default function Perfil() {
  const { idUser, token, isAuthenticated } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (isAuthenticated && idUser) {
      obtenerPerfil()
    } else {
      setError("Usuario no autenticado")
      setLoading(false)
    }
  }, [idUser, isAuthenticated])

  const obtenerPerfil = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(`https://voley-backend-nhyl.onrender.com/api/cuentas/perfil/${idUser}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setPerfil(data.data)
        setNotification({
          type: "success",
          message: "Perfil cargado correctamente",
        })
      } else {
        setError(data.message || "Error al cargar el perfil")
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.")
      console.error("Error al obtener perfil:", error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-900 mx-auto mb-4" />
          <p className="text-slate-600 font-medium text-lg">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center max-w-md">
          <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Error al cargar perfil</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <User className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontró el perfil</h3>
          <p className="text-slate-500">No se pudo cargar la información del usuario.</p>
        </div>
      </div>
    )
  }

  // Determinar qué tipo de usuario es y obtener los datos específicos
  const tipoUsuario = perfil.rol
  const datosEspecificos = perfil.jugador || perfil.entrenador || perfil.tecnico

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notificación emergente */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-fade-in">
          <div
            className={`rounded-xl shadow-lg p-4 flex items-center min-w-80 ${
              notification.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
            )}
            <span
              className={`font-medium text-sm ${notification.type === "success" ? "text-green-800" : "text-red-800"}`}
            >
              {notification.message}
            </span>
            <button
              onClick={() => setNotification(null)}
              className={`ml-4 ${notification.type === "success" ? "text-green-600 hover:text-green-800" : "text-red-600 hover:text-red-800"}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full">
        <div className="p-4 lg:p-6 max-w-full">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600 text-sm">Información personal y datos de la cuenta</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden backdrop-blur-sm">
              {/* Header del perfil */}
              <div className="bg-gradient-to-r from-red-900 to-red-800 px-8 py-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {datosEspecificos?.nombres} {datosEspecificos?.apellidos}
                    </h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <Shield className="h-4 w-4 text-red-100" />
                      <span className="text-red-100 text-sm font-medium capitalize">{tipoUsuario}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido del perfil */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Información de la cuenta */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Información de la Cuenta
                    </h3>

                    <div className="space-y-4">
                      <div className="bg-blue-50/50 px-4 py-3 rounded-lg border border-blue-200/30">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Usuario</p>
                            <p className="text-sm text-blue-700">{perfil.usuario}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200/50">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-slate-600" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">Rol</p>
                            <p className="text-sm text-slate-700 capitalize">{perfil.rol}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información personal */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Información Personal
                    </h3>

                    <div className="space-y-4">
                      {datosEspecificos?.correo_institucional && (
                        <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200/50">
                          <div className="flex items-center space-x-3">
                            <Mail className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">Correo Institucional</p>
                              <p className="text-sm text-gray-700">{datosEspecificos.correo_institucional}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {datosEspecificos?.numero_celular && (
                        <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200/50">
                          <div className="flex items-center space-x-3">
                            <Phone className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">Teléfono</p>
                              <p className="text-sm text-gray-700">{datosEspecificos.numero_celular}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {datosEspecificos?.fecha_nacimiento && (
                        <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200/50">
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">Fecha de Nacimiento</p>
                              <p className="text-sm text-gray-700">
                                {new Date(datosEspecificos.fecha_nacimiento).toLocaleDateString("es-ES")}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {datosEspecificos?.carrera && (
                        <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200/50">
                          <div className="flex items-center space-x-3">
                            <GraduationCap className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">Carrera</p>
                              <p className="text-sm text-gray-700">{datosEspecificos.carrera}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información específica del rol */}
                {tipoUsuario === "jugador" && datosEspecificos && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Jugador</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {datosEspecificos.posicion_principal && (
                        <div className="bg-red-50/80 px-4 py-3 rounded-lg border border-red-200/50">
                          <p className="text-sm font-medium text-red-800">Posición Principal</p>
                          <p className="text-sm text-red-700 capitalize">{datosEspecificos.posicion_principal}</p>
                        </div>
                      )}
                      {datosEspecificos.altura && (
                        <div className="bg-red-50/80 px-4 py-3 rounded-lg border border-red-200/50">
                          <p className="text-sm font-medium text-red-800">Altura</p>
                          <p className="text-sm text-red-700">{datosEspecificos.altura} cm</p>
                        </div>
                      )}
                      {datosEspecificos.peso && (
                        <div className="bg-red-50/80 px-4 py-3 rounded-lg border border-red-200/50">
                          <p className="text-sm font-medium text-red-800">Peso</p>
                          <p className="text-sm text-red-700">{datosEspecificos.peso} kg</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botón de actualizar */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <button
                    onClick={obtenerPerfil}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl hover:from-red-800 hover:to-red-900 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                        Actualizando...
                      </>
                    ) : (
                      "Actualizar Perfil"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
