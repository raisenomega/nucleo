import { lazy, Suspense, Component, type ReactNode } from "react";

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

export function HeroBackground() {
  return (
    <div className="fixed inset-0 z-0" style={{ background: "hsl(225 15% 5%)" }}>
      <Suspense fallback={null}>
        <SceneBoundary><HeroScene /></SceneBoundary>
      </Suspense>
    </div>
  );
}
