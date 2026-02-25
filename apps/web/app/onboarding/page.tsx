"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { StepOne_OrgProfile } from "@/components/onboarding/steps/StepOne_OrgProfile";
import { StepTwo_PaymentSetup } from "@/components/onboarding/steps/StepTwo_PaymentSetup";
import { StepThree_CreateDepartment } from "@/components/onboarding/steps/StepThree_CreateDepartment";
import { StepFour_InviteMembers } from "@/components/onboarding/steps/StepFour_InviteMembers";
import { StepFive_Complete } from "@/components/onboarding/steps/StepFive_Complete";

interface OnboardingState {
  id: string;
  organizationId: string;
  currentStep: number;
  completedSteps: number[];
  isComplete: boolean;
  orgProfileDone: boolean;
  paymentSetupDone: boolean;
  deptCreatedDone: boolean;
  inviteSentDone: boolean;
  completedAt: string | null;
  percentComplete: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrg, activeOrgId, isLoading: orgLoading } = useOrg();
  
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdDepartmentId, setCreatedDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!orgLoading && activeOrgId) {
      fetchOnboardingStatus();
    }
  }, [activeOrgId, orgLoading]);

  const fetchOnboardingStatus = async () => {
    if (!activeOrgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getOnboardingStatus(activeOrgId);
      const state = response.onboarding;

      // If onboarding is complete, redirect to dashboard
      if (state.isComplete) {
        router.push(`/orgs/${activeOrgId}`);
        return;
      }

      // Check if there's a step query param to override current step
      const stepParam = searchParams?.get("step");
      if (stepParam) {
        const step = parseInt(stepParam, 10);
        if (step >= 1 && step <= 5) {
          state.currentStep = step;
        }
      }

      setOnboardingState(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load onboarding status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    // Refresh onboarding state to get updated currentStep
    await fetchOnboardingStatus();
  };

  const handleSkip = async () => {
    // Move to next step without marking current as complete
    if (onboardingState) {
      setOnboardingState({
        ...onboardingState,
        currentStep: Math.min(onboardingState.currentStep + 1, 5),
      });
    }
  };

  const handleBack = () => {
    if (onboardingState && onboardingState.currentStep > 1) {
      setOnboardingState({
        ...onboardingState,
        currentStep: onboardingState.currentStep - 1,
      });
    }
  };

  const handleDepartmentCreated = (deptId: string) => {
    setCreatedDepartmentId(deptId);
  };

  const handleReturnToIncomplete = () => {
    if (!onboardingState) return;

    // Find first incomplete step
    if (!onboardingState.orgProfileDone) {
      setOnboardingState({ ...onboardingState, currentStep: 1 });
    } else if (!onboardingState.paymentSetupDone) {
      setOnboardingState({ ...onboardingState, currentStep: 2 });
    } else if (!onboardingState.deptCreatedDone) {
      setOnboardingState({ ...onboardingState, currentStep: 3 });
    } else if (!onboardingState.inviteSentDone) {
      setOnboardingState({ ...onboardingState, currentStep: 4 });
    }
  };

  // Loading state
  if (orgLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-slate-600">Loading your setup...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => fetchOnboardingStatus()}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No active org
  if (!activeOrgId || !activeOrg) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Organization Found</h2>
          <p className="text-slate-600 mb-6">Please create an organization first.</p>
          <button
            onClick={() => router.push("/organizations")}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium"
          >
            Go to Organizations
          </button>
        </div>
      </div>
    );
  }

  // No onboarding state yet
  if (!onboardingState) {
    return null;
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Progress indicator */}
      <OnboardingProgress 
        currentStep={onboardingState.currentStep} 
        completedSteps={onboardingState.completedSteps} 
      />

      {/* Current step content */}
      <div className="animate-in slide-in-from-bottom-4 duration-300">
        {onboardingState.currentStep === 1 && (
          <StepOne_OrgProfile
            organizationId={activeOrgId}
            organizationName={activeOrg.name}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        )}

        {onboardingState.currentStep === 2 && (
          <StepTwo_PaymentSetup
            organizationId={activeOrgId}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        )}

        {onboardingState.currentStep === 3 && (
          <StepThree_CreateDepartment
            organizationId={activeOrgId}
            onNext={handleNext}
            onSkip={handleSkip}
            onDepartmentCreated={handleDepartmentCreated}
          />
        )}

        {onboardingState.currentStep === 4 && (
          <StepFour_InviteMembers
            organizationId={activeOrgId}
            organizationName={activeOrg.name}
            departmentId={createdDepartmentId}
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
          />
        )}

        {onboardingState.currentStep === 5 && (
          <StepFive_Complete
            organizationId={activeOrgId}
            organizationName={activeOrg.name}
            completedSteps={{
              orgProfileDone: onboardingState.orgProfileDone,
              paymentSetupDone: onboardingState.paymentSetupDone,
              deptCreatedDone: onboardingState.deptCreatedDone,
              inviteSentDone: onboardingState.inviteSentDone,
            }}
            onReturnToIncomplete={handleReturnToIncomplete}
          />
        )}
      </div>
    </div>
  );
}
