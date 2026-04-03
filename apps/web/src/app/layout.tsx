import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finly",
  description: "Controle suas finanças com clareza e praticidade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
