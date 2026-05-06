import { Loan, LoanProductDefinition, LoanScheduleItem, LoanTransaction, LoanTranche } from "../types/loan-lifecycle.types";

export const loansLifecycleService = {
  async listLoans(): Promise<Loan[]> {
    const response = await fetch("/api/loans", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: Loan[] };
    return json.data ?? [];
  },
  async listLoanProducts(): Promise<LoanProductDefinition[]> {
    const response = await fetch("/api/product-type-definitions?kind=LOAN", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as {
      data: Array<{
        id: string;
        name: string;
        code: string;
        badge: string | null;
        description: string | null;
        subtype_of: string | null;
        is_active: boolean;
      }>;
    };
    return (json.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      badge: p.badge,
      description: p.description,
      subtypeOf: p.subtype_of,
      isActive: p.is_active,
    }));
  },
  async createLoan(payload: {
    id: string;
    productTypeId: string;
    customerId: string;
    customerName: string;
    principalAmount: number;
    expectedDisbursementDate: string;
    nominalRate: number;
    disbursementChannel: string;
  }): Promise<void> {
    const response = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },
  async applyAction(loanId: string, payload: { action: string; [k: string]: unknown }): Promise<void> {
    const response = await fetch(`/api/loans/${loanId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },
  async getSchedule(loanId: string): Promise<LoanScheduleItem[]> {
    const response = await fetch(`/api/loans/${loanId}/schedule`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: LoanScheduleItem[] };
    return json.data ?? [];
  },
  async getTransactions(loanId: string): Promise<LoanTransaction[]> {
    const response = await fetch(`/api/loans/${loanId}/transactions`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: LoanTransaction[] };
    return json.data ?? [];
  },
  async getTranches(loanId: string): Promise<LoanTranche[]> {
    const response = await fetch(`/api/loans/${loanId}/tranches`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: LoanTranche[] };
    return json.data ?? [];
  },
};
