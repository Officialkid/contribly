import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function submitPaymentClaim(
  paymentId: string,
  userId: string,
  departmentId: string,
  organizationId: string,
  transactionCode: string,
  details?: string
) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, organizationId },
  });

  if (!payment) {
    return { success: false, error: "Payment not found" };
  }

  if (payment.status !== "UNMATCHED") {
    return { success: false, error: "Only unmatched payments can be claimed" };
  }

  const deptMember = await prisma.departmentMember.findFirst({
    where: { userId, departmentId },
  });

  if (!deptMember) {
    return { success: false, error: "User is not a member of this department" };
  }

  const existing = await prisma.paymentClaim.findFirst({
    where: { paymentId },
  });

  if (existing) {
    return { success: false, error: "Payment already has a claim" };
  }

  const claim = await prisma.paymentClaim.create({
    data: {
      paymentId,
      userId,
      departmentId,
      transactionCode,
      details: details || null,
      status: ClaimStatus.PENDING,
    },
  });

  return { success: true, claim };
}

export async function listClaimsByDepartment(departmentId: string, status?: ClaimStatus) {
  const claims = await prisma.paymentClaim.findMany({
    where: {
      departmentId,
      status: status || undefined,
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
      payment: {
        select: {
          id: true,
          amount: true,
          reference: true,
          transactionDate: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return {
    success: true,
    claims: claims.map((c) => ({
      id: c.id,
      payment: { ...c.payment, amount: c.payment.amount.toString() },
      user: c.user,
      transactionCode: c.transactionCode,
      details: c.details,
      status: c.status,
      submittedAt: c.submittedAt,
      reviewedAt: c.reviewedAt,
      approvedBy: c.approvedBy,
    })),
  };
}

export async function approveClaim(
  claimId: string,
  organizationId: string,
  approverUserId: string
) {
  const claim = await prisma.paymentClaim.findUnique({
    where: { id: claimId },
    include: {
      payment: true,
      department: true,
    },
  });

  if (!claim) {
    return { success: false, error: "Claim not found" };
  }

  if (claim.payment.organizationId !== organizationId) {
    return { success: false, error: "Claim not in this organization" };
  }

  if (claim.status !== ClaimStatus.PENDING) {
    return { success: false, error: "Claim is not pending" };
  }

  const updated = await prisma.paymentClaim.update({
    where: { id: claimId },
    data: {
      status: ClaimStatus.APPROVED,
      reviewedAt: new Date(),
      approvedBy: approverUserId,
    },
  });

  await prisma.payment.update({
    where: { id: claim.paymentId },
    data: {
      status: "CLAIMED",
      departmentId: claim.departmentId,
      userId: claim.userId,
    },
  });

  return { success: true, claim: updated };
}

export async function rejectClaim(
  claimId: string,
  organizationId: string,
  approverUserId: string,
  reason?: string
) {
  const claim = await prisma.paymentClaim.findUnique({
    where: { id: claimId },
    include: { payment: true },
  });

  if (!claim) {
    return { success: false, error: "Claim not found" };
  }

  if (claim.payment.organizationId !== organizationId) {
    return { success: false, error: "Claim not in this organization" };
  }

  if (claim.status !== ClaimStatus.PENDING) {
    return { success: false, error: "Claim is not pending" };
  }

  const updated = await prisma.paymentClaim.update({
    where: { id: claimId },
    data: {
      status: ClaimStatus.REJECTED,
      reviewedAt: new Date(),
      approvedBy: approverUserId,
      details: reason ? `Rejected: ${reason}` : claim.details,
    },
  });

  return { success: true, claim: updated };
}
