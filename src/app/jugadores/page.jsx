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
  const [itemsPerPage] = useState(6) // Changed itemsPerPage from 5 to 6

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
      event.target.value = ""
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

    if (!formData.nombres.trim()) {
      errors.nombres = "Los nombres son obligatorios"
    } else if (formData.nombres.length < 2 || formData.nombres.length > 100) {
      errors.nombres = "Los nombres deben tener entre 2 y 100 caracteres"
    }

    if (!formData.apellidos.trim()) {
      errors.apellidos = "Los apellidos son obligatorios"
    } else if (formData.apellidos.length < 2 || formData.apellidos.length > 100) {
      errors.apellidos = "Los apellidos deben tener entre 2 y 100 caracteres"
    }

    if (!formData.fecha_nacimiento) {
      errors.fecha_nacimiento = "La fecha de nacimiento es obligatoria"
    } else {
      const fechaNac = new Date(formData.fecha_nacimiento)
      const hoy = new Date()

      if (fechaNac > hoy) {
        errors.fecha_nacimiento = "La fecha de nacimiento no puede ser futura"
      } else {
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

    if (!formData.carrera.trim()) {
      errors.carrera = "La carrera es obligatoria"
    } else if (formData.carrera.length < 2 || formData.carrera.length > 100) {
      errors.carrera = "La carrera debe tener entre 2 y 100 caracteres"
    }

    const posicionesValidas = ["armador", "opuesto", "central", "punta", "libero"]
    if (!formData.posicion_principal) {
      errors.posicion_principal = "La posición principal es obligatoria"
    } else if (!posicionesValidas.includes(formData.posicion_principal)) {
      errors.posicion_principal = "Posición inválida"
    }

    if (!formData.altura) {
      errors.altura = "La altura es obligatoria"
    } else {
      const altura = Number.parseFloat(formData.altura)
      if (isNaN(altura) || altura < 1.5 || altura > 2.2) {
        errors.altura = "La altura debe estar entre 1.5 y 2.2 metros"
      }
    }

    if (formData.anos_experiencia_voley === "") {
      errors.anos_experiencia_voley = "Los años de experiencia son obligatorios"
    } else {
      const experiencia = Number.parseInt(formData.anos_experiencia_voley)
      if (isNaN(experiencia) || experiencia < 0 || experiencia > 20) {
        errors.anos_experiencia_voley = "Los años de experiencia deben estar entre 0 y 20"
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.correo_institucional.trim()) {
      errors.correo_institucional = "El correo institucional es obligatorio"
    } else if (!emailRegex.test(formData.correo_institucional)) {
      errors.correo_institucional = "Debe ser un email válido"
    }

    if (!formData.numero_celular.trim()) {
      errors.numero_celular = "El número celular es obligatorio"
    } else {
      const celularRegex = /^\d{8,15}$/
      if (!celularRegex.test(formData.numero_celular)) {
        errors.numero_celular = "El número celular debe tener entre 8 y 15 dígitos"
      }
    }

    if (formMode === "create") {
      if (!formData.usuario.trim()) {
        errors.usuario = "El usuario es obligatorio"
      } else if (formData.usuario.length < 3 || formData.usuario.length > 50) {
        errors.usuario = "El usuario debe tener entre 3 y 50 caracteres"
      }

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
      if (file.size > 2 * 1024 * 1024) {
        reject(new Error("La imagen debe ser menor a 2MB"))
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

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = jugadoresFiltrados.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(jugadoresFiltrados.length / itemsPerPage)

  const totalJugadores = jugadoresFiltrados.length
  const activeJugadores = jugadoresFiltrados.filter((j) => j.cuenta?.activo === true).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50">
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-slide-in {
          animation: slideInRight 0.3s ease-out;
        }

        .animate-slide-out {
          animation: slideOutRight 0.3s ease-in;
        }

        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out;
        }

        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(127, 29, 29, 0.15);
        }

        .button-press {
          transition: all 0.15s ease;
        }

        .button-press:active {
          transform: scale(0.95);
        }

        .input-focus {
          transition: all 0.2s ease;
        }

        .input-focus:focus {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(127, 29, 29, 0.1);
        }

        .shimmer-loading {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.8) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        .stagger-item {
          animation: fadeInUp 0.5s ease-out backwards;
        }

        .stagger-item:nth-child(1) { animation-delay: 0.1s; }
        .stagger-item:nth-child(2) { animation-delay: 0.2s; }
        .stagger-item:nth-child(3) { animation-delay: 0.3s; }
        .stagger-item:nth-child(4) { animation-delay: 0.4s; }
        .stagger-item:nth-child(5) { animation-delay: 0.5s; }
        .stagger-item:nth-child(6) { animation-delay: 0.6s; }

        .filter-menu-enter {
          animation: scaleIn 0.2s ease-out;
          transform-origin: top left;
        }

        .modal-backdrop {
          backdrop-filter: blur(8px);
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .ripple {
          position: relative;
          overflow: hidden;
        }

        .ripple::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .ripple:active::after {
          width: 300px;
          height: 300px;
        }
      `}</style>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.csv" className="hidden" />

      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in">
          <div
            className={`rounded-2xl shadow-2xl p-5 flex items-center min-w-80 backdrop-blur-sm border-2 transition-all duration-300 ${
              notification.type === "success" ? "bg-green-50/95 border-green-300" : "bg-red-50/95 border-red-300"
            }`}
          >
            {notification.type === "success" ? (
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            )}
            <span
              className={`font-semibold text-sm flex-1 ${notification.type === "success" ? "text-green-900" : "text-red-900"}`}
            >
              {notification.message}
            </span>
            <button
              onClick={() => setNotification(null)}
              className={`ml-4 p-2 rounded-full transition-all duration-200 ${notification.type === "success" ? "text-green-600 hover:bg-green-100" : "text-red-600 hover:bg-red-100"}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full">
        <div className="p-4 lg:p-6 max-w-full">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 text-center animate-fade-in-up">
              <h1 className="text-5xl font-black bg-gradient-to-r from-red-900 via-red-700 to-red-900 bg-clip-text text-transparent mb-3 tracking-tight">
                Jugadores
              </h1>
              <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-red-800 to-transparent mx-auto mb-4 rounded-full"></div>
              <p className="text-gray-600 text-base font-medium">
                Gestiona los jugadores de la selección de volleyball
              </p>
            </div>

            <div className="relative mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-all duration-200" />
              <input
                type="text"
                placeholder="Buscar jugadores por nombre, email, carrera o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-300 input-focus shadow-sm hover:shadow-md bg-white"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <button
                onClick={handleOpenCreateForm}
                className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-xl hover:from-green-800 hover:to-green-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl button-press ripple"
                disabled={loading}
              >
                <UserPlus className="h-5 w-5" />
                <span>Agregar nuevo</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-bold w-full sm:w-auto shadow-md hover:shadow-lg border-2 border-gray-200 button-press"
                >
                  <Filter className="h-5 w-5" />
                  <span>Filtrar</span>
                </button>

                {showFilterMenu && (
                  <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 z-10 filter-menu-enter">
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-900/20 focus:border-red-900 text-sm transition-all duration-200 input-focus"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Posición
                        </label>
                        <select
                          value={filterPosicion}
                          onChange={(e) => setFilterPosicion(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-900/20 focus:border-red-900 text-sm transition-all duration-200 input-focus"
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
                          className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-bold button-press"
                        >
                          Limpiar
                        </button>
                        <button
                          onClick={() => setShowFilterMenu(false)}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl hover:from-red-800 hover:to-red-700 transition-all duration-200 text-sm font-bold shadow-lg button-press ripple"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 text-red-800 px-6 py-4 rounded-2xl mb-8 flex items-center shadow-lg animate-scale-in">
                <div className="h-10 w-10 rounded-full bg-red-200 flex items-center justify-center mr-4">
                  <AlertCircle className="h-6 w-6 text-red-700" />
                </div>
                <span className="font-semibold">{error}</span>
              </div>
            )}

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
                <div className="p-16 text-center animate-scale-in">
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
                      className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-2xl hover:from-green-800 hover:to-green-700 transition-all duration-300 font-bold mx-auto shadow-xl hover:shadow-2xl transform hover:-translate-y-1 button-press ripple"
                    >
                      <UserPlus className="h-5 w-5" />
                      <span>Agregar primer jugador</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {currentItems.map((jugador, index) => (
                      <div
                        key={jugador.id}
                        className="bg-white border-3 border-red-900 rounded-3xl overflow-hidden hover:border-red-700 transition-all duration-300 shadow-lg card-hover stagger-item"
                      >
                        <div className="flex p-6 gap-5">
                          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 border-3 border-red-200 shadow-md">
                            {jugador.imagen ? (
                              <img
                                src={jugador.imagen || "/placeholder.svg"}
                                alt={`${jugador.nombres} ${jugador.apellidos}`}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
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
                            className="flex items-center space-x-2 px-4 py-2.5 text-blue-700 hover:bg-blue-100 rounded-xl transition-all duration-200 text-sm font-bold button-press"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver</span>
                          </button>
                          <button
                            onClick={() => handleEdit(jugador)}
                            className="flex items-center space-x-2 px-4 py-2.5 text-yellow-700 hover:bg-yellow-100 rounded-xl transition-all duration-200 text-sm font-bold button-press"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteJugador(jugador)}
                            className="flex items-center space-x-2 px-4 py-2.5 text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 text-sm font-bold button-press"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

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
                            className={`px-5 py-3 rounded-xl text-sm font-black transition-all duration-300 button-press ${
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
                                  className={`px-5 py-3 rounded-xl text-sm font-black transition-all duration-300 transform hover:scale-105 button-press ${
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
                            className={`px-5 py-3 rounded-xl text-sm font-black transition-all duration-300 button-press ${
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

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-md p-4 modal-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border-2 border-gray-200 modal-content">
            <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 px-8 py-7">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white">
                    {formMode === "create" && "Agregar Nuevo Jugador"}
                    {formMode === "update" && "Editar Jugador"}
                    {formMode === "view" && "Detalles del Jugador"}
                  </h2>
                  <p className="text-red-100 text-sm mt-2 font-medium">
                    {formMode === "create" && "Completa la información del nuevo jugador"}
                    {formMode === "update" && "Modifica los datos del jugador"}
                    {formMode === "view" && "Información completa del jugador"}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-red-100 hover:text-white transition-all duration-200 p-3 hover:bg-red-800 rounded-full button-press"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
              <form onSubmit={handleSubmit} className="p-8">
                <div className="mb-10 p-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-2xl border-2 border-blue-200 shadow-lg">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center overflow-hidden border-4 border-white shadow-xl relative group">
                        {formData.imagen ? (
                          <img
                            src={formData.imagen || "/placeholder.svg"}
                            alt="Vista previa"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.target.style.display = "none"
                              e.target.nextSibling.style.display = "flex"
                            }}
                          />
                        ) : null}
                        <Camera
                          className="h-12 w-12 text-gray-400"
                          style={{ display: formData.imagen ? "none" : "block" }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-black text-gray-800 mb-3 uppercase tracking-wide">
                        <Camera className="h-5 w-5 inline mr-2" />
                        Imagen de perfil (opcional)
                      </label>
                      {formMode === "view" ? (
                        <div className="bg-white px-5 py-3 rounded-xl border-2 border-blue-300 shadow-sm">
                          <p className="text-sm text-gray-800 font-semibold">
                            {formData.imagen ? "Imagen cargada" : "Sin imagen"}
                          </p>
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={uploadingImage}
                            className="w-full px-5 py-3 border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 file:mr-4 file:py-2 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 disabled:opacity-50 transition-all duration-200 shadow-sm"
                          />
                          <p className="text-xs text-gray-700 mt-3 font-medium">
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
                              className="mt-3 text-xs text-red-700 hover:text-red-900 font-bold transition-colors duration-200"
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
                  <div className="space-y-2">
                    <label className="block text-sm font-black text-gray-800 uppercase tracking-wide">Nombres *</label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      placeholder="Ej: Juan Carlos"
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 input-focus font-semibold ${
                        validationErrors.nombres ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                      required
                    />
                    {!validationErrors.nombres && (
                      <p className="text-gray-600 text-xs font-medium">Entre 2 y 100 caracteres</p>
                    )}
                    {validationErrors.nombres && (
                      <p className="text-red-600 text-sm font-bold flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.nombres}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-gray-800 uppercase tracking-wide">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      placeholder="Ej: Pérez González"
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 input-focus font-semibold ${
                        validationErrors.apellidos
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      required
                    />
                    {!validationErrors.apellidos && (
                      <p className="text-gray-600 text-xs font-medium">Entre 2 y 100 caracteres</p>
                    )}
                    {validationErrors.apellidos && (
                      <p className="text-red-600 text-sm font-bold flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.apellidos}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-gray-800 uppercase tracking-wide">
                      Fecha de Nacimiento *
                    </label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 input-focus font-semibold ${
                        validationErrors.fecha_nacimiento
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      required
                    />
                    {!validationErrors.fecha_nacimiento && (
                      <p className="text-gray-600 text-xs font-medium">Edad debe estar entre 16 y 35 años</p>
                    )}
                    {validationErrors.fecha_nacimiento && (
                      <p className="text-red-600 text-sm font-bold flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.fecha_nacimiento}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-gray-800 uppercase tracking-wide">
                      Posición Principal *
                    </label>
                    <select
                      name="posicion_principal"
                      value={formData.posicion_principal}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 input-focus font-semibold ${
                        validationErrors.posicion_principal
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
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
                    {!validationErrors.posicion_principal && (
                      <p className="text-gray-600 text-xs font-medium">Selecciona la posición principal del jugador</p>
                    )}
                    {validationErrors.posicion_principal && (
                      <p className="text-red-600 text-sm font-bold flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.posicion_principal}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-black text-gray-800 uppercase tracking-wide">Carrera *</label>
                    <select
                      name="carrera"
                      value={formData.carrera}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 input-focus font-semibold ${
                        validationErrors.carrera ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
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
                    {!validationErrors.carrera && (
                      <p className="text-gray-600 text-xs font-medium">Selecciona la carrera del jugador</p>
                    )}
                    {validationErrors.carrera && (
                      <p className="text-red-600 text-sm font-bold flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.carrera}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-gray-800 uppercase tracking-wide">
                      Altura (metros) *
                    </label>
                    <input
                      type="number"
                      name="altura"
                      value={formData.altura}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 input-focus font-semibold ${
                        validationErrors.altura ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                      required
                      min="1.5"
                      max="2.2"
                      step="0.01"
                      placeholder="Ej: 1.85"
                    />
                    {!validationErrors.altura && (
                      <p className="text-gray-600 text-xs font-medium">Entre 1.5 y 2.2 metros</p>
                    )}
                    {validationErrors.altura && (
                      <p className="text-red-600 text-sm font-bold flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.altura}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-gray-800 uppercase tracking-wide">
                      Años de Experiencia *
                    </label>
                    <input
                      type="number"
                      name="anos_experiencia_voley"
                      value={formData.anos_experiencia_voley}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 input-focus font-semibold ${
                        validationErrors.anos_experiencia_voley
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      required
                      min="0"
                      max="20"
                      placeholder="Ej: 3"
                    />
                    {!validationErrors.anos_experiencia_voley && (
                      <p className="text-gray-600 text-xs font-medium">Entre 0 y 20 años</p>
                    )}
                    {validationErrors.anos_experiencia_voley && (
                      <p className="text-red-600 text-sm font-bold flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.anos_experiencia_voley}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-gray-800 uppercase tracking-wide">
                      Número de celular *
                    </label>
                    <input
                      type="tel"
                      name="numero_celular"
                      value={formData.numero_celular}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 input-focus font-semibold ${
                        validationErrors.numero_celular
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      required
                      placeholder="Ej: 70123456"
                    />
                    {!validationErrors.numero_celular && (
                      <p className="text-gray-600 text-xs font-medium">Solo números, entre 8 y 15 dígitos</p>
                    )}
                    {validationErrors.numero_celular && (
                      <p className="text-red-600 text-sm font-bold flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.numero_celular}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-gray-800 uppercase tracking-wide">
                      Correo institucional *
                    </label>
                    <input
                      type="email"
                      name="correo_institucional"
                      value={formData.correo_institucional}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 input-focus font-semibold ${
                        validationErrors.correo_institucional
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      required
                      placeholder="Ej: juan.perez@univalle.edu"
                    />
                    {!validationErrors.correo_institucional && (
                      <p className="text-gray-600 text-xs font-medium">Formato de email válido</p>
                    )}
                    {validationErrors.correo_institucional && (
                      <p className="text-red-600 text-sm font-bold flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.correo_institucional}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-gray-800 uppercase tracking-wide">Usuario *</label>
                    <input
                      type="text"
                      name="usuario"
                      value={formData.usuario}
                      onChange={handleInputChange}
                      disabled={formMode === "view"}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 disabled:bg-gray-50 disabled:text-gray-600 transition-all duration-200 input-focus font-semibold ${
                        validationErrors.usuario ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                      required
                      placeholder="Ej: jperez2024"
                    />
                    {!validationErrors.usuario && (
                      <p className="text-gray-600 text-xs font-medium">Entre 3 y 50 caracteres</p>
                    )}
                    {validationErrors.usuario && (
                      <p className="text-red-600 text-sm font-bold flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.usuario}
                      </p>
                    )}
                  </div>

                  {formMode !== "view" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-black text-gray-800 uppercase tracking-wide">
                        {formMode === "create" ? "Contraseña *" : "Nueva contraseña (opcional)"}
                      </label>
                      <input
                        type="password"
                        name="contraseña"
                        value={formData.contraseña}
                        onChange={handleInputChange}
                        className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 input-focus font-semibold ${
                          validationErrors.contraseña
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        required={formMode === "create"}
                        placeholder="Mínimo 6 caracteres"
                      />
                      {!validationErrors.contraseña && formMode === "create" && (
                        <p className="text-gray-600 text-xs font-medium">Mínimo 6 caracteres</p>
                      )}
                      {validationErrors.contraseña && (
                        <p className="text-red-600 text-sm font-bold flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.contraseña}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-8 border-t-2 border-gray-200 mt-10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-xl hover:from-gray-200 hover:to-gray-300 font-black transition-all duration-200 shadow-lg hover:shadow-xl button-press"
                  >
                    {formMode === "view" ? "Cerrar" : "Cancelar"}
                  </button>
                  {formMode !== "view" && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-4 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl hover:from-red-800 hover:to-red-700 font-black transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 button-press ripple"
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
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-md p-4 modal-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border-2 border-gray-200 modal-content">
            <div className="p-10">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-red-100 to-red-200 rounded-full shadow-lg">
                <AlertCircle className="h-10 w-10 text-red-700" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 text-center mb-4">Confirmar eliminación</h3>
              <p className="text-gray-700 text-center mb-10 leading-relaxed font-medium">
                ¿Estás seguro de que deseas eliminar al jugador{" "}
                <span className="font-black text-gray-900">
                  {selectedJugador.nombres} {selectedJugador.apellidos}
                </span>
                ? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-8 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-xl hover:from-gray-200 hover:to-gray-300 font-black transition-all duration-200 shadow-lg hover:shadow-xl button-press"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-black transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 button-press ripple"
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
