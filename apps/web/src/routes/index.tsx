import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <h1 className="font-display text-5xl font-bold text-primary">
        NÚCLEO by raisen
      </h1>
    </main>
  );
}
