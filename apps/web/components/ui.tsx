"use client";

import React from "react";

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

interface TableProps {
  headers: string[];
  rows: React.ReactNode[][];
  className?: string;
}

export function Table({ headers, rows, className }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold text-slate-900">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-6 text-center text-slate-500">
                No data available
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface BadgeProps {
  status: string;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const colors: Record<string, string> = {
    MATCHED: "bg-green-100 text-green-800",
    UNMATCHED: "bg-yellow-100 text-yellow-800",
    CLAIMED: "bg-blue-100 text-blue-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CHIEF_ADMIN: "bg-purple-100 text-purple-800",
    ADMIN: "bg-blue-100 text-blue-800",
    MEMBER: "bg-slate-100 text-slate-800",
  };

  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${colors[status] || "bg-slate-100 text-slate-800"} ${className}`}>
      {status}
    </span>
  );
}

interface LoadingProps {
  message?: string;
}

export function Loading({ message = "Loading..." }: LoadingProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mr-3"></div>
      <span className="text-slate-600">{message}</span>
    </div>
  );
}

interface ErrorProps {
  message: string;
}

export function Error({ message }: ErrorProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-800 font-semibold">Error</p>
      <p className="text-red-700 text-sm mt-1">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  action?: { label: string; href: string };
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-slate-600 text-sm mt-2">{message}</p>
      {action && (
        <a href={action.href} className="inline-block mt-4 px-4 py-2 bg-slate-900 text-white text-sm rounded hover:bg-slate-800 transition">
          {action.label}
        </a>
      )}
    </div>
  );
}
