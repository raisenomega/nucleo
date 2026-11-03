import { describe, it, expect } from "vitest";
import { payView } from "./pay-return-state";

// ?paid=1 no puede declarar una factura pagada: solo el balance del servidor lo hace.
describe("payView", () => {
  const unpaid = { stripeEnabled: true, balance: 100 };
  const settled = { stripeEnabled: true, balance: 0 };

  it("paid=1 con balance pendiente NO muestra 'pago recibido'", () => {
    expect(payView(unpaid, true, false)).toBe("confirming");
  });
  it("paid=1 antes de que responda el servidor solo confirma", () => {
    expect(payView(null, true, false)).toBe("confirming");
  });
  it("paid=1 falsificado: agotado el sondeo vuelve el botón de pagar", () => {
    expect(payView(unpaid, true, true)).toBe("button");
  });
  it("token inválido + paid=1 agotado no muestra nada", () => {
    expect(payView({ stripeEnabled: false }, true, true)).toBe("hidden");
  });
  it("'pago recibido' solo cuando el servidor reporta balance 0", () => {
    expect(payView(settled, true, false)).toBe("received");
  });
  it("sin la pista se comporta como antes", () => {
    expect(payView(unpaid, false, false)).toBe("button");
    expect(payView(settled, false, false)).toBe("hidden");
    expect(payView({ stripeEnabled: false, balance: 50 }, false, false)).toBe("hidden");
  });
});
