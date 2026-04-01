import { NextResponse } from "next/server"
import { obtenerTodosLosRegistrosTension } from "../../lib/database"

export async function GET() {
  try {
    const registros = await obtenerTodosLosRegistrosTension()

    if (registros.length === 0) {
      return NextResponse.json({ error: "No hay registros de tensión" }, { status: 404 })
    }

    const datosPorFecha: Record<string, { 
      sistolica: number[]; 
      diastolica: number[]; 
      pulsaciones: number[];
      registros: { hora: string; sistolica: number; diastolica: number; pulsaciones: number }[];
    }> = {}

    registros.forEach(reg => {
      const fecha = reg.fecha
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = { sistolica: [], diastolica: [], pulsaciones: [], registros: [] }
      }
      datosPorFecha[fecha].sistolica.push(reg.sistolica)
      datosPorFecha[fecha].diastolica.push(reg.diastolica)
      datosPorFecha[fecha].pulsaciones.push(reg.pulsaciones)
      datosPorFecha[fecha].registros.push({
        hora: reg.hora,
        sistolica: reg.sistolica,
        diastolica: reg.diastolica,
        pulsaciones: reg.pulsaciones
      })
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
        sistolicaPromedio: calcularPromedio(datos.sistolica),
        diastolicaPromedio: calcularPromedio(datos.diastolica),
        pulsacionesPromedio: calcularPromedio(datos.pulsaciones),
        registros: datos.registros
      }
    })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Error al obtener resumen de tensión:", error)
    return NextResponse.json({ error: "Error al obtener datos de tensión" }, { status: 500 })
  }
}