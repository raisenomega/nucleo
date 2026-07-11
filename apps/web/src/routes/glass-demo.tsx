import type { CSSProperties } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { MotionProvider } from "@landing-public/motion/motion-loader";
import { FadeInUp } from "@landing-public/motion/FadeInUp";
import { StaggerChildren } from "@landing-public/motion/StaggerChildren";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";
import { NavGlass } from "@landing-public/primitives/NavGlass";
import { HeroContainer } from "@landing-public/primitives/HeroContainer";
import "@landing-public/styles/landing.css";

// QA visual de los primitives Glass Liquid. Dev-only: en prod → notFound (404).
export const Route = createFileRoute("/glass-demo")({
  beforeLoad: () => { if (import.meta.env.PROD) throw notFound(); },
  component: Demo,
});

const DEMO_VARS = { "--tenant-primary-hsl": "109 76% 43%", "--tenant-accent-hsl": "150 70% 45%" } as CSSProperties;

function Demo() {
  return (
    <MotionProvider>
      <div className="lp-root min-h-screen" style={DEMO_VARS}>
        <NavGlass>
          <span className="font-bold">Glass Demo</span>
          <FloatingButton size="sm" variant="ghost">Menú</FloatingButton>
        </NavGlass>
        <HeroContainer mediaSlot={<div className="h-full w-full bg-gradient-to-br from-black/10 to-black/50" />}>
          <FadeInUp><h1 style={{ fontSize: "var(--text-hero)" }} className="font-bold">Glass Liquid</h1></FadeInUp>
          <FadeInUp delay={0.15} className="mt-6"><FloatingButton size="lg">Comenzar</FloatingButton></FadeInUp>
        </HeroContainer>
        <section className="mx-auto max-w-5xl px-6 py-16">
          <StaggerChildren className="grid gap-4 md:grid-cols-3">
            {(["sm", "md", "xl"] as const).map((e) => (
              <FadeInUp key={e} stagger><GlassCard elevation={e} padding="lg">Card · {e}</GlassCard></FadeInUp>
            ))}
          </StaggerChildren>
          <div className="mt-8 flex flex-wrap gap-3">
            <FloatingButton variant="primary">Primary</FloatingButton>
            <FloatingButton variant="accent">Accent</FloatingButton>
            <FloatingButton variant="ghost">Ghost</FloatingButton>
          </div>
        </section>
      </div>
    </MotionProvider>
  );
}
