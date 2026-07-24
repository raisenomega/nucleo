import type { CampaignBlock, BlockContent } from "@campaigns/domain/campaign.types";
import { HeroBlock } from "@campaigns/presentation/blocks/HeroBlock";
import { TextBlock } from "@campaigns/presentation/blocks/TextBlock";
import { CtaBannerBlock } from "@campaigns/presentation/blocks/CtaBannerBlock";
import { FormBlock } from "@campaigns/presentation/blocks/FormBlock";
import { BenefitsBlock } from "@campaigns/presentation/blocks/BenefitsBlock";
import { ImageBlock } from "@campaigns/presentation/blocks/ImageBlock";
import { VideoBlock } from "@campaigns/presentation/blocks/VideoBlock";
import { TestimonialsBlock } from "@campaigns/presentation/blocks/TestimonialsBlock";
import { PricingBlock } from "@campaigns/presentation/blocks/PricingBlock";
import { FaqBlock } from "@campaigns/presentation/blocks/FaqBlock";
import { CountdownBlock } from "@campaigns/presentation/blocks/CountdownBlock";
import { DividerBlock } from "@campaigns/presentation/blocks/DividerBlock";
import { LogoBarBlock } from "@campaigns/presentation/blocks/LogoBarBlock";
import { FeaturesGridBlock } from "@campaigns/presentation/blocks/FeaturesGridBlock";

// R3 completa los 14 renderers. Un block_type desconocido devuelve null → nunca rompe la página.
export function BlockRenderer({ block, lang, pageId }: { block: CampaignBlock; lang: string; pageId: string }) {
  const c: BlockContent = lang === "en" && block.contentEn ? block.contentEn : block.contentEs;
  switch (block.blockType) {
    case "hero": return <HeroBlock content={c} />;
    case "text": return <TextBlock content={c} />;
    case "cta_banner": return <CtaBannerBlock content={c} />;
    case "form": return <FormBlock content={c} pageId={pageId} />;
    case "benefits": return <BenefitsBlock content={c} />;
    case "image": return <ImageBlock content={c} />;
    case "video": return <VideoBlock content={c} />;
    case "testimonials": return <TestimonialsBlock content={c} />;
    case "pricing": return <PricingBlock content={c} />;
    case "faq": return <FaqBlock content={c} />;
    case "countdown": return <CountdownBlock content={c} />;
    case "divider": return <DividerBlock content={c} />;
    case "logo_bar": return <LogoBarBlock content={c} />;
    case "features_grid": return <FeaturesGridBlock content={c} />;
    default: return null;
  }
}
