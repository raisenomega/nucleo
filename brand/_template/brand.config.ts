/**
 * PLANTILLA DE MARCA — NÚCLEO by raisen
 * Base neutra para un cliente nuevo (y para la instancia demo "_template").
 * Copia brand/_template/ a brand/<slug-cliente>/, cambia TODOS los valores
 * marcados "← CAMBIAR" y registra el cliente en brand/index.ts.
 */
import type { BrandConfig } from "../brand.types";

export const brand: BrandConfig = {
  identity: {
    productName: "CAMBIAR · Nombre del negocio",   // ← CAMBIAR
    legalName: "CAMBIAR · Razón social",           // ← CAMBIAR
    tagline: {
      es: "CAMBIAR · Tu eslogan aquí",             // ← CAMBIAR
      en: "CAMBIAR · Your tagline here",           // ← CAMBIAR
    },
    logo: { light: "assets/logo.png", dark: "assets/logo.png", favicon: "assets/favicon.png" },
  },
  contact: {
    phoneDisplay: "+1 (000) 000-0000",             // ← CAMBIAR
    phoneE164: "10000000000",                       // ← CAMBIAR
    whatsappE164: "10000000000",                    // ← CAMBIAR
    orderEmail: "ordenes@ejemplo.com",              // ← CAMBIAR
    address: { city: "Ciudad", region: "PR", country: "US" },  // ← CAMBIAR
  },
  locale: { default: "es", enabled: ["es", "en"] },
  finance: {
    incomeCategories: ["Servicio", "Venta de Artículos"],          // ← CAMBIAR
    expenseCategories: ["Gasolina", "Inventario", "Nómina"],       // ← CAMBIAR
    extraordinaryCategories: ["Otros"],                            // ← CAMBIAR
    paymentMethods: ["Efectivo", "ATH Móvil", "Tarjeta"],          // ← CAMBIAR
    payrollPeriods: ["Semana", "Quincena", "Mensual"],
    retention: { enabled: false, ratePct: 0, label: "Retención" },
    currency: "USD",
  },
  orders: {
    numberPrefix: "XX",                             // ← CAMBIAR (2 letras del negocio)
    channels: { web: true, whatsapp: true, stripeCheckout: false },
  },
  // stripe: omitido a propósito — añádelo solo si el cliente contrata checkout.
  seo: {
    domain: "https://www.ejemplo.com",              // ← CAMBIAR
    defaultTitle: "CAMBIAR · Nombre del negocio",   // ← CAMBIAR
    schema: "LocalBusiness",
  },
  features: {
    routes: true, payroll: true, inventory: true,
    marketing: true, reconciliation: true, blog: true,
  },
};
