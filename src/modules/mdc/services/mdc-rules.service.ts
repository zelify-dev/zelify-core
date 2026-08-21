import { createTraceabilityLog } from "./mdc-traceability.service";
import { type CreditRuleRow, CREDIT_RULES_BY_MODE } from "../data/mdc-rules-mock";
import { customFetch } from "./mdc-api-client";

const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_MDC_API_URL || "http://127.0.0.1:3000";
};

// In-memory store for demo bypass org
let demoRulesNatural = [...CREDIT_RULES_BY_MODE.natural];
let demoRulesMoral = [...CREDIT_RULES_BY_MODE.moral];

export const fetchRules = async (mode: "natural" | "moral", orgId: string): Promise<CreditRuleRow[]> => {
  if (orgId === "demo-bypass-org") {
    return mode === "natural" ? [...demoRulesNatural] : [...demoRulesMoral];
  }

  const params = new URLSearchParams({ mode, orgId });
  const url = `${getBaseUrl()}/decision-rules?${params.toString()}`;
  const response = await customFetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.warn("Failed to fetch rules", response.statusText);
    return [];
  }
  return response.json();
};

export const fetchFinanceProducts = async (orgId: string): Promise<any[]> => {
  if (orgId === "demo-bypass-org") return [];
  const url = `${getBaseUrl()}/finance-products?orgId=${orgId}`;
  const response = await customFetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.warn("Failed to fetch finance products", response.statusText);
    return [];
  }
  return response.json();
};

export const createRule = async (rule: Partial<CreditRuleRow>, orgId: string): Promise<CreditRuleRow | null> => {
  if (orgId === "demo-bypass-org") {
    const newRule = { ...rule, id: `cr-mock-${Date.now()}` } as CreditRuleRow;
    demoRulesNatural = [...demoRulesNatural, newRule];
    demoRulesMoral = [...demoRulesMoral, newRule];
    return newRule;
  }

  const url = `${getBaseUrl()}/decision-rules`;
  const response = await customFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...rule, orgId }),
  });

  if (!response.ok) {
    console.error("Failed to create rule", response.statusText);
    return null;
  }
  return response.json();
};

export const updateRule = async (id: string, rule: Partial<CreditRuleRow>, orgId?: string): Promise<CreditRuleRow | null> => {
  if (orgId === "demo-bypass-org") {
    const updateInArray = (arr: CreditRuleRow[]) =>
      arr.map((r) => (r.id === id ? { ...r, ...rule } : r));
    demoRulesNatural = updateInArray(demoRulesNatural);
    demoRulesMoral = updateInArray(demoRulesMoral);
    return { ...demoRulesNatural.find((r) => r.id === id)!, ...rule } as CreditRuleRow;
  }

  const url = `${getBaseUrl()}/decision-rules/${id}`;
  const response = await customFetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    console.error("Failed to update rule", response.statusText);
    return null;
  }
  return response.json();
};

export const deleteRule = async (id: string, orgId?: string): Promise<boolean> => {
  if (orgId === "demo-bypass-org") {
    demoRulesNatural = demoRulesNatural.filter((r) => r.id !== id);
    demoRulesMoral = demoRulesMoral.filter((r) => r.id !== id);
    return true;
  }

  const url = `${getBaseUrl()}/decision-rules/${id}`;
  try {
    const response = await customFetch(url, {
      method: "DELETE",
    });
    if (!response.ok) {
      console.warn(`Backend failed to delete rule ${id}, applying optimistically in UI`);
    }
  } catch (err) {
    console.warn(`Network error deleting rule ${id}, applying optimistically in UI`, err);
  }
  return true;
};
