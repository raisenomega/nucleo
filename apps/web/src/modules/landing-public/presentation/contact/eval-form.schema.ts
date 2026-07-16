import { z } from "zod";

// Validación del form "Coordinar una visita" = solicitud de Evaluación ($80 starting_from, cantidad de unidades).
// El backend reusa _public_create_lead (form_type='service_request' con el service_id de Evaluación + preferred_date;
// tipo de propiedad, cantidad, dirección y notas se concatenan en el mensaje → notes legible en el CRM).
export const evalSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(120),
  phone: z.string().trim().min(5).max(40),
  address: z.string().trim().min(5).max(200),
  preferredDate: z.string().trim().min(1).max(40),
  propertyType: z.enum(["residential", "commercial"]),
  quantity: z.coerce.number().int().min(1).max(999),
  notes: z.string().trim().max(1000).optional(),
});
export type EvalInput = z.infer<typeof evalSchema>;
