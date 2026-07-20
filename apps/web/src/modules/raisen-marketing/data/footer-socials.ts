import { Camera, ThumbsUp, Briefcase, Play, Music, AtSign, type LucideIcon } from "lucide-react";
import type { FooterRow } from "@raisen-marketing/data/footer.types";

// Redes del footer. lucide 1.23 quitó los íconos de marca → mapeo a genéricos (mismo criterio que S2).
// `key` = campo camelCase de FooterRow. Compartido por la landing (render condicional) y el editor (inputs).
export type SocialKey = "instagram" | "facebook" | "linkedin" | "youtube" | "tiktok" | "x";
export const SOCIAL_DEFS: { key: SocialKey & keyof FooterRow; Icon: LucideIcon; label: string }[] = [
  { key: "instagram", Icon: Camera, label: "Instagram" },
  { key: "facebook", Icon: ThumbsUp, label: "Facebook" },
  { key: "linkedin", Icon: Briefcase, label: "LinkedIn" },
  { key: "youtube", Icon: Play, label: "YouTube" },
  { key: "tiktok", Icon: Music, label: "TikTok" },
  { key: "x", Icon: AtSign, label: "X" },
];
