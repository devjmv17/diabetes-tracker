import { NextResponse } from "next/server"
import { obtenerTodosLosRegistros } from "../../lib/database"

export async function GET() {
  try {
    const registros = await obtenerTodosLosRegistros()

    if (registros.length === 0) {
      return NextResponse.json({ error: "No hay registros de glucosa" }, { status: 404 })
    }

    const datosPorFecha: Record<string, { glucosa: number[]; insulinaTotal: number }> = {}

    registros.forEach(reg => {
      const fecha = reg.fecha
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = { glucosa: [], insulinaTotal: 0 }
      }
      datosPorFecha[fecha].glucosa.push(reg.valor)
      datosPorFecha[fecha].insulinaTotal += reg.insulina || 0
    })

    const calcularPromedio = (arr: number[]) =>
      arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null

    const fechasOrdenadas = Object.keys(datosPorFecha).sort((a, b) => {
      const [diaA, mesA, anioA] = a.split("/")
      const [diaB, mesB, anioB] = b.split("/")
      return new Date(`${anioA}-${mesA}-${diaA}`).getTime() - new Date(`${anioB}-${mesB}-${diaB}`).getTime()
    })

    const resultado = fechasOrdenadas.map(fecha => {
      const datos = datosPorFecha[fecha]
      return {
        fecha,
        glucosaPromedio: calcularPromedio(datos.glucosa),
        insulinaTotal: datos.insulinaTotal
      }
    })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Error al obtener resumen de glucosa:", error)
    return NextResponse.json({ error: "Error al obtener datos de glucosa" }, { status: 500 })
  }
}