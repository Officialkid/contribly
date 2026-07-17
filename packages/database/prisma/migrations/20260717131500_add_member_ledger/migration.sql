-- CreateTable
CREATE TABLE "MemberLedger" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "year" INTEGER NOT NULL,
    "expectedAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paymentReference" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberLedger_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "memberLedgerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MemberLedger_departmentId_year_paymentReference_key" ON "MemberLedger"("departmentId", "year", "paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "MemberLedger_departmentId_year_email_key" ON "MemberLedger"("departmentId", "year", "email");

-- CreateIndex
CREATE INDEX "MemberLedger_organizationId_year_idx" ON "MemberLedger"("organizationId", "year");

-- CreateIndex
CREATE INDEX "MemberLedger_departmentId_year_idx" ON "MemberLedger"("departmentId", "year");

-- CreateIndex
CREATE INDEX "MemberLedger_userId_idx" ON "MemberLedger"("userId");

-- CreateIndex
CREATE INDEX "Payment_memberLedgerId_idx" ON "Payment"("memberLedgerId");

-- AddForeignKey
ALTER TABLE "MemberLedger" ADD CONSTRAINT "MemberLedger_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberLedger" ADD CONSTRAINT "MemberLedger_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberLedger" ADD CONSTRAINT "MemberLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_memberLedgerId_fkey" FOREIGN KEY ("memberLedgerId") REFERENCES "MemberLedger"("id") ON DELETE SET NULL ON UPDATE CASCADE;
