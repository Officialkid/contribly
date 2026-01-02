"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateOrganizationModal } from "@/components/modals/create-organization-modal";
import { useOrg } from "@/lib/org-context";

export function OnboardingView() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();
  const { refetchOrgs } = useOrg();

  const handleCreateSuccess = async () => {
    await refetchOrgs();
    router.refresh();
  };

  const handleAcceptInvite = () => {
    router.push("/invite");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-large p-8 md:p-12 text-center space-y-6">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-soft">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
              Welcome to Contribly
            </h1>
            <p className="text-lg text-text-muted max-w-lg mx-auto">
              Get started by creating your organization or accepting an invitation to join an existing one.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-4 pt-4">
            {/* Create Organization Card */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="group p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 hover:border-primary hover:shadow-soft rounded-button transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-primary">Create Organization</h3>
              </div>
              <p className="text-sm text-text-muted">
                Start fresh by creating a new organization. You'll be the Chief Admin with full control.
              </p>
            </button>

            {/* Accept Invite Card */}
            <button
              onClick={handleAcceptInvite}
              className="group p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-2 border-accent/20 hover:border-accent hover:shadow-soft rounded-button transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-accent/10 group-hover:bg-accent/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-accent">Accept Invite</h3>
              </div>
              <p className="text-sm text-text-muted">
                Have an invitation code? Join an existing organization as a member or admin.
              </p>
            </button>
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-text-muted">
              Need help? Contact your organization administrator or check our{" "}
              <a href="/help" className="text-primary hover:underline font-semibold">
                help center
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
