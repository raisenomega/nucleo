import type { TranslationKey } from "./translations.keys";

// MFA + HERMES namespace (SEGURIDAD S4+S5).
export const enMfa = {
  secTabHermes: "HERMES",
  hermHint: "System state snapshots. HERMES detects drift (schema changes, counts) and alerts.",
  hermCreate: "Create checkpoint now",
  hermTables: "Tables", hermFunctions: "Functions", hermTriggers: "Triggers", hermCrons: "Crons",
  hermMigrations: "Migr.", hermChanges: "Changes", hermNoData: "No checkpoints yet",
  mfaTitle: "Two-factor authentication",
  mfaHint: "Protect your account with a temporary code from your authenticator app (Google Authenticator, Authy).",
  mfaStatusOn: "Active", mfaStatusOff: "Inactive", mfaActivate: "Enable 2FA", mfaDisable: "Disable 2FA",
  mfaScanQr: "Scan this QR with your authenticator app and enter the 6-digit code:",
  mfaConfirm: "Confirm", mfaVerify: "Verify", mfaBadCode: "Wrong code. Try again.",
  mfaChallengeTitle: "Two-step verification",
  mfaChallengeHint: "Enter the 6-digit code from your authenticator app.",
  mfaBannerText: "Your superadmin account has no 2FA enabled. Enable it to protect the platform.",
  mfaBannerCta: "Enable now",
} satisfies Partial<Record<TranslationKey, string>>;
