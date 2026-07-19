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
  pToReview: "Por evaluar", pEvaluate: "Evaluar", pMyReviews: "Mis evaluaciones", pNoReviews: "Aún no has evaluado", pComment: "Comentario", pRecommendQ: "¿Recomendarías este servicio?", pBusinessReply: "Respuesta del negocio",
  pNewTicket: "Nuevo ticket", pNoTickets: "No tienes tickets", pSubject: "Asunto", pDescription: "Descripción", pReply: "Escribe un mensaje", pSend: "Enviar",
  pChangePassword: "Cambiar contraseña", pNewPassword: "Nueva contraseña", pPasswordShort: "Mínimo 6 caracteres", pNotifPref: "Preferencia de notificaciones",
  pTheme: "Tema", pThemeLight: "Claro", pThemeDark: "Oscuro", pThemeAuto: "Automático", pInstall: "Instalar app", pInstallApp: "Instalar en mi dispositivo",
  pMyData: "Mis datos", pExportData: "Descargar mis datos", pDangerZone: "Zona de peligro", pDeleteAccount: "Eliminar mi cuenta", pDeleteQ: "¿Eliminar tu cuenta? Perderás el acceso al portal.",
  pNotifEmail: "Email", pNotifPush: "Push", pNotifBoth: "Ambos", pNotifNone: "Ninguna", pDeactivated: "Cuenta desactivada", pDeactivatedMsg: "Tu cuenta fue desactivada. Contacta al negocio para reactivarla.",
  pStaffTitle: "Sesión de negocio", pStaffMsg: "Estás con una cuenta de negocio (staff). Este es el portal de clientes.", pGoAdmin: "Ir al panel",
  pLoginSubtitle: "Accede a tu cuenta", pForgot: "¿Olvidaste tu contraseña?",
} satisfies Partial<Record<TranslationKey, string>>;
