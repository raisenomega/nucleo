// Intención de registro (nombre/teléfono) guardada entre signUp y primer login, por si hay confirmación de email.
const KEY = "portal_pending_register";
export interface PendingReg { tenantId: string; name: string; phone: string }

export function setPending(p: PendingReg): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage bloqueado */ }
}
export function getPending(): PendingReg | null {
  try { const v = localStorage.getItem(KEY); return v ? (JSON.parse(v) as PendingReg) : null; } catch { return null; }
}
export function clearPending(): void {
  try { localStorage.removeItem(KEY); } catch { /* storage bloqueado */ }
}
