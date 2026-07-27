import { FileText, Video, Presentation, Image as ImageIcon, ExternalLink, type LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";
import type { ResourceType } from "@hr/domain/resource.types";

export const RES_ICON: Record<ResourceType, LucideIcon> = {
  document: FileText, video: Video, presentation: Presentation, image: ImageIcon, link: ExternalLink,
};
export const RES_KEY: Record<ResourceType, TranslationKey> = {
  document: "document", video: "video", presentation: "presentation", image: "image", link: "link",
};
export const RES_TYPES: ResourceType[] = ["document", "video", "link", "image", "presentation"];

export function formatBytes(n: number | null): string {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
