import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Users, Trophy, GraduationCap, Star } from "lucide-react"

export default function CategoriasDamasPage() {
  const jugadorasUniversitario = [
    {
      nombre: "María Ticona",
      carrera: "Psicología",
      año: "3ro",
      posicion: "Armadora",
      numero: 3,
      foto: "/placeholder.svg?height=120&width=120&text=María",
      destacado: true,
      logros: "MVP Campeonato Nacional 2024",
    },
    {
      nombre: "Ana Gutierrez",
      carrera: "Enfermería",
      año: "4to",
      posicion: "Opuesta",
      numero: 6,
      foto: "/placeholder.svg?height=120&width=120&text=Ana",
    },
    {
      nombre: "Carmen Flores",
      carrera: "Comunicación Social",
      año: "2do",
      posicion: "Central",
      numero: 10,
      foto: "/placeholder.svg?height=120&width=120&text=Carmen",
    },
    {
      nombre: "Lucia Mamani",
      carrera: "Administración",
      año: "5to",
      posicion: "Receptora",
      numero: 13,
      foto: "/placeholder.svg?height=120&width=120&text=Lucia",
    },
    {
      nombre: "Sofia Vargas",
      carrera: "Ingeniería Industrial",
      año: "3ro",
      posicion: "Central",
      numero: 14,
      foto: "/placeholder.svg?height=120&width=120&text=Sofia",
    },
    {
      nombre: "Paola Cruz",
      carrera: "Trabajo Social",
      año: "4to",
      posicion: "Líbero",
      numero: 18,
      foto: "/placeholder.svg?height=120&width=120&text=Paola",
    },
  ]

  const jugadorasSub18 = [
    {
      nombre: "Valentina Rojas",
      colegio: "Colegio María Auxiliadora",
      edad: 17,
      posicion: "Armadora",
      numero: 1,
      foto: "/placeholder.svg?height=120&width=120&text=Valentina",
    },
    {
      nombre: "Isabella Mendez",
      colegio: "Colegio San José",
      edad: 18,
      posicion: "Opuesta",
      numero: 4,
      foto: "/placeholder.svg?height=120&width=120&text=Isabella",
    },
    {
      nombre: "Camila Torres",
      colegio: "Colegio Sagrado Corazón",
      edad: 16,
      posicion: "Central",
      numero: 7,
      foto: "/placeholder.svg?height=120&width=120&text=Camila",
    },
    {
      nombre: "Fernanda Silva",
      colegio: "Colegio Francés",
      edad: 17,
      posicion: "Receptora",
      numero: 11,
      foto: "/placeholder.svg?height=120&width=120&text=Fernanda",
    },
    {
      nombre: "Daniela Paz",
      colegio: "Colegio Americano",
      edad: 17,
      posicion: "Líbero",
      numero: 17,
      foto: "/placeholder.svg?height=120&width=120&text=Daniela",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-12">
        

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-black mb-4">Selección Damas</h1>
            <p className="text-xl text-gray-600">Equipos femeninos de volleyball Univalle</p>
          </div>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader className="bg-[#800020] text-white">
              <CardTitle className="text-2xl flex items-center">
                <GraduationCap className="w-6 h-6 mr-2" />
                Equipo Universitario Damas
              </CardTitle>
              <CardDescription className="text-gray-100">
                Estudiantes universitarias representando a Univalle
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {jugadorasUniversitario.map((jugadora, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-lg border-2 transition-all duration-300 hover:shadow-lg ${
                      jugadora.destacado
                        ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400 shadow-lg"
                        : "bg-gray-50 border-gray-200 hover:border-[#800020]"
                    }`}
                  >
                    {jugadora.destacado && (
                      <div className="flex items-center justify-center mb-3">
                        <Star className="w-5 h-5 text-yellow-500 mr-1" />
                        <span className="text-sm font-bold text-yellow-700">JUGADORA DESTACADA</span>
                        <Star className="w-5 h-5 text-yellow-500 ml-1" />
                      </div>
                    )}
                    <div className="text-center mb-4">
                      <img
                        src={jugadora.foto || "/placeholder.svg"}
                        alt={jugadora.nombre}
                        className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 border-white shadow-md"
                      />
                      <div className="flex items-center justify-center mb-2">
                        <h4 className="font-bold text-[#800020] text-lg">{jugadora.nombre}</h4>
                        <Badge className="bg-[#800020] text-white ml-2">#{jugadora.numero}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>Carrera:</strong> {jugadora.carrera}
                      </p>
                      <p>
                        <strong>Año:</strong> {jugadora.año}
                      </p>
                      <p>
                        <strong>Posición:</strong> {jugadora.posicion}
                      </p>
                      {jugadora.logros && (
                        <p className="text-yellow-700 font-medium">
                          <strong>Logro:</strong> {jugadora.logros}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center text-gray-600">
                <p>
                  <strong>Entrenadora:</strong> Prof. María López
                </p>
                <p>
                  <strong>Logros 2024:</strong> Campeonas Nacionales Universitarias
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-700 text-white">
              <CardTitle className="text-2xl flex items-center">
                <Users className="w-6 h-6 mr-2" />
                Equipo Sub-18 Damas
              </CardTitle>
              <CardDescription className="text-gray-100">Jóvenes talentos en formación</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {jugadorasSub18.map((jugadora, index) => (
                  <div
                    key={index}
                    className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-400 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="text-center mb-4">
                      <img
                        src={jugadora.foto || "/placeholder.svg"}
                        alt={jugadora.nombre}
                        className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-4 border-white shadow-md"
                      />
                      <div className="flex items-center justify-center mb-2">
                        <h4 className="font-bold text-[#800020]">{jugadora.nombre}</h4>
                        <Badge className="bg-gray-600 text-white ml-2">#{jugadora.numero}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>Colegio:</strong> {jugadora.colegio}
                      </p>
                      <p>
                        <strong>Edad:</strong> {jugadora.edad} años
                      </p>
                      <p>
                        <strong>Posición:</strong> {jugadora.posicion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center text-gray-600">
                <p>
                  <strong>Entrenadora:</strong> Prof. Ana García
                </p>
                <p>
                  <strong>Logros 2024:</strong> Campeonas Departamentales Sub-18
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-black flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-[#800020]" />
                Objetivos 2025
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-[#800020] mb-2">Equipo Universitario</h4>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Defender el título nacional universitario</li>
                    <li>• Clasificar a competencias internacionales</li>
                    <li>• Mantener el liderazgo nacional</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-[#800020] mb-2">Equipo Sub-18</h4>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Formar nuevas jugadoras</li>
                    <li>• Preparar talentos para universitario</li>
                    <li>• Expandir participación regional</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
