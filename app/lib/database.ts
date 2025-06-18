import { neon } from "@neondatabase/serverless"
import type { RegistroGlucosa, MomentoDia } from "../types/registro"

const sql = neon(process.env.DATABASE_URL!)

export async function obtenerUltimosRegistros(limite = 5): Promise<RegistroGlucosa[]> {
  try {
    const rows = await sql`
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
    console.log("Ejecutando consulta para obtener todos los registros...")

    const rows = await sql`
      SELECT id, fecha, hora, valor, momento, insulina, timestamp
      FROM registros_glucosa 
      ORDER BY timestamp DESC
    `

    console.log(`Consulta ejecutada, ${rows.length} filas obtenidas`)

    const registros = rows.map((row) => {
      try {
        return {
          id: row.id.toString(),
          fecha: new Date(row.fecha).toLocaleDateString("es-ES"),
          hora: typeof row.hora === "string" ? row.hora.slice(0, 5) : row.hora,
          valor: Number(row.valor),
          momento: row.momento as MomentoDia,
          insulina: Number(row.insulina || 0),
          timestamp: Number(row.timestamp),
        }
      } catch (mapError) {
        console.error("Error al mapear fila:", row, mapError)
        throw mapError
      }
    })

    console.log("Registros mapeados exitosamente")
    return registros
  } catch (error) {
    console.error("Error detallado al obtener todos los registros:", error)

    // Si es un error de conexión, devolver array vacío en lugar de fallar
    if (error instanceof Error && error.message.includes("connect")) {
      console.warn("Error de conexión, devolviendo array vacío")
      return []
    }

    throw error
  }
}

export async function obtenerRegistroPorId(id: string): Promise<RegistroGlucosa | null> {
  try {
    const rows = await sql`
      SELECT id, fecha, hora, valor, momento, insulina, timestamp
      FROM registros_glucosa 
      WHERE id = ${id}
    `

    if (rows.length === 0) return null

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
    console.error("Error al obtener registro por ID:", error)
    return null
  }
}

export async function crearRegistro(registro: Omit<RegistroGlucosa, "id">): Promise<RegistroGlucosa | null> {
  try {
    const fechaObj = new Date()
    const fecha = fechaObj.toISOString().split("T")[0] // YYYY-MM-DD
    const hora = registro.hora + ":00" // HH:MM:SS

    const rows = await sql`
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

export async function actualizarRegistro(
  id: string,
  registro: Omit<RegistroGlucosa, "id">,
): Promise<RegistroGlucosa | null> {
  try {
    // Convertir fecha del formato español al formato ISO
    const [dia, mes, año] = registro.fecha.split("/")
    const fechaISO = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
    const hora = registro.hora + ":00" // HH:MM:SS

    const rows = await sql`
      UPDATE registros_glucosa 
      SET fecha = ${fechaISO}, 
          hora = ${hora}, 
          valor = ${registro.valor}, 
          momento = ${registro.momento}, 
          insulina = ${registro.insulina}, 
          timestamp = ${registro.timestamp}
      WHERE id = ${id}
      RETURNING id, fecha, hora, valor, momento, insulina, timestamp
    `

    if (rows.length === 0) return null

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
    console.error("Error al actualizar registro:", error)
    return null
  }
}

export async function eliminarRegistro(id: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM registros_glucosa 
      WHERE id = ${id}
    `

    return result.count > 0
  } catch (error) {
    console.error("Error al eliminar registro:", error)
    return false
  }
}

export async function obtenerEstadisticas() {
  try {
    const promedioRows = await sql`
      SELECT AVG(valor) as promedio
      FROM registros_glucosa 
      WHERE timestamp > ${Date.now() - 7 * 24 * 60 * 60 * 1000}
    `

    const totalRows = await sql`
      SELECT COUNT(*) as total
      FROM registros_glucosa
    `

    const ultimoRows = await sql`
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

export async function obtenerUltimaInsulina(): Promise<number> {
  try {
    const rows = await sql`
      SELECT insulina
      FROM registros_glucosa 
      WHERE insulina > 0
      ORDER BY timestamp DESC 
      LIMIT 1
    `

    return rows[0]?.insulina || 0
  } catch (error) {
    console.error("Error al obtener última insulina:", error)
    return 0
  }
}
