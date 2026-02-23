"use client";

import React from "react";
import { useOrg } from "@/lib/org-context";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PaymentAccountSetup } from "@/components/payment-account-setup";
import { MembersManagement } from "@/components/members-management";
import { MFASettings } from "@/components/mfa-settings";
import { EmptyState } from "@/components/ui";

export default function SettingsPage() {
  const { activeOrgId, user } = useOrg();
  const isChiefAdmin = user?.role === "CHIEF_ADMIN";

  if (!activeOrgId) {
    return (
      <DashboardLayout>
        <EmptyState
          title="No Organization"
          message="Please select or create an organization first"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-12">
        {/* MFA Settings - All Users */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-6">Security Settings</h2>
          <MFASettings />
        </div>

        <hr className="border-border" />

        {/* Payment Account Setup - Chief Admin Only */}
        {isChiefAdmin && (
          <>
            <PaymentAccountSetup activeOrgId={activeOrgId} />
            <hr className="border-border" />
          </>
        )}

        {/* Members Management */}
        <MembersManagement />
      </div>
    </DashboardLayout>
  );
}
