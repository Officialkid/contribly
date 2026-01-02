"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Withdrawal } from "@/lib/types";
import { Card, Table, Badge, Loading, Error, EmptyState } from "@/components/ui";
import { WithdrawalForm } from "@/components/withdrawal-form";

export default function WithdrawalsPage() {
  const { activeOrgId, activeDeptId, user } = useOrg();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!activeOrgId || !activeDeptId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch balance
        const balanceResponse = await apiClient.getMemberBalance(activeOrgId, {
          departmentId: activeDeptId,
        });
        setBalance(balanceResponse.balance || 0);

        // Fetch withdrawals
        const withdrawalsResponse = await apiClient.listWithdrawals(activeOrgId, {
          departmentId: activeDeptId,
        });
        setWithdrawals(withdrawalsResponse.withdrawals || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeOrgId, activeDeptId]);

  const isDeptAdmin = user?.role === "ADMIN";

  if (isLoading) return <Loading message="Loading withdrawals..." />;
  if (error) return <Error message={error} />;

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "PENDING");
  const approvedWithdrawals = withdrawals.filter((w) => w.status === "APPROVED");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Withdrawals</h1>
        <p className="text-slate-600 mt-1">
          {isDeptAdmin ? "Manage withdrawal requests" : "Request payment withdrawals"}
        </p>
      </div>

      {!isDeptAdmin && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card title="Available Balance">
              <p className="text-3xl font-bold text-slate-900">
                ${(balance / 100).toFixed(2)}
              </p>
            </Card>
          </div>

          {showForm ? (
            <WithdrawalForm
              availableBalance={balance}
              onSuccess={() => {
                setShowForm(false);
                // Refresh withdrawals
                window.location.reload();
              }}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition"
            >
              Request Withdrawal
            </button>
          )}
        </>
      )}

      {pendingWithdrawals.length > 0 && (
        <Card title="Pending Withdrawals">
          <Table
            headers={["Amount", "User", "Status", "Date"]}
            rows={pendingWithdrawals.map((w) => [
              `$${(parseFloat(w.amount) / 100).toFixed(2)}`,
              w.user?.email || "-",
              <Badge key="status" status={w.status} />,
              new Date(w.createdAt).toLocaleDateString(),
            ])}
          />
        </Card>
      )}

      {approvedWithdrawals.length > 0 && (
        <Card title="Approved Withdrawals">
          <Table
            headers={["Amount", "User", "Status", "Date"]}
            rows={approvedWithdrawals.map((w) => [
              `$${(parseFloat(w.amount) / 100).toFixed(2)}`,
              w.user?.email || "-",
              <Badge key="status" status={w.status} />,
              new Date(w.createdAt).toLocaleDateString(),
            ])}
          />
        </Card>
      )}

      {withdrawals.length === 0 && (
        <EmptyState
          title="No Withdrawals"
          message="No withdrawal requests yet"
          action={
            !isDeptAdmin
              ? { label: "Request Withdrawal", href: "#" }
              : undefined
          }
        />
      )}
    </div>
  );
}
