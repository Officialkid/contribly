"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { ContributionsSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { Card, Table, Badge, Loading, Error, EmptyState, Skeleton, Toast } from "@/components/ui";

export function ChiefAdminDashboard() {
  const { activeOrgId } = useOrg();
  const [summary, setSummary] = useState<ContributionsSummary | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId) return;

    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getContributionsSummary(activeOrgId, year);
        setSummary(response.summary);
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message ?? "Failed to load summary";
        setError(message);
        setToast(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [activeOrgId, year]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-3 bg-card border border-border rounded-button p-2 shadow-soft">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
        <div className="card p-6 space-y-3">
          <Skeleton className="h-5 w-48" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <Error message={error} />;
  if (!summary) return (
    <EmptyState
      title="No Contribution Data"
      message="No contributions have been recorded yet for this organization."
      details="Start by creating departments, inviting members, and recording payments. All contributions will appear here in a comprehensive summary by department."
    />
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Organization Overview</h1>
          <p className="text-text-muted mt-1">Complete contribution summary for {year}</p>
        </div>
        {/* Year Selector */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-button p-1 shadow-soft">
          <button
            onClick={() => setYear(year - 1)}
            className="px-4 py-2 rounded-button text-sm font-semibold text-text-muted hover:bg-primary/5 hover:text-primary transition-all"
          >
            ← {year - 1}
          </button>
          <span className="px-4 py-2 text-primary font-bold">{year}</span>
          <button
            onClick={() => setYear(year + 1)}
            className="px-4 py-2 rounded-button text-sm font-semibold text-text-muted hover:bg-primary/5 hover:text-primary transition-all"
          >
            {year + 1} →
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-text-muted text-sm font-medium">Total Members</p>
          <p className="text-3xl font-bold text-text-primary mt-2">
            {summary?.departments?.reduce((acc, dept) => acc + dept.members.length, 0) || 0}
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-text-muted text-sm font-medium">Total Contributed</p>
          <p className="text-3xl font-bold text-accent mt-2">
            {formatCurrency(
              summary?.departments?.reduce(
                (acc, dept) =>
                  acc +
                  dept.members.reduce((memberAcc, member) => {
                    const amount = typeof member.balance?.totalContributed === "string"
                      ? parseInt(member.balance.totalContributed, 10)
                      : member.balance?.totalContributed || 0;
                    return memberAcc + amount;
                  }, 0),
                0
              ) || 0
            )}
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-text-muted text-sm font-medium">Monthly Target</p>
          <p className="text-3xl font-bold text-primary mt-2">
            {formatCurrency(
              summary?.departments?.reduce((acc, dept) => {
                const amount = typeof dept.monthlyAmount === "string"
                  ? parseInt(dept.monthlyAmount, 10)
                  : dept.monthlyAmount || 0;
                return acc + amount;
              }, 0) || 0
            )}
          </p>
        </Card>
      </div>

      {/* Departments */}
      <div className="space-y-6">
        {summary?.departments?.map((dept) => (
          <Card key={dept.departmentId} className="p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">{dept.name}</h2>

            {/* Department Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-border">
              <div>
                <p className="text-text-muted text-sm">Members</p>
                <p className="text-2xl font-bold text-text-primary">{dept.members?.length || 0}</p>
              </div>
              <div>
                <p className="text-text-muted text-sm">Total Contributed</p>
                <p className="text-2xl font-bold text-accent">
                  {formatCurrency(
                    dept.members?.reduce((sum, m) => sum + (m.balance?.totalContributed || 0), 0) || 0
                  )}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-sm">Carry Forward</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    dept.members?.reduce((sum, m) => sum + (m.balance?.carryForward || 0), 0) || 0
                  )}
                </p>
              </div>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="py-3 px-4 text-left font-semibold text-text-primary">Member</th>
                    <th className="py-3 px-4 text-left font-semibold text-text-primary">Reference</th>
                    <th className="py-3 px-4 text-left font-semibold text-text-primary">Role</th>
                    <th className="py-3 px-4 text-right font-semibold text-text-primary">Months Cleared</th>
                    <th className="py-3 px-4 text-right font-semibold text-text-primary">Carry Forward</th>
                  </tr>
                </thead>
                <tbody>
                  {dept.members?.map((m, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-background transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-text-primary">{m.user.name || m.user.email}</td>
                      <td className="py-3 px-4 text-sm text-text-muted font-mono">{m.paymentReference}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${m.role === "ADMIN" ? "badge-accent" : "badge-primary"}`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-semibold text-accent">
                        {m.balance?.monthsCleared || 0} months
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-bold text-text-primary">
                        {m.balance ? formatCurrency(parseInt(m.balance.carryForward.toString()) || 0) : formatCurrency(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
