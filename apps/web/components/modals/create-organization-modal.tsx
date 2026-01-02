"use client";

import React, { useState } from "react";
import { apiClient } from "@/lib/api-client";

interface CreateOrganizationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateOrganizationModal({ onClose, onSuccess }: CreateOrganizationModalProps) {
  const [name, setName] = useState("");
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
      await apiClient.createOrganization(name.trim());
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-large p-8 w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Create Organization</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background transition-colors"
          >
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="org-name" className="block text-sm font-semibold text-text-primary mb-2">
              Organization Name
            </label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
              className="w-full px-4 py-3 bg-background border-2 border-border rounded-button text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-button">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-background rounded-button transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-button shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Creating..." : "Create Organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
