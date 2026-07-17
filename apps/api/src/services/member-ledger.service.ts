import crypto from "crypto";
import { PaymentStatus, Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export interface MemberLedgerRow {
  name: string;
  email?: string | null;
  phone?: string | null;
  expectedAmount: number;
  paymentReference?: string | null;
  notes?: string | null;
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

function normalizeOptional(value?: string | null) {
  return value?.trim() || null;
}

function generatePaymentReference(year: number) {
  return `MEM-${year}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function linkLedgerRecordsToUser(
  db: DatabaseClient,
  userId: string,
  email: string
) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return { linkedCount: 0, organizationId: undefined };

  const records = await db.memberLedger.findMany({
    where: { email: normalizedEmail },
    orderBy: [{ year: "desc" }, { createdAt: "asc" }],
  });

  for (const record of records) {
    await db.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId,
          organizationId: record.organizationId,
        },
      },
      update: {},
      create: {
        userId,
        organizationId: record.organizationId,
        role: "MEMBER",
      },
    });

    const departmentMembership = await db.departmentMember.findUnique({
      where: { userId_departmentId: { userId, departmentId: record.departmentId } },
    });

    if (!departmentMembership) {
      await db.departmentMember.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          departmentId: record.departmentId,
          role: "MEMBER",
          paymentReference: record.paymentReference,
          updatedAt: new Date(),
        },
      });
    }
  }

  if (records.length > 0) {
    await db.memberLedger.updateMany({
      where: { email: normalizedEmail },
      data: { userId },
    });
  }

  return {
    linkedCount: records.length,
    organizationId: records[0]?.organizationId,
  };
}

export async function importMemberLedger(
  organizationId: string,
  departmentId: string,
  year: number,
  rows: MemberLedgerRow[]
) {
  const department = await prisma.department.findFirst({
    where: { id: departmentId, organizationId },
    select: { id: true },
  });

  if (!department) return { success: false, error: "Department not found" };

  const result = await prisma.$transaction(async (tx) => {
    let created = 0;
    let updated = 0;
    let linked = 0;

    for (const row of rows) {
      const email = normalizeEmail(row.email);
      const paymentReference =
        normalizeOptional(row.paymentReference)?.toUpperCase() || generatePaymentReference(year);
      const existing = email
        ? await tx.memberLedger.findUnique({
            where: { departmentId_year_email: { departmentId, year, email } },
          })
        : await tx.memberLedger.findUnique({
            where: {
              departmentId_year_paymentReference: { departmentId, year, paymentReference },
            },
          });

      const matchingUser = email
        ? await tx.user.findUnique({ where: { email }, select: { id: true } })
        : null;

      const data = {
        organizationId,
        departmentId,
        userId: matchingUser?.id || existing?.userId || null,
        name: row.name.trim(),
        email,
        phone: normalizeOptional(row.phone),
        year,
        expectedAmount: row.expectedAmount,
        paymentReference,
        notes: normalizeOptional(row.notes),
      };

      if (existing) {
        await tx.memberLedger.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await tx.memberLedger.create({ data });
        created += 1;
      }

      if (matchingUser && email) {
        const linkResult = await linkLedgerRecordsToUser(tx, matchingUser.id, email);
        linked += linkResult.linkedCount > 0 ? 1 : 0;
      }
    }

    return { created, updated, linked };
  });

  return { success: true, ...result, total: rows.length };
}

export async function listMemberLedger(
  organizationId: string,
  departmentId: string,
  year: number,
  userId?: string
) {
  const records = await prisma.memberLedger.findMany({
    where: { organizationId, departmentId, year, userId: userId || undefined },
    include: {
      user: { select: { id: true, email: true, name: true } },
      payments: {
        where: { status: { in: [PaymentStatus.MATCHED, PaymentStatus.CLAIMED] } },
        select: { id: true, amount: true, reference: true, transactionDate: true, status: true },
        orderBy: { transactionDate: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return {
    success: true,
    year,
    members: records.map((record) => {
      const expectedAmount = Number(record.expectedAmount);
      const paidAmount = record.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      return {
        id: record.id,
        name: record.name,
        email: record.email,
        phone: record.phone,
        year: record.year,
        expectedAmount,
        paidAmount,
        balance: Math.max(0, expectedAmount - paidAmount),
        progressPercent:
          expectedAmount > 0 ? Math.min(100, Math.round((paidAmount / expectedAmount) * 100)) : 0,
        paymentReference: record.paymentReference,
        notes: record.notes,
        linked: Boolean(record.userId),
        user: record.user,
        payments: record.payments.map((payment) => ({
          ...payment,
          amount: Number(payment.amount),
        })),
      };
    }),
  };
}

export async function recordMemberLedgerPayment(
  organizationId: string,
  departmentId: string,
  memberLedgerId: string,
  amount: number,
  reference: string | null,
  accountNumber: string | null,
  transactionDate: Date
) {
  const member = await prisma.memberLedger.findFirst({
    where: { id: memberLedgerId, organizationId, departmentId },
  });

  if (!member) return { success: false, error: "Member ledger record not found" };

  const payment = await prisma.payment.create({
    data: {
      organizationId,
      departmentId,
      memberLedgerId,
      userId: member.userId,
      amount,
      reference,
      accountNumber,
      status: PaymentStatus.MATCHED,
      transactionDate,
    },
  });

  return { success: true, payment: { ...payment, amount: Number(payment.amount) } };
}
