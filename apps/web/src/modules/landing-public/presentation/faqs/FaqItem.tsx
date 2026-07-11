import type { HomeFaq } from "@landing-public/domain/landing-home.types";

// Q&A expandida (SEO-friendly, sin acordeón). border-l accent + line-height relajado.
export function FaqItem({ faq }: { faq: HomeFaq }) {
  return (
    <article className="border-l-2 pl-4" style={{ borderColor: "hsl(var(--tenant-accent-hsl))" }}>
      <h3 className="font-bold text-[color:hsl(var(--lp-fg))]">{faq.question}</h3>
      <p className="mt-2 leading-relaxed text-[color:hsl(var(--lp-muted))]">{faq.answer}</p>
    </article>
  );
}
