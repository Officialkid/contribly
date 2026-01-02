import { PrismaClient, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function recordPayment(
  organizationId: string,
  amount: string,
  reference: string | null,
  accountNumber: string | null,
  transactionDate: Date
) {
  const payment = await prisma.payment.create({
    data: {
      organizationId,
      amount: parseFloat(amount),
      reference: reference || null,
      accountNumber: accountNumber || null,
      status: PaymentStatus.UNMATCHED,
      transactionDate,
    },
  });

  return { success: true, payment };
}

export async function listPaymentsByOrganization(organizationId: string, status?: PaymentStatus) {
  const payments = await prisma.payment.findMany({
    where: {
      organizationId,
      status: status || undefined,
    },
    include: {
      department: { select: { id: true, name: true } },
      claim: { select: { id: true, status: true } },
    },
    orderBy: { transactionDate: "desc" },
  });

  return {
    success: true,
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount.toString(),
      reference: p.reference,
      accountNumber: p.accountNumber,
      status: p.status,
      department: p.department,
      claim: p.claim,
      transactionDate: p.transactionDate,
      createdAt: p.createdAt,
    })),
  };
}

export async function getPaymentById(paymentId: string, organizationId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, organizationId },
    include: {
      department: { select: { id: true, name: true } },
      claim: true,
    },
  });

  if (!payment) {
    return { success: false, error: "Payment not found" };
  }

  return {
    success: true,
    payment: {
      id: payment.id,
      amount: payment.amount.toString(),
      reference: payment.reference,
      accountNumber: payment.accountNumber,
      status: payment.status,
      department: payment.department,
      claim: payment.claim,
      transactionDate: payment.transactionDate,
      createdAt: payment.createdAt,
    },
  };
}
