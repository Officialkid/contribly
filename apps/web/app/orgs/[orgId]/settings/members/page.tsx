"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Card, Loading, Error, EmptyState, Badge } from "@/components/ui";

interface Member {
  id: string;
  user: { id: string; email: string; name: string | null };
  role: "ADMIN" | "MEMBER";
  createdAt: string;
  _count?: { paymentClaims: number; withdrawals: number };
}

export default function AdminAccountManagementPage() {
  const { user, activeOrgId } = useOrg();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeOrgId) {
      fetchMembers();
    }
  }, [activeOrgId]);

  const fetchMembers = async () => {
    if (!activeOrgId) return;
    try {
      setIsLoading(true);
      const response = await apiClient.listMembers(activeOrgId);
      setMembers((response as any)?.members || []);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to load members";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeOrgId) return;
    if (!confirm("Are you sure you want to remove this member?")) return;

    setRemovingId(memberId);
    try {
      await apiClient.removeMember(activeOrgId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to remove member";
      setError(message);
    } finally {
      setRemovingId(null);
    }
  };

  if (!user || user.role !== "CHIEF_ADMIN") {
    return (
      <div className="p-8">
        <Error message="Only organization admins can manage members." />
      </div>
    );
  }

  if (isLoading) return <Loading message="Loading members..." />;

  const adminMembers = members.filter((m) => m.role === "ADMIN");
  const regularMembers = members.filter((m) => m.role === "MEMBER");

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Member Management</h1>
        <p className="text-text-muted mt-2">Track and manage all organization members</p>
      </div>

      {error && <Error message={error} />}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-text-muted text-sm font-medium">Total Members</p>
          <p className="text-4xl font-bold text-text-primary mt-2">{members.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-text-muted text-sm font-medium">Administrators</p>
          <p className="text-4xl font-bold text-accent mt-2">{adminMembers.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-text-muted text-sm font-medium">Regular Members</p>
          <p className="text-4xl font-bold text-primary mt-2">{regularMembers.length}</p>
        </Card>
      </div>

      {/* Administrators Section */}
      <Card>
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m6 2a2 2 0 110 4m0-4a2 2 0 100 4m-6-4a2 2 0 110 4m0-4a2 2 0 100 4M7 20h10a2 2 0 002-2V8a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Administrators ({adminMembers.length})
          </h2>
        </div>
        <div className="divide-y divide-border">
          {adminMembers.length === 0 ? (
            <div className="p-6 text-center text-text-muted">No administrators yet</div>
          ) : (
            adminMembers.map((member) => (
              <div key={member.id} className="p-6 hover:bg-background/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{member.user.name || member.user.email}</h3>
                    <p className="text-sm text-text-muted">{member.user.email}</p>
                    <div className="flex gap-3 mt-2">
                      <Badge status="ADMIN" />
                      <span className="text-xs text-text-muted">
                        Joined {new Date(member.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={removingId === member.id}
                    className="text-red-600 hover:text-red-700 text-sm font-semibold disabled:opacity-50"
                  >
                    {removingId === member.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Regular Members Section */}
      <Card>
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Members ({regularMembers.length})
          </h2>
        </div>
        <div className="divide-y divide-border">
          {regularMembers.length === 0 ? (
            <div className="p-6 text-center text-text-muted">No regular members yet</div>
          ) : (
            regularMembers.map((member) => (
              <div key={member.id} className="p-6 hover:bg-background/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{member.user.name || member.user.email}</h3>
                    <p className="text-sm text-text-muted">{member.user.email}</p>
                    <div className="flex gap-3 mt-2">
                      <Badge status="MEMBER" />
                      <span className="text-xs text-text-muted">
                        Joined {new Date(member.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={removingId === member.id}
                    className="text-red-600 hover:text-red-700 text-sm font-semibold disabled:opacity-50"
                  >
                    {removingId === member.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
