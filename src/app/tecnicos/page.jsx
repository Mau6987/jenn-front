"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserPlus,
  Filter,
  Users,
} from "lucide-react"
import { useAuth } from "../../contexts/auth-context"

export default function TecnicosPage() {
  const router = useRouter()
  const [tecnicos, setTecnicos] = useState([])
  const [tecnicosFiltrados, setTecnicosFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState("create")
  const [selectedTecnico, setSelectedTecnico] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [notification, setNotification] = useState({ show: false, type: "", message: "" })
  const [validationErrors, setValidationErrors] = useState({})

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)

  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    fecha_nacimiento: "",
    numero_celular: "",
    correo_institucional: "",
    usuario: "",
    contraseña: "",
  })

  const { user } = useAuth()

  useEffect(() => {
    fetchTecnicos()
  }, [])

  useEffect(() => {
    filtrarTecnicos()
  }, [searchTerm, tecnicos])

  const filtrarTecnicos = () => {
    let filtrados = tecnicos

    if (searchTerm.trim() !== "") {
      filtrados = filtrados.filter(
        (tecnico) =>
          tecnico.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tecnico.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${tecnico.nombres} ${tecnico.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tecnico.correo_institucional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tecnico.usuario?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setTecnicosFiltrados(filtrados)
    setCurrentPage(1)
  }

  const fetchTecnicos = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch("https://jenn-back-reac.onrender.com/api/cuentas", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar técnicos")
      }

      const tecnicosData =
        data.data
          ?.filter((cuenta) => cuenta.rol === "tecnico")
          .map((cuenta) => ({
            id: cuenta.id,
            usuario: cuenta.usuario,
            rol: cuenta.rol,
            activo: cuenta.activo,
            nombres: cuenta.tecnico?.nombres || "",
            apellidos: cuenta.tecnico?.apellidos || "",
            fecha_nacimiento: cuenta.tecnico?.fecha_nacimiento || "",
            numero_celular: cuenta.tecnico?.numero_celular || "",
            correo_institucional: cuenta.tecnico?.correo_institucional || "",
          })) || []

      setTecnicos(tecnicosData)
      setTecnicosFiltrados(tecnicosData)
      setError("")
    } catch (error) {
      console.error("Error fetching técnicos:", error)
      setError(error.message)
      if (error.message.includes("token") || error.message.includes("unauthorized")) {
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      const submitData = {
        ...formData,
        rol: "tecnico",
      }

      const baseUrl = "https://jenn-back-reac.onrender.com/api/cuentas"
      const url = formMode === "create" ? baseUrl : `${baseUrl}/${selectedTecnico.id}`
      const method = formMode === "create" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al procesar la solicitud")
      }

      if (data.success) {
        showNotification(
          "success",
          formMode === "create" ? "Técnico creado exitosamente" : "Técnico actualizado exitosamente",
        )
        setShowForm(false)
        setSelectedTecnico(null)
        await fetchTecnicos()
      } else {
        throw new Error(data.message || "Error al procesar la solicitud")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.nombres.trim()) {
      errors.nombres = "Los nombres son obligatorios"
    } else if (formData.nombres.length < 2 || formData.nombres.length > 50) {
      errors.nombres = "Los nombres deben tener entre 2 y 50 caracteres"
    }

    if (!formData.apellidos.trim()) {
      errors.apellidos = "Los apellidos son obligatorios"
    } else if (formData.apellidos.length < 2 || formData.apellidos.length > 50) {
      errors.apellidos = "Los apellidos deben tener entre 2 y 50 caracteres"
    }

    if (!formData.fecha_nacimiento) {
      errors.fecha_nacimiento = "La fecha de nacimiento es obligatoria"
    } else {
      const birthDate = new Date(formData.fecha_nacimiento)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (age < 18 || age > 70) {
        errors.fecha_nacimiento = "La edad debe estar entre 18 y 70 años"
      }
    }

    if (!formData.numero_celular.trim()) {
      errors.numero_celular = "El número de celular es obligatorio"
    } else if (!/^\d{8,15}$/.test(formData.numero_celular)) {
      errors.numero_celular = "El número debe tener entre 8 y 15 dígitos"
    }

    if (!formData.correo_institucional.trim()) {
      errors.correo_institucional = "El correo institucional es obligatorio"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_institucional)) {
      errors.correo_institucional = "Formato de correo inválido"
    }

    if (!formData.usuario.trim()) {
      errors.usuario = "El usuario es obligatorio"
    } else if (formData.usuario.length < 3 || formData.usuario.length > 20) {
      errors.usuario = "El usuario debe tener entre 3 y 20 caracteres"
    }

    if (formMode === "create" && !formData.contraseña.trim()) {
      errors.contraseña = "La contraseña es obligatoria"
    } else if (formData.contraseña && formData.contraseña.length < 6) {
      errors.contraseña = "La contraseña debe tener al menos 6 caracteres"
    }

    return errors
  }

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" })
    }, 5000)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`https://jenn-back-reac.onrender.com/api/cuentas/${selectedTecnico.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al eliminar técnico")
      }

      if (data.success) {
        showNotification("success", "Técnico eliminado exitosamente")
        setShowDeleteModal(false)
        await fetchTecnicos()
        setError("")
      } else {
        throw new Error(data.message || "Error al eliminar técnico")
      }
    } catch (error) {
      console.error("Error deleting técnico:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewTecnico = (tecnico) => {
    setSelectedTecnico(tecnico)
    setFormData({
      nombres: tecnico.nombres || "",
      apellidos: tecnico.apellidos || "",
      fecha_nacimiento: tecnico.fecha_nacimiento ? tecnico.fecha_nacimiento.split("T")[0] : "",
      numero_celular: tecnico.numero_celular || "",
      correo_institucional: tecnico.correo_institucional || "",
      usuario: tecnico.usuario || "",
      contraseña: "",
    })
    setFormMode("view")
    setShowForm(true)
  }

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = tecnicosFiltrados.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(tecnicosFiltrados.length / itemsPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50">
      {/* Notificación emergente */}
      {notification.show && (
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
              onClick={() => setNotification({ show: false, type: "", message: "" })}
              className={`ml-4 ${notification.type === "success" ? "text-green-600 hover:text-green-800" : "text-red-600 hover:text-red-800"}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full">
        <div className="p-4 lg:p-6 max-w-full">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-10 text-center animate-fade-in-up">
              <h1 className="text-5xl font-black bg-gradient-to-r from-red-900 via-red-700 to-red-900 bg-clip-text text-transparent mb-3 tracking-tight">
                Técnicos
              </h1>
              <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-red-800 to-transparent mx-auto mb-4 rounded-full"></div>
              <p className="text-gray-600 text-base font-medium">
                Gestiona el personal técnico del equipo de volleyball
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-all duration-200" />
              <input
                type="text"
                placeholder="Buscar técnicos por nombre, email o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-300 shadow-sm hover:shadow-md bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <button
                onClick={() => {
                  setFormMode("create")
                  setFormData({
                    nombres: "",
                    apellidos: "",
                    fecha_nacimiento: "",
                    numero_celular: "",
                    correo_institucional: "",
                    usuario: "",
                    contraseña: "",
                  })
                  setValidationErrors({})
                  setShowForm(true)
                }}
                className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-xl hover:from-green-800 hover:to-green-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                <UserPlus className="h-5 w-5" />
                <span>Agregar nuevo</span>
              </button>
             
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 text-red-800 px-6 py-4 rounded-2xl mb-8 flex items-center shadow-lg animate-scale-in">
                <div className="h-10 w-10 rounded-full bg-red-200 flex items-center justify-center mr-4">
                  <AlertCircle className="h-6 w-6 text-red-700" />
                </div>
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden backdrop-blur-sm">
              {loading && !showForm && !showDeleteModal ? (
                <div className="p-16 text-center">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-red-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-red-900 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-700 font-bold text-lg">Cargando técnicos...</p>
                </div>
              ) : tecnicosFiltrados.length === 0 ? (
                <div className="p-16 text-center animate-scale-in">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {searchTerm ? "No se encontraron técnicos" : "No hay técnicos registrados"}
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg">
                    {searchTerm
                      ? "Intenta con otros términos de búsqueda."
                      : "Comienza agregando tu primer técnico al sistema."}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => {
                        setFormMode("create")
                        setFormData({
                          nombres: "",
                          apellidos: "",
                          fecha_nacimiento: "",
                          numero_celular: "",
                          correo_institucional: "",
                          usuario: "",
                          contraseña: "",
                        })
                        setValidationErrors({})
                        setShowForm(true)
                      }}
                      className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-2xl hover:from-green-800 hover:to-green-700 transition-all duration-300 font-bold mx-auto shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      <UserPlus className="h-5 w-5" />
                      <span>Agregar primer técnico</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {currentItems.map((tecnico, index) => (
                      <div
                        key={tecnico.id}
                        className="bg-white border-3 border-red-900 rounded-3xl overflow-hidden hover:border-red-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-2"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex p-6 gap-5">
                          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 border-3 border-red-200 shadow-md">
                            <Users className="h-14 w-14 text-gray-400" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black text-gray-900 leading-tight mb-2 truncate">
                              {tecnico.nombres} {tecnico.apellidos}
                            </h3>
                            <p className="text-sm text-red-800 font-bold capitalize mb-4 bg-red-50 px-3 py-1 rounded-lg inline-block">
                              Personal técnico
                            </p>

                            <div className="space-y-2.5">
                              <div className="flex items-center text-xs">
                                <Users className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                                <span className="text-gray-700 font-bold truncate">{tecnico.usuario}</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <span className="text-gray-500 mr-2 text-base">📞</span>
                                <span className="text-gray-700 font-semibold truncate">{tecnico.numero_celular}</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <span className="text-gray-500 mr-2 text-base">📧</span>
                                <span className="text-gray-700 font-semibold truncate">
                                  {tecnico.correo_institucional}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-around px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
                          <button
                            onClick={() => handleViewTecnico(tecnico)}
                            className="flex items-center space-x-2 px-4 py-2.5 text-blue-700 hover:bg-blue-100 rounded-xl transition-all duration-200 text-sm font-bold"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver</span>
                          </button>
                          <button
                            onClick={() => {
                              setFormMode("update")
                              setSelectedTecnico(tecnico)
                              setFormData({
                                nombres: tecnico.nombres || "",
                                apellidos: tecnico.apellidos || "",
                                fecha_nacimiento: tecnico.fecha_nacimiento
                                  ? tecnico.fecha_nacimiento.split("T")[0]
                                  : "",
                                numero_celular: tecnico.numero_celular || "",
                                correo_institucional: tecnico.correo_institucional || "",
                                usuario: tecnico.usuario || "",
                                contraseña: "",
                              })
                              setValidationErrors({})
                              setShowForm(true)
                            }}
                            className="flex items-center space-x-2 px-4 py-2.5 text-yellow-700 hover:bg-yellow-100 rounded-xl transition-all duration-200 text-sm font-bold"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTecnico(tecnico)
                              setShowDeleteModal(true)
                            }}
                            className="flex items-center space-x-2 px-4 py-2.5 text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 text-sm font-bold"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 px-8 py-8 border-t-2 border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-800 font-bold bg-white px-6 py-3 rounded-xl shadow-md border-2 border-gray-200">
                          Mostrando <span className="font-black text-red-900">{indexOfFirstItem + 1}</span> a{" "}
                          <span className="font-black text-red-900">
                            {Math.min(indexOfLastItem, tecnicosFiltrados.length)}
                          </span>{" "}
                          de <span className="font-black text-red-900">{tecnicosFiltrados.length}</span> técnicos
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`px-5 py-3 rounded-xl text-sm font-black transition-all duration-300 ${
                              currentPage === 1
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-white text-gray-800 hover:bg-red-900 hover:text-white border-2 border-gray-300 hover:border-red-900 transform hover:scale-105 shadow-md hover:shadow-xl"
                            }`}
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>

                          <div className="flex items-center space-x-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let page
                              if (totalPages <= 5) {
                                page = i + 1
                              } else if (currentPage <= 3) {
                                page = i + 1
                              } else if (currentPage >= totalPages - 2) {
                                page = totalPages - 4 + i
                              } else {
                                page = currentPage - 2 + i
                              }

                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-5 py-3 rounded-xl text-sm font-black transition-all duration-300 transform hover:scale-105 ${
                                    currentPage === page
                                      ? "bg-gradient-to-r from-red-900 to-red-800 text-white shadow-xl scale-110"
                                      : "bg-white text-gray-800 hover:bg-red-900 hover:text-white border-2 border-gray-300 hover:border-red-900 shadow-md hover:shadow-xl"
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            })}
                          </div>

                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-5 py-3 rounded-xl text-sm font-black transition-all duration-300 ${
                              currentPage === totalPages
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-white text-gray-800 hover:bg-red-900 hover:text-white border-2 border-gray-300 hover:border-red-900 transform hover:scale-105 shadow-md hover:shadow-xl"
                            }`}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-gray-100 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-red-900 to-red-800 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {formMode === "create" && "Agregar Nuevo Técnico"}
                    {formMode === "update" && "Editar Técnico"}
                    {formMode === "view" && "Detalles del Técnico"}
                  </h2>
                  <p className="text-red-100 text-sm mt-1">
                    {formMode === "create" && "Completa la información del nuevo técnico"}
                    {formMode === "update" && "Modifica la información del técnico"}
                    {formMode === "view" && "Información completa del técnico"}
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-red-100 hover:text-white transition-colors p-2 hover:bg-red-800 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Nombres *
                      </label>
                      <input
                        type="text"
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleInputChange}
                        placeholder="Ej: Juan Carlos"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                          validationErrors.nombres
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        required={formMode !== "view"}
                        disabled={formMode === "view"}
                      />
                      {validationErrors.nombres ? (
                        <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.nombres}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm mt-1">Entre 2 y 50 caracteres</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleInputChange}
                        placeholder="Ej: García López"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                          validationErrors.apellidos
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        required={formMode !== "view"}
                        disabled={formMode === "view"}
                      />
                      {validationErrors.apellidos ? (
                        <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.apellidos}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm mt-1">Entre 2 y 50 caracteres</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Usuario *
                      </label>
                      <input
                        type="text"
                        name="usuario"
                        value={formData.usuario}
                        onChange={handleInputChange}
                        placeholder="Ej: jgarcia"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                          validationErrors.usuario
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        required={formMode !== "view"}
                        disabled={formMode === "view"}
                      />
                      {validationErrors.usuario ? (
                        <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.usuario}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm mt-1">Entre 3 y 20 caracteres, sin espacios</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Fecha de Nacimiento *
                      </label>
                      <input
                        type="date"
                        name="fecha_nacimiento"
                        value={formData.fecha_nacimiento}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                          validationErrors.fecha_nacimiento
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        required={formMode !== "view"}
                        disabled={formMode === "view"}
                      />
                      {validationErrors.fecha_nacimiento ? (
                        <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.fecha_nacimiento}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm mt-1">Edad debe estar entre 18 y 70 años</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Correo Institucional *
                      </label>
                      <input
                        type="email"
                        name="correo_institucional"
                        value={formData.correo_institucional}
                        onChange={handleInputChange}
                        placeholder="Ej: juan.garcia@universidad.edu"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                          validationErrors.correo_institucional
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        required={formMode !== "view"}
                        disabled={formMode === "view"}
                      />
                      {validationErrors.correo_institucional ? (
                        <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.correo_institucional}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm mt-1">Formato: usuario@dominio.com</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Número de Celular *
                      </label>
                      <input
                        type="tel"
                        name="numero_celular"
                        value={formData.numero_celular}
                        onChange={handleInputChange}
                        placeholder="Ej: 71234567"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                          validationErrors.numero_celular
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        required={formMode !== "view"}
                        disabled={formMode === "view"}
                      />
                      {validationErrors.numero_celular ? (
                        <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.numero_celular}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm mt-1">Entre 8 y 15 dígitos, solo números</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {formMode === "create"
                        ? "Contraseña *"
                        : formMode === "update"
                          ? "Nueva contraseña (opcional)"
                          : "Contraseña"}
                    </label>
                    <input
                      type={formMode === "view" ? "text" : "password"}
                      name="contraseña"
                      value={formData.contraseña}
                      onChange={handleInputChange}
                      placeholder={
                        formMode === "create"
                          ? "Mínimo 6 caracteres"
                          : formMode === "update"
                            ? "Dejar en blanco para mantener la actual"
                            : "Contraseña"
                      }
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                        validationErrors.contraseña
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      required={formMode === "create"}
                      disabled={formMode === "view"}
                    />
                    {validationErrors.contraseña ? (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.contraseña}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-sm mt-1">
                        {formMode === "create"
                          ? "Mínimo 6 caracteres"
                          : formMode === "update"
                            ? "Dejar vacío para mantener contraseña actual"
                            : "Contraseña"}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {formMode === "view" ? "Cerrar" : "Cancelar"}
                    </button>
                    {formMode !== "view" && (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl hover:from-red-800 hover:to-red-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                        <span>{formMode === "create" ? "Crear Técnico" : "Actualizar Técnico"}</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Confirmar eliminación</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                ¿Estás seguro de que deseas eliminar al técnico{" "}
                <span className="font-bold text-gray-900">
                  {selectedTecnico?.nombres} {selectedTecnico?.apellidos}
                </span>
                ? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
