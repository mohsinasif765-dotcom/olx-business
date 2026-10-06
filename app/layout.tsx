import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { PwaRegister } from "@/components/PwaRegister";
import { LanguageProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "OLX Business",
  description: "OLX Business car investment packages, recharge, withdraw, and team.",
  applicationName: "OLX Business",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon",
    apple: "/icon",
  },
  appleWebApp: {
    capable: true,
    title: "OLX Business",
    statusBarStyle: "black-translucent",
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
          <PwaRegister />
        </LanguageProvider>
      </body>
    </html>
  );
}
