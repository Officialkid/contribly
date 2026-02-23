"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Withdrawal } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { Card, Badge, Loading, Error, EmptyState } from "@/components/ui";

export function MemberWithdrawalsView() {
  const { activeOrgId, activeDeptId } = useOrg();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId || !activeDeptId) return;

    const fetchWithdrawals = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.listWithdrawals(activeOrgId, {
          departmentId: activeDeptId,
        });
        setWithdrawals(response.withdrawals || []);
        setError(null);
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message ?? "Failed to load withdrawals";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithdrawals();
  }, [activeOrgId, activeDeptId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL":
      case "PENDING_OTP":
        return "bg-yellow-50 border-yellow-200";
      case "APPROVED":
        return "bg-green-50 border-green-200";
      case "COMPLETED":
        return "bg-blue-50 border-blue-200";
      case "REJECTED":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <Error message={error} />;

  if (withdrawals.length === 0) {
    return (
      <EmptyState
        title="No Withdrawals Yet"
        message="You haven't requested any withdrawals."
        details="Withdrawals help you manage department or personal funds. Once you submit a withdrawal request, it will appear here with full status tracking and approval history."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900">
        <h3 className="font-semibold mb-2">Withdrawal Transparency</h3>
        <p className="text-sm">
          All withdrawal requests are recorded here. Each request requires a reason to ensure accountability and financial responsibility.
        </p>
      </div>

      <div className="grid gap-4">
        {withdrawals.map((withdrawal) => {
          const borderColor =
            withdrawal.status === "PENDING_APPROVAL" || withdrawal.status === "PENDING_OTP"
              ? "border-l-yellow-400"
              : withdrawal.status === "APPROVED" || withdrawal.status === "COMPLETED"
              ? "border-l-green-400"
              : withdrawal.status === "REJECTED"
              ? "border-l-red-400"
              : "border-l-gray-400";

          return (
            <Card
              key={withdrawal.id}
              className={`border-l-4 ${borderColor}`}
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(parseInt(withdrawal.amount))}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Requested on{" "}
                      {new Date(withdrawal.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge status={withdrawal.status} />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Reason
                      </p>
                      <p className="text-gray-900 mt-1 text-sm">
                        {withdrawal.reason || "No reason provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Withdrawal ID
                      </p>
                      <p className="text-gray-700 mt-1 text-sm font-mono text-xs">
                        {withdrawal.id}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                  <div className="text-xs text-gray-600">
                    {withdrawal.status === "COMPLETED" && (
                      <p className="text-green-700 font-medium">✓ Withdrawal completed successfully</p>
                    )}
                    {withdrawal.status === "REJECTED" && (
                      <p className="text-red-700 font-medium">✗ Withdrawal request was rejected</p>
                    )}
                    {withdrawal.status === "PENDING_APPROVAL" && (
                      <p className="text-yellow-700 font-medium">⏳ Awaiting administrator approval</p>
                    )}
                    {withdrawal.status === "PENDING_OTP" && (
                      <p className="text-yellow-700 font-medium">⏳ Awaiting security verification (OTP)</p>
                    )}
                    {withdrawal.status === "APPROVED" && (
                      <p className="text-green-700 font-medium">✓ Approved and processing</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
