"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Card, Loading, Error, Toast, EmptyState } from "@/components/ui";

interface PaymentAccountSetupProps {
  activeOrgId: string;
}

export function PaymentAccountSetup({ activeOrgId }: PaymentAccountSetupProps) {
  const [accountType, setAccountType] = useState<"PAYBILL" | "TILL">("PAYBILL");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState<any>(null);

  useEffect(() => {
    const loadPaymentAccount = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.getPaymentAccount(activeOrgId);
        if ((response as any).account) {
          setCurrentAccount((response as any).account);
          setAccountType((response as any).account.accountType);
          setAccountNumber((response as any).account.accountNumber);
          setAccountName((response as any).account.accountName || "");
          setBankName((response as any).account.bankName || null);
        }
      } catch (_) {
        // Payment account might not exist yet
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentAccount();
  }, [activeOrgId]);

  const detectBank = async (accountNum: string) => {
    // Simulated bank detection - in real app, call bank verification API
    if (accountNum.length >= 5) {
      // Example: first 5 digits determine bank (Kenya specific)
      const bankMap: { [key: string]: string } = {
        "1000": "KCB",
        "1001": "DTB",
        "1002": "Equity",
        "1003": "Safaricom",
        "1004": "Standard Chartered",
      };
      const detectedBank = Object.entries(bankMap).find(([code]) =>
        accountNum.startsWith(code)
      )?.[1];
      setBankName(detectedBank || "Unknown Bank");
    }
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccountNumber(value);
    if (value.length > 0) {
      detectBank(value);
    } else {
      setBankName(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      setError("Account number is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.setPaymentAccount(activeOrgId, {
        accountType,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim() || undefined,
      });

      setSuccess("Payment account saved successfully!");
      setCurrentAccount({ accountType, accountNumber, accountName, bankName });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save payment account");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading message="Loading payment account..." />;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Payment Account Setup</h1>
        <p className="text-text-muted mt-1">Configure how members will send you payments</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* Current Account Info */}
      {currentAccount && (
        <div className="card bg-green-50 border border-green-200">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-900">Account Configured</p>
                <p className="text-xs text-green-700">Members know where to send payments</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-green-900">Type:</span>{" "}
                <span className="text-green-700">{currentAccount.accountType}</span>
              </p>
              <p>
                <span className="font-semibold text-green-900">Account Number:</span>{" "}
                <span className="text-green-700 font-mono">{currentAccount.accountNumber}</span>
              </p>
              {currentAccount.accountName && (
                <p>
                  <span className="font-semibold text-green-900">Account Name:</span>{" "}
                  <span className="text-green-700">{currentAccount.accountName}</span>
                </p>
              )}
              {currentAccount.bankName && (
                <p>
                  <span className="font-semibold text-green-900">Bank:</span>{" "}
                  <span className="text-green-700">{currentAccount.bankName}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Setup Form */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold text-text-primary">
            {currentAccount ? "Update Payment Account" : "Configure Payment Account"}
          </h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Account Type Selection */}
            <div>
              <label className="label">Account Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAccountType("PAYBILL")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    accountType === "PAYBILL"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary"
                  }`}
                >
                  <div className="font-semibold text-text-primary">Paybill</div>
                  <p className="text-xs text-text-muted mt-1">For Safaricom M-Pesa payments</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("TILL")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    accountType === "TILL"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary"
                  }`}
                >
                  <div className="font-semibold text-text-primary">Till</div>
                  <p className="text-xs text-text-muted mt-1">For Safaricom M-Pesa Buy Goods</p>
                </button>
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label className="label">
                {accountType === "PAYBILL" ? "Paybill Number" : "Till Number"}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={handleAccountNumberChange}
                placeholder={accountType === "PAYBILL" ? "e.g., 123456" : "e.g., 654321"}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-button text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                required
                disabled={isSaving}
              />
            </div>

            {/* Detected Bank */}
            {bankName && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold text-blue-900">Detected Bank:</span>{" "}
                  <span className="text-blue-700">{bankName}</span>
                </p>
              </div>
            )}

            {/* Account Name */}
            <div>
              <label className="label">Account Name (Optional)</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., My Organization"
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-button text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                disabled={isSaving}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving || !accountNumber.trim()}
              className="w-full py-3 bg-primary text-white rounded-button font-bold text-base shadow-soft hover:bg-primary-dark hover:shadow-medium focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {currentAccount ? "Update Account" : "Save Account"}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Help Text */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="card-body">
          <h3 className="font-semibold text-blue-900 mb-2">What's the difference?</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li><strong>Paybill:</strong> Best for regular/recurring payments (subscriptions)</li>
            <li><strong>Till:</strong> Best for one-time or irregular purchases</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
