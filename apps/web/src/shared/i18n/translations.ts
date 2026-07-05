export type Locale = "es" | "en";
export type TranslationKey =
  | "title" | "tagline" | "toggleTheme" | "switchLang" | "welcome" | "role" | "logout"
  | "trialBanner" | "trialEnded" | "trialEndedDesc" | "scheduleConsultation"
  | "income" | "incomeList" | "newIncome" | "amount" | "category" | "description" | "date"
  | "paymentMethod" | "save" | "cancel" | "edit" | "delete" | "noRecords" | "createdBy"
  | "actions" | "total" | "dashboard" | "balance" | "expenses" | "monthSummary"
  | "panel" | "payroll" | "routes" | "inventory" | "leads" | "marketing" | "reports"
  | "settings" | "comingSoon";

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  es: {
    title: "NÚCLEO by raisen", tagline: "La base operativa de tu negocio",
    toggleTheme: "Cambiar tema", switchLang: "Cambiar idioma",
    welcome: "Bienvenido a NÚCLEO", role: "Rol", logout: "Cerrar sesión",
    trialBanner: "Te quedan {days} días de prueba", trialEnded: "Tu prueba terminó",
    trialEndedDesc: "Agenda una consulta para seguir con NÚCLEO.", scheduleConsultation: "Agendar consulta",
    income: "Ingresos", incomeList: "Lista de ingresos", newIncome: "Nuevo ingreso",
    amount: "Monto", category: "Categoría", description: "Descripción", date: "Fecha",
    paymentMethod: "Método de pago", save: "Guardar", cancel: "Cancelar",
    edit: "Editar", delete: "Eliminar", noRecords: "No hay registros", createdBy: "Creado por",
    actions: "Acciones", total: "Total", dashboard: "Panel", balance: "Balance",
    expenses: "Gastos", monthSummary: "Resumen del mes", panel: "Panel", payroll: "Nómina",
    routes: "Rutas", inventory: "Inventario", leads: "Leads", marketing: "Marketing",
    reports: "Reportes", settings: "Ajustes", comingSoon: "Próximamente",
  },
  en: {
    title: "NÚCLEO by raisen", tagline: "The operating core for your business",
    toggleTheme: "Toggle theme", switchLang: "Switch language",
    welcome: "Welcome to NÚCLEO", role: "Role", logout: "Log out",
    trialBanner: "You have {days} days left in your trial", trialEnded: "Your trial has ended",
    trialEndedDesc: "Schedule a consultation to keep using NÚCLEO.", scheduleConsultation: "Schedule consultation",
    income: "Income", incomeList: "Income list", newIncome: "New income",
    amount: "Amount", category: "Category", description: "Description", date: "Date",
    paymentMethod: "Payment method", save: "Save", cancel: "Cancel",
    edit: "Edit", delete: "Delete", noRecords: "No records", createdBy: "Created by",
    actions: "Actions", total: "Total", dashboard: "Dashboard", balance: "Balance",
    expenses: "Expenses", monthSummary: "Month summary", panel: "Dashboard", payroll: "Payroll",
    routes: "Routes", inventory: "Inventory", leads: "Leads", marketing: "Marketing",
    reports: "Reports", settings: "Settings", comingSoon: "Coming soon",
  },
};
