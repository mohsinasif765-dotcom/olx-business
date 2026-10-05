import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "OLX Business",
  description: "OLX Business car investment packages, recharge, withdraw, and team.",
  icons: {
    icon: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a1a4a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <LanguageProvider>
          {children}
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
