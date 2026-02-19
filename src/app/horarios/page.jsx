"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,  
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

export default function HorariosPage() {
  const router = useRouter()
  const [horarios, setHorarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notification, setNotification] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [formMode, setFormMode] = useState("create")
  const [selectedHorario, setSelectedHorario] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()))

  const [formData, setFormData] = useState({
    tipo: "entrenamiento",
    is_recurring: true,
    dia_semana: "",
    fecha_inicio: "",
    fecha_fin: "",
    fecha_evento: "",
    hora_inicio: "",
    hora_fin: "",
    ubicacion: "",
  })

  const [validationErrors, setValidationErrors] = useState({})

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  function getWeekStart(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  function formatDate(date) {
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
  }

  useEffect(() => {
    fetchHorarios()
  }, [])

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const fetchHorarios = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const response = await fetch("https://jenn-back.onrender.com/api/horarios", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar horarios")
      }

      if (data.success) {
        setHorarios(data.data)
        setError("")
      } else {
        throw new Error(data.message || "Error al cargar horarios")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error al cargar los horarios. Intente nuevamente.")
      if (error.message.includes("401") || error.message.includes("token")) {
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleOpenCreateForm = () => {
    setFormData({
      tipo: "entrenamiento",
      is_recurring: true,
      dia_semana: "",
      fecha_inicio: "",
      fecha_fin: "",
      fecha_evento: "",
      hora_inicio: "",
      hora_fin: "",
      ubicacion: "",
    })
    setFormMode("create")
    setShowModal(true)
  }

  const handleEdit = (horario) => {
    setSelectedHorario(horario)
    setFormData({
      tipo: horario.tipo || "entrenamiento",
      is_recurring: horario.is_recurring || false,
      dia_semana: horario.dia_semana || "",
      fecha_inicio: horario.fecha_inicio ? horario.fecha_inicio.split("T")[0] : "",
      fecha_fin: horario.fecha_fin ? horario.fecha_fin.split("T")[0] : "",
      fecha_evento: horario.fecha_evento ? horario.fecha_evento.split("T")[0] : "",
      hora_inicio: horario.hora_inicio || "",
      hora_fin: horario.hora_fin || "",
      ubicacion: horario.ubicacion || "",
    })
    setFormMode("update")
    setShowModal(true)
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.tipo) {
      errors.tipo = "El tipo de evento es obligatorio"
    }

    if (formData.is_recurring) {
      if (!formData.dia_semana) {
        errors.dia_semana = "El día de la semana es obligatorio para eventos recurrentes"
      }
      if (!formData.fecha_inicio) {
        errors.fecha_inicio = "La fecha de inicio es obligatoria"
      }
      if (!formData.fecha_fin) {
        errors.fecha_fin = "La fecha de fin es obligatoria"
      }
    } else {
      if (!formData.fecha_evento) {
        errors.fecha_evento = "La fecha del evento es obligatoria"
      }
    }

    if (!formData.hora_inicio) {
      errors.hora_inicio = "La hora de inicio es obligatoria"
    }

    if (!formData.hora_fin) {
      errors.hora_fin = "La hora de fin es obligatoria"
    }

    if (!formData.ubicacion || formData.ubicacion.trim().length < 3) {
      errors.ubicacion = "La ubicación debe tener al menos 3 caracteres"
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

      const baseUrl = "https://jenn-back.onrender.com/api/horarios"
      const url = formMode === "create" ? baseUrl : `${baseUrl}/${selectedHorario.id}`
      const method = formMode === "create" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al procesar la solicitud")
      }

      if (data.success) {
        showNotification(
          "success",
          formMode === "create" ? "Horario creado exitosamente" : "Horario actualizado exitosamente",
        )
        setShowModal(false)
        setSelectedHorario(null)
        await fetchHorarios()
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

  const handleDeleteHorario = (horario) => {
    setSelectedHorario(horario)
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

      const response = await fetch(`https://jenn-back.onrender.com/api/horarios/${selectedHorario.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al eliminar horario")
      }

      if (data.success) {
        showNotification("success", "Horario eliminado exitosamente")
        setShowDeleteModal(false)
        await fetchHorarios()
        setError("")
      } else {
        throw new Error(data.message || "Error al eliminar horario")
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message || "Error al eliminar horario")
      showNotification("error", error.message || "Error al eliminar horario")
    } finally {
      setLoading(false)
      setSelectedHorario(null)
    }
  }

  const getHorariosForDay = (dayIndex) => {
    const dayName = diasSemana[dayIndex].toLowerCase()
    return horarios.filter((h) => {
      if (h.is_recurring) {
        return h.dia_semana === dayName
      } else {
        const eventDate = new Date(h.fecha_evento)
        const weekDay = eventDate.getDay()
        const adjustedDay = weekDay === 0 ? 6 : weekDay - 1
        return adjustedDay === dayIndex
      }
    })
  }

  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() - 7)
    setCurrentWeekStart(newStart)
  }

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() + 7)
    setCurrentWeekStart(newStart)
  }

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
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-900 via-red-800 to-red-900 bg-clip-text text-transparent mb-2">
                Horarios
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-red-800 to-transparent mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Gestiona los horarios de entrenamientos y partidos</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePreviousWeek}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {formatDate(currentWeekStart)} -{" "}
                    {formatDate(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}
                  </p>
                  <p className="text-sm text-gray-600">Semana actual</p>
                </div>
                <button
                  onClick={handleNextWeek}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <button
                onClick={handleOpenCreateForm}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-700/80 text-white rounded-lg hover:bg-green-800/90 transition-colors font-medium"
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                <span>Agregar horario</span>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {loading && !showModal && !showDeleteModal ? (
              <div className="p-12 text-center bg-white rounded-2xl shadow-xl">
                <Loader2 className="h-8 w-8 animate-spin text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Cargando horarios...</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-7 border-b border-gray-200">
                      {diasSemana.map((dia, index) => {
                        const dayDate = new Date(currentWeekStart)
                        dayDate.setDate(dayDate.getDate() + index)
                        return (
                          <div key={dia} className="p-4 text-center border-r border-gray-200 last:border-r-0">
                            <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">{dia}</p>
                            <p className="text-xs text-gray-600 mt-1">{formatDate(dayDate)}</p>
                          </div>
                        )
                      })}
                    </div>

                    <div className="grid grid-cols-7 min-h-[500px]">
                      {diasSemana.map((dia, index) => {
                        const horariosDelDia = getHorariosForDay(index)
                        return (
                          <div
                            key={dia}
                            className="border-r border-gray-200 last:border-r-0 p-3 bg-gray-50/30 hover:bg-gray-50/60 transition-colors"
                          >
                            <div className="space-y-2">
                              {horariosDelDia.length === 0 ? (
                                <div className="text-center py-8">
                                  <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                  <p className="text-xs text-gray-400">Sin horarios</p>
                                </div>
                              ) : (
                                horariosDelDia.map((horario) => (
                                  <div
                                    key={horario.id}
                                    className={`p-3 rounded-lg border-l-4 ${
                                      horario.tipo === "entrenamiento"
                                        ? "bg-blue-50 border-blue-500"
                                        : "bg-red-50 border-red-500"
                                    } hover:shadow-md transition-all duration-200 group cursor-pointer`}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <p
                                          className={`text-xs font-bold uppercase tracking-wide ${
                                            horario.tipo === "entrenamiento" ? "text-blue-700" : "text-red-700"
                                          }`}
                                        >
                                          {horario.tipo}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1">
                                          <Clock className="h-3 w-3 text-gray-600" />
                                          <p className="text-xs text-gray-700 font-medium">
                                            {horario.hora_inicio} - {horario.hora_fin}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => handleEdit(horario)}
                                          className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
                                          title="Editar"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteHorario(horario)}
                                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                                          title="Eliminar"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-gray-600" />
                                      <p className="text-xs text-gray-600">{horario.ubicacion}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden border border-gray-100 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-red-900 to-red-800 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {formMode === "create" ? "Agregar Nuevo Horario" : "Editar Horario"}
                  </h2>
                  <p className="text-red-100 text-sm mt-1">
                    {formMode === "create"
                      ? "Completa la información del nuevo horario"
                      : "Modifica la información del horario"}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-red-100 hover:text-white transition-colors p-2 hover:bg-red-800 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <form onSubmit={handleSubmit} className="p-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Tipo de Evento *
                      </label>
                      <select
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                          validationErrors.tipo ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                        required
                      >
                        <option value="entrenamiento">Entrenamiento</option>
                        <option value="partido">Partido</option>
                      </select>
                      {validationErrors.tipo && (
                        <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.tipo}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="is_recurring"
                          checked={formData.is_recurring}
                          onChange={handleInputChange}
                          className="w-5 h-5 text-red-900 border-gray-300 rounded focus:ring-red-900"
                        />
                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Evento Recurrente
                        </span>
                      </label>
                      <p className="text-xs text-gray-600">Marca esta opción si el evento se repite semanalmente</p>
                    </div>
                  </div>

                  {formData.is_recurring ? (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Día de la Semana *
                        </label>
                        <select
                          name="dia_semana"
                          value={formData.dia_semana}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                            validationErrors.dia_semana
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          required
                        >
                          <option value="">Seleccionar día</option>
                          {diasSemana.map((dia) => (
                            <option key={dia} value={dia.toLowerCase()}>
                              {dia}
                            </option>
                          ))}
                        </select>
                        {validationErrors.dia_semana && (
                          <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.dia_semana}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Fecha de Inicio *
                          </label>
                          <input
                            type="date"
                            name="fecha_inicio"
                            value={formData.fecha_inicio}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                              validationErrors.fecha_inicio
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            required
                          />
                          {validationErrors.fecha_inicio && (
                            <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {validationErrors.fecha_inicio}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Fecha de Fin *
                          </label>
                          <input
                            type="date"
                            name="fecha_fin"
                            value={formData.fecha_fin}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                              validationErrors.fecha_fin
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            required
                          />
                          {validationErrors.fecha_fin && (
                            <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {validationErrors.fecha_fin}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Fecha del Evento *
                      </label>
                      <input
                        type="date"
                        name="fecha_evento"
                        value={formData.fecha_evento}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                          validationErrors.fecha_evento
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        required
                      />
                      {validationErrors.fecha_evento && (
                        <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.fecha_evento}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Hora de Inicio *
                      </label>
                      <input
                        type="time"
                        name="hora_inicio"
                        value={formData.hora_inicio}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                          validationErrors.hora_inicio
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        required
                      />
                      {validationErrors.hora_inicio && (
                        <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.hora_inicio}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Hora de Fin *
                      </label>
                      <input
                        type="time"
                        name="hora_fin"
                        value={formData.hora_fin}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                          validationErrors.hora_fin
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        required
                      />
                      {validationErrors.hora_fin && (
                        <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.hora_fin}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Ubicación *
                    </label>
                    <input
                      type="text"
                      name="ubicacion"
                      value={formData.ubicacion}
                      onChange={handleInputChange}
                      placeholder="Ej: Gimnasio Principal"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 focus:border-red-900 transition-all duration-200 ${
                        validationErrors.ubicacion
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                    />
                    {validationErrors.ubicacion && (
                      <p className="text-red-500 text-sm font-medium flex items-center mt-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.ubicacion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-xl hover:from-red-800 hover:to-red-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                    <span>{formMode === "create" ? "Crear horario" : "Actualizar horario"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedHorario && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Confirmar eliminación</h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                ¿Estás seguro de que deseas eliminar este horario de{" "}
                <span className="font-bold text-gray-900">{selectedHorario.tipo}</span>? Esta acción no se puede
                deshacer.
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
