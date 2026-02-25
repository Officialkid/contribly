import { PrismaClient } from "@prisma/client";
import { createAuditLog } from "./audit.service.js";

const prisma = new PrismaClient();

interface OnboardingStatus {
  id: string;
  organizationId: string;
  currentStep: number;
  completedSteps: number[];
  isComplete: boolean;
  orgProfileDone: boolean;
  paymentSetupDone: boolean;
  deptCreatedDone: boolean;
  inviteSentDone: boolean;
  completedAt: Date | null;
  percentComplete: number;
}

/**
 * Get or create onboarding progress for an organization
 */
export async function getOrCreateOnboarding(
  organizationId: string
): Promise<OnboardingStatus> {
  let onboarding = await prisma.onboardingProgress.findUnique({
    where: { organizationId },
  });

  if (!onboarding) {
    onboarding = await prisma.onboardingProgress.create({
      data: {
        organizationId,
        currentStep: 1,
        completedSteps: [],
      },
    });

    // Log onboarding started
    await createAuditLog({
      organizationId,
      userId: "system",
      action: "ONBOARDING_STARTED",
      resourceType: "onboarding",
      resourceId: onboarding.id,
      metadata: { step: 1 },
    });
  }

  return {
    ...onboarding,
    percentComplete: calculatePercentComplete(onboarding.completedSteps),
  };
}

/**
 * Update onboarding step progress
 */
export async function updateStep(
  organizationId: string,
  step: number,
  fieldName: "orgProfileDone" | "paymentSetupDone" | "deptCreatedDone" | "inviteSentDone",
  userId: string
): Promise<OnboardingStatus> {
  const onboarding = await getOrCreateOnboarding(organizationId);

  // Prepare update data
  const updateData: any = {
    [fieldName]: true,
    updatedAt: new Date(),
  };

  // Add step to completedSteps if not already present
  if (!onboarding.completedSteps.includes(step)) {
    updateData.completedSteps = [...onboarding.completedSteps, step];
  }

  // Check if all steps are done
  const allStepsDone =
    (fieldName === "orgProfileDone" ? true : onboarding.orgProfileDone) &&
    (fieldName === "paymentSetupDone" ? true : onboarding.paymentSetupDone) &&
    (fieldName === "deptCreatedDone" ? true : onboarding.deptCreatedDone) &&
    (fieldName === "inviteSentDone" ? true : onboarding.inviteSentDone);

  if (allStepsDone) {
    updateData.isComplete = true;
    updateData.completedAt = new Date();
  } else {
    // Advance to next incomplete step
    updateData.currentStep = calculateNextStep({
      ...onboarding,
      [fieldName]: true,
    });
  }

  const updated = await prisma.onboardingProgress.update({
    where: { organizationId },
    data: updateData,
  });

  // Log step completion
  await createAuditLog({
    organizationId,
    userId,
    action: "ONBOARDING_STEP_COMPLETED",
    resourceType: "onboarding",
    resourceId: updated.id,
    details: { step, field: fieldName },
  });

  // Log completion if all done
  if (allStepsDone) {
    await createAuditLog({
      organizationId,
      userId,
      action: "ONBOARDING_COMPLETED",
      resourceType: "onboarding",
      resourceId: updated.id,
      details: { totalSteps: 4 },
    });
  }

  return {
    ...updated,
    percentComplete: calculatePercentComplete(updated.completedSteps),
  };
}

/**
 * Get onboarding status for an organization
 */
export async function getOnboardingStatus(
  organizationId: string
): Promise<OnboardingStatus | null> {
  const onboarding = await prisma.onboardingProgress.findUnique({
    where: { organizationId },
  });

  if (!onboarding) {
    return null;
  }

  return {
    ...onboarding,
    percentComplete: calculatePercentComplete(onboarding.completedSteps),
  };
}

/**
 * Manually mark onboarding as complete (user skips remaining steps)
 */
export async function completeOnboarding(
  organizationId: string,
  userId: string
): Promise<OnboardingStatus> {
  const onboarding = await getOrCreateOnboarding(organizationId);

  const updated = await prisma.onboardingProgress.update({
    where: { organizationId },
    data: {
      isComplete: true,
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Log completion
  await createAuditLog({
    organizationId,
    userId,
    action: "ONBOARDING_COMPLETED",
    resourceType: "onboarding",
    resourceId: updated.id,
    details: { skipped: true },
  });

  return {
    ...updated,
    percentComplete: calculatePercentComplete(updated.completedSteps),
  };
}

/**
 * Calculate percentage complete
 */
function calculatePercentComplete(completedSteps: number[]): number {
  const totalSteps = 4; // Steps 1-4 (step 5 is just completion page)
  return Math.round((completedSteps.length / totalSteps) * 100);
}

/**
 * Calculate next incomplete step
 */
function calculateNextStep(onboarding: any): number {
  if (!onboarding.orgProfileDone) return 1;
  if (!onboarding.paymentSetupDone) return 2;
  if (!onboarding.deptCreatedDone) return 3;
  if (!onboarding.inviteSentDone) return 4;
  return 5; // All done
}
