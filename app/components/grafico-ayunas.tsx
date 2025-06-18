"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RegistroGlucosa } from "../types/registro"
import { Activity } from "lucide-react"

interface GraficoTodosRegistrosProps {
  registros: RegistroGlucosa[]
}

export default function GraficoTodosRegistros({ registros }: GraficoTodosRegistrosProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || registros.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar el canvas
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Dimensiones del gráfico
    const padding = 60
    const width = rect.width - padding * 2
    const height = rect.height - padding * 2

    // Limpiar canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Configurar estilos
    ctx.font = "12px system-ui"
    ctx.textAlign = "center"

    // Obtener valores min y max (ajustados para diabéticos)
    const valores = registros.map((r) => r.valor)
    const minValor = Math.min(...valores, 70) // Mínimo 70 para mostrar rango bajo
    const maxValor = Math.max(...valores, 200) // Máximo 200 para mostrar rango alto
    const rangoValor = maxValor - minValor

    // Dibujar zonas de referencia (rangos para diabéticos)
    const zonaAlta = ((200 - minValor) / rangoValor) * height // >140 es alto
    const zonaNormal = ((140 - minValor) / rangoValor) * height // 70-140 es normal
    const zonaBaja = ((70 - minValor) / rangoValor) * height // <70 es bajo

    // Zona muy alta (>200) - rojo intenso
    if (maxValor > 200) {
      ctx.fillStyle = "rgba(220, 38, 38, 0.15)"
      ctx.fillRect(padding, padding, width, ((maxValor - 200) / rangoValor) * height)
    }

    // Zona alta (140-200) - naranja
    ctx.fillStyle = "rgba(249, 115, 22, 0.1)"
    ctx.fillRect(
      padding,
      padding + ((maxValor - 200) / rangoValor) * height,
      width,
      ((200 - 140) / rangoValor) * height,
    )

    // Zona normal (70-140) - verde
    ctx.fillStyle = "rgba(34, 197, 94, 0.1)"
    ctx.fillRect(padding, padding + ((maxValor - 140) / rangoValor) * height, width, ((140 - 70) / rangoValor) * height)

    // Zona baja (<70) - rojo
    ctx.fillStyle = "rgba(239, 68, 68, 0.1)"
    ctx.fillRect(
      padding,
      padding + ((maxValor - 70) / rangoValor) * height,
      width,
      ((70 - minValor) / rangoValor) * height,
    )

    // Dibujar líneas de referencia
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    // Líneas horizontales (valores actualizados para diabéticos)
    const lineasValor = [70, 100, 140, 180, 200]
    lineasValor.forEach((valor) => {
      if (valor >= minValor && valor <= maxValor) {
        const y = padding + height - ((valor - minValor) / rangoValor) * height
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(padding + width, y)
        ctx.stroke()

        // Etiquetas de valor
        ctx.fillStyle = "#6b7280"
        ctx.textAlign = "right"
        ctx.fillText(`${valor}`, padding - 10, y + 4)
      }
    })

    // Línea especial para 140 (límite alto para diabéticos)
    const y140 = padding + height - ((140 - minValor) / rangoValor) * height
    ctx.strokeStyle = "#f97316"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(padding, y140)
    ctx.lineTo(padding + width, y140)
    ctx.stroke()
    ctx.setLineDash([]) // Reset dash

    // Dibujar línea de tendencia
    if (registros.length > 1) {
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 3
      ctx.beginPath()

      registros.forEach((registro, index) => {
        const x = padding + (index / (registros.length - 1)) * width
        const y = padding + height - ((registro.valor - minValor) / rangoValor) * height

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    }

    // Dibujar puntos de datos
    registros.forEach((registro, index) => {
      const x = padding + (index / Math.max(registros.length - 1, 1)) * width
      const y = padding + height - ((registro.valor - minValor) / rangoValor) * height

      // Color del punto según el momento del día y valor
      let colorPunto = "#34d399" // Verde por defecto (normal: 70-140)
      if (registro.valor < 70) colorPunto = "#ef4444" // Rojo (bajo: <70)
      if (registro.valor >= 140) colorPunto = "#f97316" // Naranja (alto: ≥140)
      if (registro.valor >= 200) colorPunto = "#dc2626" // Rojo intenso (muy alto: ≥200)

      // Agregar variación por momento del día
      const momentoColors: Record<string, string> = {
        Ayunas: colorPunto,
        "2h Después desayuno": colorPunto === "#34d399" ? "#10b981" : colorPunto,
        "Antes comida": colorPunto === "#34d399" ? "#059669" : colorPunto,
        "2h Después comida": colorPunto === "#34d399" ? "#047857" : colorPunto,
        "Antes cena": colorPunto === "#34d399" ? "#065f46" : colorPunto,
        "2h Después cena": colorPunto === "#34d399" ? "#064e3b" : colorPunto,
      }

      colorPunto = momentoColors[registro.momento] || colorPunto

      // Dibujar punto
      ctx.fillStyle = colorPunto
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.fill()

      // Borde blanco
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      // Etiqueta de fecha (solo algunas para evitar solapamiento)
      if (registros.length <= 10 || index % Math.ceil(registros.length / 8) === 0) {
        ctx.fillStyle = "#6b7280"
        ctx.textAlign = "center"
        ctx.font = "10px system-ui"
        const fechaCorta = registro.fecha.split("/").slice(0, 2).join("/") // DD/MM
        ctx.fillText(fechaCorta, x, padding + height + 20)
      }
    })

    // Título del eje Y
    ctx.save()
    ctx.translate(20, padding + height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = "#374151"
    ctx.font = "14px system-ui"
    ctx.textAlign = "center"
    ctx.fillText("Glucosa (mg/dL)", 0, 0)
    ctx.restore()

    // Título del eje X
    ctx.fillStyle = "#374151"
    ctx.font = "14px system-ui"
    ctx.textAlign = "center"
    ctx.fillText("Fecha", padding + width / 2, rect.height - 10)
  }, [registros])

  if (registros.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Tendencia de Todos los Registros de Glucosa
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No hay registros para mostrar el gráfico.</p>
          <p className="text-sm text-gray-400 mt-2">Agrega algunos registros para ver la tendencia.</p>
        </CardContent>
      </Card>
    )
  }

  // Calcular estadísticas con rangos actualizados
  const valores = registros.map((r) => r.valor)
  const promedio = Math.round(valores.reduce((a, b) => a + b, 0) / valores.length)
  const minimo = Math.min(...valores)
  const maximo = Math.max(...valores)

  // Contar registros por rango
  const registrosBajos = valores.filter((v) => v < 70).length
  const registrosNormales = valores.filter((v) => v >= 70 && v < 140).length
  const registrosAltos = valores.filter((v) => v >= 140).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Tendencia de Todos los Registros de Glucosa
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-500">Promedio</p>
              <p
                className={`font-bold ${promedio >= 140 ? "text-orange-600" : promedio < 70 ? "text-red-600" : "text-green-600"}`}
              >
                {promedio} mg/dL
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Rango</p>
              <p className="font-bold text-gray-700">
                {minimo}-{maximo}
              </p>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-80 border rounded-lg"
            style={{ width: "100%", height: "320px" }}
          />

          {/* Leyenda actualizada */}
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Bajo (&lt;70)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Normal (70-139)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Alto (≥140)</span>
            </div>
          </div>

          {/* Leyenda de momentos del día */}
          <div className="flex justify-center gap-2 mt-2 text-xs flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span>Ayunas</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>2h Desp. desayuno</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Antes comida</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-300 rounded-full"></div>
              <span>2h Desp. comida</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-200 rounded-full"></div>
              <span>Antes cena</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-100 rounded-full"></div>
              <span>2h Desp. cena</span>
            </div>
          </div>

          {/* Estadísticas por rango */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Registros Bajos</p>
              <p className="text-2xl font-bold text-red-700">{registrosBajos}</p>
              <p className="text-xs text-red-500">{Math.round((registrosBajos / valores.length) * 100)}%</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Registros Normales</p>
              <p className="text-2xl font-bold text-green-700">{registrosNormales}</p>
              <p className="text-xs text-green-500">{Math.round((registrosNormales / valores.length) * 100)}%</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Registros Altos</p>
              <p className="text-2xl font-bold text-orange-700">{registrosAltos}</p>
              <p className="text-xs text-orange-500">{Math.round((registrosAltos / valores.length) * 100)}%</p>
            </div>
          </div>

          {/* Información adicional actualizada */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Todos los registros ({registros.length})</strong> ordenados por fecha.
              {registros.length >= 50 && " Mostrando los últimos 50 registros."}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              <strong>Rangos para diabéticos:</strong> Bajo (&lt;70), Normal (70-139), Alto (≥140 mg/dL). Incluye todos
              los momentos del día para una vista completa.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
