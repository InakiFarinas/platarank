import { getTranslations } from "next-intl/server";

/** Renders one schema.org JSON-LD block. `<` is escaped so page data can never close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }} />;
}

export type Faq = { q: string; a: string };

export function faqSchema(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

/** Visible FAQ: the same text that goes in the FAQPage schema, so the markup matches the page. */
export async function FaqList({ faqs, className }: { faqs: Faq[]; className?: string }) {
  const t = await getTranslations("stations");
  return (
    <div className={className}>
      <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">{t("faqHeading")}</h2>
      <dl className="mt-5 space-y-5">
        {faqs.map(({ q, a }) => (
          <div key={q}>
            <dt className="font-heading text-base">{q}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
