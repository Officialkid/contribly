import type {
  CarryForward,
  ContributionsSummary,
  DepartmentContributions,
  Payment,
  PaymentClaim,
  Withdrawal,
  Department,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Shared request helper so generic responses stay typed
async function request<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
  const { headers, ...rest } = options || {};

  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers: requestHeaders,
    credentials: "include",
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = (data as any)?.error || (data as any)?.message || `API error: ${response.status}`;
    throw new Error(message);
  }

  return (data ?? (await response.text())) as T;
}

// Type helpers
export interface AuthResponse {
  success: boolean;
  user?: { id: string; email: string; name: string | null; organizationId?: string; departmentId?: string | null; role?: "CHIEF_ADMIN" | "ADMIN" | "MEMBER" };
  error?: string;
  requiresMfa?: boolean;
  email?: string;
}

export const apiClient = {
  request,

  // Auth
  async register(payload: { email: string; password: string; name: string; organizationName: string }) {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async login(email: string, password: string) {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async logout() {
    return request<{ success: boolean }>("/api/auth/logout", { method: "POST" });
  },

  async getMe() {
    return request<{ success: boolean; user: { id: string; email: string; name?: string | null; organizationId?: string | null; role?: "CHIEF_ADMIN" | "ADMIN" | "MEMBER"; departmentId?: string | null } }>("/api/auth/me");
  },

  async forgotPassword(email: string) {
    return request<{ success: boolean; message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string) {
    return request<{ success: boolean; message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async verifyMFA(code: string) {
    return request<AuthResponse>("/api/auth/verify-mfa", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  async requestMFACode() {
    return request<{ success: boolean; message: string }>("/api/auth/request-mfa", {
      method: "POST",
    });
  },

  // Organizations
  createOrganization(data: { name: string; slug?: string }) {
    return request<{ success: boolean; organization?: { id: string; name: string; slug: string; createdAt: string; memberCount: number } }>("/api/organizations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  listOrganizations() {
    return request<{ success: boolean; organizations: { id: string; name: string; slug: string; createdAt: string; memberCount: number }[] }>("/api/organizations");
  },

  getOrganization(orgId: string) {
    return request(`/api/organizations/${orgId}`);
  },

  // Departments
  createDepartment(orgId: string, data: { name: string; monthlyContribution?: string | null }) {
    return request(`/api/organizations/${orgId}/departments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  listDepartments(orgId: string) {
    return request<{ departments: Department[] }>(`/api/organizations/${orgId}/departments`);
  },

  updateDepartment(orgId: string, deptId: string, data: { name?: string; monthlyContribution?: string }) {
    return request(`/api/organizations/${orgId}/departments/${deptId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Invites
  acceptInvite(code: string, email?: string, password?: string, name?: string) {
    return request("/api/invites/accept", {
      method: "POST",
      body: JSON.stringify({ code, email, password, name }),
    });
  },

  // Payments
  recordPayment(orgId: string, data: { amount: string; reference?: string; transactionDate?: string; departmentId?: string; currency?: string }) {
    return request(`/api/organizations/${orgId}/payments`, {
      method: "POST",
      body: JSON.stringify({ ...data, transactionDate: data.transactionDate || new Date().toISOString() }),
    });
  },

  listPayments(orgId: string, status?: string) {
    const query = status ? `?status=${status}` : "";
    return request<{ payments: Payment[] }>(`/api/organizations/${orgId}/payments${query}`);
  },

  matchPayment(orgId: string, paymentId: string, userId: string, departmentId: string) {
    return request(`/api/organizations/${orgId}/payments/${paymentId}/match`, {
      method: "POST",
      body: JSON.stringify({ userId, departmentId }),
    });
  },

  matchPaymentByReference(orgId: string, paymentId: string, departmentId: string, paymentReference: string) {
    return request(`/api/organizations/${orgId}/payments/${paymentId}/match-by-reference`, {
      method: "POST",
      body: JSON.stringify({ departmentId, paymentReference }),
    });
  },

  getContributionsSummary(orgId: string, year?: number) {
    const query = year ? `?year=${year}` : "";
    return request<{ summary: ContributionsSummary }>(
      `/api/organizations/${orgId}/contributions${query}`,
    );
  },

  getDepartmentContributions(orgId: string, deptId: string, year?: number) {
    const query = year ? `?year=${year}` : "";
    return request<{ summary: DepartmentContributions }>(
      `/api/organizations/${orgId}/departments/${deptId}/contributions${query}`,
    );
  },

  getMemberBalance(orgId: string, departmentId: string, userId?: string) {
    const query = userId ? `?userId=${userId}` : "";
    return request<{ balance: CarryForward | null }>(
      `/api/organizations/${orgId}/departments/${departmentId}/balance${query}`,
    );
  },

  // Claims
  submitClaim(orgId: string, deptId: string, paymentId: string, transactionCode: string, details?: string) {
    return request(`/api/organizations/${orgId}/departments/${deptId}/claims`, {
      method: "POST",
      body: JSON.stringify({ paymentId, transactionCode, details }),
    });
  },

  listClaims(orgId: string, deptId: string, status?: string) {
    const query = status ? `?status=${status}` : "";
    return request<{ claims: PaymentClaim[] }>(
      `/api/organizations/${orgId}/departments/${deptId}/claims${query}`,
    );
  },

  approveClaim(orgId: string, claimId: string) {
    return request(`/api/organizations/${orgId}/claims/${claimId}/approve`, {
      method: "POST",
    });
  },

  rejectClaim(orgId: string, claimId: string, reason?: string) {
    return request(`/api/organizations/${orgId}/claims/${claimId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // Withdrawals
  requestWithdrawal(orgId: string, data: { departmentId: string; amount: string; reason: string; accountInformation?: string }) {
    return request(`/api/withdrawals`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  listWithdrawals(orgId: string, opts?: { departmentId?: string }) {
    const query = opts?.departmentId ? `?departmentId=${opts.departmentId}` : "";
    return request<{ withdrawals: Withdrawal[] }>(`/api/organizations/${orgId}/withdrawals${query}`);
  },

  approveWithdrawal(orgId: string, withdrawalId: string) {
    return request(`/api/withdrawals/${withdrawalId}/approve`, {
      method: "POST",
    });
  },

  rejectWithdrawal(orgId: string, withdrawalId: string, reason?: string) {
    return request(`/api/withdrawals/${withdrawalId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // Profile
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(`${API_BASE}/api/user/avatar`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload avatar");
    }

    return response.json() as Promise<{ success: boolean; avatarUrl: string }>;
  },

  updateProfile(data: { name?: string }) {
    return request<{ success: boolean; user?: { id: string; email: string; name: string; avatarUrl?: string } }>("/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteAccount() {
    return request<{ success: boolean }>("/api/user/account", {
      method: "DELETE",
    });
  },

  // Payment Account Settings (Chief Admin)
  setPaymentAccount(orgId: string, data: { accountType: "PAYBILL" | "TILL"; accountNumber: string; accountName?: string }) {
    return request<{ account?: { accountType: string; accountNumber: string; accountName?: string } }>(`/api/organizations/${orgId}/payment-account`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getPaymentAccount(orgId: string) {
    return request<{ account?: { accountType: string; accountNumber: string; accountName?: string } }>(`/api/organizations/${orgId}/payment-account`);
  },

  // User Management
  inviteUser(orgId: string, data: { email: string; departmentId?: string; role?: "MEMBER" | "ADMIN" }) {
    return request<{ inviteLink?: { id: string; code: string; departmentId: string; createdAt: string } }>(`/api/organizations/${orgId}/invitations`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  listInvitations(orgId: string) {
    return request<{ invitations: { id: string; code: string; departmentId: string; createdAt: string }[] }>(`/api/organizations/${orgId}/invitations`);
  },

  listMembers(orgId: string) {
    return request<{ members: { id: string; email: string; name: string; role: string; departmentId: string }[] }>(`/api/organizations/${orgId}/members`);
  },

  removeMember(orgId: string, userId: string) {
    return request(`/api/organizations/${orgId}/members/${userId}`, {
      method: "DELETE",
    });
  },

  // Notifications
  getNotifications() {
    return request("/api/notifications");
  },

  markNotificationAsRead(notificationId: string) {
    return request(`/api/notifications/${notificationId}/read`, {
      method: "POST",
    });
  },

  markAllNotificationsAsRead() {
    return request("/api/notifications/read-all", {
      method: "POST",
    });
  },
};
