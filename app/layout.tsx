import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nortedrones.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Norte Drones | Pulverização e Aplicação Agrícola de Precisão",
    template: "%s | Norte Drones",
  },
  description:
    "Norte Drones aplica tecnologia de precisão à pulverização agrícola no Tocantins: menos desperdício de insumo, mais uniformidade na lavoura. Solicite um orçamento.",
  keywords: [
    "drone agrícola",
    "pulverização com drone",
    "aplicação de precisão",
    "agricultura de precisão Tocantins",
    "Norte Drones",
    "Porto Nacional",
    "Palmas",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Norte Drones | Pulverização e Aplicação Agrícola de Precisão",
    description:
      "Tecnologia aplicada ao campo: pulverização e aplicação agrícola de precisão com drones no Tocantins.",
    url: siteUrl,
    siteName: "Norte Drones",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/images/og-cover.jpg", width: 1263, height: 720 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Caveat:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
