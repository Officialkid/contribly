export interface User {
  id: string;
  email: string;
  name: string | null;
  organizationId?: string | null;
  role?: "CHIEF_ADMIN" | "ADMIN" | "MEMBER";
  departmentId?: string | null;
  organizations: Organization[];
}

export interface Organization {
  id: string;
  name: string;
  role: "CHIEF_ADMIN" | "MEMBER";
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  monthlyContribution: string | null;
  organizationId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  amount: string;
  reference: string | null;
  accountNumber: string | null;
  status: "MATCHED" | "UNMATCHED" | "CLAIMED";
  department: { id: string; name: string } | null;
  claim: { id: string; status: string } | null;
  transactionDate: string;
  createdAt: string;
}

export interface CarryForward {
  userId: string;
  departmentId: string;
  monthlyAmount: number;
  totalContributed: number;
  monthsCleared: number;
  carryForward: number;
  balanceDate: string;
}

export interface PaymentClaim {
  id: string;
  payment: {
    id: string;
    amount: string;
    reference: string | null;
    transactionDate: string;
  };
  user: { id: string; email: string; name: string | null };
  transactionCode: string;
  details: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedAt: string | null;
  approvedBy: string | null;
}

export interface Withdrawal {
  id: string;
  departmentId: string;
  creatorId: string;
  amount: string;
  reason: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "PENDING_OTP" | "COMPLETED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface ContributionsSummary {
  organizationId: string;
  year: number;
  departments: Array<{
    departmentId: string;
    name: string;
    monthlyAmount: string | null;
    members: Array<{
      user: { id: string; email: string; name: string | null };
      paymentReference: string;
      role: "ADMIN" | "MEMBER";
      balance: CarryForward | null;
    }>;
  }>;
}

export interface DepartmentContributions {
  departmentId: string;
  name: string;
  monthlyAmount: string | null;
  year: number;
  members: Array<{
    user: { id: string; email: string; name: string | null };
    paymentReference: string;
    role: "ADMIN" | "MEMBER";
    balance: CarryForward | null;
  }>;
}
