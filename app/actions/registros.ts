"use server"

import { revalidatePath } from "next/cache"
import { crearRegistro, obtenerUltimosRegistros, obtenerTodosLosRegistros, obtenerEstadisticas } from "../lib/database"
import type { MomentoDia } from "../types/registro"

export async function agregarRegistroAction(formData: FormData) {
  const valor = Number.parseInt(formData.get("valor") as string)
  const momento = formData.get("momento") as MomentoDia
  const insulina = Number.parseInt(formData.get("insulina") as string) || 0

  if (!valor || !momento) {
    return { success: false, error: "Datos incompletos" }
  }

  const ahora = new Date()
  const nuevoRegistro = {
    fecha: ahora.toLocaleDateString("es-ES"),
    hora: ahora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    valor,
    momento,
    insulina,
    timestamp: ahora.getTime(),
  }

  const registroCreado = await crearRegistro(nuevoRegistro)

  if (registroCreado) {
    revalidatePath("/")
    return { success: true, registro: registroCreado }
  }

  return { success: false, error: "Error al guardar el registro" }
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
