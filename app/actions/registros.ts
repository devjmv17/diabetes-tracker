"use server"

import { revalidatePath } from "next/cache"
import {
  crearRegistro,
  obtenerUltimosRegistros,
  obtenerTodosLosRegistros,
  obtenerTodosRegistrosLimitados,
  obtenerEstadisticas,
  obtenerUltimaInsulina,
  obtenerRegistroPorId,
  actualizarRegistro,
  eliminarRegistro,
  obtenerRegistrosAyunas,
} from "../lib/database"
import { registroSchema } from "../lib/schemas"

export async function agregarRegistroAction(formData: FormData) {
  const rawData = {
    valor: formData.get("valor"),
    momento: formData.get("momento"),
    insulina: formData.get("insulina"),
    fecha: formData.get("fecha"),
    hora: formData.get("hora"),
  }

  const validated = registroSchema.safeParse(rawData)

  if (!validated.success) {
    return { 
      success: false, 
      error: validated.error.errors.map(e => e.message).join(". ") 
    }
  }

  const { valor, momento, insulina, fecha, hora } = validated.data

  // Crear timestamp desde la fecha y hora seleccionadas
  const fechaHoraCompleta = new Date(`${fecha}T${hora}:00`)
  
  const nuevoRegistro = {
    fecha: fechaHoraCompleta.toLocaleDateString("es-ES"),
    hora: fechaHoraCompleta.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    valor,
    momento,
    insulina,
    timestamp: fechaHoraCompleta.getTime(),
  }

  const registroCreado = await crearRegistro(nuevoRegistro)

  if (registroCreado) {
    revalidatePath("/")
    return { success: true, registro: registroCreado }
  }

  return { success: false, error: "Error al guardar el registro en la base de datos" }
}

export async function editarRegistroAction(formData: FormData) {
  const id = formData.get("id") as string
  if (!id) return { success: false, error: "ID de registro no proporcionado" }

  const rawData = {
    valor: formData.get("valor"),
    momento: formData.get("momento"),
    insulina: formData.get("insulina"),
    fecha: formData.get("fecha"),
    hora: formData.get("hora"),
  }

  const validated = registroSchema.safeParse(rawData)

  if (!validated.success) {
    return { 
      success: false, 
      error: validated.error.errors.map(e => e.message).join(". ") 
    }
  }

  const { valor, momento, insulina, fecha, hora } = validated.data

  // Crear timestamp desde la fecha y hora seleccionadas
  const fechaHoraCompleta = new Date(`${fecha}T${hora}:00`)

  const registroActualizado = {
    fecha: fechaHoraCompleta.toLocaleDateString("es-ES"),
    hora: fechaHoraCompleta.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    valor,
    momento,
    insulina,
    timestamp: fechaHoraCompleta.getTime(),
  }

  const resultado = await actualizarRegistro(id, registroActualizado)

  if (resultado) {
    revalidatePath("/")
    return { success: true, registro: resultado }
  }

  return { success: false, error: "Error al actualizar el registro en la base de datos" }
}

export async function eliminarRegistroAction(id: string) {
  const resultado = await eliminarRegistro(id)

  if (resultado) {
    revalidatePath("/")
    return { success: true }
  }

  return { success: false, error: "Error al eliminar el registro" }
}

export async function obtenerRegistrosAction() {
  return await obtenerUltimosRegistros(5)
}

export async function obtenerTodosRegistrosAction() {
  return await obtenerTodosLosRegistros()
}

export async function obtenerEstadisticasAction() {
  return await obtenerEstadisticas()
}

export async function obtenerUltimaInsulinaAction() {
  return await obtenerUltimaInsulina()
}

export async function obtenerRegistroPorIdAction(id: string) {
  return await obtenerRegistroPorId(id)
}

export async function obtenerRegistrosAyunasAction() {
  return await obtenerRegistrosAyunas(30)
}

export async function obtenerTodosRegistrosLimitadosAction(limite = 50) {
  return await obtenerTodosRegistrosLimitados(limite)
}
