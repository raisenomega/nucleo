import { describe, it, expect } from "vitest";
import { focusWrapTarget } from "./useDialogFocus";

// Lógica pura del foco atrapado en ScreenModal (el entorno de test es Node, sin DOM).
describe("focusWrapTarget", () => {
  const items = ["a", "b", "c"] as const;

  it("Tab en el último envuelve al primero", () => {
    expect(focusWrapTarget(items, "c", false)).toBe("a");
  });
  it("Shift+Tab en el primero envuelve al último", () => {
    expect(focusWrapTarget(items, "a", true)).toBe("c");
  });
  it("en medio deja que el navegador mueva el foco", () => {
    expect(focusWrapTarget(items, "b", false)).toBeNull();
    expect(focusWrapTarget(items, "b", true)).toBeNull();
  });
  it("foco fuera de la lista (contenedor) entra por el extremo correcto", () => {
    expect(focusWrapTarget(items, null, false)).toBe("a");
    expect(focusWrapTarget(items, null, true)).toBe("c");
  });
  it("sin focusables no propone destino", () => {
    expect(focusWrapTarget([], null, false)).toBeNull();
  });
});
