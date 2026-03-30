import type { MomentoDia } from "../types/registro"

export const MOMENTOS_DIA: MomentoDia[] = [
  "Ayunas",
  "2h Después desayuno",
  "Antes comida",
  "2h Después comida",
  "Antes cena",
  "2h Después cena",
]

export const COLORES_MOMENTOS: Record<MomentoDia, string> = {
  Ayunas: "#ef4444", // Rojo
  "2h Después desayuno": "#f97316", // Naranja
  "Antes comida": "#eab308", // Amarillo
  "2h Después comida": "#22c55e", // Verde
  "Antes cena": "#3b82f6", // Azul
  "2h Después cena": "#8b5cf6", // Púrpura
}

export const RANGOS_GLUCOSA = {
  BAJO: 70,
  ALTO: 140,
}
