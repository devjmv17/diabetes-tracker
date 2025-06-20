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
import type { MomentoDia } from "../types/registro"

export async function agregarRegistroAction(formData: FormData) {
  const valor = Number.parseInt(formData.get("valor") as string)
  const momento = formData.get("momento") as MomentoDia
  const insulina = Number.parseInt(formData.get("insulina") as string) || 0
  const fechaPersonalizada = formData.get("fecha") as string
  const horaPersonalizada = formData.get("hora") as string

  console.log("Datos recibidos:", { valor, momento, insulina, fechaPersonalizada, horaPersonalizada })

  if (!valor || !momento || !fechaPersonalizada || !horaPersonalizada) {
    return { success: false, error: "Datos incompletos" }
  }

  // Crear timestamp desde la fecha y hora seleccionadas
  const fechaHoraCompleta = new Date(`${fechaPersonalizada}T${horaPersonalizada}:00`)

  // CORREGIDO: Usar la fecha seleccionada por el usuario, no la actual
  const fechaFormateada = fechaHoraCompleta.toLocaleDateString("es-ES")
  const horaFormateada = fechaHoraCompleta.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  console.log("Fecha y hora formateadas:", { fechaFormateada, horaFormateada })

  const nuevoRegistro = {
    fecha: fechaFormateada, // Esta es la fecha seleccionada por el usuario
    hora: horaFormateada, // Esta es la hora seleccionada por el usuario
    valor,
    momento,
    insulina,
    timestamp: fechaHoraCompleta.getTime(),
  }

  console.log("Registro a crear:", nuevoRegistro)

  const registroCreado = await crearRegistro(nuevoRegistro)

  if (registroCreado) {
    revalidatePath("/")
    return { success: true, registro: registroCreado }
  }

  return { success: false, error: "Error al guardar el registro" }
}

export async function editarRegistroAction(formData: FormData) {
  const id = formData.get("id") as string
  const valor = Number.parseInt(formData.get("valor") as string)
  const momento = formData.get("momento") as MomentoDia
  const insulina = Number.parseInt(formData.get("insulina") as string) || 0
  const fechaPersonalizada = formData.get("fecha") as string
  const horaPersonalizada = formData.get("hora") as string

  if (!id || !valor || !momento || !fechaPersonalizada || !horaPersonalizada) {
    return { success: false, error: "Datos incompletos" }
  }

  // Crear timestamp desde la fecha y hora seleccionadas
  const fechaHoraCompleta = new Date(`${fechaPersonalizada}T${horaPersonalizada}:00`)

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

  return { success: false, error: "Error al actualizar el registro" }
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
