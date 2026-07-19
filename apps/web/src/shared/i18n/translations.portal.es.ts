import type { TranslationKey } from "./translations.keys";

// Portal del Cliente (PWA). Se fusiona en translations.ts.
export const esPortal = {
  navHome: "Inicio", navProfile: "Mi perfil", navServices: "Mis servicios", navOrders: "Mis órdenes",
  navInvoices: "Mis facturas", navPayments: "Métodos de pago", navAppointments: "Mis citas", navRequest: "Solicitar servicio",
  navReviews: "Mis evaluaciones", navSupport: "Soporte", navNotifications: "Notificaciones", navSettings: "Configuración",
  pComingSoon: "Próximamente", pWelcome: "Hola", pMyProfile: "Mi perfil", signOut: "Cerrar sesión",
  pCompleteProfile: "Completa tu perfil", pCompleteHint: "Tus datos se reutilizan al solicitar un servicio.",
  pFullName: "Nombre completo", pPhone: "Teléfono", pAddress: "Dirección", pCity: "Ciudad", pState: "Estado", pZip: "Código postal",
  pContactPref: "Preferencia de contacto", pLanguage: "Idioma", pNotesTeam: "Notas para el equipo", pNotesHint: "Ej: portón con código 1234, perro en el patio",
  pProfileSaved: "Perfil guardado", pSaveError: "No se pudo guardar", pPassword: "Contraseña",
  pLogin: "Entrar", pMagicLink: "Enviar enlace mágico", pMagicSent: "Te enviamos un enlace a tu correo", pEmailFirst: "Ingresa tu correo primero",
  pNoAccount: "¿No tienes cuenta?", pHaveAccount: "¿Ya tienes cuenta?", pRegister: "Crear cuenta", pConfirmEmail: "Revisa tu correo para confirmar tu cuenta.",
  osPending: "Pendiente", osAwaitingPayment: "Esperando pago", osAwaitingConfirmation: "Verificando pago", osPaid: "Pagada", osCanceled: "Cancelada", osRefunded: "Reembolsada",
  pTotal: "Total", pConfirmPayment: "Confirmar pago", pCancelOrder: "Cancelar", pConfirmPaidQ: "¿Confirmas que ya realizaste el pago?", pCancelQ: "¿Cancelar esta orden?",
  pNoOrders: "No tienes órdenes", pNoInvoices: "No tienes facturas", pDueDate: "Vence", pOverdue: "Vencida", pPaid: "Pagada", pPending: "Pendiente",
  pPdfUnavailable: "PDF no disponible aún", pPaymentHistory: "Historial de pagos", pNoPayments: "Sin pagos registrados", pTotalOwed: "Total adeudado",
  pService: "Servicio", pServicesNote: "Servicios asociados a tu teléfono.", pNoServices: "Sin servicios registrados", pJoinCall: "Unirse a la videollamada",
  pReschedule: "Reagendar", pCancelAppt: "Cancelar", pCancelApptQ: "¿Cancelar esta cita?", pNoAppointments: "No tienes citas", pReorder: "Reordenar", pReorderCreated: "Nueva orden creada",
} satisfies Partial<Record<TranslationKey, string>>;
