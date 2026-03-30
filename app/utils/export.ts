import type { RegistroGlucosa } from "../types/registro"
import { MOMENTOS_DIA } from "../lib/constants"

const escapeCSV = (val: string | number) => {
  const str = (val ?? "").toString()
  return str.includes(",") || str.includes('"') || str.includes("\n")
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

export function exportarRegistros(registros: RegistroGlucosa[]) {
  // Crear encabezados
  const headers = ["Fecha", "Registro", ...MOMENTOS_DIA, "Insulina (UI)"]

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
  const rows = [headers.map(escapeCSV).join(",")]

  Object.entries(registrosPorFecha).forEach(([fecha, momentosData]) => {
    const row = [fecha]

    // Columna de registro
    const primerMomento = Object.values(momentosData)[0]
    row.push(primerMomento ? primerMomento.valor.toString() : "")

    // Columnas por momento
    MOMENTOS_DIA.forEach((momento) => {
      const data = momentosData[momento]
      row.push(data ? `${fecha} ${data.hora}` : "")
    })

    // Columna de insulina
    const insulinaTotal = Object.values(momentosData).reduce((sum, data) => sum + data.insulina, 0)
    row.push(insulinaTotal.toString())

    rows.push(row.map(escapeCSV).join(","))
  })

  // Descargar archivo
  const csvContent = rows.join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `registros-glucosa-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
