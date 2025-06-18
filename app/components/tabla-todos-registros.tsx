"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RegistroGlucosa, MomentoDia } from "../types/registro"
import { obtenerTodosRegistrosAction } from "../actions/registros"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X, Search, Filter, Calendar, Clock, Droplets, Syringe, ChevronUp, ChevronDown, Loader2 } from "lucide-react"

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
  }, [registros, busqueda, filtroMomento, filtroRango, ordenColumna, direccionOrden])

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

  const aplicarFiltros = () => {
    let filtrados = [...registros]

    // Filtro por búsqueda (fecha)
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
          </div>
          <Button variant="ghost" size="sm" onClick={onCerrar}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>

        {/* Filtros */}
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
            onClick={() => {
              setBusqueda("")
              setFiltroMomento("todos")
              setFiltroRango("todos")
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Limpiar filtros
          </Button>
        </div>
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
      </CardContent>
    </Card>
  )
}
