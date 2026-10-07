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
      { url: "/app-icon-512.png", sizes: "512x512", type: "image/png" },
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
        <Script id="olx-pwa-boot" strategy="beforeInteractive">
          {`(function(){try{window.__olxPwa=window.__olxPwa||null;window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__olxPwa=e;try{window.dispatchEvent(new Event("olx-install-ready"))}catch(_){}});window.addEventListener("appinstalled",function(){window.__olxPwa=null});window.__olxPwaBooted=true;if("serviceWorker"in navigator){navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"}).then(function(r){try{r.update()}catch(_){}}).catch(function(){})}}catch(e){}})();`}
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
