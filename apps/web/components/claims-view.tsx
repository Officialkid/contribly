"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { PaymentClaim } from "@/lib/types";
import { Card, Table, Badge, Loading, Error, EmptyState } from "@/components/ui";

interface ClaimsViewProps {
  showApprovalActions?: boolean; // for dept admins
}

export function ClaimsView({ showApprovalActions = false }: ClaimsViewProps) {
  const { activeOrgId, activeDeptId } = useOrg();
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId || !activeDeptId) return;

    const fetchClaims = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.listClaims(activeOrgId, activeDeptId);
        setClaims(response.claims || []);
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
    setApproving(claimId);
    try {
      await apiClient.approveClaim(activeOrgId, claimId);
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to approve claim";
      setError(message);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (claimId: string) => {
    if (!activeOrgId) return;
    setApproving(claimId);
    try {
      await apiClient.rejectClaim(activeOrgId, claimId);
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to reject claim";
      setError(message);
    } finally {
      setApproving(null);
    }
  };

  if (isLoading) return <Loading message="Loading claims..." />;
  if (error) return <Error message={error} />;

  const pendingClaims = claims.filter((c) => c.status === "PENDING");

  return (
    <div className="space-y-6">
      <Card title="Payment Claims">
        <Table
          headers={[
            "Amount",
            "User",
            "Status",
            "Date",
            ...(showApprovalActions ? ["Action"] : []),
          ]}
          rows={pendingClaims.map((claim) => [
            `$${(parseFloat(claim.payment.amount) / 100).toFixed(2)}`,
            claim.user?.email || "-",
            <Badge key="status" status={claim.status} />,
            new Date(claim.payment.transactionDate || claim.submittedAt).toLocaleDateString(),
            ...(showApprovalActions
              ? [
                  <div key="actions" className="flex gap-2">
                    <button
                      onClick={() => handleApprove(claim.id)}
                      disabled={approving === claim.id}
                      className="text-green-600 hover:underline text-sm disabled:opacity-50"
                    >
                      {approving === claim.id ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(claim.id)}
                      disabled={approving === claim.id}
                      className="text-red-600 hover:underline text-sm disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>,
                ]
              : []),
          ])}
        />
      </Card>

      {pendingClaims.length === 0 && (
        <EmptyState
          title="No Pending Claims"
          message="All payment claims have been processed"
        />
      )}
    </div>
  );
}
