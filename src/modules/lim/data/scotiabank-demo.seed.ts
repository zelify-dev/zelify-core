import { buildFullLimClientList } from "@/modules/scotia/data/scotia-demo-bridge";
import { SCOTIA_CREDIT_SEED } from "@/modules/cortex/data/scotiabank-credit.seed";
import type { LimDemoState } from "../types/deposit-pricing.types";

const TIIE_HISTORY = [
  { date: "2025-06-01", rate: 11.25 },
  { date: "2025-07-01", rate: 11.0 },
  { date: "2025-08-01", rate: 10.85 },
  { date: "2025-09-01", rate: 10.75 },
  { date: "2025-10-01", rate: 10.65 },
  { date: "2025-11-01", rate: 10.55 },
  { date: "2025-12-01", rate: 10.52 },
  { date: "2026-01-01", rate: 10.48 },
  { date: "2026-02-01", rate: 10.50 },
  { date: "2026-03-01", rate: 10.50 },
  { date: "2026-04-01", rate: 10.50 },
  { date: "2026-05-01", rate: 10.50 },
];

export const SCOTIA_DEMO_SEED: LimDemoState = {
  version: 2,
  tiie: {
    rate: 10.5,
    effectiveDate: "2026-05-23",
    source: "Banxico · feed sintético",
    history: TIIE_HISTORY,
  },
  tiersPm: [
    { id: "pm-t1", tier: 1, balanceMin: 0, balanceMax: 10_000_000, tiieFactor: 0.2, label: "$0 — $10M" },
    { id: "pm-t2", tier: 2, balanceMin: 10_000_001, balanceMax: 100_000_000, tiieFactor: 0.3, label: "$10M — $100M" },
    { id: "pm-t3", tier: 3, balanceMin: 100_000_001, balanceMax: 500_000_000, tiieFactor: 0.4, label: "$100M — $500M" },
    { id: "pm-t4", tier: 4, balanceMin: 500_000_001, balanceMax: 1_000_000_000, tiieFactor: 0.5, label: "$500M — $1B" },
    { id: "pm-t5", tier: 5, balanceMin: 1_000_000_001, balanceMax: null, tiieFactor: 0.55, label: "> $1B · Gestión patrimonial" },
  ],
  tiersPf: [
    { id: "pf-t1", tier: 1, balanceMin: 0, balanceMax: 50_000, tiieFactor: 0.2, label: "$0 — $50K" },
    { id: "pf-t2", tier: 2, balanceMin: 50_001, balanceMax: 250_000, tiieFactor: 0.3, label: "$50K — $250K" },
    { id: "pf-t3", tier: 3, balanceMin: 250_001, balanceMax: 1_000_000, tiieFactor: 0.5, label: "$250K — $1M" },
    { id: "pf-t4", tier: 4, balanceMin: 1_000_001, balanceMax: null, tiieFactor: 0.9, label: "> $1M" },
  ],
  clients: buildFullLimClientList(SCOTIA_CREDIT_SEED.clients),
  overrides: [
    {
      clientId: "PM-DEMO-003",
      capMin: 3.5,
      notes: "Relación estratégica · acuerdo comercial Q2 2026",
    },
  ],
  bonuses: [
    {
      id: "bonus-pm004",
      clientId: "PM-DEMO-004",
      description: "Bono saldo incremental > $20M (30d)",
      conditionLabel: "Saldo incremental > $20M en últimos 30 días",
      minIncrementalBalance: 20_000_000,
      factorBonus: 0.05,
      active: true,
      crmNotified: false,
    },
  ],
  auditLog: [
    {
      id: "audit-init",
      timestamp: new Date().toISOString(),
      action: "SEED_DEMO",
      details: "LIM v2 · casos corporativos + cartera CORTEX vinculada · TIIE 28d = 10.50%",
      user: "Sistema LIM",
      tiieInput: 10.5,
    },
  ],
  clientRates: {},
  tour: { completed: false, currentStep: 0, dismissed: false },
  pendingApproval: null,
};

export function createFreshScotiaDemoState(): LimDemoState {
  return JSON.parse(JSON.stringify(SCOTIA_DEMO_SEED)) as LimDemoState;
}
