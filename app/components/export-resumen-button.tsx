"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ResumenGlucosa {
  fecha: string
  glucosaPromedio: number | null
  insulinaTotal: number
  registros: { hora: string; momento: string; valor: number; insulina: number }[]
}

export default function ExportResumenButton() {
  const [loadingGlucosa, setLoadingGlucosa] = useState(false)
  const [datosGlucosa, setDatosGlucosa] = useState<ResumenGlucosa[] | null>(null)
  const printGlucosaRef = useRef<HTMLDivElement>(null)

  const handleExportGlucosa = async () => {
    setLoadingGlucosa(true)
    try {
      const response = await fetch("/api/export-glucosa-json")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al exportar")
      }
      const data: ResumenGlucosa[] = await response.json()
      if (data.length === 0) throw new Error("No hay registros de glucosa")
      setDatosGlucosa(data)
      setTimeout(() => window.print(), 100)
      toast.success("Informe de glucosa abierto para guardar como PDF")
    } catch (error) {
      console.error("Error al exportar:", error)
      toast.error("Error al exportar el informe de glucosa")
    } finally {
      setLoadingGlucosa(false)
    }
  }

  const glucosaTotal = datosGlucosa?.reduce((acc, d) => acc + (d.glucosaPromedio || 0), 0) ?? 0
  const diasConGlucosa = datosGlucosa?.filter(d => d.glucosaPromedio).length ?? 0
  const glucosaMedia = diasConGlucosa > 0 ? Math.round(glucosaTotal / diasConGlucosa) : 0
  const insulinaTotal = datosGlucosa?.reduce((acc, d) => acc + d.insulinaTotal, 0) ?? 0

  return (
    <>
      <Button onClick={handleExportGlucosa} variant="secondary" disabled={loadingGlucosa}>
        {loadingGlucosa ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
        Exportar Glucosa PDF
      </Button>

      {datosGlucosa && (
        <div ref={printGlucosaRef} className="hidden print:block p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Informe de Glucosa</h1>
            <p className="text-gray-600">Fecha de exportación: {new Date().toLocaleDateString("es-ES")}</p>
          </div>
          
          {datosGlucosa.map((d, i) => (
            <div key={d.fecha} className="mb-6 break-inside-avoid">
              <div className="bg-gray-200 p-2 font-bold text-center">
                {d.fecha} - Promedio: {d.glucosaPromedio ?? "-"} mg/dL - Insulina: {d.insulinaTotal > 0 ? `${d.insulinaTotal} UI` : "-"}
              </div>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border p-1 text-left">Hora</th>
                    <th className="border p-1">Momento</th>
                    <th className="border p-1">Glucosa (mg/dL)</th>
                    <th className="border p-1">Insulina (UI)</th>
                  </tr>
                </thead>
                <tbody>
                  {d.registros.map((r, j) => (
                    <tr key={j} className={j % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="border p-1">{r.hora}</td>
                      <td className="border p-1">{r.momento}</td>
                      <td className="border p-1 text-center">{r.valor}</td>
                      <td className="border p-1 text-center">{r.insulina > 0 ? r.insulina : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h2 className="font-bold text-lg mb-2">Resumen General:</h2>
            <p>• Promedio de glucosa: {glucosaMedia} mg/dL</p>
            <p>• Total insulina: {insulinaTotal} UI</p>
            <p>• Días de registro: {datosGlucosa.length}</p>
            <p>• Total de mediciones: {datosGlucosa.reduce((acc, d) => acc + d.registros.length, 0)}</p>
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
