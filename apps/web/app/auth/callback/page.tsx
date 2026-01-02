"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error parameter
      const errorParam = searchParams.get("error");
      if (errorParam) {
        setError("Authentication failed. Please try again.");
        setStatus("error");
        setTimeout(() => router.push("/login"), 3000);
        return;
      }

      try {
        // Verify authentication by fetching current user
        const response = await apiClient.getMe();
        
        if (response.success && response.user) {
          setStatus("success");
          
          // Redirect to organization dashboard if available
          const orgId = searchParams.get("organizationId") || response.user.organizationId;
          if (orgId) {
            setTimeout(() => router.push(`/orgs/${orgId}`), 1000);
          } else {
            setTimeout(() => router.push("/"), 1000);
          }
        } else {
          throw new Error("Authentication failed");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setStatus("error");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="bg-card border border-border rounded-card shadow-large p-12 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6">
              <svg className="animate-spin w-full h-full text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Completing Sign In</h2>
            <p className="text-text-muted">Please wait while we finish setting up your account...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-accent/10 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Success!</h2>
            <p className="text-text-muted">Redirecting to your dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Authentication Failed</h2>
            <p className="text-text-muted mb-4">{error || "Something went wrong. Please try again."}</p>
            <p className="text-sm text-text-muted">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  // Wrap useSearchParams consumer in Suspense to satisfy Next.js requirement
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="bg-card border border-border rounded-card shadow-large p-12 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6">
              <svg className="animate-spin w-full h-full text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Completing Sign In</h2>
            <p className="text-text-muted">Please wait while we finish setting up your account...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
