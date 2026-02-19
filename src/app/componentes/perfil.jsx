"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/auth-context"
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Edit,
  Save,
  Camera,
  Shield,
  Trophy,
  Target,
  Award,
} from "lucide-react"
import { getPositionIcon, getPositionName } from "../../lib/position-icons"

export default function Perfil() {
  const { idUser, token, isAuthenticated, isLoading: authLoading } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notification, setNotification] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [updating, setUpdating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [rankingStats, setRankingStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [rankingPosition, setRankingPosition] = useState(null)
  const [loadingPosition, setLoadingPosition] = useState(false)

  useEffect(() => {
    console.log("[v0] Perfil page - Auth state:", {
      isAuthenticated,
      idUser,
      hasToken: !!token,
      authLoading,
    })

    if (authLoading) {
      console.log("[v0] Waiting for auth to initialize...")
      return
    }

    if (isAuthenticated && idUser) {
      console.log("[v0] User is authenticated, fetching profile...")
      obtenerPerfil()
    } else {
      console.log("[v0] User is not authenticated")
      setError("Usuario no autenticado")
      setLoading(false)
    }
  }, [idUser, isAuthenticated, authLoading])

  const obtenerEstadisticasRanking = async () => {
    try {
      setLoadingStats(true)
      const response = await fetch(
        `https://jenn-back-reac.onrender.com/api/ranking/personal/${idUser}?periodo=general`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      const data = await response.json()

      if (data.success) {
        setRankingStats(data.data)
      }
    } catch (error) {
      console.error("Error al obtener estadísticas de ranking:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  const obtenerPosicionRanking = async () => {
    try {
      setLoadingPosition(true)
      const response = await fetch(
        `https://jenn-back-reac.onrender.com/api/ranking/posicion/${idUser}?periodo=general`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      const data = await response.json()

      if (data.success) {
        setRankingPosition(data.data)
      }
    } catch (error) {
      console.error("Error al obtener posición de ranking:", error)
    } finally {
      setLoadingPosition(false)
    }
  }

  const obtenerPerfil = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(`https://jenn-back-reac.onrender.com/api/cuentas/perfil/${idUser}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setPerfil(data.data)
        initializeFormData(data.data)
        if (data.data.rol === "jugador") {
          obtenerEstadisticasRanking()
          obtenerPosicionRanking()
        }
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

  const initializeFormData = (perfilData) => {
    const tipoUsuario = perfilData.rol
    const datosEspecificos = perfilData.jugador || perfilData.entrenador || perfilData.tecnico

    const baseData = {
      usuario: perfilData.usuario || "",
      nombres: datosEspecificos?.nombres || "",
      apellidos: datosEspecificos?.apellidos || "",
      numero_celular: datosEspecificos?.numero_celular || "",
      fecha_nacimiento: datosEspecificos?.fecha_nacimiento ? datosEspecificos.fecha_nacimiento.split("T")[0] : "",
    }

    if (tipoUsuario === "jugador") {
      setFormData({
        ...baseData,
        correo_institucional: datosEspecificos?.correo_institucional || "",
        carrera: datosEspecificos?.carrera || "",
        posicion_principal: datosEspecificos?.posicion_principal || "",
        altura: datosEspecificos?.altura || "",
        anos_experiencia_voley: datosEspecificos?.anos_experiencia_voley?.toString() || "",
        imagen: datosEspecificos?.imagen || "",
      })
    } else if (tipoUsuario === "entrenador") {
      setFormData({
        ...baseData,
        correo_electronico: datosEspecificos?.correo_electronico || "",
        anos_experiencia_voley: datosEspecificos?.anos_experiencia_voley?.toString() || "",
        imagen: datosEspecificos?.imagen || "",
      })
    } else if (tipoUsuario === "tecnico") {
      setFormData({
        ...baseData,
        correo_institucional: datosEspecificos?.correo_institucional || "",
      })
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleActualizarPerfil = async () => {
    if (!isEditing) {
      setIsEditing(true)
    } else {
      try {
        setUpdating(true)
        setError("")

        const response = await fetch(`https://voley-backend-nhyl.onrender.com/api/cuentas/perfil/${idUser}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (data.success) {
          setPerfil(data.data)
          setIsEditing(false)
          setNotification({
            type: "success",
            message: "Perfil actualizado exitosamente",
          })
        } else {
          setError(data.message || "Error al actualizar el perfil")
          setNotification({
            type: "error",
            message: data.message || "Error al actualizar el perfil",
          })
        }
      } catch (error) {
        setError("Error de conexión. Intenta nuevamente.")
        setNotification({
          type: "error",
          message: "Error de conexión. Intenta nuevamente.",
        })
        console.error("Error al actualizar perfil:", error)
      } finally {
        setUpdating(false)
      }
    }
  }

  const cancelarEdicion = () => {
    setIsEditing(false)
    initializeFormData(perfil)
    setError("")
  }

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (file.size > 2 * 1024 * 1024) {
        reject(new Error("El archivo debe ser menor a 2MB"))
        return
      }

      if (!file.type.startsWith("image/")) {
        reject(new Error("El archivo debe ser una imagen"))
        return
      }

      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const base64 = await convertToBase64(file)
      handleInputChange("imagen", base64)
      setNotification({
        type: "success",
        message: "Imagen cargada correctamente",
      })
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Error al cargar la imagen",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-400 mx-auto mb-4" />
          <p className="text-slate-300 font-medium text-lg">Inicializando...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-400 mx-auto mb-4" />
          <p className="text-slate-300 font-medium text-lg">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (error && !perfil) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-6 py-4 rounded-xl flex items-center max-w-md backdrop-blur-sm">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <User className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-200 mb-2">No se encontró el perfil</h3>
          <p className="text-slate-400">No se pudo cargar la información del usuario.</p>
        </div>
      </div>
    )
  }

  const tipoUsuario = perfil.rol
  const datosEspecificos = perfil.jugador || perfil.entrenador || perfil.tecnico

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-950 to-gray-900">
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
          <div
            className={`rounded-xl shadow-2xl p-4 flex items-center min-w-80 backdrop-blur-sm ${
              notification.type === "success"
                ? "bg-green-500/90 border-2 border-green-300"
                : "bg-red-500/90 border-2 border-red-300"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-white mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-white mr-3 flex-shrink-0" />
            )}
            <span className="font-medium text-sm text-white">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-4 text-white hover:text-gray-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-5xl font-bold text-white mb-2">Perfil</h1>
            <p className="text-gray-400 text-lg">Vizualiza tus datos personales</p>
          </div>

          {/* Main Profile Card */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden animate-scale-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
              {/* Left Column - Avatar & Basic Info */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 shadow-xl animate-fade-in-up">
                  {/* Avatar */}
                  <div className="relative group mb-6">
                    <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-red-500 shadow-2xl transform transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 group-hover:border-red-400">
                      {(tipoUsuario === "jugador" || tipoUsuario === "entrenador") && datosEspecificos?.imagen ? (
                        <img
                          src={datosEspecificos.imagen || "/placeholder.svg"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none"
                            e.target.nextSibling.style.display = "flex"
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center"
                        style={{
                          display:
                            (tipoUsuario === "jugador" || tipoUsuario === "entrenador") && datosEspecificos?.imagen
                              ? "none"
                              : "flex",
                        }}
                      >
                        <User className="h-24 w-24 text-white" />
                      </div>
                    </div>
                    {isEditing && (tipoUsuario === "jugador" || tipoUsuario === "entrenador") && (
                      <label className="absolute bottom-2 right-1/2 transform translate-x-1/2 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-all duration-300 hover:scale-110">
                        <Camera className="h-5 w-5" />
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Name & Role */}
                  <div className="text-center space-y-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={formData.nombres}
                          onChange={(e) => handleInputChange("nombres", e.target.value)}
                          className="w-full bg-gray-700/50 text-white border border-gray-600 rounded-lg px-3 py-2 text-center text-xl font-bold focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          placeholder="Nombres"
                        />
                        <input
                          type="text"
                          value={formData.apellidos}
                          onChange={(e) => handleInputChange("apellidos", e.target.value)}
                          className="w-full bg-gray-700/50 text-white border border-gray-600 rounded-lg px-3 py-2 text-center text-xl font-bold focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          placeholder="Apellidos"
                        />
                      </div>
                    ) : (
                      <h2 className="text-3xl font-bold text-white">
                        {datosEspecificos?.nombres} {datosEspecificos?.apellidos}
                      </h2>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Bio & Details */}
              <div className="lg:col-span-2 space-y-6">
                <div
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 shadow-xl animate-fade-in-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <div className="flex items-center justify-between mb-6">
                    {isEditing && (
                      <button
                        onClick={cancelarEdicion}
                        className="text-gray-400 hover:text-white transition-colors duration-300"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {error && isEditing && (
                    <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg flex items-center animate-shake">
                      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {/* Position Icon & Stats for Players */}
                  {tipoUsuario === "jugador" && (
                    <div className="mb-6 space-y-6">
                      {datosEspecificos?.posicion_principal && (
                        <div
                          className="flex flex-col items-center space-y-3 animate-fade-in-up"
                          style={{ animationDelay: "0.35s" }}
                        >
                          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-500/50 shadow-xl transform transition-all duration-500 hover:scale-110 hover:rotate-6">
                            <img
                              src={getPositionIcon(datosEspecificos.posicion_principal) || "/placeholder.svg"}
                              alt={datosEspecificos.posicion_principal}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-lg font-semibold text-white capitalize">
                            {getPositionName(datosEspecificos.posicion_principal)}
                          </p>
                        </div>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                        <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/20 border border-blue-500/30 rounded-xl p-4 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
                          <Trophy className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                          {loadingPosition ? (
                            <Loader2 className="h-6 w-6 animate-spin text-blue-400 mx-auto" />
                          ) : (
                            <p className="text-2xl font-bold text-white">{rankingPosition?.posicion_ranking || "-"}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">Ranking</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-600/20 to-green-500/20 border border-green-500/30 rounded-xl p-4 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
                          <Target className="h-6 w-6 text-green-400 mx-auto mb-2" />
                          {loadingStats ? (
                            <Loader2 className="h-6 w-6 animate-spin text-green-400 mx-auto" />
                          ) : (
                            <p className="text-2xl font-bold text-white">
                              {rankingStats?.totales_generales?.total_aciertos || "0"}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">Aciertos</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-600/20 to-purple-500/20 border border-purple-500/30 rounded-xl p-4 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">
                          <Award className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                          {loadingStats ? (
                            <Loader2 className="h-6 w-6 animate-spin text-purple-400 mx-auto" />
                          ) : (
                            <p className="text-2xl font-bold text-white">
                              {rankingStats?.totales_generales?.total_pruebas || "0"}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">Pruebas</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Usuario */}
                    <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                      <label className="text-sm text-gray-400 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Usuario
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.usuario}
                          onChange={(e) => handleInputChange("usuario", e.target.value)}
                          className="w-full bg-gray-700/50 text-white border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                      ) : (
                        <p className="text-white font-medium">{perfil.usuario}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                      <label className="text-sm text-gray-400 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {tipoUsuario === "entrenador" ? "Correo Electrónico" : "Correo Institucional"}
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={
                            tipoUsuario === "entrenador" ? formData.correo_electronico : formData.correo_institucional
                          }
                          onChange={(e) =>
                            handleInputChange(
                              tipoUsuario === "entrenador" ? "correo_electronico" : "correo_institucional",
                              e.target.value,
                            )
                          }
                          className="w-full bg-gray-700/50 text-white border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                      ) : (
                        <p className="text-white font-medium">
                          {tipoUsuario === "entrenador"
                            ? datosEspecificos?.correo_electronico || "-"
                            : datosEspecificos?.correo_institucional || "-"}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
                      <label className="text-sm text-gray-400 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Teléfono
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.numero_celular}
                          onChange={(e) => handleInputChange("numero_celular", e.target.value)}
                          className="w-full bg-gray-700/50 text-white border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                      ) : (
                        <p className="text-white font-medium">{datosEspecificos?.numero_celular || "-"}</p>
                      )}
                    </div>

                    {/* Age */}
                    <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
                      <label className="text-sm text-gray-400 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Edad
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={formData.fecha_nacimiento}
                          onChange={(e) => handleInputChange("fecha_nacimiento", e.target.value)}
                          className="w-full bg-gray-700/50 text-white border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                      ) : (
                        <p className="text-white font-medium">
                          {calcularEdad(datosEspecificos?.fecha_nacimiento)
                            ? `${calcularEdad(datosEspecificos?.fecha_nacimiento)} años`
                            : "-"}
                        </p>
                      )}
                    </div>

                    {/* Career - Only for jugador */}
                    {tipoUsuario === "jugador" && (
                      <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Carrera
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.carrera}
                            onChange={(e) => handleInputChange("carrera", e.target.value)}
                            className="w-full bg-gray-700/50 text-white border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          />
                        ) : (
                          <p className="text-white font-medium">{datosEspecificos?.carrera || "-"}</p>
                        )}
                      </div>
                    )}

                    {/* Experience - Only for entrenador and jugador */}
                    {(tipoUsuario === "entrenador" || tipoUsuario === "jugador") && (
                      <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.9s" }}>
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Años de Experiencia
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={formData.anos_experiencia_voley}
                            onChange={(e) => handleInputChange("anos_experiencia_voley", e.target.value)}
                            className="w-full bg-gray-700/50 text-white border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                          />
                        ) : (
                          <p className="text-white font-medium">
                            {datosEspecificos?.anos_experiencia_voley
                              ? `${datosEspecificos.anos_experiencia_voley} años`
                              : "-"}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Height - Only for jugador */}
                    {tipoUsuario === "jugador" && (
                      <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "1s" }}>
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Altura
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={formData.altura}
                            onChange={(e) => handleInputChange("altura", e.target.value)}
                            className="w-full bg-gray-700/50 text-white border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                            placeholder="1.75"
                          />
                        ) : (
                          <p className="text-white font-medium">
                            {datosEspecificos?.altura ? `${datosEspecificos.altura} m` : "-"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-8 flex justify-center animate-fade-in-up" style={{ animationDelay: "1.1s" }}>
                    <button
                      onClick={handleActualizarPerfil}
                      disabled={updating}
                      className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-2xl hover:shadow-red-500/50 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 group"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Guardando...
                        </>
                      ) : isEditing ? (
                        <>
                          <Save className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                          Guardar Cambios
                        </>
                      ) : (
                        <>
                          <Edit className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                          Editar Perfil
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
