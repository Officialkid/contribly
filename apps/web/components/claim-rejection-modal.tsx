"use client";

import React, { useState } from "react";
import { PaymentClaim } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { Card } from "@/components/ui";

interface ClaimRejectionModalProps {
  claim: PaymentClaim;
  isProcessing: boolean;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export function ClaimRejectionModal({
  claim,
  isProcessing,
  onConfirm,
  onCancel,
}: ClaimRejectionModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const predefinedReasons = [
    "Transaction code doesn't match our records",
    "Amount doesn't match the payment",
    "Payment already matched to another member",
    "Insufficient information provided",
    "Payment appears to be from a different source",
    "Unable to verify transaction",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    try {
      setError(null);
      await onConfirm(reason);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to reject claim";
      setError(message);
    }
  };

  const paymentAmountInCents = parseInt(claim.payment.amount, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-2xl mx-4 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Reject Claim</h2>
            <p className="text-text-muted mt-2">
              Provide a reason for rejecting this claim. The member will be notified.
            </p>
          </div>

          {/* Claim Summary */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">
                  Member
                </p>
                <p className="text-sm font-semibold text-red-900 mt-2">
                  {claim.user?.name || claim.user?.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">
                  Amount
                </p>
                <p className="text-lg font-bold text-red-900 mt-1">
                  {formatCurrency(paymentAmountInCents)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">
                  Transaction Code
                </p>
                <p className="text-sm font-mono text-red-900 mt-2 break-all">
                  {claim.transactionCode}
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-3">
              Rejection Reason <span className="text-red-500">*</span>
            </label>

            {/* Predefined Reasons */}
            <div className="space-y-2 mb-4">
              {predefinedReasons.map((predefinedReason) => (
                <label
                  key={predefinedReason}
                  className="flex items-center p-3 border-2 border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <input
                    type="radio"
                    name="predefinedReason"
                    value={predefinedReason}
                    checked={reason === predefinedReason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="ml-3 text-sm text-text-primary">{predefinedReason}</span>
                </label>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">Or provide a custom reason</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Custom Reason */}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter a detailed reason for rejection..."
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
            <p className="text-xs text-text-muted mt-2">
              Be respectful and specific. The member will see this reason.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Note:</strong> This action cannot be undone. The member will be able to
              submit a new claim with additional information.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 border border-border rounded-lg font-semibold text-text-primary hover:bg-background/50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !reason.trim()}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Rejecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject Claim
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
