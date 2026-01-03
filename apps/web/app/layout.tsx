import type { Metadata } from "next";
import { OrgProvider } from "@/lib/org-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contribly - Contribution Management",
  description: "Manage organization contributions and payments",
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary">
        <OrgProvider>
          <div className="min-h-screen">
            {children}
          </div>
          <div className="fixed bottom-2 right-2 z-50 bg-red-600 text-white px-3 py-1 text-xs">
            BUILD: AUDIT-CHECK-001
          </div>
        </OrgProvider>
      </body>
    </html>
  );
}
