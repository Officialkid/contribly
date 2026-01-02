import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { generateOTP, isOTPExpired, verifyOTPCode } from "../utils/otp.js";
import { sendOTPEmail, sendWithdrawalApprovedEmail } from "./email.service.js";
import { createAuditLog } from "./audit.service.js";

const prisma = new PrismaClient();

export interface WithdrawalResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// REQUEST WITHDRAWAL
export async function requestWithdrawal(
  departmentId: string,
  creatorId: string,
  amount: number,
  reason: string,
  organizationId: string
): Promise<WithdrawalResponse> {
  try {
    // Verify department belongs to organization
    const department = await prisma.department.findFirst({
      where: { id: departmentId, organizationId },
    });

    if (!department) {
      return { success: false, error: "Department not found" };
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        departmentId,
        creatorId,
        amount: new Decimal(amount),
        reason,
        status: "PENDING_APPROVAL",
      },
      include: { creator: true, department: true },
    });

    await createAuditLog({
      organizationId,
      userId: creatorId,
      action: "WITHDRAWAL_REQUESTED",
      resourceType: "withdrawal",
      resourceId: withdrawal.id,
      details: { amount, reason },
    });

    return { success: true, data: withdrawal };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// APPROVE WITHDRAWAL (Chief Admin only)
export async function approveWithdrawal(
  withdrawalId: string,
  approverUserId: string,
  organizationId: string
): Promise<WithdrawalResponse> {
  try {
    const withdrawal = await prisma.withdrawal.findFirst({
      where: { id: withdrawalId },
      include: { department: true, creator: true },
    });

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found" };
    }

    if (withdrawal.department.organizationId !== organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    if (withdrawal.status !== "PENDING_APPROVAL") {
      return { success: false, error: "Withdrawal cannot be approved in its current state" };
    }

    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "APPROVED" },
      include: { creator: true, department: true },
    });

    await createAuditLog({
      organizationId,
      userId: approverUserId,
      action: "WITHDRAWAL_APPROVED",
      resourceType: "withdrawal",
      resourceId: withdrawalId,
      details: { amount: withdrawal.amount.toString() },
    });

    // Send OTP to approver
    const { code, expiresAt } = generateOTP();

    await prisma.withdrawalOTP.create({
      data: {
        withdrawalId,
        userId: approverUserId,
        code,
        expiresAt,
      },
    });

    const approver = await prisma.user.findUnique({ where: { id: approverUserId } });
    if (approver) {
      await sendOTPEmail(approver.email, code);
    }

    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// REJECT WITHDRAWAL (Chief Admin only)
export async function rejectWithdrawal(
  withdrawalId: string,
  rejecterUserId: string,
  organizationId: string,
  reason?: string
): Promise<WithdrawalResponse> {
  try {
    const withdrawal = await prisma.withdrawal.findFirst({
      where: { id: withdrawalId },
      include: { department: true },
    });

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found" };
    }

    if (withdrawal.department.organizationId !== organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!["PENDING_APPROVAL", "APPROVED"].includes(withdrawal.status)) {
      return { success: false, error: "Withdrawal cannot be rejected in its current state" };
    }

    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "REJECTED" },
    });

    await createAuditLog({
      organizationId,
      userId: rejecterUserId,
      action: "WITHDRAWAL_REJECTED",
      resourceType: "withdrawal",
      resourceId: withdrawalId,
      details: { reason },
    });

    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// VERIFY OTP FOR WITHDRAWAL
export async function verifyWithdrawalOTP(
  withdrawalId: string,
  userId: string,
  otpCode: string,
  organizationId: string
): Promise<WithdrawalResponse> {
  try {
    const withdrawal = await prisma.withdrawal.findFirst({
      where: { id: withdrawalId },
      include: { department: true },
    });

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found" };
    }

    if (withdrawal.department.organizationId !== organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    if (withdrawal.status !== "APPROVED") {
      return { success: false, error: "Withdrawal is not in approved state" };
    }

    const otpRecord = await prisma.withdrawalOTP.findFirst({
      where: {
        withdrawalId,
        userId,
        isUsed: false,
      },
    });

    if (!otpRecord) {
      await createAuditLog({
        organizationId,
        userId,
        action: "OTP_VERIFICATION_FAILED",
        resourceType: "withdrawal",
        resourceId: withdrawalId,
        details: { reason: "No valid OTP found" },
      });
      return { success: false, error: "No valid OTP found" };
    }

    if (isOTPExpired(otpRecord.expiresAt)) {
      await createAuditLog({
        organizationId,
        userId,
        action: "OTP_VERIFICATION_FAILED",
        resourceType: "withdrawal",
        resourceId: withdrawalId,
        details: { reason: "OTP expired" },
      });
      return { success: false, error: "OTP has expired" };
    }

    if (!verifyOTPCode(otpCode, otpRecord.code)) {
      await createAuditLog({
        organizationId,
        userId,
        action: "OTP_VERIFICATION_FAILED",
        resourceType: "withdrawal",
        resourceId: withdrawalId,
        details: { reason: "Invalid OTP code" },
      });
      return { success: false, error: "Invalid OTP code" };
    }

    // Mark OTP as used
    await prisma.withdrawalOTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Mark withdrawal as completed
    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "COMPLETED" },
      include: { creator: true, department: true },
    });

    await createAuditLog({
      organizationId,
      userId,
      action: "WITHDRAWAL_COMPLETED",
      resourceType: "withdrawal",
      resourceId: withdrawalId,
      details: { amount: withdrawal.amount.toString() },
    });

    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// RESEND OTP
export async function resendWithdrawalOTP(
  withdrawalId: string,
  userId: string,
  organizationId: string
): Promise<WithdrawalResponse> {
  try {
    const withdrawal = await prisma.withdrawal.findFirst({
      where: { id: withdrawalId },
      include: { department: true },
    });

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found" };
    }

    if (withdrawal.department.organizationId !== organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    // Invalidate old OTP
    await prisma.withdrawalOTP.updateMany({
      where: { withdrawalId, userId, isUsed: false },
      data: { isUsed: true },
    });

    // Generate new OTP
    const { code, expiresAt } = generateOTP();

    await prisma.withdrawalOTP.create({
      data: {
        withdrawalId,
        userId,
        code,
        expiresAt,
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await sendOTPEmail(user.email, code);
    }

    await createAuditLog({
      organizationId,
      userId,
      action: "OTP_RESENT",
      resourceType: "withdrawal",
      resourceId: withdrawalId,
    });

    return { success: true, data: { message: "OTP resent" } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
