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
} from "lucide-react"

export default function Perfil() {
  const { idUser, token, isAuthenticated } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notification, setNotification] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [updating, setUpdating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

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
        initializeFormData(data.data)
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
    const datosEspecificos = perfilData.jugador || perfilData.entrenador || perfilData.tecnico
    setFormData({
      usuario: perfilData.usuario || "",
      nombres: datosEspecificos?.nombres || "",
      apellidos: datosEspecificos?.apellidos || "",
      correo_electronico: datosEspecificos?.correo_electronico || "",
      correo_institucional: datosEspecificos?.correo_institucional || "",
      numero_celular: datosEspecificos?.numero_celular || "",
      fecha_nacimiento: datosEspecificos?.fecha_nacimiento ? datosEspecificos.fecha_nacimiento.split("T")[0] : "",
      carrera: datosEspecificos?.carrera || "",
      posicion_principal: datosEspecificos?.posicion_principal || "",
      altura: datosEspecificos?.altura || "",
      anos_experiencia_voley:
        datosEspecificos?.anos_experiencia_voley !== undefined
          ? datosEspecificos.anos_experiencia_voley.toString()
          : "",
      imagen: datosEspecificos?.imagen || "",
    })
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

  if (error && !perfil) {
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

  const tipoUsuario = perfil.rol
  const datosEspecificos = perfil.jugador || perfil.entrenador || perfil.tecnico

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="w-full">
        <div className="p-4 lg:p-6 max-w-full">
          <div className="max-w-4xl mx-auto">
           

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden backdrop-blur-sm">
              <div className="bg-gradient-to-r from-red-900 to-red-800 px-8 py-8">
                <div className="flex flex-col items-center space-y-4">
                  
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-white">
                      {isEditing ? (
                        <div className="flex gap-2 justify-center">
                          <input
                            type="text"
                            value={formData.nombres}
                            onChange={(e) => handleInputChange("nombres", e.target.value)}
                            className="bg-white/20 text-white placeholder-white/70 border border-white/30 rounded px-3 py-2 text-xl text-center"
                            placeholder="Nombres"
                          />
                          <input
                            type="text"
                            value={formData.apellidos}
                            onChange={(e) => handleInputChange("apellidos", e.target.value)}
                            className="bg-white/20 text-white placeholder-white/70 border border-white/30 rounded px-3 py-2 text-xl text-center"
                            placeholder="Apellidos"
                          />
                        </div>
                      ) : (
                        `${datosEspecificos?.nombres} ${datosEspecificos?.apellidos}`
                      )}
                    </h2>
                    <p className="text-red-100 text-lg font-medium capitalize mt-2">{tipoUsuario}</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {error && isEditing && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {isEditing && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                          {formData.imagen ? (
                            <img
                              src={formData.imagen || "/placeholder.svg"}
                              alt="Vista previa"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none"
                                e.target.nextSibling.style.display = "flex"
                              }}
                            />
                          ) : null}
                          <Camera
                            className="h-10 w-10 text-gray-400"
                            style={{ display: formData.imagen ? "none" : "block" }}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Camera className="h-4 w-4 inline mr-2" />
                          Imagen de perfil (opcional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          disabled={uploadingImage}
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 disabled:opacity-50"
                        />
                        <p className="text-xs text-gray-600 mt-2">
                          {uploadingImage ? "Cargando imagen..." : "Selecciona una imagen (JPG, PNG, GIF). Máximo 2MB."}
                        </p>
                        {formData.imagen && (
                          <button
                            type="button"
                            onClick={() => handleInputChange("imagen", "")}
                            className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Eliminar imagen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Información de la Cuenta
                    </h3>

                    <div className="space-y-4">
                      {!isEditing && (
                        <div className="flex justify-center mb-4">
                          <div className="w-40 h-40 md:w-60 md:h-60 lg:w-72 lg:h-72 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden border-4 border-gray-300 shadow-lg">
                            {datosEspecificos?.imagen ? (
                              <img
                                src={datosEspecificos.imagen || "/placeholder.svg"}
                                alt="Foto de perfil"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none"
                                  e.target.nextSibling.style.display = "flex"
                                }}
                              />
                            ) : null}
                            <User
                              className="h-20 w-20 text-gray-400"
                              style={{ display: datosEspecificos?.imagen ? "none" : "block" }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50/50 px-4 py-3 rounded-lg border border-blue-200/30">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800">Usuario</p>
                            {isEditing ? (
                              <input
                                type="text"
                                value={formData.usuario}
                                onChange={(e) => handleInputChange("usuario", e.target.value)}
                                className="w-full mt-1 px-2 py-1 border border-blue-300 rounded text-sm text-blue-700"
                              />
                            ) : (
                              <p className="text-sm text-blue-700">{perfil.usuario}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Información Personal
                    </h3>

                    <div className="space-y-4">
                      <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200/50">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {tipoUsuario === "entrenador" ? "Correo Electrónico" : "Correo Institucional"}
                            </p>
                            {isEditing ? (
                              <input
                                type="email"
                                value={
                                  tipoUsuario === "entrenador"
                                    ? formData.correo_electronico
                                    : formData.correo_institucional
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    tipoUsuario === "entrenador" ? "correo_electronico" : "correo_institucional",
                                    e.target.value,
                                  )
                                }
                                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-700"
                              />
                            ) : (
                              <p className="text-sm text-gray-700">
                                {tipoUsuario === "entrenador"
                                  ? datosEspecificos?.correo_electronico
                                  : datosEspecificos?.correo_institucional}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200/50">
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">Teléfono</p>
                            {isEditing ? (
                              <input
                                type="tel"
                                value={formData.numero_celular}
                                onChange={(e) => handleInputChange("numero_celular", e.target.value)}
                                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-700"
                              />
                            ) : (
                              <p className="text-sm text-gray-700">{datosEspecificos?.numero_celular}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200/50">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">Edad</p>
                            {isEditing ? (
                              <input
                                type="date"
                                value={formData.fecha_nacimiento}
                                onChange={(e) => handleInputChange("fecha_nacimiento", e.target.value)}
                                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-700"
                              />
                            ) : (
                              <p className="text-sm text-gray-700">
                                {calcularEdad(datosEspecificos?.fecha_nacimiento)} años
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {tipoUsuario === "jugador" && (
                        <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200/50">
                          <div className="flex items-center space-x-3">
                            <GraduationCap className="h-5 w-5 text-gray-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">Carrera</p>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={formData.carrera}
                                  onChange={(e) => handleInputChange("carrera", e.target.value)}
                                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-700"
                                />
                              ) : (
                                <p className="text-sm text-gray-700">{datosEspecificos?.carrera}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {(tipoUsuario === "entrenador" || tipoUsuario === "jugador") && (
                        <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200/50">
                          <div className="flex items-center space-x-3">
                            <Shield className="h-5 w-5 text-gray-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">Años de Experiencia en Voleibol</p>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={formData.anos_experiencia_voley}
                                  onChange={(e) => handleInputChange("anos_experiencia_voley", e.target.value)}
                                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-700"
                                />
                              ) : (
                                <p className="text-sm text-gray-700">{datosEspecificos?.anos_experiencia_voley} años</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <button
                    onClick={handleActualizarPerfil}
                    disabled={updating}
                    className="px-6 py-3 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl hover:from-red-800 hover:to-red-900 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : isEditing ? (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar Cambios
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4" />
                        Actualizar Perfil
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
  )
}
