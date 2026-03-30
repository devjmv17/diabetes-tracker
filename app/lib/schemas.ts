import { z } from "zod"
import { MOMENTOS_DIA } from "./constants"

export const registroSchema = z.object({
  valor: z.coerce.number().min(50, "El valor debe ser al menos 50 mg/dL").max(500, "El valor no puede superar los 500 mg/dL"),
  momento: z.enum(MOMENTOS_DIA as [string, ...string[]], {
    errorMap: () => ({ message: "Momento del día no válido" }),
  }),
  insulina: z.coerce.number().min(0, "La insulina no puede ser negativa").max(100, "Valor de insulina inusualmente alto").default(0),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
})

export type RegistroInput = z.infer<typeof registroSchema>

export const tensionSchema = z.object({
  sistolica: z.coerce
    .number()
    .min(70, "La tensión sistólica es muy baja")
    .max(250, "La tensión sistólica es muy alta"),
  diastolica: z.coerce
    .number()
    .min(40, "La tensión diastólica es muy baja")
    .max(150, "La tensión diastólica es muy alta"),
  pulsaciones: z.coerce
    .number()
    .min(30, "Las pulsaciones son muy bajas")
    .max(200, "Las pulsaciones son muy altas"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
})

export type TensionInput = z.infer<typeof tensionSchema>
