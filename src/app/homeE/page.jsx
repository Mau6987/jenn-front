"use client";
// app/home/entrenador/page.jsx — FULLSCREEN con distribución como la referencia

import Link from "next/link";
import Image from "next/image";
import { Users, TrendingUp, Activity, Award, User } from "lucide-react";

const palette = { burgundy: "#800020", burgundySoft: "#a64d66", lightBg: "#f3f1f2" };

function Tile({ href, title, description, Icon, img }) {
  // Si pasas img, la mostramos grande; si no, usamos Icon
  return (
    <Link
      href={href}
      className="group flex h-full flex-col justify-between rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "#fff7f9", border: `1px solid ${palette.burgundy}22` }}>
          {img ? (
            <Image src={img} alt={title} width={56} height={56} className="h-14 w-14 object-contain" />
          ) : (
            <Icon className="h-8 w-8" style={{ color: palette.burgundy }} />
          )}
        </div>
        <h3 className="text-lg font-extrabold" style={{ color: palette.burgundy }}>{title}</h3>
      </div>
      <div className="mt-3 h-px w-full" style={{ background: `${palette.burgundy}22` }} />
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </Link>
  );
}

export default function EntrenadorHome() {
  return (
    <main className="min-h-[calc(100vh-88px)] w-full" style={{ background: palette.lightBg }}>
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-4 py-8 md:grid-cols-[1.1fr_1.2fr] lg:gap-10 lg:py-10">
        {/* IZQUIERDA: bloque de texto + imagen grande, imitanto la referencia */}
        <section className="flex flex-col">
          <div className="rounded-[22px] bg-white/70 p-6 shadow-sm ring-1 ring-gray-200">
            <h1 className="text-4xl font-black leading-tight" style={{ color: palette.burgundy }}>VolleyValle</h1>
            <p className="mt-2 text-[15px] leading-6 text-gray-700">
              Administra tu plantel y evalúa el rendimiento con pruebas de salto y reacción. Accede a rankings y resultados para tomar decisiones rápidas.
            </p>
          </div>

          {/* Imagen grande elíptica como en la toma */}
          <div className="relative mt-6 overflow-hidden rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <div className="relative mx-auto h-[220px] w-full max-w-[520px]">
              <Image src="/hero-entrenador.jpg" alt="Entrenamiento" fill className="rounded-[20px] object-cover" />
            </div>
          </div>
        </section>

        {/* DERECHA: grid 2x3 de tiles grandes (misma distribución) */}
        <section className="grid grid-cols-2 gap-5 lg:gap-6 content-start">
          <Tile href="/jugadores" title="Gestionar Jugadores" description="Altas, bajas y perfiles del plantel." Icon={Users} img="/icons/jugadores.png" />
          <Tile href="/pruebas-salto" title="Pruebas de Salto" description="Programación y registro de altura/RSI." Icon={TrendingUp} img="/icons/salto.png" />
          <Tile href="/pruebas-reaccion" title="Pruebas de Reacción" description="Tiempos, consistencia y evolución." Icon={Activity} img="/icons/reaccion.png" />
          <Tile href="/rankings-resultados" title="Rankings y Resultados" description="Tablas y métricas consolidadas." Icon={Award} img="/icons/rankings.png" />
          <Tile href="/perfil" title="Perfil" description="Datos personales y preferencias." Icon={User} img="/icons/perfil.png" />
          {/* sexto tile vacío para mantener la malla 2x3, opcional: podrías colocar "Tutorial" si deseas */}
          <div className="rounded-[22px] border border-dashed border-gray-200" />
        </section>
      </div>

      {/* Barra inferior decorativa */}
      <div className="mx-auto h-1 w-full max-w-[1200px] rounded-full" style={{ background: `linear-gradient(90deg, ${palette.burgundy}, ${palette.burgundySoft}, ${palette.burgundy})`, opacity: 0.6 }} />
    </main>
  );
}
