import { UserPlus, Palette, LayoutDashboard, TrendingUp, type LucideIcon } from "lucide-react";

// 4 pasos del proceso. icon = componente Lucide directo.
export type Step = { number: number; icon: LucideIcon; titleEs: string; titleEn: string; descEs: string; descEn: string };

export const STEPS: Step[] = [
  { number: 1, icon: UserPlus, titleEs: "Solicita acceso", titleEn: "Request access",
    descEs: "Cuéntanos sobre tu negocio y te activamos en minutos.", descEn: "Tell us about your business and we'll activate you in minutes." },
  { number: 2, icon: Palette, titleEs: "Configura tu marca", titleEn: "Set up your brand",
    descEs: "Logo, colores, dominio propio — tu plataforma, tu identidad.", descEn: "Logo, colors, custom domain — your platform, your identity." },
  { number: 3, icon: LayoutDashboard, titleEs: "Opera tu negocio", titleEn: "Run your business",
    descEs: "Factura, asigna rutas, gestiona empleados, todo desde un panel.", descEn: "Invoice, assign routes, manage employees, all from one dashboard." },
  { number: 4, icon: TrendingUp, titleEs: "Crece con datos", titleEn: "Grow with data",
    descEs: "Reportes, fiscal, IA — decisiones informadas para escalar.", descEn: "Reports, tax compliance, AI — informed decisions to scale." },
];
