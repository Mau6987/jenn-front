"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "../../contexts/auth-context"

// ── Config ─────────────────────────────────────────────────────────────────
const BACKEND_URL    = "https://jenn-back-reac.onrender.com"
const PUSHER_KEY     = "4f85ef5c792df94cebc9"
const PUSHER_CLUSTER = "us2"
const ESP_LIST       = [1, 2, 3, 4, 5]

// ── Icons ──────────────────────────────────────────────────────────────────
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" style={{width:40,height:40}}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
  </svg>
)
const IconWifi = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:16,height:16,...style}}>
    <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" strokeLinecap="round" />
  </svg>
)
const IconBulb = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:22,height:22,...style}}>
    <path d="M9 21h6M12 3a6 6 0 016 6c0 2.22-1.2 4.16-3 5.2V17a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2.8C7.2 13.16 6 11.22 6 9a6 6 0 016-6z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconVolume = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:22,height:22,...style}}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" strokeLinecap="round" />
  </svg>
)
const IconActivity = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:16,height:16,...style}}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconPlay = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{width:12,height:12,...style}}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)
const IconRefresh = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14,...style}}>
    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconDatabase = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:16,height:16,...style}}>
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" strokeLinecap="round"/>
  </svg>
)
const IconServer = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:16,height:16,...style}}>
    <rect x="2" y="2" width="20" height="8" rx="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6" strokeLinecap="round" strokeWidth="2"/>
    <line x1="6" y1="18" x2="6.01" y2="18" strokeLinecap="round" strokeWidth="2"/>
  </svg>
)
const IconZap = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,...style}}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IconClock = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,...style}}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14" strokeLinecap="round"/>
  </svg>
)
const IconTrash = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,...style}}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  brand:      "#1e1b4b",
  brandMid:   "#312e81",
  brandLight: "#eef2ff",
  accent:     "#6366f1",
  accentSoft: "#e0e7ff",
  success:    "#10b981",
  successBg:  "#ecfdf5",
  danger:     "#f43f5e",
  dangerBg:   "#fff1f2",
  text:       "#1f2937",
  textMid:    "#4b5563",
  textSoft:   "#9ca3af",
  border:     "#e8e7f5",
  borderSoft: "#f0effa",
  bg:         "#f4f5f9",
  white:      "#ffffff",
}
const card = {
  background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
  boxShadow: "0 1px 6px rgba(30,27,75,0.06)", padding: 20,
}
const sectionLabel = {
  fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
  color: C.textSoft, marginBottom: 12, display: "block",
}
const btnBrand = {
  background: C.brand, color: C.white, border: "none", borderRadius: 8,
  padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
}
const btnOutline = {
  background: C.white, color: C.textMid, border: `1.5px solid ${C.border}`,
  borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 500,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
}
const btnPill = {
  background: C.brand, color: C.white, border: "none", borderRadius: 999,
  padding: "5px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer",
  display: "flex", alignItems: "center", gap: 4,
}
const btnDangerPill = {
  background: C.danger, color: C.white, border: "none", borderRadius: 999,
  padding: "5px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer",
  display: "flex", alignItems: "center", gap: 4,
}

// ── Status Maps ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  unknown: { label: "Desconocido", dotColor: C.textSoft, textColor: C.textSoft },
  testing: { label: "Probando…",   dotColor: C.accent,   textColor: C.accent,  pulse: true },
  online:  { label: "Activo",      dotColor: C.success,  textColor: C.success },
  failed:  { label: "Inactivo",    dotColor: C.danger,   textColor: C.danger },
}
const SENSOR_MAP = {
  idle:    { label: "Listo",     dotColor: C.textSoft, textColor: C.textSoft },
  waiting: { label: "Probando…", dotColor: C.accent,   textColor: C.accent,  pulse: true },
  success: { label: "OK",        dotColor: C.success,  textColor: C.success },
  error:   { label: "Error",     dotColor: C.danger,   textColor: C.danger },
}

// ── StatusDot ─────────────────────────────────────────────────────────────
function StatusDot({ color, pulse }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: color, flexShrink: 0,
      animation: pulse ? "pulseDot 1s ease-in-out infinite" : "none",
    }} />
  )
}

// ── EspRow ────────────────────────────────────────────────────────────────
function EspRow({ label, statusKey, statusMap, onAction, actionDisabled, actionLabel = "Probar", extra }) {
  const s = statusMap[statusKey] || Object.values(statusMap)[0]
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "11px 0", borderBottom: `1px solid ${C.borderSoft}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <StatusDot color={s.dotColor} pulse={s.pulse} />
        <div>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{label}</span>
          {extra && <div style={{ fontSize: 11, color: C.textSoft, marginTop: 1 }}>{extra}</div>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: s.textColor }}>{s.label}</span>
        {onAction && (
          <button onClick={onAction} disabled={actionDisabled} style={{
            fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 999,
            border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid,
            cursor: actionDisabled ? "not-allowed" : "pointer", opacity: actionDisabled ? 0.4 : 1,
          }}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

// ── SensoresTab ───────────────────────────────────────────────────────────
function SensoresTab({ sensorTestStates, onTestSensor, onTestAll, onStopAll, espMessages }) {
  const [selectedCapsule, setSelectedCapsule] = useState(null)
  const capsulesToTest = selectedCapsule ? [selectedCapsule] : ESP_LIST

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      <div style={card}>
        <span style={sectionLabel}>Estado de Sensores</span>
        {ESP_LIST.map((id) => {
          const sState = sensorTestStates[id] || "idle"
          const lastMsg = espMessages.filter(m => m.device === `ESP-${id}`).slice(-1)[0]
          return (
            <EspRow
              key={id}
              label={`Sensor Magnético ${id} (Cápsula ${id})`}
              statusKey={sState}
              statusMap={SENSOR_MAP}
              extra={lastMsg ? `Último: ${lastMsg.message}` : null}
              onAction={() => onTestSensor(id)}
              actionDisabled={sState === "waiting"}
              actionLabel={sState === "waiting" ? "Esperando…" : "Probar"}
            />
          )
        })}
      </div>

      <div style={{ ...card, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <span style={sectionLabel}>Control de Prueba Individual</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onTestAll(capsulesToTest)} style={btnPill}>
              <IconPlay /> Iniciar
            </button>
            <button onClick={() => onStopAll(capsulesToTest)} style={btnDangerPill}>
              ■ Parar
            </button>
          </div>
        </div>

        <div>
          <span style={sectionLabel}>Cápsulas</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ESP_LIST.map((id) => {
              const active = selectedCapsule === id
              const sState = sensorTestStates[id]
              const borderColor =
                sState === "success" ? C.success :
                sState === "error"   ? C.danger  :
                sState === "waiting" ? C.accent  :
                active ? C.brand : C.border
              return (
                <button key={id} onClick={() => setSelectedCapsule(active ? null : id)} style={{
                  width: 32, height: 32, borderRadius: "50%", border: `2px solid ${borderColor}`,
                  background: active ? C.brand : sState === "success" ? C.successBg : sState === "error" ? C.dangerBg : C.white,
                  color: active ? C.white : C.textMid, fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  {id}
                </button>
              )
            })}
            <button onClick={() => setSelectedCapsule(null)} style={{
              height: 32, padding: "0 14px", borderRadius: 999,
              border: `2px solid ${selectedCapsule === null ? C.brand : C.border}`,
              background: selectedCapsule === null ? C.brand : C.white,
              color: selectedCapsule === null ? C.white : C.textMid,
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              Todas
            </button>
          </div>
        </div>

        <div>
          <span style={sectionLabel}>Panel de Confirmación</span>
          <div style={{
            minHeight: 90, background: C.brandLight, borderRadius: 10,
            border: `1px solid ${C.accentSoft}`, padding: 12,
            fontFamily: "monospace", fontSize: 12, color: C.textSoft,
          }}>
            {Object.keys(sensorTestStates).length === 0
              ? "Datos de confirmación de control..."
              : Object.entries(sensorTestStates).map(([id, st]) => (
                  <div key={id} style={{ color: SENSOR_MAP[st]?.textColor || C.textSoft, marginBottom: 2 }}>
                    ESP-{id}: {SENSOR_MAP[st]?.label || st}
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ActuadoresTab ─────────────────────────────────────────────────────────
function ActuadoresTab({ microControllers, onToggleLed, onToggleAllLeds, onTestBuzzer, onTestAllBuzzers, pendingLed }) {
  const [subTab, setSubTab] = useState("leds")

  return (
    <div>
      <div style={{ display: "flex", borderBottom: `2px solid ${C.borderSoft}`, marginBottom: 24 }}>
        {[
          { key: "leds",    label: "Anillos LED", Icon: IconBulb },
          { key: "buzzers", label: "Buzzers",     Icon: IconVolume },
        ].map(({ key, label, Icon }) => {
          const active = subTab === key
          return (
            <button key={key} onClick={() => setSubTab(key)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
              background: "transparent", border: "none",
              borderBottom: `2px solid ${active ? C.brand : "transparent"}`,
              marginBottom: -2, color: active ? C.brand : C.textSoft,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              <Icon style={{ color: active ? C.brand : C.textSoft }} />
              {label}
            </button>
          )
        })}
      </div>

      {subTab === "leds" && (
        <div style={card}>
          <span style={sectionLabel}>Control Individual</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginBottom: 20 }}>
            {microControllers.map((mc) => {
              const isPending = !!pendingLed?.[mc.id]
              return (
                <button key={mc.id} onClick={() => onToggleLed(mc.id)} disabled={isPending} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  padding: "18px 12px", borderRadius: 12,
                  border: `2px solid ${mc.ledOn ? C.brand : C.border}`,
                  background: mc.ledOn ? C.brand : C.white,
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.65 : 1,
                  boxShadow: mc.ledOn ? "0 4px 18px rgba(99,102,241,0.22)" : "none",
                  transition: "all 0.2s",
                }}>
                  <IconBulb style={{ color: mc.ledOn ? "#fbbf24" : C.textSoft }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: mc.ledOn ? C.white : C.text }}>{mc.label}</span>
                  <span style={{ fontSize: 11, color: mc.ledOn ? "rgba(255,255,255,0.6)" : C.textSoft }}>
                    {isPending ? "Enviando..." : mc.ledOn ? "Encendido" : "Apagado"}
                  </span>
                </button>
              )
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button onClick={() => onToggleAllLeds(false)} style={btnOutline}>Apagar Todos</button>
            <button onClick={() => onToggleAllLeds(true)}  style={btnBrand}>Encender Todos</button>
          </div>
        </div>
      )}

      {subTab === "buzzers" && (
        <div style={card}>
          <span style={sectionLabel}>Control de Buzzers</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginBottom: 20 }}>
            {microControllers.map((mc) => (
              <button key={mc.id} onClick={() => onTestBuzzer(mc.id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "18px 12px", borderRadius: 12,
                border: `2px solid ${C.border}`, background: C.white, cursor: "pointer",
              }}>
                <IconVolume style={{ color: C.accent }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{mc.label}</span>
                <span style={{ fontSize: 11, color: C.textSoft }}>Probar</span>
              </button>
            ))}
          </div>
          <button onClick={onTestAllBuzzers} style={{ ...btnBrand, width: "100%" }}>
            <IconVolume style={{ color: C.white }} />
            Probar Todos (50ms)
          </button>
        </div>
      )}
    </div>
  )
}

// ── ConexionTab ───────────────────────────────────────────────────────────
function ConexionTab({ microControllers, pusherConnected, pusherStatus, onTestConnection, onTestAll, serverStatus, onTestServer }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      <div style={card}>
        <span style={sectionLabel}>Estado de Conexión ESP32</span>
        {ESP_LIST.map((id) => {
          const mc   = microControllers.find((m) => m.id === id)
          const sKey = mc?.connectionStatus || "unknown"
          return (
            <EspRow
              key={id}
              label={`ESP-${id} (Cápsula ${id})`}
              statusKey={sKey}
              statusMap={STATUS_MAP}
              extra={mc?.lastSeen ? `Visto: ${new Date(mc.lastSeen).toLocaleTimeString()}` : null}
              onAction={() => onTestConnection(id)}
              actionDisabled={sKey === "testing"}
            />
          )
        })}
        <button onClick={onTestAll} style={{ ...btnOutline, width: "100%", marginTop: 16 }}>
          <IconWifi />
          Probar Conexión de Todos
        </button>
      </div>

      <div style={{ ...card, display: "flex", flexDirection: "column", gap: 0 }}>
        <span style={sectionLabel}>Estado del Servidor</span>

        {/* API Backend */}
        <div style={{ padding: "12px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconServer style={{ color: C.accent }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>API Backend</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
                color: serverStatus.api === "online" ? C.success :
                       serverStatus.api === "testing" ? C.accent  :
                       serverStatus.api === "failed"  ? C.danger  : C.textSoft,
              }}>
                <StatusDot
                  color={serverStatus.api === "online" ? C.success : serverStatus.api === "testing" ? C.accent : serverStatus.api === "failed" ? C.danger : C.textSoft}
                  pulse={serverStatus.api === "testing"}
                />
                {serverStatus.api === "online" ? "Activo" : serverStatus.api === "testing" ? "Probando..." : serverStatus.api === "failed" ? "Inactivo" : "Sin verificar"}
              </span>
              <button
                onClick={onTestServer}
                disabled={serverStatus.api === "testing"}
                style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 999,
                  border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid,
                  cursor: serverStatus.api === "testing" ? "not-allowed" : "pointer",
                  opacity: serverStatus.api === "testing" ? 0.5 : 1,
                  display: "flex", alignItems: "center",
                }}>
                <IconRefresh style={{ color: C.textMid }} />
              </button>
            </div>
          </div>
          {serverStatus.apiLatency && (
            <div style={{ fontSize: 11, color: C.textSoft, display: "flex", alignItems: "center", gap: 4 }}>
              <IconClock style={{ color: C.textSoft }} />
              Latencia:&nbsp;<span style={{ color: C.success, fontWeight: 700 }}>{serverStatus.apiLatency}ms</span>
              {serverStatus.apiMsg && <span style={{ marginLeft: 6 }}>· {serverStatus.apiMsg}</span>}
            </div>
          )}
        </div>

        {/* Base de Datos */}
        <div style={{ padding: "12px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconDatabase style={{ color: C.accent }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Base de Datos</span>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: serverStatus.db === "online" ? C.success : C.textSoft }}>
              <StatusDot color={serverStatus.db === "online" ? C.success : C.textSoft} />
              {serverStatus.db === "online" ? "Activo" : "Sin verificar"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4 }}>PostgreSQL · SSL habilitado</div>
        </div>

        {/* Pusher */}
        <div style={{ padding: "12px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconZap style={{ color: C.accent }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Pusher WebSocket</span>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: pusherConnected ? C.success : C.danger }}>
              <StatusDot color={pusherConnected ? C.success : C.danger} pulse={!pusherConnected} />
              {pusherStatus}
            </span>
          </div>
          <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4 }}>
            Cluster: {PUSHER_CLUSTER} · Canales: private-device-ESP-*
          </div>
        </div>

        {/* Log último test */}
        <div style={{ marginTop: 16 }}>
          <span style={sectionLabel}>Último Test de Servidor</span>
          <div style={{
            minHeight: 64, background: C.brandLight, borderRadius: 10,
            border: `1px solid ${C.accentSoft}`, padding: 12,
            fontFamily: "monospace", fontSize: 12,
          }}>
            {serverStatus.lastTest
              ? <span style={{ color: C.success }}>{serverStatus.lastTest}</span>
              : <span style={{ color: C.textSoft }}>Presiona el refresh para probar la API...</span>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function ESPMonitoringDashboard() {
  const { nombre, rol, posicion, idUser, logout } = useAuth()
  const [mainTab, setMainTab] = useState("sensores")
  const [microControllers, setMicroControllers] = useState(
    ESP_LIST.map((id) => ({ id, label: `ESP-${id}`, connected: false, lastSeen: null, ledOn: false, connectionStatus: "unknown" }))
  )
  const [pusherConnected, setPusherConnected] = useState(false)
  const [pusherStatus,    setPusherStatus]    = useState("Desconectado")
  const [espMessages,     setEspMessages]     = useState([])
  const [sensorTestStates, setSensorTestStates] = useState({})
  const [pendingLed,      setPendingLed]      = useState({})
  const [serverStatus,    setServerStatus]    = useState({
    api: "unknown", db: "unknown", apiLatency: null, apiMsg: null, lastTest: null,
  })

  const connTimeouts   = useRef({})
  const sensorTimeouts = useRef({})
  const monitorRef     = useRef(null)

  // ── addMessage ──────────────────────────────────────────────────────────
  const addMessage = useCallback((device, type, message, status = "info") => {
    setEspMessages(prev => [...prev.slice(-49), { device, type, message, status, timestamp: Date.now() }])
  }, [])

  // ── sendCommandToESP ────────────────────────────────────────────────────
  const sendCommandToESP = useCallback(async (espId, command) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: `ESP-${espId}`, command }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error enviando comando")
      addMessage(`ESP-${espId}`, "command", `→ ${command}`, "info")
      return data
    } catch (err) {
      addMessage(`ESP-${espId}`, "error", `Error: ${err.message}`, "error")
      throw err
    }
  }, [addMessage])

  // ── Pusher init ─────────────────────────────────────────────────────────
  useEffect(() => {
    const script = document.createElement("script")
    script.src   = "https://js.pusher.com/8.2.0/pusher.min.js"
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      Pusher.logToConsole = false
      const pusher = new Pusher(PUSHER_KEY, {
        cluster:      PUSHER_CLUSTER,
        encrypted:    true,
        authEndpoint: `${BACKEND_URL}/api/pusher/pusher/auth`,
        forceTLS:     true,
      })

      pusher.connection.bind("connected",    () => { setPusherConnected(true);  setPusherStatus("Conectado")    })
      pusher.connection.bind("disconnected", () => { setPusherConnected(false); setPusherStatus("Desconectado") })
      pusher.connection.bind("error",        () => { setPusherConnected(false); setPusherStatus("Error")        })

      ESP_LIST.forEach((id) => {
        const channel = pusher.subscribe(`private-device-ESP-${id}`)

        // El ESP emite este evento al conectarse
        channel.bind("client-status", (data) => {
          setMicroControllers(prev => prev.map(mc =>
            mc.id === id ? { ...mc, connectionStatus: "online", lastSeen: Date.now() } : mc
          ))
          setServerStatus(prev => ({ ...prev, db: "online" }))
          addMessage(`ESP-${id}`, "status", `Conectado · IP: ${data?.ip || "—"}`, "success")
        })

        // Respuestas del ESP a comandos
        channel.bind("client-response", (data) => {
          const msg      = typeof data === "string" ? data : (data?.message || JSON.stringify(data))
          const msgLower = msg.toLowerCase()

          // Conexión OK
          if (msgLower === "ok" || msgLower.includes("con_vida") || msgLower.includes("vivo")) {
            setMicroControllers(prev => prev.map(mc =>
              mc.id === id ? { ...mc, connectionStatus: "online", lastSeen: Date.now() } : mc
            ))
            if (connTimeouts.current[id]) { clearTimeout(connTimeouts.current[id]); delete connTimeouts.current[id] }
          }

          // Sensor
          if (msg === "sensor_ok" || msg === "Acierto") {
            setSensorTestStates(prev => ({ ...prev, [id]: "success" }))
            if (sensorTimeouts.current[id]) { clearTimeout(sensorTimeouts.current[id]); delete sensorTimeouts.current[id] }
            setTimeout(() => setSensorTestStates(prev => ({ ...prev, [id]: "idle" })), 3000)
          } else if (msg === "sensor_error" || (msg === "Error" && sensorTestStates[id] === "waiting")) {
            setSensorTestStates(prev => (prev[id] === "waiting" ? { ...prev, [id]: "error" } : prev))
            if (sensorTimeouts.current[id]) { clearTimeout(sensorTimeouts.current[id]); delete sensorTimeouts.current[id] }
          }

          // LED
          if (msgLower.includes("led_on_ok")) {
            setMicroControllers(prev => prev.map(mc => mc.id === id ? { ...mc, ledOn: true } : mc))
            setPendingLed(prev => { const n = {...prev}; delete n[id]; return n })
          } else if (msgLower.includes("led_off_ok")) {
            setMicroControllers(prev => prev.map(mc => mc.id === id ? { ...mc, ledOn: false } : mc))
            setPendingLed(prev => { const n = {...prev}; delete n[id]; return n })
          }

          addMessage(`ESP-${id}`, "response", msg, msgLower.includes("error") ? "error" : "success")
        })

        channel.bind("pusher:subscription_error", () => {
          addMessage(`ESP-${id}`, "error", "Error suscripción al canal privado", "error")
        })
      })
    }

    return () => {
      if (window.Pusher) {/* pusher disconnect handled by GC */}
    }
  }, [addMessage])

  // Auto-scroll monitor
  useEffect(() => {
    if (monitorRef.current) monitorRef.current.scrollTop = monitorRef.current.scrollHeight
  }, [espMessages])

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleTestSensor = useCallback(async (id) => {
    setSensorTestStates(prev => ({ ...prev, [id]: "waiting" }))
    const tid = setTimeout(() => {
      setSensorTestStates(prev => ({ ...prev, [id]: "error" }))
      addMessage(`ESP-${id}`, "error", "Timeout – sin respuesta del sensor (10s)", "error")
      delete sensorTimeouts.current[id]
    }, 10000)
    sensorTimeouts.current[id] = tid
    await sendCommandToESP(id, "TEST_SENSOR")
  }, [sendCommandToESP, addMessage])

  const handleTestAllSensors = useCallback((ids = ESP_LIST) => {
    ids.forEach(id => handleTestSensor(id))
  }, [handleTestSensor])

  const handleStopAllSensors = useCallback((ids = ESP_LIST) => {
    ids.forEach(id => {
      if (sensorTimeouts.current[id]) { clearTimeout(sensorTimeouts.current[id]); delete sensorTimeouts.current[id] }
      setSensorTestStates(prev => ({ ...prev, [id]: "idle" }))
      sendCommandToESP(id, "OFF").catch(() => {})
    })
  }, [sendCommandToESP])

  const handleToggleLed = useCallback(async (id) => {
    const mc       = microControllers.find(m => m.id === id)
    const newState = !mc?.ledOn
    setPendingLed(prev => ({ ...prev, [id]: true }))
    try {
      await sendCommandToESP(id, newState ? "LED_ON" : "LED_OFF")
    } catch {
      setPendingLed(prev => { const n = {...prev}; delete n[id]; return n })
    }
    // Safety fallback: liberar pending si no llega respuesta en 5s
    setTimeout(() => setPendingLed(prev => { const n = {...prev}; delete n[id]; return n }), 5000)
  }, [microControllers, sendCommandToESP])

  const handleToggleAllLeds = useCallback(async (on) => {
    for (const id of ESP_LIST) {
      setPendingLed(prev => ({ ...prev, [id]: true }))
      await sendCommandToESP(id, on ? "LED_ON" : "LED_OFF").catch(() => {})
      await new Promise(r => setTimeout(r, 150))
    }
  }, [sendCommandToESP])

  const handleTestBuzzer = useCallback(async (id) => {
    await sendCommandToESP(id, "BUZZER")
    addMessage(`ESP-${id}`, "command", "Buzzer activado (50ms)", "info")
  }, [sendCommandToESP, addMessage])

  const handleTestAllBuzzers = useCallback(async () => {
    for (const id of ESP_LIST) {
      await sendCommandToESP(id, "BUZZER").catch(() => {})
      await new Promise(r => setTimeout(r, 150))
    }
  }, [sendCommandToESP])

  const handleTestConnection = useCallback(async (id) => {
    setMicroControllers(prev => prev.map(mc => mc.id === id ? { ...mc, connectionStatus: "testing" } : mc))
    const tid = setTimeout(() => {
      setMicroControllers(prev => prev.map(mc => mc.id === id ? { ...mc, connectionStatus: "failed" } : mc))
      addMessage(`ESP-${id}`, "error", "Timeout – sin respuesta al STATE (5s)", "error")
      delete connTimeouts.current[id]
    }, 5000)
    connTimeouts.current[id] = tid
    await sendCommandToESP(id, "STATE")
  }, [sendCommandToESP, addMessage])

  const handleTestAllConnections = useCallback(() => {
    ESP_LIST.forEach(id => handleTestConnection(id))
  }, [handleTestConnection])

  const handleTestServer = useCallback(async () => {
    setServerStatus(prev => ({ ...prev, api: "testing", apiLatency: null, apiMsg: null }))
    const start = Date.now()
    try {
      const res     = await fetch(`${BACKEND_URL}/api/pusher/test`)
      const latency = Date.now() - start
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setServerStatus(prev => ({
        ...prev, api: "online", db: "online",
        apiLatency: latency,
        apiMsg:     data.message || "OK",
        lastTest:   `✓ ${new Date().toLocaleTimeString()} · ${latency}ms · ${data.message || ""}`,
      }))
      addMessage("SISTEMA", "status", `API activa · ${latency}ms`, "success")
    } catch (err) {
      setServerStatus(prev => ({
        ...prev, api: "failed",
        apiLatency: null, apiMsg: err.message,
        lastTest: `✗ ${new Date().toLocaleTimeString()} · ${err.message}`,
      }))
      addMessage("SISTEMA", "error", `API inaccesible: ${err.message}`, "error")
    }
  }, [addMessage])

  const TABS = [
    { key: "sensores",   label: "Sensores" },
    { key: "actuadores", label: "Actuadores" },
    { key: "conexion",   label: "Conexión" },
  ]

  const msgColor = (status) =>
    status === "error" ? C.danger : status === "success" ? C.success : C.accent

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.65); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e0e7ff; border-radius: 99px; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* Profile */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {/* Profile */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>

              {/* Avatar */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: C.accentSoft,
                  border: `2px solid ${C.accent}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <IconUser />
              </div>

            </div>

          {/* Nombre */}
         

          {/* Chips de rol / posición / id */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {rol && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                background: C.accentSoft, color: C.accent, borderRadius: 999, padding: "3px 10px",
              }}>
                {rol}
              </span>
            )}
            {posicion && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                background: C.brandLight, color: C.brandMid, borderRadius: 999, padding: "3px 10px",
              }}>
                {posicion}
              </span>
            )}
           
          </div>

        </div>

        {/* Main Tabs */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            display: "inline-flex", background: C.white, border: `1.5px solid ${C.border}`,
            borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(30,27,75,0.07)",
          }}>
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setMainTab(key)} style={{
                padding: "10px 28px", fontSize: 13, fontWeight: 600, border: "none",
                background: mainTab === key ? C.brand : "transparent",
                color: mainTab === key ? C.white : C.textMid, cursor: "pointer",
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          {mainTab === "sensores" && (
            <SensoresTab
              sensorTestStates={sensorTestStates}
              onTestSensor={handleTestSensor}
              onTestAll={handleTestAllSensors}
              onStopAll={handleStopAllSensors}
              espMessages={espMessages}
            />
          )}
          {mainTab === "actuadores" && (
            <ActuadoresTab
              microControllers={microControllers}
              onToggleLed={handleToggleLed}
              onToggleAllLeds={handleToggleAllLeds}
              onTestBuzzer={handleTestBuzzer}
              onTestAllBuzzers={handleTestAllBuzzers}
              pendingLed={pendingLed}
            />
          )}
          {mainTab === "conexion" && (
            <ConexionTab
              microControllers={microControllers}
              pusherConnected={pusherConnected}
              pusherStatus={pusherStatus}
              onTestConnection={handleTestConnection}
              onTestAll={handleTestAllConnections}
              serverStatus={serverStatus}
              onTestServer={handleTestServer}
            />
          )}
        </div>

        {/* Monitor de Comunicación */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <IconActivity style={{ color: C.accent }} />
            <span style={{ ...sectionLabel, marginBottom: 0 }}>Monitor de Comunicación</span>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: pusherConnected ? C.success : C.textSoft }}>
              <StatusDot color={pusherConnected ? C.success : C.textSoft} pulse={!pusherConnected} />
              {pusherStatus}
            </span>
            {espMessages.length > 0 && (
              <button onClick={() => setEspMessages([])} title="Limpiar" style={{
                background: "none", border: "none", cursor: "pointer", padding: 4,
                display: "flex", alignItems: "center", color: C.textSoft,
              }}>
                <IconTrash style={{ color: C.textSoft }} />
              </button>
            )}
          </div>
          <div ref={monitorRef} style={{
            minHeight: 110, maxHeight: 220, overflowY: "auto",
            background: C.brandLight, borderRadius: 10, border: `1px solid ${C.accentSoft}`,
            padding: 12, fontFamily: "monospace", fontSize: 12, color: C.textSoft,
          }}>
            {espMessages.length === 0
              ? "Esperando mensajes del ESP32…"
              : espMessages.map((r, i) => (
                  <div key={i} style={{ marginBottom: 2 }}>
                    <span style={{ color: C.textSoft }}>[{new Date(r.timestamp).toLocaleTimeString()}]</span>{" "}
                    <span style={{ color: C.brand, fontWeight: 700 }}>{r.device}</span>
                    <span style={{ color: C.textSoft }}>:</span>{" "}
                    <span style={{ color: msgColor(r.status) }}>{r.message}</span>
                  </div>
                ))
            }
          </div>
        </div>

      </div>
    </div>
  )
}