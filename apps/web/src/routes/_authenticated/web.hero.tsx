import { createFileRoute } from "@tanstack/react-router";
import { HeroEditor } from "@raisen-marketing/admin/HeroEditor";

export const Route = createFileRoute("/_authenticated/web/hero")({ component: HeroEditor });
