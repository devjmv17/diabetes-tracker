"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ResumenGlucosa {
  fecha: string
  glucosaPromedio: number | null
  insulinaTotal: number
}

interface ResumenTension {
  fecha: string
  sistolicaPromedio: number | null
  diastolicaPromedio: number | null
  pulsacionesPromedio: number | null
}

export default function ExportResumenButton() {
  const [loadingGlucosa, setLoadingGlucosa] = useState(false)
  const [loadingTension, setLoadingTension] = useState(false)
  const [datosGlucosa, setDatosGlucosa] = useState<ResumenGlucosa[] | null>(null)
  const [datosTension, setDatosTension] = useState<ResumenTension[] | null>(null)
  const printGlucosaRef = useRef<HTMLDivElement>(null)
  const printTensionRef = useRef<HTMLDivElement>(null)

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

  const handleExportTension = async () => {
    setLoadingTension(true)
    try {
      const response = await fetch("/api/export-tension-json")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al exportar")
      }
      const data: ResumenTension[] = await response.json()
      if (data.length === 0) throw new Error("No hay registros de tensión")
      setDatosTension(data)
      setTimeout(() => window.print(), 100)
      toast.success("Informe de tensión abierto para guardar como PDF")
    } catch (error) {
      console.error("Error al exportar:", error)
      toast.error("Error al exportar el informe de tensión")
    } finally {
      setLoadingTension(false)
    }
  }

  const glucosaTotal = datosGlucosa?.reduce((acc, d) => acc + (d.glucosaPromedio || 0), 0) ?? 0
  const diasConGlucosa = datosGlucosa?.filter(d => d.glucosaPromedio).length ?? 0
  const glucosaMedia = diasConGlucosa > 0 ? Math.round(glucosaTotal / diasConGlucosa) : 0
  const insulinaTotal = datosGlucosa?.reduce((acc, d) => acc + d.insulinaTotal, 0) ?? 0

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleExportGlucosa} variant="secondary" disabled={loadingGlucosa}>
          {loadingGlucosa ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Exportar Glucosa PDF
        </Button>
        <Button onClick={handleExportTension} variant="secondary" disabled={loadingTension}>
          {loadingTension ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Exportar Tensión PDF
        </Button>
      </div>

      {datosGlucosa && (
        <div ref={printGlucosaRef} className="hidden print:block p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Informe de Glucosa</h1>
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
              {datosGlucosa.map((d, i) => (
                <tr key={d.fecha} className={i % 2 === 0 ? "bg-gray-100" : ""}>
                  <td className="border p-2">{d.fecha}</td>
                  <td className="border p-2 text-center">{d.glucosaPromedio ?? "-"}</td>
                  <td className="border p-2 text-center">{d.insulinaTotal > 0 ? d.insulinaTotal : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h2 className="font-bold text-lg mb-2">Resumen General:</h2>
            <p>• Promedio de glucosa: {glucosaMedia} mg/dL</p>
            <p>• Total insulina: {insulinaTotal} UI</p>
            <p>• Días de registro: {datosGlucosa.length}</p>
          </div>
        </div>
      )}

      {datosTension && (
        <div ref={printTensionRef} className="hidden print:block p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Informe de Tensión Arterial</h1>
            <p className="text-gray-600">Fecha de exportación: {new Date().toLocaleDateString("es-ES")}</p>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-red-500 text-white">
                <th className="border p-2 text-left">Fecha</th>
                <th className="border p-2">Sistólica (mmHg)</th>
                <th className="border p-2">Diastólica (mmHg)</th>
                <th className="border p-2">Pulsaciones (BPM)</th>
              </tr>
            </thead>
            <tbody>
              {datosTension.map((d, i) => (
                <tr key={d.fecha} className={i % 2 === 0 ? "bg-gray-100" : ""}>
                  <td className="border p-2">{d.fecha}</td>
                  <td className="border p-2 text-center">{d.sistolicaPromedio ?? "-"}</td>
                  <td className="border p-2 text-center">{d.diastolicaPromedio ?? "-"}</td>
                  <td className="border p-2 text-center">{d.pulsacionesPromedio ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h2 className="font-bold text-lg mb-2">Resumen General:</h2>
            <p>• Días de registro: {datosTension.length}</p>
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
