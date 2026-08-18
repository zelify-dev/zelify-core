const API_URL = process.env.NEXT_PUBLIC_MDC_API_URL || "http://localhost:3000";

export type PaymentInstallment = {
  id?: string;
  installmentNumber: number;
  status: string;
  amount: number;
  dueDate: string;
};

export type PaymentSession = {
  id?: string;
  userId: string;
  applicantId: string;
  status: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  errorCode?: string;
  retryable?: boolean;
  individualPerson?: boolean;
  legalEntity?: boolean;
  installments?: PaymentInstallment[];
  createdAt?: string;
};

export async function fetchPayments(mode: "natural" | "moral"): Promise<PaymentSession[]> {
  try {
    const res = await fetch(`${API_URL}/payments?mode=${mode}`);
    if (!res.ok) throw new Error("Failed to fetch payments");
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function createPayment(data: PaymentSession): Promise<PaymentSession | null> {
  try {
    const res = await fetch(`${API_URL}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create payment");
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function updatePayment(id: string, data: Partial<PaymentSession>): Promise<PaymentSession | null> {
  try {
    const res = await fetch(`${API_URL}/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update payment");
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function deletePayment(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/payments/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
}
