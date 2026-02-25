"use client";

import React, { useState } from "react";
import { apiClient } from "@/lib/api-client";

interface StepThreeProps {
  organizationId: string;
  onNext: () => void;
  onSkip: () => void;
  onDepartmentCreated: (deptId: string) => void;
}

export function StepThree_CreateDepartment({ organizationId, onNext, onSkip, onDepartmentCreated }: StepThreeProps) {
  const [name, setName] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Department name is required");
      return;
    }

    if (!monthlyContribution.trim() || parseFloat(monthlyContribution) <= 0) {
      setError("Please enter a valid contribution amount");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create department
      const response: any = await apiClient.createDepartment(organizationId, {
        name: name.trim(),
        monthlyContribution: monthlyContribution,
      });

      const departmentId = response.department?.id;
      
      if (departmentId) {
        onDepartmentCreated(departmentId);
      }

      // The backend automatically marks deptCreatedDone when first department is created
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create department");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          Create your first department
        </h1>
        <p className="text-lg text-slate-600">
          Departments group members with the same contribution amount. You can create more later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="dept-name" className="block text-sm font-semibold text-slate-900 mb-2">
            Department Name <span className="text-red-500">*</span>
          </label>
          <input
            id="dept-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Finance Team, All Staff, Youth Group"
            className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            required
          />
          <p className="mt-2 text-sm text-slate-500">
            Choose a name that describes the group of members
          </p>
        </div>

        <div>
          <label htmlFor="monthly-amount" className="block text-sm font-semibold text-slate-900 mb-2">
            Monthly Contribution Amount (KES) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
              KES
            </span>
            <input
              id="monthly-amount"
              type="number"
              step="0.01"
              min="0"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              placeholder="0.00"
              className="w-full pl-16 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              required
            />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            All members in this department will contribute this amount monthly
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> You can create multiple departments later for different groups with different contribution amounts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onSkip}
            className="order-2 sm:order-1 px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            I'll create departments later
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !monthlyContribution}
            className="order-1 sm:order-2 flex-1 px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? "Creating..." : "Create Department →"}
          </button>
        </div>
      </form>
    </div>
  );
}
