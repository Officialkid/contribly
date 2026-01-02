"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Card, Error } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.login(email, password);
      if (response.user && response.user.organizationId) {
        router.push(`/orgs/${response.user.organizationId}`);
      } else {
        setError("No organization found for this user");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contribly</h1>
            <p className="text-slate-600 mt-1">Contribution Management Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <Error message={error} />}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition font-medium"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <a href="/register" className="font-medium text-slate-900 hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
