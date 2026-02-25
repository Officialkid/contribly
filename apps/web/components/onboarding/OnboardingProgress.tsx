"use client";

import React from "react";

interface OnboardingProgressProps {
  currentStep: number;
  completedSteps: number[];
}

const steps = [
  { number: 1, label: "Your Organization" },
  { number: 2, label: "Payment Setup" },
  { number: 3, label: "First Department" },
  { number: 4, label: "Invite Members" },
  { number: 5, label: "All Done!" },
];

export function OnboardingProgress({ currentStep, completedSteps }: OnboardingProgressProps) {
  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) return "completed";
    if (stepNumber === currentStep) return "current";
    return "upcoming";
  };

  return (
    <div className="mb-12">
      {/* Desktop view - horizontal stepper */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.number);
            const isCompleted = status === "completed";
            const isCurrent = status === "current";
            const isLast = index === steps.length - 1;

            return (
              <React.Fragment key={step.number}>
                {/* Step circle */}
                <div className="flex flex-col items-center relative">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${
                        isCompleted
                          ? "bg-primary text-white shadow-lg scale-105"
                          : isCurrent
                          ? "bg-white border-4 border-primary text-primary shadow-lg animate-pulse"
                          : "bg-slate-200 text-slate-500"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span className="font-bold text-lg">{step.number}</span>
                    )}
                  </div>
                  <span
                    className={`
                      mt-3 text-sm font-medium text-center max-w-[120px] transition-colors
                      ${isCurrent ? "text-primary font-semibold" : isCompleted ? "text-slate-700" : "text-slate-500"}
                    `}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className={`
                      flex-1 h-1 mx-2 transition-all duration-500
                      ${completedSteps.includes(step.number) ? "bg-primary" : "bg-slate-200"}
                    `}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile view - show only current step */}
      <div className="sm:hidden">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(completedSteps.length / 4) * 100}%` }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                bg-white border-4 border-primary text-primary shadow-lg
              `}
            >
              <span className="font-bold">{currentStep}</span>
            </div>
            <span className="text-sm font-medium text-slate-700">
              {steps[currentStep - 1]?.label}
            </span>
          </div>
        </div>
        <div className="text-center mt-3 text-xs text-slate-500">
          Step {currentStep} of {steps.length}
        </div>
      </div>
    </div>
  );
}
