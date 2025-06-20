"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RegistroGlucosa, MomentoDia } from "../types/registro"
import { obtenerTodosRegistrosAction } from "../actions/registros"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  X,
  Search,
  Filter,
  Calendar,
  Clock,
  Droplets,
  Syringe,
  ChevronUp,
  ChevronDown,
  Loader2,
  Printer,
} from "lucide-react"

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

  // Función para filtrar registros por fecha
  const filtrarPorFecha = (registros: RegistroGlucosa[]) => {
    if (!fechaInicio && !fechaFin) return registros

    return registros.filter((registro) => {
      // Convertir fecha del registro (DD/MM/YYYY) a Date para comparar
      const [dia, mes, año] = registro.fecha.split("/")
      const fechaRegistro = new Date(Number.parseInt(año), Number.parseInt(mes) - 1, Number.parseInt(dia))

      // Normalizar fechas para comparación (solo día, sin hora)
      const fechaRegistroNormalizada = new Date(
        fechaRegistro.getFullYear(),
        fechaRegistro.getMonth(),
        fechaRegistro.getDate(),
      )

      let fechaInicioNormalizada: Date | null = null
      let fechaFinNormalizada: Date | null = null

      if (fechaInicio) {
        const fechaInicioDate = new Date(fechaInicio)
        fechaInicioNormalizada = new Date(
          fechaInicioDate.getFullYear(),
          fechaInicioDate.getMonth(),
          fechaInicioDate.getDate(),
        )
      }

      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin)
        fechaFinNormalizada = new Date(fechaFinDate.getFullYear(), fechaFinDate.getMonth(), fechaFinDate.getDate())
      }

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

  // Función para imprimir registros
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

    // Crear contenido HTML para imprimir
    const contenidoImpresion = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Registros de Glucosa - ${new Date().toLocaleDateString("es-ES")}</title>
          <style>
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
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            
            .periodo-info h3 {
              margin: 0 0 10px 0;
              color: #0369a1;
            }
          </style>
        </head>
        <body>
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
            <p><strong>${periodoTexto}</strong></p>
            <p>Total de registros: <strong>${registrosFiltrados.length}</strong></p>
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
            <div class="stat-card">
              <h3>Insulina Total</h3>
              <div class="value">${insulinaTotal} UI</div>
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

          <div class="footer">
            <p><strong>Control de Glucosa</strong> - Reporte médico personal</p>
            <p>Este documento contiene información médica confidencial</p>
            <p>Generado automáticamente el ${new Date().toLocaleString("es-ES")}</p>
          </div>
        </body>
      </html>
    `

    // Crear ventana de impresión
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
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-blue-600" />
            Todos los Registros ({registrosFiltrados.length} de {registros.length})
            {hayFiltrosActivos && (
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Filtrado</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {registrosFiltrados.length > 0 && (
              <Button onClick={imprimirRegistros} variant="outline" size="sm" className="flex items-center gap-2">
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

          <Button variant="outline" onClick={limpiarTodosFiltros} className="flex items-center gap-2">
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
                onClick={() => aplicarPresetFecha("ultimos_3_meses")}
                className="text-xs"
              >
                3 meses
              </Button>
            </div>

            {/* Fechas personalizadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fecha-inicio-tabla" className="text-xs">
                  Fecha inicio
                </Label>
                <Input
                  id="fecha-inicio-tabla"
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
                <Label htmlFor="fecha-fin-tabla" className="text-xs">
                  Fecha fin
                </Label>
                <Input
                  id="fecha-fin-tabla"
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

            {/* Información del filtro */}
            {hayFiltrosFecha && (
              <div className="mt-3 p-2 bg-blue-50 border-l-4 border-blue-400 rounded text-sm">
                <p className="text-blue-800">
                  <strong>Período seleccionado:</strong> {fechaInicio || "Sin límite"} hasta {fechaFin || "Sin límite"}
                </p>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
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
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => cambiarOrden("valor")}>
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 mr-2" />
                    Glucosa
                    <IconoOrden columna="valor" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => cambiarOrden("momento")}>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Momento
                    <IconoOrden columna="momento" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => cambiarOrden("insulina")}>
                  <div className="flex items-center">
                    <Syringe className="w-4 h-4 mr-2" />
                    Insulina
                    <IconoOrden columna="insulina" />
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
                        <Button variant="outline" size="sm" onClick={limpiarTodosFiltros} className="mt-3">
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
                        <span
                          className={`text-lg font-bold ${
                            registro.valor >= 140
                              ? "text-orange-700"
                              : registro.valor < 70
                                ? "text-red-700"
                                : "text-blue-800"
                          }`}
                        >
                          {registro.valor}
                        </span>
                        <span className="text-sm text-gray-500">mg/dL</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{registro.momento}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-purple-700">{registro.insulina}</span>
                        <span className="text-xs text-gray-500">UI</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getColorByValue(registro.valor)}>{getStatusText(registro.valor)}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Resumen de estadísticas */}
        {registrosFiltrados.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600">Promedio</p>
                <p className="text-xl font-bold text-blue-700">
                  {Math.round(registrosFiltrados.reduce((sum, r) => sum + r.valor, 0) / registrosFiltrados.length)}{" "}
                  mg/dL
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600">Mínimo</p>
                <p className="text-xl font-bold text-green-700">
                  {Math.min(...registrosFiltrados.map((r) => r.valor))} mg/dL
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600">Máximo</p>
                <p className="text-xl font-bold text-red-700">
                  {Math.max(...registrosFiltrados.map((r) => r.valor))} mg/dL
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600">Insulina Total</p>
                <p className="text-xl font-bold text-purple-700">
                  {registrosFiltrados.reduce((sum, r) => sum + r.insulina, 0)} UI
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Información de filtros activos */}
        {hayFiltrosActivos && registrosFiltrados.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Filtros activos:</strong> Mostrando {registrosFiltrados.length} de {registros.length} registros
              totales
            </p>
            {hayFiltrosFecha && (
              <p className="text-xs text-blue-600 mt-1">
                <strong>Período:</strong> {fechaInicio || "Sin límite"} hasta {fechaFin || "Sin límite"}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
