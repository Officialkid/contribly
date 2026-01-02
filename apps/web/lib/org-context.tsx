"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Organization, Department } from "./types";
import { apiClient } from "./api-client";

interface OrgContextType {
  user: User | null;
  activeOrgId: string | null;
  activeOrg: Organization | null;
  activeDeptId: string | null;
  departments: Department[];
  setActiveOrgId: (id: string) => void;
  setActiveDeptId: (id: string | null) => void;
  isLoading: boolean;
  error: string | null;
  refetchOrgs: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initUser = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getMe();
        const rawUser = response.user;

        if (!rawUser) {
          setUser(null);
          setActiveOrgId(null);
          return;
        }

        let organizations = Array.isArray((rawUser as any).organizations)
          ? (rawUser as any).organizations
          : [];

        const organizationId = (rawUser as any).organizationId || organizations[0]?.id || null;

        if (organizationId && organizations.length === 0) {
          try {
            const orgResponse = await apiClient.getOrganization(organizationId);
            const organization = (orgResponse as any).organization ?? (orgResponse as any);

            if (organization?.id) {
              organizations = [organization];
            }
          } catch (orgErr) {
            setError(orgErr instanceof Error ? orgErr.message : "Failed to load organization");
          }
        }

        setUser({ ...(rawUser as any), organizations });

        if (organizationId) {
          setActiveOrgId(organizationId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user");
        setUser(null);
        setActiveOrgId(null);
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, []);

  useEffect(() => {
    if (!activeOrgId) {
      setDepartments([]);
      setActiveDeptId(null);
      return;
    }

    const fetchDepts = async () => {
      try {
        const response = await apiClient.listDepartments(activeOrgId);
        setDepartments(response.departments || []);
        if (response.departments?.[0]) {
          setActiveDeptId(response.departments[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load departments");
      }
    };

    fetchDepts();
  }, [activeOrgId]);

  const handleSetActiveOrgId = (id: string) => {
    setActiveOrgId(id);
    setActiveDeptId(null);
  };

  const refetchOrgs = async () => {
    try {
      const response = await apiClient.listOrganizations();
      const organizations = Array.isArray((response as any).organizations)
        ? (response as any).organizations
        : [];

      if (organizations[0]) {
        setActiveOrgId(organizations[0].id);
      }

      setUser((prev) =>
        prev
          ? {
              ...(prev as any),
              organizations,
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refetch orgs");
    }
  };

  const activeOrg = (user?.organizations ?? []).find((o) => o.id === activeOrgId) || null;

  return (
    <OrgContext.Provider
      value={{
        user,
        activeOrgId,
        activeOrg,
        activeDeptId,
        departments,
        setActiveOrgId: handleSetActiveOrgId,
        setActiveDeptId,
        isLoading,
        error,
        refetchOrgs,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within OrgProvider");
  }
  return context;
}
