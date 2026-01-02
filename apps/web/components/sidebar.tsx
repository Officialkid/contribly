"use client";

import React from "react";
import Link from "next/link";
import { useOrg } from "@/lib/org-context";
import { useRouter } from "next/navigation";

export function Sidebar() {
  const { user, activeOrgId, activeOrg, activeDeptId, departments, setActiveOrgId, setActiveDeptId } = useOrg();
  const router = useRouter();

  if (!user) return null;

  const isChiefAdmin = activeOrg?.role === "CHIEF_ADMIN";

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">Contribly</h1>
        <p className="text-xs text-slate-400 mt-1">{user.email}</p>
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

        {isChiefAdmin && (
          <Link
            href={`/orgs/${activeOrgId}/departments/new`}
            className="block mt-4 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded transition"
          >
            + New Department
          </Link>
        )}
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
          </>
        )}
        <button
          onClick={() => {
            localStorage.clear();
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
