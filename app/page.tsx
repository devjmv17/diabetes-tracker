import { Card, CardContent } from "@/components/ui/card"
import RegistroForm from "./components/registro-form"
import RegistroList from "./components/registro-list"
import TensionForm from "./components/tension-form"
import TensionList from "./components/tension-list"
import ExportButton from "./components/export-button"
import DashboardTabs from "./components/dashboard-tabs"
import {
  obtenerRegistrosAction,
  obtenerEstadisticasAction,
} from "./actions/registros"
import {
  obtenerRegistrosTensionAction,
  obtenerEstadisticasTensionAction,
} from "./actions/tension"
import { Activity, TrendingUp, Calendar, Heart } from "lucide-react"
import BotonTablaRegistros from "./components/boton-tabla-registros"

export default async function Home() {
  const [registros, estadisticas, registrosTension, estadisticasTension] = await Promise.all([
    obtenerRegistrosAction(),
    obtenerEstadisticasAction(),
    obtenerRegistrosTensionAction(),
    obtenerEstadisticasTensionAction(),
  ])

  const glucosaContent = (
    <>
      {/* Estadísticas de Glucosa */}
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

      {/* Formulario Glucosa */}
      <RegistroForm />

      {/* Botones de exportar y tabla */}
      {estadisticas.totalRegistros > 0 && (
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <ExportButton />
          <BotonTablaRegistros />
        </div>
      )}

      {/* Lista de registros glucosa */}
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
    </>
  )

  const tensionContent = (
    <>
      {/* Estadísticas de Tensión */}
      {estadisticasTension.totalRegistros > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4 text-center">
              <Heart className="w-6 h-6 mx-auto text-red-600 mb-2" />
              <p className="text-sm text-gray-600">Promedio Tensión</p>
              <p className="text-2xl font-bold text-red-700">
                {estadisticasTension.promedioSistolica}/{estadisticasTension.promedioDiastolica}
              </p>
              <p className="text-xs text-gray-500">mmHg</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 mx-auto text-red-500 mb-2" />
              <p className="text-sm text-gray-600">Promedio Pulsaciones</p>
              <p className="text-2xl font-bold text-red-600">
                {estadisticasTension.promedioPulsaciones} <span className="text-sm font-normal">BPM</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto text-red-400 mb-2" />
              <p className="text-sm text-gray-600">Total registros</p>
              <p className="text-2xl font-bold text-red-700">{estadisticasTension.totalRegistros}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formulario Tensión */}
      <TensionForm />

      {/* Lista de registros tensión */}
      <TensionList registros={registrosTension} />
    </>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Mi Salud</h1>
          </div>
          <p className="text-gray-600">Gestiona tus registros de glucosa y tensión arterial</p>
        </div>

        {/* Tabs */}
        <DashboardTabs
          glucosaContent={glucosaContent}
          tensionContent={tensionContent}
        />
      </div>
    </div>
  )
}
