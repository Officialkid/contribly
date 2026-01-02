"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface OnboardingTutorialProps {
  userRole: "CHIEF_ADMIN" | "ADMIN" | "MEMBER";
  onComplete: () => void;
}

export function OnboardingTutorial({ userRole, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const chiefAdminSteps: TutorialStep[] = [
    {
      id: "welcome",
      title: "Welcome, Chief Admin! 👑",
      description: "As the Chief Admin, you have full control over your organization. Let's show you around.",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-primary to-primary-dark",
    },
    {
      id: "departments",
      title: "Create Departments",
      description: "Start by creating departments for your organization. Each department can have its own contribution settings and members.",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: "from-accent to-accent-dark",
    },
    {
      id: "payments",
      title: "Record Payments",
      description: "Track member contributions by recording payments. You can match payments to members automatically or manually.",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: "from-green-500 to-green-600",
    },
    {
      id: "claims",
      title: "Manage Claims",
      description: "Review and approve member withdrawal claims. Keep your organization's finances transparent and organized.",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-blue-500 to-blue-600",
    },
  ];

  const memberSteps: TutorialStep[] = [
    {
      id: "welcome",
      title: "Welcome to Contribly! 👋",
      description: "You're now part of an organization. Let's help you get started with tracking your contributions.",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-primary to-primary-dark",
    },
    {
      id: "dashboard",
      title: "Your Dashboard",
      description: "Track your contribution balance, monthly amount, and see how many months you've cleared.",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "from-accent to-accent-dark",
    },
    {
      id: "claims",
      title: "Submit Claims",
      description: "When you need to withdraw funds, submit a claim with your payment reference for admin approval.",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "from-blue-500 to-blue-600",
    },
  ];

  const steps = userRole === "CHIEF_ADMIN" ? chiefAdminSteps : memberSteps;

  // Auto-advance after 3 seconds
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentStep, isVisible, steps.length]);

  const handleSkip = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
    localStorage.setItem("contribly_tutorial_completed", "true");
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4 animate-in zoom-in slide-in-from-bottom-4 duration-500">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                index <= currentStep ? "bg-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 bg-gradient-to-br ${currentStepData.color} rounded-2xl flex items-center justify-center text-white shadow-soft`}>
            {currentStepData.icon}
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-3 mb-8">
          <h2 className="text-2xl font-bold text-text-primary">{currentStepData.title}</h2>
          <p className="text-text-muted leading-relaxed">{currentStepData.description}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors"
          >
            Skip Tutorial
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="p-2 rounded-button hover:bg-background transition-colors"
              >
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-button shadow-soft transition-all"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>

        {/* Step Counter */}
        <div className="text-center mt-4 text-xs text-text-muted">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
}
