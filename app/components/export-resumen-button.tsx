"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ResumenDia {
  fecha: string
  glucosaPromedio: number | null
  insulinaTotal: number
  sistolicaPromedio: number | null
  diastolicaPromedio: number | null
  pulsacionesPromedio: number | null
}

export default function ExportResumenButton() {
  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState<ResumenDia[] | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/export-resumen-json")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al exportar")
      }

      const data: ResumenDia[] = await response.json()

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
        Exportar Informe PDF
      </Button>

      {datos && (
        <div ref={printRef} className="hidden print:block p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Informe de Seguimiento Diabetes</h1>
            <p className="text-gray-600">Fecha de exportación: {new Date().toLocaleDateString("es-ES")}</p>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="border p-2 text-left">Fecha</th>
                <th className="border p-2">Glucosa Prom. (mg/dL)</th>
                <th className="border p-2">Insulina Total (UI)</th>
                <th className="border p-2">Sistólica (mmHg)</th>
                <th className="border p-2">Diastólica (mmHg)</th>
                <th className="border p-2">Pulsaciones (BPM)</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d, i) => (
                <tr key={d.fecha} className={i % 2 === 0 ? "bg-gray-100" : ""}>
                  <td className="border p-2">{d.fecha}</td>
                  <td className="border p-2 text-center">{d.glucosaPromedio ?? "-"}</td>
                  <td className="border p-2 text-center">{d.insulinaTotal > 0 ? d.insulinaTotal : "-"}</td>
                  <td className="border p-2 text-center">{d.sistolicaPromedio ?? "-"}</td>
                  <td className="border p-2 text-center">{d.diastolicaPromedio ?? "-"}</td>
                  <td className="border p-2 text-center">{d.pulsacionesPromedio ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h2 className="font-bold text-lg mb-2">Resumen General:</h2>
            <p>• Promedio de glucosa: {glucosaMedia} mg/dL</p>
            <p>• Total insulina: {insulinaTotal} UI</p>
            <p>• Días de registro: {datos.length}</p>
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
