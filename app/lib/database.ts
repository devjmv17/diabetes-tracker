import { neon } from "@neondatabase/serverless"
import type { RegistroGlucosa, MomentoDia } from "../types/registro"

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

function mapRowToRegistro(row: any): RegistroGlucosa {
  return {
    id: row.id.toString(),
    fecha: new Date(row.fecha).toLocaleDateString("es-ES"),
    hora: typeof row.hora === "string" ? row.hora.slice(0, 5) : row.hora,
    valor: Number(row.valor),
    momento: row.momento as MomentoDia,
    insulina: Number(row.insulina || 0),
    timestamp: Number(row.timestamp),
  }
}

export async function obtenerUltimosRegistros(limite = 5): Promise<RegistroGlucosa[]> {
  if (!sql) return []

  try {
    const rows = await sql`
      SELECT id, fecha, hora, valor, momento, insulina, timestamp
      FROM registros_glucosa 
      ORDER BY timestamp DESC 
      LIMIT ${limite}
    `
    return rows.map(mapRowToRegistro)
  } catch (error) {
    console.error("Error al obtener registros:", error)
    return []
  }
}

export async function obtenerTodosLosRegistros(): Promise<RegistroGlucosa[]> {
  if (!sql) return []

  try {
    const rows = await sql`
      SELECT id, fecha, hora, valor, momento, insulina, timestamp
      FROM registros_glucosa 
      ORDER BY timestamp DESC
    `
    return rows.map(mapRowToRegistro)
  } catch (error) {
    console.error("Error al obtener todos los registros:", error)
    return []
  }
}

export async function obtenerRegistrosAyunas(limite = 30): Promise<RegistroGlucosa[]> {
  if (!sql) return []

  try {
    const rows = await sql`
      SELECT id, fecha, hora, valor, momento, insulina, timestamp
      FROM registros_glucosa 
      WHERE momento = 'Ayunas'
      ORDER BY fecha ASC, timestamp ASC
      LIMIT ${limite}
    `
    return rows.map(mapRowToRegistro)
  } catch (error) {
    console.error("Error al obtener registros de ayunas:", error)
    return []
  }
}

export async function obtenerTodosRegistrosLimitados(limite = 50): Promise<RegistroGlucosa[]> {
  if (!sql) return []

  try {
    const rows = await sql`
      SELECT id, fecha, hora, valor, momento, insulina, timestamp
      FROM registros_glucosa 
      ORDER BY timestamp ASC
      LIMIT ${limite}
    `
    return rows.map(mapRowToRegistro)
  } catch (error) {
    console.error("Error al obtener registros limitados:", error)
    return []
  }
}

export async function obtenerRegistroPorId(id: string): Promise<RegistroGlucosa | null> {
  if (!sql) return null

  try {
    const rows = await sql`
      SELECT id, fecha, hora, valor, momento, insulina, timestamp
      FROM registros_glucosa 
      WHERE id = ${id}
    `
    return rows.length > 0 ? mapRowToRegistro(rows[0]) : null
  } catch (error) {
    console.error("Error al obtener registro por ID:", error)
    return null
  }
}

export async function crearRegistro(registro: Omit<RegistroGlucosa, "id">): Promise<RegistroGlucosa | null> {
  if (!sql) return null

  try {
    const [dia, mes, año] = registro.fecha.split("/")
    const fechaISO = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
    const hora = registro.hora + ":00"

    const rows = await sql`
      INSERT INTO registros_glucosa (fecha, hora, valor, momento, insulina, timestamp)
      VALUES (${fechaISO}, ${hora}, ${registro.valor}, ${registro.momento}, ${registro.insulina}, ${registro.timestamp})
      RETURNING id, fecha, hora, valor, momento, insulina, timestamp
    `
    return mapRowToRegistro(rows[0])
  } catch (error) {
    console.error("Error al crear registro:", error)
    return null
  }
}

export async function actualizarRegistro(
  id: string,
  registro: Omit<RegistroGlucosa, "id">,
): Promise<RegistroGlucosa | null> {
  if (!sql) return null

  try {
    const [dia, mes, año] = registro.fecha.split("/")
    const fechaISO = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
    const hora = registro.hora + ":00"

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
    return rows.length > 0 ? mapRowToRegistro(rows[0]) : null
  } catch (error) {
    console.error("Error al actualizar registro:", error)
    return null
  }
}

export async function eliminarRegistro(id: string): Promise<boolean> {
  if (!sql) return false

  try {
    const result = await sql`
      DELETE FROM registros_glucosa 
      WHERE id = ${id}
    `
    return (result as any).count > 0 || (result as any).length > 0 // Depende del driver
  } catch (error) {
    console.error("Error al eliminar registro:", error)
    return false
  }
}

export async function obtenerEstadisticas() {
  if (!sql) {
    return { promedio7Dias: 0, totalRegistros: 0, ultimoValor: 0 }
  }

  try {
    const rows = await sql`
      SELECT 
        ROUND(AVG(valor) FILTER (WHERE timestamp > ${Date.now() - 7 * 24 * 60 * 60 * 1000})) as promedio,
        COUNT(*) as total,
        (SELECT valor FROM registros_glucosa ORDER BY timestamp DESC LIMIT 1) as ultimo
      FROM registros_glucosa
    `

    const row = rows[0]
    return {
      promedio7Dias: Number(row.promedio || 0),
      totalRegistros: Number(row.total || 0),
      ultimoValor: Number(row.ultimo || 0),
    }
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    return { promedio7Dias: 0, totalRegistros: 0, ultimoValor: 0 }
  }
}

export async function obtenerUltimaInsulina(): Promise<number> {
  if (!sql) return 0

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
