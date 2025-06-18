import { sql } from "@vercel/postgres"
import type { RegistroGlucosa, MomentoDia } from "../types/registro"

export async function obtenerUltimosRegistros(limite = 5): Promise<RegistroGlucosa[]> {
  try {
    const { rows } = await sql`
      SELECT id, fecha, hora, valor, momento, insulina, timestamp
      FROM registros_glucosa 
      ORDER BY timestamp DESC 
      LIMIT ${limite}
    `

    return rows.map((row) => ({
      id: row.id.toString(),
      fecha: new Date(row.fecha).toLocaleDateString("es-ES"),
      hora: row.hora.slice(0, 5), // HH:MM format
      valor: row.valor,
      momento: row.momento as MomentoDia,
      insulina: row.insulina,
      timestamp: row.timestamp,
    }))
  } catch (error) {
    console.error("Error al obtener registros:", error)
    return []
  }
}

export async function obtenerTodosLosRegistros(): Promise<RegistroGlucosa[]> {
  try {
    const { rows } = await sql`
      SELECT id, fecha, hora, valor, momento, insulina, timestamp
      FROM registros_glucosa 
      ORDER BY timestamp DESC
    `

    return rows.map((row) => ({
      id: row.id.toString(),
      fecha: new Date(row.fecha).toLocaleDateString("es-ES"),
      hora: row.hora.slice(0, 5),
      valor: row.valor,
      momento: row.momento as MomentoDia,
      insulina: row.insulina,
      timestamp: row.timestamp,
    }))
  } catch (error) {
    console.error("Error al obtener todos los registros:", error)
    return []
  }
}

export async function crearRegistro(registro: Omit<RegistroGlucosa, "id">): Promise<RegistroGlucosa | null> {
  try {
    const fechaObj = new Date()
    const fecha = fechaObj.toISOString().split("T")[0] // YYYY-MM-DD
    const hora = registro.hora + ":00" // HH:MM:SS

    const { rows } = await sql`
      INSERT INTO registros_glucosa (fecha, hora, valor, momento, insulina, timestamp)
      VALUES (${fecha}, ${hora}, ${registro.valor}, ${registro.momento}, ${registro.insulina}, ${registro.timestamp})
      RETURNING id, fecha, hora, valor, momento, insulina, timestamp
    `

    const row = rows[0]
    return {
      id: row.id.toString(),
      fecha: new Date(row.fecha).toLocaleDateString("es-ES"),
      hora: row.hora.slice(0, 5),
      valor: row.valor,
      momento: row.momento as MomentoDia,
      insulina: row.insulina,
      timestamp: row.timestamp,
    }
  } catch (error) {
    console.error("Error al crear registro:", error)
    return null
  }
}

export async function obtenerEstadisticas() {
  try {
    const { rows: promedioRows } = await sql`
      SELECT AVG(valor) as promedio
      FROM registros_glucosa 
      WHERE timestamp > ${Date.now() - 7 * 24 * 60 * 60 * 1000}
    `

    const { rows: totalRows } = await sql`
      SELECT COUNT(*) as total
      FROM registros_glucosa
    `

    const { rows: ultimoRows } = await sql`
      SELECT valor
      FROM registros_glucosa 
      ORDER BY timestamp DESC 
      LIMIT 1
    `

    return {
      promedio7Dias: Math.round(promedioRows[0]?.promedio || 0),
      totalRegistros: Number.parseInt(totalRows[0]?.total || "0"),
      ultimoValor: ultimoRows[0]?.valor || 0,
    }
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    return {
      promedio7Dias: 0,
      totalRegistros: 0,
      ultimoValor: 0,
    }
  }
}
