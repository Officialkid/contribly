"use client";

import React, { useState, useEffect } from "react";
import { useOrg } from "@/lib/org-context";
import { apiClient } from "@/lib/api-client";
import { CarryForward, Payment } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { Card, Loading, Error, EmptyState } from "@/components/ui";

interface MonthStatus {
  month: string;
  monthNumber: number;
  status: "PAID" | "PENDING" | "CLEARED_IN_ADVANCE";
  coveredByPaymentId?: string;
  isCurrentMonth: boolean;
  isPast: boolean;
}

interface YearData {
  year: number;
  months: MonthStatus[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function MemberBalanceView() {
  const { user, activeOrgId, activeDeptId } = useOrg();
  const [balance, setBalance] = useState<CarryForward | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearData, setYearData] = useState<YearData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch balance and payments
  useEffect(() => {
    if (!activeOrgId || !activeDeptId || !user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get member balance
        const balanceResponse = await apiClient.getMemberBalance(
          activeOrgId,
          activeDeptId,
          user.id
        );
        setBalance(balanceResponse.balance);

        // Get all payments for this organization
        const paymentsResponse = await apiClient.listPayments(activeOrgId);
        const allPayments = (paymentsResponse as any)?.payments || [];
        
        // Filter to only matched/claimed payments for this department
        const userPayments = allPayments.filter(
          (p: Payment) =>
            (p.status === "MATCHED" || p.status === "CLAIMED") &&
            p.department?.id === activeDeptId
        );
        
        setPayments(userPayments);
      } catch (err: unknown) {
        const message = (err as { message?: string })?.message ?? "Failed to load balance";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeOrgId, activeDeptId, user?.id]);

  // Calculate month statuses based on payments and balance
  useEffect(() => {
    if (!balance) return;

    const monthlyAmountInCents = typeof balance.monthlyAmount === "number"
      ? balance.monthlyAmount
      : parseInt(balance.monthlyAmount as string, 10) || 0;

    const totalContributedInCents = typeof balance.totalContributed === "number"
      ? balance.totalContributed
      : parseInt(balance.totalContributed as string, 10) || 0;

    const carryForwardInCents = typeof balance.carryForward === "number"
      ? balance.carryForward
      : parseInt(balance.carryForward as string, 10) || 0;

    const now = new Date();
    const currentYear = selectedYear;
    const currentMonth = now.getMonth();
    const currentDate = now.getFullYear();

    // Calculate months covered by contributions
    let monthsCovered = 0;
    let remainingAmount = totalContributedInCents;

    // Calculate how many months are covered by contributions
    if (monthlyAmountInCents > 0) {
      monthsCovered = Math.floor(remainingAmount / monthlyAmountInCents);
    }

    // Find which payment covers which month
    const paymentToMonthMap = new Map<string, number[]>();
    let runningMonths = 0;

    // Sort payments by date
    const sortedPayments = [...payments].sort(
      (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );

    for (const payment of sortedPayments) {
      const paymentAmountInCents = typeof payment.amount === "number"
        ? payment.amount
        : parseInt(payment.amount as string, 10) || 0;

      const paymentMonthsCovered = monthlyAmountInCents > 0
        ? Math.floor(paymentAmountInCents / monthlyAmountInCents)
        : 0;

      const coveredMonths: number[] = [];
      for (let i = 0; i < paymentMonthsCovered; i++) {
        if (runningMonths + i < 12) {
          coveredMonths.push(runningMonths + i);
        }
      }

      if (coveredMonths.length > 0) {
        paymentToMonthMap.set(payment.id, coveredMonths);
        runningMonths += paymentMonthsCovered;
      }
    }

    // Build month statuses
    const months: MonthStatus[] = MONTHS.map((month, index) => {
      const isCurrentMonth = currentDate === currentYear && index === currentMonth;
      const isPast = currentDate > currentYear || (currentDate === currentYear && index < currentMonth);
      
      // Check if this month is covered by a payment
      let status: "PAID" | "PENDING" | "CLEARED_IN_ADVANCE" = "PENDING";
      let coveredByPaymentId: string | undefined;

      // Look through payment-to-month map
      for (const [paymentId, coveredMonths] of paymentToMonthMap.entries()) {
        if (coveredMonths.includes(index)) {
          // Check if this is a past month or current month
          if (isPast || isCurrentMonth) {
            status = "PAID";
          } else {
            status = "CLEARED_IN_ADVANCE";
          }
          coveredByPaymentId = paymentId;
          break;
        }
      }

      return {
        month,
        monthNumber: index,
        status,
        coveredByPaymentId,
        isCurrentMonth,
        isPast,
      };
    });

    setYearData({ year: currentYear, months });
  }, [balance, payments, selectedYear]);

  if (!activeOrgId || !activeDeptId) {
    return (
      <EmptyState
        title="No Department Selected"
        message="Please select a department from the sidebar to view your balance."
      />
    );
  }

  if (isLoading) return <Loading />;
  if (error) return <Error message={error} />;
  if (!balance || !yearData) return <EmptyState title="No Data" message="No balance data available" />;

  const monthlyAmountInCents = typeof balance.monthlyAmount === "number"
    ? balance.monthlyAmount
    : parseInt(balance.monthlyAmount as string, 10) || 0;

  const totalContributedInCents = typeof balance.totalContributed === "number"
    ? balance.totalContributed
    : parseInt(balance.totalContributed as string, 10) || 0;

  // Calculate how many months total are covered
  const monthsCovered = monthlyAmountInCents > 0
    ? Math.floor(totalContributedInCents / monthlyAmountInCents)
    : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Monthly Payment Status</h1>
        <p className="text-text-muted mt-1">See which months are covered by your contributions</p>
      </div>

      {/* Explanation Banner */}
      <div className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30 rounded-lg p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">Payment Coverage Explanation</h3>
            <p className="text-text-muted mt-2">
              Your payment of <span className="font-bold text-accent">{formatCurrency(totalContributedInCents)}</span> covers{" "}
              <span className="font-bold text-primary">{monthsCovered} month{monthsCovered !== 1 ? "s" : ""}</span> based on a monthly contribution of{" "}
              <span className="font-bold text-primary">{formatCurrency(monthlyAmountInCents)}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Year Selector */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Select Year</h2>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="px-3 py-2 rounded-md text-sm font-semibold text-text-muted hover:bg-primary/5 hover:text-primary transition-all"
            >
              ← {selectedYear - 1}
            </button>
            <span className="px-4 py-2 rounded-md bg-primary/10 text-primary font-bold min-w-24 text-center">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="px-3 py-2 rounded-md text-sm font-semibold text-text-muted hover:bg-primary/5 hover:text-primary transition-all"
            >
              {selectedYear + 1} →
            </button>
          </div>
        </div>
      </Card>

      {/* Months Grid */}
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-4">Months - {selectedYear}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {yearData.months.map((month) => (
            <div
              key={month.monthNumber}
              className={`p-4 rounded-lg border-2 transition-all ${
                month.status === "PAID"
                  ? "border-green-300 bg-green-50"
                  : month.status === "CLEARED_IN_ADVANCE"
                  ? "border-blue-300 bg-blue-50"
                  : "border-yellow-300 bg-yellow-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-text-primary">{month.month}</p>
                  <p className="text-xs text-text-muted mt-1 uppercase tracking-wide">
                    {month.status === "PAID"
                      ? "✓ Paid"
                      : month.status === "CLEARED_IN_ADVANCE"
                      ? "Cleared in Advance"
                      : "⚠ Pending"}
                  </p>
                </div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    month.status === "PAID"
                      ? "bg-green-200 text-green-700"
                      : month.status === "CLEARED_IN_ADVANCE"
                      ? "bg-blue-200 text-blue-700"
                      : "bg-yellow-200 text-yellow-700"
                  }`}
                >
                  {month.status === "PAID"
                    ? "✓"
                    : month.status === "CLEARED_IN_ADVANCE"
                    ? "+"
                    : "!"}
                </div>
              </div>

              {/* Status descriptor */}
              <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                <p className="text-xs font-medium text-text-muted">
                  {month.status === "PAID"
                    ? "This month's contribution has been received and recorded."
                    : month.status === "CLEARED_IN_ADVANCE"
                    ? "This month is covered by advance payments."
                    : "This month's contribution is pending."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <Card className="p-6 bg-background/50">
        <h3 className="font-semibold text-text-primary mb-4">Payment Status Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-xs font-bold text-green-700">✓</span>
            </div>
            <div>
              <p className="font-semibold text-text-primary">Paid</p>
              <p className="text-sm text-text-muted">Current or past month with confirmed payment</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-xs font-bold text-blue-700">+</span>
            </div>
            <div>
              <p className="font-semibold text-text-primary">Cleared in Advance</p>
              <p className="text-sm text-text-muted">Future month covered by overpayment</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-xs font-bold text-yellow-700">!</span>
            </div>
            <div>
              <p className="font-semibold text-text-primary">Pending</p>
              <p className="text-sm text-text-muted">Awaiting payment or claim</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <p className="text-sm font-semibold text-text-muted uppercase tracking-wide">Total Contributed</p>
          <p className="text-4xl font-bold text-accent mt-2">{formatCurrency(totalContributedInCents)}</p>
          <p className="text-sm text-text-muted mt-3">Across all payments</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold text-text-muted uppercase tracking-wide">Months Covered</p>
          <p className="text-4xl font-bold text-primary mt-2">{monthsCovered}</p>
          <p className="text-sm text-text-muted mt-3">At {formatCurrency(monthlyAmountInCents)} per month</p>
        </Card>
      </div>
    </div>
  );
}
