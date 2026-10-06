import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

// Fontes versionadas no repo (Fontsource, OFL — ver src/app/fonts/LICENSE-*).
// Com next/font/google o build baixava o CSS do Google duas vezes (servidor e
// cliente); quando as respostas vinham diferentes, o nome da classe da fonte
// não batia entre HTML e CSS e tudo caía em Times. Arquivo local = mesmo hash.
const display = localFont({
  src: [
    { path: "./fonts/barlow-condensed-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/barlow-condensed-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/barlow-condensed-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/barlow-condensed-latin-800-normal.woff2", weight: "800", style: "normal" },
    { path: "./fonts/barlow-condensed-latin-900-normal.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: "./fonts/dm-sans-latin-wght-normal.woff2",
  weight: "100 1000",
  style: "normal",
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vrumm — Gestão para Estéticas Automotivas",
  description: "Do orçamento ao WhatsApp em segundos. Gestão profissional para estéticas automotivas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} font-sans`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
