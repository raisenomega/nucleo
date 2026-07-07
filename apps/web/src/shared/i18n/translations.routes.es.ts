import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (rutas de servicio). Se fusiona en translations.ts.
export const esRoutes = {
  newRoute: "Nueva ruta", routeStops: "Paradas", addStop: "Agregar parada",
  completeStop: "Completar", stopCompleted: "Cobrada", alreadyCompleted: "Ya completada", stopsCompleted: "completadas",
  openMap: "Mapa", collectPayment: "Cobrar", amountReceived: "Recibido", changeAmount: "Cambio",
  notAttended: "No atendido", reason: "Razón", completeAndCollect: "Completar y cobrar", pendingDebt: "Deuda pendiente",
  accountsReceivable: "Cuentas por cobrar", stopDetail: "Detalle de parada", callClient: "Llamar", membershipClient: "Cliente con membresía",
  more: "Más", account: "Cuenta",
} satisfies Partial<Record<TranslationKey, string>>;
