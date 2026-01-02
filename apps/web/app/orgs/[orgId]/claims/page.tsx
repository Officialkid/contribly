"use client";

import React from "react";
import { useOrg } from "@/lib/org-context";
import { Loading } from "@/components/ui";
import { ClaimsView } from "@/components/claims-view";

export default function ClaimsPage() {
  const { user, activeOrgId, activeDept } = useOrg();

  const isChiefAdminOrDeptAdmin =
    user?.role === "CHIEF_ADMIN" || (user?.role === "ADMIN" && activeDept);

  if (!activeOrgId) {
    return <Loading message="Loading organization..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Payment Claims</h1>
        <p className="text-slate-600 mt-1">
          {isChiefAdminOrDeptAdmin
            ? "Review and approve payment claims"
            : "Submit and track your payment claims"}
        </p>
      </div>

      <ClaimsView showApprovalActions={isChiefAdminOrDeptAdmin} />
    </div>
  );
}
