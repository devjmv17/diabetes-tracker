"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import TablaTodosRegistros from "./tabla-todos-registros"
import { Table } from "lucide-react"

export default function BotonTablaRegistros() {
  const [mostrarTabla, setMostrarTabla] = useState(false)

  return (
    <>
      <Button onClick={() => setMostrarTabla(true)} variant="outline" className="w-full md:w-auto">
        <Table className="w-4 h-4 mr-2" />
        Ver Todos los Registros
      </Button>

      {mostrarTabla && <TablaTodosRegistros onCerrar={() => setMostrarTabla(false)} />}
    </>
  )
}
