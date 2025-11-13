"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function PlayerHome() {
  const [openResultados, setOpenResultados] = useState(false);
  const [openRanking, setOpenRanking] = useState(false);

  const cards = [
    {
      key: "resultados",
      title: "Resultados",
      description: "Consulta tus resultados y estadísticas de rendimiento.",
      image: "/resultados.png",
      hoverImage: "/resultados.png",
      blob: "bg-[#E8F4FD]",
      accent: "text-[#1E5A9E]",
    },
    {
      key: "ranking",
      title: "Ranking",
      description: "Mira tu posición en el ranking del equipo.",
      image: "/ranking.png",
      hoverImage: "/ranking2.png",
      blob: "bg-[#FFF4E6]",
      accent: "text-[#D97706]",
    },
    {
      key: "perfil",
      title: "Perfil",
      description: "Actualiza tu información personal y preferencias.",
      image: "/jugadores.png",
      hoverImage: "/jugadores2.png",
      href: "/perfil",
      blob: "bg-[#F3E8FF]",
      accent: "text-[#7C3AED]",
    },
  ];

  const resultadoOptions = [
    { label: "Resultados Salto", href: "/resultados/salto" },
    { label: "Resultados Reacción", href: "/resultados/reaccion" },
  ];

  const rankingOptions = [
    { label: "Ranking Salto", href: "/ranking/salto" },
    { label: "Ranking Reacción", href: "/ranking/reaccion" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7fb] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100">
      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Título */}
        <header className="max-w-5xl mx-auto mb-8">
          <h1 className="w-full text-center rounded-2xl px-5 py-4 text-2xl md:text-4xl font-extrabold tracking-tight text-blue-900 bg-sky-50">
            Panel del jugador
          </h1>
        </header>

        <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 max-w-7xl mx-auto">
          {/* CARD: RESULTADOS (toggle) */}
          <li className="h-full">
            <button
              type="button"
              aria-expanded={openResultados}
              aria-controls="panel-resultados"
              onClick={() => {
                setOpenResultados((v) => !v);
                setOpenRanking(false);
              }}
              className="relative block w-full h-full text-left focus:outline-none group"
            >
              <div className="relative h-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 ring-1 ring-slate-900/5 dark:ring-white/5 shadow-xl dark:shadow-[0_12px_35px_-8px_rgba(0,0,0,0.6)] hover:shadow-[0_28px_80px_-16px_rgba(2,6,23,0.45)] dark:hover:shadow-[0_28px_80px_-16px_rgba(0,0,0,0.75)] hover:ring-2 hover:ring-slate-900/10 dark:hover:ring-white/10 transition-transform duration-300 will-change-transform hover:-translate-y-1 overflow-hidden">
                <span className="pointer-events-none absolute -inset-px rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition bg-gradient-to-br from-slate-400/30 via-slate-300/20 to-transparent dark:from-white/10 dark:via-white/5" aria-hidden="true" />

                {/* CONTENIDO que se oculta al abrir */}
                <div className={`relative z-10 transition-all duration-300 ease-out ${openResultados ? "-translate-y-8 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
                  <div className="relative h-64 md:h-72 flex items-center justify-center p-10 overflow-hidden">
                    <span className={`absolute h-36 w-40 bg-[#E8F4FD] rounded-[40%] opacity-90`} />
                    <div className="relative w-40 h-40 md:w-52 md:h-52">
                      <Image src="/resultados.png" alt="Resultados" fill sizes="(max-width: 640px) 10rem, (max-width: 1024px) 13rem, 13rem" className="absolute inset-0 object-contain drop-shadow-[0_12px_20px_rgba(2,6,23,0.25)]" />
                    </div>
                  </div>
                  <div className="px-6 pb-8 text-center">
                    <h3 className="text-sm md:text-base font-extrabold tracking-wider text-[#1E5A9E] uppercase mb-1">Resultados</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm md:text-[15px] leading-relaxed">Consulta tus resultados y estadísticas de rendimiento.</p>
                  </div>
                </div>

                {/* PANEL opciones Resultados */}
                <div
                  id="panel-resultados"
                  aria-hidden={!openResultados}
                  className={`absolute inset-0 z-20 flex items-center justify-center p-6 transition-all duration-300 ease-out ${openResultados ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}
                >
                  <div className="w-full max-w-sm grid grid-cols-1 gap-3">
                    {resultadoOptions.map((opt, idx) => (
                      <Link
                        key={opt.label}
                        href={opt.href}
                        onClick={(e) => e.stopPropagation()}
                        className="block w-full px-4 py-3 rounded-xl text-center font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-transform duration-200 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        style={{ animation: "pop 200ms ease-out both", animationDelay: `${idx * 60}ms` }}
                      >
                        {opt.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          </li>

          {/* CARD: RANKING (toggle) */}
          <li className="h-full">
            <button
              type="button"
              aria-expanded={openRanking}
              aria-controls="panel-ranking"
              onClick={() => {
                setOpenRanking((v) => !v);
                setOpenResultados(false);
              }}
              className="relative block w-full h-full text-left focus:outline-none group"
            >
              <div className="relative h-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 ring-1 ring-slate-900/5 dark:ring-white/5 shadow-xl dark:shadow-[0_12px_35px_-8px_rgba(0,0,0,0.6)] hover:shadow-[0_28px_80px_-16px_rgba(2,6,23,0.45)] dark:hover:shadow-[0_28px_80px_-16px_rgba(0,0,0,0.75)] hover:ring-2 hover:ring-slate-900/10 dark:hover:ring-white/10 transition-transform duration-300 will-change-transform hover:-translate-y-1 overflow-hidden">
                <span className="pointer-events-none absolute -inset-px rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition bg-gradient-to-br from-slate-400/30 via-slate-300/20 to-transparent dark:from-white/10 dark:via-white/5" aria-hidden="true" />

                {/* CONTENIDO que se oculta al abrir */}
                <div className={`relative z-10 transition-all duration-300 ease-out ${openRanking ? "-translate-y-8 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
                  <div className="relative h-64 md:h-72 flex items-center justify-center p-10 overflow-hidden">
                    <span className={`absolute h-36 w-40 bg-[#FFF4E6] rounded-[40%] opacity-90`} />
                    <div className="relative w-40 h-40 md:w-52 md:h-52">
                      <Image src="/ranking.png" alt="Ranking" fill sizes="(max-width: 640px) 10rem, (max-width: 1024px) 13rem, 13rem" className="absolute inset-0 object-contain drop-shadow-[0_12px_20px_rgba(2,6,23,0.25)]" />
                    </div>
                  </div>
                  <div className="px-6 pb-8 text-center">
                    <h3 className="text-sm md:text-base font-extrabold tracking-wider text-[#D97706] uppercase mb-1">Ranking</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm md:text-[15px] leading-relaxed">Mira tu posición en el ranking del equipo.</p>
                  </div>
                </div>

                {/* PANEL opciones Ranking */}
                <div
                  id="panel-ranking"
                  aria-hidden={!openRanking}
                  className={`absolute inset-0 z-20 flex items-center justify-center p-6 transition-all duration-300 ease-out ${openRanking ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}
                >
                  <div className="w-full max-w-sm grid grid-cols-1 gap-3">
                    {rankingOptions.map((opt, idx) => (
                      <Link
                        key={opt.label}
                        href={opt.href}
                        onClick={(e) => e.stopPropagation()}
                        className="block w-full px-4 py-3 rounded-xl text-center font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm hover:shadow-md transition-transform duration-200 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        style={{ animation: "pop 200ms ease-out both", animationDelay: `${idx * 60}ms` }}
                      >
                        {opt.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          </li>

          {/* CARD: PERFIL (link normal) */}
          <li className="h-full">
            <Link href="/perfil" aria-label="Perfil" className="block h-full focus:outline-none group">
              <div className="relative h-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 ring-1 ring-slate-900/5 dark:ring-white/5 shadow-xl dark:shadow-[0_12px_35px_-8px_rgba(0,0,0,0.6)] hover:shadow-[0_28px_80px_-16px_rgba(2,6,23,0.45)] dark:hover:shadow-[0_28px_80px_-16px_rgba(0,0,0,0.75)] hover:ring-2 hover:ring-slate-900/10 dark:hover:ring-white/10 transition-transform duration-300 will-change-transform hover:-translate-y-1">
                <span className="pointer-events-none absolute -inset-px rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition bg-gradient-to-br from-slate-400/30 via-slate-300/20 to-transparent dark:from-white/10 dark:via-white/5" aria-hidden="true" />
                <div className="relative h-64 md:h-72 flex items-center justify-center p-10 overflow-hidden">
                  <span className="absolute h-36 w-40 bg-[#F3E8FF] rounded-[40%] opacity-90" />
                  <div className="relative w-40 h-40 md:w-52 md:h-52">
                    <Image src="/jugadores.png" alt="Perfil" fill sizes="(max-width: 640px) 10rem, (max-width: 1024px) 13rem, 13rem" className="absolute inset-0 object-contain drop-shadow-[0_12px_20px_rgba(2,6,23,0.25)]" />
                  </div>
                </div>
                <div className="px-6 pb-8 text-center">
                  <h3 className="text-sm md:text-base font-extrabold tracking-wider text-[#7C3AED] uppercase mb-1">Perfil</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm md:text-[15px] leading-relaxed">Actualiza tu información personal y preferencias.</p>
                </div>
              </div>
            </Link>
          </li>
        </ul>
      </main>

      {/* Animación básica */}
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
