import type { TranslationKey } from "./translations.keys";

// Namespace MFA + HERMES (SEGURIDAD S4+S5).
export const esMfa = {
  secTabHermes: "HERMES",
  hermHint: "Snapshots del estado del sistema. HERMES detecta drift (cambios de esquema, conteos) y alerta.",
  hermCreate: "Crear checkpoint ahora",
  hermTables: "Tablas", hermFunctions: "Funciones", hermTriggers: "Triggers", hermCrons: "Crons",
  hermMigrations: "Migr.", hermChanges: "Cambios", hermNoData: "Sin checkpoints todavía",
  mfaTitle: "Autenticación de 2 factores",
  mfaHint: "Protege tu cuenta con un código temporal de tu app autenticadora (Google Authenticator, Authy).",
  mfaStatusOn: "Activo", mfaStatusOff: "Inactivo", mfaActivate: "Activar 2FA", mfaDisable: "Desactivar 2FA",
  mfaScanQr: "Escanea este QR con tu app autenticadora y escribe el código de 6 dígitos:",
  mfaConfirm: "Confirmar", mfaVerify: "Verificar", mfaBadCode: "Código incorrecto. Inténtalo de nuevo.",
  mfaChallengeTitle: "Verificación en 2 pasos",
  mfaChallengeHint: "Ingresa el código de 6 dígitos de tu app autenticadora.",
  mfaBannerText: "Tu cuenta de superadmin no tiene 2FA activo. Actívalo para proteger la plataforma.",
  mfaBannerCta: "Activar ahora",
} satisfies Partial<Record<TranslationKey, string>>;
