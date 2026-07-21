import type { ComponentType } from "react";
import { featureIcon } from "@raisen-marketing/data/feature-icons";
import type { SocialIconProps } from "@raisen-marketing/components/social-icons/types";
import { FacebookIcon } from "@raisen-marketing/components/social-icons/FacebookIcon";
import { InstagramIcon } from "@raisen-marketing/components/social-icons/InstagramIcon";
import { YouTubeIcon } from "@raisen-marketing/components/social-icons/YouTubeIcon";
import { LinkedInIcon } from "@raisen-marketing/components/social-icons/LinkedInIcon";
import { WhatsAppIcon } from "@raisen-marketing/components/social-icons/WhatsAppIcon";
import { TikTokIcon } from "@raisen-marketing/components/social-icons/TikTokIcon";

// Logos REALES de marca (lucide-react quitó los branded en 1.23). Clave = icon_name o platform en minúsculas.
export const SOCIAL_ICONS: Record<string, ComponentType<SocialIconProps>> = {
  facebook: FacebookIcon, instagram: InstagramIcon, youtube: YouTubeIcon,
  linkedin: LinkedInIcon, whatsapp: WhatsAppIcon, tiktok: TikTokIcon,
};
export const SOCIAL_PLATFORMS = Object.keys(SOCIAL_ICONS);

// Resuelve el ícono: logo real por icon_name → por platform → fallback a lucide (set compartido).
export function socialIcon(iconName: string, platform = ""): ComponentType<SocialIconProps> {
  return SOCIAL_ICONS[iconName.toLowerCase()] ?? SOCIAL_ICONS[platform.toLowerCase()] ?? featureIcon(iconName);
}
