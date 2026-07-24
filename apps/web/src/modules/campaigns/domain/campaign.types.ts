// Landing pages de campaña (R1). Modelo compartido entre el render público (/c/$slug) y el editor superadmin.
export type BlockType =
  | "hero" | "text" | "benefits" | "image" | "video" | "testimonials"
  | "pricing" | "faq" | "form" | "cta_banner" | "countdown" | "divider" | "logo_bar" | "features_grid";

export type BlockContent = Record<string, unknown>;

export interface CampaignBlock {
  id: string;
  blockType: BlockType;
  displayOrder: number;
  contentEs: BlockContent;
  contentEn: BlockContent | null;
  config: BlockContent;
  isVisible: boolean;
}

export interface CampaignPage {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  lang: "es" | "en" | "both";
}

// brand = null → página de plataforma (Raisen), usa el DNA dorado por defecto de campaign.css.
export interface CampaignBrand {
  primaryColor: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  displayName: string | null;
  themeVariant: string | null;
}

export interface CampaignPageData {
  page: CampaignPage;
  blocks: CampaignBlock[];
  brand: CampaignBrand | null;
}

export interface CampaignListItem {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  updatedAt: string;
  blocks: number;
}
