"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Payment } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { Card, Badge, Loading, Error, EmptyState } from "@/components/ui";
import { ClaimSubmissionModal } from "./claim-submission-modal";

export function UnmatchedPaymentsView() {
  const { user, activeOrgId, activeDeptId, departments } = useOrg();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);

  useEffect(() => {
    if (!activeOrgId || !activeDeptId) return;

    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.listPayments(activeOrgId, "UNMATCHED");
        const allPayments = (response as any)?.payments || [];
        
        // Filter to only UNMATCHED payments for this department
        const unmatchedPayments = allPayments.filter(
          (p: Payment) => p.status === "UNMATCHED" && p.department?.id === activeDeptId
        );
        
        setPayments(unmatchedPayments);
        setError(null);
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message ?? "Failed to load unmatched payments";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [activeOrgId, activeDeptId]);

  const handleClaimClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowClaimModal(true);
  };

  const handleClaimSuccess = () => {
    // Remove claimed payment from list
    if (selectedPayment) {
      setPayments((prev) => prev.filter((p) => p.id !== selectedPayment.id));
    }
    setShowClaimModal(false);
    setSelectedPayment(null);
  };

  if (!activeOrgId || !activeDeptId) {
    return (
      <EmptyState
        title="No Department Selected"
        message="Please select a department from the sidebar to view unmatched payments."
      />
    );
  }

  if (isLoading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Unmatched Payments</h1>
        <p className="text-text-muted mt-1">
          These payments couldn't be automatically matched to your account
        </p>
      </div>

      {/* Explanation Section */}
      <Card className="bg-blue-50 border border-blue-200">
        <div className="p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Why is my payment unmatched?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  <strong>Wrong payment reference:</strong> The reference number doesn't match your
                  account
                </li>
                <li>
                  <strong>Incorrect paybill/till:</strong> Payment sent to a different account
                </li>
                <li>
                  <strong>Typo or formatting issue:</strong> Payment details don't match exactly
                </li>
                <li>
                  <strong>Processing delay:</strong> System may still be matching your payment
                </li>
              </ul>
              <p className="text-sm text-blue-800 mt-3">
                💡 <strong>Solution:</strong> Submit a claim below with your transaction code. Our
                team will verify and match it to your account.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Unmatched Payments List */}
      {payments.length === 0 ? (
        <EmptyState
          title="No Unmatched Payments"
          message="Excellent! All your payments have been successfully matched."
          details="Your payment references and amounts are correctly matched to your account. Keep making contributions on time!"
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">
            {payments.length} {payments.length === 1 ? "Payment" : "Payments"} Awaiting Claim
          </h2>
          <div className="grid gap-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Amount */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-bold text-text-primary">
                        {formatCurrency(parseInt(payment.amount, 10))}
                      </span>
                      <Badge status="UNMATCHED" />
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-6 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                          Payment Reference
                        </p>
                        <p className="text-sm font-mono text-text-primary mt-1">
                          {payment.reference || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                          Account Number
                        </p>
                        <p className="text-sm font-mono text-text-primary mt-1">
                          {payment.accountNumber || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                          Department
                        </p>
                        <p className="text-sm text-text-primary mt-1">
                          {payment.department?.name || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                          Date
                        </p>
                        <p className="text-sm text-text-primary mt-1">
                          {new Date(payment.transactionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Help text */}
                    <div className="text-xs text-text-muted bg-background/50 p-3 rounded-md border border-border">
                      <strong>Next step:</strong> Click "Submit Claim" and provide your transaction
                      code. We'll verify the payment and match it to your account.
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleClaimClick(payment)}
                    className="ml-6 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    Submit Claim
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Claim Submission Modal */}
      {showClaimModal && selectedPayment && (
        <ClaimSubmissionModal
          payment={selectedPayment}
          onClose={() => {
            setShowClaimModal(false);
            setSelectedPayment(null);
          }}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
}
