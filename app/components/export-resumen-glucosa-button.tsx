"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ResumenGlucosaDia {
  fecha: string
  glucosaPromedio: number | null
  insulinaTotal: number
}

export default function ExportResumenGlucosaButton() {
  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState<ResumenGlucosaDia[] | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/export-resumen-glucosa")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al exportar")
      }

      const data: ResumenGlucosaDia[] = await response.json()

      if (data.length === 0) {
        throw new Error("No hay registros para exportar")
      }

      setDatos(data)
      
      setTimeout(() => {
        window.print()
      }, 100)
      
      toast.success("Informe abierto para guardar como PDF")
    } catch (error) {
      console.error("Error al exportar:", error)
      toast.error("Error al exportar el informe. Por favor, inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const glucosaTotal = datos?.reduce((acc, d) => acc + (d.glucosaPromedio || 0), 0) ?? 0
  const diasConGlucosa = datos?.filter(d => d.glucosaPromedio).length ?? 0
  const glucosaMedia = diasConGlucosa > 0 ? Math.round(glucosaTotal / diasConGlucosa) : 0
  const insulinaTotal = datos?.reduce((acc, d) => acc + d.insulinaTotal, 0) ?? 0

  return (
    <>
      <Button onClick={handleExport} variant="secondary" className="w-full md:w-auto" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
        Exportar Informe Glucosa PDF
      </Button>

      {datos && (
        <div ref={printRef} className="hidden print:block p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-blue-800">Informe de Seguimiento de Glucosa</h1>
            <p className="text-gray-600">Fecha de exportación: {new Date().toLocaleDateString("es-ES")}</p>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="border p-2 text-left">Fecha</th>
                <th className="border p-2">Glucosa Prom. (mg/dL)</th>
                <th className="border p-2">Insulina Total (UI)</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d, i) => (
                <tr key={d.fecha} className={i % 2 === 0 ? "bg-blue-50" : ""}>
                  <td className="border p-2">{d.fecha}</td>
                  <td className="border p-2 text-center font-semibold">{d.glucosaPromedio ?? "-"}</td>
                  <td className="border p-2 text-center">{d.insulinaTotal > 0 ? d.insulinaTotal : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200 shadow-sm">
            <h2 className="font-bold text-lg mb-2 text-blue-800">Resumen General:</h2>
            <p className="text-gray-700 font-medium">• Promedio de glucosa: <span className="text-blue-600">{glucosaMedia} mg/dL</span></p>
            <p className="text-gray-700 font-medium">• Total insulina: <span className="text-blue-600">{insulinaTotal} UI</span></p>
            <p className="text-gray-700 font-medium">• Días de registro: <span className="text-blue-600">{datos.length}</span></p>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </>
  )
}
