import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@hr/presentation/OnboardingPage";

// Onboarding: staff gestiona los checklists + templates; el empleado ve/completa el suyo.
export const Route = createFileRoute("/_authenticated/onboarding")({ component: OnboardingPage });
