"use client";

import React from "react";
import Link from "next/link";
import { useOrg } from "@/lib/org-context";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export function Sidebar() {
  const { user, activeOrgId, activeOrg, activeDeptId, departments, setActiveOrgId, setActiveDeptId, reset } = useOrg();
  const router = useRouter();

  if (!user) return null;

  const isChiefAdmin = activeOrg?.role === "CHIEF_ADMIN";

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-sm shadow-soft overflow-hidden flex-shrink-0">
            {(user as any)?.avatarUrl ? (
              <img 
                src={(user as any).avatarUrl} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span>{user.email?.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">Contribly</h1>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Organization Selector */}
      <div className="p-4 border-b border-slate-700">
        <label className="text-xs font-semibold text-slate-300 block mb-2">Organization</label>
        <select
          value={activeOrgId || ""}
          onChange={(e) => setActiveOrgId(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white"
        >
          {user.organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        {activeOrg && (
          <p className="text-xs text-slate-400 mt-2">
            Role: <span className="font-semibold">{isChiefAdmin ? "Chief Admin" : "Member"}</span>
          </p>
        )}
      </div>

      {/* Departments List */}
      <div className="flex-1 overflow-y-auto p-4">
        <label className="text-xs font-semibold text-slate-300 block mb-3">Departments</label>
        <nav className="space-y-1">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setActiveDeptId(dept.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                activeDeptId === dept.id ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {dept.name}
            </button>
          ))}
        </nav>

          {/* No create department route available; hide link to avoid 404 */}
      </div>

      {/* Navigation Links */}
      <div className="border-t border-slate-700 p-4 space-y-2">
        <Link href={`/orgs/${activeOrgId}`} className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded transition">
          Dashboard
        </Link>
        {isChiefAdmin && (
          <>
            <Link href={`/orgs/${activeOrgId}/payments`} className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded transition">
              Payments
            </Link>
            <Link href={`/orgs/${activeOrgId}/claims`} className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded transition">
              Claims
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </>
        )}
        <button
            onClick={async () => {
              try {
                await apiClient.logout();
              } catch (_) {}
              localStorage.clear();
              reset();
              router.push("/login");
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded transition"
          >
            Logout
          </button>
      </div>
    </aside>
  );
}
