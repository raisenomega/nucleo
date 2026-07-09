import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (rutas de servicio). Se fusiona en translations.ts.
export const esRoutes = {
  newRoute: "Nueva ruta", routeStops: "Paradas", addStop: "Agregar parada", stopTimeRequired: "Indica la hora de cada parada antes de guardar.",
  completeStop: "Completar", stopCompleted: "Cobrada", alreadyCompleted: "Ya completada", stopsCompleted: "completadas",
  openMap: "Mapa", collectPayment: "Cobrar", amountReceived: "Recibido", changeAmount: "Cambio",
  notAttended: "No atendido", reason: "Razón", completeAndCollect: "Completar y cobrar", pendingDebt: "Deuda pendiente",
  accountsReceivable: "Cuentas por cobrar", stopDetail: "Detalle de parada", callClient: "Llamar", membershipClient: "Cliente con membresía",
  more: "Más", account: "Cuenta", scheduledTime: "Hora", serviceDescription: "Descripción del servicio",
  supplies: "Insumos", usedSupplies: "Insumos usados",
  pendingDebts: "Deudas pendientes de rutas no atendidas", totalPending: "Total pendiente",
  collect: "Cobrar", forgive: "Perdonar", forgiveReason: "Razón para perdonar la deuda",
  reminder: "Recordatorio WhatsApp", addNote: "Agregar nota", managementNote: "Nota de gestión", noteSaved: "Nota guardada",
  noPhone: "Sin teléfono",
} satisfies Partial<Record<TranslationKey, string>>;
