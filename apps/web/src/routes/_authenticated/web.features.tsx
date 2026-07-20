import { createFileRoute } from "@tanstack/react-router";
import { FeaturesManager } from "@raisen-marketing/admin/FeaturesManager";

export const Route = createFileRoute("/_authenticated/web/features")({ component: FeaturesManager });
