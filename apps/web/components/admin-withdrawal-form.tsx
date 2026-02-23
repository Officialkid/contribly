"use client";

import React, { useState } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/lib/toast-context";
import { formatCurrency } from "@/lib/currency";
import { Card, Error } from "@/components/ui";

interface WithdrawalConfirmationModalProps {
  amount: string;
  reason: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isProcessing: boolean;
}

function WithdrawalConfirmationModal({
  amount,
  reason,
  onConfirm,
  onCancel,
  isProcessing,
}: WithdrawalConfirmationModalProps) {
  const amountCents = Math.round(parseFloat(amount) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md shadow-xl">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Confirm Withdrawal</h2>
            <p className="text-gray-600 text-sm mt-1">
              Please review the details below before confirming this withdrawal request.
            </p>
          </div>

          {/* Withdrawal Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                Withdrawal Amount
              </p>
              <p className="text-3xl font-bold text-blue-900 mt-1">
                {formatCurrency(amountCents)}
              </p>
            </div>

            <div className="border-t border-blue-200 pt-4">
              <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                Reason for Withdrawal
              </p>
              <p className="text-gray-900 mt-2 text-sm font-medium">
                {reason || "Not provided"}
              </p>
            </div>
          </div>

          {/* Trust & Accountability Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-semibold text-amber-900 text-sm">Accountability Notice</p>
                <p className="text-amber-800 text-xs mt-1">
                  This withdrawal is recorded for transparency and accountability. All withdrawals are tracked and auditable.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {isProcessing ? "Processing..." : "Confirm Withdrawal"}
            </button>
          </div>

          <p className="text-xs text-gray-600 text-center">
            By confirming, you acknowledge responsibility for this withdrawal.
          </p>
        </div>
      </Card>
    </div>
  );
}

interface AdminWithdrawalFormProps {
  availableBalance?: number;
  onSuccess?: () => void;
}

export function AdminWithdrawalForm({
  availableBalance = 0,
  onSuccess,
}: AdminWithdrawalFormProps) {
  const { activeOrgId, activeDeptId } = useOrg();
  const { showToast } = useToast();
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountCents = Math.round(parseFloat(amount) * 100);

    // Validation
    if (!amount || amountCents <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (amountCents > availableBalance) {
      setError("Amount exceeds available balance");
      return;
    }

    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }

    // Show confirmation modal
    setShowConfirmation(true);
  };

  const handleConfirmWithdrawal = async () => {
    if (!activeOrgId || !activeDeptId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      await apiClient.requestWithdrawal(activeOrgId, {
        departmentId: activeDeptId,
        amount: amountCents.toString(),
        reason: reason.trim(),
      });

      // Reset form
      setAmount("");
      setReason("");
      setShowConfirmation(false);

      // Show success toast
      const formattedAmount = formatCurrency(amountCents);
      showToast(`Withdrawal of ${formattedAmount} requested successfully!`, "success", 4000);

      // Show success message
      setTimeout(() => {
        onSuccess?.();
      }, 500);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to request withdrawal";
      setError(message);
      showToast(message, "error", 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card title="Request Withdrawal">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Available Balance Display */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-green-900 uppercase tracking-wide">
              Available Balance
            </p>
            <p className="text-3xl font-bold text-green-900 mt-2">
              {formatCurrency(availableBalance)}
            </p>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Amount to Withdraw (KES)
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              Available: {formatCurrency(availableBalance)}
            </p>
          </div>

          {/* Reason Field - MANDATORY */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Reason for Withdrawal
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="e.g., Monthly operating expenses, Member payout, Emergency fund transfer"
              rows={4}
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              Required for accountability. Be specific about the purpose.
            </p>
          </div>

          {/* Accountability Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" />
              </svg>
              <div>
                <p className="font-semibold text-blue-900 text-sm">Transparency Requirement</p>
                <p className="text-blue-800 text-xs mt-1">
                  All withdrawals must include a clear reason. This creates accountability and helps members understand fund usage.
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && <Error message={error} />}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? "Processing..." : "Review & Request Withdrawal"}
          </button>
        </form>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <WithdrawalConfirmationModal
          amount={amount}
          reason={reason}
          onConfirm={handleConfirmWithdrawal}
          onCancel={() => {
            setShowConfirmation(false);
            setIsSubmitting(false);
          }}
          isProcessing={isSubmitting}
        />
      )}
    </>
  );
}
