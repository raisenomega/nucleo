import { createFileRoute } from "@tanstack/react-router";
import { PlatformPlaceholder } from "@admin/presentation/PlatformPlaceholder";

export const Route = createFileRoute("/_authenticated/web/secciones")({
  component: () => <PlatformPlaceholder titleKey="webSections" />,
});
