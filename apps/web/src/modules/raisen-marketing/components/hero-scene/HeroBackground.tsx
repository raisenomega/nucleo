import { lazy, Suspense, Component, type ReactNode } from "react";
import { useMounted } from "@shared/hooks/useMounted";

// Fondo 3D fixed inset-0 z-0 · Canvas lazy (three/fiber/drei solo en la landing, nunca en el bundle inicial).
// ErrorBoundary → si el 3D falla o no hay WebGL, cae a null y el contenido z-10 se ve igual. Portado OMEGA.
const HeroScene = lazy(() =>
  import("@raisen-marketing/components/hero-scene/HeroScene").then((m) => ({ default: m.HeroScene })),
);

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

// La escena SOLO se monta en cliente. En SSR, react-three-fiber emitiría un <canvas> vacío y arrastraría
// three/fiber/drei (~2 MB) al render del servidor sin pintar nada: no hay WebGL fuera del navegador.
// Con el gate, el servidor entrega solo el fondo oscuro y el 3D entra tras hidratar (sin mismatch: el primer
// render de cliente también tiene mounted=false).
export function HeroBackground() {
  const mounted = useMounted();
  return (
    <div className="fixed inset-0 z-0" style={{ background: "hsl(225 15% 5%)" }}>
      {mounted && (
        <Suspense fallback={null}>
          <SceneBoundary><HeroScene /></SceneBoundary>
        </Suspense>
      )}
    </div>
  );
}
