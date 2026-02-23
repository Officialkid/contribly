"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Card, Loading, Error, EmptyState } from "@/components/ui";

interface PaymentAccount {
  id: string;
  accountType: "MPESA_TILL" | "MPESA_PAYBILL" | "BANK" | "OTHER";
  accountNumber: string;
  accountName: string | null;
}

export default function PaymentAccountPage() {
  const { user, activeOrgId } = useOrg();
  const [account, setAccount] = useState<PaymentAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    accountType: "BANK" as const,
    accountNumber: "",
    accountName: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!activeOrgId) return;
    fetchAccount();
  }, [activeOrgId]);

  const fetchAccount = async () => {
    if (!activeOrgId) return;
    try {
      setIsLoading(true);
      const response = await apiClient.getPaymentAccount(activeOrgId);
      if ((response as any)?.account) {
        setAccount((response as any).account);
        setFormData({
          accountType: (response as any).account.accountType,
          accountNumber: (response as any).account.accountNumber,
          accountName: (response as any).account.accountName || "",
        });
      }
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to load account";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId) return;

    setIsSaving(true);
    try {
      const response = await apiClient.setPaymentAccount(activeOrgId, {
        accountType: "TILL" as const,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName || undefined,
      });
      if ((response as any)?.account) {
        setAccount((response as any).account);
        setIsEditing(false);
      }
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to save account";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.role !== "CHIEF_ADMIN") {
    return (
      <div className="p-8">
        <Error message="Only organization admins can manage payment accounts." />
      </div>
    );
  }

  if (isLoading) return <Loading message="Loading account details..." />;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Payment Account</h1>
        <p className="text-text-muted mt-2">Manage your organization's payment account details</p>
      </div>

      {error && <Error message={error} />}

      {!isEditing && account ? (
        <Card>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">Account Type</p>
                <p className="text-lg font-semibold text-text-primary">{account.accountType}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Account Number</p>
                <p className="text-lg font-semibold text-text-primary">{account.accountNumber}</p>
              </div>
              {account.accountName && (
                <div className="col-span-2">
                  <p className="text-sm text-text-muted">Account Name</p>
                  <p className="text-lg font-semibold text-text-primary">{account.accountName}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-primary"
            >
              Edit Account Details
            </button>
          </div>
        </Card>
      ) : (
        <Card title={account ? "Edit Payment Account" : "Set Up Payment Account"}>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Account Type</label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                className="w-full px-4 py-2 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none"
                required
              >
                <option value="BANK">Bank Account</option>
                <option value="MPESA_PAYBILL">M-Pesa Paybill</option>
                <option value="MPESA_TILL">M-Pesa Till</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="e.g., 123456 or 1234567890"
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Account Name (optional)</label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="e.g., ACME Corp Savings"
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={isSaving} className="btn btn-primary">
                {isSaving ? "Saving..." : "Save Account Details"}
              </button>
              {account && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
