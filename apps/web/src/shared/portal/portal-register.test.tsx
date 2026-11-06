import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "@shared/i18n";
import "../../routes/portal/register";

// /portal/register pintada sin DOM (entorno Node). Se simulan solo el router y el cliente de Supabase; i18n es
// el provider real (seguro en servidor), así cada etiqueta lleva el texto que ve el cliente. El componente se
// toma del createFileRoute simulado: la ruta no exporta nada nuevo. Vive fuera de src/routes/ porque allí el
// generador de rutas tomaría el .test.tsx por una ruta más.
const route = vi.hoisted(() => ({ page: null as (() => ReactElement) | null }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (o: { component: () => ReactElement }) => { route.page = o.component; return o; },
  useNavigate: () => () => undefined,
  Link: () => null,
}));
vi.mock("@shared/lib/supabase", () => ({ supabase: {} }));

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

function renderPage() {
  const Page = route.page;
  if (!Page) throw new Error("la ruta no registró su componente");
  const html = renderToStaticMarkup(<I18nProvider><Page /></I18nProvider>);
  const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map((m) => m[0]);
  const labels = [...html.matchAll(/<label\b[^>]*\sfor="([^"]*)"[^>]*>([\s\S]*?)<\/label>/g)]
    .map((m) => ({ target: m[1] ?? "", text: (m[2] ?? "").replace(/<[^>]*>/g, "").trim() }));
  return { inputs, labels };
}

describe("/portal/register: cada campo con su etiqueta visible", () => {
  it("hay cuatro <input>, todos con id y sin repetirse", () => {
    const ids = renderPage().inputs.map((tag) => attr(tag, "id"));
    expect(ids).toHaveLength(4);
    expect(ids.every((id) => !!id)).toBe(true);
    expect(new Set(ids).size).toBe(4);
  });

  it("cada id tiene un único <label for> con texto, igual al placeholder de su campo", () => {
    const { inputs, labels } = renderPage();
    expect(inputs).toHaveLength(4);
    expect(labels).toHaveLength(4);
    for (const tag of inputs) {
      const own = labels.filter((l) => l.target === attr(tag, "id"));
      expect(own).toHaveLength(1);
      expect(own[0]?.text).not.toBe("");
      expect(own[0]?.text).toBe(attr(tag, "placeholder"));
    }
  });
});
