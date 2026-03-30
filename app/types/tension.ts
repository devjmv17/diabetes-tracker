export interface RegistroTension {
  id?: number
  fecha: string
  hora: string
  sistolica: number
  diastolica: number
  pulsaciones: number
  timestamp: number
  created_at?: Date
}
