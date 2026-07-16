import { z } from "zod";

// Validación client-side del form "Coordinar una visita". El backend reusa _public_create_lead (form_type='contact'):
// dirección + fecha preferida + notas se concatenan en el mensaje (→ notes legible en el CRM). Sin RPC nuevo.
export const visitSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(120),
  phone: z.string().trim().min(5).max(40),
  address: z.string().trim().min(5).max(200),
  preferredDate: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type VisitInput = z.infer<typeof visitSchema>;
