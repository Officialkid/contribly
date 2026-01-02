"use client";

import React from "react";
import { useOrg } from "@/lib/org-context";
import { Loading } from "@/components/ui";
import { ClaimsView } from "@/components/claims-view";

export default function ClaimsPage() {
  const { user, activeOrgId, activeDept } = useOrg();

  const isChiefAdminOrDeptAdmin =
    user?.role === "CHIEF_ADMIN" || (user?.role === "ADMIN" && activeDept);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Payment Claims</h1>
          <p className="text-text-muted mt-1">
            {isChiefAdminOrDeptAdmin
              ? "Review and approve payment claims"
              : "Submit and track your payment claims"}
          </p>
        </div>
        <span className={`badge ${isChiefAdminOrDeptAdmin ? 'badge-accent' : 'badge-primary'}`}>
          {isChiefAdminOrDeptAdmin ? "Administrator" : "Member"}
        </span>
      </div>

      <ClaimsView showApprovalActions={isChiefAdminOrDeptAdmin} />
    </div>
  );
}
