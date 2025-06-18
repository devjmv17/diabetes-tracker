"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RegistroGlucosa, MomentoDia } from "../types/registro"
import { editarRegistroAction, eliminarRegistroAction } from "../actions/registros"
import { Loader2, Calendar, Clock, Save, Trash2, X } from "lucide-react"

const momentos: MomentoDia[] = [
  "Ayunas",
  "2h Después desayuno",
  "Antes comida",
  "2h Después comida",
  "Antes cena",
  "2h Después cena",
]

interface EditarRegistroProps {
  registro: RegistroGlucosa
  onCancelar: () => void
}

export default function EditarRegistro({ registro, onCancelar }: EditarRegistroProps) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados del formulario
  const [valor, setValor] = useState(registro.valor.toString())
  const [momento, setMomento] = useState<MomentoDia>(registro.momento)
  const [insulina, setInsulina] = useState(registro.insulina.toString())
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("")

  // Inicializar fecha y hora desde el registro
  useEffect(() => {
    // Convertir fecha española a formato ISO (YYYY-MM-DD)
    const [dia, mes, año] = registro.fecha.split("/")
    const fechaISO = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
    setFecha(fechaISO)
    setHora(registro.hora)
  }, [registro])

  const handleSubmit = async (formData: FormData) => {
    formData.append("id", registro.id)
    formData.append("momento", momento)
    formData.append("fecha", fecha)
    formData.append("hora", hora)

    startTransition(async () => {
      const result = await editarRegistroAction(formData)

      if (result.success) {
        onCancelar() // Cerrar el formulario de edición
      } else {
        alert(result.error || "Error al actualizar el registro")
      }
    })
  }

  const handleEliminar = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer.")) {
      return
    }

    setIsDeleting(true)
    startTransition(async () => {
      const result = await eliminarRegistroAction(registro.id)

      if (result.success) {
        onCancelar() // Cerrar el formulario
      } else {
        alert(result.error || "Error al eliminar el registro")
        setIsDeleting(false)
      }
    })
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-xl text-orange-800 flex items-center justify-between">
          Editar Registro
          <Button variant="ghost" size="sm" onClick={onCancelar} disabled={isPending || isDeleting}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha-edit" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha del Registro
              </Label>
              <Input
                id="fecha-edit"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                disabled={isPending || isDeleting}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <Label htmlFor="hora-edit" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hora del Registro
              </Label>
              <Input
                id="hora-edit"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
                disabled={isPending || isDeleting}
              />
            </div>
          </div>

          {/* Valor de Glucosa y Momento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor-edit">Valor de Glucosa (mg/dL)</Label>
              <Input
                id="valor-edit"
                name="valor"
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                min="50"
                max="500"
                disabled={isPending || isDeleting}
                className="text-lg font-semibold"
              />
            </div>

            <div>
              <Label htmlFor="momento-edit">Momento del Día</Label>
              <Select
                value={momento}
                onValueChange={(value: MomentoDia) => setMomento(value)}
                disabled={isPending || isDeleting}
              >
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
            <Label htmlFor="insulina-edit">Unidades de Insulina</Label>
            <Input
              id="insulina-edit"
              name="insulina"
              type="number"
              value={insulina}
              onChange={(e) => setInsulina(e.target.value)}
              min="0"
              max="100"
              disabled={isPending || isDeleting}
              className="text-lg"
            />
          </div>

          {/* Vista previa */}
          <div className="bg-orange-100 p-3 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Editando registro:</strong>{" "}
              {fecha && hora
                ? `${new Date(fecha).toLocaleDateString("es-ES")} a las ${hora}`
                : "Selecciona fecha y hora"}
            </p>
            <p className="text-sm text-orange-600 mt-1">
              <strong>Momento:</strong> {momento} | <strong>Valor:</strong> {valor} mg/dL | <strong>Insulina:</strong>{" "}
              {insulina} UI
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isPending || isDeleting || !fecha || !hora}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleEliminar}
              disabled={isPending || isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onCancelar}
              disabled={isPending || isDeleting}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
