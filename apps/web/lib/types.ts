export interface User {
  id: string;
  email: string;
  name: string | null;
  organizationId?: string | null;
  role?: "CHIEF_ADMIN" | "ADMIN" | "MEMBER";
  departmentId?: string | null;
  profileImage?: string | null;
  organizations: Organization[];
}

export interface Organization {
  id: string;
  name: string;
  role: "CHIEF_ADMIN" | "ADMIN" | "MEMBER";
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
  organizationId: string;
  monthlyAmount: number;
  totalContributed: number;
  monthsCleared: number;
  monthsDue: number;
  arrearsAmount: number;
  isInArrears: boolean;
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
  user?: { id: string; email: string; name: string | null } | null;
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

export interface MemberLedgerPayment {
  id: string;
  amount: number;
  reference: string | null;
  transactionDate: string;
  status: "MATCHED" | "CLAIMED";
}

export interface MemberLedgerRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  year: number;
  expectedAmount: number;
  paidAmount: number;
  balance: number;
  progressPercent: number;
  paymentReference: string;
  notes: string | null;
  linked: boolean;
  user: { id: string; email: string; name: string | null } | null;
  payments: MemberLedgerPayment[];
}

export interface MemberLedgerImportRow {
  name: string;
  email?: string | null;
  phone?: string | null;
  expectedAmount: number;
  paymentReference?: string | null;
  notes?: string | null;
}
