"use client"

import { Button } from "@/components/ui/button"
import { FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

export default function ExportResumenButton() {
  const handleExport = async () => {
    try {
      const response = await fetch("/api/export-resumen")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al exportar")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `resumen-diario-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Resumen diario exportado correctamente")
    } catch (error) {
      console.error("Error al exportar resumen:", error)
      toast.error("Error al exportar el resumen. Por favor, inténtalo de nuevo.")
    }
  }

  return (
    <Button onClick={handleExport} variant="secondary" className="w-full md:w-auto">
      <FileSpreadsheet className="w-4 h-4 mr-2" />
      Exportar Resumen Diario CSV
    </Button>
  )
}
