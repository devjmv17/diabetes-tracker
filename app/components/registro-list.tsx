"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { RegistroGlucosa } from "../types/registro"
import { Clock, Droplets, Syringe } from "lucide-react"

interface RegistroListProps {
  registros: RegistroGlucosa[]
}

export default function RegistroList({ registros }: RegistroListProps) {
  const getColorByValue = (valor: number) => {
    if (valor < 70) return "bg-red-100 text-red-800 border-red-200"
    if (valor > 180) return "bg-orange-100 text-orange-800 border-orange-200"
    return "bg-green-100 text-green-800 border-green-200"
  }

  const getStatusText = (valor: number) => {
    if (valor < 70) return "Bajo"
    if (valor > 180) return "Alto"
    return "Normal"
  }

  if (registros.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Droplets className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No hay registros aún. ¡Agrega tu primer registro!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Últimos Registros</h2>
      {registros.map((registro) => (
        <Card key={registro.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {registro.fecha} - {registro.hora}
                </span>
              </div>
              <Badge className={getColorByValue(registro.valor)}>{getStatusText(registro.valor)}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Glucosa</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {registro.valor} <span className="text-sm font-normal">mg/dL</span>
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Momento</p>
                <p className="font-semibold text-gray-800">{registro.momento}</p>
              </div>

              <div className="flex items-center gap-2">
                <Syringe className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Insulina</p>
                  <p className="font-semibold text-purple-800">{registro.insulina} UI</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
