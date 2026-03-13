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
    .v-divider { display: none !important; }
    .sensor-col { border-bottom: 1px solid #e8e5f2; margin-bottom: 1.8rem; padding-bottom: 1.8rem; }
    .sensor-col:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  }
  .v-divider { background: #e8e5f2; }
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

  /* Reading monitor — fondo blanco */
  .reading-monitor {
    width: 100%; min-height: 100px; max-height: 150px;
    background: #fafafa; border: 1px solid #d8d5ea; border-radius: 8px;
    padding: 0.65rem 0.8rem; overflow-y: auto;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.67rem; line-height: 1.75;
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

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-family: 'DM Sans', sans-serif; font-size: 0.65rem; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
    padding: 0.38rem 0.9rem; border-radius: 6px;
    background: transparent; color: #555; border: 1px solid #d0cde8; cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .btn-ghost:hover { border-color: #4338ca; color: #1a174d; }

  .micro-layout { display: grid; grid-template-columns: 1fr 1.6fr; gap: 3rem; align-items: start; }
  @media (max-width: 600px) { .micro-layout { grid-template-columns: 1fr; gap: 1.5rem; } }
  .conn-row { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1.8rem; }
  .estab-label {
    display: block; font-size: 0.6rem; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase; color: #aaa; margin-bottom: 0.7rem;
  }
  .radio-group { display: flex; flex-direction: column; gap: 0.55rem; }
  .radio-item { display: flex; align-items: center; gap: 0.55rem; font-size: 0.875rem; font-weight: 500; color: #374151; cursor: pointer; }
  .radio-item input { accent-color: #1a174d; width: 15px; height: 15px; cursor: pointer; }

  .server-box { border: 1px solid #d8d5ea; border-radius: 12px; overflow: hidden; }
  .server-box-head {
    background: #f5f4fc; border-bottom: 1px solid #d8d5ea;
    padding: 0.65rem 1.1rem; font-size: 0.6rem; font-weight: 800;
    letter-spacing: 0.18em; text-transform: uppercase; color: #1a174d;
  }
  .server-box-body { padding: 1.1rem; display: flex; flex-direction: column; gap: 1rem; }
  .server-row { display: flex; flex-direction: column; gap: 0.3rem; }
  .server-row-lbl { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #aaa; }
  .response-box {
    border: 1px solid #d8d5ea; border-radius: 7px; padding: 0.4rem 0.65rem;
    background: #f9f8fc; font-family: 'IBM Plex Mono', monospace;
    font-size: 0.7rem; color: #666; min-height: 32px;
  }

  /* Monitor de mensajes — fondo blanco */
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
  .log-ts { color: #b0adc8; flex-shrink: 0; font-size: 0.63rem; }
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

function formatTs(ts) {
  const d = new Date(ts)
  return (
    String(d.getHours()).padStart(2, "0") + ":" +
    String(d.getMinutes()).padStart(2, "0") + ":" +
    String(d.getSeconds()).padStart(2, "0") + "." +
    String(d.getMilliseconds()).padStart(3, "0").slice(0, 2)
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
        <button
          className="btn-start"
          disabled={streaming || !isConnected}
          onClick={() => onStart(startCmd)}
        >
          <Play size={10} strokeWidth={2.5} /> Iniciar
        </button>
        <button
          className="btn-stop"
          disabled={!streaming}
          onClick={() => onStop(stopCmd)}
        >
          <Square size={9} strokeWidth={2.5} /> Parar
        </button>
      </div>
    </div>
  )
}

export default function ESP6Monitor() {
  const [activeTab, setActiveTab] = useState("sensores")
  const [pusherConnected, setPusherConnected] = useState(false)
  const [stability, setStability] = useState("excelente")
  const [responseTime, setResponseTime] = useState("")

  // streaming[x] = true SOLO cuando llegan datos reales del sensor
  const [streaming, setStreaming] = useState({ cell1: false, cell2: false, mpu: false })

  const MAX_LINES = 60
  const [cell1Lines, setCell1Lines] = useState([])
  const [cell2Lines, setCell2Lines] = useState([])
  const [mpuLines,   setMpuLines]   = useState([])

  const [log, setLog] = useState([])
  const logRef = useRef(null)

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
      addLog("response", msg, msg.toLowerCase().includes("error") ? "error" : "success")
      // El ESP confirma parada
      if (msg.includes("CELL1_STOP") || msg.includes("STREAM_CELL1_OFF"))
        setStreaming(s => ({ ...s, cell1: false }))
      if (msg.includes("CELL2_STOP") || msg.includes("STREAM_CELL2_OFF"))
        setStreaming(s => ({ ...s, cell2: false }))
      if (msg.includes("MPU_STOP")   || msg.includes("STREAM_MPU_OFF"))
        setStreaming(s => ({ ...s, mpu: false }))
    })

    channel.bind("client-status", (d) =>
      addLog("status", typeof d === "string" ? d : JSON.stringify(d), "info"))

    channel.bind("client-error", (d) =>
      addLog("error", d.message || "Error desconocido", "error"))
  }

  const sendCommand = async (command) => {
    const t0 = Date.now()
    addLog("command", `→ ${command}`, "info")
    try {
      const res = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "ESP-6", command, data: {}, channel: "private-device-ESP-6" }),
      })
      setResponseTime(`${Date.now() - t0} ms`)
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
    } catch (e) {
      addLog("error", `Error: ${e.message}`, "error")
    }
  }

  const handleStart = (cmd) => sendCommand(cmd)

  const handleStop = (cmd) => {
    sendCommand(cmd)
    // Apagamos estado inmediatamente — el ESP confirmará con su respuesta
    if (cmd.includes("CELL1")) setStreaming(s => ({ ...s, cell1: false }))
    if (cmd.includes("CELL2")) setStreaming(s => ({ ...s, cell2: false }))
    if (cmd.includes("MPU"))   setStreaming(s => ({ ...s, mpu: false }))
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
            {["sensores", "microcontrolador"].map(t => (
              <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`}
                onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
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
                <div className="v-divider" />
                <SensorCol title="Celda de Carga 2"
                  startCmd="STREAM_CELL2_ON" stopCmd="STREAM_CELL2_OFF"
                  isConnected={pusherConnected} streaming={streaming.cell2}
                  lines={cell2Lines} onStart={handleStart} onStop={handleStop} />
                <div className="v-divider" />
                <SensorCol title="MPU6050 (X · Y · Z)"
                  startCmd="STREAM_MPU_ON" stopCmd="STREAM_MPU_OFF"
                  isConnected={pusherConnected} streaming={streaming.mpu}
                  lines={mpuLines} onStart={handleStart} onStop={handleStop} />
              </div>
            )}

            {activeTab === "microcontrolador" && (
              <div className="micro-layout">
                <div>
                  <span className="flabel">Estado de Conexión</span>
                  <div className="conn-row">
                    <span className={`pill ${pusherConnected ? "pill-on" : "pill-off"}`}>
                      <span className="pill-dot" />
                      {pusherConnected ? "Activo" : "Inactivo"}
                    </span>
                    <button className="btn-ghost" onClick={() => sendCommand("CHECK")}>
                      <RefreshCw size={11} strokeWidth={2.5} /> Reconectar
                    </button>
                  </div>
                  <span className="estab-label">Estabilidad de Conexión</span>
                  <div className="radio-group">
                    {["excelente", "intermitente", "inestable"].map(v => (
                      <label key={v} className="radio-item">
                        <input type="radio" name="stab" value={v}
                          checked={stability === v} onChange={() => setStability(v)} />
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="flabel">Estado del Servidor</span>
                  <div className="server-box">
                    <div className="server-box-head">Diagnóstico del sistema</div>
                    <div className="server-box-body">
                      <div className="server-row">
                        <span className="server-row-lbl">API</span>
                        <span className={`pill ${pusherConnected ? "pill-on" : "pill-off"}`}
                          style={{ alignSelf: "flex-start" }}>
                          <span className="pill-dot" />
                          {pusherConnected ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div className="server-row">
                        <span className="server-row-lbl">Base de Datos</span>
                        <span className="pill pill-off" style={{ alignSelf: "flex-start" }}>
                          <span className="pill-dot" />Conectado / Desconectado
                        </span>
                      </div>
                      <div className="server-row">
                        <span className="server-row-lbl">Tiempo de Respuesta</span>
                        <div className="response-box">{responseTime || "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Monitor de mensajes */}
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
                    <span className="log-ts">{formatTs(e.ts)}</span>
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