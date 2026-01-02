import type { Metadata } from "next";
import { OrgProvider } from "@/lib/org-context";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contribly - Contribution Management",
  description: "Manage organization contributions and payments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        <OrgProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-8">
              {children}
            </main>
          </div>
        </OrgProvider>
      </body>
    </html>
  );
}
