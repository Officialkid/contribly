"use client";

import React, { useState } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Card, Loading, Error } from "@/components/ui";

interface WithdrawalFormProps {
  onSuccess?: () => void;
  availableBalance?: number;
}

export function WithdrawalForm({
  onSuccess,
  availableBalance = 0,
}: WithdrawalFormProps) {
  const { activeOrgId, user } = useOrg();
  const [amount, setAmount] = useState<string>("");
  const [accountInfo, setAccountInfo] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId || !user) return;

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (amountCents <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (amountCents > availableBalance) {
      setError("Amount exceeds available balance");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.requestWithdrawal(activeOrgId, {
        amount: amountCents.toString(),
        accountInformation: accountInfo,
      });
      setSuccess("Withdrawal request submitted successfully!");
      setAmount("");
      setAccountInfo("");
      setTimeout(() => {
        setSuccess(null);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit withdrawal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card title="Request Withdrawal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Available Balance
          </label>
          <p className="text-2xl font-bold text-slate-900">
            ${(availableBalance / 100).toFixed(2)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Amount to Withdraw (USD)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Bank Account Information
          </label>
          <textarea
            value={accountInfo}
            onChange={(e) => setAccountInfo(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            placeholder="Account number, routing number, or bank transfer details"
            rows={3}
            required
          />
        </div>

        {error && <Error message={error} />}
        {success && (
          <div className="p-3 bg-green-100 border border-green-300 text-green-900 rounded">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition"
        >
          {isSubmitting ? "Submitting..." : "Request Withdrawal"}
        </button>
      </form>
    </Card>
  );
}
