"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { RegistroGlucosa } from "../types/registro"
import EditarRegistro from "./editar-registro"
import { Clock, Droplets, Syringe, Edit, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface RegistroListProps {
  registros: RegistroGlucosa[]
}

export default function RegistroList({ registros }: RegistroListProps) {
  const [registroEditando, setRegistroEditando] = useState<string | null>(null)

  const getColorByValue = (valor: number) => {
    if (valor < 70) return "bg-red-100 text-red-800 border-red-200"
    if (valor >= 140) return "bg-orange-100 text-orange-800 border-orange-200"
    return "bg-green-100 text-green-800 border-green-200"
  }

  const getStatusText = (valor: number) => {
    if (valor < 70) return "Bajo"
    if (valor >= 140) return "Alto"
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
        <div key={registro.id}>
          {registroEditando === registro.id ? (
            <EditarRegistro registro={registro} onCancelar={() => setRegistroEditando(null)} />
          ) : (
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {registro.fecha} - {registro.hora}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getColorByValue(registro.valor)}>{getStatusText(registro.valor)}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setRegistroEditando(registro.id)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar registro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Glucosa</p>
                      <p
                        className={`text-2xl font-bold ${
                          registro.valor >= 140
                            ? "text-orange-700"
                            : registro.valor < 70
                              ? "text-red-700"
                              : "text-blue-800"
                        }`}
                      >
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

                {/* Indicador visual adicional para valores altos */}
                {registro.valor >= 140 && (
                  <div className="mt-3 p-2 bg-orange-50 border-l-4 border-orange-400 rounded">
                    <p className="text-sm text-orange-700">
                      ⚠️ Valor elevado - Considera consultar con tu médico si persiste
                    </p>
                  </div>
                )}

                {/* Indicador visual para valores bajos */}
                {registro.valor < 70 && (
                  <div className="mt-3 p-2 bg-red-50 border-l-4 border-red-400 rounded">
                    <p className="text-sm text-red-700">🚨 Hipoglucemia - Toma acción inmediata si es necesario</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  )
}
