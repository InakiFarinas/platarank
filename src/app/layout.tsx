import type { Metadata } from "next";
import { Geist, Geist_Mono, IM_Fell_English } from "next/font/google";
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
    card: "summary",
    title: "PlataRank",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} ${imFell.variable} antialiased`}>
        <TooltipProvider delay={150}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
