import { createFileRoute } from "@tanstack/react-router";
import { PlatformPlaceholder } from "@admin/presentation/PlatformPlaceholder";

export const Route = createFileRoute("/_authenticated/web/features")({
  component: () => <PlatformPlaceholder titleKey="webFeatures" />,
});
