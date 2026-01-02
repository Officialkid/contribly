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
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-muted uppercase tracking-wide">Total Departments</p>
              <p className="text-4xl font-bold text-text-primary mt-2">{summary.departments.length}</p>
            </div>
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-muted uppercase tracking-wide">Total Members</p>
              <p className="text-4xl font-bold text-text-primary mt-2">
                {summary.departments.reduce((sum, d) => sum + d.members.length, 0)}
              </p>
            </div>
            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-muted uppercase tracking-wide">Active Year</p>
              <p className="text-4xl font-bold text-text-primary mt-2">{summary.year}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Overview */}
      <div className="space-y-6">
        {summary.departments.map((dept) => (
          <div key={dept.departmentId} className="card">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary">{dept.name}</h2>
                <p className="text-sm text-text-muted mt-1">
                  Monthly Amount: {dept.monthlyAmount ? `₦${(parseFloat(dept.monthlyAmount) / 100).toFixed(2)}` : "No limit"}
                </p>
              </div>
              <span className="badge badge-primary">{dept.members.length} Members</span>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-bold text-text-primary uppercase tracking-wide">Member</th>
                      <th className="text-left py-3 px-4 text-sm font-bold text-text-primary uppercase tracking-wide">Reference</th>
                      <th className="text-left py-3 px-4 text-sm font-bold text-text-primary uppercase tracking-wide">Role</th>
                      <th className="text-right py-3 px-4 text-sm font-bold text-text-primary uppercase tracking-wide">Cleared</th>
                      <th className="text-right py-3 px-4 text-sm font-bold text-text-primary uppercase tracking-wide">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dept.members.map((m, idx) => (
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
                          {m.balance ? `₦${(m.balance.carryForward / 100).toFixed(2)}` : "₦0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
