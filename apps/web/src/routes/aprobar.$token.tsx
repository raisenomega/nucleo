import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { getQuoteByToken, type PublicQuoteResp } from "@quotes/infrastructure/supabase-public-quote.repository";
import { QuoteApprovalView } from "@quotes/presentation/QuoteApprovalView";

export const Route = createFileRoute("/aprobar/$token")({ component: ApprovalPage });

// Página pública (sin auth) donde el cliente ve y responde la cotización por token.
function ApprovalPage() {
  const { token } = Route.useParams();
  const { t } = useI18n();
  const [data, setData] = useState<PublicQuoteResp | null>(null);
  useEffect(() => { void getQuoteByToken(token).then(setData); }, [token]);

  const wrap = "min-h-screen bg-background text-foreground flex items-center justify-center p-4 text-center";
  if (!data) return <main className={wrap}>{t("loadingQuote")}</main>;
  if (data.status === "valid") return <QuoteApprovalView token={token} data={data} />;

  const msg = data.status === "expired" ? t("quoteLinkExpired")
    : data.status === "used" ? t("quoteAlreadyResponded")
    : data.status === "rate_limited" ? t("tooManyRequests")
    : t("quoteNotFound");
  return (
    <main className={wrap}>
      <div className="space-y-2">
        <p className="text-lg font-bold text-primary">{msg} {data.tenant_display_name ?? ""}</p>
        {data.tenant_contact_phone && <p className="text-muted-foreground">{data.tenant_contact_phone}</p>}
      </div>
    </main>
  );
}
