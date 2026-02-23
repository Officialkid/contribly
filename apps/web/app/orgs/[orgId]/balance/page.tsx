"use client";

import React from "react";
import { MemberBalanceView } from "@/components/member-balance-view";

export default function MemberBalancePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <MemberBalanceView />
      </div>
    </div>
  );
}
