"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { RegistroTension } from "../types/tension"
import { Clock, Activity, Heart } from "lucide-react"

interface TensionListProps {
  registros: RegistroTension[]
}

export default function TensionList({ registros }: TensionListProps) {
  const getStatusColor = (sis: number, dia: number) => {
    // Clasificación simplificada de la AHA
    if (sis >= 140 || dia >= 90) return "bg-red-100 text-red-800 border-red-200"
    if (sis >= 130 || dia >= 80) return "bg-orange-100 text-orange-800 border-orange-200"
    if (sis < 90 || dia < 60) return "bg-blue-100 text-blue-800 border-blue-200"
    return "bg-green-100 text-green-800 border-green-200"
  }

  const getStatusText = (sis: number, dia: number) => {
    if (sis >= 140 || dia >= 90) return "Hipertensión N2"
    if (sis >= 130 || dia >= 80) return "Hipertensión N1"
    if (sis < 90 || dia < 60) return "Baja"
    return "Normal"
  }

  if (registros.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No hay registros de tensión aún.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Heart className="w-6 h-6 text-red-600" />
        Últimos Registros de Tensión
      </h2>
      {registros.map((registro) => (
        <Card key={registro.id} className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {registro.fecha} - {registro.hora}
                </span>
              </div>
              <Badge className={getStatusColor(registro.sistolica, registro.diastolica)}>
                {getStatusText(registro.sistolica, registro.diastolica)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-bold">Presión</p>
                  <p className="text-xl font-bold text-gray-800">
                    {registro.sistolica}/{registro.diastolica} <span className="text-xs font-normal">mmHg</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-bold">Pulso</p>
                  <p className="text-xl font-bold text-gray-800">
                    {registro.pulsaciones} <span className="text-xs font-normal">BPM</span>
                  </p>
                </div>
              </div>

              <div className="hidden md:block">
                <p className="text-xs text-gray-600 uppercase font-bold">Estado</p>
                <p className="text-sm font-medium">Estable</p>
              </div>
            </div>

            {/* Clasificación rápida de la presión */}
            <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-blue-400" style={{ width: '20%' }} title="Baja" />
              <div className="h-full bg-green-500" style={{ width: '40%' }} title="Normal" />
              <div className="h-full bg-orange-400" style={{ width: '20%' }} title="Elevada" />
              <div className="h-full bg-red-500" style={{ width: '20%' }} title="Alta" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
