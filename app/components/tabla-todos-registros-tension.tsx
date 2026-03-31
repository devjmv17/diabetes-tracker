"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RegistroTension } from "../types/tension"
import { obtenerTodosRegistrosTensionAction } from "../actions/tension"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  X,
  Search,
  Filter,
  Calendar,
  Clock,
  Activity,
  Heart,
  ChevronUp,
  ChevronDown,
  Loader2,
  Printer,
  BarChart3,
  Eye,
  EyeOff,
  Download,
  ImageIcon,
} from "lucide-react"

interface TablaTodosRegistrosTensionProps {
  onCerrar: () => void
}

type OrdenColumna = "fecha" | "sistolica" | "diastolica" | "pulsaciones"
type DireccionOrden = "asc" | "desc"

type RangoTension = "todos" | "bajo" | "normal" | "elevada" | "alta1" | "alta2"

export default function TablaTodosRegistrosTension({ onCerrar }: TablaTodosRegistrosTensionProps) {
  const [registros, setRegistros] = useState<RegistroTension[]>([])
  const [registrosFiltrados, setRegistrosFiltrados] = useState<RegistroTension[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroRango, setFiltroRango] = useState<RangoTension>("todos")
  const [ordenColumna, setOrdenColumna] = useState<OrdenColumna>("fecha")
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("desc")

  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [presetFecha, setPresetFecha] = useState("todos")
  const [mostrarFiltrosFecha, setMostrarFiltrosFecha] = useState(false)

  const [mostrarGrafico, setMostrarGrafico] = useState(false)
  const [exportandoGrafico, setExportandoGrafico] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    cargarRegistros()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [registros, busqueda, filtroRango, ordenColumna, direccionOrden, fechaInicio, fechaFin])

  useEffect(() => {
    if (mostrarGrafico) {
      dibujarGrafico()
    }
  }, [registrosFiltrados, mostrarGrafico])

  const cargarRegistros = async () => {
    setCargando(true)
    try {
      const datos = await obtenerTodosRegistrosTensionAction()
      setRegistros(datos)
    } catch (error) {
      console.error("Error al cargar registros:", error)
    } finally {
      setCargando(false)
    }
  }

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

  const filtrarPorFecha = (registros: RegistroTension[]) => {
    if (!fechaInicio && !fechaFin) return registros

    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : null
    const fechaFinDate = fechaFin ? new Date(fechaFin) : null

    return registros.filter((registro) => {
      const fechaRegistroDate = new Date(registro.timestamp)

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

      if (fechaInicioNormalizada && fechaRegistroNormalizada < fechaInicioNormalizada) return false
      if (fechaFinNormalizada && fechaRegistroNormalizada > fechaFinNormalizada) return false

      return true
    })
  }

  const getClasificacion = (sis: number, dia: number): string => {
    if (sis >= 140 || dia >= 90) return "alta2"
    if (sis >= 130 || dia >= 80) return "alta1"
    if (sis >= 120 && dia < 80) return "elevada"
    if (sis < 90 || dia < 60) return "bajo"
    return "normal"
  }

  const aplicarFiltros = () => {
    let filtrados = [...registros]

    filtrados = filtrarPorFecha(filtrados)

    if (busqueda) {
      filtrados = filtrados.filter(
        (registro) =>
          registro.fecha.includes(busqueda) ||
          registro.sistolica.toString().includes(busqueda) ||
          registro.diastolica.toString().includes(busqueda),
      )
    }

    if (filtroRango !== "todos") {
      filtrados = filtrados.filter((registro) => {
        const clasificacion = getClasificacion(registro.sistolica, registro.diastolica)
        return clasificacion === filtroRango
      })
    }

    filtrados.sort((a, b) => {
      let valorA: number, valorB: number

      switch (ordenColumna) {
        case "fecha":
          valorA = a.timestamp
          valorB = b.timestamp
          break
        case "sistolica":
          valorA = a.sistolica
          valorB = b.sistolica
          break
        case "diastolica":
          valorA = a.diastolica
          valorB = b.diastolica
          break
        case "pulsaciones":
          valorA = a.pulsaciones
          valorB = b.pulsaciones
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

  const dibujarGrafico = () => {
    if (!canvasRef.current || registrosFiltrados.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const padding = 60
    const width = rect.width - padding * 2
    const height = rect.height - padding * 2

    ctx.clearRect(0, 0, rect.width, rect.height)

    ctx.font = "12px system-ui"
    ctx.textAlign = "center"

    const valoresSistolica = registrosFiltrados.map((r) => r.sistolica)
    const valoresDiastolica = registrosFiltrados.map((r) => r.diastolica)
    const minSistolica = Math.min(...valoresSistolica, 90)
    const maxSistolica = Math.max(...valoresSistolica, 180)
    const minDiastolica = Math.min(...valoresDiastolica, 50)
    const maxDiastolica = Math.max(...valoresDiastolica, 120)

    const minValor = Math.min(minSistolica, minDiastolica)
    const maxValor = Math.max(maxSistolica, maxDiastolica)
    const rangoValor = maxValor - minValor

    ctx.fillStyle = "rgba(239, 68, 68, 0.1)"
    ctx.fillRect(padding, padding + ((maxValor - 180) / rangoValor) * height, width, ((180 - 140) / rangoValor) * height)

    ctx.fillStyle = "rgba(249, 115, 22, 0.1)"
    ctx.fillRect(padding, padding + ((maxValor - 140) / rangoValor) * height, width, ((140 - 130) / rangoValor) * height)

    ctx.fillStyle = "rgba(234, 179, 8, 0.1)"
    ctx.fillRect(padding, padding + ((maxValor - 130) / rangoValor) * height, width, ((130 - 120) / rangoValor) * height)

    ctx.fillStyle = "rgba(34, 197, 94, 0.1)"
    ctx.fillRect(padding, padding + ((maxValor - 120) / rangoValor) * height, width, ((120 - 90) / rangoValor) * height)

    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    const lineasValor = [60, 90, 120, 130, 140, 180]
    lineasValor.forEach((valor) => {
      if (valor >= minValor && valor <= maxValor) {
        const y = padding + height - ((valor - minValor) / rangoValor) * height
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(padding + width, y)
        ctx.stroke()

        ctx.fillStyle = "#6b7280"
        ctx.textAlign = "right"
        ctx.fillText(`${valor}`, padding - 10, y + 4)
      }
    })

    const timestampMin = Math.min(...registrosFiltrados.map((r) => r.timestamp))
    const timestampMax = Math.max(...registrosFiltrados.map((r) => r.timestamp))
    const rangoTimestamp = timestampMax - timestampMin || 1

    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    registrosFiltrados.forEach((registro, index) => {
      const x = padding + ((registro.timestamp - timestampMin) / rangoTimestamp) * width
      const y = padding + height - ((registro.sistolica - minValor) / rangoValor) * height
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    ctx.strokeStyle = "#3b82f6"
    ctx.beginPath()
    registrosFiltrados.forEach((registro, index) => {
      const x = padding + ((registro.timestamp - timestampMin) / rangoTimestamp) * width
      const y = padding + height - ((registro.diastolica - minValor) / rangoValor) * height
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    ctx.globalAlpha = 1

    registrosFiltrados.forEach((registro) => {
      const x = padding + ((registro.timestamp - timestampMin) / rangoTimestamp) * width
      
      const ySis = padding + height - ((registro.sistolica - minValor) / rangoValor) * height
      ctx.fillStyle = "#ef4444"
      ctx.beginPath()
      ctx.arc(x, ySis, 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      const yDia = padding + height - ((registro.diastolica - minValor) / rangoValor) * height
      ctx.fillStyle = "#3b82f6"
      ctx.beginPath()
      ctx.arc(x, yDia, 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    })

    const registrosVisibles = registrosFiltrados
    if (registrosVisibles.length > 0) {
      const paso = Math.max(1, Math.ceil(registrosVisibles.length / 8))
      registrosVisibles.forEach((registro, index) => {
        if (index % paso === 0) {
          const x = padding + ((registro.timestamp - timestampMin) / rangoTimestamp) * width
          ctx.fillStyle = "#6b7280"
          ctx.textAlign = "center"
          ctx.font = "10px system-ui"
          const fechaCorta = registro.fecha.split("/").slice(0, 2).join("/")
          ctx.fillText(fechaCorta, x, padding + height + 20)
        }
      })
    }

    ctx.save()
    ctx.translate(20, padding + height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = "#374151"
    ctx.font = "14px system-ui"
    ctx.textAlign = "center"
    ctx.fillText("Presión (mmHg)", 0, 0)
    ctx.restore()

    ctx.fillStyle = "#374151"
    ctx.font = "14px system-ui"
    ctx.textAlign = "center"
    ctx.fillText("Tiempo", padding + width / 2, rect.height - 10)
  }

  const exportarGrafico = async () => {
    if (!canvasRef.current) return

    try {
      setExportandoGrafico(true)

      const canvas = canvasRef.current
      const dataUrl = canvas.toDataURL("image/png")

      const link = document.createElement("a")
      link.href = dataUrl
      const fechaSufijo = fechaInicio && fechaFin ? `_${fechaInicio}_${fechaFin}` : ""
      link.download = `grafico-tension${fechaSufijo}_${new Date().toISOString().split("T")[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Gráfico exportado correctamente")
    } catch (error) {
      console.error("Error al exportar el gráfico:", error)
      toast.error("Error al exportar la imagen. Inténtalo de nuevo.")
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
    setFiltroRango("todos")
    setFechaInicio("")
    setFechaFin("")
    setPresetFecha("todos")
  }

  const getStatusColor = (sis: number, dia: number) => {
    if (sis >= 140 || dia >= 90) return "bg-red-100 text-red-800 border-red-200"
    if (sis >= 130 || dia >= 80) return "bg-orange-100 text-orange-800 border-orange-200"
    if (sis < 90 || dia < 60) return "bg-blue-100 text-blue-800 border-blue-200"
    return "bg-green-100 text-green-800 border-green-200"
  }

  const getStatusText = (sis: number, dia: number) => {
    if (sis >= 140 || dia >= 90) return "Hipertensión N2"
    if (sis >= 130 || dia >= 80) return "Hipertensión N1"
    if (sis < 90 || dia < 60) return "Baja"
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

  const hayFiltrosFecha = fechaInicio || fechaFin
  const hayFiltrosOtros = busqueda || filtroRango !== "todos"
  const hayFiltrosActivos = hayFiltrosFecha || hayFiltrosOtros

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
            <Table className="w-5 h-5 text-red-600" />
            Todos los Registros de Tensión ({registrosFiltrados.length} de {registros.length})
            {hayFiltrosActivos && (
              <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full">Filtrado</span>
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
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onCerrar}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar por fecha o valor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filtroRango} onValueChange={(v) => setFiltroRango(v as RangoTension)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los rangos</SelectItem>
              <SelectItem value="bajo">Baja (&lt;90/60)</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="elevada">Elevada</SelectItem>
              <SelectItem value="alta1">Hipertensión N1</SelectItem>
              <SelectItem value="alta2">Hipertensión N2</SelectItem>
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
                onClick={() => aplicarPresetFecha("ultimos_3_meses")}
                className="text-xs"
              >
                3 meses
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fecha-inicio-tension" className="text-xs">
                  Fecha inicio
                </Label>
                <Input
                  id="fecha-inicio-tension"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value)
                    setPresetFecha("personalizado")
                  }}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="fecha-fin-tension" className="text-xs">
                  Fecha fin
                </Label>
                <Input
                  id="fecha-fin-tension"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value)
                    setPresetFecha("personalizado")
                  }}
                  className="text-sm"
                />
              </div>
            </div>

            {hayFiltrosFecha && (
              <div className="mt-3 p-2 bg-red-50 border-l-4 border-red-400 rounded text-sm">
                <p className="text-red-800">
                  <strong>Período seleccionado:</strong> {fechaInicio || "Sin límite"} hasta {fechaFin || "Sin límite"}
                </p>
                <p className="text-red-600 text-xs mt-1">
                  Registros encontrados: <strong>{registrosFiltrados.length}</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {mostrarGrafico && registrosFiltrados.length > 0 && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-red-600" />
                    Gráfico de Tensión Arterial
                  </div>
                  <Button
                    onClick={exportarGrafico}
                    disabled={exportandoGrafico}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-transparent"
                  >
                    {exportandoGrafico ? (
                      <>
                        <ImageIcon className="w-4 h-4 animate-pulse" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Exportar
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-6 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Sistólica</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Diastólica</span>
                  </div>
                </div>

                <canvas
                  ref={canvasRef}
                  className="w-full h-80 border rounded-lg"
                  style={{ width: "100%", height: "320px" }}
                />

                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full opacity-60"></div>
                    <span>≥140/90 (N2)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-full opacity-60"></div>
                    <span>≥130/80 (N1)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full opacity-60"></div>
                    <span>Normal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => cambiarOrden("fecha")}>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Fecha y Hora
                    <IconoOrden columna="fecha" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => cambiarOrden("sistolica")}>
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Sistólica
                    <IconoOrden columna="sistolica" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => cambiarOrden("diastolica")}>
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Diastólica
                    <IconoOrden columna="diastolica" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => cambiarOrden("pulsaciones")}>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
                    Pulso
                    <IconoOrden columna="pulsaciones" />
                  </div>
                </TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-gray-500">
                      <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No se encontraron registros con los filtros aplicados</p>
                      <p className="text-sm mt-1">Intenta ajustar los criterios de búsqueda</p>
                      {hayFiltrosActivos && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={limpiarTodosFiltros}
                          className="mt-3 bg-transparent"
                        >
                          Limpiar todos los filtros
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                registrosFiltrados.map((registro) => (
                  <TableRow key={registro.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{registro.fecha}</p>
                        <p className="text-sm text-gray-500">{registro.hora}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-lg font-bold">{registro.sistolica}</span>
                        <span className="text-xs text-gray-500">mmHg</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-lg font-bold">{registro.diastolica}</span>
                        <span className="text-xs text-gray-500">mmHg</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-lg font-bold">{registro.pulsaciones}</span>
                        <span className="text-xs text-gray-500">BPM</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(registro.sistolica, registro.diastolica)}>
                        {getStatusText(registro.sistolica, registro.diastolica)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
