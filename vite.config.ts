import { defineConfig } from "vite";
import { resolve } from "node:path";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const r = (p: string) => resolve(import.meta.dirname, p);

export default defineConfig({
  root: "apps/web",
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
  resolve: {
    alias: {
      "@sales": r("apps/web/src/modules/sales"),
      "@finance": r("apps/web/src/modules/finance"),
      "@fieldops": r("apps/web/src/modules/fieldops"),
      "@tenant": r("apps/web/src/modules/tenant"),
      "@identity": r("apps/web/src/modules/identity"),
      "@cognition": r("apps/web/src/modules/cognition"),
      "@shared": r("apps/web/src/shared"),
      "@brand": r("brand"),
    },
  },
});
