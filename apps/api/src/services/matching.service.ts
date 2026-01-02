import { PrismaClient, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function matchPayment(
  paymentId: string,
  organizationId: string,
  departmentId: string,
  userId: string
) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, organizationId },
  });

  if (!payment) {
    return { success: false, error: "Payment not found" };
  }

  if (payment.status === PaymentStatus.MATCHED || payment.status === PaymentStatus.CLAIMED) {
    return { success: false, error: "Payment already matched or claimed" };
  }

  const deptMember = await prisma.departmentMember.findFirst({
    where: { userId, departmentId },
  });

  if (!deptMember) {
    return { success: false, error: "User is not a member of this department" };
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.MATCHED,
      departmentId,
      userId,
    },
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  return { success: true, payment: updated };
}

export async function matchPaymentByReference(
  paymentId: string,
  organizationId: string,
  departmentId: string,
  paymentReference: string
) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, organizationId },
  });

  if (!payment) {
    return { success: false, error: "Payment not found" };
  }

  const deptMember = await prisma.departmentMember.findFirst({
    where: { departmentId, paymentReference },
  });

  if (!deptMember) {
    return { success: false, error: "Invalid payment reference for this department" };
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.MATCHED,
      departmentId,
      userId: deptMember.userId,
      reference: paymentReference,
    },
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  return { success: true, payment: updated };
}

export async function unmatchPayment(paymentId: string, organizationId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, organizationId },
  });

  if (!payment) {
    return { success: false, error: "Payment not found" };
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.UNMATCHED,
      departmentId: null,
      userId: null,
    },
  });

  return { success: true, payment: updated };
}
