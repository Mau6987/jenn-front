"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Instagram, Facebook } from "lucide-react"
import Image from "next/image"
import { useAuth } from "../../contexts/auth-context"

export default function LoginPage() {
  const [formData, setFormData] = useState({ usuario: "", contraseña: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login } = useAuth()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("https://jenn-back-reac.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        const userPosition = data.data.posicion || data.data.jugador?.posicion_principal

        const userName = data.data.nombre || data.data.jugador?.nombre || data.data.usuario || "Usuario"

        login(data.data.id, data.data.rol, data.data.token, userPosition, userName)

        // Normaliza el rol (quita acentos y case)
        const normalizedRole = (data.data.rol || "")
          .toString()
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")

        // Redirección según rol
        switch (normalizedRole) {
          case "jugador":
            router.push("/homeJ")
            break
          case "entrenador":
            router.push("/homeE")
            break
          case "tecnico":
            router.push("/homeT")
            break
          default:
            router.push("/perfil")
            break
        }
      } else {
        setError(data.message || "Error al iniciar sesión")
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gray-900 font-sans relative overflow-hidden">
      <div
        className="absolute inset-0 bg-center bg-no-repeat opacity-75"
        style={{
          backgroundImage:
            "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-AVC5jR8RoXCc2itFhawLOexSK6CvGW.png')",
          backgroundPosition: "center center",
          backgroundSize: "80%",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-gray-900/90" />

      <div className="absolute top-20 left-20 w-72 h-72 bg-red-600/10 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-rose-700/10 rounded-full blur-3xl animate-float-slower" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-red-500/5 rounded-full blur-3xl animate-pulse-glow" />

      <div className="flex justify-center items-center flex-grow relative z-10 px-4">
        <div className="grid gap-8 w-full max-w-md lg:max-w-2xl animate-fade-in-up">
          <div className="bg-white/10 rounded-[26px] shadow-2xl animate-scale-in hover:shadow-red-600/30 transition-all duration-500 backdrop-blur-md border-2 border-white/30">
            <div className="rounded-[20px] bg-gray-900/70 backdrop-blur-sm shadow-lg p-6 sm:p-8 lg:p-12">
              <div className="flex flex-col items-center pt-4 sm:pt-8 pb-4 sm:pb-6 animate-fade-in">
                <div className="mb-4 hover:scale-110 transition-transform duration-500 drop-shadow-2xl animate-bounce-slow" />
                <p className="text-red-200/70 text-sm sm:text-base mt-3 animate-fade-in-delayed">Bienvenido a</p>
                <h1 className="font-bold text-4xl sm:text-5xl lg:text-6xl text-center cursor-default bg-gradient-to-r from-red-600 via-rose-700 to-red-600 bg-clip-text text-transparent animate-gradient-text bg-[length:200%_auto]">
                  Tech Voley UNV
                </h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6 mt-8">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl shadow-sm animate-shake text-sm sm:text-base backdrop-blur-sm">
                    {error}
                  </div>
                )}

                <div className="animate-slide-in-left" style={{ animationDelay: "0.2s" }}>
                  <label
                    htmlFor="usuario"
                    className="mb-2 text-red-400 text-base sm:text-lg lg:text-xl block font-medium"
                  >
                    Usuario
                  </label>
                  <input
                    id="usuario"
                    name="usuario"
                    className="border p-3 lg:p-4 bg-white/5 text-white border-white/10 shadow-md placeholder:text-gray-500 placeholder:text-sm sm:placeholder:text-base focus:scale-[1.02] ease-in-out duration-300 rounded-xl w-full focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all hover:shadow-lg hover:shadow-red-500/10 hover:bg-white/10 text-base lg:text-lg backdrop-blur-sm"
                    type="text"
                    placeholder="Ingresa tu usuario"
                    value={formData.usuario}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="animate-slide-in-right" style={{ animationDelay: "0.3s" }}>
                  <label
                    htmlFor="contraseña"
                    className="mb-2 text-red-400 text-base sm:text-lg lg:text-xl block font-medium"
                  >
                    Contraseña
                  </label>
                  <input
                    id="contraseña"
                    name="contraseña"
                    className="border p-3 lg:p-4 shadow-md bg-white/5 text-white border-white/10 placeholder:text-gray-500 placeholder:text-sm sm:placeholder:text-base focus:scale-[1.02] ease-in-out duration-300 rounded-xl w-full focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all hover:shadow-lg hover:shadow-red-500/10 hover:bg-white/10 text-base lg:text-lg backdrop-blur-sm"
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={formData.contraseña}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <button
                  className="bg-gradient-to-r from-red-600 via-rose-700 to-red-600 shadow-lg shadow-red-600/30 mt-6 p-3 lg:p-4 text-white rounded-xl w-full hover:scale-[1.03] hover:shadow-2xl hover:shadow-red-600/50 transition-all duration-500 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base lg:text-lg animate-shimmer bg-[length:200%_100%] hover:brightness-110"
                  type="submit"
                  disabled={isLoading}
                  style={{ animationDelay: "0.4s" }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin-slow">⚡</span>
                      INICIANDO SESIÓN...
                    </span>
                  ) : (
                    "INICIAR SESIÓN"
                  )}
                </button>
              </form>

              <div
                className="flex items-center justify-center mt-6 sm:mt-8 space-x-3 sm:space-x-4 animate-fade-in"
                style={{ animationDelay: "0.5s" }}
              >
                <Link
                  href="https://www.instagram.com/univalle_bolivia/?hl=es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-110 ease-in-out duration-300 shadow-lg shadow-pink-500/20 p-2 sm:p-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-pink-500/50 hover:rotate-6 transition-all backdrop-blur-sm"
                >
                  <Instagram size={20} className="sm:w-6 sm:h-6" />
                </Link>

                <Link
                  href="https://www.facebook.com/UnivalleBolivia/?locale=es_LA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-110 ease-in-out duration-300 shadow-lg shadow-blue-500/20 p-2 sm:p-3 rounded-xl bg-blue-600 text-white hover:shadow-blue-500/50 hover:rotate-6 transition-all backdrop-blur-sm"
                >
                  <Facebook size={20} className="sm:w-6 sm:h-6" />
                </Link>

                <Link
                  href="https://www.univalle.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-110 ease-in-out duration-300 p-2 sm:p-3 rounded-xl hover:rotate-6 transition-all bg-white/10 hover:bg-white/20 backdrop-blur-sm shadow-lg"
                >
                  <Image
                    src="/logo.png"
                    alt="Univalle Logo"
                    width={35}
                    height={35}
                    className="sm:w-[43px] sm:h-[43px]"
                    priority
                  />
                </Link>
              </div>

              <div
                className="text-red-200 flex text-center flex-col mt-4 sm:mt-6 items-center text-xs sm:text-sm animate-fade-in"
                style={{ animationDelay: "0.6s" }}
              >
                <p className="cursor-default px-2">Bienvenido al sistema de entrenamiento para la selección de voley</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bounce-slow { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        @keyframes gradient-text { 0%{background-position:0% center;} 100%{background-position:200% center;} }
        @keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-10px);} 75%{transform:translateX(10px);} }
        @keyframes slide-in-left { from {opacity:0; transform:translateX(-30px);} to {opacity:1; transform:translateX(0);} }
        @keyframes slide-in-right { from {opacity:0; transform:translateX(30px);} to {opacity:1; transform:translateX(0);} }
        @keyframes pulse-slow { 0%,100%{opacity:1;} 50%{opacity:0.9;} }
        @keyframes float-slow { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(30px,-30px) scale(1.1);} 66%{transform:translate(-20px,20px) scale(0.9);} }
        @keyframes float-slower { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-40px,-40px) scale(1.15);} }
        @keyframes pulse-glow { 0%,100%{opacity:0.3; transform:scale(1);} 50%{opacity:0.6; transform:scale(1.2);} }
        @keyframes spin-slow { from {transform:rotate(0deg);} to {transform:rotate(360deg);} }
        @keyframes fade-in-delayed { 0%{opacity:0; transform:translateY(10px);} 100%{opacity:1; transform:translateY(0);} }
        @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.6s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; opacity: 0; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-gradient-text { animation: gradient-text 3s linear infinite; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-slide-in-left { animation: slide-in-left 0.6s ease-out forwards; opacity: 0; }
        .animate-slide-in-right { animation: slide-in-right 0.6s ease-out forwards; opacity: 0; }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 25s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 6s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 1s linear infinite; }
        .animate-fade-in-delayed { animation: fade-in-delayed 1s ease-out 0.3s forwards; opacity: 0; }
        .animate-shimmer { animation: shimmer 3s linear infinite; }
      `}</style>
    </div>
  )
}
