"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Instagram, Facebook } from "lucide-react"
import Image from "next/image"
import { useAuth } from "../../contexts/auth-context"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    usuario: "",
    contraseña: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login } = useAuth()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("https://jenn-back-reac.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        const userPosition = data.data.posicion || data.data.jugador?.posicion_principal
        login(data.data.id, data.data.rol, data.data.token, userPosition)

        router.push("/perfil")
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
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-AVC5jR8RoXCc2itFhawLOexSK6CvGW.png')`,
          backgroundPosition: "center center",
          backgroundSize: "80%",
        }}
      />

      <div className="flex justify-center items-center flex-grow relative z-10 px-4">
        <div className="grid gap-8 w-full max-w-md lg:max-w-2xl animate-fade-in-up">
          <div className="bg-white/10 rounded-[26px] shadow-2xl animate-scale-in hover:shadow-orange-500/30 transition-all duration-500 backdrop-blur-md border-2 border-white/30">
            <div className="rounded-[20px] bg-gray-900/70 backdrop-blur-sm shadow-lg p-6 sm:p-8 lg:p-12">
              <div className="flex flex-col items-center pt-4 sm:pt-8 pb-4 sm:pb-6 animate-fade-in">
                <div className="mb-4 hover:scale-110 transition-transform duration-500 drop-shadow-2xl animate-bounce-slow">
                  <Image
                    src="/login.png"
                    alt="Voley Training Sys Logo"
                    width={100}
                    height={100}
                    className="sm:w-[120px] sm:h-[120px] lg:w-[140px] lg:h-[140px]"
                    priority
                  />
                </div>
                <h1 className="font-bold text-4xl sm:text-5xl lg:text-6xl text-center cursor-default bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 bg-clip-text text-transparent animate-gradient-text bg-[length:200%_auto]">
                  Voley Training Sys
                </h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-sm animate-shake text-sm sm:text-base">
                    {error}
                  </div>
                )}

                <div className="animate-slide-in-left" style={{ animationDelay: "0.2s" }}>
                  <label
                    htmlFor="usuario"
                    className="mb-2 text-orange-300 text-base sm:text-lg lg:text-xl block font-medium"
                  >
                    Usuario
                  </label>
                  <input
                    id="usuario"
                    name="usuario"
                    className="border p-3 lg:p-4 bg-white/10 text-white border-white/20 shadow-md placeholder:text-gray-400 placeholder:text-sm sm:placeholder:text-base focus:scale-[1.02] ease-in-out duration-300 rounded-lg w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all hover:shadow-lg hover:bg-white/15 text-base lg:text-lg"
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
                    className="mb-2 text-orange-300 text-base sm:text-lg lg:text-xl block font-medium"
                  >
                    Contraseña
                  </label>
                  <input
                    id="contraseña"
                    name="contraseña"
                    className="border p-3 lg:p-4 shadow-md bg-white/10 text-white border-white/20 placeholder:text-gray-400 placeholder:text-sm sm:placeholder:text-base focus:scale-[1.02] ease-in-out duration-300 rounded-lg w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all hover:shadow-lg hover:bg-white/15 text-base lg:text-lg"
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={formData.contraseña}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <button
                  className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg mt-6 p-3 lg:p-4 text-white rounded-lg w-full hover:scale-[1.02] hover:from-orange-400 hover:to-orange-500 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:shadow-2xl hover:shadow-orange-500/50 animate-pulse-slow text-sm sm:text-base lg:text-lg"
                  type="submit"
                  disabled={isLoading}
                  style={{ animationDelay: "0.4s" }}
                >
                  {isLoading ? "INICIANDO SESIÓN..." : "INICIAR SESIÓN"}
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
                  className="hover:scale-110 ease-in-out duration-300 shadow-lg p-2 sm:p-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-pink-500/50 hover:rotate-6 transition-all"
                >
                  <Instagram size={20} className="sm:w-6 sm:h-6" />
                </Link>

                <Link
                  href="https://www.facebook.com/UnivalleBolivia/?locale=es_LA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-110 ease-in-out duration-300 shadow-lg p-2 sm:p-3 rounded-lg bg-blue-600 text-white hover:shadow-blue-500/50 hover:rotate-6 transition-all"
                >
                  <Facebook size={20} className="sm:w-6 sm:h-6" />
                </Link>
                <Link
                  href="https://www.univalle.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-110 ease-in-out duration-300 p-2 sm:p-3 rounded-lg hover:rotate-6 transition-all"
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
                className="text-orange-200 flex text-center flex-col mt-4 sm:mt-6 items-center text-xs sm:text-sm animate-fade-in"
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
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes gradient-text {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }

        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-gradient-text {
          animation: gradient-text 3s linear infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
