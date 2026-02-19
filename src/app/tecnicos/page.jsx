"use client"

import { useState, useEffect } from "react"
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
  User,
} from "lucide-react"
import { useAuth } from "../../contexts/auth-context"

export default function TecnicosPage() {
  const router = useRouter()
  const [tecnicos, setTecnicos] = useState([])
  const [tecnicosFiltrados, setTecnicosFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [formMode, setFormMode] = useState("create")
  const [selectedTecnico, setSelectedTecnico] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [notification, setNotification] = useState(null)

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
  const [validationErrors, setValidationErrors] = useState({})

  const { user } = useAuth()

  useEffect(() => { fetchTecnicos() }, [])
  useEffect(() => { filtrarTecnicos() }, [searchTerm, tecnicos])

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const filtrarTecnicos = () => {
    let filtrados = tecnicos
    if (searchTerm.trim() !== "") {
      filtrados = filtrados.filter((t) =>
        t.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${t.nombres} ${t.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.correo_institucional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.usuario?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    setTecnicosFiltrados(filtrados)
    setCurrentPage(1)
  }

  const fetchTecnicos = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) { router.push("/login"); return }

      const response = await fetch("https://jenn-back-reac.onrender.com/api/cuentas", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error al cargar técnicos")

      const tecnicosData =
        data.data
          ?.filter((cuenta) => cuenta.rol === "tecnico")
          .map((cuenta) => ({
            id: cuenta.id,
            cuentaId: cuenta.id,
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
    } catch (err) {
      setError("Error al cargar los técnicos. Intente nuevamente.")
      if (err.message?.includes("401") || err.message?.includes("token")) router.push("/login")
    } finally { setLoading(false) }
  }

  const emptyForm = {
    nombres: "", apellidos: "", fecha_nacimiento: "",
    numero_celular: "", correo_institucional: "", usuario: "", contraseña: "",
  }

  const populateForm = (t) => ({
    nombres: t.nombres || "",
    apellidos: t.apellidos || "",
    fecha_nacimiento: t.fecha_nacimiento ? t.fecha_nacimiento.split("T")[0] : "",
    numero_celular: t.numero_celular || "",
    correo_institucional: t.correo_institucional || "",
    usuario: t.usuario || "",
    contraseña: "",
  })

  const handleOpenCreateForm = () => {
    setFormData(emptyForm)
    setValidationErrors({})
    setFormMode("create")
    setIsModalOpen(true)
  }

  const handleViewTecnico = (t) => {
    setSelectedTecnico(t)
    setFormData(populateForm(t))
    setFormMode("view")
    setIsModalOpen(true)
  }

  const handleEdit = (t) => {
    setSelectedTecnico(t)
    setFormData(populateForm(t))
    setValidationErrors({})
    setFormMode("update")
    setIsModalOpen(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
    if (validationErrors[name]) setValidationErrors((p) => ({ ...p, [name]: "" }))
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.nombres.trim()) errors.nombres = "Los nombres son obligatorios"
    else if (formData.nombres.length < 2 || formData.nombres.length > 50) errors.nombres = "Entre 2 y 50 caracteres"
    if (!formData.apellidos.trim()) errors.apellidos = "Los apellidos son obligatorios"
    else if (formData.apellidos.length < 2 || formData.apellidos.length > 50) errors.apellidos = "Entre 2 y 50 caracteres"
    if (!formData.fecha_nacimiento) {
      errors.fecha_nacimiento = "La fecha es obligatoria"
    } else {
      const fn = new Date(formData.fecha_nacimiento), hoy = new Date()
      let edad = hoy.getFullYear() - fn.getFullYear()
      const mes = hoy.getMonth() - fn.getMonth()
      if (mes < 0 || (mes === 0 && hoy.getDate() < fn.getDate())) edad--
      if (edad < 18 || edad > 70) errors.fecha_nacimiento = "Edad entre 18 y 70 años"
    }
    if (!formData.numero_celular.trim()) errors.numero_celular = "El celular es obligatorio"
    else if (!/^\d{8,15}$/.test(formData.numero_celular)) errors.numero_celular = "Entre 8 y 15 dígitos"
    if (!formData.correo_institucional.trim()) errors.correo_institucional = "El correo es obligatorio"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_institucional)) errors.correo_institucional = "Formato de correo inválido"
    if (!formData.usuario.trim()) errors.usuario = "El usuario es obligatorio"
    else if (formData.usuario.length < 3 || formData.usuario.length > 20) errors.usuario = "Entre 3 y 20 caracteres"
    if (formMode === "create" && !formData.contraseña.trim()) errors.contraseña = "La contraseña es obligatoria"
    else if (formData.contraseña && formData.contraseña.length < 6) errors.contraseña = "Mínimo 6 caracteres"
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
      const submitData = { ...formData, rol: "tecnico" }
      const baseUrl = "https://jenn-back-reac.onrender.com/api/cuentas"
      const url = formMode === "create" ? baseUrl : `${baseUrl}/${selectedTecnico.cuentaId}`
      const method = formMode === "create" ? "POST" : "PUT"
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error al procesar la solicitud")
      if (data.success) {
        showNotification("success", formMode === "create" ? "Técnico creado exitosamente" : "Técnico actualizado exitosamente")
        setIsModalOpen(false)
        setSelectedTecnico(null)
        await fetchTecnicos()
      } else throw new Error(data.message || "Error")
    } catch (err) {
      setError(err.message)
      showNotification("error", err.message || "Error")
    } finally { setLoading(false) }
  }

  const handleDeleteTecnico = (t) => { setSelectedTecnico(t); setShowDeleteModal(true) }

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) return router.push("/login")
      const response = await fetch(`https://jenn-back-reac.onrender.com/api/cuentas/${selectedTecnico.cuentaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error al eliminar")
      if (data.success) {
        showNotification("success", "Técnico eliminado exitosamente")
        setShowDeleteModal(false)
        await fetchTecnicos()
        setError("")
      } else throw new Error(data.message || "Error al eliminar")
    } catch (err) {
      setError(err.message)
      showNotification("error", err.message || "Error")
    } finally { setLoading(false); setSelectedTecnico(null) }
  }

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = tecnicosFiltrados.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(tecnicosFiltrados.length / itemsPerPage)

  // Input helper
  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-slate-50 placeholder:text-slate-300 ${
      validationErrors[field]
        ? "border-red-400 bg-red-50"
        : "border-slate-200 hover:border-slate-300 focus:bg-white"
    }`

  const FieldError = ({ field }) =>
    validationErrors[field] ? (
      <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3 flex-shrink-0" />
        {validationErrors[field]}
      </p>
    ) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-100 font-sans">

      {/* Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 animate-slide-in">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium backdrop-blur-sm border ${
            notification.type === "success"
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-800"
              : "bg-red-50/90 border-red-200 text-red-800"
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

      {/* Page wrapper */}
      <div className="px-6 md:px-12 xl:px-20 py-10 max-w-[1600px] mx-auto">

        {/* Admin card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm px-6 py-4 mb-8 flex items-center gap-4 w-full">
          <div className="w-12 h-12 rounded-xl bg-red-700 flex items-center justify-center shadow-md shadow-red-200 flex-shrink-0">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Administrador</p>
            <h2 className="text-base font-bold text-slate-800 leading-tight">{user?.usuario?.toUpperCase() || "ADMIN"}</h2>
          </div>
        </div>

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Sidebar search */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Buscar</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar técnico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all placeholder:text-slate-300"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="mt-3 w-full text-xs text-slate-500 hover:text-slate-700 font-medium py-2 hover:bg-slate-100 rounded-lg transition-colors">
                  Limpiar búsqueda
                </button>
              )}
            </div>
          </div>

          {/* Main panel */}
          <div className="lg:col-span-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-700 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Técnicos</h1>
                    {tecnicosFiltrados.length > 0 && (
                      <p className="text-xs text-slate-400">{tecnicosFiltrados.length} registrados</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleOpenCreateForm}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-red-200 transition-all hover:shadow-lg hover:shadow-red-200 disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Agregar
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                  {error}
                </div>
              )}

              {/* Loading */}
              {loading && !isModalOpen && !showDeleteModal ? (
                <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-red-700 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <p className="text-sm font-medium">Cargando técnicos…</p>
                </div>
              ) : tecnicosFiltrados.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Users className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-600">
                    {searchTerm ? "Sin resultados" : "No hay técnicos"}
                  </p>
                  <p className="text-sm text-center max-w-xs">
                    {searchTerm ? "Intenta con otros términos de búsqueda." : "Agrega tu primer técnico al sistema."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Cards grid */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {currentItems.map((tecnico) => (
                      <div
                        key={tecnico.id}
                        className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-red-200 transition-all duration-300 overflow-hidden"
                      >
                        {/* Accent strip */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400" />

                        <div className="flex gap-4 p-5 pl-6">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-[72px] h-[72px] rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-100 group-hover:border-red-200 transition-colors">
                              <Users className="h-8 w-8 text-slate-300" />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">
                                {tecnico.nombres} {tecnico.apellidos}
                              </h3>
                              <span className="flex-shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-red-100 text-red-700 border border-red-200">
                                Técnico
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="text-slate-300">@</span>
                                <span className="font-medium truncate">{tecnico.usuario}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="text-slate-300">📞</span>
                                <span className="truncate">{tecnico.numero_celular}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="text-slate-300">📧</span>
                                <span className="truncate">{tecnico.correo_institucional}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center border-t border-slate-100 divide-x divide-slate-100">
                          <button
                            onClick={() => handleViewTecnico(tecnico)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" /> Ver
                          </button>
                          <button
                            onClick={() => handleEdit(tecnico)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                          >
                            <Edit className="h-3.5 w-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => handleDeleteTecnico(tecnico)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, tecnicosFiltrados.length)} de {tecnicosFiltrados.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 disabled:border-slate-100 transition-all"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
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
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                currentPage === page
                                  ? "bg-red-700 text-white shadow-md shadow-red-200"
                                  : "text-slate-500 hover:bg-red-50 hover:text-red-700 border border-slate-200"
                              }`}
                            >
                              {page}
                            </button>
                          )
                        })}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 disabled:border-slate-100 transition-all"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal create / edit / view */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden border border-slate-200">

            {/* Modal header */}
            <div className="bg-gradient-to-r from-red-800 to-red-700 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {formMode === "create" && "Nuevo Técnico"}
                  {formMode === "update" && "Editar Técnico"}
                  {formMode === "view" && "Perfil de Técnico"}
                </h2>
                <p className="text-red-200 text-xs mt-1">
                  {formMode === "create" && "Completa la información para registrar un nuevo técnico"}
                  {formMode === "update" && "Modifica los datos del técnico"}
                  {formMode === "view" && "Información completa del técnico"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-red-200 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto max-h-[calc(95vh-108px)]">
              <form onSubmit={handleSubmit} className="p-8 space-y-7">

                {/* Form grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Nombres */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Nombres *</label>
                    <input
                      type="text" name="nombres" value={formData.nombres}
                      onChange={handleInputChange} disabled={formMode === "view"}
                      placeholder="Ej: Juan Carlos"
                      className={inputClass("nombres")} required={formMode !== "view"}
                    />
                    <FieldError field="nombres" />
                  </div>

                  {/* Apellidos */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Apellidos *</label>
                    <input
                      type="text" name="apellidos" value={formData.apellidos}
                      onChange={handleInputChange} disabled={formMode === "view"}
                      placeholder="Ej: García López"
                      className={inputClass("apellidos")} required={formMode !== "view"}
                    />
                    <FieldError field="apellidos" />
                  </div>

                  {/* Usuario */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Usuario *</label>
                    <input
                      type="text" name="usuario" value={formData.usuario}
                      onChange={handleInputChange} disabled={formMode === "view"}
                      placeholder="Ej: jgarcia"
                      className={inputClass("usuario")} required={formMode !== "view"}
                    />
                    <FieldError field="usuario" />
                  </div>

                  {/* Fecha nacimiento */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Fecha de Nacimiento *</label>
                    <input
                      type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento}
                      onChange={handleInputChange} disabled={formMode === "view"}
                      className={inputClass("fecha_nacimiento")} required={formMode !== "view"}
                    />
                    <FieldError field="fecha_nacimiento" />
                  </div>

                  {/* Correo */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Correo Institucional *</label>
                    <input
                      type="email" name="correo_institucional" value={formData.correo_institucional}
                      onChange={handleInputChange} disabled={formMode === "view"}
                      placeholder="Ej: juan.garcia@universidad.edu"
                      className={inputClass("correo_institucional")} required={formMode !== "view"}
                    />
                    <FieldError field="correo_institucional" />
                  </div>

                  {/* Celular */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Número de Celular *</label>
                    <input
                      type="tel" name="numero_celular" value={formData.numero_celular}
                      onChange={handleInputChange} disabled={formMode === "view"}
                      placeholder="Ej: 71234567"
                      className={inputClass("numero_celular")} required={formMode !== "view"}
                    />
                    <FieldError field="numero_celular" />
                  </div>

                  {/* Contraseña */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {formMode === "create" ? "Contraseña *" : formMode === "update" ? "Nueva contraseña (opcional)" : "Contraseña"}
                    </label>
                    <input
                      type={formMode === "view" ? "text" : "password"}
                      name="contraseña" value={formData.contraseña}
                      onChange={handleInputChange} disabled={formMode === "view"}
                      placeholder={
                        formMode === "create" ? "Mínimo 6 caracteres"
                        : formMode === "update" ? "Dejar en blanco para mantener la actual"
                        : "Contraseña"
                      }
                      className={inputClass("contraseña")}
                      required={formMode === "create"}
                    />
                    <FieldError field="contraseña" />
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all"
                  >
                    {formMode === "view" ? "Cerrar" : "Cancelar"}
                  </button>
                  {formMode !== "view" && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {formMode === "create" ? "Crear técnico" : "Guardar cambios"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && selectedTecnico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200">
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Trash2 className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar técnico?</h3>
              <p className="text-sm text-slate-500 mb-7">
                Se eliminará permanentemente a{" "}
                <span className="font-semibold text-slate-700">{selectedTecnico.nombres} {selectedTecnico.apellidos}</span>.
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="flex-1 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.25s ease; }
      `}</style>
    </div>
  )
}