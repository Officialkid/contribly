"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Loading, Toast, EmptyState } from "@/components/ui";

export function MembersManagement() {
  const { activeOrgId, user } = useOrg();
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "invites">("members");

  const [inviteFormData, setInviteFormData] = useState({
    email: "",
    departmentId: "",
  });

  useEffect(() => {
    if (!activeOrgId) return;
    loadData();
  }, [activeOrgId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        apiClient.listMembers(activeOrgId!),
        apiClient.listInvitations(activeOrgId!),
      ]);
      setMembers((membersRes as any).members || []);
      setInvitations((invitesRes as any).invitations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFormData.email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      await apiClient.inviteUser(activeOrgId!, {
        email: inviteFormData.email.trim(),
        departmentId: inviteFormData.departmentId || undefined,
      });

      setToast("Invitation sent successfully!");
      setInviteFormData({ email: "", departmentId: "" });
      setShowInviteForm(false);
      await loadData();
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await apiClient.removeMember(activeOrgId!, memberId);
      setToast("Member removed successfully");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const isChiefAdmin = user?.role === "CHIEF_ADMIN";

  if (isLoading) return <Loading message="Loading members..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Members & Invitations</h1>
          <p className="text-text-muted mt-1">Manage organization members and send invites</p>
        </div>
        {isChiefAdmin && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="btn btn-primary flex items-center gap-2"
          >
            {showInviteForm ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Invite Member
              </>
            )}
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Invite Form */}
      {showInviteForm && isChiefAdmin && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-text-primary">Send Invitation</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  value={inviteFormData.email}
                  onChange={(e) => setInviteFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 bg-background border-2 border-border rounded-button text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 px-4 py-3 bg-background border-2 border-border rounded-button text-text-primary font-semibold hover:bg-background/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-button font-semibold hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 font-semibold border-b-2 transition-all ${
            activeTab === "members"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className={`px-4 py-2 font-semibold border-b-2 transition-all ${
            activeTab === "invites"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Pending Invites ({invitations.length})
        </button>
      </div>

      {/* Members List */}
      {activeTab === "members" && (
        <div className="space-y-3">
          {members.length === 0 ? (
            <EmptyState
              title="No Members Yet"
              message="Invite people to join your organization"
            />
          ) : (
            members.map((member) => (
              <div key={member.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-soft">
                      {member.email?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{member.name || member.email}</p>
                      <p className="text-xs text-text-muted truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                      {member.role || "MEMBER"}
                    </span>
                    {isChiefAdmin && member.id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all"
                        title="Remove member"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Invitations List */}
      {activeTab === "invites" && (
        <div className="space-y-3">
          {invitations.length === 0 ? (
            <EmptyState
              title="No Pending Invitations"
              message="Send invitations to add new members"
            />
          ) : (
            invitations.map((invite) => (
              <div key={invite.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{invite.email}</p>
                    <p className="text-xs text-text-muted">
                      Sent{" "}
                      {invite.createdAt &&
                        new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                      Pending
                    </span>
                    {isChiefAdmin && (
                      <button
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all"
                        title="Revoke invitation"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
