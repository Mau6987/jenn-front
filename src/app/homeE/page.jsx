"use client";

import Link from "next/link";
import Image from "next/image";

export default function TrainerHome() {
  const cards = [
    {
      title: "Pruebas de reaccion",
      description: "Evalúa la capacidad de  reacción de tus jugadores.",
      image: "/reaccion.png",
      hoverImage: "/reaccion2.png",
      href: "/pruebas-salto",
      blob: "bg-[#EADCF9]",
      accent: "text-[#6C3EB8]",
    },
    {
      title: "Pruebas de Pliometría",
      description: "Mide el rendimiento pliométrico y la explosividad.",
      image: "/pliometria.png",
      hoverImage: "/plimetria2.png",
      href: "/pruebas-pliometria",
      blob: "bg-[#D9F6E8]",
      accent: "text-[#1B8F6C]",
    },
    {
      title: "Jugadores",
      description: "Gestiona y consulta el perfil de tus jugadores.",
      image: "/jugadores.png",
      hoverImage: "/jugadores2.png",
      href: "/jugadores",
      blob: "bg-[#FBE4E6]",
      accent: "text-[#B01C3B]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7fb] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100">
      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* TÍTULO simple: texto azul oscuro, fondo celeste suave SOLO en el título */}
        <header className="max-w-5xl mx-auto mb-8">
          <h1
            className="w-full text-center rounded-2xl px-5 py-4 text-2xl md:text-4xl font-extrabold tracking-tight
                       text-blue-900 bg-sky-50"
          >
            Panel del entrenador
          </h1>
        </header>

        <ul
          role="list"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 max-w-7xl mx-auto"
        >
          {cards.map((card, index) => (
            <li key={card.title} className="h-full">
              <Link
                href={card.href}
                aria-label={card.title}
                className="block h-full focus:outline-none group"
              >
                <div
                  className="
                    relative h-full rounded-3xl bg-white dark:bg-slate-900
                    border border-slate-200/70 dark:border-slate-800/70
                    ring-1 ring-slate-900/5 dark:ring-white/5
                    shadow-xl dark:shadow-[0_12px_35px_-8px_rgba(0,0,0,0.6)]
                    hover:shadow-[0_28px_80px_-16px_rgba(2,6,23,0.45)]
                    dark:hover:shadow-[0_28px_80px_-16px_rgba(0,0,0,0.75)]
                    hover:ring-2 hover:ring-slate-900/10 dark:hover:ring-white/10
                    transition-transform transition-shadow duration-300 will-change-transform
                    hover:-translate-y-1
                  "
                >
                  {/* Halo sutil para resaltar el card */}
                  <span
                    className="pointer-events-none absolute -inset-px rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition
                               bg-gradient-to-br from-slate-400/30 via-slate-300/20 to-transparent dark:from-white/10 dark:via-white/5"
                    aria-hidden="true"
                  />

                  {/* MEDIA */}
                  <div className="relative h-64 md:h-72 flex items-center justify-center p-10 overflow-hidden">
                    {/* blob pastel detrás del icono */}
                    <span
                      className={`absolute h-36 w-40 ${card.blob} rounded-[40%] opacity-90`}
                    />

                    {/* imagen base + hover con fade cruzado */}
                    <div className="relative w-40 h-40 md:w-52 md:h-52">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        sizes="(max-width: 640px) 10rem, (max-width: 1024px) 13rem, 13rem"
                        className="absolute inset-0 object-contain drop-shadow-[0_12px_20px_rgba(2,6,23,0.25)] transition-opacity duration-500 ease-out opacity-100 group-hover:opacity-0"
                        priority={index === 0}
                      />
                      <Image
                        src={card.hoverImage}
                        alt={`${card.title} (hover)`}
                        fill
                        sizes="(max-width: 640px) 10rem, (max-width: 1024px) 13rem, 13rem"
                        className="absolute inset-0 object-contain drop-shadow-[0_12px_20px_rgba(2,6,23,0.25)] transition-opacity duration-500 ease-out opacity-0 group-hover:opacity-100"
                      />
                    </div>

                    {/* ring sutil en hover */}
                    <div className="pointer-events-none absolute inset-0 rounded-3xl ring-0 ring-[#800020]/0 group-hover:ring-8 group-hover:ring-[#800020]/5 transition-all" />
                  </div>

                  {/* CONTENIDO */}
                  <div className="px-6 pb-8 text-center">
                    <h3
                      className={`text-sm md:text-base font-extrabold tracking-wider ${card.accent} uppercase mb-1`}
                    >
                      {card.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm md:text-[15px] leading-relaxed">
                      {card.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1 text-[#6C3EB8] dark:text-violet-300 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Entrar</span>
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12.293 4.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 10H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
