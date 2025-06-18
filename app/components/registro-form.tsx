"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MomentoDia } from "../types/registro"
import { agregarRegistroAction, obtenerUltimaInsulinaAction } from "../actions/registros"
import { Plus, Loader2, Calendar, Clock } from "lucide-react"

const momentos: MomentoDia[] = [
  "Ayunas",
  "2h Después desayuno",
  "Antes comida",
  "2h Después comida",
  "Antes cena",
  "2h Después cena",
]

export default function RegistroForm() {
  const [momento, setMomento] = useState<MomentoDia>("Ayunas")
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [ultimaInsulina, setUltimaInsulina] = useState<number>(0)

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

      // Cargar último valor de insulina
      obtenerUltimaInsulinaAction().then(setUltimaInsulina)
    }
  }, [isOpen])

  const handleSubmit = async (formData: FormData) => {
    formData.append("momento", momento)
    formData.append("fecha", fecha)
    formData.append("hora", hora)

    startTransition(async () => {
      const result = await agregarRegistroAction(formData)

      if (result.success) {
        setIsOpen(false)
        // Resetear valores
        setFecha("")
        setHora("")
      } else {
        alert(result.error || "Error al guardar el registro")
      }
    })
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full mb-6 bg-blue-600 hover:bg-blue-700" size="lg">
        <Plus className="w-5 h-5 mr-2" />
        Agregar Nuevo Registro
      </Button>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl text-blue-800">Nuevo Registro de Glucosa</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha" className="flex items-center gap-2">
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
                max={new Date().toISOString().split("T")[0]} // No permitir fechas futuras
              />
            </div>

            <div>
              <Label htmlFor="hora" className="flex items-center gap-2">
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

          {/* Valor de Glucosa y Momento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor">Valor de Glucosa (mg/dL)</Label>
              <Input
                id="valor"
                name="valor"
                type="number"
                placeholder="Ej: 120"
                required
                min="50"
                max="500"
                disabled={isPending}
                className="text-lg font-semibold"
              />
            </div>

            <div>
              <Label htmlFor="momento">Momento del Día</Label>
              <Select value={momento} onValueChange={(value: MomentoDia) => setMomento(value)} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {momentos.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Unidades de Insulina */}
          <div>
            <Label htmlFor="insulina" className="flex items-center justify-between">
              <span>Unidades de Insulina</span>
              {ultimaInsulina > 0 && <span className="text-sm text-gray-500">Último valor: {ultimaInsulina} UI</span>}
            </Label>
            <Input
              id="insulina"
              name="insulina"
              type="number"
              placeholder={ultimaInsulina > 0 ? `Ej: ${ultimaInsulina}` : "Ej: 4"}
              defaultValue={ultimaInsulina > 0 ? ultimaInsulina : ""}
              min="0"
              max="100"
              disabled={isPending}
              className="text-lg"
            />
            {ultimaInsulina > 0 && (
              <p className="text-xs text-gray-500 mt-1">Se sugiere {ultimaInsulina} UI basado en tu último registro</p>
            )}
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Registro:</strong>{" "}
              {fecha && hora
                ? `${new Date(fecha).toLocaleDateString("es-ES")} a las ${hora}`
                : "Selecciona fecha y hora"}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              <strong>Momento:</strong> {momento}
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
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
              className="flex-1"
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
