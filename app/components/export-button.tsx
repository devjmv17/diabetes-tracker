"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function ExportButton() {
  const handleExport = async () => {
    try {
      const response = await fetch("/api/export")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al exportar")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `registros_glucosa_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error al exportar:", error)
      alert("Error al exportar los datos. Por favor, inténtalo de nuevo.")
    }
  }

  return (
    <Button onClick={handleExport} variant="outline" className="w-full md:w-auto">
      <Download className="w-4 h-4 mr-2" />
      Exportar Registros a CSV
    </Button>
  )
}
