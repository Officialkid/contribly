"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, Loading, EmptyState, Badge } from "@/components/ui";

interface OnboardingState {
  id: string;
  organizationId: string;
  currentStep: number;
  completedSteps: number[];
  isComplete: boolean;
  orgProfileDone: boolean;
  paymentSetupDone: boolean;
  deptCreatedDone: boolean;
  inviteSentDone: boolean;
  completedAt: string | null;
  percentComplete: number;
}

export default function OrganizationSettingsPage() {
  const { activeOrgId, activeOrg, user } = useOrg();
  const router = useRouter();
  const isChiefAdmin = activeOrg?.role === "CHIEF_ADMIN";

  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  
  const [paymentAccount, setPaymentAccount] = useState<any>(null);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<"TILL" | "PAYBILL" | "BANK">("TILL");
  const [paymentData, setPaymentData] = useState({
    tillNumber: "",
    paybillNumber: "",
    accountNumber: "",
    bankName: "",
    accountName: "",
  });

  const [deleteOrgName, setDeleteOrgName] = useState("");
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!activeOrgId) return;

    // Fetch onboarding status
    const fetchOnboarding = async () => {
      try {
        const response = await apiClient.getOnboardingStatus(activeOrgId);
        setOnboardingState(response.onboarding);
      } catch (err) {
        console.error("Failed to load onboarding status:", err);
      } finally {
        setIsLoadingOnboarding(false);
      }
    };

    // Fetch org details
    const fetchOrgDetails = async () => {
      try {
        const response = await apiClient.getOrganization(activeOrgId) as any;
        if (response.organization) {
          setOrgName(response.organization.name || "");
          setOrgDescription(response.organization.description || "");
        }
      } catch (err) {
        console.error("Failed to load organization details:", err);
      }
    };

    // Fetch payment account
    const fetchPaymentAccount = async () => {
      try {
        const response = await apiClient.getPaymentAccount(activeOrgId);
        setPaymentAccount(response.account || null);
      } catch (err) {
        console.error("Failed to load payment account:", err);
      }
    };

    fetchOnboarding();
    fetchOrgDetails();
    fetchPaymentAccount();
  }, [activeOrgId]);

  if (!activeOrgId) {
    return (
      <DashboardLayout>
        <EmptyState
          title="No Organization"
          message="Please select or create an organization first"
        />
      </DashboardLayout>
    );
  }

  if (!isChiefAdmin) {
    return (
      <DashboardLayout>
        <EmptyState
          title="Access Denied"
          message="Only Chief Admins can access organization settings"
        />
      </DashboardLayout>
    );
  }

  const handleSaveOrgProfile = async () => {
    if (!activeOrgId) return;

    setIsSavingOrg(true);
    try {
      await apiClient.updateOrganization(activeOrgId, {
        name: orgName,
        description: orgDescription,
      });
      setToast({ message: "Organization profile updated successfully", type: "success" });
      setIsEditingOrg(false);
    } catch (err) {
      setToast({ message: "Failed to update organization profile", type: "error" });
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleSavePaymentAccount = async () => {
    if (!activeOrgId) return;

    setIsSavingPayment(true);
    try {
      let accountData: any = {};
      
      if (paymentType === "TILL") {
        accountData = {
          accountType: "TILL",
          accountNumber: paymentData.tillNumber,
        };
      } else if (paymentType === "PAYBILL") {
        accountData = {
          accountType: "PAYBILL",
          accountNumber: paymentData.paybillNumber,
          accountName: paymentData.accountNumber,
        };
      } else if (paymentType === "BANK") {
        accountData = {
          accountType: "BANK",
          accountNumber: paymentData.accountNumber,
          accountName: `${paymentData.bankName} - ${paymentData.accountName}`,
        };
      }

      await apiClient.setPaymentAccount(activeOrgId, accountData);
      
      // Refresh payment account
      const response = await apiClient.getPaymentAccount(activeOrgId);
      setPaymentAccount(response.account || null);
      
      setToast({ message: "Payment account updated successfully", type: "success" });
      setIsEditingPayment(false);
    } catch (err) {
      setToast({ message: "Failed to update payment account", type: "error" });
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!activeOrgId) return;

    try {
      await apiClient.completeOnboarding(activeOrgId);
      setToast({ message: "Onboarding marked as complete", type: "success" });
      
      // Refresh onboarding status
      const response = await apiClient.getOnboardingStatus(activeOrgId);
      setOnboardingState(response.onboarding);
    } catch (err) {
      setToast({ message: "Failed to complete onboarding", type: "error" });
    }
  };

  const incompleteSteps = onboardingState ? [
    { step: 1, label: "Organization Profile", done: onboardingState.orgProfileDone },
    { step: 2, label: "Payment Setup", done: onboardingState.paymentSetupDone },
    { step: 3, label: "First Department", done: onboardingState.deptCreatedDone },
    { step: 4, label: "Invite Members", done: onboardingState.inviteSentDone },
  ].filter(s => !s.done) : [];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white animate-in slide-in-from-top-2 duration-300`}>
            {toast.message}
          </div>
        )}

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Organization Settings</h1>
          <p className="text-text-muted mt-2">Manage your organization profile, payment details, and setup completion</p>
        </div>

        {/* Setup Completion Card */}
        {!isLoadingOnboarding && onboardingState && !onboardingState.isComplete && (
          <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Complete your organization setup
                </h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      {onboardingState.percentComplete}% complete
                    </span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${onboardingState.percentComplete}%` }}
                    />
                  </div>
                </div>
                
                {incompleteSteps.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-slate-700">Incomplete steps:</p>
                    {incompleteSteps.map((item) => (
                      <div key={item.step} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-amber-200">
                        <span className="text-sm text-slate-700">{item.label}</span>
                        <button
                          onClick={() => router.push(`/onboarding?step=${item.step}`)}
                          className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                          Complete →
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleCompleteOnboarding}
                  className="text-sm text-slate-600 hover:text-slate-800 font-medium underline"
                >
                  Dismiss (mark as complete)
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Organization Profile Section */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Organization Profile</h2>
              <p className="text-sm text-text-muted mt-1">Basic information about your organization</p>
            </div>
            {!isEditingOrg && (
              <button
                onClick={() => setIsEditingOrg(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingOrg ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter organization name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Describe your organization..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveOrgProfile}
                  disabled={isSavingOrg || !orgName.trim()}
                  className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                  {isSavingOrg ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setIsEditingOrg(false);
                    setOrgName(activeOrg?.name || "");
                    setOrgDescription("");
                  }}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <span className="text-sm font-semibold text-slate-500">Name:</span>
                <p className="text-base text-slate-900 mt-1">{orgName || "Not set"}</p>
              </div>
              {orgDescription && (
                <div>
                  <span className="text-sm font-semibold text-slate-500">Description:</span>
                  <p className="text-base text-slate-900 mt-1">{orgDescription}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Payment Account Section */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Payment Account</h2>
              <p className="text-sm text-text-muted mt-1">Configure how members make payments</p>
            </div>
            {!isEditingPayment && (
              <button
                onClick={() => setIsEditingPayment(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                {paymentAccount ? "Edit" : "Set up now"}
              </button>
            )}
          </div>

          {isEditingPayment ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Payment Method *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentType("TILL")}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      paymentType === "TILL"
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-sm font-semibold">M-Pesa Till</div>
                  </button>
                  <button
                    onClick={() => setPaymentType("PAYBILL")}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      paymentType === "PAYBILL"
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-sm font-semibold">M-Pesa Paybill</div>
                  </button>
                  <button
                    onClick={() => setPaymentType("BANK")}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      paymentType === "BANK"
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-sm font-semibold">Bank Account</div>
                  </button>
                </div>
              </div>

              {paymentType === "TILL" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Till Number *
                  </label>
                  <input
                    type="text"
                    value={paymentData.tillNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, tillNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter M-Pesa Till Number"
                  />
                </div>
              )}

              {paymentType === "PAYBILL" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Paybill Number *
                    </label>
                    <input
                      type="text"
                      value={paymentData.paybillNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, paybillNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter Paybill Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Account Number (optional)
                    </label>
                    <input
                      type="text"
                      value={paymentData.accountNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, accountNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter Account Number"
                    />
                  </div>
                </>
              )}

              {paymentType === "BANK" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      value={paymentData.bankName}
                      onChange={(e) => setPaymentData({ ...paymentData, bankName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. Equity Bank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      value={paymentData.accountNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, accountNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter Bank Account Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      value={paymentData.accountName}
                      onChange={(e) => setPaymentData({ ...paymentData, accountName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter Account Name"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSavePaymentAccount}
                  disabled={isSavingPayment}
                  className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                  {isSavingPayment ? "Saving..." : "Save Payment Account"}
                </button>
                <button
                  onClick={() => {setIsEditingPayment(false);
                  }}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {paymentAccount ? (
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-semibold text-slate-500">Type:</span>
                    <p className="text-base text-slate-900 mt-1">
                      {paymentAccount.accountType === "TILL" && "M-Pesa Till"}
                      {paymentAccount.accountType === "PAYBILL" && "M-Pesa Paybill"}
                      {paymentAccount.accountType === "BANK" && "Bank Account"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-500">
                      {paymentAccount.accountType === "TILL" && "Till Number:"}
                      {paymentAccount.accountType === "PAYBILL" && "Paybill Number:"}
                      {paymentAccount.accountType === "BANK" && "Account Number:"}
                    </span>
                    <p className="text-base text-slate-900 mt-1 font-mono">{paymentAccount.accountNumber}</p>
                  </div>
                  {paymentAccount.accountName && (
                    <div>
                      <span className="text-sm font-semibold text-slate-500">Account Name:</span>
                      <p className="text-base text-slate-900 mt-1">{paymentAccount.accountName}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                  <p className="text-slate-600 mb-3">No payment account configured</p>
                  <button
                    onClick={() => setIsEditingPayment(true)}
                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors inline-block"
                  >
                    Set up now
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Danger Zone */}
        <Card className="border-2 border-red-200 bg-red-50/50">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-red-700">Danger Zone</h2>
            <p className="text-sm text-red-600 mt-1">Irreversible and destructive actions</p>
          </div>

          <div className="bg-white border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Organization</h3>
            <p className="text-sm text-slate-600 mb-4">
              This feature is not yet implemented. Deleting an organization will permanently remove all departments, members, contributions, and payment records.
            </p>
            <button
              disabled
              className="px-6 py-2 bg-slate-300 cursor-not-allowed text-slate-500 rounded-lg font-semibold"
            >
              Delete Organization (Coming Soon)
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
