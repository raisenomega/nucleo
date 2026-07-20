import type { ProcessStepRow, ProcessConfig } from "@raisen-marketing/data/process.types";

// Fallback de la sección Proceso (idéntico al seed de la migr 199). La landing lo usa hasta que la DB
// responde, o si la DB no devuelve pasos activos. Así la landing nunca queda vacía si Supabase falla.
export const PROCESS_CONFIG_FALLBACK: ProcessConfig = {
  id: "", eyebrowEs: "Cómo funciona", eyebrowEn: "How it works",
  titleEs: "De registrarte a operar, en cuatro pasos", titleEn: "From sign-up to operating, in four steps",
};

export const PROCESS_STEPS_FALLBACK: ProcessStepRow[] = [
  { id: "f1", stepNumber: 1, iconName: "UserPlus", titleEs: "Solicita acceso", titleEn: "Request access",
    descEs: "Cuéntanos sobre tu negocio y te activamos en minutos.", descEn: "Tell us about your business and we'll activate you in minutes.", displayOrder: 1, isActive: true },
  { id: "f2", stepNumber: 2, iconName: "Palette", titleEs: "Configura tu marca", titleEn: "Set up your brand",
    descEs: "Logo, colores, dominio propio — tu plataforma, tu identidad.", descEn: "Logo, colors, custom domain — your platform, your identity.", displayOrder: 2, isActive: true },
  { id: "f3", stepNumber: 3, iconName: "LayoutDashboard", titleEs: "Opera tu negocio", titleEn: "Run your business",
    descEs: "Factura, asigna rutas, gestiona empleados, todo desde un solo panel.", descEn: "Invoice, assign routes, manage employees, all from one dashboard.", displayOrder: 3, isActive: true },
  { id: "f4", stepNumber: 4, iconName: "TrendingUp", titleEs: "Crece con datos", titleEn: "Grow with data",
    descEs: "Reportes, fiscal, IA — decisiones informadas para escalar.", descEn: "Reports, tax compliance, AI — informed decisions to scale.", displayOrder: 4, isActive: true },
];
