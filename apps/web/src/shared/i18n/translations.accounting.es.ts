import type { TranslationKey } from "./translations.keys";

// Diccionario del módulo Contabilidad (GL). Se fusiona en translations.ts.
export const esAccounting = {
  accounting: "Contabilidad", chartOfAccounts: "Plan de cuentas", generalLedger: "Libro mayor",
  accountCode: "Código", accountName: "Nombre", parentAccount: "Cuenta padre",
  header: "Grupo", systemAccount: "Sistema", postable: "posteable", inactive: "Inactiva",
  asset: "Activo", liability: "Pasivo", equity: "Capital", revenue: "Ingreso", expense: "Gasto", cogs: "COGS",
  createAccount: "Nueva cuenta", editAccount: "Editar cuenta", inactiveAccounts: "Mostrar inactivas",
  activate: "Activar", expand: "Expandir", collapse: "Colapsar",
  doubleEntryAccounting: "Contabilidad de partida doble", glEnabled: "Activada", glDisabled: "Desactivada",
  enableGLHint: "Activa el libro mayor con asientos Dr/Cr automáticos. Se creará un plan de cuentas estándar.",
  enableGLWarning: "Se activará la contabilidad de partida doble. Todos los nuevos gastos, ingresos, facturas y nóminas generarán asientos contables automáticamente. ¿Continuar?",
  glEnabledMsg: "Contabilidad activada. Los movimientos ahora generan asientos contables.",
  glDisabledMsg: "Contabilidad desactivada. Los asientos existentes se conservan.",
} satisfies Partial<Record<TranslationKey, string>>;
