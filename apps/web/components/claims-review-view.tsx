"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/lib/toast-context";
import { PaymentClaim } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { Card, Badge, Loading, Error, EmptyState } from "@/components/ui";
import { ClaimRejectionModal } from "./claim-rejection-modal";

interface ClaimsReviewViewProps {
  isDepartmentView?: boolean;
}

export function ClaimsReviewView({ isDepartmentView = false }: ClaimsReviewViewProps) {
  const { user, activeOrgId, activeDeptId } = useOrg();
  const { showToast } = useToast();
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<PaymentClaim | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId || !activeDeptId) return;

    const fetchClaims = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.listClaims(activeOrgId, activeDeptId);
        const allClaims = (response as any)?.claims || [];
        
        // Filter to pending claims only
        const pendingClaims = allClaims.filter((c: PaymentClaim) => c.status === "PENDING");
        
        setClaims(pendingClaims);
        setError(null);
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message ?? "Failed to load claims";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaims();
  }, [activeOrgId, activeDeptId]);

  const handleApprove = async (claimId: string) => {
    if (!activeOrgId) return;

    setProcessingId(claimId);
    try {
      await apiClient.approveClaim(activeOrgId, claimId);
      
      // Optimistic update
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
      setSuccessMessage("✓ Claim approved successfully");
      showToast("Claim approved successfully", "success", 4000);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to approve claim";
      setError(message);
      showToast(message, "error", 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (claim: PaymentClaim) => {
    setSelectedClaim(claim);
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!activeOrgId || !selectedClaim) return;

    setRejectingId(selectedClaim.id);
    try {
      await apiClient.rejectClaim(activeOrgId, selectedClaim.id, reason);
      
      // Optimistic update
      setClaims((prev) => prev.filter((c) => c.id !== selectedClaim.id));
      setSuccessMessage("✓ Claim rejected");
      showToast("Claim rejected with reason provided", "success", 4000);
      setShowRejectionModal(false);
      setSelectedClaim(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to reject claim";
      setError(message);
      showToast(message, "error", 5000);
    } finally {
      setRejectingId(null);
    }
  };

  if (!activeOrgId || !activeDeptId) {
    return (
      <EmptyState
        title="Select a Department"
        message="No department is currently selected."
        details="Choose a department from the sidebar to review and manage member payment claims."
      />
    );
  }

  if (isLoading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Claim Review Queue</h1>
        <p className="text-text-muted mt-1">
          Review and verify member payment claims
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 font-semibold">
          {successMessage}
        </div>
      )}

      {/* Claims List */}
      {claims.length === 0 ? (
        <EmptyState
          title="No Pending Claims"
          message="All payment claims have been reviewed."
          details="Members will submit claims for unmatched payments. Once submitted, they will appear here for your review and action."
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-text-primary">
              {claims.length} {claims.length === 1 ? "Claim" : "Claims"} Pending Review
            </p>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
              Awaiting Action
            </span>
          </div>

          {claims.map((claim) => {
            const paymentAmountInCents = parseInt(claim.payment.amount, 10);
            
            return (
              <Card key={claim.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header with Member Info */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        {claim.user?.name || claim.user?.email || "Unknown Member"}
                      </h3>
                      <p className="text-sm text-text-muted mt-1">{claim.user?.email}</p>
                      <div className="flex gap-2 mt-3">
                        <Badge status="PENDING" />
                        <span className="text-xs text-text-muted">
                          Submitted {new Date(claim.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(paymentAmountInCents)}
                      </p>
                      <p className="text-xs text-text-muted mt-1">Payment Amount</p>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Payment Details (Left) */}
                    <div>
                      <h4 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Payment Details
                      </h4>
                      <div className="space-y-4 bg-background/50 p-4 rounded-lg border border-border">
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                            Amount
                          </p>
                          <p className="text-lg font-bold text-text-primary mt-1">
                            {formatCurrency(paymentAmountInCents)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                            Date
                          </p>
                          <p className="text-sm text-text-primary mt-1">
                            {new Date(claim.payment.transactionDate).toLocaleDateString()}
                          </p>
                        </div>
                        {claim.payment.reference && (
                          <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                              Reference Provided
                            </p>
                            <p className="text-sm font-mono text-text-primary mt-1 break-all">
                              {claim.payment.reference}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Claim Details (Right) */}
                    <div>
                      <h4 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Claim Details
                      </h4>
                      <div className="space-y-4 bg-background/50 p-4 rounded-lg border border-border">
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                            Transaction Code
                          </p>
                          <p className="text-sm font-mono text-text-primary mt-1 break-all">
                            {claim.transactionCode}
                          </p>
                        </div>
                        {claim.details && (
                          <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                              Additional Info
                            </p>
                            <p className="text-sm text-text-primary mt-1">{claim.details}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                            Submitted
                          </p>
                          <p className="text-sm text-text-primary mt-1">
                            {new Date(claim.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-border">
                    <button
                      onClick={() => handleApprove(claim.id)}
                      disabled={processingId === claim.id || rejectingId === claim.id}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processingId === claim.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve Claim
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRejectClick(claim)}
                      disabled={processingId === claim.id || rejectingId === claim.id}
                      className="flex-1 px-6 py-3 border-2 border-red-600 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rejectingId === claim.id ? "Processing..." : "Reject"}
                    </button>
                  </div>

                  {/* Verification Hint */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Verification tip:</strong> Compare the payment reference with the
                      transaction code. Verify the amount matches and dates align.
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedClaim && (
        <ClaimRejectionModal
          claim={selectedClaim}
          isProcessing={rejectingId === selectedClaim.id}
          onConfirm={handleRejectConfirm}
          onCancel={() => {
            setShowRejectionModal(false);
            setSelectedClaim(null);
          }}
        />
      )}
    </div>
  );
}
