"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { CarryForward } from "@/lib/types";
import { Card, Badge, Loading, Error, EmptyState, Skeleton, Toast } from "@/components/ui";

export function MemberDashboard() {
  const { user, activeOrgId, activeDeptId } = useOrg();
  const [balance, setBalance] = useState<CarryForward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId || !activeDeptId || !user) {
      setIsLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getMemberBalance(activeOrgId, activeDeptId, user.id);
        setBalance(response.balance);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load balance";
        setError(message);
        setToast(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [activeOrgId, activeDeptId, user?.id]);

  if (!activeOrgId || !activeDeptId) {
    return (
      <EmptyState
        title="No Department Selected"
        message="Please select a department from the sidebar to view your contribution balance."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map((i) => (
            <div key={i} className="card p-6 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-24" />
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
  if (!balance) return <EmptyState title="No Data" message="No contribution data available" />;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">My Contributions</h1>
        <p className="text-text-muted mt-1">Track your contribution balance and status</p>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-muted uppercase tracking-wide">Monthly Amount</p>
              <p className="text-4xl font-bold text-text-primary mt-2">₦{(balance.monthlyAmount / 100).toFixed(2)}</p>
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
              <p className="text-sm font-semibold text-text-muted uppercase tracking-wide">Months Cleared</p>
              <p className="text-4xl font-bold text-accent mt-2">{balance.monthsCleared}</p>
            </div>
            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-accent font-semibold">✓ Up to date</span>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-muted uppercase tracking-wide">Pending Balance</p>
              <p className="text-4xl font-bold text-primary-light mt-2">₦{(balance.carryForward / 100).toFixed(2)}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold text-text-primary">Contribution Summary</h2>
        </div>
        <div className="card-body space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-text-muted font-medium">Total Contributed:</span>
            <span className="font-bold text-xl text-text-primary">₦{(balance.totalContributed / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-text-muted font-medium">Months Cleared:</span>
            <span className="font-bold text-xl text-accent">{balance.monthsCleared} months</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-text-muted font-medium">Carry-Forward:</span>
            <span className="font-bold text-xl text-primary">₦{(balance.carryForward / 100).toFixed(2)}</span>
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Last updated: {new Date(balance.balanceDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href={`/orgs/${activeOrgId}/departments/${activeDeptId}/contribute`}
          className="btn btn-primary flex items-center justify-center gap-2 py-3 text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Record Payment
        </a>
        <a
          href={`/orgs/${activeOrgId}/departments/${activeDeptId}/claims`}
          className="btn btn-outline flex items-center justify-center gap-2 py-3 text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Claims
        </a>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
