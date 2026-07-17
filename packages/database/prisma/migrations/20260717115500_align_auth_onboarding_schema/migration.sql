-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "metadata" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mfaAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mfaCode" TEXT,
ADD COLUMN     "mfaCodeExpiry" TIMESTAMP(3),
ADD COLUMN     "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completedSteps" INTEGER[],
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "orgProfileDone" BOOLEAN NOT NULL DEFAULT false,
    "paymentSetupDone" BOOLEAN NOT NULL DEFAULT false,
    "deptCreatedDone" BOOLEAN NOT NULL DEFAULT false,
    "inviteSentDone" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_organizationId_key" ON "OnboardingProgress"("organizationId");

-- CreateIndex
CREATE INDEX "OnboardingProgress_organizationId_idx" ON "OnboardingProgress"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE INDEX "User_resetToken_idx" ON "User"("resetToken");

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
