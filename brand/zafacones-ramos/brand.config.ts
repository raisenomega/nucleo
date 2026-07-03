/**
 * PLANTILLA DE CLIENTE NUEVO — RAISEN CORE™
 * Copia esta carpeta a brand/<slug-cliente>/ y cambia TODOS los valores marcados.
 * Luego agrega el cliente al registro en brand/index.ts.
 */
import type { BrandConfig } from "../brand.types";

export const brand: BrandConfig = {
  identity: {
    productName: "RAISEN Demo",                 // ← CAMBIAR
    legalName: "RAISEN Demo LLC",               // ← CAMBIAR
    tagline: {
      es: "Tu eslogan aquí",                     // ← CAMBIAR
      en: "Your tagline here",                   // ← CAMBIAR
    },
    logo: { light: "assets/logo.png", dark: "assets/logo.png", favicon: "assets/favicon.png" },
  },
  contact: {
    phoneDisplay: "+1 (000) 000-0000",          // ← CAMBIAR
    phoneE164: "10000000000",                    // ← CAMBIAR
    whatsappE164: "10000000000",                 // ← CAMBIAR
    orderEmail: "ordenes@ejemplo.com",           // ← CAMBIAR
    address: { city: "Ciudad", region: "PR", country: "US" },
  },
  locale: { default: "es", enabled: ["es"] },
  finance: {
    incomeCategories: ["Servicio", "Venta de Artículos"],          // ← CAMBIAR
    expenseCategories: ["Gasolina", "Inventario", "Nómina"],       // ← CAMBIAR
    extraordinaryCategories: ["Otros"],
    paymentMethods: ["Efectivo", "ATH Móvil", "Tarjeta/Stripe"],   // ← CAMBIAR
    payrollPeriods: ["Semana", "Quincena", "Mensual"],
    retention: { enabled: false, ratePct: 0, label: "Retención" },
    currency: "USD",
  },
  orders: {
    numberPrefix: "XX",                          // ← CAMBIAR (2 letras)
    channels: { web: true, whatsapp: true, stripeCheckout: false },
  },
  seo: {
    domain: "https://www.ejemplo.com",           // ← CAMBIAR
    defaultTitle: "RAISEN Demo",                 // ← CAMBIAR
    schema: "LocalBusiness",
  },
  features: {
    routes: true, payroll: true, inventory: true,
    marketing: true, reconciliation: true, blog: true,
  },
};
