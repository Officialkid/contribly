const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Type helpers
export interface AuthResponse {
  success: boolean;
  user?: { id: string; email: string; name: string | null; organizationId?: string };
  error?: string;
}

export const apiClient = {
  async request<T = unknown>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
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

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  },

  // Auth
  async register(payload: { email: string; password: string; name: string; organizationName: string }) {
    return this.request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async login(email: string, password: string) {
    return this.request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async logout() {
    return this.request<{ success: boolean }>("/api/auth/logout", { method: "POST" });
  },

  async getMe() {
    return this.request<{ success: boolean; user: { id: string; email: string; name?: string | null; organizationId?: string | null; role?: "CHIEF_ADMIN" | "ADMIN" | "MEMBER"; departmentId?: string | null } }>("/api/auth/me");
  },

  // Organizations
  createOrganization(name: string) {
    return this.request("/api/organizations", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  listOrganizations() {
    return this.request("/api/organizations");
  },

  getOrganization(orgId: string) {
    return this.request(`/api/organizations/${orgId}`);
  },

  // Departments
  createDepartment(orgId: string, name: string, monthlyContribution?: string) {
    return this.request(`/api/organizations/${orgId}/departments`, {
      method: "POST",
      body: JSON.stringify({ name, monthlyContribution }),
    });
  },

  listDepartments(orgId: string) {
    return this.request(`/api/organizations/${orgId}/departments`);
  },

  updateDepartment(orgId: string, deptId: string, data: { name?: string; monthlyContribution?: string }) {
    return this.request(`/api/organizations/${orgId}/departments/${deptId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Invites
  acceptInvite(code: string, email?: string, password?: string, name?: string) {
    return this.request("/api/invites/accept", {
      method: "POST",
      body: JSON.stringify({ code, email, password, name }),
    });
  },

  // Payments
  recordPayment(orgId: string, amount: string, reference?: string, accountNumber?: string, transactionDate?: string) {
    return this.request(`/api/organizations/${orgId}/payments`, {
      method: "POST",
      body: JSON.stringify({ amount, reference, accountNumber, transactionDate: transactionDate || new Date().toISOString() }),
    });
  },

  listPayments(orgId: string, status?: string) {
    const query = status ? `?status=${status}` : "";
    return this.request(`/api/organizations/${orgId}/payments${query}`);
  },

  matchPayment(orgId: string, paymentId: string, userId: string, departmentId: string) {
    return this.request(`/api/organizations/${orgId}/payments/${paymentId}/match`, {
      method: "POST",
      body: JSON.stringify({ userId, departmentId }),
    });
  },

  matchPaymentByReference(orgId: string, paymentId: string, departmentId: string, paymentReference: string) {
    return this.request(`/api/organizations/${orgId}/payments/${paymentId}/match-by-reference`, {
      method: "POST",
      body: JSON.stringify({ departmentId, paymentReference }),
    });
  },

  getContributionsSummary(orgId: string, year?: number) {
    const query = year ? `?year=${year}` : "";
    return this.request(`/api/organizations/${orgId}/contributions${query}`);
  },

  getDepartmentContributions(orgId: string, deptId: string, year?: number) {
    const query = year ? `?year=${year}` : "";
    return this.request(`/api/organizations/${orgId}/departments/${deptId}/contributions${query}`);
  },

  getMemberBalance(orgId: string, deptId: string, userId: string) {
    return this.request(`/api/organizations/${orgId}/departments/${deptId}/balance?userId=${userId}`);
  },

  // Claims
  submitClaim(orgId: string, deptId: string, paymentId: string, transactionCode: string, details?: string) {
    return this.request(`/api/organizations/${orgId}/departments/${deptId}/claims`, {
      method: "POST",
      body: JSON.stringify({ paymentId, transactionCode, details }),
    });
  },

  listClaims(orgId: string, deptId: string, status?: string) {
    const query = status ? `?status=${status}` : "";
    return this.request(`/api/organizations/${orgId}/departments/${deptId}/claims${query}`);
  },

  approveClaim(orgId: string, claimId: string) {
    return this.request(`/api/organizations/${orgId}/claims/${claimId}/approve`, {
      method: "POST",
    });
  },

  rejectClaim(orgId: string, claimId: string, reason?: string) {
    return this.request(`/api/organizations/${orgId}/claims/${claimId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // Withdrawals
  requestWithdrawal(orgId: string, deptId: string, amount: string, reason: string) {
    return this.request(`/api/withdrawals`, {
      method: "POST",
      body: JSON.stringify({ departmentId: deptId, amount, reason }),
    });
  },

  listWithdrawals(orgId: string) {
    return this.request(`/api/organizations/${orgId}/withdrawals`);
  },

  approveWithdrawal(orgId: string, withdrawalId: string) {
    return this.request(`/api/withdrawals/${withdrawalId}/approve`, {
      method: "POST",
    });
  },

  rejectWithdrawal(orgId: string, withdrawalId: string, reason?: string) {
    return this.request(`/api/withdrawals/${withdrawalId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },
};
