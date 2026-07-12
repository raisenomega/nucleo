import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

const EN = typeof navigator !== "undefined" && navigator.language?.startsWith("en");
const T = EN
  ? { title: "Something went wrong", desc: "Reload the page or go home.", reload: "Reload", home: "Go home" }
  : { title: "Algo salió mal", desc: "Recargá la página o volvé al inicio.", reload: "Recargar", home: "Volver al inicio" };

// ErrorBoundary global. React puro: sin hooks, sin context, sin i18n (un provider pudo caer). Texto por navigator.language.
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("[ErrorBoundary]", error, info.componentStack); }
  render() {
    if (!this.state.hasError) return this.props.children;
    const btn = "rounded-lg px-4 py-2 font-bold";
    return (
      <div role="alert" className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle className="text-destructive h-16 w-16" aria-hidden="true" />
        <h1 className="font-display text-2xl font-bold">{T.title}</h1>
        <p className="text-muted-foreground max-w-md">{T.desc}</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => window.location.reload()} className={`${btn} bg-primary text-primary-foreground`}>{T.reload}</button>
          <button type="button" onClick={() => { window.location.href = "/"; }} className={`${btn} bg-secondary text-foreground`}>{T.home}</button>
        </div>
      </div>
    );
  }
}
