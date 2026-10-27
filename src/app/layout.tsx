import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./site.css";

export const metadata: Metadata = {
  title: "Milhas Rotadas — Domine suas Milhas",
  description: "Milhas Rotadas — Domine suas Milhas: aulas, ferramentas e uma jornada de aprendizagem do básico ao avançado.",
  icons: {
    icon: "/milhas-rotadas-logo.png",
    apple: "/milhas-rotadas-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
