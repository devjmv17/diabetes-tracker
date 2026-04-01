import { NextResponse } from "next/server"
import { obtenerTodosLosRegistros } from "../../lib/database"

export async function GET() {
  try {
    const registrosGlucosa = await obtenerTodosLosRegistros()

    if (registrosGlucosa.length === 0) {
      return NextResponse.json([])
    }

    const datosPorFecha: Record<string, {
      glucosa: number[];
      insulinaTotal: number;
    }> = {}

    registrosGlucosa.forEach(reg => {
      const fecha = reg.fecha
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = { glucosa: [], insulinaTotal: 0 }
      }
      datosPorFecha[fecha].glucosa.push(reg.valor)
      datosPorFecha[fecha].insulinaTotal += (reg.insulina || 0)
    })

    const fechasOrdenadas = Object.keys(datosPorFecha).sort((a, b) => {
      const [diaA, mesA, anioA] = a.split("/")
      const [diaB, mesB, anioB] = b.split("/")
      return new Date(`${anioA}-${mesA}-${diaA}`).getTime() - new Date(`${anioB}-${mesB}-${diaB}`).getTime()
    })

    const data = fechasOrdenadas.map(fecha => {
      const datos = datosPorFecha[fecha]
      const calcularPromedio = (arr: number[]) => 
        arr.length > 0 ? Math.round(arr.reduce((x, y) => x + y, 0) / arr.length) : null

      return {
        fecha,
        glucosaPromedio: calcularPromedio(datos.glucosa),
        insulinaTotal: datos.insulinaTotal
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al exportar resumen glucosa JSON:", error)
    return NextResponse.json(
      { error: "Error al exportar datos del resumen de glucosa" },
      { status: 500 }
    )
  }
}
