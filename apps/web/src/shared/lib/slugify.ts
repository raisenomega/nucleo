// Convierte texto a slug URL-safe: minúsculas, sin acentos, espacios/símbolos → guiones.
export function slugify(text: string): string {
  return text.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
