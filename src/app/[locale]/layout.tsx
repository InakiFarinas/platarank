import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Cinzel, Geist, Geist_Mono, IM_Fell_English } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JsonLd } from "@/components/json-ld";
import { isLocale, locales } from "@/i18n/config";
import { DISCORD_URL, OG_LOCALE, SITE_NAME, SITE_URL, ogImage } from "@/lib/seo";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const imFell = IM_Fell_English({
  variable: "--font-im-fell",
  weight: "400",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  weight: ["500", "700"],
  subsets: ["latin"],
});

export const viewport: Viewport = { themeColor: "#17110d" };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "common.meta" });
  const description = t("description");
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: { default: SITE_NAME, template: `%s -- ${SITE_NAME}` },
    description,
    openGraph: { siteName: SITE_NAME, type: "website", locale: OG_LOCALE[locale], title: SITE_NAME, description, images: ogImage(locale) },
    twitter: { card: "summary_large_image", title: SITE_NAME, description, images: ogImage(locale) },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const [t, messages] = await Promise.all([getTranslations({ locale, namespace: "common.meta" }), getMessages({ locale })]);
  // Legal/methodology prose is rendered server-side only, so it isn't shipped to the client.
  const clientMessages = Object.fromEntries(Object.entries(messages).filter(([ns]) => ns !== "legal"));

  const siteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo-og.png`,
        sameAs: [DISCORD_URL],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: t("description"),
        inLanguage: locale,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <html lang={locale === "pt" ? "pt-BR" : locale} className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} ${imFell.variable} ${cinzel.variable} antialiased`}>
        <JsonLd data={siteSchema} />
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-money focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-money-foreground"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          <TooltipProvider delay={150}>{children}</TooltipProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
