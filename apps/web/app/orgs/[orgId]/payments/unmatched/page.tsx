"use client";

import React from "react";
import { useOrg } from "@/lib/org-context";
import { Loading } from "@/components/ui";
import { UnmatchedPaymentsView } from "@/components/unmatched-payments-view";

export default function UnmatchedPaymentsPage() {
  const { user, activeOrgId, activeDeptId } = useOrg();

  if (!user) {
    return <Loading message="Loading account..." />;
  }

  if (!activeOrgId) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-text-primary">
        <p className="font-semibold">No organization yet.</p>
        <p className="text-sm text-text-muted">Create one or accept an invite to manage unmatched payments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <UnmatchedPaymentsView />
    </div>
  );
}
