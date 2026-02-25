"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";

export function OnboardingBanner() {
  const { activeOrgId } = useOrg();
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!activeOrgId) return;

    // Check if banner was previously dismissed (session storage)
    const dismissed = sessionStorage.getItem(`onboarding-banner-dismissed-${activeOrgId}`);
    if (dismissed === "true") {
      setIsDismissed(true);
      return;
    }

    // Fetch onboarding status
    const checkOnboarding = async () => {
      try {
        const response = await apiClient.getOnboardingStatus(activeOrgId);
        const { isComplete } = response.onboarding;
        
        // Show banner if onboarding is not complete
        if (!isComplete) {
          setShowBanner(true);
        }
      } catch (err) {
        // Silently fail - banner is not critical
        console.error("Failed to check onboarding status:", err);
      }
    };

    checkOnboarding();
  }, [activeOrgId]);

  const handleDismiss = () => {
    if (activeOrgId) {
      sessionStorage.setItem(`onboarding-banner-dismissed-${activeOrgId}`, "true");
    }
    setIsDismissed(true);
  };

  if (!showBanner || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 mb-6 shadow-sm animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Your organization setup is incomplete
          </h3>
          <p className="text-sm text-slate-700 mb-3">
            Complete your setup to unlock all features and start managing contributions effectively.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            Complete Setup →
          </Link>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-yellow-100 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
