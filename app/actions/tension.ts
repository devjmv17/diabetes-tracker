"use server"

import { revalidatePath } from "next/cache"
import { crearRegistroTension, obtenerUltimosRegistrosTension, obtenerEstadisticasTension } from "../lib/database"
import { tensionSchema } from "../lib/schemas"
import type { RegistroTension } from "../types/tension"

export async function agregarRegistroTensionAction(formData: FormData) {
  const rawData = {
    sistolica: formData.get("sistolica"),
    diastolica: formData.get("diastolica"),
    pulsaciones: formData.get("pulsaciones"),
    fecha: formData.get("fecha"),
    hora: formData.get("hora"),
  }

  const result = tensionSchema.safeParse(rawData)

  if (!result.success) {
    const errorMessages = result.error.errors.map((error) => error.message).join(", ")
    return { error: `Datos inválidos: ${errorMessages}` }
  }

  try {
    const { fecha, hora, sistolica, diastolica, pulsaciones } = result.data
    const timestamp = new Date(`${fecha}T${hora}`).getTime()

    await crearRegistroTension({
      fecha: fecha.split("-").reverse().join("/"),
      hora,
      sistolica,
      diastolica,
      pulsaciones,
      timestamp,
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error al agregar registro de tensión:", error)
    return { error: "Error al guardar el registro en la base de datos" }
  }
}

export async function obtenerRegistrosTensionAction() {
  return await obtenerUltimosRegistrosTension(5)
}

export async function obtenerEstadisticasTensionAction() {
  return await obtenerEstadisticasTension()
}
