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
} satisfies Partial<Record<TranslationKey, string>>;
