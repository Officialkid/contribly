"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { ContributionsSummary } from "@/lib/types";
import { Card, Table, Badge, Loading, Error, EmptyState } from "@/components/ui";

export function ChiefAdminDashboard() {
  const { activeOrgId } = useOrg();
  const [summary, setSummary] = useState<ContributionsSummary | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId) return;

    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getContributionsSummary(activeOrgId, year);
        setSummary(response.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load summary");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [activeOrgId, year]);

  if (isLoading) return <Loading message="Loading contribution summary..." />;
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Departments">
          <p className="text-3xl font-bold text-slate-900">{summary.departments.length}</p>
        </Card>
        <Card title="Total Members">
          <p className="text-3xl font-bold text-slate-900">
            {summary.departments.reduce((sum, d) => sum + d.members.length, 0)}
          </p>
        </Card>
        <Card title="Year">
          <p className="text-3xl font-bold text-slate-900">{summary.year}</p>
        </Card>
      </div>

      {/* Departments Overview */}
      {summary.departments.map((dept) => (
        <Card key={dept.departmentId} title={`${dept.name} (${dept.monthlyAmount || "No limit"})`}>
          <Table
            headers={["Member", "Ref", "Role", "Months Cleared", "Pending Balance"]}
            rows={dept.members.map((m) => [
              m.user.name || m.user.email,
              m.paymentReference,
              <Badge key="role" status={m.role} />,
              m.balance?.monthsCleared.toString() || "-",
              m.balance ? `$${(m.balance.carryForward / 100).toFixed(2)}` : "-",
            ])}
          />
        </Card>
      ))}
    </div>
  );
}
