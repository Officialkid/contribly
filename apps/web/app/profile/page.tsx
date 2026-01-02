"use client";

import React from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ProfileManagement } from "@/components/profile-management";

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <ProfileManagement />
    </DashboardLayout>
  );
}
