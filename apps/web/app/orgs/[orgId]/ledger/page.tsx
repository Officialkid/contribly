"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, parseCurrencyInput } from "@/lib/currency";
import { useOrg } from "@/lib/org-context";
import type { MemberLedgerImportRow, MemberLedgerRecord } from "@/lib/types";
import { Card, EmptyState, Error as ErrorView, Loading } from "@/components/ui";

const currentYear = new Date().getFullYear();

function parseExcelRows(value: string): MemberLedgerImportRow[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [name, email, phone, expectedAmount, paymentReference, notes] = line
        .split("\t")
        .map((cell) => cell.trim());
      const amount = parseCurrencyInput(expectedAmount || "0");
      if (!name || !Number.isFinite(amount) || amount < 0) {
        throw new Error(`Row ${index + 1} needs a name and a valid expected amount.`);
      }
      return {
        name,
        email: email || null,
        phone: phone || null,
        expectedAmount: amount,
        paymentReference: paymentReference || null,
        notes: notes || null,
      };
    });
}

export default function MemberLedgerPage() {
  const { user, activeOrgId, activeDeptId } = useOrg();
  const [year, setYear] = useState(currentYear);
  const [members, setMembers] = useState<MemberLedgerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [excelRows, setExcelRows] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberLedgerRecord | null>(null);
  const [payment, setPayment] = useState({ amount: "", reference: "", accountNumber: "" });
  const isAdmin = user?.role === "CHIEF_ADMIN" || user?.role === "ADMIN";

  const loadLedger = async () => {
    if (!activeOrgId || !activeDeptId || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = isAdmin
        ? await apiClient.listMemberLedger(activeOrgId, activeDeptId, year)
        : await apiClient.getMyMemberLedger(activeOrgId, activeDeptId, year);
      setMembers(response.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the member ledger.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLedger();
  }, [activeOrgId, activeDeptId, year, user?.id]);

  const importRows = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeOrgId || !activeDeptId) return;
    setError(null);
    setNotice(null);
    setIsSaving(true);
    try {
      const rows = parseExcelRows(excelRows);
      if (rows.length === 0) throw new Error("Paste at least one row from Excel.");
      const result = await apiClient.importMemberLedger(activeOrgId, activeDeptId, year, rows);
      setExcelRows("");
      setNotice(`${result.created} added, ${result.updated} updated, ${result.linked} linked to accounts.`);
      await loadLedger();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const recordPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeOrgId || !activeDeptId || !selectedMember) return;
    const amount = parseCurrencyInput(payment.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.recordMemberLedgerPayment(activeOrgId, activeDeptId, selectedMember.id, {
        amount,
        reference: payment.reference || null,
        accountNumber: payment.accountNumber || null,
        transactionDate: new Date().toISOString(),
      });
      setNotice(`Payment recorded for ${selectedMember.name}.`);
      setSelectedMember(null);
      setPayment({ amount: "", reference: "", accountNumber: "" });
      await loadLedger();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record payment.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeDeptId) {
    return <div className="p-8"><EmptyState title="Select a department" message="Choose a department to open its member ledger." /></div>;
  }

  const expected = members.reduce((sum, member) => sum + member.expectedAmount, 0);
  const paid = members.reduce((sum, member) => sum + member.paidAmount, 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Contribution records</p>
          <h1 className="mt-2 text-3xl font-bold text-text-primary">Member Ledger</h1>
          <p className="mt-2 text-text-muted">Track expected contributions and manual PoChi, cash, or bank payments.</p>
        </div>
        <label className="text-sm font-semibold text-text-primary">
          Year
          <input
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="ml-3 w-28 rounded-button border-2 border-border bg-white px-3 py-2"
          />
        </label>
      </div>

      {error && <ErrorView message={error} />}
      {notice && <div className="rounded-button border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">{notice}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-text-muted">Members</p><p className="mt-2 text-3xl font-bold">{members.length}</p></Card>
        <Card className="p-5"><p className="text-sm text-text-muted">Expected</p><p className="mt-2 text-3xl font-bold">{formatCurrency(expected)}</p></Card>
        <Card className="p-5"><p className="text-sm text-text-muted">Received</p><p className="mt-2 text-3xl font-bold text-green-700">{formatCurrency(paid)}</p></Card>
      </div>

      {isAdmin && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-text-primary">Paste from Excel</h2>
          <p className="mt-1 text-sm text-text-muted">
            Copy rows in this order: Name, Email, Phone, Expected amount in KES, Payment reference, Notes.
          </p>
          <form onSubmit={importRows} className="mt-4 space-y-3">
            <textarea
              value={excelRows}
              onChange={(event) => setExcelRows(event.target.value)}
              rows={6}
              placeholder={"Jane Wanjiku\tjane@example.com\t0712345678\t120.00\tHVD-JANE-2026\t"}
              className="w-full rounded-button border-2 border-border bg-background p-4 font-mono text-sm focus:border-primary focus:outline-none"
            />
            <button disabled={isSaving} className="rounded-button bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50">
              {isSaving ? "Importing..." : "Import rows"}
            </button>
          </form>
        </Card>
      )}

      {selectedMember && isAdmin && (
        <Card className="border-2 border-primary/30 p-6">
          <h2 className="text-xl font-bold">Record payment for {selectedMember.name}</h2>
          <form onSubmit={recordPayment} className="mt-4 grid gap-3 md:grid-cols-4">
            <input required type="number" min="0.01" step="0.01" placeholder="Amount (KES)" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} className="rounded-button border-2 border-border px-3 py-2" />
            <input placeholder="Transaction/reference code" value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} className="rounded-button border-2 border-border px-3 py-2" />
            <input placeholder="PoChi/account number" value={payment.accountNumber} onChange={(e) => setPayment({ ...payment, accountNumber: e.target.value })} className="rounded-button border-2 border-border px-3 py-2" />
            <div className="flex gap-2">
              <button disabled={isSaving} className="flex-1 rounded-button bg-primary px-4 py-2 font-semibold text-white">Save</button>
              <button type="button" onClick={() => setSelectedMember(null)} className="rounded-button border-2 border-border px-4 py-2">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <Loading message="Loading member ledger..." />
      ) : members.length === 0 ? (
        <EmptyState title="No records for this year" message={isAdmin ? "Paste your 2026 Excel rows above to begin." : "Your administrator has not linked a record to your account yet."} />
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <Card key={member.id} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-text-primary">{member.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${member.linked ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                      {member.linked ? "Account linked" : "Awaiting signup"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-muted">{member.email || member.phone || member.paymentReference}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${member.progressPercent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-text-muted">Reference: {member.paymentReference}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right md:min-w-[360px]">
                  <div><p className="text-xs text-text-muted">Expected</p><p className="font-bold">{formatCurrency(member.expectedAmount)}</p></div>
                  <div><p className="text-xs text-text-muted">Paid</p><p className="font-bold text-green-700">{formatCurrency(member.paidAmount)}</p></div>
                  <div><p className="text-xs text-text-muted">Balance</p><p className="font-bold text-amber-700">{formatCurrency(member.balance)}</p></div>
                </div>
                {isAdmin && (
                  <button onClick={() => setSelectedMember(member)} className="rounded-button border-2 border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white">
                    Record payment
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
