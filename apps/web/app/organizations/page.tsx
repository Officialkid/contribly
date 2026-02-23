"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { Card, Loading, Error, EmptyState } from "@/components/ui";

interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  memberCount: number;
}

export default function OrganizationsPage() {
  const router = useRouter();
  const { user } = useOrg();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", slug: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.listOrganizations();
      setOrgs(response.organizations || []);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to load organizations";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await apiClient.createOrganization({
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
      });
      if (response.organization) {
        setOrgs([...orgs, response.organization]);
        setFormData({ name: "", slug: "" });
        setShowCreateForm(false);
        router.push(`/orgs/${response.organization.id}`);
      }
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Failed to create organization";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <Loading message="Loading..." />;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary">My Organizations</h1>
            <p className="text-text-muted mt-2">Manage and view all your organizations</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Organization
          </button>
        </div>

        {/* Create Organization Form */}
        {showCreateForm && (
          <Card title="Create New Organization">
            <form onSubmit={handleCreateOrg} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Organization Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Tech Startup Inc"
                  className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Slug (optional)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="tech-startup-inc"
                  className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? "Creating..." : "Create Organization"}
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

        {error && <Error message={error} />}

        {isLoading ? (
          <Loading message="Loading organizations..." />
        ) : orgs.length === 0 ? (
          <EmptyState
            title="No Organizations Yet"
            message="Create your first organization to get started."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgs.map((org) => (
              <Card key={org.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <div onClick={() => router.push(`/orgs/${org.id}`)} className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-text-primary">{org.name}</h3>
                  <p className="text-sm text-text-muted">
                    {org.memberCount} {org.memberCount === 1 ? "member" : "members"}
                  </p>
                  <p className="text-xs text-text-muted">
                    Created {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => router.push(`/orgs/${org.id}`)}
                    className="btn btn-primary w-full"
                  >
                    View Details
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
