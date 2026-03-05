"use client"

import { useState, useEffect, useRef } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts"

const BACKEND_URL = "https://jenn-back-reac.onrender.com"
const DEVICE_ID   = "ESP-7"

function loadPusher(onReady) {
  if (typeof window === "undefined") return
  if (!window.Pusher) {
    const script = document.createElement("script")
    script.src = "https://js.pusher.com/8.2.0/pusher.min.js"
    script.async = true
    script.onload = () => onReady()
    document.body.appendChild(script)
  } else { onReady() }
}

function initializePusher(onSubscribe) {
  const pusher = new window.Pusher("4f85ef5c792df94cebc9", {
    cluster: "us2", encrypted: true,
    authEndpoint: `${BACKEND_URL}/api/pusher/pusher/auth`,
    forceTLS: true,
  })
  onSubscribe(pusher)
}

async function sendCommand(command) {
  await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: DEVICE_ID, command, channel: `private-device-${DEVICE_ID}` }),
  })
}

const JumpTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{ background:"#18181b", border:"1px solid #3f3f46", borderRadius:8,
      padding:"8px 12px", fontSize:11, fontFamily:"'DM Mono',monospace", lineHeight:1.7 }}>
      <p style={{ color:"#a78bfa", marginBottom:4, fontWeight:600 }}>Salto #{d.num}</p>
      <p style={{ color:"#34d399" }}>Altura: <b>{d.altura} cm</b></p>
      <p style={{ color:"#a78bfa" }}>T. vuelo: <b>{d.vuelo} s</b></p>
      <p style={{ color:"#22d3ee" }}>Pico Izq: <b>{d.picoIzq} g</b></p>
      <p style={{ color:"#f472b6" }}>Pico Der: <b>{d.picoDer} g</b></p>
      <p style={{ color:"#fb923c" }}>Asimetría: <b>{d.asimetria}%</b></p>
    </div>
  )
}

export default function ForcePlateController() {
  const [connected,   setConnected]   = useState(false)
  const [fase,        setFase]        = useState("idle")
  const [duracion,    setDuracion]    = useState("30")
  const [saltos,      setSaltos]      = useState([])
  const [saltosTotal, setSaltosTotal] = useState(null)
  const [lastJump,    setLastJump]    = useState(null)
  const [elapsed,     setElapsed]     = useState(0)
  const [logs,        setLogs]        = useState([])
  const logEndRef = useRef(null)
  const timerRef  = useRef(null)

  const addLog = (msg, type = "info") =>
    setLogs(p => [...p, { msg, type, ts: new Date().toLocaleTimeString() }])

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [logs])
  useEffect(() => { loadPusher(() => initializePusher(subscribeToESP)) }, [])
  useEffect(() => {
    if (fase === "running") {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000)
    } else { clearInterval(timerRef.current) }
    return () => clearInterval(timerRef.current)
  }, [fase])

  const subscribeToESP = (pusher) => {
    const ch = pusher.subscribe(`private-device-${DEVICE_ID}`)

    ch.bind("pusher:subscription_succeeded", () => {
      setConnected(true)
      addLog(`Conectado a ${DEVICE_ID}`, "success")
    })

    ch.bind("client-response", (data) => {
      const msg = (data.message || "").trim()
      addLog(`ESP → ${msg}`)
      if (msg.toLowerCase().includes("calibrando")) { setFase("calibrating"); return }
      if (msg.toLowerCase().includes("calibracion completa")) {
        setFase("ready"); addLog("✔ Calibrado — listo para iniciar", "success"); return
      }
      if (msg.toLowerCase().includes("test iniciado")) {
        setFase("running"); setSaltos([]); setSaltosTotal(null); setLastJump(null)
        addLog("▶ Test en curso…", "success"); return
      }
      if (msg.toLowerCase().includes("test finalizado")) {
        setFase("done"); clearInterval(timerRef.current)
        addLog("■ Test finalizado", "success"); return
      }
    })

    // Salto completo JSON — event: client-jump
    ch.bind("client-jump", (data) => {
      try {
        const raw = data.message ?? data.data?.message ?? ""
        const j   = typeof raw === "string" ? JSON.parse(raw) : raw
        if (j.num == null) return
        const salto = {
          num:       j.num,
          vuelo:     parseFloat(j.vuelo).toFixed(3),
          altura:    parseFloat(j.altura).toFixed(1),
          picoIzq:   parseFloat(j.picoIzq).toFixed(1),
          picoDer:   parseFloat(j.picoDer).toFixed(1),
          asimetria: parseFloat(j.asimetria).toFixed(1),
        }
        setSaltos(p => [...p, salto])
        setLastJump(salto)
        addLog(`#${salto.num} | ${salto.altura}cm | ${salto.vuelo}s | Izq:${salto.picoIzq}g | Der:${salto.picoDer}g | asim:${salto.asimetria}%`, "success")
      } catch(e) { addLog(`Error salto JSON: ${e.message}`, "error") }
    })

    // Resultado final — event: client-result
    ch.bind("client-result", (data) => {
      try {
        const raw = data.message ?? data.data?.message ?? ""
        const r   = typeof raw === "string" ? JSON.parse(raw) : raw
        if (r.saltos_totales != null) {
          setSaltosTotal(r.saltos_totales)
          addLog(`Sesión completa — ${r.saltos_totales} saltos`, "success")
        }
      } catch(e) { addLog(`Error result JSON: ${e.message}`, "error") }
    })

    ch.bind("client-status", (d) => { if (d?.status === "connected") setConnected(true) })
  }

  const handleCalibrate = async () => {
    if (!connected || fase === "running" || fase === "calibrating") return
    setFase("calibrating"); setSaltos([]); setSaltosTotal(null); setLastJump(null)
    addLog("→ CALIBRATE")
    try { await sendCommand("CALIBRATE") }
    catch { addLog("Error CALIBRATE", "error"); setFase("idle") }
  }
  const handleStart = async () => {
    if (!connected) { addLog("Sin conexión", "error"); return }
    if (fase !== "ready" && fase !== "done") { addLog("Calibra primero", "error"); return }
    const secs = parseInt(duracion) || 30
    addLog(`→ START:${secs}`)
    try { await sendCommand(`START:${secs}`) }
    catch { addLog("Error START", "error") }
  }
  const handleStop = async () => {
    if (!connected || fase !== "running") return
    addLog("→ STOP")
    try { await sendCommand("STOP") }
    catch { addLog("Error STOP", "error") }
  }
  const handleReset = () => {
    setFase("idle"); setSaltos([]); setSaltosTotal(null)
    setLastJump(null); setElapsed(0); setLogs([])
  }

  const durNum   = parseInt(duracion) || 30
  const progress = fase === "running" ? Math.min((elapsed / durNum) * 100, 100) : fase === "done" ? 100 : 0
  const n        = saltos.length

  const mejorAltura  = n ? Math.max(...saltos.map(s => +s.altura)).toFixed(1) : null
  const promAltura   = n ? (saltos.reduce((a,s)=>a+(+s.altura),0)/n).toFixed(1) : null
  const promVuelo    = n ? (saltos.reduce((a,s)=>a+(+s.vuelo),0)/n).toFixed(3)  : null
  const promAsim     = n ? (saltos.reduce((a,s)=>a+(+s.asimetria),0)/n).toFixed(1) : null
  const mejorPicoIzq = n ? Math.abs(Math.min(...saltos.map(s=>+s.picoIzq))).toFixed(1) : null
  const mejorPicoDer = n ? Math.abs(Math.min(...saltos.map(s=>+s.picoDer))).toFixed(1)  : null

  const altData   = saltos.map(s => ({ name:`#${s.num}`, altura:+s.altura, vuelo:+s.vuelo, picoIzq:s.picoIzq, picoDer:s.picoDer, asimetria:s.asimetria, num:s.num }))
  const vueloData = saltos.map(s => ({ name:`#${s.num}`, value:+s.vuelo }))
  const picosData = saltos.map(s => ({ name:`#${s.num}`, izq:Math.abs(+s.picoIzq), der:Math.abs(+s.picoDer) }))
  const asimData  = saltos.map(s => ({ name:`#${s.num}`, value:+s.asimetria }))

  const tipStyle = {
    contentStyle:{ background:"#18181b", border:"1px solid #3f3f46", borderRadius:8, fontSize:11, fontFamily:"DM Mono,monospace" },
    labelStyle:{ color:"#71717a" }
  }
  const emptyBox = (h = 160) => (
    <div className="flex items-center justify-center border border-dashed border-zinc-800 rounded-lg" style={{height:h}}>
      <p className="text-[10px] text-zinc-700 uppercase tracking-widest">
        {fase==="idle" ? "Calibra para comenzar" : fase==="calibrating" ? "Calibrando…" : fase==="ready" ? "Presiona Iniciar Test" : "Esperando saltos…"}
      </p>
    </div>
  )

  return (
    <div style={{ fontFamily:"'DM Mono','Courier New',monospace" }}
         className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
        .blink  { animation:blink 1s step-end infinite; }
        @keyframes blink { 50%{opacity:0} }
        .pulseG { animation:pulseG 1.5s ease-in-out infinite; }
        @keyframes pulseG { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.4)} 50%{box-shadow:0 0 0 8px rgba(74,222,128,0)} }
        .jflash { animation:jflash .5s ease-out; }
        @keyframes jflash { 0%{background:#22c55e22} 100%{background:transparent} }
      `}</style>

      <div className="flex flex-col xl:flex-row flex-1 overflow-hidden">

        {/* ══ IZQUIERDA ══════════════════════════════════════════════════════ */}
        <div className="xl:w-72 shrink-0 border-b xl:border-b-0 xl:border-r border-zinc-800 p-4 space-y-4 xl:overflow-y-auto">

          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <p className="text-[9px] uppercase tracking-[.3em] text-zinc-500">Controlador</p>
              <h1 className="text-sm font-medium text-zinc-100 mt-0.5">Plataforma de Fuerza</h1>
              <p className="text-[9px] text-zinc-600">{DEVICE_ID} · HX711 + MPU6050</p>
            </div>
            <span className={`flex items-center gap-1.5 text-[9px] uppercase tracking-widest ${connected?"text-green-400":"text-zinc-500"}`}>
              <span className={`w-2 h-2 rounded-full ${connected?"bg-green-400 pulseG":"bg-zinc-600"}`} />
              {connected?"Online":"Offline"}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5">Duración (s)</p>
            <input type="number" value={duracion} min={1}
              onChange={e=>setDuracion(e.target.value)}
              disabled={fase==="running"||fase==="calibrating"}
              className="w-full bg-transparent border-b border-zinc-700 text-sm text-zinc-200 pb-1 focus:outline-none focus:border-zinc-400 disabled:opacity-40" />
          </div>

          <div className="space-y-2">
            <button onClick={handleCalibrate}
              disabled={!connected||fase==="running"||fase==="calibrating"}
              className={`w-full py-3 rounded-xl border text-[10px] uppercase tracking-widest font-medium transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
                ${fase==="calibrating" ? "bg-amber-500/10 border-amber-500/50 text-amber-400 animate-pulse"
                : (fase==="ready"||fase==="done") ? "bg-green-500/10 border-green-500/40 text-green-400"
                : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"}`}>
              {fase==="calibrating"
                ? <span className="flex items-center justify-center gap-2"><span className="blink">▮</span>Calibrando…</span>
                : (fase==="ready"||fase==="done") ? "✓ Calibrado" : "Calibrar"}
            </button>
            <button onClick={handleStart}
              disabled={!connected||(fase!=="ready"&&fase!=="done")}
              className="w-full py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 text-[10px] uppercase tracking-widest font-medium hover:bg-zinc-800 hover:border-zinc-500 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              Iniciar test
            </button>
            <button onClick={handleStop}
              disabled={!connected||fase!=="running"}
              className={`w-full py-3 rounded-xl border text-[10px] uppercase tracking-widest font-medium transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
                ${fase==="running" ? "bg-red-500/10 border-red-500/50 text-red-400 animate-pulse" : "bg-zinc-900 border-zinc-700 text-zinc-300"}`}>
              Detener
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-zinc-500">
              <span className="uppercase tracking-widest">Progreso</span>
              <span className="font-mono">{fase==="running" ? `${elapsed}s / ${durNum}s` : fase==="done" ? "Finalizado" : "—"}</span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{width:`${progress}%`}} />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500">Saltos detectados</span>
            <span className="text-3xl font-medium text-zinc-100 tabular-nums">{saltosTotal ?? n}</span>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] uppercase tracking-widest text-zinc-500 px-1">Último salto</p>
            {[
              { label:"Altura",    val:lastJump?`${lastJump.altura} cm`:null,   c:"text-green-400"  },
              { label:"T. vuelo",  val:lastJump?`${lastJump.vuelo} s`:null,     c:"text-purple-400" },
              { label:"Pico Izq",  val:lastJump?`${lastJump.picoIzq} g`:null,  c:"text-cyan-400"   },
              { label:"Pico Der",  val:lastJump?`${lastJump.picoDer} g`:null,   c:"text-pink-400"   },
              { label:"Asimetría", val:lastJump?`${lastJump.asimetria} %`:null, c:"text-orange-400" },
            ].map(({label,val,c}) => (
              <div key={label} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</span>
                <span className={`text-sm font-medium tabular-nums ${val?c:"text-zinc-700"}`}>{val??"—"}</span>
              </div>
            ))}
          </div>

          {fase==="done" && (
            <button onClick={handleReset}
              className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-[10px] uppercase tracking-widest hover:border-zinc-500 transition-all">
              Nuevo test
            </button>
          )}
        </div>

        {/* ══ DERECHA — Gráficas ═════════════════════════════════════════════ */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto min-w-0">

          {/* 6 stat cards */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label:"Mejor altura",  val:mejorAltura  ?`${mejorAltura} cm` :"—", c:"#34d399" },
              { label:"Prom. altura",  val:promAltura   ?`${promAltura} cm`  :"—", c:"#60a5fa" },
              { label:"Prom. vuelo",   val:promVuelo    ?`${promVuelo} s`    :"—", c:"#a78bfa" },
              { label:"Pico Izq máx", val:mejorPicoIzq ?`${mejorPicoIzq} g`:"—", c:"#22d3ee" },
              { label:"Pico Der máx", val:mejorPicoDer ?`${mejorPicoDer} g` :"—", c:"#f472b6" },
              { label:"Prom. asim.",  val:promAsim     ?`${promAsim}%`      :"—", c:"#fb923c" },
            ].map(({label,val,c}) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <p className="text-[8px] uppercase tracking-widest mb-1.5" style={{color:c}}>{label}</p>
                <p className="text-lg font-medium text-zinc-100 tabular-nums leading-none">{val}</p>
              </div>
            ))}
          </div>

          {/* Altura por salto */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] uppercase tracking-widest text-zinc-400">Altura por salto (cm)</p>
              {fase==="running" && (
                <span className="flex items-center gap-1.5 text-[9px] text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />En vivo
                </span>
              )}
            </div>
            {altData.length===0 ? emptyBox(180) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={altData} margin={{top:4,right:8,left:-16,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" tick={{fill:"#71717a",fontSize:9}} />
                  <YAxis tick={{fill:"#52525b",fontSize:9}} unit=" cm" />
                  <Tooltip content={<JumpTooltip />} cursor={{fill:"#27272a"}} />
                  <Bar dataKey="altura" radius={[4,4,0,0]} isAnimationActive={false}>
                    {altData.map((_,i) => (
                      <Cell key={i} fill={i===altData.length-1&&fase==="running"?"#34d399":"#22d3ee"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tiempo de vuelo + Asimetría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-2">Tiempo de vuelo por salto (s)</p>
              {vueloData.length===0 ? emptyBox() : (
                <ResponsiveContainer width="100%" height={170}>
                  <LineChart data={vueloData} margin={{top:4,right:8,left:-16,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{fill:"#71717a",fontSize:9}} />
                    <YAxis tick={{fill:"#52525b",fontSize:9}} unit=" s" />
                    <Tooltip {...tipStyle} formatter={v=>[`${(+v).toFixed(3)} s`,"T. vuelo"]} />
                    <Line type="monotone" dataKey="value" name="T. vuelo" stroke="#a78bfa"
                      dot={{fill:"#a78bfa",r:4,strokeWidth:0}} strokeWidth={2} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-2">Asimetría por salto (%)</p>
              {asimData.length===0 ? emptyBox() : (
                <ResponsiveContainer width="100%" height={170}>
                  <LineChart data={asimData} margin={{top:4,right:8,left:-16,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{fill:"#71717a",fontSize:9}} />
                    <YAxis tick={{fill:"#52525b",fontSize:9}} unit="%" />
                    <Tooltip {...tipStyle} formatter={v=>[`${(+v).toFixed(1)}%`,"Asimetría"]} />
                    <Line type="monotone" dataKey={()=>10} name="Límite 10%" stroke="#ef4444"
                      dot={false} strokeWidth={1} strokeDasharray="4 4" isAnimationActive={false} />
                    <Line type="monotone" dataKey="value" name="Asimetría" stroke="#fb923c"
                      dot={{fill:"#fb923c",r:4,strokeWidth:0}} strokeWidth={2} isAnimationActive={false} />
                    <Legend wrapperStyle={{fontSize:9,color:"#71717a"}} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Picos Izq vs Der + Tabla */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-2">Pico de fuerza Izq vs Der (g)</p>
              {picosData.length===0 ? emptyBox() : (
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={picosData} margin={{top:4,right:8,left:-16,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{fill:"#71717a",fontSize:9}} />
                    <YAxis tick={{fill:"#52525b",fontSize:9}} unit=" g" />
                    <Tooltip {...tipStyle} formatter={(v,nm)=>[`${(+v).toFixed(1)} g`,nm==="izq"?"Izquierda":"Derecha"]} />
                    <Legend wrapperStyle={{fontSize:9,color:"#71717a"}} formatter={v=>v==="izq"?"Izquierda":"Derecha"} />
                    <Bar dataKey="izq" name="izq" fill="#22d3ee" radius={[3,3,0,0]} isAnimationActive={false} />
                    <Bar dataKey="der" name="der" fill="#f472b6" radius={[3,3,0,0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 flex justify-between items-center">
                <p className="text-[9px] uppercase tracking-widest text-zinc-400">Registro de saltos</p>
                <span className="text-[9px] text-zinc-600 font-mono">{n} saltos</span>
              </div>
              <div className="overflow-y-auto" style={{maxHeight:210}}>
                {n===0 ? (
                  <div className="h-36 flex items-center justify-center">
                    <p className="text-[10px] text-zinc-700 uppercase tracking-widest">Sin saltos aún</p>
                  </div>
                ) : (
                  <table className="w-full text-[10px]">
                    <thead className="sticky top-0 bg-zinc-900 z-10">
                      <tr className="border-b border-zinc-800">
                        {["#","Altura","Vuelo","P.Izq","P.Der","Asim."].map(h=>(
                          <th key={h} className="px-2 py-2 text-left text-zinc-600 font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...saltos].reverse().map((s,i)=>(
                        <tr key={s.num} className={`border-b border-zinc-900 ${i===0?"jflash":""}`}>
                          <td className="px-2 py-2 text-zinc-500">{s.num}</td>
                          <td className="px-2 py-2 text-green-400 font-medium">{s.altura} cm</td>
                          <td className="px-2 py-2 text-purple-400">{s.vuelo} s</td>
                          <td className="px-2 py-2 text-cyan-400">{Math.abs(+s.picoIzq).toFixed(1)} g</td>
                          <td className="px-2 py-2 text-pink-400">{Math.abs(+s.picoDer).toFixed(1)} g</td>
                          <td className={`px-2 py-2 font-medium ${+s.asimetria>10?"text-amber-400":"text-zinc-400"}`}>{s.asimetria}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Monitor */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-zinc-800">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500">Monitor de mensajes</span>
              <span className="text-[9px] text-zinc-600 font-mono">{logs.length} msgs</span>
            </div>
            <div className="bg-zinc-950 px-4 py-3 h-40 overflow-y-auto text-[10px] space-y-0.5">
              {logs.length===0
                ? <p className="text-zinc-700">Sin actividad…</p>
                : logs.map((l,i)=>(
                    <div key={i} className={l.type==="error"?"text-red-400":l.type==="success"?"text-green-400":"text-zinc-500"}>
                      <span className="text-zinc-700">[{l.ts}] </span>{l.msg}
                    </div>
                  ))}
              <div ref={logEndRef} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}