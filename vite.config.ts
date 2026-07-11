import { defineConfig } from "vite";
import { resolve } from "node:path";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const r = (p: string) => resolve(import.meta.dirname, p);

// En Vercel: redirige el Build Output API (.vercel/output) a la RAÍZ del repo,
// donde vive package.json. Local (node-server) mantiene apps/web/.output.
const baseNitro = process.env.VERCEL ? { output: { dir: r(".vercel/output") } } : {};
const nitroConfig = { ...baseNitro, handlers: [{ route: "/api/manifest.webmanifest", handler: r("apps/web/server/manifest-handler.ts") }] };

export default defineConfig({
  root: "apps/web",
  plugins: [tailwindcss(), tanstackStart(), nitro(nitroConfig), viteReact()],
  resolve: {
    alias: {
      "@sales": r("apps/web/src/modules/sales"),
      "@finance": r("apps/web/src/modules/finance"),
      "@fieldops": r("apps/web/src/modules/fieldops"),
      "@tenant": r("apps/web/src/modules/tenant"),
      "@identity": r("apps/web/src/modules/identity"),
      "@cognition": r("apps/web/src/modules/cognition"),
      "@crm": r("apps/web/src/modules/crm"),
      "@operations": r("apps/web/src/modules/operations"),
      "@hr": r("apps/web/src/modules/hr"),
      "@documents": r("apps/web/src/modules/documents"),
      "@billing": r("apps/web/src/modules/billing"),
      "@quotes": r("apps/web/src/modules/quotes"),
      "@landing": r("apps/web/src/modules/landing"),
      "@admin": r("apps/web/src/modules/admin"),
      "@shared": r("apps/web/src/shared"),
      "@brand": r("brand"),
    },
  },
});
