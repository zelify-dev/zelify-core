import { type CreditRuleRow } from "../data/mdc-rules-mock";

const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_MDC_API_URL || "http://127.0.0.1:3000";
};

export const fetchRules = async (mode: "natural" | "moral"): Promise<CreditRuleRow[]> => {
  const url = `${getBaseUrl()}/decision-rules?mode=${mode}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch rules", response.statusText);
    return [];
  }
  return response.json();
};

export const createRule = async (rule: Partial<CreditRuleRow>): Promise<CreditRuleRow | null> => {
  const url = `${getBaseUrl()}/decision-rules`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    console.error("Failed to create rule", response.statusText);
    return null;
  }
  return response.json();
};

export const updateRule = async (id: string, rule: Partial<CreditRuleRow>): Promise<CreditRuleRow | null> => {
  const url = `${getBaseUrl()}/decision-rules/${id}`;
  const response = await fetch(url, {
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

export const deleteRule = async (id: string): Promise<boolean> => {
  const url = `${getBaseUrl()}/decision-rules/${id}`;
  try {
    const response = await fetch(url, {
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
