"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function TecnicoHome() {
  const [openUsuarios, setOpenUsuarios] = useState(false);

  const cards = [
    {
      key: "salto",
      title: "Monitoreo Salto",
      description: "Monitoreo de conexion, celdas de carga y modulo mpu.",
      image: "/cinturon.png",
      href: "/monitoreo-salto",
      blob: "bg-[#E0F2FE]",
      accent: "text-[#0369A1]",
    },
    {
      key: "reaccion",
      title: "Monitoreo Reacción",
      description: "Monitoreo de capsulas, aros led, sensor magnetico, conexion, .",
      image: "/capsulas.png",
      href: "/monitoreo-reaccion",
      blob: "bg-[#DCFCE7]",
      accent: "text-[#15803D]",
    },
  ];

  const userOptions = [
    { label: "Técnicos", href: "/usuarios/tecnicos" },
    { label: "Entrenadores", href: "/usuarios/entrenadores" },
    { label: "Jugadores", href: "/usuarios/jugadores" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7fb] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100">
      {/* Título */}
      <header className="max-w-5xl mx-auto mb-8 pt-12 md:pt-16 px-4">
        <h1 className="w-full text-center rounded-2xl px-5 py-4 text-2xl md:text-4xl font-extrabold tracking-tight text-blue-900 bg-sky-50">
          Panel del técnico
        </h1>
      </header>

      <main className="container mx-auto px-4 pb-12 md:pb-16">
        <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 max-w-7xl mx-auto">
          {/* Cards de monitoreo */}
          {cards.map((card, index) => (
            <li key={card.key} className="h-full">
              <Link href={card.href} aria-label={card.title} className="block h-full focus:outline-none group">
                <div className="relative h-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 ring-1 ring-slate-900/5 dark:ring-white/5 shadow-xl dark:shadow-[0_12px_35px_-8px_rgba(0,0,0,0.6)] hover:shadow-[0_28px_80px_-16px_rgba(2,6,23,0.45)] dark:hover:shadow-[0_28px_80px_-16px_rgba(0,0,0,0.75)] hover:ring-2 hover:ring-slate-900/10 dark:hover:ring-white/10 transition-transform transition-shadow duration-300 will-change-transform hover:-translate-y-1">
                  <span className="pointer-events-none absolute -inset-px rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition bg-gradient-to-br from-slate-400/30 via-slate-300/20 to-transparent dark:from-white/10 dark:via-white/5" aria-hidden="true" />

                  <div className="relative h-64 md:h-72 flex items-center justify-center p-10 overflow-hidden">
                    <span className={`absolute h-36 w-40 ${card.blob} rounded-[40%] opacity-90`} />
                    <div className="relative w-40 h-40 md:w-52 md:h-52">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        sizes="(max-width: 640px) 10rem, (max-width: 1024px) 13rem, 13rem"
                        className="absolute inset-0 object-contain drop-shadow-[0_12px_20px_rgba(2,6,23,0.25)]"
                        priority={index === 0}
                      />
                    </div>
                    <div className="pointer-events-none absolute inset-0 rounded-3xl ring-0 ring-[#800020]/0 group-hover:ring-8 group-hover:ring-[#800020]/5 transition-all" />
                  </div>

                  <div className="px-6 pb-8 text-center">
                    <h3 className={`text-sm md:text-base font-extrabold tracking-wider ${card.accent} uppercase mb-1`}>
                      {card.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm md:text-[15px] leading-relaxed">
                      {card.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1 text-[#6C3EB8] dark:text-violet-300 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Entrar</span>
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M12.293 4.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 10H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}

          {/* Card Usuarios */}
          <li className="h-full">
            <button
              type="button"
              aria-expanded={openUsuarios}
              aria-controls="usuarios-panel"
              onClick={() => setOpenUsuarios((v) => !v)}
              className="relative block w-full h-full text-left focus:outline-none group"
            >
              <div className="relative h-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 ring-1 ring-slate-900/5 dark:ring-white/5 shadow-xl dark:shadow-[0_12px_35px_-8px_rgba(0,0,0,0.6)] hover:shadow-[0_28px_80px_-16px_rgba(2,6,23,0.45)] dark:hover:shadow-[0_28px_80px_-16px_rgba(0,0,0,0.75)] hover:ring-2 hover:ring-slate-900/10 dark:hover:ring-white/10 transition-transform transition-shadow duration-300 will-change-transform hover:-translate-y-1 overflow-hidden">
                <span className="pointer-events-none absolute -inset-px rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition bg-gradient-to-br from-slate-400/30 via-slate-300/20 to-transparent dark:from-white/10 dark:via-white/5" aria-hidden="true" />

                {/* CONTENIDO (se va hacia arriba) */}
                <div className={`relative z-10 transition-all duration-300 ease-out ${openUsuarios ? "-translate-y-8 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
                  <div className="relative h-64 md:h-72 flex items-center justify-center p-10">
                    <span className="absolute h-36 w-40 bg-[#F3E8FF] rounded-[40%] opacity-90" />
                    <div className="relative w-40 h-40 md:w-52 md:h-52">
                      <Image
                        src="/usuarios.png"
                        alt="Usuarios"
                        fill
                        sizes="(max-width: 640px) 10rem, (max-width: 1024px) 13rem, 13rem"
                        className="absolute inset-0 object-contain drop-shadow-[0_12px_20px_rgba(2,6,23,0.25)]"
                      />
                    </div>
                  </div>

                  <div className="px-6 pb-8 text-center">
                    <h3 className="text-sm md:text-base font-extrabold tracking-wider text-[#7C3AED] uppercase mb-1">Usuarios</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm md:text-[15px] leading-relaxed">Gestiona cuentas, roles y accesos del sistema.</p>
                    <div className="mt-4 inline-flex items-center gap-1 text-[#6C3EB8] dark:text-violet-300 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Seleccionar</span>
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M12.293 4.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 10H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* PANEL DE BOTONES (vertical, fondo de color) */}
                <div
                  id="usuarios-panel"
                  aria-hidden={!openUsuarios}
                  className={`absolute inset-0 z-20 flex items-center justify-center p-6 transition-all duration-300 ease-out ${openUsuarios ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}
                >
                  <div className="w-full max-w-sm grid grid-cols-1 gap-3">
                    {userOptions.map((opt, idx) => (
                      <Link
                        key={opt.label}
                        href={opt.href}
                        onClick={(e) => e.stopPropagation()}
                        className="block w-full px-4 py-3 rounded-xl text-center font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-sm hover:shadow-md transition-transform duration-200 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-300"
                        style={{ animation: "pop 200ms ease-out both", animationDelay: `${idx * 60}ms` }}
                      >
                        <span className="flex items-center justify-center">{opt.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          </li>
        </ul>
      </main>

      {/* Animaciones */}
      <style jsx>{`
        @keyframes pop {
          0% { opacity: 0; transform: translateY(10px) scale(0.96); }
          60% { opacity: 1; transform: translateY(-2px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
