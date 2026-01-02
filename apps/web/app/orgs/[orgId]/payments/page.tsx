"use client";

import React, { useState } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Card, Error, Loading } from "@/components/ui";
import { PaymentsView } from "@/components/payments-view";

export default function PaymentsPage() {
  const { activeOrgId, user } = useOrg();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: "",
    currency: "KES",
    reference: "",
    transactionDate: new Date().toISOString().split("T")[0],
    departmentId: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId) return;

    const amountCents = Math.round(parseFloat(formData.amount) * 100);
    if (amountCents <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.recordPayment(activeOrgId, {
        amount: amountCents.toString(),
        currency: formData.currency,
        reference: formData.reference,
        transactionDate: new Date(formData.transactionDate).toISOString(),
        departmentId: formData.departmentId,
      });

      setSuccess("Payment recorded successfully!");
      setFormData({
        amount: "",
        currency: "KES",
        reference: "",
        transactionDate: new Date().toISOString().split("T")[0],
        departmentId: "",
      });
      setShowForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isChiefAdmin = user?.role === "CHIEF_ADMIN";

  if (!user) {
    return <Loading message="Loading account..." />;
  }

  if (!activeOrgId) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-text-primary">
        <p className="font-semibold">No organization yet.</p>
        <p className="text-sm text-text-muted">Create one or accept an invite to manage payments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Payments</h1>
          <p className="text-text-muted mt-1">Manage and record organization payments</p>
        </div>
        {isChiefAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary flex items-center gap-2"
          >
            {showForm ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Record Payment
              </>
            )}
          </button>
        )}
      </div>

      {success && (
        <div className="alert alert-success">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {showForm && isChiefAdmin && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-text-primary">Record New Payment</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Amount</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-background border-2 border-border rounded-button text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border-2 border-border rounded-button text-text-primary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  >
                    <option value="KES">Kenyan Shilling (KES)</option>
                    <option value="USD">US Dollar (USD)</option>
                  </select>
                </div>

                <div>
                  <label className="label">Reference (Optional)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-background border-2 border-border rounded-button text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      placeholder="Payment reference"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Transaction Date</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="date"
                    name="transactionDate"
                    value={formData.transactionDate}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-background border-2 border-border rounded-button text-text-primary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Department</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-background border-2 border-border rounded-button text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="Department ID"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-danger flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-primary text-white rounded-button font-bold text-base shadow-soft hover:bg-primary-dark hover:shadow-medium focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Recording...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Record Payment
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <PaymentsView />
    </div>
  );
}
