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
  reset: () => void;
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
      setError(null);
      try {
        const response = await apiClient.getMe();
        const rawUser = response.user;

        if (!rawUser) {
          setUser(null);
          setActiveOrgId(null);
          setIsLoading(false);
          return;
        }

        // Normalize organizations array
        let organizations = Array.isArray((rawUser as any).organizations)
          ? (rawUser as any).organizations
          : [];

        // Get organizationId from user or first org
        const organizationId = (rawUser as any).organizationId || organizations[0]?.id || null;
        const role = (rawUser as any).role || "MEMBER"; // Default to MEMBER if no role
        const departmentIdFromUser = (rawUser as any).departmentId ?? null;

        // If user has organizationId but no organizations array, fetch it
        if (organizationId && organizations.length === 0) {
          try {
            const orgResponse = await apiClient.getOrganization(organizationId);
            const organization = (orgResponse as any).organization ?? (orgResponse as any);

            if (organization?.id) {
              organizations = [{ ...organization, role }];
            }
          } catch (orgErr) {
            console.error("Failed to fetch organization:", orgErr);
            setError("Could not load organization details");
          }
        }

        // Set normalized user with organizations
        setUser({
          id: rawUser.id,
          email: rawUser.email,
          name: rawUser.name || null,
          role,
          departmentId: departmentIdFromUser,
          organizations,
        } as User);

        // Set active org if available
        if (organizationId && organizations.length > 0) {
          setActiveOrgId(organizationId);
        }

        // Set active department if available
        if (departmentIdFromUser) {
          setActiveDeptId(departmentIdFromUser);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
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
        const depts = response.departments || [];
        setDepartments(depts);
        
        // Only auto-select first dept if user doesn't have a specific department
        if (depts.length > 0 && !user?.departmentId) {
          setActiveDeptId(depts[0].id);
        }
      } catch (err) {
        console.error("Failed to load departments:", err);
        setDepartments([]);
        // Don't set error for departments - it's not critical
      }
    };

    fetchDepts();
  }, [activeOrgId]);

  const handleSetActiveOrgId = (id: string) => {
    setActiveOrgId(id);
    setActiveDeptId(null);
  };

  const reset = () => {
    setUser(null);
    setActiveOrgId(null);
    setActiveDeptId(null);
    setDepartments([]);
    setError(null);
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
        reset,
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
