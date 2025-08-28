"use client"

import { useState, useEffect, useRef } from "react"
import Navbar from "../componentes/sidebar"
import Pusher from "pusher-js"
import { Play, User, Loader2, Clock, Zap, StopCircle, ChevronUp, ChevronDown, Save, CheckCircle } from 'lucide-react'

// URL de la API para cargar jugadores
const API_URL = "https://jenn.onrender.com"

// Configuración de Pusher
const PUSHER_KEY = "4f85ef5c792df94cebc9"
const PUSHER_CLUSTER = "us2"
const PUSHER_CHANNEL = "wsjenn"
const PUSHER_EVENT = "command"

export default function PruebaReaccion() {
  // Estados para usuarios y selección
  const [jugadores, setJugadores] = useState([])
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Estados para la prueba
  const [pruebaActiva, setPruebaActiva] = useState(false)
  const [pruebaCompletada, setPruebaCompletada] = useState(false)
  const [esperandoResultadoFinal, setEsperandoResultadoFinal] = useState(false)
  const [numeroPulsaciones, setNumeroPulsaciones] = useState(null)
  const [mensajeEstado, setMensajeEstado] = useState("")
  const [enviandoComando, setEnviandoComando] = useState(false)

  // Estados para el cronómetro
  const [tiempo, setTiempo] = useState(0)
  const [reacciones, setReacciones] = useState([])
  const intervaloRef = useRef(null)

  // Referencias para controlar el flujo
  const pusherRef = useRef(null)
  const resultadosGuardadosRef = useRef(false)

  // Nuevo estado para el tiempo límite seleccionable
  const [tiempoLimite, setTiempoLimite] = useState(10) // Valor predeterminado: 10 segundos
  const tiempoLimiteRef = useRef(10)

  // Actualizar la referencia cuando cambia el tiempo límite
  useEffect(() => {
    tiempoLimiteRef.current = tiempoLimite
  }, [tiempoLimite])

  // Cargar jugadores al iniciar
  useEffect(() => {
    cargarJugadores()
  }, [])

  // Función para cargar jugadores desde la API
  const cargarJugadores = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("Iniciando carga de jugadores desde:", `${API_URL}/usuarios`)

      const response = await fetch(`${API_URL}/usuarios`, {
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Error al obtener usuarios: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Datos recibidos de la API:", data)

      if (!Array.isArray(data)) {
        throw new Error(`Respuesta inesperada: los datos no son un array. Recibido: ${typeof data}`)
      }

      // Filtrar solo los usuarios con rol "jugador"
      let soloJugadores = []

      // Intentar diferentes propiedades para el rol
      if (data.some((usuario) => usuario.rol !== undefined)) {
        console.log("Filtrando por propiedad 'rol'")
        soloJugadores = data.filter((usuario) => usuario.rol === "jugador")
      } else if (data.some((usuario) => usuario.role !== undefined)) {
        console.log("Filtrando por propiedad 'role'")
        soloJugadores = data.filter((usuario) => usuario.role === "jugador")
      } else {
        console.log("No se encontró propiedad de rol, usando todos los usuarios")
        soloJugadores = data
      }

      console.log(`Se encontraron ${soloJugadores.length} jugadores de ${data.length} usuarios`)
      setJugadores(soloJugadores)
      setError("")
    } catch (error) {
      console.error("Error al cargar jugadores:", error)
      setError(`Error al cargar los jugadores: ${error.message}`)
      setJugadores([]) // Limpiar el estado en caso de error
    } finally {
      setLoading(false)
    }
  }

  // Inicializar Pusher al cargar el componente
  useEffect(() => {
    // Si la prueba está completada, no necesitamos escuchar eventos
    if (pruebaCompletada && !esperandoResultadoFinal) {
      console.log("Prueba completada, desconectando Pusher")
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(PUSHER_CHANNEL)
        pusherRef.current.disconnect()
      }
      return
    }

    // Inicializar el cliente Pusher
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      encrypted: true,
    })

    // Suscribirse al canal
    const channel = pusher.subscribe(PUSHER_CHANNEL)

    // Escuchar eventos en el canal
    channel.bind(PUSHER_EVENT, (data) => {
      console.log("Evento command recibido:", data)

      // Procesar el mensaje recibido
      if ((pruebaActiva || esperandoResultadoFinal) && data.message && !pruebaCompletada) {
        procesarMensaje(data.message)
      } else {
        console.log("Ignorando mensaje porque la prueba no está activa o ya está completada")
      }
    })

    // También escuchar eventos client-message (alternativa)
    channel.bind("client-message", (data) => {
      console.log("Evento client-message recibido:", data)

      // Procesar el mensaje recibido
      if ((pruebaActiva || esperandoResultadoFinal) && data.message && !pruebaCompletada) {
        procesarMensaje(data.message)
      } else {
        console.log("Ignorando mensaje porque la prueba no está activa o ya está completada")
      }
    })

    pusherRef.current = pusher

    // Limpiar al desmontar
    return () => {
      if (pusher) {
        pusher.unsubscribe(PUSHER_CHANNEL)
        pusher.disconnect()
      }
    }
  }, [pruebaActiva, pruebaCompletada, esperandoResultadoFinal])

  // Función para procesar mensajes recibidos
  const procesarMensaje = (mensaje) => {
    console.log("Procesando mensaje:", mensaje)

    // Si estamos esperando el resultado final
    if (esperandoResultadoFinal && !pruebaCompletada) {
      try {
        // Intentar convertir el mensaje a número
        const pulsaciones = Number.parseInt(mensaje, 10)
        if (!isNaN(pulsaciones)) {
          setNumeroPulsaciones(pulsaciones)
          setEsperandoResultadoFinal(false)
          setPruebaCompletada(true)
          setMensajeEstado(
            `Prueba completada. Se registraron ${reacciones.length} reacciones en ${tiempo.toFixed(2)} segundos. Total de pulsaciones: ${pulsaciones}`,
          )
          return
        }
      } catch (error) {
        console.error("Error al procesar el número de pulsaciones:", error)
      }
    }

    // Registrar el tiempo de reacción cuando se recibe un mensaje durante la prueba activa
    if (pruebaActiva && !pruebaCompletada) {
      setReacciones((prev) => [...prev, { tiempo: tiempo, mensaje }])
      setMensajeEstado(`Reacción registrada: ${mensaje} a los ${tiempo.toFixed(2)} segundos`)
    }
  }

  // Función para incrementar el tiempo límite en 10 segundos
  const incrementarTiempo = () => {
    if (tiempoLimite < 60) {
      // Limitamos a un máximo de 60 segundos
      setTiempoLimite(tiempoLimite + 10)
    }
  }

  // Función para decrementar el tiempo límite en 10 segundos
  const decrementarTiempo = () => {
    if (tiempoLimite > 10) {
      // Mínimo 10 segundos
      setTiempoLimite(tiempoLimite - 10)
    }
  }

  // Calcular el valor a enviar basado en el tiempo seleccionado
  const calcularValorTiempo = () => {
    return tiempoLimite / 10
  }

  // Iniciar la prueba
  const iniciarPrueba = async () => {
    if (!jugadorSeleccionado) return

    try {
      // Reiniciar el estado de resultados guardados
      resultadosGuardadosRef.current = false
      
      // Enviar el comando Z con el valor calculado
      const valorTiempo = calcularValorTiempo()
      setMensajeEstado(`Enviando comando Z${valorTiempo}...`)
      setEnviandoComando(true)

      console.log("Enviando comando:", `Z${valorTiempo}`)
      
      const response = await fetch(`${API_URL}/esp32/comando`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comando: `Z${valorTiempo}`, // Concatenar Z con el valor
          userId: jugadorSeleccionado?.id || "test-user",
        }),
      })

      if (!response.ok) {
        throw new Error("Error al enviar comando Z")
      }

      // Iniciar la prueba
      setPruebaActiva(true)
      setPruebaCompletada(false)
      setEsperandoResultadoFinal(false)
      setNumeroPulsaciones(null)
      setTiempo(0)
      setReacciones([])
      setMensajeEstado(`Prueba iniciada para ${tiempoLimite} segundos. Esperando reacciones...`)

      // Iniciar el cronómetro
      intervaloRef.current = setInterval(() => {
        setTiempo((prevTiempo) => {
          const nuevoTiempo = prevTiempo + 0.01

          // Verificar si se ha alcanzado el tiempo límite
          if (nuevoTiempo >= tiempoLimiteRef.current) {
            finalizarPrueba()
          }

          return nuevoTiempo
        })
      }, 10) // Actualizar cada 10ms para mayor precisión

      console.log(`Comando Z${valorTiempo} enviado al ESP32`)
    } catch (error) {
      console.error("Error:", error)
      setMensajeEstado(`Error: ${error.message}`)
    } finally {
      setEnviandoComando(false)
    }
  }

  // Finalizar la prueba
  const finalizarPrueba = () => {
    // Detener el cronómetro
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }

    // Actualizar estados
    setPruebaActiva(false)
    setEsperandoResultadoFinal(true)
    setMensajeEstado(`Prueba finalizada. Esperando resultado final del ESP32...`)
  }

  // Finalizar manualmente la prueba
  const finalizarManualmente = () => {
    finalizarPrueba()
  }

  // Reiniciar la prueba
  const reiniciarPrueba = () => {
    // Detener el cronómetro si está activo
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }

    // Reiniciar estados
    setPruebaActiva(false)
    setPruebaCompletada(false)
    setEsperandoResultadoFinal(false)
    setNumeroPulsaciones(null)
    setTiempo(0)
    setReacciones([])
    setMensajeEstado("")
    resultadosGuardadosRef.current = false
  }

  // Manejar cambio de jugador seleccionado
  const handleJugadorChange = (e) => {
    const jugadorId = e.target.value
    if (jugadorId) {
      const jugador = jugadores.find((j) => j.id.toString() === jugadorId)
      setJugadorSeleccionado(jugador)
    } else {
      setJugadorSeleccionado(null)
    }
  }

  // Limpiar el intervalo al desmontar el componente
  useEffect(() => {
    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current)
      }
    }
  }, [])

  // Formatear el tiempo para mostrar
  const formatearTiempo = (tiempo) => {
    const segundos = Math.floor(tiempo)
    const milisegundos = Math.floor((tiempo - segundos) * 100)
    return `${segundos}.${milisegundos.toString().padStart(2, "0")}`
  }

  // NUEVA FUNCIÓN: Guardar resultados de la prueba
  const guardarResultados = async () => {
    if (!jugadorSeleccionado || !pruebaCompletada || resultadosGuardadosRef.current || numeroPulsaciones === null) {
      return
    }

    try {
      setMensajeEstado("Guardando resultados...")

      const datosAGuardar = {
        jugador_id: jugadorSeleccionado.id,
        aciertos: numeroPulsaciones, // Usamos el número de pulsaciones como aciertos
        tiempo_total: tiempoLimite // Usamos el tiempo límite configurado
      }

      console.log("Guardando resultados:", datosAGuardar)
      resultadosGuardadosRef.current = true // Marcar como guardado antes de la petición para evitar duplicados

      const response = await fetch(`${API_URL}/reacciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosAGuardar),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Error al guardar resultados: ${response.status} ${errorData.message || ""}`)
      }

      const data = await response.json()
      console.log("Resultados guardados exitosamente:", data)
      setMensajeEstado("Resultados guardados exitosamente")
    } catch (error) {
      console.error("Error al guardar resultados:", error)
      setMensajeEstado(`Error al guardar resultados: ${error.message}`)
      resultadosGuardadosRef.current = false // Resetear si hay error para permitir reintentar
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-10">
        <Navbar />
      </div>

      <main className="flex-grow container mx-auto p-4 mt-4">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 pb-3 border-b-2 border-gray-300">
            Prueba de Reacción
          </h2>

          {/* Sección superior: Selector de jugador */}
          <div className="mb-8 p-5 bg-blue-900/10 rounded-xl border border-blue-900/20">
            <h3 className="text-xl font-semibold text-blue-900 mb-3 pb-2 border-b border-blue-900/20">
              Selección de Jugador
            </h3>

            {/* Selector de jugador */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
              <label
                htmlFor="jugador"
                className="block text-lg font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200"
              >
                Seleccionar Jugador:
              </label>

              {loading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-800 mr-2" />
                  <span>Cargando jugadores...</span>
                </div>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : jugadores.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                  No se encontraron jugadores.{" "}
                  <button onClick={cargarJugadores} className="underline text-blue-800">
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
                  <select
                    id="jugador"
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-800 focus:border-blue-800 text-gray-800 transition-all duration-300"
                    onChange={handleJugadorChange}
                    value={jugadorSeleccionado?.id || ""}
                    disabled={pruebaActiva}
                  >
                    <option value="">Seleccione un jugador</option>
                    {jugadores.map((jugador) => (
                      <option key={jugador.id || Math.random()} value={jugador.id || ""}>
                        {jugador.nombre || "Sin nombre"} {jugador.apellido || ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">{jugadores.length} jugadores disponibles</p>
                </>
              )}
            </div>

            {/* Información del jugador seleccionado */}
            {jugadorSeleccionado && (
              <div className="mt-4 p-4 bg-green-900/10 rounded-xl border border-green-900/20">
                <h4 className="font-medium text-green-900 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Jugador Seleccionado
                </h4>
                <p className="text-gray-700">
                  <span className="font-medium">Nombre:</span> {jugadorSeleccionado.nombre}{" "}
                  {jugadorSeleccionado.apellido}
                </p>
                {jugadorSeleccionado.carrera && (
                  <p className="text-gray-700">
                    <span className="font-medium">Carrera:</span> {jugadorSeleccionado.carrera}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Nueva sección: Selector de tiempo */}
          <div className="mb-8 p-5 bg-purple-900/10 rounded-xl border border-purple-900/20">
            <h3 className="text-xl font-semibold text-purple-900 mb-3 pb-2 border-b border-purple-900/20">
              Configuración de Tiempo
            </h3>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-center">
                <button
                  onClick={decrementarTiempo}
                  disabled={tiempoLimite <= 10 || pruebaActiva}
                  className={`p-2 rounded-l-lg border border-gray-300 ${
                    tiempoLimite <= 10 || pruebaActiva
                      ? "bg-gray-100 text-gray-400"
                      : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                  }`}
                >
                  <ChevronDown className="h-6 w-6" />
                </button>
                <div className="px-6 py-3 border-t border-b border-gray-300 text-center min-w-[150px]">
                  <span className="text-2xl font-bold text-purple-900">{tiempoLimite}</span>
                  <span className="text-gray-600 ml-2">segundos</span>
                </div>
                <button
                  onClick={incrementarTiempo}
                  disabled={tiempoLimite >= 60 || pruebaActiva}
                  className={`p-2 rounded-r-lg border border-gray-300 ${
                    tiempoLimite >= 60 || pruebaActiva
                      ? "bg-gray-100 text-gray-400"
                      : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                  }`}
                >
                  <ChevronUp className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-3 text-center text-sm text-gray-600">
                Valor a enviar: <span className="font-bold text-purple-900">{calcularValorTiempo()}</span>
              </div>
            </div>
          </div>

          {/* Sección de cronómetro */}
          <div className="mb-8 p-5 bg-gray-100 rounded-xl border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center">
              <Clock className="mr-2 h-6 w-6" />
              Cronómetro
            </h3>

            <div className="flex flex-col items-center justify-center">
              <div className="text-6xl font-bold text-blue-900 my-6 font-mono">{formatearTiempo(tiempo)}</div>
              <p className="text-gray-600 mb-4">
                {pruebaActiva
                  ? `Prueba en curso - Finalizará en ${(tiempoLimite - tiempo).toFixed(2)} segundos`
                  : pruebaCompletada
                    ? "Prueba finalizada"
                    : `La prueba durará ${tiempoLimite} segundos`}
              </p>

              {/* Barra de progreso */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-800/70 to-blue-900/70 h-4 rounded-full transition-all duration-100 ease-linear"
                  style={{ width: `${Math.min(100, (tiempo / tiempoLimite) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Sección de reacciones registradas */}
          <div className="mb-8 p-5 bg-blue-900/5 rounded-xl border border-blue-900/10">
            <h3 className="text-xl font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-300 flex items-center">
              <Zap className="mr-2 h-6 w-6" />
              Reacciones Registradas
            </h3>

            {reacciones.length > 0 ? (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-3 gap-2 font-medium text-gray-700 mb-2 pb-2 border-b border-gray-200">
                  <div>Nº</div>
                  <div>Tiempo (s)</div>
                  <div>Mensaje</div>
                </div>
                {reacciones.map((reaccion, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100">
                    <div className="text-gray-700">{index + 1}</div>
                    <div className="text-blue-900 font-medium">{reaccion.tiempo.toFixed(2)}</div>
                    <div className="text-gray-700">{reaccion.mensaje}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
                No se han registrado reacciones aún.
              </div>
            )}
          </div>

          {/* Sección de resultado final */}
          {numeroPulsaciones !== null && (
            <div className="mb-8 p-5 bg-green-900/10 rounded-xl border border-green-900/20">
              <h3 className="text-xl font-semibold text-green-900 mb-3 pb-2 border-b border-green-900/20 flex items-center">
                <Zap className="mr-2 h-6 w-6" />
                Resultado Final
              </h3>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                <div className="text-4xl font-bold text-green-900 mb-2">{numeroPulsaciones}</div>
                <div className="text-gray-600">Pulsaciones totales</div>
              </div>
              
              {/* Datos a guardar */}
              <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-700 text-sm font-medium pb-1 border-b border-gray-200">Datos a guardar:</p>
                <div className="mt-2 text-sm grid grid-cols-1 md:grid-cols-3 gap-2">
                  <p>
                    <span className="font-medium">Jugador:</span> {jugadorSeleccionado?.nombre}{" "}
                    {jugadorSeleccionado?.apellido}
                  </p>
                  <p>
                    <span className="font-medium">Pulsaciones:</span> {numeroPulsaciones}
                  </p>
                  <p>
                    <span className="font-medium">Tiempo total:</span> {tiempoLimite} segundos
                  </p>
                </div>
              </div>
              
              {/* Mensaje de resultados guardados */}
              {resultadosGuardadosRef.current && (
                <div className="mt-4 p-3 bg-green-900/10 border border-green-900/20 rounded-lg shadow-inner">
                  <p className="text-green-900 flex items-center justify-center font-medium">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Resultados guardados exitosamente
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mensaje de estado */}
          {mensajeEstado && (
            <div className="mb-6 p-3 bg-gray-100 border border-gray-200 rounded-lg">
              <p className="text-gray-700">{mensajeEstado}</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-wrap justify-center gap-4 mb-8 p-5 bg-green-900/5 rounded-xl border border-green-900/10">
            <h3 className="text-xl font-semibold text-green-900 w-full text-center mb-3 pb-2 border-b border-green-900/20">
              Acciones
            </h3>

            {!pruebaActiva && !pruebaCompletada && !esperandoResultadoFinal && (
              <button
                onClick={iniciarPrueba}
                className={`px-6 py-3 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm transition-all duration-300 bg-blue-800 hover:bg-blue-900 ${!jugadorSeleccionado ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!jugadorSeleccionado || pruebaActiva || loading || enviandoComando}
              >
                <div className="flex items-center">
                  {enviandoComando ? (
                    <Loader2 size={24} className="mr-2 animate-spin" />
                  ) : (
                    <Play size={24} className="mr-2" />
                  )}
                  <span>{enviandoComando ? "Enviando..." : "Iniciar Prueba"}</span>
                </div>
              </button>
            )}

            {pruebaActiva && (
              <button
                onClick={finalizarManualmente}
                className="px-6 py-3 rounded-lg bg-gray-600 flex items-center justify-center text-white font-bold text-lg shadow-sm hover:bg-gray-700 transition-all duration-300"
              >
                <div className="flex items-center">
                  <StopCircle size={24} className="mr-2" />
                  <span>Finalizar Prueba</span>
                </div>
              </button>
            )}

            {esperandoResultadoFinal && (
              <div className="px-6 py-3 rounded-lg bg-yellow-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                <div className="flex items-center">
                  <Loader2 size={24} className="mr-2 animate-spin" />
                  <span>Esperando resultado final...</span>
                </div>
              </div>
            )}

            {pruebaCompletada && !esperandoResultadoFinal && (
              <>
                {/* Botón para guardar resultados */}
                <button
                  onClick={guardarResultados}
                  className={`px-6 py-3 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm transition-all duration-300 bg-green-800 hover:bg-green-900 ${resultadosGuardadosRef.current ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={resultadosGuardadosRef.current}
                >
                  <div className="flex items-center">
                    <Save size={24} className="mr-2" />
                    <span>Guardar Resultados</span>
                  </div>
                </button>
                
                {/* Botón para nueva prueba */}
                <button
                  onClick={reiniciarPrueba}
                  className="px-6 py-3 rounded-lg bg-blue-800 flex items-center justify-center text-white font-bold text-lg shadow-sm hover:bg-blue-900 transition-all duration-300"
                >
                  <div className="flex items-center">
                    <Play size={24} className="mr-2" />
                    <span>Nueva Prueba</span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white shadow-md py-4 px-6 mt-8 border-t border-gray-200">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} Prueba de Reacción - Todos los derechos reservados
        </div>
      </footer>
    </div>
  )
}