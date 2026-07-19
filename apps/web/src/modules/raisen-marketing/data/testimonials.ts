// 3 testimonios placeholder (negocios de servicio PR/LATAM ficticios pero creíbles). Rating 5.
export type Testimonial = { quoteEs: string; quoteEn: string; name: string; company: string; rating: number };

export const TESTIMONIALS: Testimonial[] = [
  { quoteEs: "Antes llevaba las facturas en libretas. Con NÚCLEO cotizo, facturo y cobro desde el celular en minutos.", quoteEn: "I used to track invoices in notebooks. With NÚCLEO I quote, invoice and collect from my phone in minutes.", name: "Carlos Rivera", company: "Plomería Rivera", rating: 5 },
  { quoteEs: "Mis rutas y la evidencia de cada trabajo quedan organizadas solas. El equipo completa todo desde el móvil.", quoteEn: "My routes and each job's evidence organize themselves. The team completes everything from mobile.", name: "María Santos", company: "Santos Landscaping", rating: 5 },
  { quoteEs: "La parte fiscal de PR me quitaba el sueño. Ahora las alertas y deducciones salen automáticas.", quoteEn: "PR taxes kept me up at night. Now alerts and deductions happen automatically.", name: "Luis Méndez", company: "Méndez Electric", rating: 5 },
];
