"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { DepartmentContributions } from "@/lib/types";
import { Card, Table, Badge, Loading, Error, EmptyState, Skeleton, Toast } from "@/components/ui";

export function DeptAdminDashboard() {
  const { activeOrgId, activeDeptId } = useOrg();
  const [summary, setSummary] = useState<DepartmentContributions | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId || !activeDeptId) {
      setIsLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getDepartmentContributions(activeOrgId, activeDeptId, year);
        setSummary(response.summary);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load summary";
        setError(message);
        setToast(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [activeOrgId, activeDeptId, year]);

  if (!activeOrgId || !activeDeptId) {
    return (
      <EmptyState
        title="No Department Selected"
        message="Please select a department from the sidebar to view its contribution details."
      />
    );
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map((i) => (
            <div key={i} className="card p-6 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
        <div className="card p-6 space-y-3">
          <Skeleton className="h-5 w-48" />
          {[1,2,3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <Error message={error} />;
  if (!summary) return <EmptyState title="No Data" message="No contribution data available" />;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{summary.name}</h1>
          <p className="text-text-muted mt-1">Department administration for {year}</p>
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

      {/* Department Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-muted uppercase tracking-wide">Monthly Amount</p>
              <p className="text-4xl font-bold text-text-primary mt-2">₦{(parseFloat(summary.monthlyAmount || "0") / 100).toFixed(2)}</p>
            </div>
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-muted uppercase tracking-wide">Total Members</p>
              <p className="text-4xl font-bold text-text-primary mt-2">{summary.members.length}</p>
            </div>
            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Member Balances */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Member Balances</h2>
          <span className="badge badge-primary">{summary.members.length} Members</span>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-bold text-text-primary uppercase tracking-wide">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-text-primary uppercase tracking-wide">Payment Ref</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-text-primary uppercase tracking-wide">Role</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-text-primary uppercase tracking-wide">Cleared</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-text-primary uppercase tracking-wide">Balance</th>
                </tr>
              </thead>
              <tbody>
                {summary.members.map((m, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-background transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-text-primary">{m.user.name || m.user.email}</td>
                    <td className="py-3 px-4 text-sm text-text-muted font-mono">{m.paymentReference}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${m.role === 'ADMIN' ? 'badge-accent' : 'badge-primary'}`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-accent">
                      {m.balance?.monthsCleared || 0} months
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-bold text-text-primary">
                      {m.balance ? `₦${(m.balance.carryForward).toFixed(2)}` : "₦0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href={`/orgs/${activeOrgId}/departments/${activeDeptId}/invite`}
          className="btn btn-primary flex items-center justify-center gap-2 py-3 text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Generate Invite
        </a>
        <a
          href={`/orgs/${activeOrgId}/withdrawals/new`}
          className="btn btn-accent flex items-center justify-center gap-2 py-3 text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Request Withdrawal
        </a>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
