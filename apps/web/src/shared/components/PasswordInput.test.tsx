import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "@shared/i18n";
import { PasswordInput } from "./PasswordInput";

// El id llega al <input> real para que la página lo asocie a su <label htmlFor>. Entorno Node, sin DOM:
// se pinta con react-dom/server. useI18n exige su provider; el real es seguro en servidor (solo useEffect).
const html = (el: ReactElement) => renderToStaticMarkup(<I18nProvider>{el}</I18nProvider>);
const inputOf = (markup: string) => markup.match(/<input\b[^>]*>/)?.[0] ?? "";
const noop = () => undefined;

describe("PasswordInput id", () => {
  it("con id, el <input> lo lleva y no se repite en otro elemento", () => {
    const out = html(<PasswordInput id="x" value="" onChange={noop} />);
    expect(inputOf(out)).toContain(' id="x"');
    expect(out.match(/\sid="x"/g)).toHaveLength(1);
  });

  it("sin id no pinta atributo id: el HTML de los usos que no lo pasan no cambia", () => {
    const tag = inputOf(html(<PasswordInput value="" onChange={noop} />));
    expect(tag).toMatch(/^<input\b/);
    expect(tag).not.toMatch(/\sid=/);
  });
});
