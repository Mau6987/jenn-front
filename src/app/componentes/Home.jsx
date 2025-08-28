"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Users, Trophy, Calendar, Target, MessageCircle } from "lucide-react"

export default function Page() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Navbar arriba */}

      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#800020] rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gray-400 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-[#800020] rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-20 h-20 bg-gray-400 rounded-full blur-xl"></div>
      </div>

      {/* Main Hero Section */}
      <main className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold text-black leading-tight">
                  SELECCIÓN DE VOLEY
                  <br />
                  <span className="text-[#800020]">UNIVALLE</span>
                </h1>
                <p className="text-xl text-gray-700 mt-6 leading-relaxed">
                  Nuestra selección universitaria se enorgullece de representar a la Universidad del Valle, fomentando
                  la excelencia deportiva y el espíritu competitivo. ¡Únete a nosotros y forma parte de la tradición
                  deportiva universitaria!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-[#800020] hover:bg-[#a64d66] text-white px-8 py-3 text-lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Escríbenos para más info
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white px-8 py-3 text-lg bg-transparent"
                  asChild
                >
                  <Link href="/horarios-entrenamiento">Ver Horarios</Link>
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#800020]">10+</div>
                  <div className="text-gray-600 text-sm">Años representando</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#800020]">80+</div>
                  <div className="text-gray-600 text-sm">Estudiantes seleccionados</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#800020]">25+</div>
                  <div className="text-gray-600 text-sm">Torneos universitarios</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img
                  src="/placeholder.svg?height=600&width=500"
                  alt="Jugadores de volleyball en acción"
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>
              {/* Floating logo */}
              <div className="absolute top-8 right-8 w-24 h-24 bg-[#800020] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">UV</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Quick Access Cards */}
      <section className="relative z-10 px-6 py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border-gray-200 hover:shadow-lg hover:border-[#800020] transition-all duration-300">
              <CardHeader className="text-center">
                <Users className="w-12 h-12 text-[#800020] mx-auto mb-2" />
                <CardTitle className="text-black">Sobre Nosotros</CardTitle>
                <CardDescription className="text-gray-600">Conoce nuestra selección universitaria</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white bg-transparent"
                >
                  <Link href="/sobre-nosotros">Ver más</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg hover:border-[#800020] transition-all duration-300">
              <CardHeader className="text-center">
                <Calendar className="w-12 h-12 text-[#800020] mx-auto mb-2" />
                <CardTitle className="text-black">Horarios</CardTitle>
                <CardDescription className="text-gray-600">Entrenamientos universitarios</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white bg-transparent"
                >
                  <Link href="/horarios-entrenamiento">Ver horarios</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg hover:border-[#800020] transition-all duration-300">
              <CardHeader className="text-center">
                <Target className="w-12 h-12 text-[#800020] mx-auto mb-2" />
                <CardTitle className="text-black">Categorías</CardTitle>
                <CardDescription className="text-gray-600">Equipos masculino y femenino</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white bg-transparent"
                >
                  <Link href="/categorias/varones">Varones</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white bg-transparent"
                >
                  <Link href="/categorias/damas">Damas</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg hover:border-[#800020] transition-all duration-300">
              <CardHeader className="text-center">
                <Trophy className="w-12 h-12 text-[#800020] mx-auto mb-2" />
                <CardTitle className="text-black">Logros</CardTitle>
                <CardDescription className="text-gray-600">Torneos y competencias universitarias</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  variant="outline"
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
