"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  UserPlus,
  Edit,
  Trash2,
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

export default function JugadoresPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [jugadores, setJugadores] = useState([])
  const [jugadoresFiltrados, setJugadoresFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form
  const [formMode, setFormMode] = useState("create") // "create" | "update" | "view"
  const [selectedJugador, setSelectedJugador] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Notificación
  const [notification, setNotification] = useState(null) // {type,message}

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    fecha_nacimiento: "",
    carrera: "",
    posicion_principal: "",
    altura: "",
    anos_experiencia_voley: "",
    numero_celular: "",
    correo_institucional: "",
    usuario: "",
    contraseña: "",
    imagen: "",
  })
  const [validationErrors, setValidationErrors] = useState({})
  const [uploadingImage, setUploadingImage] = useState(false)

  // Filtros
  const [filterCarrera, setFilterCarrera] = useState("")
  const [filterPosicion, setFilterPosicion] = useState("")
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  useEffect(() => {
    fetchJugadores()
  }, [])

  useEffect(() => {
    filtrarJugadores()
  }, [searchTerm, jugadores, filterCarrera, filterPosicion])

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const filtrarJugadores = () => {
    let filtrados = jugadores

    if (searchTerm.trim() !== "") {
      filtrados = filtrados.filter(
        (jugador) =>
          jugador.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jugador.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${jugador.nombres} ${jugador.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jugador.correo_institucional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jugador.carrera?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jugador.usuario?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterCarrera.trim() !== "") {
      filtrados = filtrados.filter((jugador) =>
        jugador.carrera?.toLowerCase().includes(filterCarrera.toLowerCase()),
      )
    }

    if (filterPosicion !== "") {
      filtrados = filtrados.filter((jugador) => jugador.posicion_principal === filterPosicion)
    }

    setJugadoresFiltrados(filtrados)
    setCurrentPage(1)
  }

  const fetchJugadores = async () => {
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
      if (!response.ok) throw new Error(data.message || "Error al cargar jugadores")

      if (data.success) {
        const jugadores = data.data
          .filter((cuenta) => cuenta.rol === "jugador" && cuenta.jugador)
          .map((cuenta) => ({
            ...cuenta.jugador,
            id: cuenta.jugador.id,
            usuario: cuenta.usuario,
            cuentaId: cuenta.id,
            imagen: cuenta.jugador.imagen || "",
          }))

        setJugadores(jugadores)
        setJugadoresFiltrados(jugadores)
        setError("")
      } else {
        throw new Error(data.message || "Error al cargar jugadores")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error al cargar los jugadores. Intente nuevamente.")
      if (error.message?.includes("401") || error.message?.includes("token")) {
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
  }

  const handleOpenCreateForm = () => {
    setFormData({
      nombres: "",
      apellidos: "",
      fecha_nacimiento: "",
      carrera: "",
      posicion_principal: "",
      altura: "",
      anos_experiencia_voley: "",
      numero_celular: "",
      correo_institucional: "",
      usuario: "",
      contraseña: "",
      imagen: "",
    })
    setFormMode("create")
    setIsModalOpen(true)
  }

  const handleViewJugador = (jugador) => {
    setSelectedJugador(jugador)
    setFormData({
      nombres: jugador.nombres || "",
      apellidos: jugador.apellidos || "",
      fecha_nacimiento: jugador.fecha_nacimiento ? jugador.fecha_nacimiento.split("T")[0] : "",
      carrera: jugador.carrera || "",
      posicion_principal: jugador.posicion_principal || "",
      altura: jugador.altura || "",
      anos_experiencia_voley: jugador.anos_experiencia_voley || "",
      numero_celular: jugador.numero_celular || "",
      correo_institucional: jugador.correo_institucional || "",
      usuario: jugador.usuario || "",
      contraseña: "",
      imagen: jugador.imagen || "",
    })
    setFormMode("view")
    setIsModalOpen(true)
  }

  const handleEdit = (jugador) => {
    setSelectedJugador(jugador)
    setFormData({
      nombres: jugador.nombres || "",
      apellidos: jugador.apellidos || "",
      fecha_nacimiento: jugador.fecha_nacimiento ? jugador.fecha_nacimiento.split("T")[0] : "",
      carrera: jugador.carrera || "",
      posicion_principal: jugador.posicion_principal || "",
      altura: jugador.altura || "",
      anos_experiencia_voley: jugador.anos_experiencia_voley || "",
      numero_celular: jugador.numero_celular || "",
      correo_institucional: jugador.correo_institucional || "",
      usuario: jugador.usuario || "",
      contraseña: "",
      imagen: jugador.imagen || "",
    })
    setFormMode("update")
    setIsModalOpen(true)
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.nombres?.trim()) errors.nombres = "Los nombres son obligatorios"
    else if (formData.nombres.length < 2 || formData.nombres.length > 100)
      errors.nombres = "Los nombres deben tener entre 2 y 100 caracteres"

    if (!formData.apellidos?.trim()) errors.apellidos = "Los apellidos son obligatorios"
    else if (formData.apellidos.length < 2 || formData.apellidos.length > 100)
      errors.apellidos = "Los apellidos deben tener entre 2 y 100 caracteres"

    if (!formData.fecha_nacimiento) errors.fecha_nacimiento = "La fecha de nacimiento es obligatoria"
    else {
      const fechaNac = new Date(formData.fecha_nacimiento)
      const hoy = new Date()
      if (fechaNac > hoy) errors.fecha_nacimiento = "La fecha de nacimiento no puede ser futura"
      else {
        let edad = hoy.getFullYear() - fechaNac.getFullYear()
        const mes = hoy.getMonth() - fechaNac.getMonth()
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) edad--
        if (edad < 16 || edad > 35) errors.fecha_nacimiento = "La edad debe estar entre 16 y 35 años"
      }
    }

    if (!formData.carrera?.trim()) errors.carrera = "La carrera es obligatoria"
    else if (formData.carrera.length < 2 || formData.carrera.length > 100)
      errors.carrera = "La carrera debe tener entre 2 y 100 caracteres"

    const posicionesValidas = ["armador", "opuesto", "central", "punta", "libero"]
    if (!formData.posicion_principal) errors.posicion_principal = "La posición principal es obligatoria"
    else if (!posicionesValidas.includes(formData.posicion_principal)) errors.posicion_principal = "Posición inválida"

    if (!formData.altura) errors.altura = "La altura es obligatoria"
    else {
      const altura = Number.parseFloat(formData.altura)
      if (isNaN(altura) || altura < 1.5 || altura > 2.2) errors.altura = "La altura debe estar entre 1.5 y 2.2 metros"
    }

    if (formData.anos_experiencia_voley === "") errors.anos_experiencia_voley = "Los años de experiencia son obligatorios"
    else {
      const exp = Number.parseInt(formData.anos_experiencia_voley)
      if (isNaN(exp) || exp < 0 || exp > 20) errors.anos_experiencia_voley = "Debe estar entre 0 y 20"
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.correo_institucional?.trim()) errors.correo_institucional = "El correo institucional es obligatorio"
    else if (!emailRegex.test(formData.correo_institucional)) errors.correo_institucional = "Debe ser un email válido"

    if (!formData.numero_celular?.trim()) errors.numero_celular = "El número celular es obligatorio"
    else if (!/^\d{8,15}$/.test(formData.numero_celular)) errors.numero_celular = "Entre 8 y 15 dígitos"

    if (formMode === "create") {
      if (!formData.usuario?.trim()) errors.usuario = "El usuario es obligatorio"
      else if (formData.usuario.length < 3 || formData.usuario.length > 50)
        errors.usuario = "Entre 3 y 50 caracteres"

      if (!formData.contraseña) errors.contraseña = "La contraseña es obligatoria"
      else if (formData.contraseña.length < 6) errors.contraseña = "Al menos 6 caracteres"
    }

    return errors
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
      if (!token) return router.push("/login")

      const requestData = { ...formData, rol: "jugador" }
      const baseUrl = "https://jenn-back-reac.onrender.com/api/cuentas"
      const url = formMode === "create" ? baseUrl : `${baseUrl}/${selectedJugador.cuentaId}`
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
          throw new Error(data.errors.map((err) => err.msg).join(", "))
        }
        throw new Error(data.message || "Error al procesar la solicitud")
      }

      if (data.success) {
        showNotification("success", formMode === "create" ? "Jugador creado exitosamente" : "Jugador actualizado exitosamente")
        setIsModalOpen(false)
        setSelectedJugador(null)
        await fetchJugadores()
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

  const handleDeleteJugador = (jugador) => {
    setSelectedJugador(jugador)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) return router.push("/login")

      const response = await fetch(`https://jenn-back-reac.onrender.com/api/cuentas/${selectedJugador.cuentaId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error al eliminar jugador")

      if (data.success) {
        showNotification("success", "Jugador eliminado exitosamente")
        setShowDeleteModal(false)
        await fetchJugadores()
        setError("")
      } else {
        throw new Error(data.message || "Error al eliminar jugador")
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message || "Error al eliminar jugador")
      showNotification("error", error.message || "Error al eliminar jugador")
    } finally {
      setLoading(false)
      setSelectedJugador(null)
    }
  }

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      if (file.size > 2 * 1024 * 1024) return reject(new Error("La imagen debe ser menor a 2MB"))
      if (!file.type.startsWith("image/")) return reject(new Error("El archivo debe ser una imagen"))
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingImage(true)
      const base64 = await convertToBase64(file)
      setFormData((p) => ({ ...p, imagen: base64 }))
      showNotification("success", "Imagen cargada correctamente")
    } catch (error) {
      showNotification("error", error.message || "Error al cargar la imagen")
    } finally {
      setUploadingImage(false)
    }
  }

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = jugadoresFiltrados.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(jugadoresFiltrados.length / itemsPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50">
      {/* Notificación */}
      {notification && (
        <div className="fixed top-20 right-6 z-50">
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

      {/* Main */}
      <div className="w-full">
        <div className="p-4 lg:p-6 max-w-full">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-10 text-center">
              <h1 className="text-5xl font-black bg-gradient-to-r from-red-900 via-red-700 to-red-900 bg-clip-text text-transparent mb-3 tracking-tight">
                Jugadores
              </h1>
              <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-red-800 to-transparent mx-auto mb-4 rounded-full"></div>
              <p className="text-gray-600 text-base font-medium">
                Gestiona los jugadores de la selección de volleyball
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar jugadores por nombre, email, carrera o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-300 shadow-sm hover:shadow-md bg-white"
              />
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={handleOpenCreateForm}
                className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-xl hover:from-green-800 hover:to-green-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                <UserPlus className="h-5 w-5" />
                <span>Agregar nuevo</span>
              </button>

              <div className="relative">
               

                {showFilterMenu && (
                  <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 z-10">
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Carrera
                        </label>
                        <input
                          type="text"
                          value={filterCarrera}
                          onChange={(e) => setFilterCarrera(e.target.value)}
                          placeholder="Filtrar por carrera..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-900/20 focus:border-red-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Posición
                        </label>
                        <select
                          value={filterPosicion}
                          onChange={(e) => setFilterPosicion(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-900/20 focus:border-red-900 text-sm"
                        >
                          <option value="">Todas las posiciones</option>
                          <option value="armador">Armador</option>
                          <option value="opuesto">Opuesto</option>
                          <option value="central">Central</option>
                          <option value="punta">Punta</option>
                          <option value="libero">Líbero</option>
                        </select>
                      </div>
                      <div className="flex gap-3 pt-3">
                        <button
                          onClick={() => {
                            setFilterCarrera("")
                            setFilterPosicion("")
                          }}
                          className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-bold"
                        >
                          Limpiar
                        </button>
                        <button
                          onClick={() => setShowFilterMenu(false)}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl hover:from-red-800 hover:to-red-700 text-sm font-bold shadow-lg"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 text-red-800 px-6 py-4 rounded-2xl mb-8 flex items-center shadow-lg">
                <div className="h-10 w-10 rounded-full bg-red-200 flex items-center justify-center mr-4">
                  <AlertCircle className="h-6 w-6 text-red-700" />
                </div>
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Grid / Lista */}
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden backdrop-blur-sm">
              {loading && !isModalOpen && !showDeleteModal ? (
                <div className="p-16 text-center">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-red-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-red-900 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-700 font-bold text-lg">Cargando jugadores...</p>
                </div>
              ) : jugadoresFiltrados.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {searchTerm ? "No se encontraron jugadores" : "No hay jugadores registrados"}
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg">
                    {searchTerm
                      ? "Intenta con otros términos de búsqueda."
                      : "Comienza agregando tu primer jugador al sistema."}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleOpenCreateForm}
                      className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-2xl hover:from-green-800 hover:to-green-700 transition-all duration-300 font-bold mx-auto shadow-xl transform hover:-translate-y-1"
                    >
                      <UserPlus className="h-5 w-5" />
                      <span>Agregar primer jugador</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {currentItems.map((jugador) => (
                      <div
                        key={jugador.id}
                        className="bg-white border-3 border-red-900 rounded-3xl overflow-hidden hover:border-red-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-2"
                      >
                        <div className="flex p-6 gap-5">
                          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 border-3 border-red-200 shadow-md">
                            {jugador.imagen ? (
                              <img
                                src={jugador.imagen || "/placeholder.svg"}
                                alt={`${jugador.nombres} ${jugador.apellidos}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none"
                                  e.target.nextSibling.style.display = "flex"
                                }}
                              />
                            ) : null}
                            <Users
                              className="h-14 w-14 text-gray-400"
                              style={{ display: jugador.imagen ? "none" : "block" }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black text-gray-900 leading-tight mb-2 truncate">
                              {jugador.nombres} {jugador.apellidos}
                            </h3>
                            <p className="text-sm text-red-800 font-bold capitalize mb-4 bg-red-50 px-3 py-1 rounded-lg inline-block">
                              {jugador.posicion_principal}
                            </p>

                            <div className="space-y-2.5">
                              <div className="flex items-center text-xs">
                                <Users className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                                <span className="text-gray-700 font-bold truncate">{jugador.usuario}</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <span className="text-gray-500 mr-2 text-base">📚</span>
                                <span className="text-gray-700 font-semibold truncate">{jugador.carrera}</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <span className="text-gray-500 mr-2 text-base">⭐</span>
                                <span className="text-gray-700 font-semibold">
                                  {jugador.anos_experiencia_voley} años exp.
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-around px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
                          <button
                            onClick={() => handleViewJugador(jugador)}
                            className="flex items-center space-x-2 px-4 py-2.5 text-blue-700 hover:bg-blue-100 rounded-xl transition-all duration-200 text-sm font-bold"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver</span>
                          </button>
                          <button
                            onClick={() => handleEdit(jugador)}
                            className="flex items-center space-x-2 px-4 py-2.5 text-yellow-700 hover:bg-yellow-100 rounded-xl transition-all duration-200 text-sm font-bold"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteJugador(jugador)}
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

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 px-8 py-8 border-t-2 border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-800 font-bold bg-white px-6 py-3 rounded-xl shadow-md border-2 border-gray-200">
                          Mostrando <span className="font-black text-red-900">{indexOfFirstItem + 1}</span> a{" "}
                          <span className="font-black text-red-900">
                            {Math.min(indexOfLastItem, jugadoresFiltrados.length)}
                          </span>{" "}
                          de <span className="font-black text-red-900">{jugadoresFiltrados.length}</span> jugadores
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
                              if (totalPages <= 5) page = i + 1
                              else if (currentPage <= 3) page = i + 1
                              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                              else page = currentPage - 2 + i

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

      {/* MODAL crear/editar/ver */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-red-900 to-red-800 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {formMode === "create" && "Agregar Nuevo Jugador"}
                    {formMode === "update" && "Editar Jugador"}
                    {formMode === "view" && "Detalles del Jugador"}
                  </h2>
                  <p className="text-red-100 text-sm mt-1">
                    {formMode === "create" && "Completa la información del nuevo jugador"}
                    {formMode === "update" && "Modifica los datos del jugador"}
                    {formMode === "view" && "Información completa del jugador"}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-red-100 hover:text-white p-2 hover:bg-red-800 rounded-full">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
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
                        <Camera className="h-10 w-10 text-gray-400" style={{ display: formData.imagen ? "none" : "block" }} />
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
                          onClick={() => setFormData((p) => ({ ...p, imagen: "" }))}
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
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Nombres *</label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                        validationErrors.nombres ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
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
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Apellidos *</label>
                    <input
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                        validationErrors.apellidos ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
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

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Fecha de Nacimiento *</label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                        validationErrors.fecha_nacimiento ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
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

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Posición Principal *</label>
                    <select
                      name="posicion_principal"
                      value={formData.posicion_principal}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                        validationErrors.posicion_principal ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                    >
                      <option value="">Seleccionar posición</option>
                      <option value="armador">Armador</option>
                      <option value="opuesto">Opuesto</option>
                      <option value="central">Central</option>
                      <option value="punta">Punta</option>
                      <option value="libero">Líbero</option>
                    </select>
                    {validationErrors.posicion_principal && (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.posicion_principal}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Carrera *</label>
                    <select
                      name="carrera"
                      value={formData.carrera}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                        validationErrors.carrera ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                    >
                      <option value="">Seleccionar carrera</option>
                      <option value="derecho">Derecho</option>
                      <option value="ingeniera de sistemas">Ingeniería de Sistemas</option>
                      <option value="ingeniera industrial">Ingeniería Industrial</option>
                      <option value="medicina">Medicina</option>
                      <option value="ingeniera biomedica">Ingeniería Biomédica</option>
                      <option value="ingeniera electronica">Ingeniería Electrónica</option>
                      <option value="ingeniera financiera">Ingeniería Financiera</option>
                      <option value="ingeniera comercial">Ingeniería Comercial</option>
                      <option value="fisioterapia">Fisioterapia</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Altura (m) *</label>
                    <input
                      type="number"
                      name="altura"
                      value={formData.altura}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                        validationErrors.altura ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                      min="1.5"
                      max="2.2"
                      step="0.01"
                      placeholder="Ej: 1.85"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Años de Experiencia *</label>
                    <input
                      type="number"
                      name="anos_experiencia_voley"
                      value={formData.anos_experiencia_voley}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                        validationErrors.anos_experiencia_voley ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                      min="0"
                      max="20"
                      placeholder="Ej: 3"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Número de celular *</label>
                    <input
                      type="tel"
                      name="numero_celular"
                      value={formData.numero_celular}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                        validationErrors.numero_celular ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                      placeholder="Ej: 70123456"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Correo institucional *</label>
                    <input
                      type="email"
                      name="correo_institucional"
                      value={formData.correo_institucional}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                        validationErrors.correo_institucional ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                      placeholder="Ej: juan.perez@univalle.edu"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">Usuario *</label>
                    <input
                      type="text"
                      name="usuario"
                      value={formData.usuario}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                        validationErrors.usuario ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                      placeholder="Ej: jperez2024"
                    />
                  </div>

                  {formMode !== "view" && (
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
                          validationErrors.contraseña ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                        required={formMode === "create"}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {formMode === "view" ? "Cerrar" : "Cancelar"}
                  </button>
                  {formMode !== "view" && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl hover:from-red-800 hover:to-red-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                    >
                      {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                      <span>{formMode === "create" ? "Crear jugador" : "Actualizar jugador"}</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {showDeleteModal && selectedJugador && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-gray-100">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Confirmar eliminación</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                ¿Estás seguro de que deseas eliminar al jugador{" "}
                <span className="font-bold text-gray-900">
                  {selectedJugador.nombres} {selectedJugador.apellidos}
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
