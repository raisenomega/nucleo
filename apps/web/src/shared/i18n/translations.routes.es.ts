import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (rutas de servicio). Se fusiona en translations.ts.
export const esRoutes = {
  newRoute: "Nueva ruta", routeStops: "Paradas", addStop: "Agregar parada", stopTimeRequired: "Indica la hora de cada parada antes de guardar.",
  completeStop: "Completar", stopCompleted: "Cobrada", alreadyCompleted: "Ya completada", stopsCompleted: "completadas",
  openMap: "Mapa", collectPayment: "Cobrar", amountReceived: "Recibido", changeAmount: "Cambio",
  notAttended: "No cobrado", reason: "Razón", completeAndCollect: "Completar y cobrar", pendingDebt: "Deuda pendiente",
  accountsReceivable: "Cuentas por cobrar", stopDetail: "Detalle de parada", callClient: "Llamar", membershipClient: "Cliente con membresía",
  more: "Más", account: "Cuenta", scheduledTime: "Hora", serviceDescription: "Descripción del servicio",
  supplies: "Materiales", usedSupplies: "Materiales usados",
  pendingDebts: "Deudas pendientes de rutas no atendidas", totalPending: "Total pendiente",
  collect: "Cobrar", forgive: "Perdonar", forgiveReason: "Razón para perdonar la deuda",
  reminder: "Recordatorio WhatsApp", addNote: "Agregar nota", managementNote: "Nota de gestión", noteSaved: "Nota guardada",
  noPhone: "Sin teléfono",
  voidBtn: "VOID", voidTitle: "Confirmar VOID", voidReasonLabel: "Motivo del VOID",
  voidReasonPlaceholder: "Explica brevemente por qué haces VOID (mínimo 3 caracteres)",
  voidConfirmBtn: "Confirmar VOID", voidCancelBtn: "Cancelar", voidedBadge: "VOID",
  voidedTooltip: "Anulado por {name} el {date}", voidedReasonTooltip: "Motivo: {reason}",
  voidReasonTooShort: "El motivo debe tener al menos 3 caracteres",
  voidSuccess: "Registro anulado", voidError: "No se pudo anular el registro",
  deleteForeverBtn: "Eliminar definitivamente", deleteForeverConfirm: "Esta acción es permanente y no se puede deshacer. ¿Continuar?",
  deleteForeverSuccess: "Registro eliminado permanentemente", hideVoided: "Ocultar anuladas", showVoided: "Mostrar anuladas",
  cannotEditOthersRoute: "No puedes editar rutas de otros empleados",
  evidenceBefore: "Evidencia — Antes", evidenceAfter: "Evidencia — Después",
  evidenceRequired: "Sube al menos 1 foto antes y 1 después para completar",
} satisfies Partial<Record<TranslationKey, string>>;
