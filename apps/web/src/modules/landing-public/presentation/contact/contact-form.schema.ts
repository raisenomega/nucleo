import { z } from "zod";

// Validación client-side del form de contacto (zod v4). Mensajes se mapean a i18n por path en ContactForm.
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(120),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(10).max(1000),
});
export type ContactInput = z.infer<typeof contactSchema>;
