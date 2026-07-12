import type { Metadata } from "next";
import type { Viewport } from "next";
import { OrgProvider } from "@/lib/org-context";
import { ToastProvider } from "@/lib/toast-context";
import { ToastContainer } from "@/components/toast-container";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://contribly-web.vercel.app"),
  applicationName: "Contribly",
  title: "Contribly - Contribution Management",
  description: "Manage organization contributions, payments, claims, and approvals from any device.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/assets/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/assets/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Contribly",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary">
        <ToastProvider>
          <OrgProvider>
            <div className="min-h-screen">
              {children}
            </div>
            <PwaInstallBanner />
            <div className="fixed bottom-2 right-2 z-50 bg-red-600 text-white px-3 py-1 text-xs">
              BUILD: AUDIT-CHECK-001
            </div>
          </OrgProvider>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
