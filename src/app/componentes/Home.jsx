"use client"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination, Autoplay } from "swiper/modules"

import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import Link from "next/link"
import { Trophy, Calendar } from "lucide-react"

export default function Page() {
  const images = ["/F2.jpeg", "/F1.jpeg"]

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#800020] rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gray-400 rounded-full blur-2xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-[#800020] rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-40 right-10 w-20 h-20 bg-gray-400 rounded-full blur-xl animate-float" />
      </div>

      <main className="relative z-10 px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 animate-fade-in-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-black leading-tight animate-slide-up text-balance">
                SELECCIÓN DE VOLEY
                <br />
                <span className="text-[#800020]">UNIVALLE</span>
              </h1>
              <p
                className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed animate-fade-in text-pretty"
                style={{ animationDelay: "0.2s" }}
              >
                Nuestra selección universitaria se enorgullece de representar a la Universidad del Valle, fomentando la
                excelencia deportiva y el espíritu competitivo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg bg-transparent font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  asChild
                >
                  <Link href="/horarios-entrenamiento">Ver Horarios</Link>
                </Button>
              </div>
            </div>

            <div className="relative animate-fade-in-right">
              <div className="w-full max-w-2xl mx-auto lg:max-w-none">
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  spaceBetween={20}
                  slidesPerView={1}
                  loop
                  autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                  }}
                  pagination={{ clickable: true }}
                  navigation
                  className="rounded-2xl shadow-2xl overflow-hidden"
                  style={{ maxHeight: "500px" }}
                >
                  {images.map((src, idx) => (
                    <SwiperSlide key={idx}>
                      <div className="relative overflow-hidden group aspect-video sm:aspect-[4/3]">
                        <img
                          src={src || "/placeholder.svg"}
                          alt={`Vóley acción ${idx + 1}`}
                          className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#800020]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="relative z-10 px-4 sm:px-6 py-8 sm:py-12 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            <Card className="bg-white border-gray-200 hover:shadow-xl hover:border-[#800020] transition-all duration-500 hover:-translate-y-2 animate-fade-in-up group">
              <CardHeader className="pb-3 pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-[#800020] to-[#a64d66] rounded-xl group-hover:scale-110 transition-transform duration-300 group-hover:rotate-6">
                    <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-black">Horarios</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Entrenamientos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white bg-transparent transition-all duration-300 hover:scale-105 font-medium"
                >
                  <Link href="/horarios-entrenamiento">Ver horarios</Link>
                </Button>
              </CardContent>
            </Card>

            <Card
              className="bg-white border-gray-200 hover:shadow-xl hover:border-[#800020] transition-all duration-500 hover:-translate-y-2 animate-fade-in-up group"
              style={{ animationDelay: "0.1s" }}
            >
              <CardHeader className="pb-3 pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-[#800020] to-[#a64d66] rounded-xl group-hover:scale-110 transition-transform duration-300 group-hover:rotate-6">
                    <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-black">Logros</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Competencias</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white bg-transparent transition-all duration-300 hover:scale-105 font-medium"
                >
                  <Link href="/campeonatos">Ver logros</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

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

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
          animation-delay: 1s;
        }

        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
          animation-delay: 2s;
        }

        .animate-fade-in-left {
          animation: fade-in-left 1s ease-out forwards;
        }

        .animate-fade-in-right {
          animation: fade-in-right 1s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
          opacity: 0;
        }

        /* Estilos responsivos para el carousel de Swiper */
        .swiper-button-next,
        .swiper-button-prev {
          color: #800020 !important;
          background: white;
          width: 40px !important;
          height: 40px !important;
          border-radius: 50%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 18px !important;
        }

        .swiper-pagination-bullet {
          background: #800020 !important;
          opacity: 0.5;
        }

        .swiper-pagination-bullet-active {
          opacity: 1 !important;
        }

        @media (max-width: 640px) {
          .swiper-button-next,
          .swiper-button-prev {
            width: 32px !important;
            height: 32px !important;
          }

          .swiper-button-next:after,
          .swiper-button-prev:after {
            font-size: 14px !important;
          }
        }
      `}</style>
    </div>
  )
}
