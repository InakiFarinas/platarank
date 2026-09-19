import type { Metadata } from "next";
import { Cinzel, Geist, Geist_Mono, IM_Fell_English } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

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

const DESCRIPTION =
  "Ranking de crafteo de Albion Online por plata realizable por dia (margen x volumen diario de ventas), no por margen unitario.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "PlataRank", template: "%s -- PlataRank" },
  description: DESCRIPTION,
  openGraph: {
    siteName: "PlataRank",
    type: "website",
    locale: "es_AR",
    title: "PlataRank",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: "PlataRank",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} ${imFell.variable} ${cinzel.variable} antialiased`}>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-money focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-money-foreground"
        >
          Saltar al contenido
        </a>
        <TooltipProvider delay={150}>{children}</TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
