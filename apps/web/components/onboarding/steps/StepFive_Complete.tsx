"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface StepFiveProps {
  organizationId: string;
  organizationName: string;
  completedSteps: {
    orgProfileDone: boolean;
    paymentSetupDone: boolean;
    deptCreatedDone: boolean;
    inviteSentDone: boolean;
  };
  onReturnToIncomplete: () => void;
}

export function StepFive_Complete({ organizationId, organizationName, completedSteps, onReturnToIncomplete }: StepFiveProps) {
  const router = useRouter();

  const handleGoToDashboard = () => {
    router.push(`/orgs/${organizationId}`);
  };

  const allComplete = Object.values(completedSteps).every(v => v);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
      {/* Success animation */}
      <div className="text-center mb-8">
        <div className="inline-block relative">
          {/* Animated checkmark circle */}
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-[bounce_1s_ease-in-out]">
            <svg className="w-14 h-14 text-white animate-[scale-in_0.5s_ease-out_0.5s_both]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          {/* Confetti effect - simple CSS */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-2 h-2 bg-yellow-400 rounded-full top-0 left-1/4 animate-[fall_2s_ease-in-out]" />
            <div className="absolute w-2 h-2 bg-blue-400 rounded-full top-0 right-1/4 animate-[fall_2.5s_ease-in-out]" />
            <div className="absolute w-2 h-2 bg-red-400 rounded-full top-0 left-1/2 animate-[fall_1.8s_ease-in-out]" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">
          You're all set! 🎉
        </h1>
        <p className="text-xl text-slate-600">
          Your organization is ready. Here's what you've configured:
        </p>
      </div>

      {/* Summary cards */}
      <div className="space-y-3 mb-8">
        {/* Organization Profile */}
        <div className={`flex items-start space-x-4 p-4 rounded-xl border-2 ${
          completedSteps.orgProfileDone 
            ? "bg-green-50 border-green-200" 
            : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex-shrink-0">
            {completedSteps.orgProfileDone ? (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 bg-slate-300 rounded-full" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Organization Profile</h3>
            <p className={`text-sm ${completedSteps.orgProfileDone ? "text-green-700" : "text-slate-500"}`}>
              {completedSteps.orgProfileDone ? organizationName : "Not configured"}
            </p>
          </div>
        </div>

        {/* Payment Setup */}
        <div className={`flex items-start space-x-4 p-4 rounded-xl border-2 ${
          completedSteps.paymentSetupDone 
            ? "bg-green-50 border-green-200" 
            : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex-shrink-0">
            {completedSteps.paymentSetupDone ? (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 bg-slate-300 rounded-full" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Payment Account</h3>
            <p className={`text-sm ${completedSteps.paymentSetupDone ? "text-green-700" : "text-slate-500"}`}>
              {completedSteps.paymentSetupDone ? "Payment method configured" : "Not configured"}
            </p>
          </div>
        </div>

        {/* Department Created */}
        <div className={`flex items-start space-x-4 p-4 rounded-xl border-2 ${
          completedSteps.deptCreatedDone 
            ? "bg-green-50 border-green-200" 
            : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex-shrink-0">
            {completedSteps.deptCreatedDone ? (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 bg-slate-300 rounded-full" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">First Department</h3>
            <p className={`text-sm ${completedSteps.deptCreatedDone ? "text-green-700" : "text-slate-500"}`}>
              {completedSteps.deptCreatedDone ? "Department created" : "Not created"}
            </p>
          </div>
        </div>

        {/* Invite Sent */}
        <div className={`flex items-start space-x-4 p-4 rounded-xl border-2 ${
          completedSteps.inviteSentDone 
            ? "bg-green-50 border-green-200" 
            : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex-shrink-0">
            {completedSteps.inviteSentDone ? (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 bg-slate-300 rounded-full" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Invite Link</h3>
            <p className={`text-sm ${completedSteps.inviteSentDone ? "text-green-700" : "text-slate-500"}`}>
              {completedSteps.inviteSentDone ? "Invite link generated" : "Not generated"}
            </p>
          </div>
        </div>
      </div>

      {/* Reminder if incomplete */}
      {!allComplete && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-8">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                You can complete your setup anytime from the Settings page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!allComplete && (
          <button
            onClick={onReturnToIncomplete}
            className="order-2 sm:order-1 px-6 py-3 text-base font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Complete remaining setup
          </button>
        )}
        <button
          onClick={handleGoToDashboard}
          className={`${!allComplete ? 'order-1 sm:order-2' : ''} flex-1 px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
}

// CSS animations (add to globals.css or add as style tag)
// @keyframes scale-in {
//   from {
//     transform: scale(0);
//     opacity: 0;
//   }
//   to {
//     transform: scale(1);
//     opacity: 1;
//   }
// }
//
// @keyframes fall {
//   to {
//     transform: translateY(50vh) rotate(360deg);
//     opacity: 0;
//   }
// }
