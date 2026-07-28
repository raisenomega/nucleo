// Envío estándar por WhatsApp. El mensaje SIEMPRE debe llevar un link BRANDED (dominio del tenant),
// nunca una URL cruda de Supabase Storage — así el preview de WhatsApp sale con la marca del tenant.
export function shareViaWhatsApp(phone: string | null, message: string): void {
  const clean = (phone ?? "").replace(/\D/g, "");
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
}

// Mensaje estándar: "[título]\n[Ver X]: [url branded]". Sin url → solo el título (degradación honesta).
export function docWaMessage(title: string, viewLabel: string, url: string | null): string {
  return `${title}${url ? `\n${viewLabel}: ${url}` : ""}`;
}
