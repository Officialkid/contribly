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
        reference: formData.reference,
        transactionDate: new Date(formData.transactionDate).toISOString(),
        departmentId: formData.departmentId,
      });

      setSuccess("Payment recorded successfully!");
      setFormData({
        amount: "",
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

  if (!activeOrgId) {
    return <Loading message="Loading organization..." />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-600 mt-1">Manage organization payments</p>
        </div>
        {isChiefAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition"
          >
            {showForm ? "Cancel" : "Record Payment"}
          </button>
        )}
      </div>

      {success && (
        <div className="p-4 bg-green-100 border border-green-300 text-green-900 rounded">
          {success}
        </div>
      )}

      {showForm && isChiefAdmin && (
        <Card title="Record New Payment">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="Payment ref"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Transaction Date
              </label>
              <input
                type="date"
                name="transactionDate"
                value={formData.transactionDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="Department ID"
                required
              />
            </div>

            {error && <Error message={error} />}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition font-medium"
            >
              {isSubmitting ? "Recording..." : "Record Payment"}
            </button>
          </form>
        </Card>
      )}

      <PaymentsView />
    </div>
  );
}
