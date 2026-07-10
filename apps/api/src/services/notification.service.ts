import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface NotificationPayload {
  userId: string;
  organizationId?: string | null;
  departmentId?: string | null;
  type: "payment" | "claim" | "withdrawal" | "arrears" | "system";
  title: string;
  message: string;
  resourceType?: string | null;
  resourceId?: string | null;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function createNotification(payload: NotificationPayload) {
  return prisma.notification.create({
    data: {
      userId: payload.userId,
      organizationId: payload.organizationId || null,
      departmentId: payload.departmentId || null,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      resourceType: payload.resourceType || null,
      resourceId: payload.resourceId || null,
    },
  });
}

export async function listNotificationsForUser(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    notifications,
  };
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    return { success: false, error: "Notification not found" };
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  return { success: true, notification: updated };
}

export async function markAllNotificationsAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  return { success: true, updatedCount: result.count };
}

export async function createPaymentMatchedNotification(params: {
  userId: string;
  organizationId: string;
  departmentId: string;
  amount: string;
  paymentId: string;
  departmentName?: string | null;
}) {
  await createNotification({
    userId: params.userId,
    organizationId: params.organizationId,
    departmentId: params.departmentId,
    type: "payment",
    title: "Payment confirmed",
    message: `Your payment of ${params.amount} was matched${params.departmentName ? ` to ${params.departmentName}` : ""}.`,
    resourceType: "payment",
    resourceId: params.paymentId,
  });
}

export async function createClaimStatusNotification(params: {
  userId: string;
  organizationId: string;
  departmentId: string;
  claimId: string;
  approved: boolean;
  reason?: string | null;
}) {
  await createNotification({
    userId: params.userId,
    organizationId: params.organizationId,
    departmentId: params.departmentId,
    type: "claim",
    title: params.approved ? "Claim approved" : "Claim rejected",
    message: params.approved
      ? "Your payment claim was approved and applied to your balance."
      : `Your payment claim was rejected${params.reason ? `: ${params.reason}` : "."}`,
    resourceType: "claim",
    resourceId: params.claimId,
  });
}

export async function createWithdrawalStatusNotification(params: {
  userId: string;
  organizationId: string;
  departmentId: string;
  withdrawalId: string;
  approved: boolean;
  amount: string;
  reason?: string | null;
}) {
  await createNotification({
    userId: params.userId,
    organizationId: params.organizationId,
    departmentId: params.departmentId,
    type: "withdrawal",
    title: params.approved ? "Withdrawal approved" : "Withdrawal rejected",
    message: params.approved
      ? `Your withdrawal request for ${params.amount} was approved.`
      : `Your withdrawal request for ${params.amount} was rejected${params.reason ? `: ${params.reason}` : "."}`,
    resourceType: "withdrawal",
    resourceId: params.withdrawalId,
  });
}

export async function createArrearsReminderNotification(params: {
  userId: string;
  organizationId: string;
  departmentId: string;
  arrearsAmount: number;
  monthsDue: number;
}) {
  const resourceId = `${params.departmentId}:${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
  const monthStart = startOfMonth(new Date());

  const existing = await prisma.notification.findFirst({
    where: {
      userId: params.userId,
      type: "arrears",
      resourceId,
      createdAt: {
        gte: monthStart,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  await createNotification({
    userId: params.userId,
    organizationId: params.organizationId,
    departmentId: params.departmentId,
    type: "arrears",
    title: "Contribution arrears reminder",
    message: `You are behind on ${params.monthsDue} contribution month(s). Outstanding amount: ${params.arrearsAmount}.`,
    resourceType: "arrears",
    resourceId,
  });
}
