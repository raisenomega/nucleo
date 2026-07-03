// NÚCLEO by raisen — invariantes de núcleo.
// Constantes congeladas. Cualquier cambio requiere: test rojo -> cambio -> test verde.
// El SHA1 de este archivo se verifica en CI (scripts/verify-guardrails.sh).

export type AiProviderId = "anthropic" | (string & {});

export const INVARIANTS = Object.freeze({
  tenant: Object.freeze({
    scopeColumn: "tenant_id",
    scopeRequired: true,
    crossTenantAccess: "forbidden",
  }),
  brand: Object.freeze({
    literalsInSrc: "forbidden",
    source: "brand/<tenant>",
  }),
  ai: Object.freeze({
    defaultProvider: "anthropic" as AiProviderId,
    maxSecondaryProviders: 2,
    secondaryRequiresAuthorization: true,
  }),
  forbidden: Object.freeze([
    "leer o escribir datos de otro tenant",
    "hardcodear hex, nombre, telefono o precio de cliente en src/",
    "activar un proveedor de IA secundario sin autorizacion",
  ]),
} as const);

export type Invariants = typeof INVARIANTS;

// Guard puro: falla si una fila no está limitada a un tenant.
export function assertTenantScoped(row: Record<string, unknown>): void {
  const col = INVARIANTS.tenant.scopeColumn;
  if (INVARIANTS.tenant.scopeRequired && row[col] == null) {
    throw new Error(`Invariant violated: fila sin ${col}`);
  }
}

// Guard puro: valida si un proveedor de IA puede activarse.
export function isAiProviderAllowed(
  provider: AiProviderId,
  authorized: boolean,
  activeSecondaryCount: number,
): boolean {
  if (provider === INVARIANTS.ai.defaultProvider) return true;
  if (!authorized && INVARIANTS.ai.secondaryRequiresAuthorization) return false;
  return activeSecondaryCount < INVARIANTS.ai.maxSecondaryProviders;
}
