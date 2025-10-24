"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  UserPlus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Filter,
  Users,
  Camera,
} from "lucide-react"

export default function EntrenadoresPage() {
  const router = useRouter()
  const [entrenadores, setEntrenadores] = useState([])
  const [entrenadoresFiltrados, setEntrenadoresFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busqueda, setBusqueda] = useState("")

  // Estados para el formulario
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState("create")
  const [selectedEntrenador, setSelectedEntrenador] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Estado para notificaciones
  const [notification, setNotification] = useState(null)

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    fecha_nacimiento: "",
    anos_experiencia_voley: "",
    numero_celular: "",
    correo_electronico: "",
    usuario: "",
    contraseña: "",
    imagen: "", // Added imagen field
  })

  const [validationErrors, setValidationErrors] = useState({})

  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchEntrenadores()
  }, [])

  useEffect(() => {
    filtrarEntrenadores()
  }, [busqueda, entrenadores])

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const filtrarEntrenadores = () => {
    let filtrados = entrenadores

    if (busqueda.trim() !== "") {
      filtrados = filtrados.filter(
        (entrenador) =>
          entrenador.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
          entrenador.apellidos?.toLowerCase().includes(busqueda.toLowerCase()) ||
          `${entrenador.nombres} ${entrenador.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
          entrenador.correo_electronico?.toLowerCase().includes(busqueda.toLowerCase()) ||
          entrenador.usuario?.toLowerCase().includes(busqueda.toLowerCase()),
      )
    }

    setEntrenadoresFiltrados(filtrados)
    setCurrentPage(1)
  }

  const fetchEntrenadores = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const response = await fetch("https://jenn-back-reac.onrender.com/api/cuentas", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar entrenadores")
      }

      if (data.success) {
        const entrenadores = data.data
          .filter((cuenta) => cuenta.rol === "entrenador" && cuenta.entrenador)
          .map((cuenta) => ({
            ...cuenta.entrenador,
            id: cuenta.entrenador.id,
            usuario: cuenta.usuario,
            cuentaId: cuenta.id,
            imagen: cuenta.entrenador.imagen || "", // Added imagen field
          }))

        setEntrenadores(entrenadores)
        setEntrenadoresFiltrados(entrenadores)
        setError("")
      } else {
        throw new Error(data.message || "Error al cargar entrenadores")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error al cargar los entrenadores. Intente nuevamente.")
      if (error.message.includes("401") || error.message.includes("token")) {
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleOpenCreateForm = () => {
    setFormData({
      nombres: "",
      apellidos: "",
      fecha_nacimiento: "",
      anos_experiencia_voley: "",
      numero_celular: "",
      correo_electronico: "",
      usuario: "",
      contraseña: "",
      imagen: "", // Added imagen field
    })
    setFormMode("create")
    setShowForm(true)
  }

  const handleViewEntrenador = (entrenador) => {
    setSelectedEntrenador(entrenador)
    setFormData({
      nombres: entrenador.nombres || "",
      apellidos: entrenador.apellidos || "",
      fecha_nacimiento: entrenador.fecha_nacimiento ? entrenador.fecha_nacimiento.split("T")[0] : "",
      anos_experiencia_voley: entrenador.anos_experiencia_voley || "",
      numero_celular: entrenador.numero_celular || "",
      correo_electronico: entrenador.correo_electronico || "",
      usuario: entrenador.usuario || "",
      contraseña: "",
      imagen: entrenador.imagen || "", // Added imagen field
    })
    setFormMode("view")
    setShowForm(true)
  }

  const handleOpenEditForm = (entrenador) => {
    setSelectedEntrenador(entrenador)
    setFormData({
      nombres: entrenador.nombres || "",
      apellidos: entrenador.apellidos || "",
      fecha_nacimiento: entrenador.fecha_nacimiento ? entrenador.fecha_nacimiento.split("T")[0] : "",
      anos_experiencia_voley: entrenador.anos_experiencia_voley || "",
      numero_celular: entrenador.numero_celular || "",
      correo_electronico: entrenador.correo_electronico || "",
      usuario: entrenador.usuario || "",
      contraseña: "",
      imagen: entrenador.imagen || "", // Added imagen field
    })
    setFormMode("update")
    setShowForm(true)
  }

  const validateForm = () => {
    const errors = {}

    // Validate nombres
    if (!formData.nombres.trim()) {
      errors.nombres = "Los nombres son requeridos"
    } else if (formData.nombres.trim().length < 2) {
      errors.nombres = "Los nombres deben tener al menos 2 caracteres"
    }

    // Validate apellidos
    if (!formData.apellidos.trim()) {
      errors.apellidos = "Los apellidos son requeridos"
    } else if (formData.apellidos.trim().length < 2) {
      errors.apellidos = "Los apellidos deben tener al menos 2 caracteres"
    }

    // Validate fecha_nacimiento and calculate age
    if (!formData.fecha_nacimiento) {
      errors.fecha_nacimiento = "La fecha de nacimiento es requerida"
    } else {
      const birthDate = new Date(formData.fecha_nacimiento)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (age < 25 || age > 70) {
        errors.fecha_nacimiento = "La edad debe estar entre 25 y 70 años"
      }
    }

    // Validate anos_experiencia_voley
    if (!formData.anos_experiencia_voley) {
      errors.anos_experiencia_voley = "Los años de experiencia son requeridos"
    } else {
      const experiencia = Number.parseInt(formData.anos_experiencia_voley)
      if (experiencia < 1 || experiencia > 40) {
        errors.anos_experiencia_voley = "Los años de experiencia deben estar entre 1 y 40"
      }
    }

    // Validate numero_celular
    if (!formData.numero_celular.trim()) {
      errors.numero_celular = "El número de celular es requerido"
    } else if (!/^\d{8,15}$/.test(formData.numero_celular.replace(/\s/g, ""))) {
      errors.numero_celular = "El número de celular debe tener entre 8 y 15 dígitos"
    }

    // Validate correo_electronico
    if (!formData.correo_electronico.trim()) {
      errors.correo_electronico = "El correo electrónico es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_electronico)) {
      errors.correo_electronico = "El formato del correo electrónico no es válido"
    }

    // Validate usuario
    if (!formData.usuario.trim()) {
      errors.usuario = "El usuario es requerido"
    } else if (formData.usuario.trim().length < 3) {
      errors.usuario = "El usuario debe tener al menos 3 caracteres"
    }

    // Validate contraseña
    if (formMode === "create" && !formData.contraseña) {
      errors.contraseña = "La contraseña es requerida"
    } else if (formData.contraseña && formData.contraseña.length < 6) {
      errors.contraseña = "La contraseña debe tener al menos 6 caracteres"
    }

    // Validate imagen URL (optional, but good practice)
    if (formData.imagen && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(formData.imagen)) {
      errors.imagen = "La URL de la imagen no es válida"
    }

    return errors
  }

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        reject(new Error("La imagen debe ser menor a 2MB"))
        return
      }

      // Validate file type
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
      setFormData({
        ...formData,
        imagen: base64,
      })
      showNotification("success", "Imagen cargada correctamente")
    } catch (error) {
      showNotification("error", error.message || "Error al cargar la imagen")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errors = validateForm()
    setValidationErrors(errors)

    if (Object.keys(errors).length > 0) {
      showNotification("error", "Por favor corrige los errores en el formulario")
      return
    }

    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      const requestData = {
        ...formData,
        rol: "entrenador",
      }

      const baseUrl = "https://jenn-back-reac.onrender.com/api/cuentas"
      const url = formMode === "create" ? baseUrl : `${baseUrl}/${selectedEntrenador.cuentaId}`
      const method = formMode === "create" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err) => err.msg).join(", ")
          throw new Error(errorMessages)
        }
        throw new Error(data.message || "Error al procesar la solicitud")
      }

      if (data.success) {
        showNotification(
          "success",
          formMode === "create" ? "Entrenador creado exitosamente" : "Entrenador actualizado exitosamente",
        )
        setShowForm(false)
        setSelectedEntrenador(null)
        await fetchEntrenadores()
      } else {
        throw new Error(data.message || "Error al procesar la solicitud")
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message || "Error al procesar la solicitud")
      showNotification("error", error.message || "Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEntrenador = (entrenador) => {
    setSelectedEntrenador(entrenador)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(
        `https://jenn-back-reac.onrender.com/api/cuentas/${selectedEntrenador.cuentaId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al eliminar entrenador")
      }

      if (data.success) {
        showNotification("success", "Entrenador eliminado exitosamente")
        setShowDeleteModal(false)
        await fetchEntrenadores()
        setError("")
      } else {
        throw new Error(data.message || "Error al eliminar entrenador")
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message || "Error al eliminar entrenador")
      showNotification("error", error.message || "Error al eliminar entrenador")
    } finally {
      setLoading(false)
      setSelectedEntrenador(null)
    }
  }

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = entrenadoresFiltrados.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(entrenadoresFiltrados.length / itemsPerPage)

  const handleEdit = (entrenador) => {
    handleOpenEditForm(entrenador)
  }

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
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Entrenadores</h1>
                <p className="text-gray-600 text-sm">Gestiona los entrenadores de la selección de volleyball</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar entrenadores por nombre, email o usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={handleOpenCreateForm}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-700/80 text-white rounded-lg hover:bg-green-800/90 transition-colors font-medium"
                disabled={loading}
              >
                <UserPlus className="h-4 w-4" />
                <span>Agregar nuevo</span>
              </button>
              <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                <Filter className="h-4 w-4" />
                <span>Filtrar</span>
              </button>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden backdrop-blur-sm">
              {loading && !showForm && !showDeleteModal ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Cargando entrenadores...</p>
                </div>
              ) : entrenadoresFiltrados.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    {busqueda ? "No se encontraron entrenadores" : "No hay entrenadores registrados"}
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {busqueda
                      ? "Intenta con otros términos de búsqueda."
                      : "Comienza agregando tu primer entrenador al sistema."}
                  </p>
                  {!busqueda && (
                    <button
                      onClick={handleOpenCreateForm}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-700/80 to-green-800/80 text-white rounded-xl hover:from-green-800/90 hover:to-green-900/90 transition-all duration-300 font-medium mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Agregar primer entrenador</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="bg-slate-600 px-8 py-6 border-2 border-gray-900 relative overflow-hidden">
                    <div className="relative grid grid-cols-12 gap-6 text-sm font-bold text-white uppercase tracking-wider">
                      <div className="col-span-3 flex items-center space-x-2">
                        <div className="w-1 h-6 bg-white rounded-full"></div>
                        <span>Entrenador</span>
                      </div>
                      <div className="col-span-2 flex items-center space-x-2">
                        <div className="w-1 h-6 bg-white rounded-full"></div>
                        <span>Usuario</span>
                      </div>
                      <div className="col-span-2 flex items-center space-x-2">
                        <div className="w-1 h-6 bg-white rounded-full"></div>
                        <span>Contacto</span>
                      </div>

                      <div className="col-span-2 flex items-center space-x-2">
                        <div className="w-1 h-6 bg-white rounded-full"></div>
                        <span>Experiencia</span>
                      </div>
                      <div className="col-span-1 text-center flex items-center justify-center space-x-2">
                        <div className="w-1 h-6 bg-white rounded-full"></div>
                        <span>Acciones</span>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100/80">
                    {currentItems.map((entrenador, index) => (
                      <div
                        key={entrenador.id}
                        className={`px-8 py-6 hover:bg-gradient-to-r hover:from-red-50/30 hover:to-red-50/10 transition-all duration-300 transform hover:scale-[1.002] hover:shadow-sm group ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        } border-l-4 border-transparent hover:border-l-red-400`}
                      >
                        <div className="grid grid-cols-12 gap-6 items-center">
                          <div className="col-span-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {entrenador.imagen ? (
                                  <img
                                    src={entrenador.imagen || "/placeholder.svg"}
                                    alt={`${entrenador.nombres} ${entrenador.apellidos}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = "none"
                                      e.target.nextSibling.style.display = "flex"
                                    }}
                                  />
                                ) : null}
                                <Users
                                  className="h-5 w-5 text-gray-400"
                                  style={{ display: entrenador.imagen ? "none" : "block" }}
                                />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                                  {entrenador.nombres} {entrenador.apellidos}
                                </p>
                                <p className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md mt-1 font-medium">
                                  {entrenador.edad} años
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="col-span-2">
                            <div className="bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-200/30">
                              <p className="text-sm font-semibold text-blue-800">{entrenador.usuario}</p>
                            </div>
                          </div>

                          <div className="col-span-2">
                            <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/50">
                              <p className="text-sm font-bold text-slate-800">{entrenador.numero_celular}</p>
                            </div>
                          </div>

                          <div className="col-span-2">
                            <div className="bg-red-50/80 px-3 py-2 rounded-lg border border-red-200/50 text-center">
                              <p className="text-sm font-bold text-red-800">{entrenador.anos_experiencia_voley}</p>
                              <p className="text-xs text-red-600 font-medium">años exp.</p>
                            </div>
                          </div>

                          <div className="col-span-1">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleViewEntrenador(entrenador)}
                                className="p-2.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-300 border border-blue-200 hover:border-blue-300 hover:shadow-sm group/btn"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(entrenador)}
                                className="p-2.5 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 rounded-xl transition-all duration-300 border border-yellow-200 hover:border-yellow-300 hover:shadow-sm group/btn"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEntrenador(entrenador)}
                                className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 border border-red-200 hover:border-red-300 hover:shadow-sm group/btn"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-700 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                          Mostrando <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> a{" "}
                          <span className="font-bold text-slate-900">
                            {Math.min(indexOfLastItem, entrenadoresFiltrados.length)}
                          </span>{" "}
                          de <span className="font-bold text-slate-900">{entrenadoresFiltrados.length}</span>{" "}
                          entrenadores
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                              currentPage === 1
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-white text-slate-700 hover:bg-slate-800 hover:text-white border-2 border-slate-200 hover:border-slate-800 transform hover:scale-105 shadow-md hover:shadow-lg"
                            }`}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>

                          <div className="flex items-center space-x-1">
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
                                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                                    currentPage === page
                                      ? "bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg"
                                      : "bg-white text-slate-700 hover:bg-slate-800 hover:text-white border-2 border-slate-200 hover:border-slate-800 shadow-md hover:shadow-lg"
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
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                              currentPage === totalPages
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-white text-slate-700 hover:bg-slate-800 hover:text-white border-2 border-slate-200 hover:border-slate-800 transform hover:scale-105 shadow-md hover:shadow-lg"
                            }`}
                          >
                            <ChevronRight className="h-4 w-4" />
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

      {/* Modal para crear/editar/ver entrenador */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-gray-100 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-red-900 to-red-800 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {formMode === "create" && "Agregar Nuevo Entrenador"}
                    {formMode === "update" && "Editar Entrenador"}
                    {formMode === "view" && "Detalles del Entrenador"}
                  </h2>
                  <p className="text-red-100 text-sm mt-1">
                    {formMode === "create" && "Completa la información del nuevo entrenador"}
                    {formMode === "update" && "Modifica la información del entrenador"}
                    {formMode === "view" && "Información completa del entrenador"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setSelectedEntrenador(null)
                  }}
                  className="text-red-100 hover:text-white transition-colors p-2 hover:bg-red-800 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="p-8">
                {formMode === "view" ? (
                  // Vista de detalles (solo lectura)
                  <div className="space-y-8">
                    <div className="flex justify-center mb-6">
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300 shadow-lg">
                        {formData.imagen ? (
                          <img
                            src={formData.imagen || "/placeholder.svg"}
                            alt="Foto de perfil"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none"
                              e.target.nextSibling.style.display = "flex"
                            }}
                          />
                        ) : null}
                        <Users
                          className="h-16 w-16 text-gray-400"
                          style={{ display: formData.imagen ? "none" : "block" }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Nombres
                        </label>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-xl border border-gray-200">
                          <p className="text-gray-900 font-medium">{formData.nombres}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Apellidos
                        </label>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-xl border border-gray-200">
                          <p className="text-gray-900 font-medium">{formData.apellidos}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Usuario
                        </label>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-xl border border-gray-200">
                          <p className="text-gray-900 font-medium">{formData.usuario}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Fecha de Nacimiento
                        </label>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-xl border border-gray-200">
                          <p className="text-gray-900 font-medium">{formData.fecha_nacimiento}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Correo Electrónico
                        </label>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-xl border border-gray-200">
                          <p className="text-gray-900 font-medium">{formData.correo_electronico}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Número de Celular
                        </label>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-xl border border-gray-200">
                          <p className="text-gray-900 font-medium">{formData.numero_celular}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Años de Experiencia en Vóley
                      </label>
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-xl border border-gray-200">
                        <p className="text-gray-900 font-medium">{formData.anos_experiencia_voley} años</p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowForm(false)
                          setSelectedEntrenador(null)
                        }}
                        className="px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Formulario para crear o editar
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
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
                            {uploadingImage
                              ? "Cargando imagen..."
                              : "Selecciona una imagen (JPG, PNG, GIF). Máximo 2MB."}
                          </p>
                          {formData.imagen && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  imagen: "",
                                })
                              }
                              className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Eliminar imagen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

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
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                            validationErrors.nombres
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          required
                        />
                        {validationErrors.nombres && (
                          <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.nombres}
                          </p>
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
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                            validationErrors.apellidos
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          required
                        />
                        {validationErrors.apellidos && (
                          <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.apellidos}
                          </p>
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
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                            validationErrors.usuario
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          required
                        />
                        {validationErrors.usuario && (
                          <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.usuario}
                          </p>
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
                          required
                        />
                        {validationErrors.fecha_nacimiento && (
                          <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.fecha_nacimiento}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Correo Electrónico *
                        </label>
                        <input
                          type="email"
                          name="correo_electronico"
                          value={formData.correo_electronico}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                            validationErrors.correo_electronico
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          required
                        />
                        {validationErrors.correo_electronico && (
                          <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.correo_electronico}
                          </p>
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
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                            validationErrors.numero_celular
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          required
                        />
                        {validationErrors.numero_celular && (
                          <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.numero_celular}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Años de Experiencia en Vóley *
                        </label>
                        <input
                          type="number"
                          name="anos_experiencia_voley"
                          value={formData.anos_experiencia_voley}
                          onChange={handleInputChange}
                          min="1"
                          max="40"
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                            validationErrors.anos_experiencia_voley
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          required
                        />
                        {validationErrors.anos_experiencia_voley && (
                          <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.anos_experiencia_voley}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          {formMode === "create" ? "Contraseña *" : "Nueva contraseña (opcional)"}
                        </label>
                        <input
                          type="password"
                          name="contraseña"
                          value={formData.contraseña}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                            validationErrors.contraseña
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          required={formMode === "create"}
                          placeholder={formMode === "update" ? "Dejar en blanco para mantener la actual" : ""}
                        />
                        {validationErrors.contraseña && (
                          <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.contraseña}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false)
                          setSelectedEntrenador(null)
                        }}
                        className="px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl hover:from-red-800 hover:to-red-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5" />
                            <span>{formMode === "create" ? "Crear Entrenador" : "Actualizar Entrenador"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Confirmar eliminación</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                ¿Estás seguro de que deseas eliminar al entrenador{" "}
                <span className="font-bold text-gray-900">
                  {selectedEntrenador?.nombres} {selectedEntrenador?.apellidos}
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
                  onClick={handleDeleteConfirm}
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
