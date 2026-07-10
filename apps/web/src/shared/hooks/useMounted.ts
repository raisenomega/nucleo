import { useEffect, useState } from "react";

// true solo tras montar en cliente. Permite gatear lógica client-only sin hydration mismatch
// (el primer render — server y cliente — devuelve false, así matchea el HTML del SSR).
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
