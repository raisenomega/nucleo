// Fila de marketing_hero (camelCase). La landing lee estos valores; el editor /web/hero los escribe.
export interface MarketingHeroRow {
  id: string;
  titleEs: string; titleEn: string;
  subtitleEs: string; subtitleEn: string;
  ctaLabelEs: string; ctaLabelEn: string;
  scrollText: string; ctaHref: string;
  navCtaLabelEs: string; navCtaLabelEn: string; navCtaHref: string;
  backgroundVideoUrl: string | null;
  backgroundImageUrl: string | null;
  mediaOverlayOpacity: number;
  showScrollIndicator: boolean;
  show3dScene: boolean;
}
