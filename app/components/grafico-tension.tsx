"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { RegistroTension } from "../types/tension"
import { Heart } from "lucide-react"

interface GraficoTensionProps {
  registros: RegistroTension[]
}

interface DatosDiarios {
  fecha: string
  sistolica: number
  diastolica: number
  pulsaciones: number
}

export default function GraficoTension({ registros }: GraficoTensionProps) {
  const datosDiarios = useMemo(() => {
    if (registros.length === 0) return []

    // Agrupar por fecha
    const porFecha: Record<string, { sis: number[]; dia: number[]; pul: number[] }> = {}

    registros.forEach((r) => {
      if (!porFecha[r.fecha]) {
        porFecha[r.fecha] = { sis: [], dia: [], pul: [] }
      }
      porFecha[r.fecha].sis.push(r.sistolica)
      porFecha[r.fecha].dia.push(r.diastolica)
      porFecha[r.fecha].pul.push(r.pulsaciones)
    })

    // Calcular promedios por día y ordenar por fecha
    const resultado: DatosDiarios[] = Object.entries(porFecha)
      .map(([fecha, valores]) => ({
        fecha,
        sistolica: Math.round(valores.sis.reduce((a, b) => a + b, 0) / valores.sis.length),
        diastolica: Math.round(valores.dia.reduce((a, b) => a + b, 0) / valores.dia.length),
        pulsaciones: Math.round(valores.pul.reduce((a, b) => a + b, 0) / valores.pul.length),
      }))
      .sort((a, b) => {
        // Formato DD/MM/YYYY → ordenar cronológicamente
        const [dA, mA, yA] = a.fecha.split("/").map(Number)
        const [dB, mB, yB] = b.fecha.split("/").map(Number)
        return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime()
      })

    return resultado
  }, [registros])

  if (registros.length === 0) return null

  return (
    <Card className="mt-6 border-red-200">
      <CardHeader>
        <CardTitle className="text-lg text-red-800 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-600" />
          Promedios Diarios de Tensión y Pulso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={datosDiarios} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 11 }}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  sistolica: "Sistólica",
                  diastolica: "Diastólica",
                  pulsaciones: "Pulsaciones",
                }
                const units: Record<string, string> = {
                  sistolica: "mmHg",
                  diastolica: "mmHg",
                  pulsaciones: "BPM",
                }
                return [`${value} ${units[name] || ""}`, labels[name] || name]
              }}
              labelFormatter={(label) => `📅 ${label}`}
            />
            <Legend
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  sistolica: "Sistólica (mmHg)",
                  diastolica: "Diastólica (mmHg)",
                  pulsaciones: "Pulsaciones (BPM)",
                }
                return labels[value] || value
              }}
            />
            <Line
              type="monotone"
              dataKey="sistolica"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={{ fill: "#ef4444", r: 4 }}
              activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2, fill: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="diastolica"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ fill: "#f97316", r: 4 }}
              activeDot={{ r: 6, stroke: "#f97316", strokeWidth: 2, fill: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="pulsaciones"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "#8b5cf6", r: 3 }}
              activeDot={{ r: 5, stroke: "#8b5cf6", strokeWidth: 2, fill: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Leyenda de referencia */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-green-800 font-medium">Normal: &lt;120/80</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 rounded-lg p-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-orange-800 font-medium">Elevada: 130-139/80-89</span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 rounded-lg p-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-red-800 font-medium">Hipertensión: ≥140/90</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
