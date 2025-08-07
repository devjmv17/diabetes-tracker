"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RegistroGlucosa, MomentoDia } from "../types/registro"
import { obtenerTodosRegistrosAction } from "../actions/registros"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X, Search, Filter, Calendar, Clock, Droplets, Syringe, ChevronUp, ChevronDown, Loader2, Printer, BarChart3, Eye, EyeOff, Download, ImageIcon } from 'lucide-react'

interface TablaTodosRegistrosProps {
  onCerrar: () => void
}

type OrdenColumna = "fecha" | "valor" | "momento" | "insulina"
type DireccionOrden = "asc" | "desc"

export default function TablaTodosRegistros({ onCerrar }: TablaTodosRegistrosProps) {
  const [registros, setRegistros] = useState<RegistroGlucosa[]>([])
  const [registrosFiltrados, setRegistrosFiltrados] = useState<RegistroGlucosa[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroMomento, setFiltroMomento] = useState<string>("todos")
  const [filtroRango, setFiltroRango] = useState<string>("todos")
  const [ordenColumna, setOrdenColumna] = useState<OrdenColumna>("fecha")
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("desc")

  // Estados para filtros de fecha
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [presetFecha, setPresetFecha] = useState("todos")
  const [mostrarFiltrosFecha, setMostrarFiltrosFecha] = useState(false)

  // Estados para el gráfico
  const [mostrarGrafico, setMostrarGrafico] = useState(false)
  const [exportandoGrafico, setExportandoGrafico] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Estado para controlar qué líneas están visibles en el gráfico
  const [momentosVisibles, setMomentosVisibles] = useState<Record<MomentoDia, boolean>>({
    Ayunas: true,
    "2h Después desayuno": true,
    "Antes comida": true,
    "2h Después comida": true,
    "Antes cena": true,
    "2h Después cena": true,
  })

  // Colores para cada momento del día
  const coloresMomentos: Record<MomentoDia, string> = {
    Ayunas: "#ef4444", // Rojo
    "2h Después desayuno": "#f97316", // Naranja
    "Antes comida": "#eab308", // Amarillo
    "2h Después comida": "#22c55e", // Verde
    "Antes cena": "#3b82f6", // Azul
    "2h Después cena": "#8b5cf6", // Púrpura
  }

  const momentos: MomentoDia[] = [
    "Ayunas",
    "2h Después desayuno",
    "Antes comida",
    "2h Después comida",
    "Antes cena",
    "2h Después cena",
  ]

  useEffect(() => {
    cargarRegistros()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [registros, busqueda, filtroMomento, filtroRango, ordenColumna, direccionOrden, fechaInicio, fechaFin])

  // Efecto para dibujar el gráfico cuando cambian los datos filtrados
  useEffect(() => {
    if (mostrarGrafico) {
      dibujarGrafico()
    }
  }, [registrosFiltrados, momentosVisibles, mostrarGrafico])

  const cargarRegistros = async () => {
    setCargando(true)
    try {
      const datos = await obtenerTodosRegistrosAction()
      setRegistros(datos)
    } catch (error) {
      console.error("Error al cargar registros:", error)
    } finally {
      setCargando(false)
    }
  }

  // Función para aplicar presets de fecha
  const aplicarPresetFecha = (preset: string) => {
    const hoy = new Date()
    const fechaHoy = hoy.toISOString().split("T")[0]

    switch (preset) {
      case "hoy":
        setFechaInicio(fechaHoy)
        setFechaFin(fechaHoy)
        break
      case "ultima_semana":
        const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
        setFechaInicio(hace7Dias.toISOString().split("T")[0])
        setFechaFin(fechaHoy)
        break
      case "ultimo_mes":
        const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
        setFechaInicio(hace30Dias.toISOString().split("T")[0])
        setFechaFin(fechaHoy)
        break
      case "ultimos_3_meses":
        const hace90Dias = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000)
        setFechaInicio(hace90Dias.toISOString().split("T")[0])
        setFechaFin(fechaHoy)
        break
      case "todos":
      default:
        setFechaInicio("")
        setFechaFin("")
        break
    }
    setPresetFecha(preset)
  }

  // Función para convertir fecha DD/MM/YYYY a Date para comparación
  const convertirFechaEspañolaADate = (fechaEspañola: string): Date => {
    const [dia, mes, año] = fechaEspañola.split("/")
    return new Date(Number.parseInt(año), Number.parseInt(mes) - 1, Number.parseInt(dia))
  }

  // Función para filtrar registros por fecha
  const filtrarPorFecha = (registros: RegistroGlucosa[]) => {
    if (!fechaInicio && !fechaFin) return registros

    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : null
    const fechaFinDate = fechaFin ? new Date(fechaFin) : null

    return registros.filter((registro) => {
      // Usar el timestamp directamente (más confiable)
      const fechaRegistroDate = new Date(registro.timestamp)

      // Normalizar fechas a medianoche para comparación justa
      const fechaRegistroNormalizada = new Date(
        fechaRegistroDate.getFullYear(),
        fechaRegistroDate.getMonth(),
        fechaRegistroDate.getDate(),
      )
      const fechaInicioNormalizada = fechaInicioDate
        ? new Date(fechaInicioDate.getFullYear(), fechaInicioDate.getMonth(), fechaInicioDate.getDate())
        : null
      const fechaFinNormalizada = fechaFinDate
        ? new Date(fechaFinDate.getFullYear(), fechaFinDate.getMonth(), fechaFinDate.getDate())
        : null

      // Comparar fechas normalizadas
      if (fechaInicioNormalizada && fechaRegistroNormalizada < fechaInicioNormalizada) return false
      if (fechaFinNormalizada && fechaRegistroNormalizada > fechaFinNormalizada) return false

      return true
    })
  }

  const aplicarFiltros = () => {
    let filtrados = [...registros]

    // Filtro por fecha primero
    filtrados = filtrarPorFecha(filtrados)

    // Filtro por búsqueda (fecha o valor)
    if (busqueda) {
      filtrados = filtrados.filter(
        (registro) => registro.fecha.includes(busqueda) || registro.valor.toString().includes(busqueda),
      )
    }

    // Filtro por momento
    if (filtroMomento !== "todos") {
      filtrados = filtrados.filter((registro) => registro.momento === filtroMomento)
    }

    // Filtro por rango de glucosa
    if (filtroRango !== "todos") {
      filtrados = filtrados.filter((registro) => {
        switch (filtroRango) {
          case "bajo":
            return registro.valor < 70
          case "normal":
            return registro.valor >= 70 && registro.valor < 140
          case "alto":
            return registro.valor >= 140
          default:
            return true
        }
      })
    }

    // Ordenamiento
    filtrados.sort((a, b) => {
      let valorA: any, valorB: any

      switch (ordenColumna) {
        case "fecha":
          valorA = a.timestamp
          valorB = b.timestamp
          break
        case "valor":
          valorA = a.valor
          valorB = b.valor
          break
        case "momento":
          valorA = a.momento
          valorB = b.momento
          break
        case "insulina":
          valorA = a.insulina
          valorB = b.insulina
          break
        default:
          valorA = a.timestamp
          valorB = b.timestamp
      }

      if (direccionOrden === "asc") {
        return valorA > valorB ? 1 : -1
      } else {
        return valorA < valorB ? 1 : -1
      }
    })

    setRegistrosFiltrados(filtrados)
  }

  // Función para dibujar el gráfico
  const dibujarGrafico = () => {
    if (!canvasRef.current || registrosFiltrados.length === 0) return

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
    const valores = registrosFiltrados.map((r) => r.valor)
    const minValor = Math.min(...valores, 70)
    const maxValor = Math.max(...valores, 200)
    const rangoValor = maxValor - minValor

    // Dibujar zonas de referencia
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

    registrosFiltrados.forEach((registro) => {
      registrosPorMomento[registro.momento].push(registro)
    })

    // Ordenar cada grupo por timestamp
    Object.keys(registrosPorMomento).forEach((momento) => {
      registrosPorMomento[momento as MomentoDia].sort((a, b) => a.timestamp - b.timestamp)
    })

    // Calcular rango de tiempo
    const timestampMin = Math.min(...registrosFiltrados.map((r) => r.timestamp))
    const timestampMax = Math.max(...registrosFiltrados.map((r) => r.timestamp))
    const rangoTimestamp = timestampMax - timestampMin || 1

    // Dibujar líneas para cada momento (solo los visibles)
    Object.entries(registrosPorMomento).forEach(([momento, registrosMomento]) => {
      if (registrosMomento.length === 0 || !momentosVisibles[momento as MomentoDia]) return

      const color = coloresMomentos[momento as MomentoDia]
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.8

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

    // Dibujar puntos para todos los registros filtrados (solo los visibles)
    registrosFiltrados
      .filter((registro) => momentosVisibles[registro.momento])
      .forEach((registro, index) => {
        const x = padding + ((registro.timestamp - timestampMin) / rangoTimestamp) * width
        const y = padding + height - ((registro.valor - minValor) / rangoValor) * height

        // Color del punto según el momento
        const colorPunto = coloresMomentos[registro.momento]

        // Dibujar punto
        ctx.fillStyle = colorPunto
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()

        // Borde blanco
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.stroke()
      })

    // Etiquetas de fecha en el eje X
    const registrosVisibles = registrosFiltrados.filter((registro) => momentosVisibles[registro.momento])
    if (registrosVisibles.length > 0) {
      const paso = Math.max(1, Math.ceil(registrosVisibles.length / 8))
      registrosVisibles.forEach((registro, index) => {
        if (index % paso === 0) {
          const x = padding + ((registro.timestamp - timestampMin) / rangoTimestamp) * width
          ctx.fillStyle = "#6b7280"
          ctx.textAlign = "center"
          ctx.font = "10px system-ui"
          const fechaCorta = registro.fecha.split("/").slice(0, 2).join("/") // DD/MM
          ctx.fillText(fechaCorta, x, padding + height + 20)
        }
      })
    }

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
  }

  // Función para alternar visibilidad de un momento
  const toggleMomento = (momento: MomentoDia) => {
    setMomentosVisibles((prev) => ({
      ...prev,
      [momento]: !prev[momento],
    }))
  }

  // Función para mostrar/ocultar todos
  const toggleTodos = (mostrar: boolean) => {
    const nuevoEstado: Record<MomentoDia, boolean> = {
      Ayunas: mostrar,
      "2h Después desayuno": mostrar,
      "Antes comida": mostrar,
      "2h Después comida": mostrar,
      "Antes cena": mostrar,
      "2h Después cena": mostrar,
    }
    setMomentosVisibles(nuevoEstado)
  }

  // Función para exportar el gráfico como imagen
  const exportarGrafico = async () => {
    if (!canvasRef.current) return

    try {
      setExportandoGrafico(true)

      // Obtener la imagen del canvas
      const canvas = canvasRef.current
      const dataUrl = canvas.toDataURL("image/png")

      // Crear un enlace temporal para descargar la imagen
      const link = document.createElement("a")
      link.href = dataUrl
      const fechaSufijo = fechaInicio && fechaFin ? `_${fechaInicio}_${fechaFin}` : ""
      link.download = `grafico-registros-filtrados${fechaSufijo}_${new Date().toISOString().split("T")[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      alert("Gráfico exportado correctamente")
    } catch (error) {
      console.error("Error al exportar el gráfico:", error)
      alert("Error al exportar la imagen. Inténtalo de nuevo.")
    } finally {
      setExportandoGrafico(false)
    }
  }

  const cambiarOrden = (columna: OrdenColumna) => {
    if (ordenColumna === columna) {
      setDireccionOrden(direccionOrden === "asc" ? "desc" : "asc")
    } else {
      setOrdenColumna(columna)
      setDireccionOrden("desc")
    }
  }

  const limpiarTodosFiltros = () => {
    setBusqueda("")
    setFiltroMomento("todos")
    setFiltroRango("todos")
    setFechaInicio("")
    setFechaFin("")
    setPresetFecha("todos")
  }

  // Función para imprimir registros (actualizada para incluir gráfico)
  const imprimirRegistros = () => {
    // Calcular estadísticas
    const promedio =
      registrosFiltrados.length > 0
        ? Math.round(registrosFiltrados.reduce((sum, r) => sum + r.valor, 0) / registrosFiltrados.length)
        : 0
    const minimo = registrosFiltrados.length > 0 ? Math.min(...registrosFiltrados.map((r) => r.valor)) : 0
    const maximo = registrosFiltrados.length > 0 ? Math.max(...registrosFiltrados.map((r) => r.valor)) : 0
    const insulinaTotal = registrosFiltrados.reduce((sum, r) => sum + r.insulina, 0)

    // Contar por rangos
    const registrosBajos = registrosFiltrados.filter((r) => r.valor < 70).length
    const registrosNormales = registrosFiltrados.filter((r) => r.valor >= 70 && r.valor < 140).length
    const registrosAltos = registrosFiltrados.filter((r) => r.valor >= 140).length

    // Información del período
    const periodoTexto =
      fechaInicio && fechaFin
        ? `${fechaInicio} hasta ${fechaFin}`
        : fechaInicio
          ? `Desde ${fechaInicio}`
          : fechaFin
            ? `Hasta ${fechaFin}`
            : "Todos los registros"

    // Obtener imagen del gráfico si está visible
    let imagenGrafico = ""
    if (mostrarGrafico && canvasRef.current && registrosFiltrados.length > 0) {
      try {
        imagenGrafico = canvasRef.current.toDataURL("image/png")
      } catch (error) {
        console.warn("No se pudo obtener la imagen del gráfico:", error)
      }
    }

    // ⭐ AQUÍ ES DONDE SE GENERA EL HTML PARA IMPRESIÓN ⭐
    const contenidoImpresion = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Registros de Glucosa - ${new Date().toLocaleDateString("es-ES")}</title>
        <style>
          /* 🎨 ESTILOS CSS PARA IMPRESIÓN */
          @media print {
            @page {
              margin: 1cm;
              size: A4;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              background: white;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-before: always;
            }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #000;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
          }
          
          .header p {
            margin: 5px 0;
            color: #666;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            background: #f9f9f9;
          }
          
          .stat-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
          }
          
          .stat-card .value {
            font-size: 20px;
            font-weight: bold;
            color: #333;
          }
          
          .ranges-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          
          .range-card {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          
          .range-card.bajo {
            background: #fef2f2;
            border-color: #fecaca;
          }
          
          .range-card.normal {
            background: #f0fdf4;
            border-color: #bbf7d0;
          }
          
          .range-card.alto {
            background: #fff7ed;
            border-color: #fed7aa;
          }
          
          .range-card h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
          }
          
          .range-card .count {
            font-size: 18px;
            font-weight: bold;
          }
          
          .range-card .percentage {
            font-size: 12px;
            color: #666;
          }

          .grafico-section {
            margin: 30px 0;
            text-align: center;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            background: #f9f9f9;
          }

          .grafico-section h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 18px;
          }

          .grafico-imagen {
            max-width: 100%;
            height: auto;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin: 15px 0;
          }

          .momentos-leyenda {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin: 15px 0;
            text-align: left;
          }

          .momento-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
          }

          .momento-color {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 1px solid #fff;
            box-shadow: 0 0 2px rgba(0,0,0,0.3);
          }

          .rangos-leyenda {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 15px 0;
            font-size: 12px;
          }

          .rango-item {
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .rango-color {
            width: 12px;
            height: 12px;
            border-radius: 50%;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 11px;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          
          th {
            background: #f5f5f5;
            font-weight: bold;
            text-align: center;
          }
          
          .valor-bajo {
            color: #dc2626;
            font-weight: bold;
          }
          
          .valor-normal {
            color: #059669;
            font-weight: bold;
          }
          
          .valor-alto {
            color: #ea580c;
            font-weight: bold;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          
          .periodo-info {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          
          .periodo-info h3 {
            margin: 0 0 5px 0;
            color: #0369a1;
            font-size: 16px;
          }
          
          .periodo-info p {
            margin: 0;
            font-size: 13px;
          }

          .grafico-info {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 11px;
            color: #0369a1;
          }
        </style>
      </head>
      <body>
        <!-- 📋 CONTENIDO HTML PARA IMPRESIÓN -->
        <div class="header">
          <h1>📊 Registros de Glucosa</h1>
          <p>Reporte generado el ${new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
          <p>Hora: ${new Date().toLocaleTimeString("es-ES")}</p>
        </div>

        <div class="periodo-info">
          <h3>📅 Período del Reporte</h3>
          <p><strong>${periodoTexto}</strong> - Total de registros: <strong>${registrosFiltrados.length}</strong> ${hayFiltrosActivos ? `(datos filtrados)` : ""}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <h3>Promedio General</h3>
            <div class="value">${promedio} mg/dL</div>
          </div>
          <div class="stat-card">
            <h3>Valor Mínimo</h3>
            <div class="value">${minimo} mg/dL</div>
          </div>
          <div class="stat-card">
            <h3>Valor Máximo</h3>
            <div class="value">${maximo} mg/dL</div>
          </div>
        </div>

        <div class="ranges-summary">
          <div class="range-card bajo">
            <h4>🔴 Valores Bajos</h4>
            <div class="count">${registrosBajos}</div>
            <div class="percentage">${registrosFiltrados.length > 0 ? Math.round((registrosBajos / registrosFiltrados.length) * 100) : 0}% del total</div>
            <div style="font-size: 10px; margin-top: 5px;">&lt; 70 mg/dL</div>
          </div>
          <div class="range-card normal">
            <h4>🟢 Valores Normales</h4>
            <div class="count">${registrosNormales}</div>
            <div class="percentage">${registrosFiltrados.length > 0 ? Math.round((registrosNormales / registrosFiltrados.length) * 100) : 0}% del total</div>
            <div style="font-size: 10px; margin-top: 5px;">70-139 mg/dL</div>
          </div>
          <div class="range-card alto">
            <h4>🟠 Valores Altos</h4>
            <div class="count">${registrosAltos}</div>
            <div class="percentage">${registrosFiltrados.length > 0 ? Math.round((registrosAltos / registrosFiltrados.length) * 100) : 0}% del total</div>
            <div style="font-size: 10px; margin-top: 5px;">≥ 140 mg/dL</div>
          </div>
        </div>

        ${
          imagenGrafico
            ? `
        <div class="grafico-section">
          <h3>📈 Gráfico de Tendencias por Momentos del Día</h3>
          <img src="${imagenGrafico}" alt="Gráfico de tendencias de glucosa" class="grafico-imagen" />
          
          <!-- 🎨 LEYENDA VISUAL (sin el cuadro de "Momentos visibles") -->
          <div class="momentos-leyenda">
            ${Object.entries(coloresMomentos)
              .filter(([momento, _]) => momentosVisibles[momento as MomentoDia])
              .map(
                ([momento, color]) => `
              <div class="momento-item">
                <div class="momento-color" style="background-color: ${color};"></div>
                <span>${momento}</span>
              </div>
            `,
              )
              .join("")}
          </div>

          <!-- 📊 LEYENDA DE RANGOS -->
          <div class="rangos-leyenda">
            <div class="rango-item">
              <div class="rango-color" style="background-color: #ef4444;"></div>
              <span>Bajo (&lt;70)</span>
            </div>
            <div class="rango-item">
              <div class="rango-color" style="background-color: #22c55e;"></div>
              <span>Normal (70-139)</span>
            </div>
            <div class="rango-item">
              <div class="rango-color" style="background-color: #f97316;"></div>
              <span>Alto (≥140)</span>
            </div>
          </div>

          <!-- 📝 NOTA EXPLICATIVA -->
          <div class="grafico-info">
            <strong>Nota:</strong> El gráfico muestra la evolución temporal de los valores de glucosa por momento del día. 
            Las zonas de color indican los rangos de referencia médicos.
          </div>
        </div>
        `
            : ""
        }

        <!-- 📋 TABLA DE REGISTROS -->
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Glucosa (mg/dL)</th>
              <th>Momento del Día</th>
              <th>Insulina (UI)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${registrosFiltrados
              .map((registro) => {
                const claseValor =
                  registro.valor < 70 ? "valor-bajo" : registro.valor >= 140 ? "valor-alto" : "valor-normal"
                const estado = registro.valor < 70 ? "Bajo" : registro.valor >= 140 ? "Alto" : "Normal"

                return `
                <tr>
                  <td>${registro.fecha}</td>
                  <td>${registro.hora}</td>
                  <td class="${claseValor}">${registro.valor}</td>
                  <td>${registro.momento}</td>
                  <td>${registro.insulina}</td>
                  <td>${estado}</td>
                </tr>
              `
              })
              .join("")}
          </tbody>
        </table>

        <!-- 📄 PIE DE PÁGINA -->
        <div class="footer">
          <p><strong>Control de Glucosa</strong> - Reporte médico personal</p>
          <p>Este documento contiene información médica confidencial</p>
          <p>Generado automáticamente el ${new Date().toLocaleString("es-ES")}</p>
         <!-- ${imagenGrafico ? `<p>Incluye gráfico de tendencias con $///{momentosVisiblesCount} momentos visibles</p>` : ""} -->
        </div>
      </body>
    </html>
  `

    // 🖨️ CREAR Y ABRIR VENTANA DE IMPRESIÓN
    const ventanaImpresion = window.open("", "_blank")
    if (ventanaImpresion) {
      ventanaImpresion.document.write(contenidoImpresion)
      ventanaImpresion.document.close()

      // Esperar a que se cargue y luego imprimir
      ventanaImpresion.onload = () => {
        ventanaImpresion.focus()
        ventanaImpresion.print()
      }
    } else {
      alert("No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador.")
    }
  }

  const getColorByValue = (valor: number) => {
    if (valor < 70) return "bg-red-100 text-red-800 border-red-200"
    if (valor >= 140) return "bg-orange-100 text-orange-800 border-orange-200"
    return "bg-green-100 text-green-800 border-green-200"
  }

  const getStatusText = (valor: number) => {
    if (valor < 70) return "Bajo"
    if (valor >= 140) return "Alto"
    return "Normal"
  }

  const IconoOrden = ({ columna }: { columna: OrdenColumna }) => {
    if (ordenColumna !== columna) return null
    return direccionOrden === "asc" ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    )
  }

  // Verificar si hay filtros activos
  const hayFiltrosFecha = fechaInicio || fechaFin
  const hayFiltrosOtros = busqueda || filtroMomento !== "todos" || filtroRango !== "todos"
  const hayFiltrosActivos = hayFiltrosFecha || hayFiltrosOtros

  // Contar cuántos momentos están visibles
  const momentosVisiblesCount = Object.values(momentosVisibles).filter(Boolean).length

  if (cargando) {
    return (
      <Card className="fixed inset-4 z-50 overflow-hidden">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Cargando todos los registros...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="fixed inset-4 z-50 overflow-hidden flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-row flex-1">
            <Table className="w-5 h-5 text-blue-600" />
            Todos los Registros ({registrosFiltrados.length} de {registros.length})
            {hayFiltrosActivos && (
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Filtrado</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setMostrarGrafico(!mostrarGrafico)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {mostrarGrafico ? "Ocultar gráfico" : "Mostrar gráfico"}
            </Button>
            {registrosFiltrados.length > 0 && (
              <Button
                onClick={imprimirRegistros} // ⭐ AQUÍ SE LLAMA LA FUNCIÓN
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onCerrar}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>

        {/* Filtros principales */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar por fecha o valor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filtroMomento} onValueChange={setFiltroMomento}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por momento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los momentos</SelectItem>
              {momentos.map((momento) => (
                <SelectItem key={momento} value={momento}>
                  {momento}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroRango} onValueChange={setFiltroRango}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los rangos</SelectItem>
              <SelectItem value="bajo">Bajo (&lt;70)</SelectItem>
              <SelectItem value="normal">Normal (70-139)</SelectItem>
              <SelectItem value="alto">Alto (≥140)</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setMostrarFiltrosFecha(!mostrarFiltrosFecha)}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {mostrarFiltrosFecha ? "Ocultar fechas" : "Filtrar fechas"}
          </Button>

          <Button variant="outline" onClick={limpiarTodosFiltros} className="flex items-center gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Limpiar todo
          </Button>
        </div>

        {/* Filtros de fecha */}
        {mostrarFiltrosFecha && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Filtrar por Período
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setMostrarFiltrosFecha(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Presets rápidos */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              <Button
                variant={presetFecha === "todos" ? "default" : "outline"}
                size="sm"
                onClick={() => aplicarPresetFecha("todos")}
                className="text-xs"
              >
                Todos
              </Button>
              <Button
                variant={presetFecha === "hoy" ? "default" : "outline"}
                size="sm"
                onClick={() => aplicarPresetFecha("hoy")}
                className="text-xs"
              >
                Hoy
              </Button>
              <Button
                variant={presetFecha === "ultima_semana" ? "default" : "outline"}
                size="sm"
                onClick={() => aplicarPresetFecha("ultima_semana")}
                className="text-xs"
              >
                7 días
              </Button>
              <Button
                variant={presetFecha === "ultimo_mes" ? "default" : "outline"}
                size="sm"
                onClick={() => aplicarPresetFecha("ultimo_mes")}
                className="text-xs"
              >
                30 días
              </Button>
              <Button
                variant={presetFecha === "ultimos_3_meses" ? "default" : "outline"}
                size="sm"
