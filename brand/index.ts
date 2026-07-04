/**
 * RAISEN CORE™ — Cargador de la marca activa.
 * Propiedad de raisen.agency. NÚCLEO — no se edita por cliente.
 *
 * La marca activa se decide por variable de entorno VITE_BRAND en cada despliegue.
 * Un mismo código, N instancias: cada Vercel/Supabase de cliente fija su propio VITE_BRAND.
 *
 *   VITE_BRAND=<cliente>   -> carga brand/<cliente>
 *   (sin valor)            -> _template (demo)
 */
import type { BrandConfig } from "./brand.types";

// Vite resuelve estos imports estáticamente en build. Agrega una línea por cliente
// cuando lo des de alta (o automatízalo con scripts/new-client.sh).
import { brand as template } from "./_template/brand.config";

const REGISTRY: Record<string, BrandConfig> = {
  _template: template,
};

const active = (import.meta.env.VITE_BRAND as string) || "_template";

export const brand: BrandConfig = REGISTRY[active] ?? template;
export type { BrandConfig, Locale } from "./brand.types";
