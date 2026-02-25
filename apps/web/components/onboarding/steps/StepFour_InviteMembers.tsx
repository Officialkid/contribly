"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

interface StepFourProps {
  organizationId: string;
  organizationName: string;
  departmentId: string | null;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function StepFour_InviteMembers({ organizationId, organizationName, departmentId, onNext, onSkip, onBack }: StepFourProps) {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (departmentId) {
      generateInviteLink();
    }
  }, [departmentId]);

  const generateInviteLink = async () => {
    if (!departmentId) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response: any = await apiClient.createInviteLink(organizationId, departmentId);
      const code = response.invite?.code;
      
      if (code) {
        const fullLink = `${window.location.origin}/invites/${code}`;
        setInviteLink(fullLink);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate invite link");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareViaWhatsApp = () => {
    if (!inviteLink) return;

    const message = `Hi! You've been invited to join ${organizationName} on Contribly. Click this link to join: ${inviteLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleContinue = async () => {
    // The backend automatically marks inviteSentDone when first invite is created
    onNext();
  };

  // If no department was created
  if (!departmentId) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Create a department first
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            You need to create at least one department before you can invite members.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onBack}
              className="flex-1 px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              ← Go Back
            </button>
            <button
              onClick={onSkip}
              className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          Invite your first members
        </h1>
        <p className="text-lg text-slate-600">
          Share this link with your members so they can join your organization
        </p>
      </div>

      {isGenerating ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : inviteLink ? (
        <div className="space-y-6">
          {/* Invite link display */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Your Invite Link
            </label>
            <div className="bg-white border-2 border-slate-300 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-700 break-all font-mono">
                {inviteLink}
              </p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-slate-300 hover:border-primary text-slate-700 hover:text-primary rounded-xl transition-all font-medium"
              >
                {copySuccess ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                onClick={shareViaWhatsApp}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all font-medium shadow-md"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>Share on WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  Anyone with this link can join your organization. You can create more invite links or revoke this one anytime from the settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <button
          onClick={onSkip}
          className="order-2 sm:order-1 px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
        >
          I'll invite members later
        </button>
        <button
          onClick={handleContinue}
          disabled={!inviteLink}
          className="order-1 sm:order-2 flex-1 px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Done, let's go! →
        </button>
      </div>
    </div>
  );
}
