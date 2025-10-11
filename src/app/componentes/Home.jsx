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
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#800020] rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gray-400 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-[#800020] rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-20 h-20 bg-gray-400 rounded-full blur-xl" />
      </div>

      {/* Main Hero Section */}
      <main className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Texto e información */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-black leading-tight">
                SELECCIÓN DE VOLEY
                <br />
                <span className="text-[#800020]">UNIVALLE</span>
              </h1>
              <p className="text-xl text-gray-700 mt-6 leading-relaxed">
                Nuestra selección universitaria se enorgullece de representar a la Universidad del Valle, fomentando la
                excelencia deportiva y el espíritu competitivo. ¡Únete a nosotros y forma parte de la tradición
                deportiva universitaria!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white px-8 py-3 text-lg bg-transparent"
                  asChild
                >
                  <Link href="/horarios-entrenamiento">Ver Horarios</Link>
                </Button>
              </div>

             
            </div>

            {/* Carousel Section */}
            <div className="relative">
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
                className="rounded-lg shadow-2xl"
              >
                {images.map((src, idx) => (
                  <SwiperSlide key={idx}>
                    <img
                      src={src || "/placeholder.svg"}
                      alt={`Vóley acción ${idx + 1}`}
                      className="w-full h-auto rounded-lg"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Floating logo */}
              <div className="absolute top-8 right-8 w-24 h-24 bg-[#800020] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">UV</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="relative z-10 px-6 py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Card className="bg-white border-gray-200 hover:shadow-md hover:border-[#800020] transition-all duration-300">
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-[#800020]" />
                  <div>
                    <CardTitle className="text-lg text-black">Horarios</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Entrenamientos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white bg-transparent"
                >
                  <Link href="/horarios-entrenamiento">Ver horarios</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-md hover:border-[#800020] transition-all duration-300">
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-[#800020]" />
                  <div>
                    <CardTitle className="text-lg text-black">Logros</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Competencias</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white bg-transparent"
                >
                  <Link href="/campeonatos">Ver logros</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
