"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { User, RefreshCw, Play, Square } from "lucide-react"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .root {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: #f0eff5;
    color: #111;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 960px; margin: 0 auto; padding: 0 1.5rem 4rem; }

  .avatar-zone {
    display: flex; flex-direction: column; align-items: center;
    padding: 2.5rem 0 2rem; gap: 0.45rem;
  }
  .avatar-circle {
    width: 60px; height: 60px; border-radius: 50%;
    background: #e4e3ef; border: 1px solid #ccc9e0;
    display: flex; align-items: center; justify-content: center;
  }
  .avatar-label {
    font-size: 0.65rem; font-weight: 700;
    letter-spacing: 0.22em; text-transform: uppercase; color: #555;
  }

  .tab-bar {
    display: flex; background: #fff;
    border-radius: 12px 12px 0 0;
    border: 1px solid #d8d5ea; border-bottom: none;
  }
  .tab-btn {
    padding: 0.75rem 1.75rem; background: none; border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem; font-weight: 600; color: #999; cursor: pointer;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s; letter-spacing: 0.02em;
  }
  .tab-btn:hover { color: #3730a3; }
  .tab-btn.active { color: #1a174d; border-bottom-color: #1a174d; }

  .card {
    background: #fff; border: 1px solid #d8d5ea;
    border-top: none; border-radius: 0 0 14px 14px; padding: 2rem;
  }

  .sensors-grid {
    display: grid; grid-template-columns: 1fr 1px 1fr 1px 1fr; gap: 0;
  }
  @media (max-width: 680px) {
    .sensors-grid { grid-template-columns: 1fr; }
    .v-sep { display: none !important; }
    .sensor-col { border-bottom: 1px solid #e8e5f2; margin-bottom: 1.8rem; padding-bottom: 1.8rem; }
    .sensor-col:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  }
  .v-sep { background: #e8e5f2; }
  .sensor-col { padding: 0 1.5rem; }
  .sensor-col:first-child { padding-left: 0; }
  .sensor-col:last-child { padding-right: 0; }

  .sensor-heading {
    font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase; color: #1a174d;
    padding-bottom: 0.8rem; margin-bottom: 1.1rem; border-bottom: 1px solid #e8e5f2;
  }

  .flabel {
    display: block; font-size: 0.6rem; font-weight: 700;
    letter-spacing: 0.16em; text-transform: uppercase; color: #aaa; margin-bottom: 0.35rem;
  }
  .fgap { margin-top: 1.1rem; }

  .pill {
    display: inline-flex; align-items: center; gap: 0.28rem;
    padding: 0.18rem 0.65rem; border-radius: 999px;
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  }
  .pill-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .pill-on  { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
  .pill-on .pill-dot  { background: #10b981; animation: pdot 1.6s infinite; }
  .pill-off { background: #f3f4f6; color: #888; border: 1px solid #ddd; }
  .pill-off .pill-dot { background: #d1d5db; }
  .pill-streaming { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .pill-streaming .pill-dot { background: #3b82f6; animation: pdot 0.8s infinite; }
  @keyframes pdot { 0%,100%{opacity:1} 50%{opacity:.2} }
  @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.65)} }

  .reading-monitor {
    width: 100%; min-height: 100px; max-height: 150px;
    background: #fafafa; border: 1px solid #d8d5ea; border-radius: 8px;
    padding: 0.65rem 0.8rem; overflow-y: auto;
    font-family: 'IBM Plex Mono', monospace; font-size: 0.67rem; line-height: 1.75;
  }
  .line { display: block; }
  .line-muted { color: #c0bdda; font-style: italic; }
  .line-ts { color: #b0adc8; margin-right: 0.5rem; }
  .line-val { color: #1a174d; font-weight: 500; }

  .stream-controls { display: flex; gap: 0.5rem; margin-top: 0.7rem; }
  .btn-start {
    flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.3rem;
    padding: 0.38rem 0.6rem; border-radius: 6px;
    font-family: 'DM Sans', sans-serif; font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    background: #1a174d; color: #fff; border: none; cursor: pointer;
    transition: background 0.15s;
  }
  .btn-start:hover:not(:disabled) { background: #312e8e; }
  .btn-stop {
    flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.3rem;
    padding: 0.38rem 0.6rem; border-radius: 6px;
    font-family: 'DM Sans', sans-serif; font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    background: #fff; color: #dc2626; border: 1px solid #fca5a5; cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .btn-stop:hover:not(:disabled) { border-color: #ef4444; color: #b91c1c; }
  .btn-start:disabled, .btn-stop:disabled { opacity: 0.3; cursor: not-allowed; }

  .conexion-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;
  }
  @media (max-width: 640px) { .conexion-grid { grid-template-columns: 1fr; } }

  .conn-section-title {
    font-size: 0.6rem; font-weight: 800;
    letter-spacing: 0.18em; text-transform: uppercase; color: #1a174d;
    margin-bottom: 1rem; display: block;
  }

  .esp-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.75rem 0; border-bottom: 1px solid #f0effa;
  }
  .esp-row:last-child { border-bottom: none; }
  .esp-row-left { display: flex; align-items: center; gap: 0.65rem; }
  .esp-row-label { font-size: 0.8rem; font-weight: 500; color: #1f2937; }
  .esp-row-sub { font-size: 0.65rem; color: #9ca3af; margin-top: 1px; }
  .esp-row-right { display: flex; align-items: center; gap: 0.65rem; }
  .esp-status-text { font-size: 0.72rem; font-weight: 600; }

  .status-dot {
    display: inline-block; width: 8px; height: 8px;
    border-radius: 50%; flex-shrink: 0;
  }

  .btn-probe {
    font-size: 0.6rem; font-weight: 600; padding: 3px 12px; border-radius: 999px;
    border: 1.5px solid #d8d5ea; background: #fff; color: #6b7280;
    cursor: pointer; transition: border-color 0.15s, color 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-probe:hover:not(:disabled) { border-color: #4338ca; color: #1a174d; }
  .btn-probe:disabled { opacity: 0.4; cursor: not-allowed; }

  .server-box { border: 1px solid #d8d5ea; border-radius: 12px; overflow: hidden; }
  .server-box-head {
    background: #f5f4fc; border-bottom: 1px solid #d8d5ea;
    padding: 0.65rem 1.1rem; font-size: 0.6rem; font-weight: 800;
    letter-spacing: 0.18em; text-transform: uppercase; color: #1a174d;
  }
  .server-section {
    padding: 0.8rem 1.1rem; border-bottom: 1px solid #f0effa;
    display: flex; flex-direction: column; gap: 0.35rem;
  }
  .server-section:last-child { border-bottom: none; }
  .server-section-row { display: flex; align-items: center; justify-content: space-between; }
  .server-icon-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 600; color: #1f2937; }
  .server-section-sub { font-size: 0.65rem; color: #9ca3af; }
  .server-latency { font-size: 0.65rem; color: #9ca3af; display: flex; align-items: center; gap: 0.3rem; margin-top: 0.2rem; }
  .latency-val { color: #10b981; font-weight: 700; }

  .refresh-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 6px;
    border: 1.5px solid #d0cde8; background: #fff;
    cursor: pointer; color: #9ca3af; transition: border-color 0.15s, color 0.15s;
  }
  .refresh-btn:hover:not(:disabled) { border-color: #4338ca; color: #1a174d; }
  .refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .test-log-box {
    border: 1px solid #d8d5ea; border-radius: 8px;
    background: #eef2ff; padding: 0.7rem 0.9rem;
    font-family: 'IBM Plex Mono', monospace; font-size: 0.67rem;
    min-height: 48px; color: #9ca3af; margin-top: 0.8rem;
  }
  .test-log-box.ok { color: #047857; }
  .test-log-box.fail { color: #dc2626; }

  .log-section { margin-top: 2rem; }
  .log-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.65rem 1.1rem; background: #f5f4fc;
    border-radius: 12px 12px 0 0; border: 1px solid #d8d5ea; border-bottom: none;
  }
  .log-title {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.6rem; font-weight: 800;
    letter-spacing: 0.18em; text-transform: uppercase; color: #1a174d;
  }
  .log-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; animation: pdot 1s infinite; }
  .log-clear {
    font-family: 'DM Sans', sans-serif; font-size: 0.6rem; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    background: none; border: 1px solid #d0cde8; color: #999;
    padding: 0.2rem 0.65rem; border-radius: 4px; cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .log-clear:hover { border-color: #4338ca; color: #1a174d; }
  .log-body {
    background: #fff; border: 1px solid #d8d5ea; border-radius: 0 0 12px 12px;
    padding: 0.75rem 1.1rem; min-height: 180px; max-height: 260px; overflow-y: auto;
    font-family: 'IBM Plex Mono', monospace; font-size: 0.67rem; line-height: 1.85;
    display: flex; flex-direction: column;
  }
  .log-entry { display: flex; gap: 0.65rem; align-items: baseline; }
  .log-badge {
    font-size: 0.54rem; font-weight: 700; letter-spacing: 0.1em;
    padding: 0.06rem 0.4rem; border-radius: 3px; flex-shrink: 0;
  }
  .badge-response { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
  .badge-command  { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .badge-status   { background: #f5f4fc; color: #5b50a0; border: 1px solid #c4bfea; }
  .badge-error    { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
  .badge-sensor   { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .log-msg        { color: #374151; word-break: break-all; }
  .log-msg.success { color: #047857; }
  .log-msg.error   { color: #dc2626; }
  .log-msg.info    { color: #1d4ed8; }
  .log-empty       { color: #c4c2d4; font-size: 0.65rem; font-style: italic; }
`

const IconServer = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,color:"#6366f1"}}>
    <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6" strokeLinecap="round" strokeWidth="2"/>
    <line x1="6" y1="18" x2="6.01" y2="18" strokeLinecap="round" strokeWidth="2"/>
  </svg>
)
const IconDatabase = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,color:"#6366f1"}}>
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" strokeLinecap="round"/>
  </svg>
)
const IconZap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14,color:"#6366f1"}}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

// ── COMPONENTE DE BATERÍA CON TOOLTIP ─────────────────────────────────────
function BatteryIcon({ nivel, porcentaje, voltaje }) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  const barColors = {
    normal:  ["#10b981", "#10b981", "#10b981"],
    alerta:  ["#f59e0b", "#f59e0b", "#e8e8e8"],
    critico: ["#ef4444", "#e8e8e8", "#e8e8e8"],
    null:    ["#e8e8e8", "#e8e8e8", "#e8e8e8"],
  }
  const colors = barColors[nivel] || barColors.null
  const labelColor = nivel === "normal" ? "#10b981" : nivel === "alerta" ? "#f59e0b" : nivel === "critico" ? "#ef4444" : "#9ca3af"
  const batteryLabel = 
    nivel === "normal" ? "OK" :
    nivel === "alerta" ? "LOW" :
    nivel === "critico" ? "CRIT" : "—"

  return (
    <div
      style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "default" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
        <div style={{
          width: 18, height: 10, border: `1.5px solid ${colors[0] === "#e8e8e8" ? "#d8d5ea" : colors[0]}`,
          borderRadius: 2, padding: "1px 2px",
          display: "flex", alignItems: "center", gap: 1, background: "#fff",
        }}>
          {colors.map((c, i) => (
            <div key={i} style={{ flex: 1, height: "100%", borderRadius: 1, background: c, transition: "background 0.4s" }} />
          ))}
        </div>
        <div style={{ width: 2, height: 5, background: colors[0] === "#e8e8e8" ? "#d8d5ea" : colors[0], borderRadius: "0 1px 1px 0", transition: "background 0.4s" }} />
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color: labelColor, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
        {porcentaje !== null ? `${porcentaje}%` : batteryLabel}
      </span>
      
      {/* Tooltip al pasar el mouse */}
      {showTooltip && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "#fff", border: "1px solid #d8d5ea",
          borderRadius: 6, padding: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          whiteSpace: "nowrap", zIndex: 1000,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#1a174d", marginBottom: 4 }}>
            {porcentaje !== null ? `${porcentaje}%` : batteryLabel}
          </div>
          {voltaje != null && (
            <div style={{ fontSize: 10, color: "#6b7280" }}>
              {voltaje.toFixed(2)}V
            </div>
          )}
          {!nivel && (
            <div style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic" }}>
              Sin datos
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatTs(ts) {
  const d = new Date(ts)
  return (
    String(d.getHours()).padStart(2,"0") + ":" +
    String(d.getMinutes()).padStart(2,"0") + ":" +
    String(d.getSeconds()).padStart(2,"0") + "." +
    String(d.getMilliseconds()).padStart(3,"0").slice(0,2)
  )
}
function badgeClass(type) {
  return type === "response" ? "badge-response"
    : type === "command"    ? "badge-command"
    : type === "error"      ? "badge-error"
    : type === "sensor"     ? "badge-sensor"
    : "badge-status"
}

function SensorCol({ title, startCmd, stopCmd, isConnected, streaming, lines, onStart, onStop }) {
  const monRef = useRef(null)
  useEffect(() => {
    if (monRef.current) monRef.current.scrollTop = monRef.current.scrollHeight
  }, [lines])
  return (
    <div className="sensor-col">
      <div className="sensor-heading">{title}</div>
      <div>
        <span className="flabel">Estado</span>
        <span className={`pill ${!isConnected ? "pill-off" : streaming ? "pill-streaming" : "pill-off"}`}>
          <span className="pill-dot" />
          {!isConnected ? "Inactivo" : streaming ? "Activo" : "Inactivo"}
        </span>
      </div>
      <div className="fgap">
        <span className="flabel">Lectura en vivo</span>
        <div className="reading-monitor" ref={monRef}>
          {lines.length === 0
            ? <span className="line line-muted">sin datos</span>
            : lines.map((l, i) => (
              <span key={i} className="line">
                <span className="line-ts">{l.ts}</span>
                <span className="line-val">{l.val}</span>
              </span>
            ))}
        </div>
      </div>
      <div className="stream-controls">
        <button className="btn-start" disabled={streaming || !isConnected} onClick={() => onStart(startCmd)}>
          <Play size={10} strokeWidth={2.5} /> Iniciar
        </button>
        <button className="btn-stop" disabled={!streaming} onClick={() => onStop(stopCmd)}>
          <Square size={9} strokeWidth={2.5} /> Parar
        </button>
      </div>
    </div>
  )
}

function StatusDot({ color, pulse }) {
  return (
    <span className="status-dot" style={{
      background: color,
      animation: pulse ? "pulseDot 1s ease-in-out infinite" : "none",
    }} />
  )
}

function ConexionTab({ espStates, pusherConnected, onTestESP, serverStatus, onTestServer, onTestDB, dbStatus }) {
  const statusColor = (s) =>
    s === "online"  ? "#10b981" :
    s === "testing" ? "#eab308" :
    s === "failed"  ? "#ef4444" : "#d1d5db"

  const statusLabel = (s) =>
    s === "online"  ? "Activo" :
    s === "testing" ? "Probando…" :
    s === "failed"  ? "Inactivo" : "Sin verificar"

  const statusTextColor = (s) =>
    s === "online"  ? "#047857" :
    s === "testing" ? "#a16207" :
    s === "failed"  ? "#dc2626" : "#9ca3af"

  return (
    <div className="conexion-grid">
      {/* ESP32 connections */}
      <div>
        <span className="conn-section-title">Estado de Conexión ESP32</span>
        {Object.entries(espStates).map(([id, state]) => (
          <div key={id} className="esp-row">
            <div className="esp-row-left">
              <StatusDot color={statusColor(state.status)} pulse={state.status === "testing"} />
              <div>
                <div className="esp-row-label">ESP-{id}</div>
                {state.lastSeen && (
                  <div className="esp-row-sub">Visto: {new Date(state.lastSeen).toLocaleTimeString()}</div>
                )}
              </div>
            </div>
            <div className="esp-row-right">
              {/* Icono de batería al lado del botón */}
              {state.battery && (
                <BatteryIcon
                  nivel={state.battery.nivel}
                  porcentaje={state.battery.porcentaje}
                  voltaje={state.battery.voltaje}
                />
              )}
              <span className="esp-status-text" style={{ color: statusTextColor(state.status) }}>
                {statusLabel(state.status)}
              </span>
              <button
                className="btn-probe"
                disabled={state.status === "testing"}
                onClick={() => onTestESP(id)}
              >
                {state.status === "testing" ? "Probando…" : "Probar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Server + DB status */}
      <div>
        <span className="conn-section-title">Estado del Servidor</span>
        <div className="server-box">
          <div className="server-box-head">Diagnóstico del sistema</div>

          <div className="server-section">
            <div className="server-section-row">
              <div className="server-icon-label">
                <IconServer /> API Backend
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <span style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.72rem", fontWeight:600, color: statusTextColor(serverStatus.api) }}>
                  <StatusDot color={statusColor(serverStatus.api)} pulse={serverStatus.api === "testing"} />
                  {statusLabel(serverStatus.api)}
                </span>
                <button className="refresh-btn" onClick={onTestServer} disabled={serverStatus.api === "testing"} title="Verificar API">
                  <RefreshCw size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            {serverStatus.apiLatency && (
              <div className="server-latency">
                Latencia: <span className="latency-val">{serverStatus.apiLatency}ms</span>
                {serverStatus.apiMsg && <span>· {serverStatus.apiMsg}</span>}
              </div>
            )}
          </div>

          <div className="server-section">
            <div className="server-section-row">
              <div className="server-icon-label"><IconDatabase /> Base de Datos</div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <span style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.72rem", fontWeight:600, color: statusTextColor(dbStatus.status) }}>
                  <StatusDot color={statusColor(dbStatus.status)} pulse={dbStatus.status === "testing"} />
                  {statusLabel(dbStatus.status)}
                </span>
                <button className="refresh-btn" onClick={onTestDB} disabled={dbStatus.status === "testing"} title="Verificar DB">
                  <RefreshCw size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            {dbStatus.latency && (
              <div className="server-latency">
                Latencia: <span className="latency-val">{dbStatus.latency}ms</span>
                {dbStatus.dialect && <span>· {dbStatus.dialect}</span>}
              </div>
            )}
            <div className="server-section-sub">PostgreSQL · SSL habilitado</div>
          </div>

          <div className="server-section">
            <div className="server-section-row">
              <div className="server-icon-label"><IconZap /> Pusher WebSocket</div>
              <span style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.72rem", fontWeight:600, color: pusherConnected ? "#047857" : "#dc2626" }}>
                <StatusDot color={pusherConnected ? "#10b981" : "#ef4444"} pulse={!pusherConnected} />
                {pusherConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
            <div className="server-section-sub">Cluster: us2 · Canal: private-device-ESP-6</div>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginTop:"0.8rem" }}>
          <div className={`test-log-box ${serverStatus.lastTest?.startsWith("✓") ? "ok" : serverStatus.lastTest?.startsWith("✗") ? "fail" : ""}`}>
            <span style={{fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", opacity:0.6}}>API · </span>
            {serverStatus.lastTest || "Presiona refresh para verificar…"}
          </div>
          <div className={`test-log-box ${dbStatus.lastTest?.startsWith("✓") ? "ok" : dbStatus.lastTest?.startsWith("✗") ? "fail" : ""}`}>
            <span style={{fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", opacity:0.6}}>DB · </span>
            {dbStatus.lastTest || "Presiona refresh para verificar DB…"}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ESP6Monitor() {
  const [activeTab, setActiveTab] = useState("sensores")
  const [pusherConnected, setPusherConnected] = useState(false)
  const [espStates, setEspStates] = useState({ 
    6: { status: "unknown", lastSeen: null, battery: null } 
  })
  const connTimeouts = useRef({})

  const [serverStatus, setServerStatus] = useState({
    api: "unknown", apiLatency: null, apiMsg: null, lastTest: null,
  })
  const [dbStatus, setDbStatus] = useState({
    status: "unknown", latency: null, dialect: null, lastTest: null,
  })

  const [streaming, setStreaming] = useState({ cell1: false, cell2: false, mpu: false })
  const MAX_LINES = 60
  const [cell1Lines, setCell1Lines] = useState([])
  const [cell2Lines, setCell2Lines] = useState([])
  const [mpuLines,   setMpuLines]   = useState([])
  const [log, setLog] = useState([])
  const logRef    = useRef(null)
  const pusherRef = useRef(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  const addLog = useCallback((type, message, status = "default") => {
    setLog(p => [...p.slice(-199), { type, message, status, ts: Date.now() }])
  }, [])

  const pushLine = (setter, ts, val) =>
    setter(p => [...p.slice(-(MAX_LINES - 1)), { ts, val }])

  useEffect(() => { loadPusher() }, [])

  const loadPusher = () => {
    if (typeof window === "undefined") return
    const s = document.createElement("script")
    s.src = "https://js.pusher.com/8.2.0/pusher.min.js"
    s.async = true
    document.head.appendChild(s)
    s.onload = initializePusher
  }

  const initializePusher = () => {
    const pusher = new window.Pusher("4f85ef5c792df94cebc9", {
      cluster: "us2", encrypted: true,
      authEndpoint: `${BACKEND_URL}/api/pusher/pusher/auth`,
      forceTLS: true,
    })
    pusherRef.current = pusher
    pusher.connection.bind("connected", () => {
      setPusherConnected(true)
      subscribeToChannel(pusher)
    })
    pusher.connection.bind("disconnected", () => {
      setPusherConnected(false)
      setStreaming({ cell1: false, cell2: false, mpu: false })
      addLog("status", "Desconectado de Pusher", "error")
    })
  }

  const subscribeToChannel = (pusher) => {
    const channel = pusher.subscribe("private-device-ESP-6")

    channel.bind("client-status", (data) => {
      setEspStates(prev => ({ 
        ...prev, 
        6: { ...prev[6], status: "online", lastSeen: Date.now() } 
      }))
      addLog("status", `ESP-6 conectado · IP: ${data?.ip || "—"}`, "success")
    })

    // ── RECEPCIÓN DE DATOS DE BATERÍA ─────────────────────────────────────
    channel.bind("client-bateria_estado", (data) => {
      let payload = data
      if (typeof data.data === "string") {
        try { payload = JSON.parse(data.data) } catch { payload = data }
      }
      const { nivel, porcentaje, voltaje } = payload
      if (nivel) {
        setEspStates(prev => ({
          ...prev,
          6: {
            ...prev[6],
            battery: { nivel, porcentaje: porcentaje ?? null, voltaje: voltaje ?? null }
          }
        }))
        if (nivel === "critico") {
          addLog("error", `🔋 Batería crítica en ESP-6 (${voltaje?.toFixed(2)}V · ${porcentaje}%)`, "error")
        }
      }
    })

    channel.bind("client-sensor-data", ({ sensorType, value }) => {
      const ts  = formatTs(Date.now())
      const num = Number(value)
      if (sensorType === "CELL1") {
        pushLine(setCell1Lines, ts, `${num.toFixed(4)} kg`)
        setStreaming(s => ({ ...s, cell1: true }))
        addLog("sensor", `CELL1 → ${num.toFixed(4)} kg`, "success")
      } else if (sensorType === "CELL2") {
        pushLine(setCell2Lines, ts, `${num.toFixed(4)} kg`)
        setStreaming(s => ({ ...s, cell2: true }))
        addLog("sensor", `CELL2 → ${num.toFixed(4)} kg`, "success")
      } else if (sensorType === "MPUX") {
        pushLine(setMpuLines, ts, `X: ${num.toFixed(4)}`)
        setStreaming(s => ({ ...s, mpu: true }))
        addLog("sensor", `MPU X → ${num.toFixed(4)}`, "info")
      } else if (sensorType === "MPUY") {
        pushLine(setMpuLines, ts, `Y: ${num.toFixed(4)}`)
        setStreaming(s => ({ ...s, mpu: true }))
        addLog("sensor", `MPU Y → ${num.toFixed(4)}`, "info")
      } else if (sensorType === "MPUZ") {
        pushLine(setMpuLines, ts, `Z: ${num.toFixed(4)}`)
        setStreaming(s => ({ ...s, mpu: true }))
        addLog("sensor", `MPU Z → ${num.toFixed(4)}`, "info")
      }
    })

    channel.bind("client-response", (d) => {
      const msg = d.message || ""
      const msgLower = msg.toLowerCase()
      addLog("response", msg, msgLower.includes("error") ? "error" : "success")

      if (msgLower === "ok" || msgLower.includes("con_vida") || msgLower.includes("vivo")) {
        setEspStates(prev => ({ 
          ...prev, 
          6: { ...prev[6], status: "online", lastSeen: Date.now() } 
        }))
        if (connTimeouts.current[6]) { clearTimeout(connTimeouts.current[6]); delete connTimeouts.current[6] }
      }

      if (msg.includes("CELL1_STOP") || msg.includes("STREAM_CELL1_OFF"))
        setStreaming(s => ({ ...s, cell1: false }))
      if (msg.includes("CELL2_STOP") || msg.includes("STREAM_CELL2_OFF"))
        setStreaming(s => ({ ...s, cell2: false }))
      if (msg.includes("MPU_STOP") || msg.includes("STREAM_MPU_OFF"))
        setStreaming(s => ({ ...s, mpu: false }))
    })

    channel.bind("client-error", (d) =>
      addLog("error", d.message || "Error desconocido", "error"))
  }

  const sendCommand = async (command) => {
    addLog("command", `→ ${command}`, "info")
    try {
      const res = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "ESP-6", command, data: {}, channel: "private-device-ESP-6" }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
    } catch (e) {
      addLog("error", `Error: ${e.message}`, "error")
    }
  }

  const handleStart = (cmd) => sendCommand(cmd)
  const handleStop  = (cmd) => {
    sendCommand(cmd)
    if (cmd.includes("CELL1")) setStreaming(s => ({ ...s, cell1: false }))
    if (cmd.includes("CELL2")) setStreaming(s => ({ ...s, cell2: false }))
    if (cmd.includes("MPU"))   setStreaming(s => ({ ...s, mpu: false }))
  }

  const handleTestESP = (id) => {
    setEspStates(prev => ({ 
      ...prev, 
      [id]: { ...prev[id], status: "testing" } 
    }))
    const tid = setTimeout(() => {
      setEspStates(prev => ({ 
        ...prev, 
        [id]: { ...prev[id], status: "failed" } 
      }))
      addLog("error", `ESP-${id}: sin respuesta al STATE (5s)`, "error")
      delete connTimeouts.current[id]
    }, 5000)
    connTimeouts.current[id] = tid
    sendCommand("STATE")
  }

  const handleTestServer = async () => {
    setServerStatus(prev => ({ ...prev, api: "testing", apiLatency: null, apiMsg: null }))
    const start = Date.now()
    try {
      const res     = await fetch(`${BACKEND_URL}/api/health/backend`)
      const latency = Date.now() - start
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setServerStatus(prev => ({
        ...prev, api: "online",
        apiLatency: latency,
        apiMsg:     data.message || "OK",
        lastTest:   `✓ ${latency}ms · ${data.message || "OK"}`,
      }))
      addLog("status", `API activa · ${latency}ms`, "success")
    } catch (err) {
      try {
        const start2  = Date.now()
        const res2    = await fetch(`${BACKEND_URL}/api/pusher/test`)
        const latency = Date.now() - start2
        if (!res2.ok) throw new Error(`HTTP ${res2.status}`)
        const data = await res2.json()
        setServerStatus(prev => ({
          ...prev, api: "online",
          apiLatency: latency,
          apiMsg:     data.message || "OK",
          lastTest:   `✓ ${latency}ms · ${data.message || "OK"}`,
        }))
        addLog("status", `API activa · ${latency}ms`, "success")
      } catch (err2) {
        setServerStatus(prev => ({
          ...prev, api: "failed",
          apiLatency: null, apiMsg: err2.message,
          lastTest: `✗ ${err2.message}`,
        }))
        addLog("error", `API inaccesible: ${err2.message}`, "error")
      }
    }
  }

  const handleTestDB = async () => {
    setDbStatus(prev => ({ ...prev, status: "testing", latency: null }))
    const start = Date.now()
    try {
      const res     = await fetch(`${BACKEND_URL}/api/health/database`)
      const latency = Date.now() - start
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDbStatus({
        status:   "online",
        latency:  data.latency ?? latency,
        dialect:  data.dialect || "postgresql",
        lastTest: `✓ ${data.latency ?? latency}ms · ${data.message || "OK"}`,
      })
      addLog("status", `DB activa · ${data.latency ?? latency}ms`, "success")
    } catch (err) {
      setDbStatus({
        status:   "failed",
        latency:  null,
        dialect:  null,
        lastTest: `✗ ${err.message}`,
      })
      addLog("error", `DB inaccesible: ${err.message}`, "error")
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="root">
        <div className="wrap">

          <div className="avatar-zone">
            <div className="avatar-circle">
              <User size={24} color="#9ca3af" strokeWidth={1.5} />
            </div>
            <span className="avatar-label">Técnico</span>
          </div>

          <div className="tab-bar">
            {["sensores", "conexion"].map(t => (
              <button
                key={t}
                className={`tab-btn ${activeTab === t ? "active" : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t === "sensores" ? "Sensores" : "Conexión"}
              </button>
            ))}
          </div>

          <div className="card">
            {activeTab === "sensores" && (
              <div className="sensors-grid">
                <SensorCol title="Celda de Carga 1"
                  startCmd="STREAM_CELL1_ON" stopCmd="STREAM_CELL1_OFF"
                  isConnected={pusherConnected} streaming={streaming.cell1}
                  lines={cell1Lines} onStart={handleStart} onStop={handleStop} />
                <div className="v-sep" />
                <SensorCol title="Celda de Carga 2"
                  startCmd="STREAM_CELL2_ON" stopCmd="STREAM_CELL2_OFF"
                  isConnected={pusherConnected} streaming={streaming.cell2}
                  lines={cell2Lines} onStart={handleStart} onStop={handleStop} />
                <div className="v-sep" />
                <SensorCol title="MPU6050 (X · Y · Z)"
                  startCmd="STREAM_MPU_ON" stopCmd="STREAM_MPU_OFF"
                  isConnected={pusherConnected} streaming={streaming.mpu}
                  lines={mpuLines} onStart={handleStart} onStop={handleStop} />
              </div>
            )}

            {activeTab === "conexion" && (
              <ConexionTab
                espStates={espStates}
                pusherConnected={pusherConnected}
                onTestESP={handleTestESP}
                serverStatus={serverStatus}
                onTestServer={handleTestServer}
                dbStatus={dbStatus}
                onTestDB={handleTestDB}
              />
            )}
          </div>

          <div className="log-section">
            <div className="log-header">
              <div className="log-title">
                <span className="log-live-dot" />
                Monitor de mensajes
              </div>
              <button className="log-clear" onClick={() => setLog([])}>Limpiar</button>
            </div>
            <div className="log-body" ref={logRef}>
              {log.length === 0
                ? <span className="log-empty">sin actividad</span>
                : log.map((e, i) => (
                  <div key={i} className="log-entry">
                    <span className={`log-badge ${badgeClass(e.type)}`}>{e.type}</span>
                    <span className={`log-msg ${e.status}`}>{e.message}</span>
                  </div>
                ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
