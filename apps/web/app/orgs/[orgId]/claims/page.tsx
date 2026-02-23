"use client";

import React from "react";
import { useOrg } from "@/lib/org-context";
import { Loading } from "@/components/ui";
import { ClaimsReviewView } from "@/components/claims-review-view";

export default function ClaimsPage() {
  const { user, activeOrgId, activeDeptId, departments } = useOrg();
  const activeDept = departments.find((dept) => dept.id === activeDeptId) || null;

  const isChiefAdminOrDeptAdmin =
    user?.role === "CHIEF_ADMIN" || (user?.role === "ADMIN" && !!activeDept);

  if (!user) {
    return <Loading message="Loading account..." />;
  }

  if (!activeOrgId) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-text-primary">
        <p className="font-semibold">No organization yet.</p>
        <p className="text-sm text-text-muted">Create one or accept an invite to manage claims.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Show admin view only for admins */}
      {isChiefAdminOrDeptAdmin ? (
        <ClaimsReviewView isDepartmentView={!!activeDept && user?.role === "ADMIN"} />
      ) : (
        // Show member view with unmatched payments CTA
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-6">Payment Claims</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Have an unmatched payment?</h3>
                <p className="text-sm text-blue-800 mb-4">
                  If you've made a payment but it hasn't been matched to your account yet, you can submit a claim to help us verify it.
                </p>
                <a href={`/orgs/${activeOrgId}/payments/unmatched`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View Unmatched Payments
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
