"use client";

import React, { Suspense } from "react";
import { useOrg } from "@/lib/org-context";
import { ChiefAdminDashboard } from "@/components/dashboards/chief-admin";
import { DeptAdminDashboard } from "@/components/dashboards/dept-admin";
import { MemberDashboard } from "@/components/dashboards/member";
import { Loading } from "@/components/ui";

export default function DashboardPage() {
  const { user, activeOrg, activeDept } = useOrg();

  if (!user) {
    return <Loading message="Loading account..." />;
  }

  if (!activeOrg) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-text-primary">
        <p className="font-semibold">No organization yet.</p>
        <p className="text-sm text-text-muted">Create one or accept an invite to continue.</p>
      </div>
    );
  }

  // Route to appropriate dashboard based on role
  const role = user.role ?? "MEMBER";
  const isChiefAdmin = role === "CHIEF_ADMIN";
  const isDeptAdmin = role === "ADMIN" && activeDept && user.departmentId === activeDept.id;
  const isMember = role === "MEMBER" || (role === "ADMIN" && !isDeptAdmin);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{activeOrg.name}</h1>
          <p className="text-text-muted mt-1">
            {isChiefAdmin
              ? "Chief Administrator View"
              : isDeptAdmin
                ? `${activeDept?.name || "Department"} Administrator`
                : "Contributor Portal"}
          </p>
        </div>
        <span className={`badge ${isChiefAdmin ? 'badge-accent' : isDeptAdmin ? 'badge-primary' : 'badge'}`}>
          {isChiefAdmin ? "👑 Chief Admin" : isDeptAdmin ? "🔑 Dept Admin" : "👤 Member"}
        </span>
      </div>

      <Suspense fallback={<Loading message="Loading dashboard..." />}>
        {isChiefAdmin && <ChiefAdminDashboard />}
        {isDeptAdmin && <DeptAdminDashboard />}
        {isMember && <MemberDashboard />}
      </Suspense>
    </div>
  );
}
