import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Your Organization - Contribly",
  description: "Complete your organization setup",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header with logo only */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">C</span>
              </div>
              <span className="text-xl font-bold text-slate-900">Contribly</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area - centered and spacious */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
