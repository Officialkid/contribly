import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface CarryForwardResult {
  userId: string;
  departmentId: string;
  monthlyAmount: number;
  totalContributed: number;
  monthsCleared: number;
  carryForward: number;
  balanceDate: Date;
}

export async function calculateCarryForward(
  departmentId: string,
  userId: string,
  asOfDate?: Date
): Promise<CarryForwardResult | null> {
  const asOf = asOfDate || new Date();

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department || !department.monthlyContribution) {
    return null;
  }

  const deptMember = await prisma.departmentMember.findFirst({
    where: { userId, departmentId },
  });

  if (!deptMember) {
    return null;
  }

  const payments = await prisma.payment.findMany({
    where: {
      departmentId,
      userId,
      status: { in: ["MATCHED", "CLAIMED"] },
      transactionDate: { lte: asOf },
    },
    select: { amount: true, transactionDate: true },
  });

  const totalContributed = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  const monthlyAmount = parseFloat(department.monthlyContribution.toString());

  const monthsCleared = Math.floor(totalContributed / monthlyAmount);
  const carryForward = totalContributed - monthsCleared * monthlyAmount;

  return {
    userId,
    departmentId,
    monthlyAmount,
    totalContributed,
    monthsCleared,
    carryForward,
    balanceDate: asOf,
  };
}

export async function getMemberBalanceInDepartment(departmentId: string, userId: string) {
  const carryForward = await calculateCarryForward(departmentId, userId);
  if (!carryForward) {
    return { success: false, error: "Member or department not found" };
  }

  return { success: true, balance: carryForward };
}

export async function getDepartmentContributionsSummary(departmentId: string, year?: number) {
  const year_ = year || new Date().getFullYear();
  const startDate = new Date(`${year_}-01-01`);
  const endDate = new Date(`${year_ + 1}-01-01`);

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  if (!department) {
    return { success: false, error: "Department not found" };
  }

  const memberBalances = await Promise.all(
    department.members.map(async (member) => {
      const carryForward = await calculateCarryForward(
        departmentId,
        member.userId,
        endDate
      );

      return {
        user: member.user,
        paymentReference: member.paymentReference,
        role: member.role,
        balance: carryForward,
      };
    })
  );

  return {
    success: true,
    summary: {
      departmentId,
      name: department.name,
      monthlyAmount: department.monthlyContribution?.toString() || null,
      year: year_,
      members: memberBalances,
    },
  };
}

export async function listMemberBalancesInOrganization(organizationId: string, year?: number) {
  const year_ = year || new Date().getFullYear();
  const endDate = new Date(`${year_ + 1}-01-01`);

  const departments = await prisma.department.findMany({
    where: { organizationId },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  const summaries = await Promise.all(
    departments.map(async (dept) => {
      const memberBalances = await Promise.all(
        dept.members.map(async (member) => {
          const carryForward = await calculateCarryForward(
            dept.id,
            member.userId,
            endDate
          );

          return {
            user: member.user,
            paymentReference: member.paymentReference,
            role: member.role,
            balance: carryForward,
          };
        })
      );

      return {
        departmentId: dept.id,
        name: dept.name,
        monthlyAmount: dept.monthlyContribution?.toString() || null,
        members: memberBalances,
      };
    })
  );

  return {
    success: true,
    summary: {
      organizationId,
      year: year_,
      departments: summaries,
    },
  };
}
