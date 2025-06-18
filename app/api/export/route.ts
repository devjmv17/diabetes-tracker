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
    const registros = await obtenerTodosLosRegistros()

    if (registros.length === 0) {
      return NextResponse.json({ error: "No hay registros para exportar" }, { status: 404 })
    }

    // Crear encabezados
    const headers = ["Fecha", "Registro", ...momentos, "Insulina (UI)"]

    // Agrupar registros por fecha
    const registrosPorFecha = registros.reduce(
      (acc, registro) => {
        const fecha = registro.fecha
        if (!acc[fecha]) {
          acc[fecha] = {}
        }
        acc[fecha][registro.momento] = {
          valor: registro.valor,
          hora: registro.hora,
          insulina: registro.insulina,
        }
        return acc
      },
      {} as Record<string, Record<string, { valor: number; hora: string; insulina: number }>>,
    )

    // Crear filas CSV
    const rows = [headers.join(",")]

    Object.entries(registrosPorFecha).forEach(([fecha, momentosData]) => {
      const row = [fecha]

      // Columna de registro (valor principal del día)
      const primerMomento = Object.values(momentosData)[0]
      row.push(primerMomento ? primerMomento.valor.toString() : "")

      // Columnas por momento del día (solo fecha y hora)
      momentos.forEach((momento) => {
        const data = momentosData[momento]
        row.push(data ? `${fecha} ${data.hora}` : "")
      })

      // Columna de insulina
      const insulinaTotal = Object.values(momentosData).reduce((sum, data) => sum + data.insulina, 0)
      row.push(insulinaTotal.toString())

      rows.push(row.join(","))
    })

    const csvContent = rows.join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=registros_glucosa_${new Date().toISOString().split("T")[0]}.csv`,
      },
    })
  } catch (error) {
    console.error("Error al exportar:", error)
    return NextResponse.json({ error: "Error al exportar datos" }, { status: 500 })
  }
}
