"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Payment } from "@/lib/types";
import { Card, Table, Badge, Loading, Error, EmptyState } from "@/components/ui";

export function PaymentsView() {
  const { activeOrgId } = useOrg();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<"MATCHED" | "UNMATCHED" | "CLAIMED" | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId) return;

    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.listPayments(activeOrgId, filter || undefined);
        setPayments(response.payments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load payments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [activeOrgId, filter]);

  if (isLoading) return <Loading message="Loading payments..." />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("")}
          className={`px-4 py-2 rounded text-sm transition ${
            filter === "" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-900"
          }`}
        >
          All
        </button>
        {(["MATCHED", "UNMATCHED", "CLAIMED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded text-sm transition ${
              filter === status ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-900"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <Card title="Payments">
        <Table
          headers={["Amount", "Reference", "Status", "Department", "Date", "Action"]}
          rows={payments.map((p) => [
            `$${(parseFloat(p.amount) / 100).toFixed(2)}`,
            p.reference || "-",
            <Badge key="status" status={p.status} />,
            p.department?.name || "-",
            new Date(p.transactionDate).toLocaleDateString(),
            <a
              key="link"
              href={`/orgs/${activeOrgId}/payments/${p.id}`}
              className="text-blue-600 hover:underline text-sm"
            >
              View
            </a>,
          ])}
        />
      </Card>

      {payments.length === 0 && (
        <EmptyState
          title="No Payments"
          message={`No ${filter || "payments"} found`}
          action={{ label: "Record Payment", href: `/orgs/${activeOrgId}/payments/new` }}
        />
      )}
    </div>
  );
}
