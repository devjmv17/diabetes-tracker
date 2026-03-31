import { NextResponse } from "next/server"
import { obtenerTodosLosRegistros, obtenerTodosLosRegistrosTension } from "../../lib/database"

const escapeCSV = (val: string | number) => {
  const str = (val ?? "").toString()
  return str.includes(",") || str.includes('"') || str.includes("\n")
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

export async function GET() {
  try {
    const [registrosGlucosa, registrosTension] = await Promise.all([
      obtenerTodosLosRegistros(),
      obtenerTodosLosRegistrosTension()
    ])

    if (registrosGlucosa.length === 0 && registrosTension.length === 0) {
      return NextResponse.json({ error: "No hay registros para exportar" }, { status: 404 })
    }

    // Agrupar por fecha
    const datosPorFecha: Record<string, {
      glucosa: number[];
      insulinaTotal: number;
      sistolica: number[];
      diastolica: number[];
      pulsaciones: number[];
    }> = {}

    // Procesar Glucosa
    registrosGlucosa.forEach(reg => {
      const fecha = reg.fecha
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = { glucosa: [], insulinaTotal: 0, sistolica: [], diastolica: [], pulsaciones: [] }
      }
      datosPorFecha[fecha].glucosa.push(reg.valor)
      datosPorFecha[fecha].insulinaTotal += (reg.insulina || 0)
    })

    // Procesar Tensión
    registrosTension.forEach(reg => {
      const fecha = reg.fecha
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = { glucosa: [], insulinaTotal: 0, sistolica: [], diastolica: [], pulsaciones: [] }
      }
      datosPorFecha[fecha].sistolica.push(reg.sistolica)
      datosPorFecha[fecha].diastolica.push(reg.diastolica)
      datosPorFecha[fecha].pulsaciones.push(reg.pulsaciones)
    })

    // Crear encabezados
    const headers = [
      "Fecha", 
      "Glucosa Promedio (mg/dL)", 
      "Insulina Total (UI)", 
      "Sistólica Promedio (mmHg)", 
      "Diastólica Promedio (mmHg)", 
      "Pulsaciones Promedio (BPM)"
    ]

    const rows = [headers.map(escapeCSV).join(",")]

    // Ordenar fechas cronológicamente
    const fechasOrdenadas = Object.keys(datosPorFecha).sort((a, b) => {
      const [diaA, mesA, anioA] = a.split("/")
      const [diaB, mesB, anioB] = b.split("/")
      return new Date(`${anioA}-${mesA}-${diaA}`).getTime() - new Date(`${anioB}-${mesB}-${diaB}`).getTime()
    })

    // Generar filas
    fechasOrdenadas.forEach(fecha => {
      const datos = datosPorFecha[fecha]
      
      const calcularPromedio = (arr: number[]) => 
        arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : ""

      const glucosaPromedio = calcularPromedio(datos.glucosa)
      const sistolicaPromedio = calcularPromedio(datos.sistolica)
      const diastolicaPromedio = calcularPromedio(datos.diastolica)
      const pulsacionesPromedio = calcularPromedio(datos.pulsaciones)

      const row = [
        fecha,
        glucosaPromedio,
        datos.insulinaTotal > 0 ? datos.insulinaTotal : "",
        sistolicaPromedio,
        diastolicaPromedio,
        pulsacionesPromedio
      ]

      rows.push(row.map(escapeCSV).join(","))
    })

    const csvContent = rows.join("\n")

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="resumen-diario-${new Date().toISOString().split("T")[0]}.csv"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error al exportar resumen diario:", error)
    return NextResponse.json(
      { error: "Error al exportar datos del resumen diario" },
      { status: 500 }
    )
  }
}
