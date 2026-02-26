"use client"

import { useState, useEffect, useRef } from "react"
import { User, RefreshCw } from "lucide-react"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .root {
    font-family: 'Figtree', sans-serif;
    min-height: 100vh;
    background: #f5f5f8;
    color: #111827;
    -webkit-font-smoothing: antialiased;
  }

  .wrap { max-width: 900px; margin: 0 auto; padding: 0 1.5rem 4rem; }

  /* ── Avatar ── */
  .avatar-zone {
    display: flex; flex-direction: column; align-items: center;
    padding: 2.5rem 0 2.2rem; gap: 0.55rem;
  }
  .avatar-circle {
    width: 66px; height: 66px; border-radius: 50%;
    background: #e9e9f0;
    border: 1.5px solid #d4d2e0;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 6px rgba(30,27,75,0.07);
  }
  .avatar-label {
    font-size: 0.72rem; font-weight: 800;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #111827;
  }

  /* ── Tab bar ── */
  .tab-bar {
    display: flex;
    border-bottom: 1.5px solid #e0deea;
  }
  .tab-btn {
    padding: 0.7rem 2rem;
    background: none; border: none;
    font-family: 'Figtree', sans-serif;
    font-size: 0.875rem; font-weight: 600;
    color: #9ca3af; cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1.5px;
    transition: color 0.15s, border-color 0.15s;
    letter-spacing: 0.01em;
  }
  .tab-btn:hover { color: #4338ca; }
  .tab-btn.active { color: #1e1b4b; border-bottom-color: #1e1b4b; }

  /* ── Card panel ── */
  .card {
    background: #ffffff;
    border: 1.5px solid #e0deea;
    border-top: none;
    border-radius: 0 0 14px 14px;
    box-shadow: 0 4px 20px rgba(30,27,75,0.055);
    padding: 2rem;
  }

  /* ── Sensors ── */
  .sensors-layout {
    display: grid;
    grid-template-columns: 1fr 1px 1fr 1px 1fr;
    gap: 0;
  }
  @media (max-width: 680px) {
    .sensors-layout { grid-template-columns: 1fr; }
    .v-divider { display: none !important; }
    .sensor-col { padding: 0 0 1.5rem 0 !important; border-bottom: 1px solid #e0deea; margin-bottom: 1.5rem; }
    .sensor-col:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  }
  .v-divider { background: #e8e6f2; width: 1px; margin: 0 1.5rem; }
  .sensor-col { padding: 0 0.5rem; }
  .sensor-col:first-child { padding-left: 0; }
  .sensor-col:last-child { padding-right: 0; }

  .sensor-heading {
    font-size: 0.67rem; font-weight: 700;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: #1e1b4b;
    padding-bottom: 0.85rem;
    margin-bottom: 1.1rem;
    border-bottom: 1px solid #e8e6f2;
  }

  /* ── Fields ── */
  .flabel {
    display: block;
    font-size: 0.63rem; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: #9ca3af; margin-bottom: 0.4rem;
  }
  .fgap { margin-top: 1rem; }

  /* ── Pill badge ── */
  .pill {
    display: inline-flex; align-items: center; gap: 0.3rem;
    padding: 0.2rem 0.7rem; border-radius: 999px;
    font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
  }
  .pill-dot { width: 5px; height: 5px; border-radius: 50%; }
  .pill-on  { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
  .pill-on .pill-dot  { background: #10b981; animation: pulse 1.6s infinite; }
  .pill-off { background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }
  .pill-off .pill-dot { background: #d1d5db; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

  /* ── Textarea / input ── */
  .data-box {
    width: 100%; min-height: 96px; resize: none;
    border: 1.5px solid #e0deea; border-radius: 8px;
    padding: 0.55rem 0.7rem;
    background: #f9f8fc;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem; line-height: 1.65;
    color: #111827; outline: none;
    transition: border-color 0.15s;
  }
  .data-box:focus { border-color: #4338ca; }
  .plain-input {
    width: 100%;
    border: 1.5px solid #e0deea; border-radius: 8px;
    padding: 0.45rem 0.7rem;
    background: #f9f8fc;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem; color: #6b7280; outline: none;
    transition: border-color 0.15s;
  }
  .plain-input:focus { border-color: #4338ca; }

  /* ── Buttons ── */
  .btn-solid {
    font-family: 'Figtree', sans-serif;
    font-weight: 700; font-size: 0.68rem;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 0.32rem 0.9rem; border-radius: 6px;
    background: #1e1b4b; color: #fff; border: none;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-solid:hover { background: #3730a3; }

  .btn-ghost {
    font-family: 'Figtree', sans-serif;
    font-weight: 600; font-size: 0.68rem;
    letter-spacing: 0.06em; text-transform: uppercase;
    padding: 0.38rem 1rem; border-radius: 6px;
    background: transparent; color: #374151;
    border: 1.5px solid #d1d5db;
    cursor: pointer;
    display: inline-flex; align-items: center; gap: 0.35rem;
    transition: border-color 0.15s, color 0.15s;
  }
  .btn-ghost:hover { border-color: #4338ca; color: #1e1b4b; }

  /* ── Calibration row ── */
  .calib-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }

  /* ── Micro layout ── */
  .micro-layout {
    display: grid; grid-template-columns: 1fr 1.5fr;
    gap: 3rem; align-items: start;
  }
  @media (max-width: 600px) { .micro-layout { grid-template-columns: 1fr; gap: 1.5rem; } }

  .conn-row { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1.8rem; }

  .estab-label {
    display: block;
    font-size: 0.63rem; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: #9ca3af; margin-bottom: 0.7rem;
  }
  .radio-group { display: flex; flex-direction: column; gap: 0.55rem; }
  .radio-item {
    display: flex; align-items: center; gap: 0.55rem;
    font-size: 0.875rem; font-weight: 500; color: #374151; cursor: pointer;
  }
  .radio-item input { accent-color: #1e1b4b; width: 15px; height: 15px; cursor: pointer; }

  /* ── Server box ── */
  .server-box {
    border: 1.5px solid #e0deea; border-radius: 12px; overflow: hidden;
    box-shadow: 0 2px 10px rgba(30,27,75,0.045);
  }
  .server-box-head {
    background: linear-gradient(120deg, #eef2ff 0%, #f5f0ff 100%);
    border-bottom: 1.5px solid #e0deea;
    padding: 0.65rem 1.1rem;
    font-size: 0.63rem; font-weight: 800;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: #1e1b4b;
  }
  .server-box-body { padding: 1.1rem; display: flex; flex-direction: column; gap: 1rem; }
  .server-row { display: flex; flex-direction: column; gap: 0.35rem; }
  .server-row-lbl {
    font-size: 0.63rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: #9ca3af;
  }
  .response-box {
    border: 1.5px solid #e0deea; border-radius: 7px;
    padding: 0.4rem 0.65rem;
    background: #f9f8fc;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem; color: #6b7280;
    min-height: 32px;
  }
`

function SensorCol({ title, isActive, readingData, calibData, onCalibStart }) {
  return (
    <div className="sensor-col">
      <div className="sensor-heading">{title}</div>

      <div>
        <span className="flabel">Estado de Conexión</span>
        <span className={`pill ${isActive ? "pill-on" : "pill-off"}`}>
          <span className="pill-dot" />{isActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="fgap">
        <span className="flabel">Estado de Lectura</span>
        <textarea className="data-box" readOnly value={readingData} placeholder="Datos de lectura" />
      </div>

      <div className="fgap">
        <div className="calib-head">
          <span className="flabel" style={{ marginBottom: 0 }}>Calibración</span>
          <button className="btn-solid" onClick={onCalibStart}>Iniciar</button>
        </div>
        <input className="plain-input" readOnly value={calibData} placeholder="Datos de calibración" />
      </div>
    </div>
  )
}

export default function ESP6Monitor() {
  const [activeTab, setActiveTab] = useState("sensores")
  const [pusherConnected, setPusherConnected] = useState(false)
  const [espResponses, setEspResponses] = useState([])
  const [stability, setStability] = useState("excelente")
  const [responseTime, setResponseTime] = useState("")
  const [streamingStates] = useState({ cell1: false, cell2: false, mpuX: false, mpuY: false, mpuZ: false })
  const [sensorData, setSensorData] = useState([])
  const sensorDataRef = useRef([])
  const MAX_CHART_POINTS = 100

  useEffect(() => { loadPusher() }, [])

  const loadPusher = () => {
    if (typeof window === "undefined") return
    const script = document.createElement("script")
    script.src = "https://js.pusher.com/8.2.0/pusher.min.js"
    script.async = true
    document.head.appendChild(script)
    script.onload = () => initializePusher()
  }

  const initializePusher = () => {
    const pusher = new window.Pusher("4f85ef5c792df94cebc9", {
      cluster: "us2", encrypted: true,
      authEndpoint: `${BACKEND_URL}/api/pusher/pusher/auth`, forceTLS: true,
    })
    pusher.connection.bind("connected", () => { setPusherConnected(true); subscribeToChannel(pusher) })
    pusher.connection.bind("disconnected", () => setPusherConnected(false))
  }

  const subscribeToChannel = (pusher) => {
    const channel = pusher.subscribe("private-device-ESP-6")
    channel.bind("client-sensor-data", ({ sensorType, value }) => {
      setSensorData((prev) => {
        const newData = [...prev]
        const last = newData[newData.length - 1] || { timestamp: Date.now() }
        const pt = { ...last, timestamp: Date.now(), [sensorType]: value }
        if (!newData.length || pt.timestamp !== last.timestamp) newData.push(pt)
        else newData[newData.length - 1] = pt
        if (newData.length > MAX_CHART_POINTS) newData.shift()
        sensorDataRef.current = newData
        return newData
      })
      addMsg("sensor", `${sensorType}: ${Number(value).toFixed(2)}`, "success")
    })
    channel.bind("client-response", (d) => addMsg("response", d.message || "", d.message?.includes("error") ? "error" : "success"))
    channel.bind("client-status", (d) => addMsg("status", typeof d === "string" ? d : JSON.stringify(d), "info"))
    channel.bind("client-error", (d) => addMsg("error", d.message || "Error desconocido", "error"))
  }

  const addMsg = (type, message, status) =>
    setEspResponses((p) => [...p.slice(-19), { message, timestamp: Date.now(), type, status }])

  const sendCommand = async (command) => {
    const t0 = Date.now()
    try {
      const res = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "ESP-6", command, data: {}, channel: "private-device-ESP-6" }),
      })
      setResponseTime(`${Date.now() - t0} ms`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      addMsg("command", `Comando: ${command}`, "info")
    } catch (e) {
      addMsg("error", `Error: ${e.message}`, "error")
    }
  }

  const last = sensorData[sensorData.length - 1] || {}
  const mpuText = [
    last.MPUX !== undefined ? `X: ${Number(last.MPUX).toFixed(4)}` : "",
    last.MPUY !== undefined ? `Y: ${Number(last.MPUY).toFixed(4)}` : "",
    last.MPUZ !== undefined ? `Z: ${Number(last.MPUZ).toFixed(4)}` : "",
  ].filter(Boolean).join("\n")

  return (
    <>
      <style>{css}</style>
      <div className="root">
        <div className="wrap">

          {/* Avatar */}
          <div className="avatar-zone">
            <div className="avatar-circle">
              <User size={26} color="#9ca3af" strokeWidth={1.5} />
            </div>
            <span className="avatar-label">Técnico</span>
          </div>

          {/* Tabs */}
          <div className="tab-bar">
            {["sensores", "microcontrolador"].map((t) => (
              <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className="card">

            {/* SENSORES */}
            {activeTab === "sensores" && (
              <div className="sensors-layout">
                <SensorCol
                  title="Sensor MPU6050"
                  isActive={pusherConnected && (streamingStates.mpuX || streamingStates.mpuY || streamingStates.mpuZ)}
                  readingData={mpuText}
                  calibData=""
                  onCalibStart={() => sendCommand("CALIB_MPU")}
                />
                <div className="v-divider" />
                <SensorCol
                  title="Sensor Celda de Carga 1"
                  isActive={pusherConnected && streamingStates.cell1}
                  readingData={last.CELL1 !== undefined ? `${Number(last.CELL1).toFixed(4)} kg` : ""}
                  calibData=""
                  onCalibStart={() => sendCommand("CALIB_CELL1")}
                />
                <div className="v-divider" />
                <SensorCol
                  title="Sensor Celda de Carga 2"
                  isActive={pusherConnected && streamingStates.cell2}
                  readingData={last.CELL2 !== undefined ? `${Number(last.CELL2).toFixed(4)} kg` : ""}
                  calibData=""
                  onCalibStart={() => sendCommand("CALIB_CELL2")}
                />
              </div>
            )}

            {/* MICROCONTROLADOR */}
            {activeTab === "microcontrolador" && (
              <div className="micro-layout">

                {/* Left */}
                <div>
                  <span className="flabel">Estado de Conexión</span>
                  <div className="conn-row">
                    <span className={`pill ${pusherConnected ? "pill-on" : "pill-off"}`}>
                      <span className="pill-dot" />{pusherConnected ? "Activo" : "Inactivo"}
                    </span>
                    <button className="btn-ghost" onClick={() => sendCommand("CHECK")}>
                      <RefreshCw size={11} strokeWidth={2.5} />
                      Reconectar
                    </button>
                  </div>

                  <span className="estab-label">Estabilidad de Conexión</span>
                  <div className="radio-group">
                    {["excelente", "intermitente", "inestable"].map((v) => (
                      <label key={v} className="radio-item">
                        <input type="radio" name="stab" value={v} checked={stability === v} onChange={() => setStability(v)} />
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Right */}
                <div>
                  <span className="flabel">Estado del Servidor</span>
                  <div className="server-box">
                    <div className="server-box-head">Diagnóstico del sistema</div>
                    <div className="server-box-body">
                      <div className="server-row">
                        <span className="server-row-lbl">API</span>
                        <span className={`pill ${pusherConnected ? "pill-on" : "pill-off"}`} style={{ alignSelf: "flex-start" }}>
                          <span className="pill-dot" />{pusherConnected ? "Activo" : "Inactivo"}
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
        </div>
      </div>
    </>
  )
}