import type { SectionRow } from "@raisen-marketing/data/section.types";

// Fallback (idéntico al seed migr 205, orden real del JSX). La landing lo usa hasta que la DB responde →
// nunca queda en blanco ni cambia de orden durante la carga.
export const SECTIONS_FALLBACK: SectionRow[] = [
  { id: "f1", key: "hero", labelEs: "Hero", labelEn: "Hero", isVisible: true, order: 1 },
  { id: "f2", key: "features", labelEs: "Servicios", labelEn: "Features", isVisible: true, order: 2 },
  { id: "f3", key: "process", labelEs: "Proceso", labelEn: "Process", isVisible: true, order: 3 },
  { id: "f4", key: "solutions", labelEs: "Soluciones", labelEn: "Solutions", isVisible: true, order: 4 },
  { id: "f5", key: "pricing", labelEs: "Precios", labelEn: "Pricing", isVisible: true, order: 5 },
  { id: "f6", key: "testimonials", labelEs: "Testimonios", labelEn: "Testimonials", isVisible: true, order: 6 },
  { id: "f7", key: "lead_form", labelEs: "Formulario", labelEn: "Lead Form", isVisible: true, order: 7 },
];
