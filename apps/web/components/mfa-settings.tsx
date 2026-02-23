"use client";

import React, { useState, useEffect, useRef } from "react";
import { useOrg } from "@/lib/org-context";

export function MFASettings() {
  const { user } = useOrg();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // OTP verification states
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpMode, setOtpMode] = useState<"enable" | "disable">("enable");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load MFA status on mount
  useEffect(() => {
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/mfa/status`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMfaEnabled(data.mfaEnabled);
      } else {
        setError(data.error || "Failed to load MFA status");
      }
    } catch (err) {
      setError("Failed to load MFA status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableMFA = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/mfa/enable`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || "Verification code sent to your email");
        setOtpMode("enable");
        setShowOtpInput(true);
      } else {
        setError(data.error || "Failed to send verification code");
      }
    } catch (err) {
      setError("Failed to enable MFA");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisableMFA = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);

      // First attempt to disable (will request verification code)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/mfa/disable`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code: "" }), // Empty code to trigger email send
        }
      );

      const data = await response.json();

      if (!response.ok && data.error?.includes("Verification code sent")) {
        setSuccess("Verification code sent to your email");
        setOtpMode("disable");
        setShowOtpInput(true);
      } else if (response.ok && data.success) {
        setSuccess("MFA disabled successfully");
        setMfaEnabled(false);
      } else {
        setError(data.error || "Failed to process request");
      }
    } catch (err) {
      setError("Failed to disable MFA");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOtpCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...otpCode];
    newCode[index] = value;
    setOtpCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...otpCode];
    
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    
    setOtpCode(newCode);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.join("");
    
    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);

      const endpoint = otpMode === "enable" ? "/api/auth/mfa/confirm" : "/api/auth/mfa/disable";
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || (otpMode === "enable" ? "MFA enabled successfully" : "MFA disabled successfully"));
        setMfaEnabled(otpMode === "enable");
        setShowOtpInput(false);
        setOtpCode(["", "", "", "", "", ""]);
      } else {
        setError(data.error || "Verification failed");
        setOtpCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Verification failed");
      setOtpCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOtp = () => {
    setShowOtpInput(false);
    setOtpCode(["", "", "", "", "", ""]);
    setError(null);
    setSuccess(null);
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-card shadow-soft p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-card shadow-soft p-6 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Two-Factor Authentication</h3>
        <p className="text-text-muted">
          Add an extra layer of security to your account by requiring a verification code when signing in.
        </p>
      </div>

      {/* Status messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-button p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-button p-4">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {!showOtpInput ? (
        <>
          {/* MFA Status */}
          <div className="flex items-center justify-between p-4 bg-background border border-border rounded-button">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${mfaEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                {mfaEnabled ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-semibold text-text-primary">
                  {mfaEnabled ? "MFA Enabled" : "MFA Disabled"}
                </p>
                <p className="text-sm text-text-muted">
                  {mfaEnabled 
                    ? "Your account is protected with two-factor authentication" 
                    : "Enable MFA to secure your account"}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${mfaEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {mfaEnabled ? "Active" : "Inactive"}
            </div>
          </div>

          {/* Action button */}
          <div>
            {!mfaEnabled ? (
              <button
                onClick={handleEnableMFA}
                disabled={isProcessing}
                className="w-full py-3 bg-primary text-white rounded-button font-semibold hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : "Enable Two-Factor Authentication"}
              </button>
            ) : (
              <button
                onClick={handleDisableMFA}
                disabled={isProcessing}
                className="w-full py-3 bg-red-600 text-white rounded-button font-semibold hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : "Disable Two-Factor Authentication"}
              </button>
            )}
          </div>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-button p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>When enabled, you'll receive a 6-digit code via email every time you sign in</li>
                  <li>The code expires after 10 minutes for security</li>
                  <li>Make sure you have access to {user?.email} to receive codes</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* OTP Verification Form */}
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-text-primary">Verify Your Email</h4>
            <p className="text-text-muted mt-2">
              We've sent a 6-digit verification code to<br />
              <span className="font-semibold text-text-primary">{user?.email}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3 text-center">
                Enter Verification Code
              </label>
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-background border-2 border-border rounded-button text-text-primary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-button p-4">
              <p className="text-yellow-800 text-sm text-center">
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                The code will expire in 10 minutes
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelOtp}
                className="flex-1 py-3 border-2 border-border rounded-button font-semibold text-text-primary hover:bg-background transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 py-3 bg-primary text-white rounded-button font-semibold hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : "Verify Code"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
