"use client"

import { Calendar, Clock, MapPin } from "lucide-react"

export default function Horarios() {
  const horarios = [
    {
      id: 1,
      titulo: "Entrenamiento Técnico",
      fecha: "2024-01-15",
      hora: "16:00 - 18:00",
      lugar: "Gimnasio Principal",
      tipo: "entrenamiento",
    },
    {
      id: 2,
      titulo: "Partido vs Universidad Nacional",
      fecha: "2024-01-18",
      hora: "19:00 - 21:00",
      lugar: "Coliseo Deportivo",
      tipo: "partido",
    },
    {
      id: 3,
      titulo: "Entrenamiento Físico",
      fecha: "2024-01-20",
      hora: "15:00 - 17:00",
      lugar: "Gimnasio de Pesas",
      tipo: "entrenamiento",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#800020]">Horarios</h1>
        <p className="text-gray-600">Consulta los entrenamientos y partidos programados</p>
      </div>

      <div className="grid gap-4">
        {horarios.map((evento) => (
          <div key={evento.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#800020]">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div
                  className={`rounded-full w-12 h-12 flex items-center justify-center ${
                    evento.tipo === "partido" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#800020]">{evento.titulo}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {evento.fecha}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {evento.hora}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {evento.lugar}
                    </div>
                  </div>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  evento.tipo === "partido" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                }`}
              >
                {evento.tipo.charAt(0).toUpperCase() + evento.tipo.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
