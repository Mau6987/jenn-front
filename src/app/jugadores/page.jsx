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

  // Estados para el formulario
  const [formMode, setFormMode] = useState("create")
  const [selectedJugador, setSelectedJugador] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Estado para notificaciones
  const [notification, setNotification] = useState(null)

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  // Estados para el formulario
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

  const [filterCarrera, setFilterCarrera] = useState("")
  const [filterPosicion, setFilterPosicion] = useState("")
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  useEffect(() => {
    fetchJugadores()
  }, [])

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const filtrarJugadores = () => {
    let filtrados = jugadores

    // Filtrar por búsqueda
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
      filtrados = filtrados.filter((jugador) => jugador.carrera?.toLowerCase().includes(filterCarrera.toLowerCase()))
    }

    if (filterPosicion !== "") {
      filtrados = filtrados.filter((jugador) => jugador.posicion_principal === filterPosicion)
    }

    setJugadoresFiltrados(filtrados)
    setCurrentPage(1)
  }

  useEffect(() => {
    filtrarJugadores()
  }, [searchTerm, jugadores, filterCarrera, filterPosicion])

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

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar jugadores")
      }

      if (data.success) {
        const jugadores = data.data
          .filter((cuenta) => cuenta.rol === "jugador" && cuenta.jugador)
          .map((cuenta) => ({
            ...cuenta.jugador,
            id: cuenta.jugador.id,
            usuario: cuenta.usuario,
            cuentaId: cuenta.id,
            imagen: cuenta.jugador.imagen || "", // Asegurarse de que imagen exista
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
      if (error.message.includes("401") || error.message.includes("token")) {
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleImportJugadores = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
      showNotification("error", "Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const response = await fetch("https://jenn-back-reac.onrender.com/api/jugadores/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al importar jugadores")
      }

      if (data.success) {
        showNotification("success", `Se importaron ${data.imported || 0} jugadores exitosamente`)
        await fetchJugadores()
      } else {
        throw new Error(data.message || "Error al importar jugadores")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("error", error.message || "Error al importar jugadores")
    } finally {
      setLoading(false)
      event.target.value = "" // Reset file input
    }
  }

  const handleExportJugadores = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const response = await fetch("https://jenn-back-reac.onrender.com/api/jugadores/export", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al exportar jugadores")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `jugadores_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showNotification("success", "Jugadores exportados exitosamente")
    } catch (error) {
      console.error("Error:", error)
      showNotification("error", "Error al exportar jugadores")
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

    // Validar nombres (2-100 caracteres)
    if (!formData.nombres.trim()) {
      errors.nombres = "Los nombres son obligatorios"
    } else if (formData.nombres.length < 2 || formData.nombres.length > 100) {
      errors.nombres = "Los nombres deben tener entre 2 y 100 caracteres"
    }

    // Validar apellidos (2-100 caracteres)
    if (!formData.apellidos.trim()) {
      errors.apellidos = "Los apellidos son obligatorios"
    } else if (formData.apellidos.length < 2 || formData.apellidos.length > 100) {
      errors.apellidos = "Los apellidos deben tener entre 2 y 100 caracteres"
    }

    // Validar fecha de nacimiento y calcular edad
    if (!formData.fecha_nacimiento) {
      errors.fecha_nacimiento = "La fecha de nacimiento es obligatoria"
    } else {
      const fechaNac = new Date(formData.fecha_nacimiento)
      const hoy = new Date()

      if (fechaNac > hoy) {
        errors.fecha_nacimiento = "La fecha de nacimiento no puede ser futura"
      } else {
        // Calcular edad
        let edad = hoy.getFullYear() - fechaNac.getFullYear()
        const mes = hoy.getMonth() - fechaNac.getMonth()
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
          edad--
        }

        if (edad < 16 || edad > 35) {
          errors.fecha_nacimiento = "La edad debe estar entre 16 y 35 años"
        }
      }
    }

    // Validar carrera (2-100 caracteres)
    if (!formData.carrera.trim()) {
      errors.carrera = "La carrera es obligatoria"
    } else if (formData.carrera.length < 2 || formData.carrera.length > 100) {
      errors.carrera = "La carrera debe tener entre 2 y 100 caracteres"
    }

    // Validar posición principal
    const posicionesValidas = ["armador", "opuesto", "central", "receptor", "libero"]
    if (!formData.posicion_principal) {
      errors.posicion_principal = "La posición principal es obligatoria"
    } else if (!posicionesValidas.includes(formData.posicion_principal)) {
      errors.posicion_principal = "Posición inválida"
    }

    // Validar altura (1.5 - 2.2 metros)
    if (!formData.altura) {
      errors.altura = "La altura es obligatoria"
    } else {
      const altura = Number.parseFloat(formData.altura)
      if (isNaN(altura) || altura < 1.5 || altura > 2.2) {
        errors.altura = "La altura debe estar entre 1.5 y 2.2 metros"
      }
    }

    // Validar años de experiencia (0-20)
    if (formData.anos_experiencia_voley === "") {
      errors.anos_experiencia_voley = "Los años de experiencia son obligatorios"
    } else {
      const experiencia = Number.parseInt(formData.anos_experiencia_voley)
      if (isNaN(experiencia) || experiencia < 0 || experiencia > 20) {
        errors.anos_experiencia_voley = "Los años de experiencia deben estar entre 0 y 20"
      }
    }

    // Validar correo institucional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.correo_institucional.trim()) {
      errors.correo_institucional = "El correo institucional es obligatorio"
    } else if (!emailRegex.test(formData.correo_institucional)) {
      errors.correo_institucional = "Debe ser un email válido"
    }

    // Validar número celular (8-15 dígitos)
    if (!formData.numero_celular.trim()) {
      errors.numero_celular = "El número celular es obligatorio"
    } else {
      const celularRegex = /^\d{8,15}$/
      if (!celularRegex.test(formData.numero_celular)) {
        errors.numero_celular = "El número celular debe tener entre 8 y 15 dígitos"
      }
    }

    // Validar usuario (3-50 caracteres)
    if (formMode === "create") {
      if (!formData.usuario.trim()) {
        errors.usuario = "El usuario es obligatorio"
      } else if (formData.usuario.length < 3 || formData.usuario.length > 50) {
        errors.usuario = "El usuario debe tener entre 3 y 50 caracteres"
      }

      // Validar contraseña (mínimo 6 caracteres)
      if (!formData.contraseña) {
        errors.contraseña = "La contraseña es obligatoria"
      } else if (formData.contraseña.length < 6) {
        errors.contraseña = "La contraseña debe tener al menos 6 caracteres"
      }
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

      if (!token) {
        router.push("/login")
        return
      }

      const requestData = {
        ...formData,
        rol: "jugador",
      }

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
          const errorMessages = data.errors.map((err) => err.msg).join(", ")
          throw new Error(errorMessages)
        }
        throw new Error(data.message || "Error al procesar la solicitud")
      }

      if (data.success) {
        showNotification(
          "success",
          formMode === "create" ? "Jugador creado exitosamente" : "Jugador actualizado exitosamente",
        )
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

      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`https://jenn-back-reac.onrender.com/api/cuentas/${selectedJugador.cuentaId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al eliminar jugador")
      }

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

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = jugadoresFiltrados.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(jugadoresFiltrados.length / itemsPerPage)

  const totalJugadores = jugadoresFiltrados.length
  const activeJugadores = jugadoresFiltrados.filter((j) => j.cuenta?.activo === true).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden file input for import */}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.csv" className="hidden" />

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

      {/* Main Content - Improved responsive layout */}
      <div className="w-full">
        <div className="p-4 lg:p-6 max-w-full">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-900 via-red-800 to-red-900 bg-clip-text text-transparent mb-2">
                Jugadores
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-red-800 to-transparent mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Gestiona los jugadores de la selección de volleyball</p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar jugadores por nombre, email, carrera o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium w-full sm:w-auto"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtrar</span>
                </button>

                {showFilterMenu && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-10">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Carrera</label>
                        <input
                          type="text"
                          value={filterCarrera}
                          onChange={(e) => setFilterCarrera(e.target.value)}
                          placeholder="Filtrar por carrera..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Posición</label>
                        <select
                          value={filterPosicion}
                          onChange={(e) => setFilterPosicion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-transparent text-sm"
                        >
                          <option value="">Todas las posiciones</option>
                          <option value="armador">Armador</option>
                          <option value="opuesto">Opuesto</option>
                          <option value="central">Central</option>
                          <option value="receptor">Receptor</option>
                          <option value="libero">Líbero</option>
                        </select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setFilterCarrera("")
                            setFilterPosicion("")
                          }}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          Limpiar
                        </button>
                        <button
                          onClick={() => setShowFilterMenu(false)}
                          className="flex-1 px-3 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Table - Improved responsive layout */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden backdrop-blur-sm">
              {loading && !isModalOpen && !showDeleteModal ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Cargando jugadores...</p>
                </div>
              ) : jugadoresFiltrados.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    {searchTerm ? "No se encontraron jugadores" : "No hay jugadores registrados"}
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {searchTerm
                      ? "Intenta con otros términos de búsqueda."
                      : "Comienza agregando tu primer jugador al sistema."}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleOpenCreateForm}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-700/80 to-green-800/80 text-white rounded-xl hover:from-green-800/90 hover:to-green-900/90 transition-all duration-300 font-medium mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Agregar primer jugador</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Card Grid Layout */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentItems.map((jugador) => (
                      <div
                        key={jugador.id}
                        className="bg-white border-2 border-red-900 rounded-2xl overflow-hidden hover:shadow-xl hover:border-red-800 transition-all duration-300 transform hover:-translate-y-1"
                      >
                        {/* Top section: Image and Info side by side */}
                        <div className="flex p-4 gap-4">
                          {/* Large Square Image */}
                          <div className="w-28 h-28 rounded-xl bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-red-200">
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
                              className="h-12 w-12 text-gray-400"
                              style={{ display: jugador.imagen ? "none" : "block" }}
                            />
                          </div>

                          {/* Info on the right */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-900 leading-tight mb-1 truncate">
                              {jugador.nombres} {jugador.apellidos}
                            </h3>
                            <p className="text-sm text-red-700 font-medium capitalize mb-3">
                              {jugador.posicion_principal}
                            </p>

                            <div className="space-y-2">
                              <div className="flex items-center text-xs">
                                <Users className="h-3 w-3 text-gray-500 mr-1.5 flex-shrink-0" />
                                <span className="text-gray-600 font-medium truncate">{jugador.usuario}</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <span className="text-gray-500 mr-1.5">📚</span>
                                <span className="text-gray-700 font-medium truncate">{jugador.carrera}</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <span className="text-gray-500 mr-1.5">⭐</span>
                                <span className="text-gray-700 font-medium">
                                  {jugador.anos_experiencia_voley} años exp.
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons at the bottom */}
                        <div className="flex items-center justify-around px-4 py-3 bg-gray-50 border-t border-gray-200">
                          <button
                            onClick={() => handleViewJugador(jugador)}
                            className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver</span>
                          </button>
                          <button
                            onClick={() => handleEdit(jugador)}
                            className="flex items-center space-x-1 px-3 py-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors text-sm font-medium"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteJugador(jugador)}
                            className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
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
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-700 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                          Mostrando <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> a{" "}
                          <span className="font-bold text-slate-900">
                            {Math.min(indexOfLastItem, jugadoresFiltrados.length)}
                          </span>{" "}
                          de <span className="font-bold text-slate-900">{jugadoresFiltrados.length}</span> jugadores
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

      {/* Modal para crear/editar/ver jugador */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-gray-100 animate-in fade-in-0 zoom-in-95 duration-300">
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
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-red-100 hover:text-white transition-colors p-2 hover:bg-red-800 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <form onSubmit={handleSubmit} className="p-8">
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
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
                      {formMode === "view" ? (
                        <div className="bg-white px-4 py-2 rounded-lg border border-blue-300">
                          <p className="text-sm text-gray-700">{formData.imagen ? "Imagen cargada" : "Sin imagen"}</p>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Nombres */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      placeholder="Ej: Juan Carlos"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 ${
                        validationErrors.nombres ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                    />
                    {!validationErrors.nombres && <p className="text-gray-500 text-xs">Entre 2 y 100 caracteres</p>}
                    {validationErrors.nombres && (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.nombres}
                      </p>
                    )}
                  </div>

                  {/* Apellidos */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      placeholder="Ej: Pérez González"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 ${
                        validationErrors.apellidos
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                    />
                    {!validationErrors.apellidos && <p className="text-gray-500 text-xs">Entre 2 y 100 caracteres</p>}
                    {validationErrors.apellidos && (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.apellidos}
                      </p>
                    )}
                  </div>

                  {/* Fecha de Nacimiento */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Fecha de Nacimiento *
                    </label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 ${
                        validationErrors.fecha_nacimiento
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                    />
                    {!validationErrors.fecha_nacimiento && (
                      <p className="text-gray-500 text-xs">Edad debe estar entre 16 y 35 años</p>
                    )}
                    {validationErrors.fecha_nacimiento && (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.fecha_nacimiento}
                      </p>
                    )}
                  </div>

                  {/* Posición Principal */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Posición Principal *
                    </label>
                    <select
                      name="posicion_principal"
                      value={formData.posicion_principal}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 ${
                        validationErrors.posicion_principal
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                    >
                      <option value="">Seleccionar posición</option>
                      <option value="armador">Armador</option>
                      <option value="opuesto">Opuesto</option>
                      <option value="central">Central</option>
                      <option value="receptor">Receptor</option>
                      <option value="libero">Líbero</option>
                    </select>
                    {!validationErrors.posicion_principal && (
                      <p className="text-gray-500 text-xs">Selecciona la posición principal del jugador</p>
                    )}
                    {validationErrors.posicion_principal && (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.posicion_principal}
                      </p>
                    )}
                  </div>

                  {/* Carrera */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Carrera *
                    </label>
                    <input
                      type="text"
                      name="carrera"
                      value={formData.carrera}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      placeholder="Ej: Ingeniería de Sistemas"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 ${
                        validationErrors.carrera ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                    />
                    {!validationErrors.carrera && <p className="text-gray-500 text-xs">Entre 2 y 100 caracteres</p>}
                    {validationErrors.carrera && (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.carrera}
                      </p>
                    )}
                  </div>

                  {/* Altura */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Altura (metros) *
                    </label>
                    <input
                      type="number"
                      name="altura"
                      value={formData.altura}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 ${
                        validationErrors.altura ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                      min="1.5"
                      max="2.2"
                      step="0.01"
                      placeholder="Ej: 1.85"
                    />
                    {!validationErrors.altura && <p className="text-gray-500 text-xs">Entre 1.5 y 2.2 metros</p>}
                    {validationErrors.altura && (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.altura}
                      </p>
                    )}
                  </div>

                  {/* Años de Experiencia */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Años de Experiencia *
                    </label>
                    <input
                      type="number"
                      name="anos_experiencia_voley"
                      value={formData.anos_experiencia_voley}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 ${
                        validationErrors.anos_experiencia_voley
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                      min="0"
                      max="20"
                      placeholder="Ej: 3"
                    />
                    {!validationErrors.anos_experiencia_voley && (
                      <p className="text-gray-500 text-xs">Entre 0 y 20 años</p>
                    )}
                    {validationErrors.anos_experiencia_voley && (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.anos_experiencia_voley}
                      </p>
                    )}
                  </div>

                  {/* Número de celular */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Número de celular *
                    </label>
                    <input
                      type="tel"
                      name="numero_celular"
                      value={formData.numero_celular}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 ${
                        validationErrors.numero_celular
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                      placeholder="Ej: 70123456"
                    />
                    {!validationErrors.numero_celular && (
                      <p className="text-gray-500 text-xs">Solo números, entre 8 y 15 dígitos</p>
                    )}
                    {validationErrors.numero_celular && (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.numero_celular}
                      </p>
                    )}
                  </div>

                  {/* Correo institucional */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Correo institucional *
                    </label>
                    <input
                      type="email"
                      name="correo_institucional"
                      value={formData.correo_institucional}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 ${
                        validationErrors.correo_institucional
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                      placeholder="Ej: juan.perez@univalle.edu"
                    />
                    {!validationErrors.correo_institucional && (
                      <p className="text-gray-500 text-xs">Formato de email válido</p>
                    )}
                    {validationErrors.correo_institucional && (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.correo_institucional}
                      </p>
                    )}
                  </div>

                  {/* Usuario */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Usuario *
                    </label>
                    <input
                      type="text"
                      name="usuario"
                      value={formData.usuario}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 ${
                        validationErrors.usuario ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                      placeholder="Ej: jperez2024"
                    />
                    {!validationErrors.usuario && <p className="text-gray-500 text-xs">Entre 3 y 50 caracteres</p>}
                    {validationErrors.usuario && (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.usuario}
                      </p>
                    )}
                  </div>

                  {/* Contraseña */}
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
                          validationErrors.contraseña
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        required={formMode === "create"}
                        placeholder="Mínimo 6 caracteres"
                      />
                      {!validationErrors.contraseña && formMode === "create" && (
                        <p className="text-gray-500 text-xs">Mínimo 6 caracteres</p>
                      )}
                      {validationErrors.contraseña && (
                        <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.contraseña}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
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
                      className="px-8 py-3 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl hover:from-red-800 hover:to-red-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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

      {showDeleteModal && selectedJugador && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 animate-in fade-in-0 zoom-in-95 duration-300">
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
                  {loading && <Loader2 className="h-5 w-5 animate-spin" />}
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
