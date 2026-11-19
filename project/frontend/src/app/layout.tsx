import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel de sensores",
  description: "Leituras e estatísticas dos sensores",
};

// Fontes do sistema: next/font/google baixaria as fontes durante o build, que deixaria de funcionar sem internet.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
