import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import RegistroForm from "./components/registro-form"
import RegistroList from "./components/registro-list"
import { obtenerRegistrosAction, obtenerEstadisticasAction } from "./actions/registros"
import { Download, Activity, TrendingUp, Calendar } from "lucide-react"

async function ExportButton() {
  return (
    <form action="/api/export" method="GET">
      <Button type="submit" variant="outline" className="w-full md:w-auto">
        <Download className="w-4 h-4 mr-2" />
        Exportar Registros a CSV
      </Button>
    </form>
  )
}

export default async function Home() {
  const registros = await obtenerRegistrosAction()
  const estadisticas = await obtenerEstadisticasAction()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Control de Glucosa</h1>
          </div>
          <p className="text-gray-600">Gestiona tus registros de azúcar en sangre de forma sencilla</p>
        </div>

        {/* Estadísticas rápidas */}
        {estadisticas.totalRegistros > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <p className="text-sm text-gray-600">Promedio 7 días</p>
                <p className="text-2xl font-bold text-green-700">{estadisticas.promedio7Dias} mg/dL</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-gray-600">Total registros</p>
                <p className="text-2xl font-bold text-blue-700">{estadisticas.totalRegistros}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                <p className="text-sm text-gray-600">Último registro</p>
                <p className="text-2xl font-bold text-purple-700">{estadisticas.ultimoValor} mg/dL</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Formulario para agregar registro */}
        <RegistroForm />

        {/* Botón de exportar */}
        {estadisticas.totalRegistros > 0 && (
          <div className="mb-6">
            <ExportButton />
          </div>
        )}

        {/* Lista de registros */}
        <RegistroList registros={registros} />

        {estadisticas.totalRegistros > 5 && (
          <Card className="mt-6">
            <CardContent className="text-center py-4">
              <p className="text-gray-600">
                Mostrando los últimos 5 registros de {estadisticas.totalRegistros} totales
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
