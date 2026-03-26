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
  Users,
  Camera,
  User,
} from "lucide-react"
import { useAuth } from "../../contexts/auth-context"

const BASE_URL = "https://jenn-back-reac.onrender.com"

const positionColors = {
  armador:  { bg: "bg-violet-100",  text: "text-violet-700",  border: "border-violet-200" },
  opuesto:  { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200"  },
  central:  { bg: "bg-sky-100",     text: "text-sky-700",     border: "border-sky-200"    },
  punta:    { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200"},
  libero:   { bg: "bg-rose-100",    text: "text-rose-700",    border: "border-rose-200"   },
}

const posColor = (pos) =>
  positionColors[pos] ?? { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" }

export default function JugadoresPage() {
  const router = useRouter()
  const [jugadores, setJugadores] = useState([])
  const [jugadoresFiltrados, setJugadoresFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [formMode, setFormMode] = useState("create")
  const [selectedJugador, setSelectedJugador] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [notification, setNotification] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)

  const [formData, setFormData] = useState({
    nombres: "", apellidos: "", fecha_nacimiento: "", carrera: "",
    posicion_principal: "", altura: "", alcance_estatico: "",
    anos_experiencia_voley: "", numero_celular: "", correo_institucional: "",
    usuario: "", contraseña: "", path: "",
  })
  const [validationErrors, setValidationErrors] = useState({})
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")

  const [filterCarrera, setFilterCarrera] = useState("")
  const [filterPosicion, setFilterPosicion] = useState("")

  useEffect(() => { fetchJugadores() }, [])
  useEffect(() => { filtrarJugadores() }, [searchTerm, jugadores, filterCarrera, filterPosicion])

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const filtrarJugadores = () => {
    let filtrados = jugadores
    if (searchTerm.trim() !== "") {
      filtrados = filtrados.filter((j) =>
        j.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${j.nombres} ${j.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.correo_institucional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.carrera?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.usuario?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (filterCarrera.trim() !== "") filtrados = filtrados.filter((j) => j.carrera?.toLowerCase().includes(filterCarrera.toLowerCase()))
    if (filterPosicion !== "") filtrados = filtrados.filter((j) => j.posicion_principal === filterPosicion)
    setJugadoresFiltrados(filtrados)
    setCurrentPage(1)
  }

  const fetchJugadores = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`${BASE_URL}/api/cuentas`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error al cargar jugadores")
      if (data.success) {
        const jugadores = data.data
          .filter((c) => c.rol === "jugador" && c.jugador)
          .map((c) => ({ ...c.jugador, id: c.jugador.id, usuario: c.usuario, cuentaId: c.id, path: c.path || "" }))
        setJugadores(jugadores)
        setJugadoresFiltrados(jugadores)
        setError("")
      } else throw new Error(data.message || "Error al cargar jugadores")
    } catch (err) {
      setError("Error al cargar los jugadores. Intente nuevamente.")
      if (err.message?.includes("401") || err.message?.includes("token")) router.push("/login")
    } finally { setLoading(false) }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
    if (validationErrors[name]) setValidationErrors((p) => ({ ...p, [name]: "" }))
  }

  const emptyForm = {
    nombres: "", apellidos: "", fecha_nacimiento: "", carrera: "",
    posicion_principal: "", altura: "", alcance_estatico: "",
    anos_experiencia_voley: "", numero_celular: "", correo_institucional: "",
    usuario: "", contraseña: "", path: "",
  }

  const handleOpenCreateForm = () => {
    setFormData(emptyForm)
    setPreviewUrl("")
    setValidationErrors({})
    setFormMode("create")
    setIsModalOpen(true)
  }

  const populateForm = (j) => ({
    nombres: j.nombres || "", apellidos: j.apellidos || "",
    fecha_nacimiento: j.fecha_nacimiento ? j.fecha_nacimiento.split("T")[0] : "",
    carrera: j.carrera || "", posicion_principal: j.posicion_principal || "",
    altura: j.altura || "", alcance_estatico: j.alcance_estatico || "",
    anos_experiencia_voley: j.anos_experiencia_voley || "",
    numero_celular: j.numero_celular || "", correo_institucional: j.correo_institucional || "",
    usuario: j.usuario || "", contraseña: "", path: j.path || "",
  })

  const handleViewJugador = (j) => {
    setSelectedJugador(j)
    setFormData(populateForm(j))
    setPreviewUrl(j.path ? j.path : "") // ✅ fix: path ya es URL completa de Cloudinary
    setFormMode("view")
    setIsModalOpen(true)
  }

  const handleEdit = (j) => {
    setSelectedJugador(j)
    setFormData(populateForm(j))
    setPreviewUrl(j.path ? j.path : "") // ✅ fix: path ya es URL completa de Cloudinary
    setValidationErrors({})
    setFormMode("update")
    setIsModalOpen(true)
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingImage(true)
      const token = localStorage.getItem("token")
      const formDataUpload = new FormData()
      formDataUpload.append("imagen", file)

      const res = await fetch(`${BASE_URL}/api/upload/imagen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "Error al subir imagen")

      setFormData((p) => ({ ...p, path: data.data.path }))
      setPreviewUrl(data.data.path) // ✅ fix: path ya es URL completa de Cloudinary
      showNotification("success", "Imagen subida correctamente")
    } catch (err) {
      showNotification("error", err.message || "Error al subir imagen")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = async () => {
    if (formData.path) {
      try {
        const token = localStorage.getItem("token")
        const filename = formData.path.split("/").pop()
        await fetch(`${BASE_URL}/api/upload/imagen/${filename}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (_) {}
    }
    setFormData((p) => ({ ...p, path: "" }))
    setPreviewUrl("")
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.nombres?.trim()) errors.nombres = "Los nombres son obligatorios"
    else if (formData.nombres.length < 2 || formData.nombres.length > 100) errors.nombres = "Entre 2 y 100 caracteres"
    if (!formData.apellidos?.trim()) errors.apellidos = "Los apellidos son obligatorios"
    else if (formData.apellidos.length < 2 || formData.apellidos.length > 100) errors.apellidos = "Entre 2 y 100 caracteres"
    if (!formData.fecha_nacimiento) errors.fecha_nacimiento = "La fecha es obligatoria"
    else {
      const fn = new Date(formData.fecha_nacimiento), hoy = new Date()
      if (fn > hoy) errors.fecha_nacimiento = "No puede ser futura"
      else {
        let edad = hoy.getFullYear() - fn.getFullYear()
        const mes = hoy.getMonth() - fn.getMonth()
        if (mes < 0 || (mes === 0 && hoy.getDate() < fn.getDate())) edad--
        if (edad < 16 || edad > 35) errors.fecha_nacimiento = "Edad entre 16 y 35 años"
      }
    }
    if (!formData.carrera?.trim()) errors.carrera = "La carrera es obligatoria"
    const posicionesValidas = ["armador", "opuesto", "central", "punta", "libero"]
    if (!formData.posicion_principal) errors.posicion_principal = "La posición es obligatoria"
    else if (!posicionesValidas.includes(formData.posicion_principal)) errors.posicion_principal = "Posición inválida"
    if (!formData.altura) errors.altura = "La altura es obligatoria"
    else { const a = parseFloat(formData.altura); if (isNaN(a) || a < 1.5 || a > 2.2) errors.altura = "Entre 1.5 y 2.2 m" }
    if (!formData.alcance_estatico) errors.alcance_estatico = "El alcance es obligatorio"
    else { const a = parseFloat(formData.alcance_estatico); if (isNaN(a) || a < 1.5 || a > 2.5) errors.alcance_estatico = "Entre 1.5 y 2.5 m" }
    if (formData.anos_experiencia_voley === "") errors.anos_experiencia_voley = "Los años son obligatorios"
    else { const e = parseInt(formData.anos_experiencia_voley); if (isNaN(e) || e < 0 || e > 20) errors.anos_experiencia_voley = "Entre 0 y 20" }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.correo_institucional?.trim()) errors.correo_institucional = "El correo es obligatorio"
    else if (!emailRegex.test(formData.correo_institucional)) errors.correo_institucional = "Email inválido"
    if (!formData.numero_celular?.trim()) errors.numero_celular = "El celular es obligatorio"
    else if (!/^\d{8,15}$/.test(formData.numero_celular)) errors.numero_celular = "Entre 8 y 15 dígitos"
    if (!formData.usuario?.trim()) errors.usuario = "El usuario es obligatorio"
    else if (formData.usuario.length < 3 || formData.usuario.length > 50) errors.usuario = "Entre 3 y 50 caracteres"
    if (formMode === "create") {
      if (!formData.contraseña) errors.contraseña = "La contraseña es obligatoria"
      else if (formData.contraseña.length < 6) errors.contraseña = "Mínimo 6 caracteres"
    } else if (formMode === "update" && formData.contraseña && formData.contraseña.length < 6) {
      errors.contraseña = "Mínimo 6 caracteres"
    }
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateForm()
    setValidationErrors(errors)
    if (Object.keys(errors).length > 0) { showNotification("error", "Por favor corrige los errores"); return }
    setLoading(true); setError("")
    try {
      const token = localStorage.getItem("token")
      if (!token) return router.push("/login")
      const requestData = { ...formData, rol: "jugador" }
      if (formMode === "update" && !requestData.contraseña) delete requestData.contraseña
      const baseUrl = `${BASE_URL}/api/cuentas`
      const url = formMode === "create" ? baseUrl : `${baseUrl}/${selectedJugador.cuentaId}`
      const method = formMode === "create" ? "POST" : "PUT"
      const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestData) })
      const data = await response.json()
      if (!response.ok) { if (data.errors && Array.isArray(data.errors)) throw new Error(data.errors.map((e) => e.msg).join(", ")); throw new Error(data.message || "Error") }
      if (data.success) {
        showNotification("success", formMode === "create" ? "Jugadora creada exitosamente" : "Jugadora actualizada exitosamente")
        setIsModalOpen(false)
        setSelectedJugador(null)
        setPreviewUrl("")
        await fetchJugadores()
      } else throw new Error(data.message || "Error")
    } catch (err) { setError(err.message || "Error"); showNotification("error", err.message || "Error") }
    finally { setLoading(false) }
  }

  const handleDeleteJugador = (j) => { setSelectedJugador(j); setShowDeleteModal(true) }

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) return router.push("/login")
      const response = await fetch(`${BASE_URL}/api/cuentas/${selectedJugador.cuentaId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error al eliminar")
      if (data.success) { showNotification("success", "Jugadora eliminada exitosamente"); setShowDeleteModal(false); await fetchJugadores(); setError("") }
      else throw new Error(data.message || "Error al eliminar")
    } catch (err) { setError(err.message || "Error"); showNotification("error", err.message || "Error") }
    finally { setLoading(false); setSelectedJugador(null) }
  }

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = jugadoresFiltrados.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(jugadoresFiltrados.length / itemsPerPage)

  const { nombre, rol } = useAuth()

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-slate-50 placeholder:text-slate-300 ${
      validationErrors[field] ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300 focus:bg-white"
    }`

  const FieldError = ({ field }) =>
    validationErrors[field] ? (
      <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3 flex-shrink-0" />
        {validationErrors[field]}
      </p>
    ) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 font-sans">

      {notification && (
        <div className="fixed top-5 right-5 z-50 animate-slide-in">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium backdrop-blur-sm border ${
            notification.type === "success" ? "bg-emerald-50/90 border-emerald-200 text-emerald-800" : "bg-red-50/90 border-red-200 text-red-800"
          }`}>
            {notification.type === "success"
              ? <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              : <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}
            {notification.message}
            <button onClick={() => setNotification(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="px-6 md:px-12 xl:px-20 py-10 max-w-[1600px] mx-auto">

        

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Buscar</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text" placeholder="Buscar jugadora..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all placeholder:text-slate-300"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Jugadoras</h1>
                    {jugadoresFiltrados.length > 0 && <p className="text-xs text-slate-400">{jugadoresFiltrados.length} registradas</p>}
                  </div>
                </div>
                <button onClick={handleOpenCreateForm} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50">
                  <UserPlus className="h-4 w-4" /> Agregar
                </button>
              </div>

              {error && (
                <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" /> {error}
                </div>
              )}

              {loading && !isModalOpen && !showDeleteModal ? (
                <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <p className="text-sm font-medium">Cargando jugadoras…</p>
                </div>
              ) : jugadoresFiltrados.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Users className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-600">{searchTerm ? "Sin resultados" : "No hay jugadoras"}</p>
                  <p className="text-sm text-center max-w-xs">{searchTerm ? "Intenta con otros términos." : "Agrega tu primera jugadora."}</p>
                </div>
              ) : (
                <>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {currentItems.map((jugador) => {
                      const pc = posColor(jugador.posicion_principal)
                      return (
                        <div key={jugador.id} className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${pc.bg.replace("100", "400")}`} />
                          <div className="flex gap-4 p-5 pl-6">
                            <div className="w-[72px] h-[72px] rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-100 group-hover:border-indigo-200 transition-colors flex-shrink-0">
                              {jugador.path ? (
                                <img src={jugador.path} alt={jugador.nombres} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex" }} />
                              ) : null}
                              <Users className="h-8 w-8 text-slate-300" style={{ display: jugador.path ? "none" : "flex" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">{jugador.nombres} {jugador.apellidos}</h3>
                                <span className={`flex-shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${pc.bg} ${pc.text} border ${pc.border}`}>{jugador.posicion_principal}</span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-slate-500"><span className="text-slate-300">@</span><span className="font-medium truncate">{jugador.usuario}</span></div>
                                <div className="flex items-center gap-2 text-xs text-slate-500"><span className="text-slate-300">📚</span><span className="truncate">{jugador.carrera}</span></div>
                                <div className="flex items-center gap-2 text-xs text-slate-500"><span className="text-slate-300">⭐</span><span>{jugador.anos_experiencia_voley} años de experiencia</span></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center border-t border-slate-100 divide-x divide-slate-100">
                            <button onClick={() => handleViewJugador(jugador)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Eye className="h-3.5 w-3.5" /> Ver</button>
                            <button onClick={() => handleEdit(jugador)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-all"><Edit className="h-3.5 w-3.5" /> Editar</button>
                            <button onClick={() => handleDeleteJugador(jugador)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">{indexOfFirstItem + 1}–{Math.min(indexOfLastItem, jugadoresFiltrados.length)} de {jugadoresFiltrados.length}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-indigo-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 transition-all"><ChevronLeft className="h-4 w-4" /></button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let page
                          if (totalPages <= 5) page = i + 1
                          else if (currentPage <= 3) page = i + 1
                          else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                          else page = currentPage - 2 + i
                          return <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200"}`}>{page}</button>
                        })}
                        <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-indigo-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 transition-all"><ChevronRight className="h-4 w-4" /></button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {formMode === "create" && "Nueva Jugadora"}
                  {formMode === "update" && "Editar Jugadora"}
                  {formMode === "view" && "Perfil de Jugadora"}
                </h2>
                <p className="text-indigo-200 text-xs mt-1">
                  {formMode === "create" && "Completa la información para registrar una nueva jugadora"}
                  {formMode === "update" && "Modifica los datos de la jugadora"}
                  {formMode === "view" && "Información completa de la jugadora"}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-indigo-200 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all"><X className="h-5 w-5" /></button>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-108px)]">
              <form onSubmit={handleSubmit} className="p-8 space-y-7">

                {/* Foto */}
                <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center overflow-hidden border-2 border-slate-200 shadow-sm flex-shrink-0">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" onError={() => setPreviewUrl("")} />
                    ) : (
                      <Camera className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Foto de perfil <span className="text-slate-400 font-normal">(opcional)</span></label>
                    {formMode !== "view" && (
                      <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploadingImage} className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 cursor-pointer" />
                    )}
                    <p className="text-xs text-slate-400 mt-1.5">{uploadingImage ? "Subiendo imagen…" : "JPG, PNG, GIF, WEBP · Máx. 5 MB"}</p>
                    {previewUrl && formMode !== "view" && (
                      <button type="button" onClick={handleRemoveImage} className="mt-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Eliminar imagen</button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Nombres *</label><input type="text" name="nombres" value={formData.nombres} onChange={handleInputChange} disabled={formMode === "view"} className={inputClass("nombres")} /><FieldError field="nombres" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Apellidos *</label><input type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange} disabled={formMode === "view"} className={inputClass("apellidos")} /><FieldError field="apellidos" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Fecha de Nacimiento *</label><input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange} disabled={formMode === "view"} className={inputClass("fecha_nacimiento")} /><FieldError field="fecha_nacimiento" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Correo Institucional *</label><input type="email" name="correo_institucional" value={formData.correo_institucional} onChange={handleInputChange} disabled={formMode === "view"} className={inputClass("correo_institucional")} /><FieldError field="correo_institucional" /></div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Carrera *</label>
                    <select name="carrera" value={formData.carrera} onChange={handleInputChange} disabled={formMode === "view"} className={inputClass("carrera")}>
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
                      <option value="licenciatura en diseño grafico">Diseño Gráfico</option>
                    </select>
                    <FieldError field="carrera" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Posición Principal *</label>
                    <select name="posicion_principal" value={formData.posicion_principal} onChange={handleInputChange} disabled={formMode === "view"} className={inputClass("posicion_principal")}>
                      <option value="">Seleccionar posición</option>
                      <option value="armador">Armador</option>
                      <option value="opuesto">Opuesto</option>
                      <option value="central">Central</option>
                      <option value="punta">Punta</option>
                      <option value="libero">Líbero</option>
                    </select>
                    <FieldError field="posicion_principal" />
                  </div>
                  <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Años de Experiencia *</label><input type="number" name="anos_experiencia_voley" value={formData.anos_experiencia_voley} onChange={handleInputChange} disabled={formMode === "view"} className={inputClass("anos_experiencia_voley")} min="0" max="20" placeholder="0" /><FieldError field="anos_experiencia_voley" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Altura (m) *</label><input type="number" name="altura" value={formData.altura} onChange={handleInputChange} disabled={formMode === "view"} className={inputClass("altura")} min="1.5" max="2.2" step="0.01" placeholder="1.85" /><FieldError field="altura" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Número de Celular *</label><input type="tel" name="numero_celular" value={formData.numero_celular} onChange={(e) => { const value = e.target.value.replace(/\D/g, "").slice(0, 8); handleInputChange({ target: { name: "numero_celular", value } }) }} maxLength={8} disabled={formMode === "view"} className={inputClass("numero_celular")} /><FieldError field="numero_celular" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Alcance Estático (m) *</label><input type="number" name="alcance_estatico" value={formData.alcance_estatico} onChange={handleInputChange} disabled={formMode === "view"} className={inputClass("alcance_estatico")} min="1.5" max="2.5" step="0.01" placeholder="2.10" /><FieldError field="alcance_estatico" /></div>

                  {formMode !== "view" && (
                    <>
                      <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Usuario *</label><input type="text" name="usuario" value={formData.usuario} onChange={handleInputChange} className={inputClass("usuario")} placeholder="Nombre de usuario" /><FieldError field="usuario" /></div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">{formMode === "create" ? "Contraseña *" : "Nueva contraseña (opcional)"}</label>
                        <input type="password" name="contraseña" value={formData.contraseña} onChange={handleInputChange} className={inputClass("contraseña")} placeholder={formMode === "create" ? "Mínimo 6 caracteres" : "Dejar vacío para no cambiar"} required={formMode === "create"} />
                        <FieldError field="contraseña" />
                      </div>
                    </>
                  )}
                  {formMode === "view" && (
                    <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Usuario</label><input type="text" value={formData.usuario} disabled className={inputClass("usuario")} /></div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all">{formMode === "view" ? "Cerrar" : "Cancelar"}</button>
                  {formMode !== "view" && (
                    <button type="submit" disabled={loading || uploadingImage} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {formMode === "create" ? "Crear jugadora" : "Guardar cambios"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && selectedJugador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200">
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5"><Trash2 className="h-7 w-7 text-red-500" /></div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar jugadora?</h3>
              <p className="text-sm text-slate-500 mb-7">Se eliminará permanentemente a <span className="font-semibold text-slate-700">{selectedJugador.nombres} {selectedJugador.apellidos}</span>. Esta acción no se puede deshacer.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all">Cancelar</button>
                <button onClick={handleDeleteConfirm} disabled={loading} className="flex-1 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />} Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.25s ease; }
      `}</style>
    </div>
  )
}