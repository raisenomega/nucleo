import type { CampaignBlock, BlockContent } from "@campaigns/domain/campaign.types";
import { HeroBlock } from "@campaigns/presentation/blocks/HeroBlock";
import { TextBlock } from "@campaigns/presentation/blocks/TextBlock";
import { CtaBannerBlock } from "@campaigns/presentation/blocks/CtaBannerBlock";

// R1 implementa 3 tipos; los otros 11 (R3) devuelven null → un bloque aún sin renderer NO rompe la página.
export function BlockRenderer({ block, lang }: { block: CampaignBlock; lang: string }) {
  const content: BlockContent = lang === "en" && block.contentEn ? block.contentEn : block.contentEs;
  switch (block.blockType) {
    case "hero": return <HeroBlock content={content} />;
    case "text": return <TextBlock content={content} />;
    case "cta_banner": return <CtaBannerBlock content={content} />;
    default: return null;
  }
}
