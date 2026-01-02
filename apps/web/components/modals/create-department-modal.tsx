"use client";

import React, { useState, useRef, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";

interface CreateDepartmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDepartmentModal({ onClose, onSuccess }: CreateDepartmentModalProps) {
  const { activeOrgId, setActiveDeptId } = useOrg();
  const [name, setName] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId || !name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.createDepartment(activeOrgId, {
        name: name.trim(),
        monthlyContribution: monthlyAmount ? parseFloat(monthlyAmount).toFixed(2) : null,
      });

      if ((response as any).department?.id) {
        setActiveDeptId((response as any).department.id);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create department");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">Create Department</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-background transition-colors"
          >
            <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Department Name */}
          <div>
            <label className="label">Department Name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Finance, HR, Operations"
              className="w-full px-4 py-3 bg-background border-2 border-border rounded-button text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              required
              disabled={isLoading}
            />
          </div>

          {/* Monthly Contribution Amount */}
          <div>
            <label className="label">Monthly Contribution (Optional)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                type="number"
                step="0.01"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                placeholder="Leave blank for no limit"
                className="w-full pl-12 pr-4 py-3 bg-background border-2 border-border rounded-button text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">Optional: Set a monthly contribution limit for this department</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-background border-2 border-border rounded-button text-text-primary font-semibold hover:bg-background/80 disabled:opacity-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-button font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Department
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
