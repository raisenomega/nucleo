import { describe, it, expect } from "vitest";
import {
  INVARIANTS,
  assertTenantScoped,
  isAiProviderAllowed,
} from "./invariants.nucleo";

describe("invariantes de nucleo", () => {
  it("estan congelados (no mutables)", () => {
    expect(Object.isFrozen(INVARIANTS)).toBe(true);
    expect(Object.isFrozen(INVARIANTS.tenant)).toBe(true);
    expect(Object.isFrozen(INVARIANTS.ai)).toBe(true);
    expect(Object.isFrozen(INVARIANTS.forbidden)).toBe(true);
  });

  it("aislamiento de tenant: falla sin tenant_id", () => {
    expect(() => assertTenantScoped({})).toThrow();
    expect(() => assertTenantScoped({ tenant_id: "t_123" })).not.toThrow();
  });

  it("IA: anthropic siempre permitido", () => {
    expect(isAiProviderAllowed("anthropic", false, 0)).toBe(true);
  });

  it("IA: secundario requiere autorizacion", () => {
    expect(isAiProviderAllowed("otro", false, 0)).toBe(false);
    expect(isAiProviderAllowed("otro", true, 0)).toBe(true);
  });

  it("IA: maximo 2 secundarios", () => {
    expect(isAiProviderAllowed("otro", true, 2)).toBe(false);
  });
});
