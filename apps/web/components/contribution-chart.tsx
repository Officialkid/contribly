"use client";

import React, { useState, useEffect } from "react";

interface ContributionDataPoint {
  month: string;
  amount: number;
}

interface ContributionChartProps {
  data: ContributionDataPoint[];
  year: number;
}

export function ContributionChart({ data, year }: ContributionChartProps) {
  const [maxAmount, setMaxAmount] = useState(0);

  useEffect(() => {
    const max = Math.max(...data.map((d) => d.amount), 1);
    setMaxAmount(max);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-background rounded-lg border border-border">
        <p className="text-text-muted">No contribution data available</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-text-primary mb-6">Monthly Contributions - {year}</h3>
      
      <div className="space-y-4">
        {/* Chart Bars */}
        <div className="space-y-2">
          {data.map((dataPoint) => {
            const heightPercent = maxAmount > 0 ? (dataPoint.amount / maxAmount) * 100 : 0;
            return (
              <div key={dataPoint.month}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text-muted">{dataPoint.month}</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {(dataPoint.amount / 100).toLocaleString("en-KE", {
                      style: "currency",
                      currency: "KES",
                    })}
                  </span>
                </div>
                <div className="w-full bg-background border border-border rounded-full overflow-hidden h-8">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${heightPercent}%` }}
                  >
                    {heightPercent > 15 && (
                      <span className="text-xs font-bold text-white">
                        {Math.round(heightPercent)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-border grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-text-muted">Total Contributions</p>
            <p className="text-lg font-bold text-text-primary">
              {(data.reduce((sum, d) => sum + d.amount, 0) / 100).toLocaleString("en-KE", {
                style: "currency",
                currency: "KES",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Average Per Month</p>
            <p className="text-lg font-bold text-accent">
              {(data.reduce((sum, d) => sum + d.amount, 0) / data.length / 100).toLocaleString("en-KE", {
                style: "currency",
                currency: "KES",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Peak Month</p>
            <p className="text-lg font-bold text-primary">
              {data.length > 0 && data.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev)).month}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
