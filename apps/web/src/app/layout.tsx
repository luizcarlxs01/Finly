import type { Metadata } from "next";
import Script from "next/script";
import { FinanceSourceProvider } from "@/contexts/finance-source-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finly",
  description: "Controle suas finanças com clareza e praticidade.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

const themeInitializationScript = `
  try {
    const storedTheme = window.localStorage.getItem("finly-theme");
    const theme = storedTheme === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Script id="finly-theme-init" strategy="beforeInteractive">
          {themeInitializationScript}
        </Script>
        <FinanceSourceProvider>{children}</FinanceSourceProvider>
      </body>
    </html>
  );
}
