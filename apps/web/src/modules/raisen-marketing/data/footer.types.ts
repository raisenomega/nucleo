// Footer de la landing (fila única, camelCase). Las 6 columnas sociales fijas quedaron DEPRECATED en DB
// (migr 210): las redes ahora viven en marketing_footer_social_links (tabla flexible).
export interface FooterRow {
  id: string;
  taglineEs: string; taglineEn: string;
  contactEmail: string | null; contactPhone: string | null;
  copyrightEs: string; copyrightEn: string;
}

// Link social del footer (tabla flexible: cualquier plataforma, ícono lucide libre, orden y activo).
export interface SocialLink { id: string; platform: string; url: string; iconName: string; displayOrder: number; isActive: boolean }
export type SocialLinkDraft = Omit<SocialLink, "id"> & { id?: string };
