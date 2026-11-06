// Escapado de texto para HTML: contenido de elementos y valores de atributo entre comillas.
// Una sola pasada sobre los cinco caracteres con significado; null/undefined → "" (no imprime "null").
// NO valida URLs (para eso safeHref) ni sirve dentro de <script>/<style>. Tampoco es para texto plano:
// el asunto de un correo o una parte text/plain NO se escapan como HTML, saldría "&amp;" literal.
const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
};

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}
