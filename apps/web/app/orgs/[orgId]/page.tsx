"use client";

import React, { Suspense } from "react";
import { useOrg } from "@/lib/org-context";
import { ChiefAdminDashboard } from "@/components/dashboards/chief-admin";
import { DeptAdminDashboard } from "@/components/dashboards/dept-admin";
import { MemberDashboard } from "@/components/dashboards/member";
import { Loading } from "@/components/ui";

export default function DashboardPage() {
  const { user, activeOrg, activeDept } = useOrg();

  if (!user || !activeOrg) {
    return <Loading message="Loading organization..." />;
  }

  // Route to appropriate dashboard based on role
  const isChiefAdmin = user.role === "CHIEF_ADMIN";
  const isDeptAdmin =
    user.role === "ADMIN" && activeDept && user.departmentId === activeDept.id;
  const isMember = user.role === "MEMBER" || (user.role === "ADMIN" && !isDeptAdmin);

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
