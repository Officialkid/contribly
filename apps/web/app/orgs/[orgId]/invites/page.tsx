"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Card, Loading, Error, EmptyState } from "@/components/ui";

interface InviteLink {
  id: string;
  code: string;
  departmentId: string;
  createdByUserId: string;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function InviteLinksPage() {
  const { user, activeOrgId, activeDeptId, departments } = useOrg();
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState(activeDeptId || "");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (activeOrgId) {
      fetchInvites();
    }
  }, [activeOrgId]);

  const fetchInvites = async () => {
    if (!activeOrgId) return;
    try {
      setIsLoading(true);
      // This would need to be implemented in the API
      const response = await apiClient.listInvitations(activeOrgId);
      setInvites((response as any)?.invitations || []);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to load invites";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId || !selectedDeptId) return;

    setIsCreating(true);
    try {
      const response = await apiClient.inviteUser(activeOrgId, {
        email: "", // Will be generated as invite link instead
        departmentId: selectedDeptId,
        role: "MEMBER",
      });
      if ((response as any)?.inviteLink) {
        setInvites([...invites, (response as any).inviteLink]);
        setShowCreateForm(false);
        setSelectedDeptId(activeDeptId || "");
      }
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to create invite";
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/invites/${code}`;
    navigator.clipboard.writeText(link);
    alert("Invite link copied to clipboard!");
  };

  if (!user || user.role !== "CHIEF_ADMIN") {
    return (
      <div className="p-8">
        <Error message="Only organization admins can manage invite links." />
      </div>
    );
  }

  if (isLoading) return <Loading message="Loading invites..." />;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Invite Links</h1>
          <p className="text-text-muted mt-2">Create and manage department invite links</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Invite
        </button>
      </div>

      {error && <Error message={error} />}

      {showCreateForm && (
        <Card title="Create New Invite Link">
          <form onSubmit={handleCreateInvite} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Select Department</label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full px-4 py-2 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none"
                required
              >
                <option value="">Choose a department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={isCreating} className="btn btn-primary">
                {isCreating ? "Creating..." : "Create Invite Link"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {invites.length === 0 ? (
        <EmptyState
          title="No Invite Links"
          message="Create an invite link to let people join your departments"
        />
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => {
            const dept = departments.find((d) => d.id === invite.departmentId);
            return (
              <Card key={invite.id} className="border-l-4 border-l-primary">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary">{dept?.name || "Unknown Department"}</h3>
                      <p className="text-sm text-text-muted mt-1">
                        {invite.usedCount} of {invite.maxUses || "unlimited"} uses
                      </p>
                    </div>
                    <span className={`badge ${invite.isActive ? "badge-accent" : "badge-danger"}`}>
                      {invite.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={`${window.location.origin}/invites/${invite.code}`}
                      readOnly
                      className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm text-text-muted font-mono"
                    />
                    <button
                      onClick={() => copyInviteLink(invite.code)}
                      className="btn btn-outline px-4"
                    >
                      Copy
                    </button>
                  </div>

                  {invite.expiresAt && (
                    <p className="text-xs text-text-muted">
                      Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
