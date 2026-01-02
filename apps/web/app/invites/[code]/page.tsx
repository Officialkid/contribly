"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Card, Error, Loading } from "@/components/ui";

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [step, setStep] = useState<"load" | "choice" | "register" | "existing">(
    "load"
  );
  const [inviteInfo, setInviteInfo] = useState<{
    organizationName?: string;
    departmentName?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Registration form
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);

  // Existing user login form
  const [existingData, setExistingData] = useState({
    email: "",
    password: "",
  });
  const [existingLoading, setExistingLoading] = useState(false);

  // Load invite info
  useEffect(() => {
    const loadInvite = async () => {
      try {
        // Try to decode/validate the invite (you may need to add an endpoint for this)
        // For now, we'll just proceed to the choice screen
        setInviteInfo({});
        setStep("choice");
      } catch (err) {
        setError("Invalid invite link");
        setStep("choice");
      }
    };

    loadInvite();
  }, [code]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await apiClient.register({
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
      });

      // Now accept the invite
      if (response.user) {
        const inviteResponse = await apiClient.acceptInvite(code, {
          token: undefined, // New user registration
        });

        if (inviteResponse.user) {
          router.push(
            `/orgs/${inviteResponse.user.organizationId}?welcome=true`
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExistingLoading(true);

    try {
      // First login
      const loginResponse = await apiClient.login(
        existingData.email,
        existingData.password
      );

      if (loginResponse.user) {
        // Then accept invite
        const inviteResponse = await apiClient.acceptInvite(code, {
          token: undefined,
        });

        if (inviteResponse.user) {
          router.push(`/orgs/${inviteResponse.user.organizationId}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setExistingLoading(false);
    }
  };

  if (step === "load") {
    return <Loading message="Loading invite..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">You're Invited!</h1>
            <p className="text-slate-600 mt-1">Join your organization on Contribly</p>
          </div>

          {error && <Error message={error} />}

          {step === "choice" && (
            <div className="space-y-3">
              <button
                onClick={() => setStep("register")}
                className="w-full px-4 py-3 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition font-medium"
              >
                Create New Account
              </button>
              <button
                onClick={() => setStep("existing")}
                className="w-full px-4 py-3 bg-slate-200 text-slate-900 rounded-md hover:bg-slate-300 transition font-medium"
              >
                Sign In Existing Account
              </button>
            </div>
          )}

          {step === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={registerData.firstName}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={registerData.lastName}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition font-medium"
              >
                {registerLoading ? "Creating account..." : "Accept Invite"}
              </button>

              <button
                type="button"
                onClick={() => setStep("choice")}
                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100 transition"
              >
                Back
              </button>
            </form>
          )}

          {step === "existing" && (
            <form onSubmit={handleExisting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={existingData.email}
                  onChange={(e) =>
                    setExistingData({ ...existingData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={existingData.password}
                  onChange={(e) =>
                    setExistingData({ ...existingData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={existingLoading}
                className="w-full px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition font-medium"
              >
                {existingLoading ? "Signing in..." : "Accept Invite"}
              </button>

              <button
                type="button"
                onClick={() => setStep("choice")}
                className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100 transition"
              >
                Back
              </button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
