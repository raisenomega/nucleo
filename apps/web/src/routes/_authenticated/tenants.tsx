import { createFileRoute } from "@tanstack/react-router";
import { PlatformPlaceholder } from "@admin/presentation/PlatformPlaceholder";

export const Route = createFileRoute("/_authenticated/tenants")({
  component: () => <PlatformPlaceholder titleKey="saTenants" />,
});
