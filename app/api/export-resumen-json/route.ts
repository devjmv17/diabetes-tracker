import { NextResponse } from "next/server"
import { obtenerTodosLosRegistros, obtenerTodosLosRegistrosTension } from "../../lib/database"

export async function GET() {
  try {
    const [registrosGlucosa, registrosTension] = await Promise.all([
      obtenerTodosLosRegistros(),
      obtenerTodosLosRegistrosTension()
    ])

    if (registrosGlucosa.length === 0 && registrosTension.length === 0) {
      return NextResponse.json({ error: "No hay registros para exportar" }, { status: 404 })
    }

    const datosPorFecha: Record<string, {
      glucosa: number[];
      insulinaTotal: number;
      sistolica: number[];
      diastolica: number[];
      pulsaciones: number[];
    }> = {}

    registrosGlucosa.forEach(reg => {
      const fecha = reg.fecha
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = { glucosa: [], insulinaTotal: 0, sistolica: [], diastolica: [], pulsaciones: [] }
      }
      datosPorFecha[fecha].glucosa.push(reg.valor)
      datosPorFecha[fecha].insulinaTotal += (reg.insulina || 0)
    })

    registrosTension.forEach(reg => {
      const fecha = reg.fecha
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = { glucosa: [], insulinaTotal: 0, sistolica: [], diastolica: [], pulsaciones: [] }
      }
      datosPorFecha[fecha].sistolica.push(reg.sistolica)
      datosPorFecha[fecha].diastolica.push(reg.diastolica)
      datosPorFecha[fecha].pulsaciones.push(reg.pulsaciones)
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
        insulinaTotal: datos.insulinaTotal,
        sistolicaPromedio: calcularPromedio(datos.sistolica),
        diastolicaPromedio: calcularPromedio(datos.diastolica),
        pulsacionesPromedio: calcularPromedio(datos.pulsaciones)
      }
    })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("Error al obtener resumen diario:", error)
    return NextResponse.json(
      { error: "Error al obtener datos del resumen diario" },
      { status: 500 }
    )
  }
}