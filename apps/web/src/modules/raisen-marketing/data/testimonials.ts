import type { TestimonialRow, TestimonialsConfig } from "@raisen-marketing/data/testimonial.types";

// Fallback de la sección Testimonios (idéntico al seed de la migr 201). La landing lo usa hasta que la DB
// responde, o si no hay testimonios activos. Así la landing nunca queda vacía si Supabase falla.
export const TESTIMONIALS_CONFIG_FALLBACK: TestimonialsConfig = {
  id: "", eyebrowEs: "Testimonios", eyebrowEn: "Testimonials",
  titleEs: "Lo que dicen nuestros clientes", titleEn: "What our clients say",
};

const base = { avatarUrl: null, rating: 5, isActive: true };

export const TESTIMONIALS_FALLBACK: TestimonialRow[] = [
  { ...base, id: "f1", quoteEs: "NÚCLEO nos permitió digitalizar toda la operación en una semana. Facturación, rutas y nómina — todo bajo nuestra marca.", quoteEn: "NÚCLEO let us digitalize our whole operation in a week. Invoicing, routes and payroll — all under our brand.", clientName: "Carlos Rivera", clientCompany: "Plomería Rivera", clientRole: "Dueño", displayOrder: 1 },
  { ...base, id: "f2", quoteEs: "Antes usábamos 4 apps diferentes. Ahora todo está en un solo lugar y mis técnicos completan servicios desde el celular.", quoteEn: "We used to juggle 4 different apps. Now everything is in one place and my techs complete jobs from their phone.", clientName: "María Santos", clientCompany: "Santos Landscaping", clientRole: "Gerente de operaciones", displayOrder: 2 },
  { ...base, id: "f3", quoteEs: "El módulo fiscal nos ahorró horas de trabajo cada mes. Las alertas de informativas son un salvavidas.", quoteEn: "The tax module saves us hours of work every month. The filing alerts are a lifesaver.", clientName: "Luis Méndez", clientCompany: "Méndez Electric", clientRole: "Contador", displayOrder: 3 },
];
