/**
 * NÚCLEO by raisen — Contrato de la capa de marca (white label)
 * Propiedad de raisen.agency.
 *
 * ⚠️ ESTE ARCHIVO ES NÚCLEO. No se edita por cliente.
 * Lo que cambia por cliente son los archivos brand/<cliente>/brand.config.ts + theme.css.
 *
 * Regla de oro: si un valor identifica a un cliente (nombre, color, teléfono,
 * precio, categoría), va aquí como CAMPO EDITABLE — nunca hardcodeado en un componente.
 */

export type Locale = "es" | "en";

export interface BrandConfig {
  /** Identidad visible del negocio. */
  identity: {
    productName: string;              // "Nombre del negocio"
    legalName: string;                // Razón social
    tagline: Record<Locale, string>;
    foundedYear?: number;
    logo: {
      light: string;                  // ruta en brand/<cliente>/assets/
      dark: string;
      favicon: string;
    };
  };

  /** Contacto público y canales de órdenes. */
  contact: {
    phoneDisplay: string;             // "+1 (787) 538-7106"
    phoneE164: string;                // "17875387106"
    whatsappE164: string;
    orderEmail: string;
    address: {
      city: string;
      region: string;
      country: string;
      geo?: [number, number];
    };
    social?: { instagram?: string; facebook?: string; tiktok?: string };
  };

  /** Idiomas soportados por esta instancia. */
  locale: { default: Locale; enabled: Locale[] };

  /** Etiquetas financieras del negocio. El motor contable es genérico; esto son solo nombres. */
  finance: {
    incomeCategories: string[];
    expenseCategories: string[];
    extraordinaryCategories: string[];
    paymentMethods: string[];
    payrollPeriods: string[];
    retention: { enabled: boolean; ratePct: number; label: string };
    currency: "USD";
  };

  /** Configuración del flujo de órdenes. */
  orders: {
    numberPrefix: string;             // "XX" -> #XXNNNN (secuencia real en Postgres)
    channels: { web: boolean; whatsapp: boolean; stripeCheckout: boolean };
  };

  /** Stripe (opcional; solo si el cliente contrató checkout). */
  stripe?: {
    publishableKey?: string;
    priceIds: Record<string, string>;
    couponIds?: Record<string, string>;
  };

  /** SEO / dominio. */
  seo: {
    domain: string;
    defaultTitle: string;
    schema: "LocalBusiness" | "HomeAndConstructionBusiness" | string;
  };

  /** Interruptores de módulos por licencia contratada. */
  features: {
    routes: boolean;
    payroll: boolean;
    inventory: boolean;
    marketing: boolean;
    reconciliation: boolean;
    blog: boolean;
  };
}
