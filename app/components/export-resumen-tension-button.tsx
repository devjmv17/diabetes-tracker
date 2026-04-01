"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ResumenTensionDia {
  fecha: string
  sistolicaPromedio: number | null
  diastolicaPromedio: number | null
  pulsacionesPromedio: number | null
}

export default function ExportResumenTensionButton() {
  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState<ResumenTensionDia[] | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/export-resumen-tension")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al exportar")
      }

      const data: ResumenTensionDia[] = await response.json()

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

  const sistolicaTotal = datos?.reduce((acc, d) => acc + (d.sistolicaPromedio || 0), 0) ?? 0
  const diasConSistolica = datos?.filter(d => d.sistolicaPromedio).length ?? 0
  const sistolicaMedia = diasConSistolica > 0 ? Math.round(sistolicaTotal / diasConSistolica) : 0

  const diastolicaTotal = datos?.reduce((acc, d) => acc + (d.diastolicaPromedio || 0), 0) ?? 0
  const diasConDiastolica = datos?.filter(d => d.diastolicaPromedio).length ?? 0
  const diastolicaMedia = diasConDiastolica > 0 ? Math.round(diastolicaTotal / diasConDiastolica) : 0

  const pulsacionesTotal = datos?.reduce((acc, d) => acc + (d.pulsacionesPromedio || 0), 0) ?? 0
  const diasConPulsaciones = datos?.filter(d => d.pulsacionesPromedio).length ?? 0
  const pulsacionesMedia = diasConPulsaciones > 0 ? Math.round(pulsacionesTotal / diasConPulsaciones) : 0

  return (
    <>
      <Button onClick={handleExport} variant="secondary" className="w-full md:w-auto" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
        Exportar Informe Tensión PDF
      </Button>

      {datos && (
        <div ref={printRef} className="hidden print:block p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-red-800">Informe de Seguimiento de Tensión</h1>
            <p className="text-gray-600">Fecha de exportación: {new Date().toLocaleDateString("es-ES")}</p>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-red-500 text-white">
                <th className="border p-2 text-left">Fecha</th>
                <th className="border p-2">Sistólica Prom. (mmHg)</th>
                <th className="border p-2">Diastólica Prom. (mmHg)</th>
                <th className="border p-2">Pulsaciones Prom. (BPM)</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d, i) => (
                <tr key={d.fecha} className={i % 2 === 0 ? "bg-red-50" : ""}>
                  <td className="border p-2">{d.fecha}</td>
                  <td className="border p-2 text-center font-medium">{d.sistolicaPromedio ?? "-"}</td>
                  <td className="border p-2 text-center font-medium">{d.diastolicaPromedio ?? "-"}</td>
                  <td className="border p-2 text-center font-medium">{d.pulsacionesPromedio ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200 shadow-sm">
            <h2 className="font-bold text-lg mb-2 text-red-800">Resumen General:</h2>
            <p className="text-gray-700 font-medium">• Promedio de tensión (Sis/Dia): <span className="text-red-600">{sistolicaMedia}/{diastolicaMedia} mmHg</span></p>
            <p className="text-gray-700 font-medium">• Promedio de pulsaciones: <span className="text-red-600">{pulsacionesMedia} BPM</span></p>
            <p className="text-gray-700 font-medium">• Días de registro: <span className="text-red-600">{datos.length}</span></p>
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
