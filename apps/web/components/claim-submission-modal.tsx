"use client";

import React, { useState } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/lib/toast-context";
import { Payment } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { Card } from "@/components/ui";

interface ClaimSubmissionModalProps {
  payment: Payment;
  onClose: () => void;
  onSuccess: () => void;
}

type SubmissionStep = "form" | "success" | "error";

export function ClaimSubmissionModal({ payment, onClose, onSuccess }: ClaimSubmissionModalProps) {
  const { user, activeOrgId, activeDeptId } = useOrg();
  const { showToast } = useToast();
  const [step, setStep] = useState<SubmissionStep>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [claimId, setClaimId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    transactionCode: "",
    details: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.transactionCode.trim()) {
      setErrorMessage("Transaction code is required");
      return;
    }

    if (!activeOrgId || !activeDeptId) {
      setErrorMessage("Missing organization or department context");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.submitClaim(
        activeOrgId,
        activeDeptId,
        payment.id,
        formData.transactionCode.trim(),
        formData.details.trim() || undefined
      );

      const responseData = (response as any)?.claim;
      if (responseData?.id) {
        setClaimId(responseData.id);
        setStep("success");
        // Show success toast
        showToast("Claim submitted successfully! Awaiting review.", "success", 4000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to submit claim";
      setErrorMessage(message);
      setStep("error");
      showToast(message, "error", 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    onSuccess();
    onClose();
  };

  const handleErrorRetry = () => {
    setStep("form");
    setErrorMessage(null);
  };

  const paymentAmountInCents = parseInt(payment.amount, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-2xl mx-4 p-8 max-h-[90vh] overflow-y-auto">
        {/* Form Step */}
        {step === "form" && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary">Submit Payment Claim</h2>
              <p className="text-text-muted mt-2">
                Provide details to verify your payment and match it to your account
              </p>
            </div>

            {/* Payment Summary */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Payment Amount
                  </p>
                  <p className="text-2xl font-bold text-primary mt-2">
                    {formatCurrency(paymentAmountInCents)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Payment Date
                  </p>
                  <p className="text-lg font-semibold text-text-primary mt-2">
                    {new Date(payment.transactionDate).toLocaleDateString()}
                  </p>
                </div>
                {payment.reference && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                      Reference Provided
                    </p>
                    <p className="text-sm font-mono text-text-primary mt-2">{payment.reference}</p>
                  </div>
                )}
                {payment.accountNumber && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                      Account Used
                    </p>
                    <p className="text-sm font-mono text-text-primary mt-2">{payment.accountNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Transaction Code */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Transaction Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="transactionCode"
                  value={formData.transactionCode}
                  onChange={handleInputChange}
                  placeholder="Enter your transaction code or M-Pesa reference number"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-text-muted mt-2">
                  This is the confirmation code from your payment (e.g., M-Pesa reference, bank
                  transaction ID)
                </p>
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  placeholder="Anything else that might help us identify your payment..."
                  rows={4}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
                <p className="text-xs text-text-muted mt-2">
                  For example: "Paid from different M-Pesa account" or "Account number might be
                  different"
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border border-border rounded-lg font-semibold text-text-primary hover:bg-background/50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Claim"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Success Step */}
        {step === "success" && (
          <>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-text-primary mb-2">Claim Submitted Successfully!</h2>
              <p className="text-text-muted mb-6">
                We've received your claim. Our team will review it and match the payment to your
                account.
              </p>

              {/* Claim Details */}
              <div className="bg-background/50 border border-border rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-text-primary mb-4">What Happens Next?</h3>
                <ul className="space-y-3 text-sm text-text-muted">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">1.</span>
                    <span>Admin team verifies your transaction code</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">2.</span>
                    <span>Payment is matched to your account and department</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold flex-shrink-0">3.</span>
                    <span>You'll receive a notification once it's approved</span>
                  </li>
                </ul>
              </div>

              {/* Status Reference */}
              <div className="mb-8">
                <p className="text-xs text-text-muted mb-2">CLAIM ID</p>
                <p className="text-sm font-mono text-text-primary">{claimId || "—"}</p>
                <p className="text-xs text-text-muted mt-4">Keep this ID for your reference</p>
              </div>

              {/* Close Button */}
              <button
                onClick={handleSuccessClose}
                className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}

        {/* Error Step */}
        {step === "error" && (
          <>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-text-primary mb-2">Submission Failed</h2>
              <p className="text-text-muted mb-6">{errorMessage}</p>

              {/* Suggestions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-left">
                <h3 className="font-semibold text-yellow-900 mb-2">Try These Steps:</h3>
                <ul className="text-sm text-yellow-800 space-y-2">
                  <li>• Check your transaction code is correct</li>
                  <li>• Make sure you're claiming the right payment</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-border rounded-lg font-semibold text-text-primary hover:bg-background/50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleErrorRetry}
                  className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
