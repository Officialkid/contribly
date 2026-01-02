"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { DepartmentContributions } from "@/lib/types";
import { Card, Table, Badge, Loading, Error, EmptyState } from "@/components/ui";

export function DeptAdminDashboard() {
  const { activeOrgId, activeDeptId } = useOrg();
  const [summary, setSummary] = useState<DepartmentContributions | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId || !activeDeptId) return;

    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getDepartmentContributions(activeOrgId, activeDeptId, year);
        setSummary(response.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load summary");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [activeOrgId, activeDeptId, year]);

  if (isLoading) return <Loading message="Loading department summary..." />;
  if (error) return <Error message={error} />;
  if (!summary) return <EmptyState title="No Data" message="No contribution data available" />;

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setYear(year - 1)}
          className="px-4 py-2 bg-slate-200 text-slate-900 rounded hover:bg-slate-300 transition text-sm"
        >
          ← {year - 1}
        </button>
        <span className="px-4 py-2 text-slate-700 font-semibold">{year}</span>
        <button
          onClick={() => setYear(year + 1)}
          className="px-4 py-2 bg-slate-200 text-slate-900 rounded hover:bg-slate-300 transition text-sm"
        >
          {year + 1} →
        </button>
      </div>

      {/* Department Header */}
      <Card title={summary.name}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-600">Monthly Amount</p>
            <p className="text-2xl font-bold text-slate-900">${(parseFloat(summary.monthlyAmount || "0") / 100).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Total Members</p>
            <p className="text-2xl font-bold text-slate-900">{summary.members.length}</p>
          </div>
        </div>
      </Card>

      {/* Member Balances */}
      <Card title="Member Balances">
        <Table
          headers={["Member", "Payment Ref", "Role", "Months Cleared", "Pending ($)"]}
          rows={summary.members.map((m) => [
            m.user.name || m.user.email,
            m.paymentReference,
            <Badge key="role" status={m.role} />,
            m.balance?.monthsCleared.toString() || "-",
            m.balance ? `${(m.balance.carryForward).toFixed(2)}` : "-",
          ])}
        />
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <a
          href={`/orgs/${activeOrgId}/departments/${activeDeptId}/invite`}
          className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition text-sm"
        >
          Generate Invite
        </a>
        <a
          href={`/orgs/${activeOrgId}/withdrawals/new`}
          className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition text-sm"
        >
          Request Withdrawal
        </a>
      </div>
    </div>
  );
}
