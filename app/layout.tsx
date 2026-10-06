import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
    icon: [
      { url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
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
        <Script id="olx-pwa-early" strategy="beforeInteractive">
          {`(function(){window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__olxPwa=e;});if("serviceWorker"in navigator){navigator.serviceWorker.register("/sw.js",{scope:"/"});}})();`}
        </Script>
        <LanguageProvider>
          {children}
          <BottomNav />
          <PwaRegister />
        </LanguageProvider>
      </body>
    </html>
  );
}
