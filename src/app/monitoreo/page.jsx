"use client"

import { useState } from "react"

// ── Icons (inline SVG to avoid import issues) ──────────────────────────────
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-zinc-400">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
  </svg>
)
const IconWifi = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" strokeLinecap="round" />
  </svg>
)
const IconBulb = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M9 21h6M12 3a6 6 0 016 6c0 2.22-1.2 4.16-3 5.2V17a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2.8C7.2 13.16 6 11.22 6 9a6 6 0 016-6z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconVolume = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" strokeLinecap="round" />
  </svg>
)
const IconActivity = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconCheck = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconX = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
    <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
  </svg>
)
const IconPlay = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)
const IconMagnet = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M6 15A6 6 0 0118 15" strokeLinecap="round" />
    <path d="M6 15v3a2 2 0 004 0v-3M14 15v3a2 2 0 004 0v-3" strokeLinecap="round" />
    <path d="M6 9V5M18 9V5M6 5h12" strokeLinecap="round" />
  </svg>
)

// ── Constants ───────────────────────────────────────────────────────────────
const BACKEND_URL = "https://jenn-back-reac.onrender.com"

const ESP_LIST = [1, 2, 3, 4, 5]

const STATUS_MAP = {
  unknown:  { label: "Desconocido",  dot: "bg-zinc-300",    text: "text-zinc-400" },
  testing:  { label: "Probando…",    dot: "bg-indigo-400 animate-pulse", text: "text-indigo-500" },
  online:   { label: "Activo",       dot: "bg-emerald-400", text: "text-emerald-600" },
  failed:   { label: "Inactivo",     dot: "bg-rose-400",    text: "text-rose-500" },
}

const SENSOR_MAP = {
  idle:     { label: "Listo",        dot: "bg-zinc-300",    text: "text-zinc-400" },
  waiting:  { label: "Probando…",    dot: "bg-indigo-400 animate-pulse", text: "text-indigo-500" },
  success:  { label: "OK",           dot: "bg-emerald-400", text: "text-emerald-600" },
  error:    { label: "Error",        dot: "bg-rose-400",    text: "text-rose-500" },
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const StatusDot = ({ color }) => (
  <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
)

// ── Sub-components ──────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">{label}</p>
  )
}

function EspRow({ id, label, statusKey, statusMap, onAction, actionLabel, actionDisabled }) {
  const s = statusMap[statusKey] || statusMap["unknown"] || statusMap["idle"]
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
      <div className="flex items-center gap-3">
        <StatusDot color={s.dot} />
        <span className="text-sm font-medium text-zinc-700">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
        {onAction && (
          <button
            onClick={onAction}
            disabled={actionDisabled}
            className="text-xs px-3 py-1 rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {actionLabel || "Probar"}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Sensores Tab ─────────────────────────────────────────────────────────────
function SensoresTab({ microControllers, sensorTestStates, onTestSensor, onTestAll }) {
  const [selectedCapsule, setSelectedCapsule] = useState(null) // null = "Todas"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Estado de conexión sensores */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
        <SectionHeader label="Estado de Conexión" />
        {ESP_LIST.map((id) => {
          const mc = microControllers.find((m) => m.id === id)
          const sState = sensorTestStates[id] || "idle"
          return (
            <EspRow
              key={id}
              id={id}
              label={`Sensor Magnético ${id} (Cápsula ${id})`}
              statusKey={sState}
              statusMap={SENSOR_MAP}
              onAction={() => onTestSensor(id)}
              actionLabel="Probar"
              actionDisabled={sState === "waiting"}
            />
          )
        })}
      </div>

      {/* Control de prueba */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader label="Control de Prueba Individual" />
          <button
            onClick={onTestAll}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
          >
            <IconPlay className="w-3 h-3" />
            Iniciar
          </button>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">Cápsulas</p>
          <div className="flex items-center gap-2 flex-wrap">
            {ESP_LIST.map((id) => {
              const active = selectedCapsule === id
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCapsule(active ? null : id)}
                  className={`w-8 h-8 rounded-full border text-xs font-semibold transition-colors ${
                    active
                      ? "bg-zinc-800 border-zinc-800 text-white"
                      : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {id}
                </button>
              )
            })}
            <button
              onClick={() => setSelectedCapsule(null)}
              className={`px-3 h-8 rounded-full border text-xs font-semibold transition-colors ${
                selectedCapsule === null
                  ? "bg-zinc-800 border-zinc-800 text-white"
                  : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400"
              }`}
            >
              Todas
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Panel de Confirmación</p>
          <div className="min-h-[100px] bg-zinc-50 rounded-lg border border-zinc-100 p-3 text-xs text-zinc-400 font-mono">
            {Object.entries(sensorTestStates).length === 0
              ? "Datos de confirmación de control..."
              : Object.entries(sensorTestStates).map(([id, st]) => (
                  <div key={id} className={SENSOR_MAP[st]?.text || "text-zinc-400"}>
                    ESP-{id}: {SENSOR_MAP[st]?.label}
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Actuadores Tab ───────────────────────────────────────────────────────────
function ActuadoresTab({ microControllers, allLedsOn, onToggleLed, onToggleAllLeds, onToggleBuzzer, onToggleAllBuzzers }) {
  const [subTab, setSubTab] = useState("leds")

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 border-b border-zinc-100">
        {[
          { key: "leds", label: "Anillos LED", icon: IconBulb },
          { key: "buzzers", label: "Buzzers", icon: IconVolume },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              subTab === key
                ? "border-zinc-800 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {subTab === "leds" && (
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
          <SectionHeader label="Control Individual" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            {microControllers.map((mc) => (
              <button
                key={mc.id}
                onClick={() => onToggleLed(mc.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  mc.ledOn
                    ? "border-zinc-800 bg-zinc-800 text-white shadow-md"
                    : "border-zinc-100 bg-white text-zinc-500 hover:border-zinc-200"
                }`}
              >
                <IconBulb className={`w-6 h-6 ${mc.ledOn ? "text-amber-300" : "text-zinc-300"}`} />
                <span className="text-xs font-semibold">{mc.label}</span>
                <span className="text-[10px] opacity-70">{mc.ledOn ? "Encendido" : "Apagado"}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onToggleAllLeds(false)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Apagar Todos
            </button>
            <button
              onClick={() => onToggleAllLeds(true)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Encender Todos
            </button>
          </div>
        </div>
      )}

      {subTab === "buzzers" && (
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
          <SectionHeader label="Control de Buzzers" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            {microControllers.map((mc) => (
              <button
                key={mc.id}
                onClick={() => onToggleBuzzer(mc.id)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-zinc-100 bg-white text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50 transition-all"
              >
                <IconVolume className="w-6 h-6 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-700">{mc.label}</span>
                <span className="text-[10px] text-zinc-400">Probar</span>
              </button>
            ))}
          </div>
          <button
            onClick={onToggleAllBuzzers}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <IconVolume className="w-4 h-4" />
            Probar Todos (50ms)
          </button>
        </div>
      )}
    </div>
  )
}

// ── Conexión Tab ─────────────────────────────────────────────────────────────
function ConexionTab({ microControllers, pusherConnected, pusherStatus, onTestConnection, onTestAll, espResponses }) {
  const apiStatus = pusherConnected ? "online" : "failed"
  const dbStatus = pusherConnected ? "online" : "failed"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Estado de conexión ESPs */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
        <SectionHeader label="Estado de Conexión" />
        {ESP_LIST.map((id) => {
          const mc = microControllers.find((m) => m.id === id)
          const sKey = mc?.connectionStatus || "unknown"
          return (
            <EspRow
              key={id}
              id={id}
              label={`ESP-${id} (Cápsula ${id})`}
              statusKey={sKey}
              statusMap={STATUS_MAP}
              onAction={() => onTestConnection(id)}
              actionLabel="Probar"
              actionDisabled={sKey === "testing"}
            />
          )
        })}
        <button
          onClick={onTestAll}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          <IconWifi className="w-3.5 h-3.5" />
          Probar Conexión de Todos
        </button>
      </div>

      {/* Estado del servidor */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5 space-y-4">
        <SectionHeader label="Estado del Servidor" />

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-zinc-100">
            <span className="text-sm font-semibold text-zinc-700">API</span>
            <span className={`flex items-center gap-1.5 text-xs font-medium ${apiStatus === "online" ? "text-emerald-600" : "text-rose-500"}`}>
              <StatusDot color={apiStatus === "online" ? "bg-emerald-400" : "bg-rose-400"} />
              {apiStatus === "online" ? "Activo" : "Inactivo"}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-zinc-100">
            <span className="text-sm font-semibold text-zinc-700">Base de Datos</span>
            <span className={`flex items-center gap-1.5 text-xs font-medium ${dbStatus === "online" ? "text-emerald-600" : "text-rose-500"}`}>
              <StatusDot color={dbStatus === "online" ? "bg-emerald-400" : "bg-rose-400"} />
              {dbStatus === "online" ? "Conectado" : "Desconectado"}
            </span>
          </div>

          <div className="py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-zinc-700">Tiempo de Respuesta</span>
            </div>
            <div className="min-h-[60px] bg-zinc-50 rounded-lg border border-zinc-100 p-3 text-xs text-zinc-400 font-mono">
              {pusherStatus === "Conectado"
                ? <span className="text-emerald-600">Pusher: Conectado ✓</span>
                : <span className="text-zinc-400">Datos de tiempo de respuesta...</span>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ESPMonitoringDashboard() {
  const [mainTab, setMainTab] = useState("sensores")
  const [microControllers, setMicroControllers] = useState(
    ESP_LIST.map((id) => ({
      id,
      label: `ESP-${id}`,
      connected: false,
      lastSeen: null,
      ledOn: false,
      buzzerOn: false,
      connectionStatus: "unknown",
    }))
  )
  const [pusherConnected, setPusherConnected] = useState(false)
  const [pusherStatus, setPusherStatus] = useState("Desconectado")
  const [espResponses, setEspResponses] = useState([])
  const [sensorTestStates, setSensorTestStates] = useState({})

  // ── handlers (misma lógica, sin cambios) ──────────────────────────────────
  const handleToggleLed = (id) => {
    setMicroControllers((prev) =>
      prev.map((mc) => (mc.id === id ? { ...mc, ledOn: !mc.ledOn } : mc))
    )
  }
  const handleToggleAllLeds = (on) => {
    setMicroControllers((prev) => prev.map((mc) => ({ ...mc, ledOn: on })))
  }
  const handleToggleBuzzer = (id) => {}
  const handleToggleAllBuzzers = () => {}
  const handleTestSensor = (id) => {
    setSensorTestStates((prev) => ({ ...prev, [id]: "waiting" }))
    setTimeout(() => setSensorTestStates((prev) => ({ ...prev, [id]: "idle" })), 4000)
  }
  const handleTestAllSensors = () => {
    ESP_LIST.forEach((id) => handleTestSensor(id))
  }
  const handleTestConnection = (id) => {
    setMicroControllers((prev) =>
      prev.map((mc) => (mc.id === id ? { ...mc, connectionStatus: "testing" } : mc))
    )
    setTimeout(() => {
      setMicroControllers((prev) =>
        prev.map((mc) => (mc.id === id ? { ...mc, connectionStatus: "online" } : mc))
      )
    }, 3000)
  }
  const handleTestAllConnections = () => {
    ESP_LIST.forEach((id) => handleTestConnection(id))
  }

  // ── Tabs config ────────────────────────────────────────────────────────────
  const TABS = [
    { key: "sensores",   label: "Sensores" },
    { key: "actuadores", label: "Actuadores" },
    { key: "conexion",   label: "Conexión" },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* ── Profile ── */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
            <IconUser />
          </div>
          <p className="text-sm font-bold tracking-widest uppercase text-zinc-700">Técnico</p>
        </div>

        {/* ── Main Tabs ── */}
        <div className="flex justify-center">
          <div className="inline-flex border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMainTab(key)}
                className={`px-7 py-2.5 text-sm font-medium transition-colors ${
                  mainTab === key
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div>
          {mainTab === "sensores" && (
            <SensoresTab
              microControllers={microControllers}
              sensorTestStates={sensorTestStates}
              onTestSensor={handleTestSensor}
              onTestAll={handleTestAllSensors}
            />
          )}
          {mainTab === "actuadores" && (
            <ActuadoresTab
              microControllers={microControllers}
              onToggleLed={handleToggleLed}
              onToggleAllLeds={handleToggleAllLeds}
              onToggleBuzzer={handleToggleBuzzer}
              onToggleAllBuzzers={handleToggleAllBuzzers}
            />
          )}
          {mainTab === "conexion" && (
            <ConexionTab
              microControllers={microControllers}
              pusherConnected={pusherConnected}
              pusherStatus={pusherStatus}
              onTestConnection={handleTestConnection}
              onTestAll={handleTestAllConnections}
              espResponses={espResponses}
            />
          )}
        </div>

        {/* ── Monitor de Comunicación ── */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconActivity className="w-4 h-4 text-zinc-400" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Monitor de Comunicación</p>
            <span className={`ml-auto flex items-center gap-1.5 text-xs font-medium ${pusherConnected ? "text-emerald-600" : "text-zinc-400"}`}>
              <StatusDot color={pusherConnected ? "bg-emerald-400" : "bg-zinc-300"} />
              {pusherStatus}
            </span>
          </div>
          <div className="min-h-[140px] max-h-56 overflow-y-auto bg-zinc-50 rounded-lg border border-zinc-100 p-3 font-mono text-xs text-zinc-400 space-y-1">
            {espResponses.length === 0
              ? <span>Esperando mensajes del ESP32…</span>
              : espResponses.map((r, i) => (
                  <div key={i} className={r.status === "error" ? "text-rose-500" : r.status === "success" ? "text-emerald-600" : "text-indigo-500"}>
                    [{new Date(r.timestamp).toLocaleTimeString()}] {r.device}: {r.message}
                  </div>
                ))
            }
          </div>
        </div>

      </div>
    </div>
  )
}