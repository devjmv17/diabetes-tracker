import { NextResponse } from "next/server"
import { obtenerTodosLosRegistrosTension } from "../../lib/database"

export async function GET() {
  try {
    const registrosTension = await obtenerTodosLosRegistrosTension()

    if (registrosTension.length === 0) {
      return NextResponse.json([])
    }

    const datosPorFecha: Record<string, {
      sistolica: number[];
      diastolica: number[];
      pulsaciones: number[];
    }> = {}

    registrosTension.forEach(reg => {
      const fecha = reg.fecha
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = { sistolica: [], diastolica: [], pulsaciones: [] }
      }
      datosPorFecha[fecha].sistolica.push(reg.sistolica)
      datosPorFecha[fecha].diastolica.push(reg.diastolica)
      datosPorFecha[fecha].pulsaciones.push(reg.pulsaciones)
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
        sistolicaPromedio: calcularPromedio(datos.sistolica),
        diastolicaPromedio: calcularPromedio(datos.diastolica),
        pulsacionesPromedio: calcularPromedio(datos.pulsaciones)
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al exportar resumen tensión JSON:", error)
    return NextResponse.json(
      { error: "Error al exportar datos del resumen de tensión" },
      { status: 500 }
    )
  }
}
