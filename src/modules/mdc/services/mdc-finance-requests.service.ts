import { getStoredOrganization } from "@/lib/auth-api";
import { createTraceabilityLog } from "./mdc-traceability.service";
import { customFetch } from "./mdc-api-client";
const getBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_MDC_API_URL || "http://127.0.0.1:3000";

export type RuleBreakdownCondition = {
  field?: string;
  label?: string;
  dataType?: string;
  operator?: string;
  operatorLabel?: string;
  expectedValue?: unknown;
  actualValue?: unknown;
  passed?: boolean;
  message?: string;
};

export type RuleBreakdownItem = {
  id?: string;
  name: string;
  severity?: string;
  status: string;
  passed?: boolean;
  matched?: boolean;
  conditionsCount?: number;
  passedConditionsCount?: number;
  failedConditionsCount?: number;
  reason?: string;
  conditions?: RuleBreakdownCondition[];
};

export type AnalyzeFinanceRequestPayload = {
  product: string;
  personType: "natural" | "moral" | string;
  orgId: string;
  identificationNumber: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email: string;
  phone?: string;
  bank?: string;
  birthPlace?: string;
  maritalStatus?: string;
  educationLevel?: string;
  amount: number;
  montoCredito?: number;
  tipoEmpleo?: string;
  edad?: number;
  plazo?: number;
  capacidadPago?: number;
};

export type AnalyzeFinanceRequestResponse = {
  decision: string;
  status: string;
  riskLevel: string;
  reasons?: string[];
  summary?: {
    totalRules: number;
    evaluatedRules: number;
    approvedRules: number;
    reviewRules: number;
    rejectedRules: number;
    passedRules: number;
    failedRules: number;
  };
  rulesBreakdown?: RuleBreakdownItem[];
};

export type CreateFinanceRequest = {
  orgId: string;
  personType: "natural" | "moral" | string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  identificationNumber: string;
  email: string;
  product: string;
  amount: number;
  montoCredito?: number;
  bank?: string;
  phone?: string;
  birthPlace?: string;
  maritalStatus?: string;
  educationLevel?: string;
  tipoEmpleo?: string;
  edad?: number;
  plazo?: number;
  capacidadPago?: number;
  status?: string;
  riskLevel?: string;
  riskScore?: number;
  rulesBreakdown?: RuleBreakdownItem[];
};

export async function analyzeFinanceRequest(payload: AnalyzeFinanceRequestPayload): Promise<AnalyzeFinanceRequestResponse> {
  const res = await fetch(`${getBaseUrl()}/finance-requests/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let errorMessage = `Failed to analyze finance request (${res.status})`;
    try {
      const errorJson = await res.json();
      if (errorJson.message) errorMessage = errorJson.message;
    } catch {
      const text = await res.text();
      errorMessage += `: ${text.slice(0, 200)}`;
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export type FinanceRequest = {
  id: string;
  orgId: string;
  personType: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  identificationNumber?: string;
  applicantId?: string;
  user?: {
    id?: string;
  };
  email: string;
  product: string;
  amount: number;
  status: string;
  riskLevel: string;
  riskScore: number;
  createdAt: string;
  updatedAt: string;
};

export async function fetchFinanceRequests(orgId: string, personType?: string): Promise<FinanceRequest[]> {
  const params = new URLSearchParams({ orgId });
  if (personType) params.set("personType", personType);
  const res = await customFetch(`${getBaseUrl()}/finance-requests?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch finance requests (${res.status})`);
  return res.json();
}

export async function fetchFinanceRequestById(id: string): Promise<FinanceRequest> {
  const res = await customFetch(`${getBaseUrl()}/finance-requests/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch finance request detail (${res.status})`);
  const payload = await res.json();
  return payload?.data || payload;
}

export type FinancialDocumentStatus =
  | "PROCESSING"
  | "COMPLETED"
  | "MANUAL_REVIEW_REQUIRED"
  | "FAILED"
  | "REJECTED";

export type FinancialDocumentProgressDocument = {
  documentId?: string;
  analysisId?: string | null;
  fileName?: string | null;
  status?: FinancialDocumentStatus | string | null;
};

export type FinancialDocumentProgress = {
  userId: string;
  applicationId?: string;
  applicantId?: string;
  category: string;
  required: number;
  uploaded: number;
  pendingUpload: number;
  processing: number;
  completed: number;
  manualReview: number;
  failed: number;
  uploadComplete: boolean;
  processingComplete: boolean;
  complete: boolean;
  documents: FinancialDocumentProgressDocument[];
};

export async function fetchFinancialDocumentProgress(userId: string, category: string): Promise<FinancialDocumentProgress> {
  const res = await customFetch(`${getBaseUrl()}/financial-documents/${userId}/${category}/progress`);
  if (!res.ok) throw new Error(`Failed to fetch document progress (${res.status})`);
  return res.json();
}

export type UploadOneFinancialDocumentResponse = {
  documentId?: string;
  analysisId?: string | null;
  applicationId?: string;
  applicantId?: string;
  category?: string;
  fileName?: string;
  status?: FinancialDocumentStatus | string;
  reused?: boolean;
  progress?: {
    required: number;
    uploaded: number;
    pendingUpload: number;
    uploadComplete: boolean;
    processingComplete: boolean;
    complete: boolean;
  };
};

export async function uploadOneFinancialDocument(userId: string, category: string, file: File): Promise<UploadOneFinancialDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${getBaseUrl()}/financial-documents/${userId}/${category}/upload-one`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Failed to upload document (${res.status})`);
  }
  return res.json();
}

export type FinancialDocumentProcessResponse = {
  analysisId: string;
  status: FinancialDocumentStatus | string;
};

export async function processFinancialDocumentAnalysis(analysisId: string): Promise<FinancialDocumentProcessResponse> {
  const res = await fetch(`${getBaseUrl()}/financial-documents/${analysisId}/process`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Failed to process document analysis (${res.status})`);
  }
  return res.json();
}

export type FinancialDocumentExtractionResponse = {
  processed?: boolean;
  extraction?: unknown;
  [key: string]: unknown;
};

export async function fetchFinancialDocumentExtraction(analysisId: string): Promise<FinancialDocumentExtractionResponse> {
  const res = await customFetch(`${getBaseUrl()}/financial-documents/${analysisId}/extraction`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Failed to fetch document extraction (${res.status})`);
  }
  return res.json();
}

export async function createFinanceRequest(body: CreateFinanceRequest): Promise<{ data: FinanceRequest, notification?: string }> {
  const res = await fetch(`${getBaseUrl()}/finance-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let errorMessage = `Failed to create finance request (${res.status})`;
    try {
      const errorJson = await res.json();
      if (errorJson.message) errorMessage = errorJson.message;
    } catch {
      const text = await res.text();
      errorMessage += `: ${text.slice(0, 200)}`;
    }
    throw new Error(errorMessage);
  }
  const responseJson = await res.json();
  const created = responseJson.data || responseJson;

  const orgId = getStoredOrganization()?.id || "demo-bypass-org";
  if (orgId !== "demo-bypass-org") {
    await createTraceabilityLog({
      orgId,
      action: "REQUEST_CREATE",
      detail: `Solicitud creada. ${responseJson.notification || ''}`.trim(),
      channel: "Consola",
      userName: "Ejecutivo Zelify",
      correlationId: `corr-req-${created.id ? created.id.substring(0, 8) : Date.now()}`,
    });
  }
  return responseJson;
}

export async function updateFinanceRequest(id: string, patch: Partial<CreateFinanceRequest> & { riskLevel?: string; riskScore?: number }): Promise<FinanceRequest | null> {
  const res = await customFetch(`${getBaseUrl()}/finance-requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return null;
  const updated = await res.json();
  const orgId = getStoredOrganization()?.id || "demo-bypass-org";
  if (orgId !== "demo-bypass-org") {
    await createTraceabilityLog({
      orgId,
      action: "REQUEST_UPDATE",
      detail: "Solicitud actualizada",
      channel: "Consola",
      userName: "Ejecutivo Zelify",
      correlationId: `corr-req-${id.substring(0, 8)}`,
    });
  }
  return updated;
}

export async function deleteFinanceRequest(id: string): Promise<boolean> {
  const res = await customFetch(`${getBaseUrl()}/finance-requests/${id}`, {
    method: "DELETE",
  });
  const ok = res.ok;
  if (ok) {
    const orgId = getStoredOrganization()?.id || "demo-bypass-org";
    if (orgId !== "demo-bypass-org") {
      await createTraceabilityLog({
        orgId,
        action: "REQUEST_DELETE",
        detail: "Solicitud eliminada",
        channel: "Consola",
        userName: "Ejecutivo Zelify",
        correlationId: `corr-req-del-${Date.now()}`,
      });
    }
  }
  return ok;
}

export async function uploadFinancialDocument(applicationId: string, applicantId: string, file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append("applicationId", applicationId);
  formData.append("applicantId", applicantId);
  formData.append("document", file);

  const res = await fetch(`${getBaseUrl()}/financial-documents/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Failed to upload document (${res.status})`);
  }
  return res.json();
}
