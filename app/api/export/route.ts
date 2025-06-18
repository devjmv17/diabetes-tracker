import { NextResponse } from "next/server"
import { obtenerTodosLosRegistros } from "../../lib/database"
import type { MomentoDia } from "../../types/registro"

const momentos: MomentoDia[] = [
  "Ayunas",
  "2h Después desayuno",
  "Antes comida",
  "2h Después comida",
  "Antes cena",
  "2h Después cena",
]

export async function GET() {
  try {
    console.log("Iniciando exportación...")

    const registros = await obtenerTodosLosRegistros()
    console.log(`Obtenidos ${registros.length} registros`)

    if (registros.length === 0) {
      return NextResponse.json({ error: "No hay registros para exportar" }, { status: 404 })
    }

    // Crear encabezados
    const headers = ["Fecha", "Registro", ...momentos, "Insulina (UI)"]

    // Agrupar registros por fecha
    const registrosPorFecha: Record<string, Record<string, { valor: number; hora: string; insulina: number }>> = {}

    registros.forEach((registro) => {
      const fecha = registro.fecha
      if (!registrosPorFecha[fecha]) {
        registrosPorFecha[fecha] = {}
      }
      registrosPorFecha[fecha][registro.momento] = {
        valor: registro.valor,
        hora: registro.hora,
        insulina: registro.insulina,
      }
    })

    console.log("Registros agrupados por fecha:", Object.keys(registrosPorFecha).length)

    // Crear filas CSV
    const rows = [headers.join(",")]

    Object.entries(registrosPorFecha).forEach(([fecha, momentosData]) => {
      const row = [fecha]

      // Columna de registro (primer valor del día o el más alto)
      const valores = Object.values(momentosData)
      const valorPrincipal = valores.length > 0 ? valores[0].valor : ""
      row.push(valorPrincipal.toString())

      // Columnas por momento del día (solo fecha y hora)
      momentos.forEach((momento) => {
        const data = momentosData[momento]
        if (data) {
          row.push(`"${fecha} ${data.hora}"`)
        } else {
          row.push("")
        }
      })

      // Columna de insulina (suma total del día)
      const insulinaTotal = valores.reduce((sum, data) => sum + (data.insulina || 0), 0)
      row.push(insulinaTotal.toString())

      rows.push(row.join(","))
    })

    const csvContent = rows.join("\n")
    console.log("CSV generado exitosamente")

    // Crear respuesta con headers correctos
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="registros_glucosa_${new Date().toISOString().split("T")[0]}.csv"`,
        "Cache-Control": "no-cache",
      },
    })

    return response
  } catch (error) {
    console.error("Error detallado en exportación:", error)

    // Devolver error más específico
    const errorMessage = error instanceof Error ? error.message : "Error desconocido en la exportación"

    return NextResponse.json(
      {
        error: "Error al exportar datos",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
