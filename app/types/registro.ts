export type MomentoDia =
  | "Ayunas"
  | "2h Después desayuno"
  | "Antes comida"
  | "2h Después comida"
  | "Antes cena"
  | "2h Después cena"

export interface RegistroGlucosa {
  id: string
  fecha: string
  hora: string
  valor: number
  momento: MomentoDia
  insulina: number
  timestamp: number
}
