"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import TablaTodosRegistrosTension from "./tabla-todos-registros-tension"
import { Table } from "lucide-react"

interface BotonTablaRegistrosTensionProps {
  totalRegistros: number
}

export default function BotonTablaRegistrosTension({ totalRegistros }: BotonTablaRegistrosTensionProps) {
  const [mostrarTabla, setMostrarTabla] = useState(false)

  if (totalRegistros <= 5) return null

  return (
    <>
      <Button onClick={() => setMostrarTabla(true)} variant="outline" className="w-full md:w-auto">
        <Table className="w-4 h-4 mr-2" />
        Ver Todos los Registros
      </Button>

      {mostrarTabla && <TablaTodosRegistrosTension onCerrar={() => setMostrarTabla(false)} />}
    </>
  )
}
