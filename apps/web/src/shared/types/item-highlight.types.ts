// Punto destacado (checklist) de un item de catálogo. `icon` = nombre de icono Lucide (PascalCase, ej. "Shield").
// Compartido entre el panel (editor) y la landing pública (render) para no acoplar los dos módulos.
export interface ItemHighlight {
  icon: string;
  text_es: string;
  text_en: string;
}

// Normaliza antes de persistir: descarta filas sin text_es, recorta y aplica icono por defecto.
export const cleanHighlights = (h: ItemHighlight[]): ItemHighlight[] =>
  (h ?? []).filter((x) => x.text_es.trim() !== "")
    .map((x) => ({ icon: x.icon || "CheckCircle2", text_es: x.text_es.trim(), text_en: x.text_en.trim() }));
