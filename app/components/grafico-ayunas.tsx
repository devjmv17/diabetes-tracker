"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { RegistroGlucosa, MomentoDia } from "../types/registro"
import { Activity, Download, ImageIcon } from "lucide-react"

interface GraficoTodosRegistrosProps {
  registros: RegistroGlucosa[]
}

export default function GraficoTodosRegistros({ registros }: GraficoTodosRegistrosProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [exportando, setExportando] = useState(false)

  // Colores para cada momento del día
  const coloresMomentos: Record<MomentoDia, string> = {
    Ayunas: "#ef4444", // Rojo
    "2h Después desayuno": "#f97316", // Naranja
    "Antes comida": "#eab308", // Amarillo
    "2h Después comida": "#22c55e", // Verde
    "Antes cena": "#3b82f6", // Azul
    "2h Después cena": "#8b5cf6", // Púrpura
  }

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

    // Obtener valores min y max
    const valores = registros.map((r) => r.valor)
    const minValor = Math.min(...valores, 70)
    const maxValor = Math.max(...valores, 200)
    const rangoValor = maxValor - minValor

    // Dibujar zonas de referencia
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

    // Líneas horizontales
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

    // Línea especial para 140
    const y140 = padding + height - ((140 - minValor) / rangoValor) * height
    ctx.strokeStyle = "#f97316"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(padding, y140)
    ctx.lineTo(padding + width, y140)
    ctx.stroke()
    ctx.setLineDash([])

    // Agrupar registros por momento
    const registrosPorMomento: Record<MomentoDia, RegistroGlucosa[]> = {
      Ayunas: [],
      "2h Después desayuno": [],
      "Antes comida": [],
      "2h Después comida": [],
      "Antes cena": [],
      "2h Después cena": [],
    }

    registros.forEach((registro) => {
      registrosPorMomento[registro.momento].push(registro)
    })

    // Ordenar cada grupo por timestamp
    Object.keys(registrosPorMomento).forEach((momento) => {
      registrosPorMomento[momento as MomentoDia].sort((a, b) => a.timestamp - b.timestamp)
    })

    // Dibujar líneas para cada momento
    Object.entries(registrosPorMomento).forEach(([momento, registrosMomento]) => {
      if (registrosMomento.length === 0) return

      const color = coloresMomentos[momento as MomentoDia]
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.8

      // Encontrar posiciones X basadas en el timestamp global
      const timestampMin = Math.min(...registros.map((r) => r.timestamp))
      const timestampMax = Math.max(...registros.map((r) => r.timestamp))
      const rangoTimestamp = timestampMax - timestampMin || 1

      if (registrosMomento.length > 1) {
        ctx.beginPath()

        registrosMomento.forEach((registro, index) => {
          const x = padding + ((registro.timestamp - timestampMin) / rangoTimestamp) * width
          const y = padding + height - ((registro.valor - minValor) / rangoValor) * height

          if (index === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })

        ctx.stroke()
      }

      ctx.globalAlpha = 1
    })

    // Dibujar puntos para todos los registros
    const timestampMin = Math.min(...registros.map((r) => r.timestamp))
    const timestampMax = Math.max(...registros.map((r) => r.timestamp))
    const rangoTimestamp = timestampMax - timestampMin || 1

    registros.forEach((registro, index) => {
      const x = padding + ((registro.timestamp - timestampMin) / rangoTimestamp) * width
      const y = padding + height - ((registro.valor - minValor) / rangoValor) * height

      // Color del punto según el momento
      const colorPunto = coloresMomentos[registro.momento]

      // Dibujar punto
      ctx.fillStyle = colorPunto
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, 2 * Math.PI)
      ctx.fill()

      // Borde blanco
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      // Etiqueta de fecha (solo algunas para evitar solapamiento)
      if (registros.length <= 15 || index % Math.ceil(registros.length / 10) === 0) {
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
    ctx.fillText("Tiempo", padding + width / 2, rect.height - 10)
  }, [registros])

  // Función para exportar el gráfico como imagen
  const exportarGrafico = async () => {
    if (!canvasRef.current) return

    try {
      setExportando(true)

      // Obtener la imagen del canvas
      const canvas = canvasRef.current
      const dataUrl = canvas.toDataURL("image/png")

      // Crear un enlace temporal para descargar la imagen
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `grafico-glucosa-${new Date().toISOString().split("T")[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Mostrar mensaje de éxito simple
      alert("Gráfico exportado correctamente")
    } catch (error) {
      console.error("Error al exportar el gráfico:", error)
      alert("Error al exportar la imagen. Inténtalo de nuevo.")
    } finally {
      setExportando(false)
    }
  }

  if (registros.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Tendencia por Momentos del Día
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No hay registros para mostrar el gráfico.</p>
          <p className="text-sm text-gray-400 mt-2">Agrega algunos registros para ver la tendencia.</p>
        </CardContent>
      </Card>
    )
  }

  // Calcular estadísticas
  const valores = registros.map((r) => r.valor)
  const promedio = Math.round(valores.reduce((a, b) => a + b, 0) / valores.length)
  const minimo = Math.min(...valores)
  const maximo = Math.max(...valores)

  // Contar registros por rango
  const registrosBajos = valores.filter((v) => v < 70).length
  const registrosNormales = valores.filter((v) => v >= 70 && v < 140).length
  const registrosAltos = valores.filter((v) => v >= 140).length

  // Contar registros por momento
  const registrosPorMomento: Record<MomentoDia, number> = {
    Ayunas: 0,
    "2h Después desayuno": 0,
    "Antes comida": 0,
    "2h Después comida": 0,
    "Antes cena": 0,
    "2h Después cena": 0,
  }

  registros.forEach((registro) => {
    registrosPorMomento[registro.momento]++
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Tendencia por Momentos del Día
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

          {/* Leyenda de rangos de glucosa */}
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

          {/* Leyenda de momentos del día con colores específicos */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 text-xs">
            {Object.entries(coloresMomentos).map(([momento, color]) => (
              <div key={momento} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: color }}></div>
                <span className="truncate">
                  {momento} ({registrosPorMomento[momento as MomentoDia]})
                </span>
              </div>
            ))}
          </div>

          {/* Estadísticas por rango */}
          <div className="grid grid-cols-3 gap-4 mt-6">
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

          {/* Información adicional */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Gráfico por momentos ({registros.length} registros)</strong> - Cada línea representa un momento
              del día diferente.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              <strong>Interpretación:</strong> Observa los patrones de cada momento. Los picos después de comidas son
              normales, pero valores consistentemente altos pueden requerir ajustes en la medicación o dieta.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={exportarGrafico} disabled={exportando} variant="outline" className="flex items-center gap-2">
          {exportando ? (
            <>
              <ImageIcon className="w-4 h-4 animate-pulse" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Exportar como imagen
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
