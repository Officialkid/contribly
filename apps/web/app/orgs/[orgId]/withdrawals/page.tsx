"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Withdrawal } from "@/lib/types";
import { Card, Loading, Error } from "@/components/ui";
import { MemberWithdrawalsView } from "@/components/member-withdrawals-view";
import { AdminWithdrawalForm } from "@/components/admin-withdrawal-form";
import { formatCurrency } from "@/lib/currency";

export default function WithdrawalsPage() {
  const { activeOrgId, activeDeptId, user } = useOrg();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!activeOrgId || !activeDeptId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch balance
        const balanceResponse = await apiClient.getMemberBalance(activeOrgId, activeDeptId, user?.id);
        const carryForward = balanceResponse.balance?.carryForward ?? 0;
        setBalance(carryForward);
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message ?? "Failed to load data";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeOrgId, activeDeptId, refreshKey]);

  const isDeptAdmin = user?.role === "ADMIN";

  const handleWithdrawalSuccess = () => {
    setSuccessMessage("Withdrawal request submitted successfully!");
    setTimeout(() => {
      setSuccessMessage(null);
      setRefreshKey((prev) => prev + 1);
    }, 2000);
  };

  if (isLoading) return <Loading message="Loading withdrawals..." />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Withdrawals</h1>
        <p className="text-gray-600 mt-1">
          {isDeptAdmin
            ? "Manage withdrawal requests with full transparency"
            : "View your withdrawal history and request withdrawals"}
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-900">
          <div className="flex gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-semibold">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Member View */}
      {!isDeptAdmin && (
        <>
          {/* Balance Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
              Available Balance
            </p>
            <p className="text-4xl font-bold text-blue-900 mt-2">
              {formatCurrency(balance)}
            </p>
            <p className="text-sm text-blue-800 mt-2">
              This is the amount you can withdraw from your account.
            </p>
          </div>

          {/* Withdrawal Form */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Request New Withdrawal</h2>
            <AdminWithdrawalForm
              availableBalance={balance}
              onSuccess={handleWithdrawalSuccess}
            />
          </div>

          {/* Withdrawal History */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Withdrawal History</h2>
            <MemberWithdrawalsView key={refreshKey} />
          </div>
        </>
      )}

      {/* Admin View */}
      {isDeptAdmin && (
        <>
          {/* Balance Card */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <p className="text-xs font-semibold text-green-900 uppercase tracking-wide">
              Department Balance
            </p>
            <p className="text-4xl font-bold text-green-900 mt-2">
              {formatCurrency(balance)}
            </p>
            <p className="text-sm text-green-800 mt-2">
              Total available for withdrawal requests.
            </p>
          </div>

          {/* Withdrawal Form for Admin */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Request Withdrawal</h2>
            <AdminWithdrawalForm
              availableBalance={balance}
              onSuccess={handleWithdrawalSuccess}
            />
          </div>

          {/* Withdrawal History */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Withdrawal Requests</h2>
            <MemberWithdrawalsView key={refreshKey} />
          </div>
        </>
      )}
    </div>
  );
}
