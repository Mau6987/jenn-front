import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import Link from "next/link"
import { ArrowLeft, Users, Target, Heart } from "lucide-react"

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-12">
        

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-black mb-4">Sobre Nosotros</h1>
            <p className="text-xl text-gray-600">Selección de Voley Univalle</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader className="text-center">
                <Users className="w-12 h-12 text-red-900 mx-auto mb-2" />
                <CardTitle className="text-black">Nuestra Historia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Fundados en 2008, hemos formado generaciones de atletas comprometidos con la excelencia deportiva.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader className="text-center">
                <Target className="w-12 h-12 text-red-900 mx-auto mb-2" />
                <CardTitle className="text-black">Nuestra Misión</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Desarrollar el talento deportivo y formar personas íntegras a través del volleyball.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader className="text-center">
                <Heart className="w-12 h-12 text-red-900 mx-auto mb-2" />
                <CardTitle className="text-black">Nuestros Valores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Trabajo en equipo, disciplina, respeto y pasión por el deporte.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
