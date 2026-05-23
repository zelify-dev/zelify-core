"use client";

import { useCallback, useEffect, useState } from "react";
import { DEMO_STORAGE_KEYS, readDemoJson, writeDemoJson } from "@/lib/demo-storage";
import {
  clientsForProduct,
  createFreshCreditDemoState,
  getClient,
  getProduct,
  mergeCreditDemoState,
} from "../data/scotiabank-credit.seed";
import { calculateCreditQuote, runAiBatch } from "../services/credit-pricing.engine";
import { CATEGORY_PRODUCT_ID } from "../data/credit-catalog";
import type { CreditDemoState, CreditProductCategory, CreditProductTemplate, ProductRule } from "../types/credit-pricing.types";

function loadCreditState(): CreditDemoState {
  const stored = readDemoJson<CreditDemoState | null>(DEMO_STORAGE_KEYS.credit, null);
  if (stored?.version === 4) return stored;
  if (stored?.version === 3) {
    const migrated = recalcQuote(mergeCreditDemoState(stored));
    writeDemoJson(DEMO_STORAGE_KEYS.credit, migrated);
    return migrated;
  }
  const fresh = recalcQuote(createFreshCreditDemoState());
  writeDemoJson(DEMO_STORAGE_KEYS.credit, fresh);
  return fresh;
}

export function seedScotiaCreditStorage(force = false): CreditDemoState {
  if (typeof window === "undefined") return createFreshCreditDemoState();
  const existing = readDemoJson<CreditDemoState | null>(DEMO_STORAGE_KEYS.credit, null);
  if (existing?.version === 4 && !force) return existing;
  if (existing?.version === 3 && !force) {
    const migrated = recalcQuote(mergeCreditDemoState(existing));
    writeDemoJson(DEMO_STORAGE_KEYS.credit, migrated);
    return migrated;
  }
  const fresh = recalcQuote(createFreshCreditDemoState());
  writeDemoJson(DEMO_STORAGE_KEYS.credit, fresh);
  return fresh;
}

function recalcQuote(state: CreditDemoState): CreditDemoState {
  const product = getProduct(state);
  const client = getClient(state);
  const quote = calculateCreditQuote({
    product,
    client,
    rules: state.rulesByCategory[product.category],
    crossSellOptions: state.crossSellByCategory[product.category],
    crossSellAccepted: state.crossSellAccepted,
  });
  return { ...state, quote };
}

export function useCreditDemoStore() {
  const [state, setState] = useState<CreditDemoState>(() => loadCreditState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadCreditState());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: CreditDemoState) => {
    setState(next);
    writeDemoJson(DEMO_STORAGE_KEYS.credit, next);
  }, []);

  const audit = useCallback(
    (action: string, details: string, extra?: { rateBefore?: number; rateAfter?: number }) => ({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      user: "Ejecutivo Frontline",
      channel: "Sucursal",
      correlationId: `corr-${Date.now()}`,
      ...extra,
    }),
    [],
  );

  const updateProduct = useCallback(
    (product: CreditProductTemplate) => {
      const products = state.products.map((p) => (p.id === product.id ? product : p));
      const next = recalcQuote({
        ...state,
        products,
        auditLog: [audit("UPDATE_PRODUCT", `Plantilla ${product.id} · tasa ${product.baseRate}%`), ...state.auditLog].slice(0, 50),
      });
      persist(next);
    },
    [state, persist, audit],
  );

  const selectProduct = useCallback(
    (productId: string) => {
      const productClients = state.clients.filter((c) => c.productId === productId);
      const firstClient = productClients[0]?.id ?? state.selectedClientId;
      const next = recalcQuote({
        ...state,
        selectedProductId: productId,
        selectedClientId: firstClient,
        quoteFixed: false,
        quoteFixedAt: null,
        managerApproved: false,
        crossSellAccepted: Object.fromEntries(Object.keys(state.crossSellAccepted).map((k) => [k, false])),
      });
      persist(next);
    },
    [state, persist],
  );

  const selectClient = useCallback(
    (clientId: string) => {
      const client = state.clients.find((c) => c.id === clientId);
      if (!client) return;
      const next = recalcQuote({
        ...state,
        selectedClientId: clientId,
        selectedProductId: client.productId,
        quoteFixed: false,
        quoteFixedAt: null,
        managerApproved: false,
      });
      persist(next);
    },
    [state, persist],
  );

  const toggleRule = useCallback(
    (category: CreditProductCategory, ruleId: string, enabled: boolean) => {
      const rulesByCategory = {
        ...state.rulesByCategory,
        [category]: state.rulesByCategory[category].map((r) => (r.id === ruleId ? { ...r, enabled } : r)),
      };
      const next = recalcQuote({
        ...state,
        rulesByCategory,
        auditLog: [audit("UPDATE_RULE", `Regla ${ruleId} → ${enabled ? "ON" : "OFF"}`), ...state.auditLog].slice(0, 50),
      });
      persist(next);
    },
    [state, persist, audit],
  );

  const setCrossSellOptions = useCallback(
    (updates: Record<string, boolean>) => {
      const crossSellAccepted = { ...state.crossSellAccepted, ...updates };
      const next = recalcQuote({
        ...state,
        crossSellAccepted,
        auditLog: [
          audit("CROSS_SELL", `Cross-sell actualizado`, { rateBefore: state.quote?.finalRate }),
          ...state.auditLog,
        ].slice(0, 50),
      });
      const withRate = {
        ...next,
        auditLog: next.auditLog.map((e, i) =>
          i === 0 && e.action === "CROSS_SELL" ? { ...e, rateAfter: next.quote?.finalRate } : e,
        ),
      };
      persist(withRate);
    },
    [state, persist, audit],
  );

  const setCrossSellOption = useCallback(
    (optionId: string, accepted: boolean) => {
      setCrossSellOptions({ [optionId]: accepted });
    },
    [setCrossSellOptions],
  );

  const runQuote = useCallback(() => {
    const next = recalcQuote({
      ...state,
      auditLog: [audit("QUOTE", `Cotización ${state.selectedClientId} · reglas evaluadas`), ...state.auditLog].slice(0, 50),
    });
    persist(next);
  }, [state, persist, audit]);

  const runAiVerification = useCallback(() => {
    const product = getProduct(state);
    const batch = clientsForProduct(state, product.id).slice(0, 4);
    const results = runAiBatch(batch);
    const clients = state.clients.map((c) => {
      const hit = results.find((r) => r.clientId === c.id);
      if (!hit) return c;
      return { ...c, aiApproved: hit.approved };
    });
    const next = recalcQuote({
      ...state,
      clients,
      aiVerificationRun: true,
      aiBatchResults: results,
      auditLog: [
        audit("AI_VERIFY", `IA · ${results.filter((r) => r.approved).length} aprobados / ${results.filter((r) => !r.approved).length} rechazados`),
        ...state.auditLog,
      ].slice(0, 50),
    });
    persist(next);
  }, [state, persist, audit]);

  const approveManager = useCallback(() => {
    persist({
      ...state,
      managerApproved: true,
      auditLog: [audit("MANAGER_APPROVE", `Aprobación gerencial · tasa ${state.quote?.finalRate}%`), ...state.auditLog].slice(0, 50),
    });
  }, [state, persist, audit]);

  const fixQuote = useCallback(() => {
    if (!state.quote || state.quote.decision === "RECHAZADO") return;
    persist({
      ...state,
      quoteFixed: true,
      quoteFixedAt: new Date().toISOString(),
      auditLog: [
        audit("FIX_QUOTE", `Cotización fijada ${state.quote.finalRate}% · ${state.quote.termMonths} meses · Core`, {
          rateAfter: state.quote.finalRate,
        }),
        ...state.auditLog,
      ].slice(0, 50),
    });
  }, [state, persist, audit]);

  const resetDemo = useCallback(() => {
    persist(recalcQuote(createFreshCreditDemoState()));
  }, [persist]);

  const selectCategory = useCallback(
    (category: CreditProductCategory) => {
      selectProduct(CATEGORY_PRODUCT_ID[category]);
    },
    [selectProduct],
  );

  return {
    state,
    hydrated,
    getProduct: (id?: string) => getProduct(state, id),
    getClient: (id?: string) => getClient(state, id),
    clientsForProduct: (productId?: string) => clientsForProduct(state, productId),
    updateProduct,
    selectProduct,
    selectCategory,
    selectClient,
    toggleRule,
    setCrossSellOption,
    setCrossSellOptions,
    runQuote,
    runAiVerification,
    approveManager,
    fixQuote,
    resetDemo,
  };
}
