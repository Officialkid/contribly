"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface SetupIncompleteBannerProps {
  completedSteps: number[];
  organizationId: string;
}

export function SetupIncompleteBanner({ completedSteps, organizationId }: SetupIncompleteBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    // Check localStorage for dismissed state
    const dismissed = localStorage.getItem(`setup-banner-dismissed-${organizationId}`);
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, [organizationId]);

  const totalSteps = 4;
  const percentComplete = Math.round((completedSteps.length / totalSteps) * 100);

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      // Call complete endpoint to mark onboarding as done
      await apiClient.completeOnboarding(organizationId);
      
      // Store dismissal in localStorage
      localStorage.setItem(`setup-banner-dismissed-${organizationId}`, "true");
      setIsVisible(false);
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setIsDismissing(false);
    }
  };

  if (!isVisible || completedSteps.length === totalSteps) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-5 shadow-md animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-start space-x-4">
        {/* Warning Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Your organization setup is {percentComplete}% complete
          </h3>
          <p className="text-sm text-slate-700 mb-4">
            Complete your setup to unlock all features and start managing contributions effectively. You have {totalSteps - completedSteps.length} step{totalSteps - completedSteps.length !== 1 ? 's' : ''} remaining.
          </p>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-amber-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="inline-flex items-center px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              Complete setup
            </Link>
            <button
              onClick={handleDismiss}
              disabled={isDismissing}
              className="text-sm text-slate-600 hover:text-slate-800 font-medium underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDismissing ? "Dismissing..." : "Dismiss"}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          disabled={isDismissing}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Dismiss banner"
        >
          <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
