// 4 pasos del proceso (PARTE 7.3). `icon` = nombre Lucide.
export type ProcessStep = { number: number; icon: string; titleEs: string; titleEn: string; descriptionEs: string; descriptionEn: string };

export const STEPS: ProcessStep[] = [
  { number: 1, icon: "UserPlus", titleEs: "Solicita acceso", titleEn: "Request access", descriptionEs: "Cuéntanos sobre tu negocio y te activamos en minutos.", descriptionEn: "Tell us about your business and we'll activate you in minutes." },
  { number: 2, icon: "Palette", titleEs: "Configura tu marca", titleEn: "Set up your brand", descriptionEs: "Logo, colores, dominio propio — tu plataforma, tu identidad.", descriptionEn: "Logo, colors, custom domain — your platform, your identity." },
  { number: 3, icon: "LayoutDashboard", titleEs: "Opera tu negocio", titleEn: "Run your business", descriptionEs: "Factura, asigna rutas, gestiona empleados, todo desde un solo panel.", descriptionEn: "Invoice, assign routes, manage employees, all from one dashboard." },
  { number: 4, icon: "TrendingUp", titleEs: "Crece con datos", titleEn: "Grow with data", descriptionEs: "Reportes, fiscal, IA — decisiones informadas para escalar.", descriptionEn: "Reports, tax compliance, AI — informed decisions to scale." },
];
