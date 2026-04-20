"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "../../contexts/auth-context"

const BACKEND_URL    = "https://jenn-back-reac.onrender.com"
const PUSHER_KEY     = "4f85ef5c792df94cebc9"
const PUSHER_CLUSTER = "us2"
const ESP_LIST       = [1, 2, 3, 4, 5]

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
const IconActivity = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:16,height:16,...style}}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
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
const IconBattery = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,...style}}>
    <rect x="1" y="6" width="18" height="12" rx="2"/>
    <path d="M23 13v-2" strokeLinecap="round"/>
  </svg>
)

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
  warning:    "#f59e0b",
  warningBg:  "#fffbeb",
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

const STATUS_MAP = {
  unknown: { label: "Desconocido", dotColor: C.textSoft, textColor: C.textSoft },
  testing: { label: "Probando",   dotColor: C.accent,   textColor: C.accent,  pulse: true },
  online:  { label: "Activo",      dotColor: C.success,  textColor: C.success },
  failed:  { label: "Inactivo",    dotColor: C.danger,   textColor: C.danger },
}
const SENSOR_MAP = {
  idle:    { label: "Listo",     dotColor: C.textSoft, textColor: C.textSoft },
  waiting: { label: "Probando",  dotColor: C.accent,   textColor: C.accent,  pulse: true },
  success: { label: "OK",        dotColor: C.success,  textColor: C.success },
  error:   { label: "Error",     dotColor: C.danger,   textColor: C.danger },
}

// ── BatteryWidget: versión completa con barra de progreso ─────────────────
function BatteryWidget({ nivel, porcentaje, voltaje, compact = false }) {
  const cfg = {
    normal:  { bar: C.success,  bg: C.successBg, border: "#a7f3d0", text: "#065f46", label: "Normal"   },
    alerta:  { bar: C.warning,  bg: C.warningBg, border: "#fde68a", text: "#78350f", label: "Bajo"     },
    critico: { bar: C.danger,   bg: C.dangerBg,  border: "#fecaca", text: "#7f1d1d", label: "Crítico"  },
    null:    { bar: C.textSoft, bg: "#f9fafb",   border: C.border,  text: C.textSoft,label: "Sin datos" },
  }
  const c   = cfg[nivel] || cfg.null
  const pct = porcentaje ?? 0

  if (compact) {
    // Versión compacta: icono + barra + texto
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Ícono batería inline */}
        <div style={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <div style={{
            width: 20, height: 11, border: `1.5px solid ${nivel ? c.bar : C.border}`,
            borderRadius: 3, padding: "1.5px 2px",
            display: "flex", alignItems: "center", gap: 1.5, background: C.white,
          }}>
            {[0,1,2].map(i => {
              const filled =
                nivel === "normal"  ? true :
                nivel === "alerta"  ? i < 2 :
                nivel === "critico" ? i < 1 : false
              return (
                <div key={i} style={{
                  flex: 1, height: "100%", borderRadius: 1.5,
                  background: filled ? c.bar : C.border,
                  transition: "background 0.4s",
                }} />
              )
            })}
          </div>
          <div style={{ width: 2, height: 6, background: nivel ? c.bar : C.border, borderRadius: "0 1px 1px 0" }} />
        </div>
        {/* Barra de porcentaje */}
        <div style={{ flex: 1, height: 5, background: C.border, borderRadius: 99, overflow: "hidden", minWidth: 40 }}>
          <div style={{
            height: "100%", width: `${pct}%`, background: c.bar,
            borderRadius: 99, transition: "width 0.6s ease",
            animation: nivel === "critico" ? "battCrit 1s ease-in-out infinite alternate" : "none",
          }} />
        </div>
        {/* Texto */}
        <span style={{ fontSize: 11, fontWeight: 700, color: c.text, fontFamily: "monospace", minWidth: 32, textAlign: "right" }}>
          {porcentaje != null ? `${porcentaje}%` : "—"}
        </span>
        {voltaje != null && (
          <span style={{ fontSize: 10, color: C.textSoft, fontFamily: "monospace" }}>
            {voltaje.toFixed(2)}V
          </span>
        )}
      </div>
    )
  }

  // Versión completa: card con barra grande
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 10, padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <IconBattery style={{ color: c.bar }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: c.text, letterSpacing: "0.05em" }}>
            Batería
          </span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: c.text,
          background: C.white + "99", borderRadius: 99,
          padding: "2px 8px", border: `1px solid ${c.border}`,
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          {c.label}
        </span>
      </div>

      {/* Barra grande */}
      <div style={{ height: 8, background: C.white + "80", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: c.bar,
          borderRadius: 99, transition: "width 0.6s ease",
          animation: nivel === "critico" ? "battCrit 1s ease-in-out infinite alternate" : "none",
        }} />
      </div>

      {/* Valores */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: c.text }}>
          {porcentaje != null ? `${porcentaje}%` : "—"}
        </span>
        {voltaje != null && (
          <span style={{ fontFamily: "monospace", fontSize: 12, color: c.text, opacity: 0.7 }}>
            {voltaje.toFixed(2)} V
          </span>
        )}
      </div>
    </div>
  )
}

// ── BatteryIcon: versión tiny para listas ────────────────────────────────
function BatteryIcon({ nivel, porcentaje, voltaje }) {
  const barColors = {
    normal:  ["#10b981", "#10b981", "#10b981"],
    alerta:  ["#f59e0b", "#f59e0b", C.border],
    critico: ["#f43f5e", C.border,  C.border],
    null:    [C.border,  C.border,  C.border],
  }
  const colors     = barColors[nivel] || barColors.null
  const labelColor =
    nivel === "normal"  ? "#10b981" :
    nivel === "alerta"  ? "#f59e0b" :
    nivel === "critico" ? "#f43f5e" : C.textSoft

  return (
    <div
      title={voltaje != null ? `${voltaje.toFixed(2)}V · ${porcentaje ?? "?"}%` : "Sin datos de batería"}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "default" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
        <div style={{
          width: 18, height: 10,
          border: `1.5px solid ${colors[0] === C.border ? C.border : colors[0]}`,
          borderRadius: 2, padding: "1px 2px",
          display: "flex", alignItems: "center", gap: 1, background: C.white,
        }}>
          {colors.map((c, i) => (
            <div key={i} style={{ flex: 1, height: "100%", borderRadius: 1, background: c, transition: "background 0.4s" }} />
          ))}
        </div>
        <div style={{
          width: 2, height: 5,
          background: colors[0] === C.border ? C.border : colors[0],
          borderRadius: "0 1px 1px 0", transition: "background 0.4s",
        }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: labelColor, fontFamily: "monospace", lineHeight: 1 }}>
        {porcentaje != null ? `${porcentaje}%` : "—"}
      </span>
    </div>
  )
}

function StatusDot({ color, pulse }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: color, flexShrink: 0,
      animation: pulse ? "pulseDot 1s ease-in-out infinite" : "none",
    }} />
  )
}

function EspRow({ label, statusKey, statusMap, onAction, actionDisabled, actionLabel = "Probar", extra, battery }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const s = statusMap[statusKey] || Object.values(statusMap)[0]
  
  // Color de la batería para el icono
  const batteryColor =
    battery?.nivel === "normal"  ? C.success :
    battery?.nivel === "alerta"  ? C.warning :
    battery?.nivel === "critico" ? C.danger  : C.textSoft
  
  // Label de estado de batería
  const batteryLabel = 
    battery?.nivel === "normal" ? "OK" :
    battery?.nivel === "alerta" ? "LOW" :
    (battery?.nivel === "critico" || battery?.nivel === "critica") ? "CRIT" : "—"
  
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 8,
      padding: "12px 0", borderBottom: `1px solid ${C.borderSoft}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusDot color={s.dotColor} pulse={s.pulse} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{label}</span>
            {extra && <div style={{ fontSize: 11, color: C.textSoft, marginTop: 1 }}>{extra}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: s.textColor }}>{s.label}</span>
          {/* Icono de batería con tooltip - solo si hay datos de batería */}
          {battery && (
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                cursor: "default", width: 24, height: 24, justifyContent: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <div style={{
                    width: 18, height: 10, border: `1.5px solid ${batteryColor}`,
                    borderRadius: 2, padding: "1px 2px",
                    display: "flex", alignItems: "center", gap: 1, background: C.white,
                  }}>
                    {[0,1,2].map(i => {
                      const filled =
                        battery?.nivel === "normal"  ? true :
                        battery?.nivel === "alerta"  ? i < 2 :
                        battery?.nivel === "critico" || battery?.nivel === "critica" ? i < 1 : false
                      return (
                        <div key={i} style={{
                          flex: 1, height: "100%", borderRadius: 1,
                          background: filled ? batteryColor : C.border,
                          transition: "background 0.4s",
                        }} />
                      )
                    })}
                  </div>
                  <div style={{
                    width: 2, height: 5, background: batteryColor,
                    borderRadius: "0 1px 1px 0", transition: "background 0.4s",
                  }} />
                </div>
              </div>
              
              {/* Tooltip al pasar el mouse */}
              {showTooltip && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 8px)", right: 0,
                  background: C.white, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  whiteSpace: "nowrap", zIndex: 1000,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                    {battery?.porcentaje != null ? `${battery.porcentaje}%` : batteryLabel}
                  </div>
                  {battery?.voltaje != null && (
                    <div style={{ fontSize: 10, color: C.textSoft }}>
                      {battery.voltaje.toFixed(2)}V
                    </div>
                  )}
                  {!battery?.nivel && (
                    <div style={{ fontSize: 10, color: C.textSoft, fontStyle: "italic" }}>
                      Sin datos
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
    </div>
  )
}

function SensoresTab({ sensorTestStates, onTestSensor, onTestAll, onStopAll, espMessages, microControllers }) {
  const [selectedCapsule, setSelectedCapsule] = useState(null)
  const capsulesToTest = selectedCapsule ? [selectedCapsule] : ESP_LIST

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      <div style={card}>
        <span style={sectionLabel}>Estado de Sensores</span>
        {ESP_LIST.map((id) => {
          const sState  = sensorTestStates[id] || "idle"
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
            <button onClick={() => onTestAll(capsulesToTest)} style={{
              background: C.brand, color: C.white, border: "none", borderRadius: 999,
              padding: "5px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              ▶ Iniciar
            </button>
            <button onClick={() => onStopAll(capsulesToTest)} style={{
              background: C.danger, color: C.white, border: "none", borderRadius: 999,
              padding: "5px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              ■ Parar
            </button>
          </div>
        </div>

        <div>
          <span style={sectionLabel}>Cápsulas</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ESP_LIST.map((id) => {
              const active  = selectedCapsule === id
              const sState  = sensorTestStates[id]
              const battery = microControllers.find(mc => mc.id === id)?.battery
              const borderColor =
                sState === "success" ? C.success :
                sState === "error"   ? C.danger  :
                sState === "waiting" ? C.accent  :
                active ? C.brand : C.border
              return (
                <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <button onClick={() => setSelectedCapsule(active ? null : id)} style={{
                    width: 36, height: 36, borderRadius: "50%", border: `2px solid ${borderColor}`,
                    background: active ? C.brand : sState === "success" ? C.successBg : sState === "error" ? C.dangerBg : C.white,
                    color: active ? C.white : C.textMid, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}>
                    {id}
                  </button>
                  {/* Mini porcentaje bajo cada botón */}
                  {battery?.porcentaje != null && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, fontFamily: "monospace",
                      color:
                        battery.nivel === "normal"  ? C.success :
                        battery.nivel === "alerta"  ? C.warning :
                        battery.nivel === "critico" ? C.danger  : C.textSoft,
                    }}>
                      {battery.porcentaje}%
                    </span>
                  )}
                </div>
              )
            })}
            <button onClick={() => setSelectedCapsule(null)} style={{
              height: 36, padding: "0 14px", borderRadius: 999,
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

function ActuadoresTab({ microControllers, onToggleLed, onToggleAllLeds, pendingLed }) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <IconBulb style={{ color: C.accent }} />
        <span style={{ ...sectionLabel, marginBottom: 0 }}>Anillos LED</span>
      </div>
      <span style={sectionLabel}>Control Individual</span>
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 20
      }}>
        {microControllers.map((mc) => {
          const isPending = !!pendingLed?.[mc.id]
          const battery   = mc.battery
          return (
            <button
              key={mc.id}
              onClick={() => onToggleLed(mc.id)}
              disabled={isPending}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "18px 12px",
                borderRadius: 12,
                minWidth: 120,
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
              {/* Batería dentro de la card del LED */}
              {battery && (
                <div style={{ width: "100%", marginTop: 4 }}>
                  <div style={{ height: 4, background: mc.ledOn ? "rgba(255,255,255,0.3)" : C.border, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${battery.porcentaje ?? 0}%`,
                      background:
                        battery.nivel === "normal"  ? "#10b981" :
                        battery.nivel === "alerta"  ? "#f59e0b" : "#f43f5e",
                      borderRadius: 99, transition: "width 0.6s",
                    }} />
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: mc.ledOn ? "rgba(255,255,255,0.7)" : C.textSoft,
                    fontFamily: "monospace", display: "block", textAlign: "center", marginTop: 3,
                  }}>
                    {battery.porcentaje != null ? `${battery.porcentaje}%` : "—"}
                    {battery.voltaje != null ? ` · ${battery.voltaje.toFixed(1)}V` : ""}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 12
      }}>
        <button onClick={() => onToggleAllLeds(false)} style={btnOutline}>Apagar Todos</button>
        <button onClick={() => onToggleAllLeds(true)}  style={btnBrand}>Encender Todos</button>
      </div>
    </div>
  )
}

function ConexionTab({ microControllers, pusherConnected, pusherStatus, onTestConnection, onTestAll, serverStatus, onTestServer, dbStatus, onTestDB }) {
  const statusColor = (s) =>
    s === "online"  ? C.success :
    s === "testing" ? C.accent  :
    s === "failed"  ? C.danger  : C.textSoft

  const statusLabel = (s) =>
    s === "online"  ? "Activo"      :
    s === "testing" ? "Probando..." :
    s === "failed"  ? "Inactivo"    : "Sin verificar"

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
              battery={mc?.battery}
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

        <div style={{ padding: "12px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconServer style={{ color: C.accent }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>API Backend</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: statusColor(serverStatus.api) }}>
                <StatusDot color={statusColor(serverStatus.api)} pulse={serverStatus.api === "testing"} />
                {statusLabel(serverStatus.api)}
              </span>
              <button onClick={onTestServer} disabled={serverStatus.api === "testing"} style={{
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

        <div style={{ padding: "12px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconDatabase style={{ color: C.accent }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Base de Datos</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: statusColor(dbStatus.status) }}>
                <StatusDot color={statusColor(dbStatus.status)} pulse={dbStatus.status === "testing"} />
                {statusLabel(dbStatus.status)}
              </span>
              <button onClick={onTestDB} disabled={dbStatus.status === "testing"} style={{
                fontSize: 11, padding: "3px 8px", borderRadius: 999,
                border: `1.5px solid ${C.border}`, background: C.white, color: C.textMid,
                cursor: dbStatus.status === "testing" ? "not-allowed" : "pointer",
                opacity: dbStatus.status === "testing" ? 0.5 : 1,
                display: "flex", alignItems: "center",
              }}>
                <IconRefresh style={{ color: C.textMid }} />
              </button>
            </div>
          </div>
          {dbStatus.latency && (
            <div style={{ fontSize: 11, color: C.textSoft, display: "flex", alignItems: "center", gap: 4 }}>
              <IconClock style={{ color: C.textSoft }} />
              Latencia:&nbsp;<span style={{ color: C.success, fontWeight: 700 }}>{dbStatus.latency}ms</span>
              {dbStatus.dialect && <span style={{ marginLeft: 6 }}>· {dbStatus.dialect}</span>}
            </div>
          )}
          <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4 }}>PostgreSQL · SSL habilitado</div>
        </div>

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

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={sectionLabel}>Últimos Tests</span>
          <div style={{
            minHeight: 40, background: C.brandLight, borderRadius: 8,
            border: `1px solid ${C.accentSoft}`, padding: "8px 12px",
            fontFamily: "monospace", fontSize: 11,
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textSoft }}>API · </span>
            <span style={{ color: serverStatus.lastTest?.startsWith("✓") ? C.success : serverStatus.lastTest?.startsWith("✗") ? C.danger : C.textSoft }}>
              {serverStatus.lastTest || "Presiona refresh para probar…"}
            </span>
          </div>
          <div style={{
            minHeight: 40, background: C.brandLight, borderRadius: 8,
            border: `1px solid ${C.accentSoft}`, padding: "8px 12px",
            fontFamily: "monospace", fontSize: 11,
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textSoft }}>DB · </span>
            <span style={{ color: dbStatus.lastTest?.startsWith("✓") ? C.success : dbStatus.lastTest?.startsWith("✗") ? C.danger : C.textSoft }}>
              {dbStatus.lastTest || "Presiona refresh para probar DB…"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ESPMonitoringDashboard() {
  const { nombre, rol, posicion, idUser, logout } = useAuth()
  const [mainTab, setMainTab] = useState("sensores")
  const [microControllers, setMicroControllers] = useState(
    ESP_LIST.map((id) => ({
      id, label: `ESP-${id}`, connected: false, lastSeen: null,
      ledOn: false, connectionStatus: "unknown", battery: null,
    }))
  )
  const [pusherConnected, setPusherConnected] = useState(false)
  const [pusherStatus,    setPusherStatus]    = useState("Desconectado")
  const [espMessages,     setEspMessages]     = useState([])
  const [sensorTestStates, setSensorTestStates] = useState({})
  const [pendingLed,      setPendingLed]      = useState({})

  const [serverStatus, setServerStatus] = useState({
    api: "unknown", apiLatency: null, apiMsg: null, lastTest: null,
  })
  const [dbStatus, setDbStatus] = useState({
    status: "unknown", latency: null, dialect: null, lastTest: null,
  })

  const connTimeouts   = useRef({})
  const sensorTimeouts = useRef({})
  const monitorRef     = useRef(null)

  const addMessage = useCallback((device, type, message, status = "info") => {
    setEspMessages(prev => [...prev.slice(-49), { device, type, message, status, timestamp: Date.now() }])
  }, [])

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

        channel.bind("client-status", (data) => {
          setMicroControllers(prev => prev.map(mc =>
            mc.id === id ? { ...mc, connectionStatus: "online", lastSeen: Date.now() } : mc
          ))
          addMessage(`ESP-${id}`, "status", `Conectado · IP: ${data?.ip || "—"}`, "success")
        })

        channel.bind("client-response", (data) => {
          const msg      = typeof data === "string" ? data : (data?.message || JSON.stringify(data))
          const msgLower = msg.toLowerCase()

          if (msgLower === "ok" || msgLower.includes("con_vida") || msgLower.includes("vivo")) {
            setMicroControllers(prev => prev.map(mc =>
              mc.id === id ? { ...mc, connectionStatus: "online", lastSeen: Date.now() } : mc
            ))
            if (connTimeouts.current[id]) { clearTimeout(connTimeouts.current[id]); delete connTimeouts.current[id] }
          }

          if (msg === "sensor_ok" || msg === "Acierto") {
            setSensorTestStates(prev => ({ ...prev, [id]: "success" }))
            if (sensorTimeouts.current[id]) { clearTimeout(sensorTimeouts.current[id]); delete sensorTimeouts.current[id] }
            setTimeout(() => setSensorTestStates(prev => ({ ...prev, [id]: "idle" })), 3000)
          }

          if (msgLower.includes("led_on_ok")) {
            setMicroControllers(prev => prev.map(mc => mc.id === id ? { ...mc, ledOn: true } : mc))
            setPendingLed(prev => { const n = {...prev}; delete n[id]; return n })
          } else if (msgLower.includes("led_off_ok")) {
            setMicroControllers(prev => prev.map(mc => mc.id === id ? { ...mc, ledOn: false } : mc))
            setPendingLed(prev => { const n = {...prev}; delete n[id]; return n })
          }

          addMessage(`ESP-${id}`, "response", msg, msgLower.includes("error") ? "error" : "success")
        })

        channel.bind("client-bateria_estado", (data) => {
          let payload = data
          if (typeof data.data === "string") {
            try { payload = JSON.parse(data.data) } catch { payload = data }
          }
          const { nivel, porcentaje, voltaje } = payload
          if (nivel) {
            setMicroControllers(prev => prev.map(mc =>
              mc.id === id
                ? { ...mc, battery: { nivel, porcentaje: porcentaje ?? null, voltaje: voltaje ?? null } }
                : mc
            ))
            if (nivel === "critico") {
              addMessage(`ESP-${id}`, "error", `🔋 Batería crítica (${voltaje?.toFixed(2)}V · ${porcentaje}%)`, "error")
            }
          }
        })
      })
    }
  }, [addMessage])

  useEffect(() => {
    if (monitorRef.current) monitorRef.current.scrollTop = monitorRef.current.scrollHeight
  }, [espMessages])

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
    setTimeout(() => setPendingLed(prev => { const n = {...prev}; delete n[id]; return n }), 5000)
  }, [microControllers, sendCommandToESP])

  const handleToggleAllLeds = useCallback(async (on) => {
    for (const id of ESP_LIST) {
      setPendingLed(prev => ({ ...prev, [id]: true }))
      await sendCommandToESP(id, on ? "LED_ON" : "LED_OFF").catch(() => {})
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
      const res     = await fetch(`${BACKEND_URL}/api/health/backend`)
      const latency = Date.now() - start
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setServerStatus(prev => ({ ...prev, api: "online", apiLatency: latency, apiMsg: data.message || "OK", lastTest: `✓ ${latency}ms · ${data.message || "OK"}` }))
      addMessage("SISTEMA", "status", `API activa · ${latency}ms`, "success")
    } catch (err) {
      try {
        const start2  = Date.now()
        const res2    = await fetch(`${BACKEND_URL}/api/pusher/test`)
        const latency = Date.now() - start2
        if (!res2.ok) throw new Error(`HTTP ${res2.status}`)
        const data = await res2.json()
        setServerStatus(prev => ({ ...prev, api: "online", apiLatency: latency, apiMsg: data.message || "OK", lastTest: `✓ ${latency}ms · ${data.message || "OK"}` }))
        addMessage("SISTEMA", "status", `API activa · ${latency}ms`, "success")
      } catch (err2) {
        setServerStatus(prev => ({ ...prev, api: "failed", apiLatency: null, apiMsg: err2.message, lastTest: `✗ ${err2.message}` }))
        addMessage("SISTEMA", "error", `API inaccesible: ${err2.message}`, "error")
      }
    }
  }, [addMessage])

  const handleTestDB = useCallback(async () => {
    setDbStatus(prev => ({ ...prev, status: "testing", latency: null }))
    const start = Date.now()
    try {
      const res     = await fetch(`${BACKEND_URL}/api/health/database`)
      const latency = Date.now() - start
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDbStatus({ status: "online", latency: data.latency ?? latency, dialect: data.dialect || "postgresql", lastTest: `✓ ${data.latency ?? latency}ms · ${data.message || "OK"}` })
      addMessage("SISTEMA", "status", `DB activa · ${data.latency ?? latency}ms`, "success")
    } catch (err) {
      setDbStatus({ status: "failed", latency: null, dialect: null, lastTest: `✗ ${err.message}` })
      addMessage("SISTEMA", "error", `DB inaccesible: ${err.message}`, "error")
    }
  }, [addMessage])

  const TABS = [
    { key: "sensores",   label: "Sensores" },
    { key: "actuadores", label: "Actuadores" },
    { key: "conexion",   label: "Conexión" },
  ]

  const msgColor = (status) =>
    status === "error" ? C.danger : status === "success" ? C.success : C.accent

  // Resumen global de baterías para el header
  const batteryAlerts = microControllers.filter(mc => mc.battery?.nivel === "critico")
  const batteryWarnings = microControllers.filter(mc => mc.battery?.nivel === "alerta")

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
        @keyframes battCrit {
          from { opacity: 1; }
          to   { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e0e7ff; border-radius: 99px; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px", display: "flex", flexDirection: "column", gap: 32 }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: C.accentSoft, border: `2px solid ${C.accent}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <IconUser />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {rol && (
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: C.accentSoft, color: C.accent, borderRadius: 999, padding: "3px 10px" }}>
                {rol}
              </span>
            )}
            {posicion && (
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: C.brandLight, color: C.brandMid, borderRadius: 999, padding: "3px 10px" }}>
                {posicion}
              </span>
            )}
          </div>

          {/* ── Banner de alertas de batería ── */}
          {(batteryAlerts.length > 0 || batteryWarnings.length > 0) && (
            <div style={{
              display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4,
            }}>
              {batteryAlerts.map(mc => (
                <span key={mc.id} style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                  background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3",
                  animation: "battCrit 1s ease-in-out infinite alternate",
                }}>
                  🔋 CAP-{mc.id} CRÍTICA {mc.battery.porcentaje != null ? `· ${mc.battery.porcentaje}%` : ""}
                </span>
              ))}
              {batteryWarnings.map(mc => (
                <span key={mc.id} style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                  background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a",
                }}>
                  🔋 CAP-{mc.id} BAJA {mc.battery.porcentaje != null ? `· ${mc.battery.porcentaje}%` : ""}
                </span>
              ))}
            </div>
          )}
        </div>

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

        <div>
          {mainTab === "sensores" && (
            <SensoresTab
              sensorTestStates={sensorTestStates}
              onTestSensor={handleTestSensor}
              onTestAll={handleTestAllSensors}
              onStopAll={handleStopAllSensors}
              espMessages={espMessages}
              microControllers={microControllers}
            />
          )}
          {mainTab === "actuadores" && (
            <ActuadoresTab
              microControllers={microControllers}
              onToggleLed={handleToggleLed}
              onToggleAllLeds={handleToggleAllLeds}
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
              dbStatus={dbStatus}
              onTestDB={handleTestDB}
            />
          )}
        </div>

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
