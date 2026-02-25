"use client";

import React, { useState } from "react";
import { apiClient } from "@/lib/api-client";

interface StepOneProps {
  organizationId: string;
  organizationName?: string;
  onNext: () => void;
  onSkip: () => void;
}

export function StepOne_OrgProfile({ organizationId, organizationName = "", onNext, onSkip }: StepOneProps) {
  const [name, setName] = useState(organizationName);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Organization name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Update organization profile
      await apiClient.updateOrganization(organizationId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      // Mark step as complete
      await apiClient.updateOnboardingStep(organizationId, 1, "orgProfileDone");

      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          Let's set up your organization
        </h1>
        <p className="text-lg text-slate-600">
          This is how your members will identify your organization
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="org-name" className="block text-sm font-semibold text-slate-900 mb-2">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <input
            id="org-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Corporation, Community Group"
            className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            required
          />
        </div>

        <div>
          <label htmlFor="org-description" className="block text-sm font-semibold text-slate-900 mb-2">
            Description <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <textarea
            id="org-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us a bit about your organization..."
            rows={4}
            className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onSkip}
            className="order-2 sm:order-1 px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            I'll do this later
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="order-1 sm:order-2 flex-1 px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? "Saving..." : "Continue →"}
          </button>
        </div>
      </form>
    </div>
  );
}
