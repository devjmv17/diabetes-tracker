"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { agregarRegistroTensionAction } from "../actions/tension"
import { Plus, Loader2, Calendar, Clock, Heart, Activity } from "lucide-react"
import { toast } from "sonner"

export default function TensionForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Estados para fecha y hora
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("")

  // Inicializar fecha y hora actuales cuando se abre el formulario
  useEffect(() => {
    if (isOpen) {
      const ahora = new Date()
      const fechaActual = ahora.toISOString().split("T")[0] // YYYY-MM-DD
      const horaActual = ahora.toTimeString().slice(0, 5) // HH:MM

      setFecha(fechaActual)
      setHora(horaActual)
    }
  }, [isOpen])

  const handleSubmit = async (formData: FormData) => {
    formData.append("fecha", fecha)
    formData.append("hora", hora)

    startTransition(async () => {
      const result = await agregarRegistroTensionAction(formData)

      if (result.success) {
        setIsOpen(false)
        // Resetear valores
        setFecha("")
        setHora("")
        toast.success("Registro de tensión guardado correctamente")
      } else {
        toast.error(result.error || "Error al guardar el registro")
      }
    })
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full mb-6 bg-red-600 hover:bg-red-700" size="lg">
        <Plus className="w-5 h-5 mr-2" />
        Nuevo Registro de Tensión
      </Button>
    )
  }

  return (
    <Card className="mb-6 border-red-200">
      <CardHeader>
        <CardTitle className="text-xl text-red-800 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-600" />
          Nuevo Registro de Tensión Arterial
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha" className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4" />
                Fecha del Registro
              </Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                disabled={isPending}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <Label htmlFor="hora" className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4" />
                Hora del Registro
              </Label>
              <Input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>

          {/* Sistólica y Diastólica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sistolica" className="text-gray-700">Tensión Sistólica (Alta)</Label>
              <div className="relative">
                <Input
                  id="sistolica"
                  name="sistolica"
                  type="number"
                  placeholder="Ej: 120"
                  required
                  min="70"
                  max="250"
                  disabled={isPending}
                  className="text-lg font-bold pl-10"
                />
                <Activity className="absolute left-3 top-2.5 w-5 h-5 text-red-400" />
              </div>
            </div>

            <div>
              <Label htmlFor="diastolica" className="text-gray-700">Tensión Diastólica (Baja)</Label>
              <div className="relative">
                <Input
                  id="diastolica"
                  name="diastolica"
                  type="number"
                  placeholder="Ej: 80"
                  required
                  min="40"
                  max="150"
                  disabled={isPending}
                  className="text-lg font-bold pl-10"
                />
                <Activity className="absolute left-3 top-2.5 w-5 h-5 text-red-300" />
              </div>
            </div>
          </div>

          {/* Pulsaciones */}
          <div>
            <Label htmlFor="pulsaciones" className="flex items-center gap-2 text-gray-700">
              <Heart className="w-4 h-4 text-red-500" />
              Pulsaciones (BPM)
            </Label>
            <Input
              id="pulsaciones"
              name="pulsaciones"
              type="number"
              placeholder="Ej: 72"
              required
              min="30"
              max="200"
              disabled={isPending}
              className="text-lg"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isPending || !fecha || !hora}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Registro"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 hover:bg-gray-100"
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
