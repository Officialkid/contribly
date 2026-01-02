"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { CarryForward } from "@/lib/types";
import { Card, Badge, Loading, Error, EmptyState } from "@/components/ui";

export function MemberDashboard() {
  const { user, activeOrgId, activeDeptId } = useOrg();
  const [balance, setBalance] = useState<CarryForward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId || !activeDeptId || !user) return;

    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getMemberBalance(activeOrgId, activeDeptId, user.id);
        setBalance(response.balance);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load balance");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [activeOrgId, activeDeptId, user?.id]);

  if (isLoading) return <Loading message="Loading your balance..." />;
  if (error) return <Error message={error} />;
  if (!balance) return <EmptyState title="No Data" message="No contribution data available" />;

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Monthly Contribution">
          <p className="text-3xl font-bold text-slate-900">${(balance.monthlyAmount / 100).toFixed(2)}</p>
        </Card>
        <Card title="Months Cleared">
          <p className="text-3xl font-bold text-green-600">{balance.monthsCleared}</p>
        </Card>
        <Card title="Pending Balance">
          <p className="text-3xl font-bold text-blue-600">${(balance.carryForward / 100).toFixed(2)}</p>
        </Card>
      </div>

      {/* Summary Card */}
      <Card title="Contribution Summary">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-600">Total Contributed:</span>
            <span className="font-semibold text-slate-900">${(balance.totalContributed / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Months Cleared:</span>
            <span className="font-semibold text-slate-900">{balance.monthsCleared} months</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="text-slate-600">Carry-Forward:</span>
            <span className="font-semibold text-slate-900">${(balance.carryForward / 100).toFixed(2)}</span>
          </div>
          <div className="text-xs text-slate-500 mt-4">
            As of {new Date(balance.balanceDate).toLocaleDateString()}
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <a
          href={`/orgs/${activeOrgId}/departments/${activeDeptId}/contribute`}
          className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition text-sm"
        >
          Record Payment
        </a>
        <a
          href={`/orgs/${activeOrgId}/departments/${activeDeptId}/claims`}
          className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition text-sm"
        >
          View Claims
        </a>
      </div>
    </div>
  );
}
