"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useOrg } from "@/lib/org-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, activeOrgId, activeOrg, activeDeptId, departments, setActiveOrgId, setActiveDeptId } = useOrg();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  const isChiefAdmin = activeOrg?.role === "CHIEF_ADMIN";

  const navigationItems = [
    {
      name: "Dashboard",
      href: `/orgs/${activeOrgId}`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      show: true,
    },
    {
      name: "Payments",
      href: `/orgs/${activeOrgId}/payments`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      show: isChiefAdmin,
    },
    {
      name: "Claims",
      href: `/orgs/${activeOrgId}/claims`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      show: isChiefAdmin,
    },
    {
      name: "Members",
      href: `/orgs/${activeOrgId}/members`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      show: isChiefAdmin,
    },
    {
      name: "Settings",
      href: `/orgs/${activeOrgId}/settings`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      show: isChiefAdmin,
    },
  ];

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white border-r border-border shadow-soft ${
          sidebarOpen ? "w-72" : "w-20"
        } hidden lg:block`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className={`flex items-center gap-3 ${!sidebarOpen && "justify-center w-full"}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-soft">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {sidebarOpen && <span className="text-xl font-bold text-primary">Contribly</span>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-background transition-colors text-text-muted hover:text-text-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
            </svg>
          </button>
        </div>

        {/* Organization Selector */}
        <div className="p-4 border-b border-border">
          {sidebarOpen ? (
            <>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2 block">Organization</label>
              <select
                value={activeOrgId || ""}
                onChange={(e) => setActiveOrgId(e.target.value)}
                className="w-full px-3 py-2 bg-background border-2 border-border rounded-button text-sm text-text-primary font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              >
                {user.organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              {activeOrg && (
                <div className="mt-3 px-3 py-2 bg-primary/5 rounded-lg">
                  <span className="text-xs font-semibold text-primary">
                    {isChiefAdmin ? "👑 Chief Admin" : "👤 Member"}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="text-primary font-bold text-sm">
                  {activeOrg?.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigationItems.filter(item => item.show).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-button text-sm font-semibold transition-all group ${
                  isActive
                    ? "bg-primary text-white shadow-soft"
                    : "text-text-muted hover:bg-primary/5 hover:text-primary"
                } ${!sidebarOpen && "justify-center"}`}
                title={!sidebarOpen ? item.name : ""}
              >
                <span className={isActive ? "text-white" : "text-text-muted group-hover:text-primary"}>
                  {item.icon}
                </span>
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Departments Section */}
        <div className="border-t border-border p-4">
          {sidebarOpen ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Departments</label>
                {isChiefAdmin && (
                  <Link
                    href={`/orgs/${activeOrgId}/departments/new`}
                    className="text-primary hover:text-primary-dark transition-colors"
                    title="Add Department"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Link>
                )}
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setActiveDeptId(dept.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeDeptId === dept.id
                        ? "bg-accent/10 text-accent border-l-4 border-accent"
                        : "text-text-muted hover:bg-background hover:text-text-primary"
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-4">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-background rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold shadow-soft">
                  {user.email.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{user.email}</p>
                  <p className="text-xs text-text-muted">Active User</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-button transition-all group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2.5 text-red-600 hover:bg-red-50 rounded-button transition-all"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed top-0 left-0 w-80 h-full bg-white shadow-large overflow-y-auto">
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-soft">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-primary">Contribly</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-background transition-colors"
              >
                <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Organization Selector */}
            <div className="p-4 border-b border-border">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2 block">Organization</label>
              <select
                value={activeOrgId || ""}
                onChange={(e) => setActiveOrgId(e.target.value)}
                className="w-full px-3 py-2 bg-background border-2 border-border rounded-button text-sm text-text-primary font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              >
                {user.organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              {activeOrg && (
                <div className="mt-3 px-3 py-2 bg-primary/5 rounded-lg">
                  <span className="text-xs font-semibold text-primary">
                    {isChiefAdmin ? "👑 Chief Admin" : "👤 Member"}
                  </span>
                </div>
              )}
            </div>

            {/* Mobile Navigation */}
            <nav className="p-4 space-y-1">
              {navigationItems.filter(item => item.show).map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-button text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-soft"
                        : "text-text-muted hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Departments */}
            <div className="border-t border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Departments</label>
                {isChiefAdmin && (
                  <Link
                    href={`/orgs/${activeOrgId}/departments/new`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-primary hover:text-primary-dark transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Link>
                )}
              </div>
              <div className="space-y-1">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => {
                      setActiveDeptId(dept.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeDeptId === dept.id
                        ? "bg-accent/10 text-accent border-l-4 border-accent"
                        : "text-text-muted hover:bg-background hover:text-text-primary"
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile User Info */}
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3 px-3 py-2 bg-background rounded-lg mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold shadow-soft">
                  {user.email.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{user.email}</p>
                  <p className="text-xs text-text-muted">Active User</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-button transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className={`fixed top-0 right-0 z-30 h-16 bg-white border-b border-border shadow-soft transition-all duration-300 ${sidebarOpen ? "left-72" : "left-20"} lg:left-auto lg:right-0`}>
        <div className="h-full px-6 flex items-center justify-between lg:justify-end">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-background transition-colors"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Top Bar Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-background transition-colors group">
              <svg className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile - Desktop Only */}
            <div className="hidden lg:flex items-center gap-3 px-3 py-2 bg-background rounded-button">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-soft">
                {user.email.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{user.email}</p>
                {activeOrg && (
                  <p className="text-xs text-text-muted">{activeOrg.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`transition-all duration-300 pt-16 ${sidebarOpen ? "lg:ml-72" : "lg:ml-20"}`}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
