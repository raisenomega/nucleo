import type { CampaignBlock, BlockContent } from "@campaigns/domain/campaign.types";
import { HeroBlock } from "@campaigns/presentation/blocks/HeroBlock";
import { TextBlock } from "@campaigns/presentation/blocks/TextBlock";
import { CtaBannerBlock } from "@campaigns/presentation/blocks/CtaBannerBlock";
import { FormBlock } from "@campaigns/presentation/blocks/FormBlock";

// R1+R2 implementan 4 tipos (hero/text/cta_banner/form); los otros 10 (R3) devuelven null → no rompen la página.
export function BlockRenderer({ block, lang, pageId }: { block: CampaignBlock; lang: string; pageId: string }) {
  const content: BlockContent = lang === "en" && block.contentEn ? block.contentEn : block.contentEs;
  switch (block.blockType) {
    case "hero": return <HeroBlock content={content} />;
    case "text": return <TextBlock content={content} />;
    case "cta_banner": return <CtaBannerBlock content={content} />;
    case "form": return <FormBlock content={content} pageId={pageId} />;
    default: return null;
  }
}
