"use client";

import React, { useState } from "react";
import { apiClient } from "@/lib/api-client";

interface StepTwoProps {
  organizationId: string;
  onNext: () => void;
  onSkip: () => void;
}

type PaymentType = "TILL" | "PAYBILL" | "BANK";

export function StepTwo_PaymentSetup({ organizationId, onNext, onSkip }: StepTwoProps) {
  const [paymentType, setPaymentType] = useState<PaymentType | null>(null);
  const [tillNumber, setTillNumber] = useState("");
  const [paybillNumber, setPaybillNumber] = useState("");
  const [paybillAccount, setPaybillAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentType) {
      setError("Please select a payment method");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Construct payment account data based on type
      let accountData: any = {};
      
      if (paymentType === "TILL") {
        accountData = {
          accountType: "TILL",
          accountNumber: tillNumber,
          accountName: `M-Pesa Till ${tillNumber}`,
        };
      } else if (paymentType === "PAYBILL") {
        accountData = {
          accountType: "PAYBILL",
          accountNumber: paybillNumber,
          accountName: paybillAccount || `Paybill ${paybillNumber}`,
        };
      } else if (paymentType === "BANK") {
        accountData = {
          accountType: "BANK",
          accountNumber: accountNumber,
          accountName: `${bankName} - ${accountName}`,
        };
      }

      // Save payment account
      await apiClient.setPaymentAccount(organizationId, accountData);

      // Mark step as complete
      await apiClient.updateOnboardingStep(organizationId, 2, "paymentSetupDone");

      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set up payment account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (!paymentType) return false;
    
    if (paymentType === "TILL") return tillNumber.trim().length > 0;
    if (paymentType === "PAYBILL") return paybillNumber.trim().length > 0;
    if (paymentType === "BANK") return bankName.trim().length > 0 && accountNumber.trim().length > 0 && accountName.trim().length > 0;
    
    return false;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          How will members send contributions?
        </h1>
        <p className="text-lg text-slate-600">
          Members will use these details to send their payments
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment type selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* M-Pesa Till */}
          <button
            type="button"
            onClick={() => setPaymentType("TILL")}
            className={`
              p-6 rounded-xl border-2 transition-all text-left
              ${
                paymentType === "TILL"
                  ? "border-primary bg-primary/5 shadow-lg scale-105"
                  : "border-slate-300 hover:border-primary/50 hover:shadow-md"
              }
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
              {paymentType === "TILL" && (
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">M-Pesa Till</h3>
            <p className="text-sm text-slate-600">Members pay to your Till Number</p>
          </button>

          {/* M-Pesa Paybill */}
          <button
            type="button"
            onClick={() => setPaymentType("PAYBILL")}
            className={`
              p-6 rounded-xl border-2 transition-all text-left
              ${
                paymentType === "PAYBILL"
                  ? "border-primary bg-primary/5 shadow-lg scale-105"
                  : "border-slate-300 hover:border-primary/50 hover:shadow-md"
              }
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              {paymentType === "PAYBILL" && (
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">M-Pesa Paybill</h3>
            <p className="text-sm text-slate-600">Use Paybill with account numbers</p>
          </button>

          {/* Bank Account */}
          <button
            type="button"
            onClick={() => setPaymentType("BANK")}
            className={`
              p-6 rounded-xl border-2 transition-all text-left
              ${
                paymentType === "BANK"
                  ? "border-primary bg-primary/5 shadow-lg scale-105"
                  : "border-slate-300 hover:border-primary/50 hover:shadow-md"
              }
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              {paymentType === "BANK" && (
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Bank Account</h3>
            <p className="text-sm text-slate-600">Direct bank transfers</p>
          </button>
        </div>

        {/* Dynamic form fields based on payment type */}
        {paymentType === "TILL" && (
          <div className="pt-4">
            <label htmlFor="till-number" className="block text-sm font-semibold text-slate-900 mb-2">
              Till Number <span className="text-red-500">*</span>
            </label>
            <input
              id="till-number"
              type="text"
              value={tillNumber}
              onChange={(e) => setTillNumber(e.target.value)}
              placeholder="e.g. 123456"
              className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              required
            />
          </div>
        )}

        {paymentType === "PAYBILL" && (
          <div className="pt-4 space-y-4">
            <div>
              <label htmlFor="paybill-number" className="block text-sm font-semibold text-slate-900 mb-2">
                Paybill Number <span className="text-red-500">*</span>
              </label>
              <input
                id="paybill-number"
                type="text"
                value={paybillNumber}
                onChange={(e) => setPaybillNumber(e.target.value)}
                placeholder="e.g. 400200"
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="paybill-account" className="block text-sm font-semibold text-slate-900 mb-2">
                Account Number <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                id="paybill-account"
                type="text"
                value={paybillAccount}
                onChange={(e) => setPaybillAccount(e.target.value)}
                placeholder="e.g. ACC001"
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
        )}

        {paymentType === "BANK" && (
          <div className="pt-4 space-y-4">
            <div>
              <label htmlFor="bank-name" className="block text-sm font-semibold text-slate-900 mb-2">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                id="bank-name"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Equity Bank"
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="account-number" className="block text-sm font-semibold text-slate-900 mb-2">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                id="account-number"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 0123456789"
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="account-name" className="block text-sm font-semibold text-slate-900 mb-2">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                id="account-name"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                required
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onSkip}
            className="order-2 sm:order-1 px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            I'll set this up later
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid()}
            className="order-1 sm:order-2 flex-1 px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? "Saving..." : "Save & Continue →"}
          </button>
        </div>
      </form>
    </div>
  );
}
