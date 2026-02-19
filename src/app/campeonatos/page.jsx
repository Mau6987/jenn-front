import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Users, Trophy, GraduationCap, Star } from "lucide-react"

export default function CategoriasVaronesPage() {
  const jugadoresUniversitario = [
    {
      nombre: "Carlos Mamani",
      carrera: "Ingeniería Civil",
      año: "4to",
      posicion: "Armador",
      numero: 1,
      foto: "/placeholder.svg?height=120&width=120&text=Carlos",
      destacado: true,
      logros: "Mejor Armador Nacional 2024",
    },
    {
      nombre: "Diego Quispe",
      carrera: "Medicina",
      año: "3ro",
      posicion: "Opuesto",
      numero: 4,
      foto: "/placeholder.svg?height=120&width=120&text=Diego",
    },
    {
      nombre: "Andrés Vargas",
      carrera: "Derecho",
      año: "5to",
      posicion: "Central",
      numero: 7,
      foto: "/placeholder.svg?height=120&width=120&text=Andrés",
    },
    {
      nombre: "Luis Condori",
      carrera: "Arquitectura",
      año: "2do",
      posicion: "Receptor",
      numero: 9,
      foto: "/placeholder.svg?height=120&width=120&text=Luis",
    },
    {
      nombre: "Marco Flores",
      carrera: "Ingeniería Sistemas",
      año: "4to",
      posicion: "Central",
      numero: 11,
      foto: "/placeholder.svg?height=120&width=120&text=Marco",
    },
    {
      nombre: "Javier Torrez",
      carrera: "Economía",
      año: "3ro",
      posicion: "Líbero",
      numero: 15,
      foto: "/placeholder.svg?height=120&width=120&text=Javier",
    },
  ]

  const jugadoresSub18 = [
    {
      nombre: "Sebastián Cruz",
      colegio: "Colegio Bolivar",
      edad: 17,
      posicion: "Armador",
      numero: 2,
      foto: "/placeholder.svg?height=120&width=120&text=Sebastián",
    },
    {
      nombre: "Mateo Rojas",
      colegio: "Colegio San Calixto",
      edad: 18,
      posicion: "Opuesto",
      numero: 5,
      foto: "/placeholder.svg?height=120&width=120&text=Mateo",
    },
    {
      nombre: "Gabriel Mendez",
      colegio: "Colegio La Salle",
      edad: 17,
      posicion: "Central",
      numero: 8,
      foto: "/placeholder.svg?height=120&width=120&text=Gabriel",
    },
    {
      nombre: "Nicolás Paz",
      colegio: "Colegio Don Bosco",
      edad: 16,
      posicion: "Receptor",
      numero: 12,
      foto: "/placeholder.svg?height=120&width=120&text=Nicolás",
    },
    {
      nombre: "Rodrigo Silva",
      colegio: "Colegio Alemán",
      edad: 17,
      posicion: "Líbero",
      numero: 16,
      foto: "/placeholder.svg?height=120&width=120&text=Rodrigo",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-12">
       
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-black mb-4">Selección Varones</h1>
            <p className="text-xl text-gray-600">Equipos masculinos de volleyball Univalle</p>
          </div>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader className="bg-[#800020] text-white">
              <CardTitle className="text-2xl flex items-center">
                <GraduationCap className="w-6 h-6 mr-2" />
                Equipo Universitario Varones
              </CardTitle>
              <CardDescription className="text-gray-100">
                Estudiantes universitarios representando a Univalle
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {jugadoresUniversitario.map((jugador, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-lg border-2 transition-all duration-300 hover:shadow-lg ${
                      jugador.destacado
                        ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400 shadow-lg"
                        : "bg-gray-50 border-gray-200 hover:border-[#800020]"
                    }`}
                  >
                    {jugador.destacado && (
                      <div className="flex items-center justify-center mb-3">
                        <Star className="w-5 h-5 text-yellow-500 mr-1" />
                        <span className="text-sm font-bold text-yellow-700">JUGADOR DESTACADO</span>
                        <Star className="w-5 h-5 text-yellow-500 ml-1" />
                      </div>
                    )}
                    <div className="text-center mb-4">
                      <img
                        src={jugador.foto || "/placeholder.svg"}
                        alt={jugador.nombre}
                        className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 border-white shadow-md"
                      />
                      <div className="flex items-center justify-center mb-2">
                        <h4 className="font-bold text-[#800020] text-lg">{jugador.nombre}</h4>
                        <Badge className="bg-[#800020] text-white ml-2">#{jugador.numero}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>Carrera:</strong> {jugador.carrera}
                      </p>
                      <p>
                        <strong>Año:</strong> {jugador.año}
                      </p>
                      <p>
                        <strong>Posición:</strong> {jugador.posicion}
                      </p>
                      {jugador.logros && (
                        <p className="text-yellow-700 font-medium">
                          <strong>Logro:</strong> {jugador.logros}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center text-gray-600">
                <p>
                  <strong>Entrenador:</strong> Prof. Roberto Silva
                </p>
                <p>
                  <strong>Logros 2024:</strong> Subcampeones Nacionales Universitarios
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader className="bg-gray-700 text-white">
              <CardTitle className="text-2xl flex items-center">
                <Users className="w-6 h-6 mr-2" />
                Equipo Sub-18 Varones
              </CardTitle>
              <CardDescription className="text-gray-100">Jóvenes talentos en formación</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {jugadoresSub18.map((jugador, index) => (
                  <div
                    key={index}
                    className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-400 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="text-center mb-4">
                      <img
                        src={jugador.foto || "/placeholder.svg"}
                        alt={jugador.nombre}
                        className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-4 border-white shadow-md"
                      />
                      <div className="flex items-center justify-center mb-2">
                        <h4 className="font-bold text-[#800020]">{jugador.nombre}</h4>
                        <Badge className="bg-gray-600 text-white ml-2">#{jugador.numero}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>Colegio:</strong> {jugador.colegio}
                      </p>
                      <p>
                        <strong>Edad:</strong> {jugador.edad} años
                      </p>
                      <p>
                        <strong>Posición:</strong> {jugador.posicion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center text-gray-600">
                <p>
                  <strong>Entrenador:</strong> Prof. Carlos Mendoza
                </p>
                <p>
                  <strong>Logros 2024:</strong> Campeones Regionales Sub-18
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
                    <li>• Clasificar al campeonato nacional universitario</li>
                    <li>• Obtener el título nacional</li>
                    <li>• Participar en torneos internacionales</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-[#800020] mb-2">Equipo Sub-18</h4>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Desarrollar nuevos talentos</li>
                    <li>• Preparar jugadores para universitario</li>
                    <li>• Mantener liderazgo regional</li>
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
