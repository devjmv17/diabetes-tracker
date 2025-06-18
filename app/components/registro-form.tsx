"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MomentoDia } from "../types/registro"
import { agregarRegistroAction } from "../actions/registros"
import { Plus, Loader2 } from "lucide-react"

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

  const handleSubmit = async (formData: FormData) => {
    formData.append("momento", momento)

    startTransition(async () => {
      const result = await agregarRegistroAction(formData)

      if (result.success) {
        setIsOpen(false)
        // El formulario se limpia automáticamente al ser un form con action
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
              />
            </div>

            <div>
              <Label htmlFor="insulina">Unidades de Insulina</Label>
              <Input
                id="insulina"
                name="insulina"
                type="number"
                placeholder="Ej: 4"
                min="0"
                max="100"
                disabled={isPending}
              />
            </div>
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

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={isPending}>
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
