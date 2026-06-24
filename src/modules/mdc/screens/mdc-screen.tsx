"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Settings } from "lucide-react";
import { seedScotiaCreditStorage, useCreditDemoStore } from "@/modules/cortex/hooks/use-credit-demo-store";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import {
  APPLICATIONS_BY_MODE,
  CLIENT_POOL_BY_MODE,
  CREDIT_PRODUCTS_BY_MODE,
  LCC_AUTO_CLIENTS,
  LCC_PERSONAL_CLIENTS,
  MORAL_CREDIT_PRODUCTS,
  PM_MDC_CLIENTS,
  RISK_LABELS,
  STATUS_LABELS,
  NATURAL_CREDIT_PRODUCTS,
  type Application,
  type ApplicationStatus,
  type MdcApplicantMode,
  type MdcClientPoolItem,
  type MdcCreditProduct,
  type RiskLevel,
} from "@/modules/mdc/data/mdc-credit-mock";
import { CREDIT_RULES_BY_MODE, type CreditRuleRow, type RuleDataType, type RuleOperator, type RuleProduct, type RuleSeverity } from "@/modules/mdc/data/mdc-rules-mock";
import { MdcProductsTab } from "@/modules/mdc/components/mdc-products-tab";
import { MORAL_CASES, NATURAL_CASES, MdcCollectionsTab } from "@/modules/mdc/components/mdc-collections-tab";
import { MORAL_SESSIONS, NATURAL_SESSIONS, MdcPaymentsTab } from "@/modules/mdc/components/mdc-payments-tab";
import { MdcConfigurationTab } from "@/modules/mdc/components/mdc-configuration-tab";
import {
  calculateCreditQuote,
  crossSellRatePreview,
  formatMxnCredit,
  formatPctCredit,
  rateBeforeCrossSell,
} from "@/modules/cortex/services/credit-pricing.engine";
import type { CreditClientProfile, CreditProductCategory, CrossSellOption } from "@/modules/cortex/types/credit-pricing.types";
import { MDC_PRODUCTS_BY_MODE } from "@/modules/mdc/data/mdc-products-mock";
import { activateKybCompanyContext } from "@/modules/kyb/lib/kyb-company-context";
import "@/components/ui/templates/workspace-page.css";
import "@/modules/cortex/components/credit-quote-result-panel.css";
import "./mdc-screen.css";

type MdcTab = "overview" | "products" | "applications" | "rules" | "traceability" | "payments" | "collections" | "configuration";

type RuleFormState = {
  name: string;
  product: RuleProduct;
  field: string;
  evaluationMode: "single" | "bands";
  operator: RuleOperator;
  value: string;
  dataType: RuleDataType;
  severity: RuleSeverity;
  description: string;
  status: "active" | "inactive";
  approveMin: string;
  approveMax: string;
  reviewMin: string;
  reviewMax: string;
  rejectMin: string;
  rejectMax: string;
};

type RangePreset = "7d" | "30d" | "90d";
type MdcTraceabilityEntry = {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  channel: string;
  user: string;
  correlationId: string;
  rateBefore?: number;
  rateAfter?: number;
};

const APP_STORAGE_KEY = "mdc:applications";
const RULES_STORAGE_KEY = "mdc:rules";
const PAGE_SIZE = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS: Record<RangePreset, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const PERSONA_OPTIONS: { id: MdcApplicantMode; label: string }[] = [
  { id: "natural", label: "Persona natural" },
  { id: "moral", label: "Persona moral" },
];

const MODE_STORAGE_KEYS: Record<MdcApplicantMode, { applications: string; rules: string; products: string }> = {
  natural: {
    applications: "mdc:natural:applications",
    rules: "mdc:natural:rules",
    products: "mdc:natural:products",
  },
  moral: {
    applications: "mdc:moral:applications",
    rules: "mdc:moral:rules",
    products: "mdc:moral:products",
  },
};

const MODE_COPY: Record<MdcApplicantMode, { title: string; subtitle: string; recentTitle: string }> = {
  natural: {
    title: "MDC · Motor de Decision de Credito",
    subtitle: "Analisis de solicitudes, reglas y decisiones para originacion de persona natural.",
    recentTitle: "Solicitudes recientes",
  },
  moral: {
    title: "MDC · Motor de Decision de Credito Empresarial",
    subtitle: "Evaluacion de empresas, razones financieras y politicas de originacion para persona moral.",
    recentTitle: "Empresas evaluadas recientemente",
  },
};

const MORAL_TRACEABILITY: MdcTraceabilityEntry[] = [
  {
    id: "pm-trace-001",
    timestamp: "2026-06-23T15:08:41Z",
    action: "PM_SYNC",
    details: "Sincronización de empresas desde onboarding corporativo · 3 expedientes nuevos en MDC",
    channel: "Consola",
    user: "Sistema MDC",
    correlationId: "corr-pm-1782245321393",
  },
  {
    id: "pm-trace-002",
    timestamp: "2026-06-23T14:31:17Z",
    action: "PM_RULES",
    details: "Motor empresa evaluado · DSCR, apalancamiento y buro corporativo para Grupo Delta Industrial SA de CV",
    channel: "Sucursal empresarial",
    user: "Ejecutivo Empresarial",
    correlationId: "corr-pm-1782245277709",
    rateBefore: 17.8,
    rateAfter: 17.8,
  },
  {
    id: "pm-trace-003",
    timestamp: "2026-06-23T14:06:47Z",
    action: "CROSS_SELL_PM",
    details: "Paquete transaccional y dispersión de nómina activados · mejora de pricing corporativo",
    channel: "Sucursal empresarial",
    user: "Ejecutivo Empresarial",
    correlationId: "corr-pm-1782245280707",
    rateBefore: 18.1,
    rateAfter: 17.6,
  },
  {
    id: "pm-trace-004",
    timestamp: "2026-06-23T14:06:27Z",
    action: "AI_VERIFY_PM",
    details: "IA documental · 2 expedientes empresariales aprobados / 1 enviado a revisión manual",
    channel: "Sucursal empresarial",
    user: "Ejecutivo Empresarial",
    correlationId: "corr-pm-1782245278521",
  },
  {
    id: "pm-trace-005",
    timestamp: "2026-06-23T13:41:01Z",
    action: "SEED_PM",
    details: "Catálogo PM cargado · líneas empresariales, arrendamiento y capital de trabajo en México",
    channel: "Consola",
    user: "Admin Producto",
    correlationId: "corr-pm-seed-002",
  },
];

const TABS: { id: MdcTab; label: string }[] = [
  { id: "overview", label: "Tablero" },
  { id: "products", label: "Productos" },
  { id: "applications", label: "Solicitudes" },
  { id: "rules", label: "Reglas" },
  { id: "traceability", label: "Trazabilidad" },
  { id: "payments", label: "Pagos" },
  { id: "collections", label: "Cobranza" },
  { id: "configuration", label: "Configuracion" },
];

const STATUS_OPTIONS: (ApplicationStatus | "all")[] = [
  "all",
  "approved",
  "declined",
  "pending",
  "manualReview",
  "overridden",
];

const RISK_OPTIONS: (RiskLevel | "all")[] = ["all", "low", "medium", "high"];

const RULE_OPERATORS: RuleOperator[] = [
  "equals",
  "notEquals",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "between",
];

const RULE_TYPES: RuleDataType[] = ["string", "number", "boolean", "date", "percentage"];

const RULE_SEVERITIES: RuleSeverity[] = ["pass", "warn", "fail"];
const REMOVED_RULE_FIELDS = new Set([
  "cards.utilization",
  "credit.hardInquiries30d",
  "company.shareholderScore",
  "company.kybCompleteness",
  "company.amlAlerts",
]);
const PRODUCT_RULE_FIELDS: Record<RuleProduct, string[]> = {
  "Credito automotriz": [
    "applicant.age",
    "ratios.dti",
    "bureau.score",
    "credit.maxDaysPastDue",
    "credit.historyMonths",
    "income.monthlyNet",
  ],
  "Credito personal": [
    "applicant.age",
    "ratios.dti",
    "bureau.score",
    "credit.maxDaysPastDue",
    "credit.historyMonths",
    "income.monthlyNet",
    "employment.months",
  ],
  "Credito simple empresarial": [
    "company.antiquityMonths",
    "company.monthlyRevenue",
    "company.bureauScore",
    "company.maxDaysPastDue",
    "company.dscr",
    "company.leverageRatio",
    "company.ebitdaMargin",
    "company.requestedAmountToRevenue",
    "company.naicsRiskIndex",
    "company.taxComplianceStatus",
  ],
  "Credito revolvente": [
    "company.antiquityMonths",
    "company.monthlyRevenue",
    "company.bureauScore",
    "company.maxDaysPastDue",
    "company.leverageRatio",
    "company.topClientConcentration",
    "company.requestedAmountToRevenue",
    "company.naicsRiskIndex",
    "company.taxComplianceStatus",
  ],
  "Arrendamiento financiero": [
    "company.antiquityMonths",
    "company.monthlyRevenue",
    "company.bureauScore",
    "company.maxDaysPastDue",
    "company.dscr",
    "company.ebitdaMargin",
    "company.naicsRiskIndex",
    "company.requestedTermMonths",
    "company.taxComplianceStatus",
  ],
};

const RULE_FIELD_LABELS: Record<string, string> = {
  "applicant.age": "Edad del solicitante",
  "ratios.dti": "Relacion deuda / ingreso (DTI)",
  "bureau.score": "Score crediticio en buro",
  "credit.maxDaysPastDue": "Maximo atraso reciente (dias)",
  "credit.historyMonths": "Antiguedad de historial (meses)",
  "employment.months": "Antiguedad laboral (meses)",
  "income.monthlyNet": "Ingreso mensual neto",
  "company.antiquityMonths": "Antiguedad operativa (meses)",
  "company.monthlyRevenue": "Facturacion mensual promedio",
  "company.bureauScore": "Score de buro empresa / representante",
  "company.shareholderScore": "Score de accionistas / aval",
  "company.maxDaysPastDue": "Maximo atraso reciente (dias)",
  "company.dscr": "Cobertura del servicio de deuda (DSCR)",
  "company.leverageRatio": "Deuda neta / EBITDA",
  "company.topClientConcentration": "Concentracion del cliente principal",
  "company.ebitdaMargin": "Margen EBITDA",
  "company.kybCompleteness": "Completitud del expediente KYB",
  "company.amlAlerts": "Alertas AML / PLD activas",
  "company.requestedAmountToRevenue": "Monto solicitado / ventas mensuales",
  "company.naicsRiskIndex": "Indice de riesgo sectorial NAICS",
  "company.requestedTermMonths": "Plazo solicitado (meses)",
  "company.taxComplianceStatus": "Opinion de Cumplimiento Fiscal 32-D",
  "custom.field": "Campo personalizado",
};

const RULE_OPERATOR_LABELS: Record<RuleOperator, string> = {
  equals: "Igual a (=)",
  notEquals: "Distinto de (!=)",
  gt: "Mayor que (>)",
  gte: "Mayor o igual (>=)",
  lt: "Menor que (<)",
  lte: "Menor o igual (<=)",
  contains: "Contiene",
  between: "Entre",
};

const RULE_TYPE_LABELS: Record<RuleDataType, string> = {
  string: "Texto",
  number: "Numero",
  boolean: "Si / No",
  date: "Fecha",
  percentage: "Porcentaje",
};

const RULE_SEVERITY_LABELS: Record<RuleSeverity, string> = {
  pass: "Aprobacion",
  warn: "Revision",
  fail: "Rechazo",
};

function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mergeApplicationsWithDefaults(stored: Application[], defaults: Application[]) {
  const byAppNo = new Map<string, Application>();
  for (const row of defaults) {
    byAppNo.set(row.appNo, row);
  }
  for (const row of stored) {
    byAppNo.set(row.appNo, row);
  }
  return [...byAppNo.values()].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

function reconcileMockTimeline(
  mode: MdcApplicantMode,
  stored: Application[],
  defaults: Application[],
) {
  if (mode !== "moral" || defaults.length === 0) return stored;

  const defaultLatestTs = defaults.reduce(
    (max, row) => Math.max(max, new Date(row.submittedAt).getTime()),
    0,
  );

  let nextTs = defaultLatestTs + 5 * 60 * 1000;
  return stored.map((row) => {
    const rowTs = new Date(row.submittedAt).getTime();
    const tooFarAhead = rowTs - defaultLatestTs > 14 * DAY_MS;
    if (!tooFarAhead) return row;
    const migrated = { ...row, submittedAt: new Date(nextTs).toISOString() };
    nextTs += 5 * 60 * 1000;
    return migrated;
  });
}

function writeStoredJson<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // noop 
  }
}

function money(v: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(v);
}

function shortDate(v: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(v));
}

function ratioLabel(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function normalizedPercentages(values: number[]) {
  const total = Math.max(values.reduce((sum, value) => sum + value, 0), 1);
  const scaled = values.map((value) => (value / total) * 1000);
  const base = scaled.map((value) => Math.floor(value));
  const remainder = 1000 - base.reduce((sum, value) => sum + value, 0);
  const order = scaled
    .map((value, index) => ({ index, frac: value - base[index] }))
    .sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainder; i++) {
    base[order[i % order.length].index] += 1;
  }

  return base.map((value) => value / 10);
}

function pctLabel(v: number) {
  return `${v.toFixed(1)}%`;
}

function deltaPctLabel(v: number) {
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function pctDelta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function rangeWindow(apps: Pick<Application, "submittedAt">[], days: number) {
  if (apps.length === 0) return null;
  const latestTs = apps.reduce((max, app) => Math.max(max, new Date(app.submittedAt).getTime()), 0);
  const latestDate = new Date(latestTs);
  const endMs = Date.UTC(
    latestDate.getUTCFullYear(),
    latestDate.getUTCMonth(),
    latestDate.getUTCDate(),
    23,
    59,
    59,
    999,
  );
  const startMs = endMs - (days * DAY_MS - 1);
  return { startMs, endMs };
}

function isWithinRange(dateIso: string, startMs: number, endMs: number) {
  const ts = new Date(dateIso).getTime();
  return ts >= startMs && ts <= endMs;
}

function chartDayLabel(date: Date) {
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month} ${day}`;
}

function utcDayStartMs(value: string | number) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function nextMockSubmittedAt(rows: Pick<Application, "submittedAt">[]) {
  if (rows.length === 0) return new Date().toISOString();
  const latestTs = rows.reduce((max, row) => Math.max(max, new Date(row.submittedAt).getTime()), 0);
  return new Date(latestTs + 5 * 60 * 1000).toISOString();
}

function bureauScoreFromRiskIndex(riskIndex: number) {
  const bounded = Math.max(0, Math.min(100, riskIndex));
  return Math.round(850 - (bounded / 100) * 450);
}

function riskFromScore(score: number): RiskLevel {
  const bureauScore = bureauScoreFromRiskIndex(score);
  if (bureauScore <= 549) return "high";
  if (bureauScore <= 649) return "medium";
  return "low";
}

function normalizeRiskScoreForStatus(status: ApplicationStatus, score: number) {
  if (status === "approved") return Math.min(39, Math.max(20, score));
  if (status === "declined") return Math.min(95, Math.max(75, score));
  if (status === "pending") return Math.min(59, Math.max(45, score));
  if (status === "manualReview") return Math.min(69, Math.max(50, score));
  return Math.min(59, Math.max(40, score));
}

function riskFromApplicationStatus(status: ApplicationStatus, score: number) {
  return riskFromScore(normalizeRiskScoreForStatus(status, score));
}

function statusFromScore(score: number): ApplicationStatus {
  const bureauScore = bureauScoreFromRiskIndex(score);
  if (bureauScore < 550) return "declined";
  if (bureauScore < 650) return "manualReview";
  return "approved";
}

function classForStatus(status: ApplicationStatus) {
  if (status === "approved") return "mdc-badge mdc-badge--ok";
  if (status === "declined") return "mdc-badge mdc-badge--bad";
  if (status === "pending") return "mdc-badge mdc-badge--warn";
  if (status === "manualReview") return "mdc-badge mdc-badge--info";
  return "mdc-badge mdc-badge--neutral";
}

function classForRisk(risk: RiskLevel) {
  if (risk === "low") return "mdc-badge mdc-badge--ok";
  if (risk === "medium") return "mdc-badge mdc-badge--warn";
  return "mdc-badge mdc-badge--bad";
}

function quickHash(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function formatPlainPct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function numberCompact(value: number) {
  return new Intl.NumberFormat("es-MX", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

function chipToneBySeverity(severity: RuleSeverity) {
  if (severity === "pass") return "mdc-col-pill mdc-col-pill--ok";
  if (severity === "warn") return "mdc-col-pill mdc-col-pill--warn";
  return "mdc-col-pill mdc-col-pill--bad";
}

type MoralCompanyProfile = {
  segment: string;
  companyType: string;
  requestedTermMonths: number;
  monthlyRevenue: number;
  annualRevenue: number;
  antiquityMonths: number;
  bureauScore: number;
  shareholderScore: number;
  maxDaysPastDue: number;
  dscr: number;
  leverageRatio: number;
  topClientConcentration: number;
  ebitdaMargin: number;
  roe: number;
  roa: number;
  workingCapital: number;
  freeCashFlow: number;
  requestedAmountToRevenue: number;
  naicsRiskIndex: number;
  debtBurdenRatio: number;
  quotaToIncomeRatio: number;
  kybCompleteness: number;
  amlAlerts: number;
  taxComplianceStatus: number;
  uboCoverage: number;
  legalIncidents: number;
  taxStatus: string;
  mercantileStatus: string;
  shareholdersStructure: string;
  docsStatus: Array<{ label: string; detail: string; status: "ok" | "warn" | "bad" }>;
  amlChecks: Array<{ label: string; detail: string; status: "ok" | "warn" | "bad" }>;
  scoringHighlights: string[];
  financeHighlights: string[];
  sectorHighlights: string[];
  monitoringHighlights: string[];
};

function buildMoralCompanyProfile(app: Application): MoralCompanyProfile {
  const seed = quickHash(`${app.id}:${app.applicantName}:${app.product}`);
  const bureauScore = bureauScoreFromRiskIndex(app.riskScore);
  const riskLevel = riskFromScore(app.riskScore);
  const termByProduct: Record<string, number> = {
    "Credito simple empresarial": 36,
    "Credito revolvente": 18,
    "Arrendamiento financiero": 48,
  };
  const requestedTermMonths = termByProduct[app.product] ?? 24;
  const approvedLike = app.status === "approved" || app.status === "overridden";
  const reviewLike = app.status === "manualReview" || app.status === "pending";

  const monthlyRevenue =
    app.status === "declined"
      ? Math.round(app.requestedAmount / (3.9 + ((seed % 3) * 0.25)))
      : reviewLike
        ? Math.round(app.requestedAmount / (3.1 + ((seed % 3) * 0.2)))
        : Math.round(app.requestedAmount / (2.1 + ((seed % 4) * 0.18)));
  const antiquityMonths =
    app.status === "declined"
      ? 14 + (seed % 11)
      : reviewLike
        ? 22 + (seed % 18)
        : 46 + (seed % 70);
  const dscr = Number(
    (
      app.status === "declined"
        ? 0.88 + (seed % 12) / 100
        : reviewLike
          ? 1.05 + (seed % 18) / 100
          : 1.34 + (seed % 28) / 100
    ).toFixed(2),
  );
  const leverageRatio = Number(
    (
      app.status === "declined"
        ? 3.55 + (seed % 60) / 100
        : reviewLike
          ? 2.65 + (seed % 55) / 100
          : 1.45 + (seed % 70) / 100
    ).toFixed(2),
  );
  const topClientConcentration = Number(
    (
      app.status === "declined"
        ? 0.54 + (seed % 14) / 100
        : reviewLike
          ? 0.41 + (seed % 12) / 100
          : 0.24 + (seed % 14) / 100
    ).toFixed(2),
  );
  const ebitdaMargin = Number(
    (
      app.status === "declined"
        ? 0.07 + (seed % 4) / 100
        : reviewLike
          ? 0.11 + (seed % 6) / 100
          : 0.15 + (seed % 8) / 100
    ).toFixed(2),
  );
  const naicsRiskIndex =
    app.status === "declined" ? 68 + (seed % 18) : reviewLike ? 48 + (seed % 16) : 28 + (seed % 18);
  const kybCompleteness =
    app.status === "declined" ? 0.78 + (seed % 8) / 100 : reviewLike ? 0.86 + (seed % 8) / 100 : 0.93 + (seed % 7) / 100;
  const amlAlerts = app.status === "declined" ? 2 : reviewLike ? 1 : 0;
  const taxComplianceStatus = app.status === "declined" ? -1 : reviewLike ? 0 : 1;
  const shareholderScore = Math.max(560, Math.min(820, bureauScore + (approvedLike ? 14 : reviewLike ? -6 : -22)));
  const maxDaysPastDue = app.status === "declined" ? 61 + (seed % 28) : reviewLike ? 28 + (seed % 18) : 6 + (seed % 16);
  const requestedAmountToRevenue = Number((app.requestedAmount / Math.max(monthlyRevenue, 1)).toFixed(2));
  const quotaToIncomeRatio = Number(
    (
      app.status === "declined"
        ? 0.39 + (seed % 7) / 100
        : reviewLike
          ? 0.29 + (seed % 7) / 100
          : 0.17 + (seed % 8) / 100
    ).toFixed(2),
  );
  const debtBurdenRatio = Number(
    (
      app.status === "declined"
        ? 0.66 + (seed % 11) / 100
        : reviewLike
          ? 0.48 + (seed % 10) / 100
          : 0.31 + (seed % 10) / 100
    ).toFixed(2),
  );
  const annualRevenue = monthlyRevenue * 12;
  const freeCashFlow = Math.round(monthlyRevenue * (approvedLike ? 0.16 : reviewLike ? 0.08 : 0.03));
  const workingCapital = Math.round(monthlyRevenue * (approvedLike ? 2.4 : reviewLike ? 1.5 : 0.9));
  const roe = Number((approvedLike ? 0.17 + (seed % 4) / 100 : reviewLike ? 0.11 + (seed % 3) / 100 : 0.06 + (seed % 3) / 100).toFixed(2));
  const roa = Number((approvedLike ? 0.08 + (seed % 3) / 100 : reviewLike ? 0.05 + (seed % 2) / 100 : 0.02 + (seed % 2) / 100).toFixed(2));
  const uboCoverage = app.status === "declined" ? 0.72 : reviewLike ? 0.88 : 1;
  const legalIncidents = app.status === "declined" ? 2 : reviewLike ? 1 : 0;

  return {
    segment:
      app.requestedAmount >= 10_000_000 ? "Corporativo" : app.requestedAmount >= 4_000_000 ? "PYME estructurada" : "PYME",
    companyType:
      app.product === "Arrendamiento financiero"
        ? "Empresa intensiva en activos"
        : app.product === "Credito revolvente"
          ? "Operacion comercial / capital de trabajo"
          : "Empresa operativa",
    requestedTermMonths,
    monthlyRevenue,
    annualRevenue,
    antiquityMonths,
    bureauScore,
    shareholderScore,
    maxDaysPastDue,
    dscr,
    leverageRatio,
    topClientConcentration,
    ebitdaMargin,
    roe,
    roa,
    workingCapital,
    freeCashFlow,
    requestedAmountToRevenue,
    naicsRiskIndex,
    debtBurdenRatio,
    quotaToIncomeRatio,
    kybCompleteness: Number(Math.min(1, kybCompleteness).toFixed(2)),
    amlAlerts,
    taxComplianceStatus,
    uboCoverage,
    legalIncidents,
    taxStatus: taxComplianceStatus === 1 ? "Positiva" : taxComplianceStatus === 0 ? "En proceso" : "Negativa",
    mercantileStatus: antiquityMonths >= 24 ? "Vigente" : "Con observacion",
    shareholdersStructure: uboCoverage >= 1 ? "Completa" : "Parcial",
    docsStatus: [
      { label: "RFC / Tax ID", detail: "Vigencia SAT y razon social conciliada", status: "ok" },
      {
        label: "Opinion de Cumplimiento Fiscal 32-D",
        detail:
          taxComplianceStatus === 1
            ? "Positiva: la empresa esta al corriente con sus obligaciones fiscales."
            : taxComplianceStatus === 0
              ? "Sin opinion / En proceso: el SAT continua validando informacion o creditos fiscales especificos."
              : "Negativa: existen adeudos fiscales o declaraciones obligatorias pendientes.",
        status: taxComplianceStatus === 1 ? "ok" : taxComplianceStatus === 0 ? "warn" : "bad",
      },
      { label: "Acta constitutiva", detail: antiquityMonths >= 24 ? "Validada" : "Pendiente de aclaracion", status: antiquityMonths >= 24 ? "ok" : "warn" },
      { label: "Poderes notariales", detail: uboCoverage >= 0.88 ? "Representacion vigente" : "Firmantes incompletos", status: uboCoverage >= 0.88 ? "ok" : "warn" },
      { label: "Estados financieros", detail: freeCashFlow > 0 ? "Recibidos y conciliados" : "Con desviaciones", status: freeCashFlow > 0 ? "ok" : "warn" },
    ],
    amlChecks: [
      { label: "Listas OFAC / ONU", detail: amlAlerts === 0 ? "Sin coincidencias" : "Coincidencia por revisar", status: amlAlerts === 0 ? "ok" : "bad" },
      { label: "PEPs / partes relacionadas", detail: legalIncidents === 0 ? "Sin exposicion material" : "Relacion con tercero observado", status: legalIncidents === 0 ? "ok" : "warn" },
      { label: "Prensa adversa", detail: amlAlerts > 1 ? "Hallazgos abiertos" : "Sin eventos criticos", status: amlAlerts > 1 ? "bad" : "ok" },
      { label: "Demandas / gravamenes", detail: legalIncidents === 0 ? "Sin eventos relevantes" : `${legalIncidents} incidencia(s) en seguimiento`, status: legalIncidents === 0 ? "ok" : "warn" },
    ],
    scoringHighlights: [
      `Buró empresarial ${bureauScore}`,
      `Score socios / aval ${shareholderScore}`,
      `${app.status === "declined" ? "Cartera vencida material" : "Creditos vigentes controlados"}`,
      `Indice NAICS ${naicsRiskIndex}`,
    ],
    financeHighlights: [
      `EBITDA ${formatPlainPct(ebitdaMargin)}`,
      `ROE ${formatPlainPct(roe)}`,
      `ROA ${formatPlainPct(roa)}`,
      `Capital de trabajo ${money(workingCapital)}`,
      `Flujo libre ${money(freeCashFlow)}`,
    ],
    sectorHighlights: [
      `Cuota / ingresos ${formatPlainPct(quotaToIncomeRatio)}`,
      `Ingresos verificados ${money(monthlyRevenue)}/mes`,
      `Concentracion top cliente ${formatPlainPct(topClientConcentration)}`,
      `Endeudamiento ${formatPlainPct(debtBurdenRatio)}`,
    ],
    monitoringHighlights: [
      "Monitor de logs en tiempo real",
      "Alertas de deterioro",
      "Re-scoring periodico",
      "Cobranza temprana",
      `Distribucion poblacional ${riskLevel === "low" ? "estable" : "bajo vigilancia"}`,
    ],
  };
}

function nextAppNo(rows: Application[], mode: MdcApplicantMode) {
  const expression = mode === "moral" ? /APP-PM-(\d+)/ : /APP-(\d+)/;
  const seed = mode === "moral" ? 100279 : 1284;
  const maxNumber = rows.reduce((max, row) => {
    const match = row.appNo.match(expression);
    return match ? Math.max(max, Number(match[1])) : max;
  }, seed);
  return mode === "moral"
    ? `APP-PM-${String(maxNumber + 1).padStart(6, "0")}`
    : `APP-${String(maxNumber + 1).padStart(6, "0")}`;
}

function defaultRuleForm(products: readonly RuleProduct[]): RuleFormState {
  return {
    name: "",
    product: products[0] ?? NATURAL_CREDIT_PRODUCTS[0],
    field: "",
    evaluationMode: "single",
    operator: "gte",
    value: "",
    dataType: "number",
    severity: "warn",
    description: "",
    status: "active",
    approveMin: "",
    approveMax: "",
    reviewMin: "",
    reviewMax: "",
    rejectMin: "",
    rejectMax: "",
  };
}

function numberToInput(value?: number) {
  return value === undefined ? "" : String(value);
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNumericList(value: string) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}

function hasExactTaxComplianceBands(rule?: CreditRuleRow) {
  const bands = rule?.decisionBands;
  if (!bands) return false;
  return (
    bands.approveMin === 1 &&
    bands.approveMax === 1 &&
    bands.reviewMin === 0 &&
    bands.reviewMax === 0 &&
    bands.rejectMin === -1 &&
    bands.rejectMax === -1
  );
}

function buildDecisionBands(form: RuleFormState) {
  if (form.evaluationMode !== "bands") return undefined;
  const decisionBands = {
    approveMin: parseOptionalNumber(form.approveMin),
    approveMax: parseOptionalNumber(form.approveMax),
    reviewMin: parseOptionalNumber(form.reviewMin),
    reviewMax: parseOptionalNumber(form.reviewMax),
    rejectMin: parseOptionalNumber(form.rejectMin),
    rejectMax: parseOptionalNumber(form.rejectMax),
  };

  return Object.values(decisionBands).some((value) => value !== undefined) ? decisionBands : undefined;
}

function ruleToFormState(rule: CreditRuleRow, product: RuleProduct): RuleFormState {
  return {
    name: rule.name,
    product,
    field: rule.field,
    evaluationMode: rule.decisionBands ? "bands" : "single",
    operator: rule.operator,
    value: rule.decisionBands ? "" : rule.value,
    dataType: rule.dataType,
    severity: rule.severity,
    description: rule.description,
    status: rule.status,
    approveMin: numberToInput(rule.decisionBands?.approveMin),
    approveMax: numberToInput(rule.decisionBands?.approveMax),
    reviewMin: numberToInput(rule.decisionBands?.reviewMin),
    reviewMax: numberToInput(rule.decisionBands?.reviewMax),
    rejectMin: numberToInput(rule.decisionBands?.rejectMin),
    rejectMax: numberToInput(rule.decisionBands?.rejectMax),
  };
}

function mergeRulesWithDefaults(rows: CreditRuleRow[], availableProducts: readonly RuleProduct[], baseRules: CreditRuleRow[]) {
  const dedupeById = (items: CreditRuleRow[]) => {
    const byId = new Map<string, CreditRuleRow>();
    for (const item of items) {
      byId.set(item.id, item);
    }
    return [...byId.values()];
  };

  const sanitizeRule = (rule: CreditRuleRow): CreditRuleRow[] => {
    if (REMOVED_RULE_FIELDS.has(rule.field)) return [];
    const baseId = rule.id.split("::")[0] ?? rule.id;
    const baseRule = baseRules.find((item) => item.id === baseId || item.id.split("::")[0] === baseId);
    const forceBaseBandsForTaxCompliance =
      rule.field === "company.taxComplianceStatus" &&
      Boolean(baseRule?.decisionBands) &&
      !hasExactTaxComplianceBands(rule);
    const forceBaseRuleForNaics =
      rule.field === "company.naicsRiskIndex" &&
      Boolean(baseRule) &&
      (rule.operator !== "contains" || Boolean(rule.decisionBands));
    const needsBandsMigration = !rule.decisionBands && Boolean(baseRule?.decisionBands) && baseRule?.field === rule.field;
    const normalizedRule = forceBaseRuleForNaics
      ? {
          ...rule,
          operator: baseRule?.operator ?? rule.operator,
          value: baseRule?.value ?? rule.value,
          description: baseRule?.description ?? rule.description,
          severity: baseRule?.severity ?? rule.severity,
          decisionBands: baseRule?.decisionBands,
        }
      : forceBaseBandsForTaxCompliance
      ? {
          ...rule,
          operator: baseRule?.operator ?? rule.operator,
          value: baseRule?.value ?? rule.value,
          description: baseRule?.description ?? rule.description,
          severity: baseRule?.severity ?? rule.severity,
          decisionBands: baseRule?.decisionBands,
        }
      : needsBandsMigration
      ? {
          ...rule,
          value: baseRule?.value ?? rule.value,
          description: baseRule?.description ?? rule.description,
          severity: baseRule?.severity ?? rule.severity,
          decisionBands: baseRule?.decisionBands,
        }
      : rule;
    const products =
      normalizedRule.products && normalizedRule.products.length > 0
        ? normalizedRule.products.filter((product) => availableProducts.includes(product))
        : (availableProducts.filter((product) => PRODUCT_RULE_FIELDS[product]?.includes(normalizedRule.field)) as RuleProduct[]);
    if (products.length === 0) return [];
    return products.map((product) => ({
      ...normalizedRule,
      id: `${baseId}::${product}`,
      products: [product],
    }));
  };

  const sanitizedRows = dedupeById(rows.flatMap(sanitizeRule));
  if (sanitizedRows.length === 0) {
    return dedupeById(baseRules.flatMap(sanitizeRule));
  }
  const merged = [...sanitizedRows];
  const byProductField = new Set(sanitizedRows.flatMap((rule) => rule.products.map((product) => `${product}:${rule.field}`)));
  for (const baseRule of baseRules) {
    const sanitizedRowsForBase = sanitizeRule(baseRule);
    for (const sanitized of sanitizedRowsForBase) {
      const product = sanitized.products[0]!;
      const key = `${product}:${sanitized.field}`;
      if (byProductField.has(key)) continue;
      merged.push(sanitized);
      byProductField.add(key);
    }
  }
  return dedupeById(merged);
}

function ruleFieldLabel(field: string) {
  return RULE_FIELD_LABELS[field] ?? field.replaceAll(".", " · ");
}

function getRuleFieldsForProduct(product: RuleProduct) {
  return PRODUCT_RULE_FIELDS[product].map((field) => ({
    value: field,
    label: ruleFieldLabel(field),
  }));
}

function renderRuleOperator(rule: CreditRuleRow) {
  if (rule.decisionBands) {
    return <span className="mdc-badge mdc-badge--neutral">Por bandas</span>;
  }
  return <span className="mdc-rule-operator-label">{RULE_OPERATOR_LABELS[rule.operator]}</span>;
}

function renderRuleValue(rule: CreditRuleRow) {
  if (!rule.decisionBands) return rule.value;
  if (rule.operator === "contains") {
    return rule.value;
  }
  return <span className="mdc-badge mdc-badge--neutral">Por bandas</span>;
}

function renderRuleSeverity(rule: CreditRuleRow) {
  if (rule.decisionBands) {
    const { approveMin, approveMax, reviewMin, reviewMax, rejectMin, rejectMax } = rule.decisionBands;
    const formatBandValue = (value: number) => value.toFixed(Number.isInteger(value) ? 0 : 2);
    const isExactBand = (min?: number, max?: number) => min !== undefined && max !== undefined && min === max;

    return (
      <div className="mdc-rule-bands">
        {approveMax !== undefined && (
          <span className="mdc-rule-band mdc-rule-band--ok">
            {isExactBand(approveMin, approveMax)
              ? `Aprob. = ${formatBandValue(approveMax)}`
              : `Aprob. ≤ ${formatBandValue(approveMax)}`}
          </span>
        )}
        {reviewMin !== undefined && reviewMax !== undefined && (
          <span className="mdc-rule-band mdc-rule-band--warn">
            {isExactBand(reviewMin, reviewMax)
              ? `Rev. = ${formatBandValue(reviewMin)}`
              : `Rev. ${formatBandValue(reviewMin)} - ${formatBandValue(reviewMax)}`}
          </span>
        )}
        {rejectMin !== undefined && (
          <span className="mdc-rule-band mdc-rule-band--bad">
            {isExactBand(rejectMin, rejectMax)
              ? `Rech. = ${formatBandValue(rejectMin)}`
              : `Rech. ≥ ${formatBandValue(rejectMin)}`}
          </span>
        )}
      </div>
    );
  }

  const severityClass =
    rule.severity === "fail" ? "mdc-badge mdc-badge--bad" : rule.severity === "warn" ? "mdc-badge mdc-badge--warn" : "mdc-badge mdc-badge--ok";

  return <span className={severityClass}>{RULE_SEVERITY_LABELS[rule.severity]}</span>;
}

function productCategoryFromMdcProduct(product: string): CreditProductCategory {
  return product === "Credito automotriz" ? "automotriz" : "personal";
}

function isMoralProduct(product: string) {
  return MORAL_CREDIT_PRODUCTS.includes(product as (typeof MORAL_CREDIT_PRODUCTS)[number]);
}

function defaultCrossSellAccepted(
  options: CrossSellOption[],
  client?: CreditClientProfile,
) {
  return Object.fromEntries(
    options.map((option, index) => {
      const normalized = option.id.toLowerCase();
      const enabled =
        normalized.includes("tdc")
          ? Boolean(client?.clientProducts.tdc)
          : normalized.includes("inversion")
            ? Boolean(client?.clientProducts.inversionPatrimonial)
            : normalized.includes("nomina")
              ? Boolean(client?.clientProducts.nomina)
              : normalized.includes("seguro")
                ? Boolean(client?.clientProducts.seguroAuto) || index === 0
                : false;
      return [option.id, enabled];
    }),
  );
}

function ApprovedCrossSellPanel({
  app,
  creditStore,
}: {
  app: Application;
  creditStore: ReturnType<typeof useCreditDemoStore>;
}) {
  const category = productCategoryFromMdcProduct(app.product);
  const product = creditStore.state.products.find((item) => item.category === category);
  const matchedClient =
    creditStore.state.clients.find(
      (client) =>
        client.productId === product?.id &&
        client.kyc.email.toLowerCase() === app.applicantEmail.toLowerCase(),
    ) ??
    creditStore.state.clients.find(
      (client) =>
        client.productId === product?.id &&
        client.name.toLowerCase() === app.applicantName.toLowerCase(),
    );
  const crossSellOptions = useMemo(
    () => creditStore.state.crossSellByCategory[category] ?? [],
    [category, creditStore.state.crossSellByCategory],
  );
  const [crossSellAccepted, setCrossSellAccepted] = useState<Record<string, boolean>>(() =>
    defaultCrossSellAccepted(crossSellOptions, matchedClient),
  );

  if (!product || crossSellOptions.length === 0) return null;

  const quotedClient: CreditClientProfile = matchedClient
    ? {
        ...matchedClient,
        amount: app.requestedAmount,
        termMonths: category === "automotriz" ? 48 : 24,
      }
    : {
        id: `mdc-cross-sell-${app.id}`,
        productId: product.id,
        name: app.applicantName,
        entityType: "PF",
        amount: app.requestedAmount,
        termMonths: category === "automotriz" ? 48 : 24,
        creditScore: bureauScoreFromRiskIndex(app.riskScore),
        aiApproved: true,
        clientProducts: {
          nomina: false,
          tdc: false,
          seguroAuto: false,
          inversionPatrimonial: false,
          cuentaAhorro: false,
        },
        kyc: {
          rfc: "PENDIENTE",
          nationality: "Mexicana",
          address: "No disponible",
          phone: "No disponible",
          email: app.applicantEmail,
          idVerified: true,
          pep: false,
          incomeMonthly: Math.max(20000, Math.round(app.requestedAmount / 12)),
        },
      };

  const quote = calculateCreditQuote({
    product,
    client: quotedClient,
    rules: [],
    crossSellOptions,
    crossSellAccepted,
  });
  const baseBeforeCross = rateBeforeCrossSell(
    quote.baseRate,
    quote.discountsApplied,
    crossSellOptions.map((option) => option.label),
  );
  const totalCrossBps = crossSellOptions
    .filter((option) => crossSellAccepted[option.id])
    .reduce((sum, option) => sum + option.bps, 0);
  const potentialCrossBps = quote.discountsPotential.reduce((sum, discount) => sum + discount.bps, 0);

  return (
    <section className="mdc-detail-card">
      <div className="cortex-quote-result__section">
        <h4>Cross-sell disponible</h4>
        <p className="cortex-quote-result__hint">Productos complementarios para mejorar tasa y relación comercial.</p>
        <ul className="cortex-quote-result__xs-list">
          {quote.discountsPotential.map((discount) => (
            <li key={discount.label}>−{discount.bps} pbs · {discount.label}</li>
          ))}
        </ul>
        <p className="cortex-quote-result__xs-total">
          Hasta <strong>−{potentialCrossBps} pbs</strong> · piso <strong>{formatPctCredit(product.discountBandMin)}</strong>
        </p>
      </div>

      <div className="cortex-quote-result__section">
        <div className="cortex-quote-result__xs-head">
          <h4>Activar cross-sell</h4>
          <span>En vivo: <strong>{formatPctCredit(quote.finalRate)}</strong></span>
        </div>
        <p className="cortex-quote-result__hint">
          Desde <strong>{formatPctCredit(baseBeforeCross)}</strong> · cada producto resta pbs de la tasa
        </p>
        <ul className="cortex-quote-result__xs-steps">
          {crossSellOptions.map((option, index) => {
            const enabled = crossSellAccepted[option.id];
            const stepRate = enabled
              ? crossSellRatePreview(baseBeforeCross, product.discountBandMin, crossSellOptions, crossSellAccepted, index)
              : crossSellRatePreview(baseBeforeCross, product.discountBandMin, crossSellOptions, crossSellAccepted, index, index);

            return (
              <li key={option.id} className={`cortex-quote-result__xs-step${enabled ? " cortex-quote-result__xs-step--on" : ""}`}>
                <AppCheckbox
                  id={`mdc-xs-${app.id}-${option.id}`}
                  checked={enabled}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setCrossSellAccepted((current) => ({ ...current, [option.id]: checked }));
                  }}
                  label={
                    <span className="cortex-quote-result__xs-step-label">
                      <strong>{index + 1}. {option.label}</strong>
                      <span>−{option.bps} pbs · {option.description}</span>
                    </span>
                  }
                />
                <span className="cortex-quote-result__xs-step-rate">
                  {enabled ? formatPctCredit(stepRate) : `→ ${formatPctCredit(stepRate)}`}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="cortex-quote-result__summary">
          <div className="cortex-quote-result__summary-rate">
            <span>{formatPctCredit(baseBeforeCross)}</span>
            <span>→</span>
            <strong>{formatPctCredit(quote.finalRate)}</strong>
          </div>
          <p className="cortex-quote-result__hint">
            {formatPctCredit(baseBeforeCross)} − {totalCrossBps} pbs = {formatPctCredit(quote.finalRate)} · piso {formatPctCredit(product.discountBandMin)}
          </p>
          <div className="cortex-quote-result__kpis">
            <div><span>Pago mensual</span><strong>{formatMxnCredit(quote.monthlyPayment)}</strong></div>
            <div><span>CAT est.</span><strong>{formatPctCredit(quote.estimatedCat)}</strong></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function evaluateRuleResult(rule: CreditRuleRow, metricValue: number, appStatus: ApplicationStatus): RuleSeverity {
  if (rule.decisionBands) {
    const { approveMin, approveMax, reviewMin, reviewMax, rejectMin, rejectMax } = rule.decisionBands;
    const inApprove =
      (approveMin === undefined || metricValue >= approveMin) &&
      (approveMax === undefined || metricValue <= approveMax);
    if (inApprove) return "pass";

    const inReview =
      (reviewMin === undefined || metricValue >= reviewMin) &&
      (reviewMax === undefined || metricValue < reviewMax);
    if (inReview) return "warn";

    const inReject =
      (rejectMin === undefined || metricValue >= rejectMin) &&
      (rejectMax === undefined || metricValue <= rejectMax);
    if (inReject) return "fail";

    return appStatus === "manualReview" ? "warn" : rule.severity;
  }

  if (rule.field === "company.naicsRiskIndex" && rule.operator === "contains") {
    const blockedIndexes = parseNumericList(rule.value);
    const isBlocked = blockedIndexes.includes(metricValue);
    if (isBlocked) return "fail";
    if (appStatus === "manualReview" && rule.severity === "warn") return "warn";
    return "pass";
  }

  const hasPolicyBreach =
    (rule.field === "income.monthlyNet" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "ratios.dti" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "applicant.age" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "bureau.score" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "credit.maxDaysPastDue" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "credit.historyMonths" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "employment.months" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.antiquityMonths" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.monthlyRevenue" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.bureauScore" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.maxDaysPastDue" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "company.dscr" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.leverageRatio" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "company.topClientConcentration" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "company.ebitdaMargin" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.kybCompleteness" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.amlAlerts" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "company.shareholderScore" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.requestedAmountToRevenue" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "company.requestedTermMonths" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "company.taxComplianceStatus" && metricValue < Number(rule.value || 0));

  if (hasPolicyBreach) {
    return appStatus === "manualReview" && rule.severity !== "fail" ? "warn" : "fail";
  }
  if (appStatus === "manualReview" && rule.severity === "warn") {
    return "warn";
  }
  return "pass";
}

function normalizeProductName(name: string) {
  if (name === "BNPL") return "Credito personal";
  if (name === "Prestamo personal") return "Credito automotriz";
  if (name.toLowerCase().includes("plazo fijo")) return "Credito personal";
  return name;
}

function normalizeApplicantEmail(email: string) {
  return email.replace(/@example\.com$/i, "@gmail.com");
}

function bindApplicantFromPool(
  app: Pick<Application, "id" | "appNo" | "product" | "applicantName" | "applicantEmail">,
  mode: MdcApplicantMode,
) {
  const pool: MdcClientPoolItem[] =
    mode === "moral"
      ? PM_MDC_CLIENTS.filter((client) => client.product === app.product)
      : app.product === "Credito automotriz"
        ? LCC_AUTO_CLIENTS
        : app.product === "Credito personal"
          ? LCC_PERSONAL_CLIENTS
          : [];

  if (pool.length === 0) {
    return { applicantName: app.applicantName, applicantEmail: app.applicantEmail };
  }

  const byEmail = pool.find(
    (client) => client.email.toLowerCase() === app.applicantEmail.toLowerCase(),
  );
  if (byEmail) {
    return { applicantName: byEmail.name, applicantEmail: byEmail.email };
  }
  const byName = pool.find(
    (client) => client.name.toLowerCase() === app.applicantName.toLowerCase(),
  );
  if (byName) {
    return { applicantName: byName.name, applicantEmail: byName.email };
  }

  if (mode === "moral") {
    return { applicantName: app.applicantName, applicantEmail: app.applicantEmail };
  }

  let hash = 0;
  const seed = `${app.id}-${app.appNo}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % pool.length;
  const selected = pool[idx];
  return { applicantName: selected.name, applicantEmail: selected.email };
}

function normalizeRequestedAmount(product: string, requestedAmount: number) {
  if (product === "Credito personal") {
    if (requestedAmount < 25_000) return 25_000 + Math.round(requestedAmount * 60);
    return Math.min(Math.max(requestedAmount, 25_000), 800_000);
  }
  if (product === "Credito automotriz") {
    if (requestedAmount < 100_000) return 100_000 + Math.round(requestedAmount * 14);
    return Math.min(Math.max(requestedAmount, 100_000), 2_500_000);
  }
  if (product === "Credito revolvente") {
    if (requestedAmount < 750_000) return 750_000 + Math.round(requestedAmount * 4);
    return Math.min(Math.max(requestedAmount, 750_000), 18_000_000);
  }
  if (product === "Credito simple empresarial") {
    if (requestedAmount < 1_000_000) return 1_000_000 + Math.round(requestedAmount * 3.5);
    return Math.min(Math.max(requestedAmount, 1_000_000), 25_000_000);
  }
  if (product === "Arrendamiento financiero") {
    if (requestedAmount < 1_500_000) return 1_500_000 + Math.round(requestedAmount * 3.2);
    return Math.min(Math.max(requestedAmount, 1_500_000), 30_000_000);
  }
  return requestedAmount;
}

function hydrateApplications(mode: MdcApplicantMode, rows: Application[]) {
  return rows.map((app) => ({
    ...app,
    product: normalizeProductName(app.product),
    riskScore: normalizeRiskScoreForStatus(app.status, app.riskScore),
    risk: riskFromApplicationStatus(app.status, app.riskScore),
    ...bindApplicantFromPool(
      {
        id: app.id,
        appNo: app.appNo,
        product: normalizeProductName(app.product),
        applicantName: app.applicantName,
        applicantEmail: normalizeApplicantEmail(app.applicantEmail),
      },
      mode,
    ),
    requestedAmount: normalizeRequestedAmount(normalizeProductName(app.product), app.requestedAmount),
  }));
}

function MdcStatCard({
  title,
  value,
  deltaPct,
  positive,
  comparisonLabel,
}: {
  title: string;
  value: string;
  deltaPct: number;
  positive: boolean;
  comparisonLabel: string;
}) {
  return (
    <article className="mdc-kpi-card mdc-kpi-card--rich">
      <div className="mdc-kpi-card__title-row">
        <p>{title}</p>
      </div>
      <strong>{value}</strong>
      <div className="mdc-kpi-card__delta">
        <span className={`mdc-kpi-card__delta-pill${positive ? " mdc-kpi-card__delta-pill--up" : " mdc-kpi-card__delta-pill--down"}`}>
          {deltaPctLabel(deltaPct)}
        </span>
        <span>{comparisonLabel}</span>
      </div>
    </article>
  );
}

function LineChart({ points }: { points: { label: string; value: number }[] }) {
  const width = 1080;
  const height = 320;
  const topPad = 18;
  const rightPad = 20;
  const bottomPad = 44;
  const leftPad = 52;
  const chartWidth = width - leftPad - rightPad;
  const chartHeight = height - topPad - bottomPad;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const chartMax = Math.max(8, Math.ceil(maxValue / 2) * 2);
  const ticks = [0, chartMax / 4, chartMax / 2, (chartMax * 3) / 4, chartMax].map((tick) => Math.round(tick));
  const uniqueTicks = Array.from(new Set(ticks));

  const xForIndex = (index: number) => leftPad + (chartWidth * index) / Math.max(points.length - 1, 1);
  const yForValue = (value: number) => topPad + chartHeight - (value / chartMax) * chartHeight;
  const linePoints = points.map((point, index) => `${xForIndex(index)},${yForValue(point.value)}`).join(" ");
  const areaPoints = `${leftPad},${topPad + chartHeight} ${linePoints} ${leftPad + chartWidth},${topPad + chartHeight}`;
  const labelStep = points.length > 14 ? Math.ceil(points.length / 12) : 1;

  return (
    <svg className="mdc-line-chart" viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id="mdcOverviewLineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {uniqueTicks.map((tick) => {
        const y = yForValue(tick);
        return (
          <g key={tick}>
            <line x1={leftPad} y1={y} x2={leftPad + chartWidth} y2={y} className="mdc-line-chart__grid" />
            <text x={leftPad - 8} y={y + 4} textAnchor="end" className="mdc-line-chart__y-label">
              {tick}
            </text>
          </g>
        );
      })}

      <polygon points={areaPoints} className="mdc-line-chart__area" />
      <polyline points={linePoints} className="mdc-line-chart__line" />

      {points.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={xForIndex(index)} cy={yForValue(point.value)} r="4" className="mdc-line-chart__dot" />
          {(index === 0 || index === points.length - 1 || index % labelStep === 0) && (
            <text x={xForIndex(index)} y={height - 16} textAnchor="middle" className="mdc-line-chart__x-label">
              {point.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = Math.max(data.reduce((sum, d) => sum + d.value, 0), 1);
  const percentages = normalizedPercentages(data.map((d) => d.value));
  const r = 52;
  const c = 62;
  const circumference = 2 * Math.PI * r;
  const slices = data.reduce<{ label: string; value: number; color: string; len: number; offset: number }[]>(
    (acc, slice) => {
      const used = acc.reduce((sum, item) => sum + item.len, 0);
      const len = circumference * (slice.value / total);
      acc.push({
        label: slice.label,
        value: slice.value,
        color: slice.color,
        len,
        offset: used,
      });
      return acc;
    },
    [],
  );

  return (
    <div className="mdc-donut-wrap">
      <div className="mdc-donut-shell">
        <svg viewBox="0 0 124 124" className="mdc-donut" aria-hidden>
          <defs>
            <filter id="mdcDonutShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#0f172a" floodOpacity="0.18" />
            </filter>
          </defs>
          <circle cx={c} cy={c} r={r} fill="none" stroke="#e2e8f0" strokeWidth="18" />
          <g filter="url(#mdcDonutShadow)">
            {slices.map((slice) => {
              return (
                <circle
                  key={slice.label}
                  cx={c}
                  cy={c}
                  r={r}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={`${slice.len} ${circumference - slice.len}`}
                  strokeDashoffset={-slice.offset}
                  transform={`rotate(-90 ${c} ${c})`}
                />
              );
            })}
          </g>
          <circle cx={c} cy={c} r="35" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <text x={c} y={58} textAnchor="middle" className="mdc-donut-total">{total}</text>
          <text x={c} y={72} textAnchor="middle" className="mdc-donut-sub">Solicitudes</text>
          {slices.map((slice) => {
            const angle = ((slice.offset + slice.len / 2) / circumference) * 2 * Math.PI - Math.PI / 2;
            const labelRadius = 52;
            const x = c + Math.cos(angle) * labelRadius;
            const y = c + Math.sin(angle) * labelRadius;
            const idx = data.findIndex((item) => item.label === slice.label);
            return (
              <text key={`${slice.label}-pct`} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="mdc-donut-slice-pct">
                {pctLabel(percentages[idx] ?? 0)}
              </text>
            );
          })}
        </svg>
      </div>
      <div className="mdc-donut-legend">
        {data.map((d, index) => (
          <div key={d.label} className="mdc-legend-item">
            <span style={{ background: d.color }} />
            <strong>{d.label}</strong>
            <em className="mdc-legend-item__pct">{pctLabel(percentages[index] ?? 0)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function SegmentedBar({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = Math.max(data.reduce((sum, d) => sum + d.value, 0), 1);
  return (
    <div className="mdc-seg-wrap">
      <div className="mdc-seg-bar" aria-hidden>
        {data.map((segment) => (
          <div
            key={segment.label}
            style={{ width: `${(segment.value / total) * 100}%`, background: segment.color }}
          />
        ))}
      </div>
      <div className="mdc-seg-legend">
        {data.map((segment) => (
          <div key={segment.label} className="mdc-seg-item">
            <span style={{ background: segment.color }} />
            <strong>{segment.label}</strong>
            <em>{ratioLabel(segment.value / total)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function MoralApplicantDetailModal({
  app,
  rules,
  onClose,
}: {
  app: Application;
  rules: CreditRuleRow[];
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [overrideChoice, setOverrideChoice] = useState<ApplicationStatus>("manualReview");
  const [overrideReason, setOverrideReason] = useState("");
  const profile = buildMoralCompanyProfile(app);
  const appRiskLevel = riskFromScore(app.riskScore);
  const scoreTone = app.status === "declined" ? "bad" : app.status === "manualReview" || app.status === "pending" ? "warn" : "ok";
  const stages = [
    { id: "input", label: "Captura y onboarding", state: "done" },
    { id: "kyb", label: "KYB / existencia legal", state: profile.kybCompleteness >= 0.9 ? "done" : "current" },
    { id: "aml", label: "AML / PLD", state: profile.amlAlerts > 0 ? "failed" : "done" },
    { id: "risk", label: "Scoring y finanzas", state: app.status === "declined" ? "failed" : "done" },
    {
      id: "decision",
      label: "Decision automatizada",
      state: app.status === "declined" ? "failed" : app.status === "manualReview" || app.status === "pending" ? "current" : "done",
    },
  ] as const;

  const metricByField: Partial<Record<CreditRuleRow["field"], number>> = {
    "company.antiquityMonths": profile.antiquityMonths,
    "company.monthlyRevenue": profile.monthlyRevenue,
    "company.bureauScore": profile.bureauScore,
    "company.shareholderScore": profile.shareholderScore,
    "company.maxDaysPastDue": profile.maxDaysPastDue,
    "company.dscr": profile.dscr,
    "company.leverageRatio": profile.leverageRatio,
    "company.topClientConcentration": profile.topClientConcentration,
    "company.ebitdaMargin": profile.ebitdaMargin,
    "company.kybCompleteness": profile.kybCompleteness,
    "company.amlAlerts": profile.amlAlerts,
    "company.requestedAmountToRevenue": profile.requestedAmountToRevenue,
    "company.naicsRiskIndex": profile.naicsRiskIndex,
    "company.requestedTermMonths": profile.requestedTermMonths,
    "company.taxComplianceStatus": profile.taxComplianceStatus,
  };

  const ruleResultLabel: Record<RuleSeverity, string> = {
    pass: "Aprobado",
    warn: "Revision",
    fail: "Rechazado",
  };

  const activeRules = rules
    .filter((rule) => rule.status === "active" && rule.products.includes(app.product as RuleProduct))
    .map((rule) => {
      const metricValue = metricByField[rule.field] ?? 0;
      const result = evaluateRuleResult(rule, metricValue, app.status);
      return { ...rule, metricValue, result };
    });

  const failedRuleRows = activeRules.filter((rule) => rule.result === "fail");
  const warnedRuleRows = activeRules.filter((rule) => rule.result === "warn");

  const pmRuleReason = (rule: (typeof activeRules)[number]) => {
    switch (rule.field) {
      case "company.antiquityMonths":
        return `Antiguedad operativa de ${profile.antiquityMonths} meses, por debajo del minimo requerido.`;
      case "company.monthlyRevenue":
        return `Facturacion mensual promedio de ${money(profile.monthlyRevenue)}, insuficiente frente al monto solicitado.`;
      case "company.bureauScore":
        return `Score de buro empresarial de ${profile.bureauScore}, debajo del umbral de originacion.`;
      case "company.shareholderScore":
        return `Score consolidado de socios / aval en ${profile.shareholderScore}, requiere mitigantes adicionales.`;
      case "company.maxDaysPastDue":
        return `Atraso maximo reciente de ${profile.maxDaysPastDue} dias en experiencia de pago empresarial.`;
      case "company.dscr":
        return `DSCR de ${profile.dscr.toFixed(2)}, insuficiente para el servicio de deuda esperado.`;
      case "company.leverageRatio":
        return `Apalancamiento de ${profile.leverageRatio.toFixed(2)}x, por encima del apetito definido.`;
      case "company.topClientConcentration":
        return `Concentracion del cliente principal en ${formatPlainPct(profile.topClientConcentration)}, expone demasiado la fuente de ingresos.`;
      case "company.ebitdaMargin":
        return `Margen EBITDA de ${formatPlainPct(profile.ebitdaMargin)}, por debajo del nivel minimo esperado.`;
      case "company.kybCompleteness":
        return `Expediente KYB en ${formatPlainPct(profile.kybCompleteness)}, todavia incompleto.`;
      case "company.amlAlerts":
        return `Existen ${profile.amlAlerts} alerta(s) AML/PLD abiertas que bloquean aprobacion automatica.`;
      case "company.requestedAmountToRevenue":
        return `La relacion monto / ventas es ${profile.requestedAmountToRevenue.toFixed(2)}x y presiona la capacidad de pago.`;
      case "company.naicsRiskIndex":
        return `El indice sectorial NAICS ${profile.naicsRiskIndex} esta configurado en la lista de rechazo automatico de la politica.`;
      case "company.requestedTermMonths":
        return `Plazo solicitado de ${profile.requestedTermMonths} meses excede el maximo permitido para el producto.`;
      case "company.taxComplianceStatus":
        return profile.taxComplianceStatus === 0
          ? "La Opinion de Cumplimiento Fiscal 32-D sigue en proceso de validacion por parte del SAT."
          : "La Opinion de Cumplimiento Fiscal 32-D es negativa y bloquea la originacion automatica.";
      default:
        return `${rule.name}: validacion corporativa fuera de politica.`;
    }
  };

  const decisionReason =
    app.status === "approved"
      ? `Operacion aprobada con oferta de monto, tasa y plazo. DSCR ${profile.dscr.toFixed(2)}, score empresarial ${profile.bureauScore} y expediente KYB ${formatPlainPct(profile.kybCompleteness)}.`
      : app.status === "declined"
        ? `Solicitud rechazada por politica automatica: ${failedRuleRows.map(pmRuleReason).slice(0, 3).join(" ")}`
        : app.status === "overridden"
          ? `Operacion aprobada con override documentado. Se conservaron alertas en ${warnedRuleRows.map((rule) => rule.name).slice(0, 2).join(", ") || "politica comercial"}.`
          : `Caso enviado a zona gris para revision manual. Alertas principales: ${warnedRuleRows.map(pmRuleReason).slice(0, 2).join(" ") || "validaciones complementarias de riesgo y cumplimiento."}`;

  const runAction = (label: string) => {
    setFeedback(`${label} ejecutado · ${new Intl.DateTimeFormat("es-MX", { timeStyle: "short" }).format(new Date())}`);
  };

  const applyOverride = () => {
    if (!overrideReason.trim()) {
      setFeedback("Debes dejar la justificacion del override. Si no, eso en cumplimiento no pasa ni de chiste.");
      return;
    }
    setFeedback(`Override aplicado: ${STATUS_LABELS[overrideChoice]}. Registrado en trazabilidad corporativa.`);
  };

  const decisionCardClass = (status: "approved" | "declined" | "manual") =>
    `mdc-pm-decision-card${
      (status === "approved" && app.status === "approved") ||
      (status === "declined" && app.status === "declined") ||
      (status === "manual" && (app.status === "manualReview" || app.status === "pending" || app.status === "overridden"))
        ? " mdc-pm-decision-card--active"
        : ""
    }`;

  return (
    <div className="mdc-modal-backdrop" onClick={onClose}>
      <div className="mdc-modal mdc-modal--detail" onClick={(e) => e.stopPropagation()}>
        <header className="mdc-detail-head">
          <div className="mdc-detail-head__title">
            <button type="button" className="mdc-link-btn" onClick={onClose}>
              ← Volver a solicitudes
            </button>
            <div className="mdc-detail-head__line">
              <h3>Detalle de empresa</h3>
              <span className={classForStatus(app.status)}>{STATUS_LABELS[app.status]}</span>
              <span className={classForRisk(appRiskLevel)}>{RISK_LABELS[appRiskLevel]}</span>
            </div>
            <p>
              {app.appNo} · {app.product} · {profile.segment}
            </p>
          </div>
        </header>

        {feedback ? <p className="mdc-detail-feedback">{feedback}</p> : null}

        <div className="mdc-detail-progress">
          {stages.map((stage) => (
            <div key={stage.id} className="mdc-stage-card">
              <span className={`mdc-stage-dot mdc-stage-dot--${stage.state}`} />
              <strong>{stage.label}</strong>
              <em>{stage.state === "done" ? "Completado" : stage.state === "current" ? "En proceso" : "Con observacion"}</em>
            </div>
          ))}
        </div>

        <div className="mdc-pm-hero">
          <div>
            <p className="mdc-pm-hero__eyebrow">Motor de decision de credito · persona moral</p>
            <h2>{app.applicantName}</h2>
            <span>{app.applicantEmail}</span>
          </div>
          <div className="mdc-pm-hero__stats">
            <div>
              <span>Score empresa</span>
              <strong>{profile.bureauScore}</strong>
            </div>
            <div>
              <span>DSCR</span>
              <strong>{profile.dscr.toFixed(2)}x</strong>
            </div>
            <div>
              <span>Monto solicitado</span>
              <strong>{money(app.requestedAmount)}</strong>
            </div>
          </div>
        </div>

        <div className="mdc-detail-layout mdc-detail-layout--pm">
          <div className="mdc-detail-main">
            <section className="mdc-detail-card">
              <div className="mdc-detail-card__head">
                <h4>1. Captura y onboarding digital</h4>
                <span className="mdc-badge mdc-badge--neutral">{profile.companyType}</span>
              </div>
              <dl className="mdc-detail-dl">
                <div><dt>RFC / Tax ID</dt><dd>{app.id}</dd></div>
                <div><dt>Producto solicitado</dt><dd>{app.product}</dd></div>
                <div><dt>Plazo solicitado</dt><dd>{profile.requestedTermMonths} meses</dd></div>
                <div><dt>Destino del credito</dt><dd>{app.product === "Credito revolvente" ? "Capital de trabajo" : app.product === "Arrendamiento financiero" ? "Activo productivo" : "Expansion operativa"}</dd></div>
              </dl>
            </section>

            <section className="mdc-detail-card">
              <div className="mdc-detail-card__head">
                <h4>2. Verificacion y KYB</h4>
                <span className={profile.kybCompleteness >= 0.9 ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--warn"}>
                  {formatPlainPct(profile.kybCompleteness)}
                </span>
              </div>
              <div className="mdc-pm-grid">
                <article className="mdc-pm-metric-card">
                  <span>Registro mercantil / existencia legal</span>
                  <strong>{profile.mercantileStatus}</strong>
                </article>
                <article className="mdc-pm-metric-card">
                  <span>Situacion fiscal SAT</span>
                  <strong>{profile.taxStatus}</strong>
                </article>
                <article className="mdc-pm-metric-card">
                  <span>Estructura societaria</span>
                  <strong>{profile.shareholdersStructure}</strong>
                </article>
                <article className="mdc-pm-metric-card">
                  <span>Beneficiarios reales (UBO)</span>
                  <strong>{formatPlainPct(profile.uboCoverage)}</strong>
                </article>
              </div>
              <div className="mdc-pm-status-list">
                {profile.docsStatus.map((item) => (
                  <article key={item.label} className="mdc-pm-status-item">
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.detail}</p>
                    </div>
                    <span className={`mdc-col-pill mdc-col-pill--${item.status}`}>{item.status === "ok" ? "Ok" : item.status === "warn" ? "Revision" : "Bloqueo"}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="mdc-detail-card">
              <div className="mdc-detail-card__head">
                <h4>3. Cumplimiento y listas restrictivas</h4>
                <span className={profile.amlAlerts === 0 ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--bad"}>
                  {profile.amlAlerts === 0 ? "Sin alertas" : `${profile.amlAlerts} alerta(s)`}
                </span>
              </div>
              <div className="mdc-pm-status-list">
                {profile.amlChecks.map((item) => (
                  <article key={item.label} className="mdc-pm-status-item">
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.detail}</p>
                    </div>
                    <span className={`mdc-col-pill mdc-col-pill--${item.status}`}>{item.status === "ok" ? "Limpio" : item.status === "warn" ? "Seguimiento" : "Bloqueante"}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="mdc-detail-card">
              <h4>4. Consulta a buro y scoring de la empresa</h4>
              <div className="mdc-pm-grid">
                <article className="mdc-pm-metric-card">
                  <span>Buro de credito empresarial</span>
                  <strong>{profile.bureauScore}</strong>
                </article>
                <article className="mdc-pm-metric-card">
                  <span>Score socios / aval</span>
                  <strong>{profile.shareholderScore}</strong>
                </article>
                <article className="mdc-pm-metric-card">
                  <span>Creditos vigentes y vencidos</span>
                  <strong>{profile.maxDaysPastDue} dias max.</strong>
                </article>
                <article className="mdc-pm-metric-card">
                  <span>Nivel de endeudamiento</span>
                  <strong>{formatPlainPct(profile.debtBurdenRatio)}</strong>
                </article>
              </div>
            </section>

            <section className="mdc-detail-card">
              <h4>5. Capacidad de pago y riesgo del sector</h4>
              <div className="mdc-pm-grid">
                <article className="mdc-pm-metric-card"><span>Relacion cuota / ingresos</span><strong>{formatPlainPct(profile.quotaToIncomeRatio)}</strong></article>
                <article className="mdc-pm-metric-card"><span>Concentracion top cliente</span><strong>{formatPlainPct(profile.topClientConcentration)}</strong></article>
                <article className="mdc-pm-metric-card"><span>Indice sectorial NAICS</span><strong>{profile.naicsRiskIndex}</strong></article>
                <article className="mdc-pm-metric-card"><span>Monto / ventas mensuales</span><strong>{profile.requestedAmountToRevenue.toFixed(2)}x</strong></article>
              </div>
              <div className="mdc-pm-chip-wrap">
                {profile.sectorHighlights.map((item) => (
                  <span key={item} className="mdc-col-pill mdc-col-pill--ok">{item}</span>
                ))}
              </div>
            </section>

            <section className="mdc-detail-card">
              <div className="mdc-detail-card__head">
                <h4>6. Motor de reglas y politicas de credito</h4>
                <span className={failedRuleRows.length > 0 ? "mdc-badge mdc-badge--bad" : warnedRuleRows.length > 0 ? "mdc-badge mdc-badge--warn" : "mdc-badge mdc-badge--ok"}>
                  {failedRuleRows.length > 0 ? "Con rechazos" : warnedRuleRows.length > 0 ? "Con revision" : "Aprobable"}
                </span>
              </div>
              <div className="mdc-detail-rule-list">
                {activeRules.map((rule) => (
                  <article key={rule.id} className="mdc-detail-rule">
                    <div>
                      <strong>{rule.name}</strong>
                      <p>{rule.description}</p>
                    </div>
                    <span className={chipToneBySeverity(rule.result)}>{ruleResultLabel[rule.result]}</span>
                  </article>
                ))}
              </div>
            </section>

          </div>

          <aside className="mdc-detail-side">
            <section className="mdc-detail-card">
              <h4>Resumen ejecutivo</h4>
              <div className="mdc-detail-score-grid">
                <div><span>Segmento</span><strong>{profile.segment}</strong></div>
                <div><span>Antiguedad</span><strong>{Math.floor(profile.antiquityMonths / 12)} a</strong></div>
                <div><span>AML alertas</span><strong>{profile.amlAlerts}</strong></div>
                <div><span>KYB</span><strong>{formatPlainPct(profile.kybCompleteness)}</strong></div>
                <div><span>NAICS</span><strong>{profile.naicsRiskIndex}</strong></div>
                <div><span>ROE / ROA</span><strong>{formatPlainPct(profile.roe, 0)} / {formatPlainPct(profile.roa, 0)}</strong></div>
              </div>
              <div className="mdc-score-track" aria-hidden>
                <span style={{ width: `${Math.min(100, Math.round((profile.bureauScore / 850) * 100))}%` }} />
              </div>
            </section>

            <section className="mdc-detail-card">
              <h4>Override manual</h4>
              <label className="mdc-detail-field">
                <span>Nueva decision</span>
                <select value={overrideChoice} onChange={(e) => setOverrideChoice(e.target.value as ApplicationStatus)}>
                  <option value="approved">Aprobada</option>
                  <option value="declined">Rechazada</option>
                  <option value="manualReview">Revision manual</option>
                  <option value="overridden">Override</option>
                </select>
              </label>
              <label className="mdc-detail-field">
                <span>Justificacion</span>
                <textarea
                  rows={4}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Mitigantes, comite, soporte documental o aprobacion comercial."
                />
              </label>
              <button type="button" className="mdc-btn mdc-btn--primary" onClick={applyOverride}>
                Aplicar override
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function AppDetailModal({
  app,
  rules,
  mode,
  creditStore,
  onClose,
}: {
  app: Application;
  rules: CreditRuleRow[];
  mode: MdcApplicantMode;
  creditStore: ReturnType<typeof useCreditDemoStore>;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [overrideChoice, setOverrideChoice] = useState<ApplicationStatus>("manualReview");
  const [overrideReason, setOverrideReason] = useState("");
  const isMoralApplicant = mode === "moral";
  if (isMoralApplicant) {
    return <MoralApplicantDetailModal app={app} rules={rules} onClose={onClose} />;
  }
  const isAutomotriz = app.product === "Credito automotriz";
  const interestRate = isAutomotriz ? 13.8 : 21.2;
  const termMonths = isAutomotriz ? 48 : 24;
  const downPayment = isAutomotriz ? Math.round(app.requestedAmount * 0.15) : 0;
  const financedAmount = Math.max(app.requestedAmount - downPayment, 0);
  const totalWithInterest = financedAmount * (1 + (interestRate / 100) * (termMonths / 12));
  const monthlyEstimate = Math.round(totalWithInterest / Math.max(termMonths, 1));
  const fraudScore = Math.min(96, Math.max(10, Math.round(app.riskScore * 0.72 + (quickHash(app.id) % 17))));
  const dti = Math.min(0.62, Math.max(0.19, app.requestedAmount / (isAutomotriz ? 8_500_000 : 2_100_000)));
  const kycIdentity = app.riskScore < 70 ? "Aprobada" : "Revision";
  const kycAddress = app.riskScore < 65 ? "Aprobada" : "Revision";
  const kycWatchlist = app.riskScore < 78 ? "Sin alertas" : "Coincidencia";
  const docs = [
    {
      type: "INE / Pasaporte",
      file: `id_${app.appNo}.pdf`,
      automated: app.riskScore < 65 ? "Aprobada" : "Revision",
      manual: "Pendiente",
      confidence: `${84 + (quickHash(app.id + "id") % 12)}%`,
    },
    {
      type: "Comprobante domicilio",
      file: `dom_${app.appNo}.pdf`,
      automated: app.riskScore < 72 ? "Aprobada" : "Revision",
      manual: "Pendiente",
      confidence: `${81 + (quickHash(app.id + "dom") % 15)}%`,
    },
    {
      type: "Comprobante ingresos",
      file: `ing_${app.appNo}.pdf`,
      automated: app.riskScore < 74 ? "Aprobada" : "Revision",
      manual: "Pendiente",
      confidence: `${79 + (quickHash(app.id + "ing") % 17)}%`,
    },
  ];
  const incomeMinRule = rules.find((rule) => rule.status === "active" && rule.field === "income.monthlyNet");
  const dtiRule = rules.find((rule) => rule.status === "active" && rule.field === "ratios.dti");
  const ageRule = rules.find((rule) => rule.status === "active" && rule.field === "applicant.age");
  const bureauRule = rules.find((rule) => rule.status === "active" && rule.field === "bureau.score");
  const delinquencyRule = rules.find((rule) => rule.status === "active" && rule.field === "credit.maxDaysPastDue");
  const historyRule = rules.find((rule) => rule.status === "active" && rule.field === "credit.historyMonths");
  const incomeMin = Number(incomeMinRule?.value ?? 12000) || 12000;
  const dtiMax = Number(dtiRule?.value ?? 0.45) || 0.45;
  const ageMin = Number(ageRule?.value ?? 18) || 18;
  const bureauBaseMin = Number(bureauRule?.value ?? 620) || 620;
  const maxDaysPastDueAllowed = Number(delinquencyRule?.value ?? 29) || 29;
  const historyMinMonths = Number(historyRule?.value ?? 12) || 12;
  const bureauMinByProduct = isAutomotriz ? 680 : 620;
  const bureauMin = Math.max(bureauBaseMin, bureauMinByProduct);
  const estimatedIncomeMonthly = Math.max(
    6000,
    Math.round(isAutomotriz ? app.requestedAmount / 70 : app.requestedAmount / 28),
  );
  const estimatedAge = 20 + (quickHash(`${app.id}-age`) % 28);
  const bureauScoreEstimated = bureauScoreFromRiskIndex(app.riskScore);
  const maxDaysPastDue = Math.max(
    0,
    Math.min(120, Math.round(app.riskScore * 1.15 + (quickHash(`${app.id}-dpd`) % 21) - 8)),
  );
  const creditHistoryMonths = Math.max(3, Math.round(96 - app.riskScore + (quickHash(`${app.id}-hist`) % 36)));
  const employmentMonths = Math.max(1, Math.round(12 + (quickHash(`${app.id}-employment`) % 36)));
  const hasDocumentAlerts = docs.filter((doc) => doc.automated === "Revision").length >= 2;
  const hasCapacityPressure = monthlyEstimate > estimatedIncomeMonthly * 0.45;
  const metricByField: Partial<Record<CreditRuleRow["field"], number>> = {
    "income.monthlyNet": estimatedIncomeMonthly,
    "ratios.dti": dti,
    "applicant.age": estimatedAge,
    "bureau.score": bureauScoreEstimated,
    "credit.maxDaysPastDue": maxDaysPastDue,
    "credit.historyMonths": creditHistoryMonths,
    "employment.months": employmentMonths,
  };
  const policyByField: Partial<Record<CreditRuleRow["field"], boolean>> = {
    "income.monthlyNet": estimatedIncomeMonthly < incomeMin || hasCapacityPressure,
    "ratios.dti": dti > dtiMax,
    "applicant.age": estimatedAge < ageMin,
    "bureau.score": bureauScoreEstimated < bureauMin,
    "credit.maxDaysPastDue": maxDaysPastDue > maxDaysPastDueAllowed,
    "credit.historyMonths": creditHistoryMonths < historyMinMonths,
  };
  const stages = [
    { id: "onboarding", label: "Onboarding", state: "done" },
    { id: "docs", label: "Documentos", state: app.status === "pending" ? "current" : "done" },
    { id: "kyc", label: "KYC / KYB", state: app.status === "pending" ? "current" : app.riskScore >= 80 ? "failed" : "done" },
    { id: "rules", label: "Reglas de decision", state: app.status === "pending" ? "current" : "done" },
    { id: "decision", label: "Decision final", state: app.status === "pending" ? "current" : app.status === "declined" ? "failed" : "done" },
  ] as const;
  let activeRules = rules
    .filter((rule) => rule.status === "active")
    .slice(0, 6)
    .map((rule) => {
      let result: RuleSeverity = "pass";
      const metricValue = metricByField[rule.field];
      if (metricValue !== undefined) {
        result = evaluateRuleResult(rule, metricValue, app.status);
      } else if (app.status === "manualReview" && (rule.severity === "warn" || (rule.field === "bureau.score" && bureauScoreEstimated < 700))) {
        result = "warn";
      }
      return { ...rule, result };
    });
  const fallbackField =
    (Object.entries(policyByField).find(([, value]) => value)?.[0] as CreditRuleRow["field"] | undefined) ??
    activeRules.find((rule) =>
      [
        "ratios.dti",
        "income.monthlyNet",
        "bureau.score",
        "credit.maxDaysPastDue",
        "credit.historyMonths",
      ].includes(rule.field),
    )?.field ??
    activeRules[0]?.field;
  if (fallbackField && app.status === "declined" && !activeRules.some((rule) => rule.result === "fail")) {
    activeRules = activeRules.map((rule) => (rule.field === fallbackField ? { ...rule, result: "fail" as RuleSeverity } : rule));
  }
  if (app.status === "manualReview" && !activeRules.some((rule) => rule.result === "warn" || rule.result === "fail")) {
    activeRules = activeRules.map((rule) => (rule.field === fallbackField ? { ...rule, result: "warn" as RuleSeverity } : rule));
  }
  if (app.status === "approved") {
    activeRules = activeRules.map((rule) => ({ ...rule, result: "pass" as RuleSeverity }));
  }
  if (app.status === "overridden" && !activeRules.some((rule) => rule.result === "fail")) {
    activeRules = activeRules.map((rule) => (rule.field === fallbackField ? { ...rule, result: "fail" as RuleSeverity } : rule));
  }
  const failedRuleRows = activeRules.filter((rule) => rule.result === "fail");
  const warnedRuleRows = activeRules.filter((rule) => rule.result === "warn");
  const failedRules = failedRuleRows.map((rule) => rule.name);
  const appRiskLevel = riskFromScore(app.riskScore);
  const hasHighRiskTrigger = bureauScoreEstimated <= 549 || maxDaysPastDue >= 90 || appRiskLevel === "high";
  const ruleResultLabel: Record<RuleSeverity, string> = {
    pass: "Aprobado",
    warn: "Revision",
    fail: "Rechazado",
  };
  const ruleSummaryLabel =
    app.status === "declined"
      ? "Rechazado"
      : app.status === "manualReview" || app.status === "pending"
        ? "Revision"
        : app.status === "overridden"
          ? "Aprobado con override"
          : "Aprobado";
  const ruleSummaryBadgeClass =
    app.status === "declined"
      ? "mdc-badge mdc-badge--bad"
      : app.status === "manualReview" || app.status === "pending"
        ? "mdc-badge mdc-badge--warn"
        : app.status === "overridden"
          ? "mdc-badge mdc-badge--info"
          : "mdc-badge mdc-badge--ok";

  const reasonFromRule = (rule: CreditRuleRow) => {
    if (rule.field === "income.monthlyNet") {
      return `Ingreso mensual estimado (${money(estimatedIncomeMonthly)}) por debajo del minimo requerido (${money(incomeMin)}).`;
    }
    if (rule.field === "ratios.dti") {
      if (rule.decisionBands?.rejectMin !== undefined && dti >= rule.decisionBands.rejectMin) {
        return `Relacion deuda/ingreso (DTI) en ${ratioLabel(dti)}, dentro del rango de rechazo automatico (>= ${ratioLabel(rule.decisionBands.rejectMin)}).`;
      }
      if (rule.decisionBands?.reviewMin !== undefined && rule.decisionBands?.reviewMax !== undefined) {
        return `Relacion deuda/ingreso (DTI) en ${ratioLabel(dti)}, dentro de la banda de revision (${ratioLabel(rule.decisionBands.reviewMin)} a ${ratioLabel(rule.decisionBands.reviewMax)}).`;
      }
      return `Relacion deuda/ingreso (DTI) en ${ratioLabel(dti)}, superior al limite permitido (${ratioLabel(dtiMax)}).`;
    }
    if (rule.field === "applicant.age") {
      return `Edad estimada del solicitante (${estimatedAge} anos) menor al minimo requerido (${ageMin} anos).`;
    }
    if (rule.field === "bureau.score") {
      return `Score de buro estimado (${bureauScoreEstimated}) por debajo del umbral requerido para ${app.product} (${bureauMin}).`;
    }
    if (rule.field === "credit.maxDaysPastDue") {
      return `Atraso maximo reciente de ${maxDaysPastDue} dias, excede el limite permitido (${maxDaysPastDueAllowed} dias).`;
    }
    if (rule.field === "credit.historyMonths") {
      return `Antiguedad de historial (${creditHistoryMonths} meses) por debajo del minimo recomendado (${historyMinMonths} meses).`;
    }
    if (rule.field === "employment.months") {
      return `Antiguedad laboral estimada (${employmentMonths} meses) por debajo del minimo requerido (${rule.value} meses).`;
    }
    return `${rule.name}: incumplimiento en ${ruleFieldLabel(rule.field)} (valor politica: ${rule.value}).`;
  };

  const declinedReasonsFromPolicy: string[] = [];
  if (estimatedIncomeMonthly < incomeMin) {
    declinedReasonsFromPolicy.push(
      `Ingreso mensual estimado (${money(estimatedIncomeMonthly)}) por debajo del minimo requerido (${money(incomeMin)}).`,
    );
  }
  if (dti > dtiMax) {
    declinedReasonsFromPolicy.push(
      `Relacion deuda/ingreso (DTI) en ${ratioLabel(dti)}, superior al limite permitido (${ratioLabel(dtiMax)}).`,
    );
  }
  if (rules.some((rule) => rule.field === "employment.months" && rule.status === "active") && employmentMonths < 6) {
    declinedReasonsFromPolicy.push(
      `Antiguedad laboral estimada (${employmentMonths} meses) por debajo del minimo requerido.`,
    );
  }
  if (hasCapacityPressure) {
    declinedReasonsFromPolicy.push(
      `La cuota mensual estimada (${money(monthlyEstimate)}) compromete la capacidad de pago frente al ingreso estimado.`,
    );
  }
  if (bureauScoreEstimated < bureauMin) {
    declinedReasonsFromPolicy.push(
      `Score de buro estimado (${bureauScoreEstimated}) por debajo del umbral requerido para ${app.product} (${bureauMin}).`,
    );
  }
  if (maxDaysPastDue > maxDaysPastDueAllowed) {
    declinedReasonsFromPolicy.push(
      `Atraso maximo reciente de ${maxDaysPastDue} dias, excede el limite permitido (${maxDaysPastDueAllowed} dias).`,
    );
  }
  if (creditHistoryMonths < historyMinMonths) {
    declinedReasonsFromPolicy.push(
      `Antiguedad de historial (${creditHistoryMonths} meses) por debajo del minimo recomendado (${historyMinMonths} meses).`,
    );
  }
  if (hasDocumentAlerts) {
    declinedReasonsFromPolicy.push("Inconsistencias documentales detectadas en validacion automatica (OCR/KYC).");
  }

  const decisionReason =
    app.status === "declined"
      ? failedRuleRows.length > 0
        ? `Rechazada por incumplimiento de politica: ${failedRuleRows.map(reasonFromRule).join(" ")}`
        : declinedReasonsFromPolicy.length > 0
          ? `Rechazada por politica de originacion: ${declinedReasonsFromPolicy.slice(0, 2).join(" ")}`
          : hasHighRiskTrigger
            ? `Rechazada por score de buro bajo (${bureauScoreEstimated}) y nivel de riesgo ${RISK_LABELS[appRiskLevel].toLowerCase()}.`
            : `Rechazada por validacion integral: se detectaron condiciones no elegibles en capacidad de pago y/o consistencia documental.`
      : app.status === "manualReview"
        ? warnedRuleRows.length > 0
          ? `En revision manual por alertas de politica: ${warnedRuleRows.map(reasonFromRule).slice(0, 2).join(" ")}`
          : hasDocumentAlerts
            ? "En revision manual por inconsistencias documentales detectadas en OCR/KYC."
            : `En revision manual por validaciones complementarias de capacidad de pago (score ${app.riskScore}).`
        : app.status === "overridden"
          ? failedRules.length > 0
            ? `Override aplicado por analista pese a: ${failedRules.join(", ")}. Requiere trazabilidad de aprobacion.`
            : `Override aplicado por criterio comercial y mitigantes de riesgo documentados.`
          : "";

  const runAction = (label: string) => {
    setFeedback(`${label} ejecutado · ${new Intl.DateTimeFormat("es-MX", { timeStyle: "short" }).format(new Date())}`);
  };

  const applyOverride = () => {
    if (!overrideReason.trim()) {
      setFeedback("Debe registrar una razon para override manual.");
      return;
    }
    setFeedback(`Override aplicado: ${STATUS_LABELS[overrideChoice]}. Queda registrado en Trazabilidad.`);
  };

  return (
    <div className="mdc-modal-backdrop" onClick={onClose}>
      <div className="mdc-modal mdc-modal--detail" onClick={(e) => e.stopPropagation()}>
        <header className="mdc-detail-head">
          <div className="mdc-detail-head__title">
            <button type="button" className="mdc-link-btn" onClick={onClose}>
              ← Volver a solicitudes
            </button>
            <div className="mdc-detail-head__line">
              <h3>Detalle de solicitud</h3>
              <span className={classForStatus(app.status)}>{STATUS_LABELS[app.status]}</span>
            </div>
            <p>
              {app.appNo} · {app.id.slice(0, 12)} · {shortDate(app.submittedAt)}
            </p>
          </div>
        </header>

        {feedback ? <p className="mdc-detail-feedback">{feedback}</p> : null}

        <div className="mdc-detail-progress">
          {stages.map((stage) => (
            <div key={stage.id} className="mdc-stage-card">
              <span className={`mdc-stage-dot mdc-stage-dot--${stage.state}`} />
              <strong>{stage.label}</strong>
              <em>{stage.state === "done" ? "Completado" : stage.state === "current" ? "En proceso" : "Con observacion"}</em>
            </div>
          ))}
        </div>

        <div className="mdc-detail-layout">
          <div className="mdc-detail-main">
            <section className="mdc-detail-card">
                <h4>{isMoralApplicant ? "Empresa solicitante" : "Solicitante"}</h4>
              <dl className="mdc-detail-dl">
                <div><dt>Nombre</dt><dd>{app.applicantName}</dd></div>
                <div><dt>Email</dt><dd>{app.applicantEmail}</dd></div>
                <div><dt>Fecha envio</dt><dd>{shortDate(app.submittedAt)}</dd></div>
                <div><dt>Score buró estimado</dt><dd>{bureauScoreEstimated} ({RISK_LABELS[appRiskLevel]})</dd></div>
                <div><dt>Indice interno de riesgo</dt><dd>{app.riskScore}/100</dd></div>
              </dl>
            </section>

            <section className="mdc-detail-card">
              <h4>Producto y condiciones</h4>
              <dl className="mdc-detail-dl">
                <div><dt>Producto</dt><dd>{app.product}</dd></div>
                <div><dt>Monto solicitado</dt><dd>{money(app.requestedAmount)}</dd></div>
                <div><dt>Tasa anual estimada</dt><dd>{interestRate.toFixed(1)}%</dd></div>
                <div><dt>Plazo</dt><dd>{termMonths} meses</dd></div>
                <div><dt>Enganche</dt><dd>{money(downPayment)}</dd></div>
                <div><dt>Cuota mensual estimada</dt><dd>{money(monthlyEstimate)}</dd></div>
              </dl>
            </section>

            <section className="mdc-detail-card">
              <div className="mdc-detail-card__head">
                <h4>Validacion documental</h4>
                <span className="mdc-badge mdc-badge--neutral">OCR + reglas</span>
              </div>
              <div className="mdc-table-wrap">
                <table className="mdc-table mdc-table--detail">
                  <thead>
                    <tr>
                      <th>No. Documento</th>
                      <th>Archivo</th>
                      <th>Auto</th>
                      <th>Manual</th>
                      <th>OCR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((doc) => (
                      <tr key={doc.type}>
                        <td>{doc.type}</td>
                        <td>{doc.file}</td>
                        <td>
                          <span className={doc.automated === "Aprobada" ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--warn"}>
                            {doc.automated}
                          </span>
                        </td>
                        <td><span className="mdc-badge mdc-badge--neutral">{doc.manual}</span></td>
                        <td>{doc.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mdc-detail-card">
              <div className="mdc-detail-card__head">
                <h4>Desglose de reglas</h4>
                <span className={ruleSummaryBadgeClass}>
                  {ruleSummaryLabel}
                </span>
              </div>
              <div className="mdc-detail-rule-list">
                {activeRules.map((rule) => (
                  <article key={rule.id} className="mdc-detail-rule">
                    <div>
                      <strong>{rule.name}</strong>
                      <p>{rule.description}</p>
                    </div>
                    <span className={rule.result === "pass" ? "mdc-badge mdc-badge--ok" : rule.result === "warn" ? "mdc-badge mdc-badge--warn" : "mdc-badge mdc-badge--bad"}>
                      {ruleResultLabel[rule.result]}
                    </span>
                  </article>
                ))}
              </div>
            </section>

            {app.status === "approved" && (
              <ApprovedCrossSellPanel app={app} creditStore={creditStore} />
            )}
          </div>

          <aside className="mdc-detail-side">
            <section className="mdc-detail-card">
              <h4>Resumen del motor</h4>
              <div className="mdc-detail-score-grid">
                <div>
                  <span>Score Buró</span>
                  <strong>{bureauScoreEstimated}</strong>
                </div>
                <div>
                  <span>Indice de riesgo</span>
                  <strong>{app.riskScore}/100</strong>
                </div>
                <div>
                  <span>Fraud score</span>
                  <strong>{fraudScore}</strong>
                </div>
                <div>
                  <span>DTI estimado</span>
                  <strong>{ratioLabel(dti)}</strong>
                </div>
              </div>
              <div className="mdc-score-track" aria-hidden>
                <span style={{ width: `${Math.min(100, Math.round(app.riskScore))}%` }} />
              </div>
              {decisionReason ? (
                <div className="mdc-detail-decision-reason">
                  <strong>Motivo de decision</strong>
                  <p>{decisionReason}</p>
                </div>
              ) : null}
            </section>

            <section className="mdc-detail-card">
              <h4>KYC / KYB</h4>
              <dl className="mdc-detail-dl">
                <div><dt>Identidad</dt><dd><span className={kycIdentity === "Aprobada" ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--warn"}>{kycIdentity}</span></dd></div>
                <div><dt>Domicilio</dt><dd><span className={kycAddress === "Aprobada" ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--warn"}>{kycAddress}</span></dd></div>
                <div><dt>Listas</dt><dd><span className={kycWatchlist === "Sin alertas" ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--bad"}>{kycWatchlist}</span></dd></div>
              </dl>
            </section>

            <section className="mdc-detail-card">
              <h4>Override manual</h4>
              <label className="mdc-detail-field">
                <span>Nueva decision</span>
                <select value={overrideChoice} onChange={(e) => setOverrideChoice(e.target.value as ApplicationStatus)}>
                  <option value="approved">Aprobada</option>
                  <option value="declined">Rechazada</option>
                  <option value="manualReview">Revision manual</option>
                  <option value="overridden">Override</option>
                </select>
              </label>
              <label className="mdc-detail-field">
                <span>Razon</span>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Justificacion obligatoria para override"
                />
              </label>
              <button type="button" className="mdc-btn mdc-btn--primary" onClick={applyOverride}>
                Aplicar override
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function AddApplicationModal({
  open,
  onClose,
  onCreate,
  mode,
  products,
}: {
  open: boolean;
  onClose: () => void;
  mode: MdcApplicantMode;
  products: readonly RuleProduct[];
  onCreate: (values: { firstName: string; lastName: string; email: string; product: string; amount: number }) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState<string>(products[0] ?? NATURAL_CREDIT_PRODUCTS[0]);
  const [amount, setAmount] = useState("12000");
  const isMoral = mode === "moral";

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setProduct(products[0] ?? NATURAL_CREDIT_PRODUCTS[0]);
    setAmount("12000");
  };

  useEffect(() => {
    setProduct(products[0] ?? NATURAL_CREDIT_PRODUCTS[0]);
  }, [products]);

  if (!open) return null;

  return (
    <div className="mdc-modal-backdrop" onClick={() => { reset(); onClose(); }}>
      <div className="mdc-modal" onClick={(e) => e.stopPropagation()}>
        <header className="mdc-modal-head">
          <div>
            <p>Nueva solicitud</p>
            <h3>Alta manual</h3>
          </div>
          <button type="button" className="mdc-icon-btn" onClick={() => { reset(); onClose(); }}>×</button>
        </header>
        <div className="mdc-form-grid">
          <label>
            <span>{isMoral ? "Razon social" : "Nombre"}</span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          {!isMoral ? (
            <label>
              <span>Apellido</span>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
          ) : (
            <label>
              <span>RFC empresa</span>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="AAA010101AAA" />
            </label>
          )}
          <label>
            <span>{isMoral ? "Correo corporativo" : "Email"}</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <label>
            <span>Producto</span>
            <select value={product} onChange={(e) => setProduct(e.target.value)}>
              {products.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Monto</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min={0} />
          </label>
        </div>
        <footer className="mdc-modal-actions">
          <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => { reset(); onClose(); }}>Cancelar</button>
          <button
            type="button"
            className="mdc-btn mdc-btn--primary"
            onClick={() => {
              onCreate({
                firstName,
                lastName,
                email,
                product,
                amount: Number(amount) || 0,
              });
              reset();
              onClose();
            }}
          >
            Crear solicitud
          </button>
        </footer>
      </div>
    </div>
  );
}

function RuleModal({
  open,
  onClose,
  initial,
  availableFields,
  isEditing,
  products,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: RuleFormState;
  availableFields: { value: string; label: string }[];
  isEditing: boolean;
  products: readonly RuleProduct[];
  onSave: (form: RuleFormState, duplicateToProduct?: RuleProduct) => void;
}) {
  const [form, setForm] = useState<RuleFormState>(() => initial);
  const [duplicateToProduct, setDuplicateToProduct] = useState<"" | RuleProduct>("");
  const duplicateOptions = products.filter(
    (product) => product !== form.product && PRODUCT_RULE_FIELDS[product].includes(form.field),
  ) as RuleProduct[];
  const isBandMode = form.evaluationMode === "bands";

  if (!open) return null;

  return (
    <div className="mdc-modal-backdrop" onClick={onClose}>
      <div className="mdc-modal" onClick={(e) => e.stopPropagation()}>
        <header className="mdc-modal-head">
          <div>
            <p>Regla de credito</p>
            <h3>{initial.name ? "Editar regla" : "Nueva regla"}</h3>
          </div>
          <button type="button" className="mdc-icon-btn" onClick={onClose}>×</button>
        </header>
        <div className="mdc-form-grid">
          <label>
            <span>Nombre</span>
            <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          </label>
          <label>
            <span>Producto</span>
            <input value={form.product} disabled />
          </label>
          {isEditing && (
            <label>
              <span>Copiar regla a</span>
              <select value={duplicateToProduct} onChange={(e) => setDuplicateToProduct(e.target.value as "" | RuleProduct)}>
                <option value="">No copiar</option>
                {duplicateOptions.map((product) => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span>Campo</span>
            <select value={form.field} onChange={(e) => setForm((s) => ({ ...s, field: e.target.value }))}>
              <option value="">Selecciona variable</option>
              {availableFields.map((field) => (
                <option key={field.value} value={field.value}>{field.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Modo de evaluacion</span>
            <select
              value={form.evaluationMode}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  evaluationMode: e.target.value as "single" | "bands",
                }))
              }
            >
              <option value="single">Umbral unico</option>
              <option value="bands">Por bandas</option>
            </select>
          </label>
          {isBandMode ? (
            <>
              <label>
                <span>Aprobacion desde</span>
                <input value={form.approveMin} onChange={(e) => setForm((s) => ({ ...s, approveMin: e.target.value }))} type="number" step="0.01" />
              </label>
              <label>
                <span>Aprobacion hasta</span>
                <input value={form.approveMax} onChange={(e) => setForm((s) => ({ ...s, approveMax: e.target.value }))} type="number" step="0.01" />
              </label>
              <label>
                <span>Revision desde</span>
                <input value={form.reviewMin} onChange={(e) => setForm((s) => ({ ...s, reviewMin: e.target.value }))} type="number" step="0.01" />
              </label>
              <label>
                <span>Revision hasta</span>
                <input value={form.reviewMax} onChange={(e) => setForm((s) => ({ ...s, reviewMax: e.target.value }))} type="number" step="0.01" />
              </label>
              <label>
                <span>Rechazo desde</span>
                <input value={form.rejectMin} onChange={(e) => setForm((s) => ({ ...s, rejectMin: e.target.value }))} type="number" step="0.01" />
              </label>
              <label>
                <span>Rechazo hasta</span>
                <input value={form.rejectMax} onChange={(e) => setForm((s) => ({ ...s, rejectMax: e.target.value }))} type="number" step="0.01" />
              </label>
            </>
          ) : (
            <>
          <label>
            <span>Operador</span>
            <select value={form.operator} onChange={(e) => setForm((s) => ({ ...s, operator: e.target.value as RuleOperator }))}>
              {RULE_OPERATORS.map((operator) => (
                <option key={operator} value={operator}>{RULE_OPERATOR_LABELS[operator]}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Valor</span>
            <input value={form.value} onChange={(e) => setForm((s) => ({ ...s, value: e.target.value }))} />
          </label>
            </>
          )}
          <label>
            <span>Tipo</span>
            <select value={form.dataType} onChange={(e) => setForm((s) => ({ ...s, dataType: e.target.value as RuleDataType }))}>
              {RULE_TYPES.map((type) => (
                <option key={type} value={type}>{RULE_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </label>
          {isBandMode ? (
            <label>
              <span>Severidad base</span>
              <input value="Definida por bandas" disabled />
            </label>
          ) : (
            <label>
              <span>Severidad</span>
              <select value={form.severity} onChange={(e) => setForm((s) => ({ ...s, severity: e.target.value as RuleSeverity }))}>
                {RULE_SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>{RULE_SEVERITY_LABELS[severity]}</option>
                ))}
              </select>
            </label>
          )}
          <label className="mdc-form-grid__full">
            <span>Descripcion</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
          </label>
          <label>
            <span>Estado</span>
            <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as "active" | "inactive" }))}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
        </div>
        <footer className="mdc-modal-actions">
          <button type="button" className="mdc-btn mdc-btn--ghost" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="mdc-btn mdc-btn--primary"
            onClick={() => {
              onSave(form, duplicateToProduct || undefined);
              onClose();
            }}
          >
            Guardar
          </button>
        </footer>
      </div>
    </div>
  );
}

export function MdcScreen() {
  const router = useRouter();
  const creditStore = useCreditDemoStore();
  const [applicantMode, setApplicantMode] = useState<MdcApplicantMode>("natural");
  const [activeTab, setActiveTab] = useState<MdcTab>("overview");
  const activeProducts = useMemo(() => CREDIT_PRODUCTS_BY_MODE[applicantMode] as readonly RuleProduct[], [applicantMode]);
  const activeStorageKeys = MODE_STORAGE_KEYS[applicantMode];
  const defaultApplications = useMemo(() => APPLICATIONS_BY_MODE[applicantMode], [applicantMode]);
  const defaultRules = useMemo(() => CREDIT_RULES_BY_MODE[applicantMode], [applicantMode]);
  const [apps, setApps] = useState<Application[]>(() =>
    hydrateApplications(
      "natural",
      mergeApplicationsWithDefaults(
        reconcileMockTimeline(
          "natural",
          readStoredJson<Application[]>(MODE_STORAGE_KEYS.natural.applications, []),
          APPLICATIONS_BY_MODE.natural,
        ),
        APPLICATIONS_BY_MODE.natural,
      ),
    ),
  );
  const [rules, setRules] = useState<CreditRuleRow[]>(() =>
    mergeRulesWithDefaults(
      readStoredJson<CreditRuleRow[]>(MODE_STORAGE_KEYS.natural.rules, CREDIT_RULES_BY_MODE.natural),
      CREDIT_PRODUCTS_BY_MODE.natural as readonly RuleProduct[],
      CREDIT_RULES_BY_MODE.natural,
    ),
  );

  const [showAddApplication, setShowAddApplication] = useState(false);
  const [detailApp, setDetailApp] = useState<Application | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [productFilter, setProductFilter] = useState<string | "all">("all");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [page, setPage] = useState(0);

  const [ruleQuery, setRuleQuery] = useState("");
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleModalState, setRuleModalState] = useState<RuleFormState>(defaultRuleForm(CREDIT_PRODUCTS_BY_MODE.natural as readonly RuleProduct[]));
  const [ruleProductFilter, setRuleProductFilter] = useState<RuleProduct>((CREDIT_PRODUCTS_BY_MODE.natural[0] ?? NATURAL_CREDIT_PRODUCTS[0]) as RuleProduct);
  const [rangeFilter, setRangeFilter] = useState<RangePreset>("7d");
  const normalizedRules = useMemo(
    () => mergeRulesWithDefaults(rules, activeProducts, defaultRules),
    [activeProducts, defaultRules, rules],
  );

  useEffect(() => {
    seedScotiaCreditStorage();
  }, []);

  useEffect(() => {
    const nextApps = hydrateApplications(
      applicantMode,
      mergeApplicationsWithDefaults(
        reconcileMockTimeline(
          applicantMode,
          readStoredJson<Application[]>(activeStorageKeys.applications, []),
          defaultApplications,
        ),
        defaultApplications,
      ),
    );
    setApps(nextApps);
    const nextRules = mergeRulesWithDefaults(
      readStoredJson<CreditRuleRow[]>(activeStorageKeys.rules, defaultRules),
      activeProducts,
      defaultRules,
    );
    setRules(nextRules);
    setProductFilter("all");
    setStatusFilter("all");
    setRiskFilter("all");
    setSearch("");
    setRuleQuery("");
    setPage(0);
    setRuleProductFilter((activeProducts[0] ?? NATURAL_CREDIT_PRODUCTS[0]) as RuleProduct);
    setRuleModalState(defaultRuleForm(activeProducts));
    setDetailApp(null);
  }, [activeProducts, activeStorageKeys.applications, activeStorageKeys.rules, applicantMode, defaultApplications, defaultRules]);

  useEffect(() => {
    writeStoredJson(activeStorageKeys.applications, apps);
  }, [activeStorageKeys.applications, apps]);

  useEffect(() => {
    writeStoredJson(activeStorageKeys.rules, normalizedRules);
  }, [activeStorageKeys.rules, normalizedRules]);

  useEffect(() => {
    const closeOpenRowMenus = () => {
      document.querySelectorAll<HTMLDetailsElement>(".mdc-row-menu[open]").forEach((menu) => {
        menu.open = false;
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".mdc-row-menu")) return;
      closeOpenRowMenus();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeOpenRowMenus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const rangeDays = RANGE_DAYS[rangeFilter];

  const { rangeScopedApps, previousRangeApps, applicationsTrendPoints } = useMemo(() => {
    const currentWindow = rangeWindow(apps, rangeDays);
    if (!currentWindow) {
      return {
        rangeScopedApps: [] as Application[],
        previousRangeApps: [] as Application[],
        applicationsTrendPoints: [] as { label: string; value: number }[],
      };
    }

    const currentRows = apps.filter((app) =>
      isWithinRange(app.submittedAt, currentWindow.startMs, currentWindow.endMs),
    );
    const previousStart = currentWindow.startMs - rangeDays * DAY_MS;
    const previousEnd = currentWindow.startMs - 1;
    const previousRows = apps.filter((app) => isWithinRange(app.submittedAt, previousStart, previousEnd));

    const pointsByDay = new Map<number, number>();
    for (const app of currentRows) {
      const dayMs = utcDayStartMs(app.submittedAt);
      pointsByDay.set(dayMs, (pointsByDay.get(dayMs) ?? 0) + 1);
    }

    const points = Array.from({ length: rangeDays }, (_, index) => {
      const dayMs = currentWindow.startMs + index * DAY_MS;
      return {
        label: chartDayLabel(new Date(dayMs)),
        value: pointsByDay.get(dayMs) ?? 0,
      };
    });

    return {
      rangeScopedApps: currentRows,
      previousRangeApps: previousRows,
      applicationsTrendPoints: points,
    };
  }, [apps, rangeDays]);

  const overview = useMemo(() => {
    const total = rangeScopedApps.length;
    const approved = rangeScopedApps.filter((a) => a.status === "approved").length;
    const declined = rangeScopedApps.filter((a) => a.status === "declined").length;
    const manualOrPending = rangeScopedApps.filter((a) => a.status === "pending" || a.status === "manualReview").length;
    const avgAmount = total > 0 ? rangeScopedApps.reduce((sum, a) => sum + a.requestedAmount, 0) / total : 0;

    const previousTotal = previousRangeApps.length;
    const previousApproved = previousRangeApps.filter((a) => a.status === "approved").length;
    const previousDeclined = previousRangeApps.filter((a) => a.status === "declined").length;
    const previousAvgAmount =
      previousTotal > 0 ? previousRangeApps.reduce((sum, a) => sum + a.requestedAmount, 0) / previousTotal : 0;
    const approvedPct = approved / Math.max(total, 1);
    const declinedPct = declined / Math.max(total, 1);
    const previousApprovedPct = previousApproved / Math.max(previousTotal, 1);
    const previousDeclinedPct = previousDeclined / Math.max(previousTotal, 1);

    const approvalRatio = [
      { label: "Aprobadas automaticas", value: approved, color: "#0f766e" },
      { label: "Rechazadas por politica", value: declined, color: "#b91c1c" },
      { label: "En revision manual", value: manualOrPending, color: "#334155" },
    ];

    const lowTarget = rangeScopedApps.filter((a) => riskFromApplicationStatus(a.status, a.riskScore) === "low").length;
    const mediumTarget = rangeScopedApps.filter((a) => riskFromApplicationStatus(a.status, a.riskScore) === "medium").length;
    const highTarget = rangeScopedApps.filter((a) => riskFromApplicationStatus(a.status, a.riskScore) === "high").length;

    const riskDistribution = [
      { label: "Perfil conservador", value: lowTarget, color: "#0f766e" },
      { label: "Perfil moderado", value: mediumTarget, color: "#1d4ed8" },
      { label: "Perfil expuesto", value: highTarget, color: "#b91c1c" },
    ];

    const recent = [...rangeScopedApps]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 8);

    return {
      total,
      approved,
      declined,
      approvedPct,
      declinedPct,
      avgAmount,
      approvalRatio,
      riskDistribution,
      recent,
      deltas: {
        total: pctDelta(total, previousTotal),
        approvedPct: pctDelta(approvedPct, previousApprovedPct),
        declinedPct: pctDelta(declinedPct, previousDeclinedPct),
        avgAmount: pctDelta(avgAmount, previousAvgAmount),
      },
    };
  }, [previousRangeApps, rangeScopedApps]);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rangeScopedApps.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (productFilter !== "all" && app.product !== productFilter) return false;
      if (riskFilter !== "all" && riskFromApplicationStatus(app.status, app.riskScore) !== riskFilter) return false;
      if (!q) return true;
      const blob = `${app.appNo} ${app.applicantName} ${app.applicantEmail} ${app.product}`.toLowerCase();
      return blob.includes(q);
    });
  }, [productFilter, rangeScopedApps, riskFilter, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredApps.length / PAGE_SIZE));
  const paginatedApps = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredApps.slice(start, start + PAGE_SIZE);
  }, [filteredApps, page]);

  const filteredRules = useMemo(() => {
    const q = ruleQuery.trim().toLowerCase();
    const scopedRules = normalizedRules.filter((rule) => rule.products.includes(ruleProductFilter));
    if (!q) return scopedRules;
    return scopedRules.filter((r) => `${r.name} ${r.field} ${r.description}`.toLowerCase().includes(q));
  }, [normalizedRules, ruleProductFilter, ruleQuery]);

  const openKybForApplication = (application: Application, rfc?: string | null) => {
    activateKybCompanyContext(
      {
        id: application.id,
        appNo: application.appNo,
        applicantName: application.applicantName,
        applicantEmail: application.applicantEmail,
        product: application.product,
        requestedAmount: application.requestedAmount,
        riskScore: application.riskScore,
        status: application.status,
      },
      { rfc },
    );
    router.push("/kyb");
  };

  const ruleFieldOptions = useMemo(() => getRuleFieldsForProduct(ruleProductFilter), [ruleProductFilter]);
  const activeTraceability = useMemo<MdcTraceabilityEntry[]>(
    () => (applicantMode === "moral" ? MORAL_TRACEABILITY : (creditStore.state.auditLog as MdcTraceabilityEntry[])),
    [applicantMode, creditStore.state.auditLog],
  );

  const openCreateRule = () => {
    setEditingRuleId(null);
    setRuleModalState({
      ...defaultRuleForm(activeProducts),
      product: ruleProductFilter,
      field: PRODUCT_RULE_FIELDS[ruleProductFilter][0] ?? "",
    });
    setShowRuleModal(true);
  };

  const openEditRule = (rule: CreditRuleRow) => {
    const activeProduct = rule.products.includes(ruleProductFilter) ? ruleProductFilter : rule.products[0] ?? ruleProductFilter;
    setRuleProductFilter(activeProduct);
    setEditingRuleId(rule.id);
    setRuleModalState(ruleToFormState(rule, activeProduct));
    setShowRuleModal(true);
  };

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner mdc-root">
          <header className="mdc-header">
            <div className="mdc-header__row">
              <div>
              <p className="mdc-header__eyebrow">Core Module</p>
              <h1>{MODE_COPY[applicantMode].title}</h1>
                <p className="mdc-header__sub">{MODE_COPY[applicantMode].subtitle}</p>
                <div className="mdc-persona-switch" role="tablist" aria-label="Tipo de solicitante">
                  {PERSONA_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`mdc-persona-switch__btn${applicantMode === option.id ? " mdc-persona-switch__btn--active" : ""}`}
                      onClick={() => setApplicantMode(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mdc-header__date">
                <label htmlFor="mdc-range">Rango</label>
                <select
                  id="mdc-range"
                  value={rangeFilter}
                  onChange={(e) => {
                    setRangeFilter(e.target.value as RangePreset);
                    setPage(0);
                  }}
                >
                  <option value="7d">Ultimos 7 dias</option>
                  <option value="30d">Ultimos 30 dias</option>
                  <option value="90d">Ultimos 90 dias</option>
                </select>
              </div>
            </div>
          </header>

          <div className="mdc-tabs" role="tablist" aria-label="MDC tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`mdc-tab${activeTab === tab.id ? " mdc-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <section className="mdc-section">
              <div className="mdc-kpis">
                <MdcStatCard
                  title="Solicitudes totales"
                  value={String(overview.total)}
                  deltaPct={overview.deltas.total}
                  positive={overview.deltas.total >= 0}
                  comparisonLabel="vs periodo anterior"
                />
                <MdcStatCard
                  title="Porcentaje de aprobacion"
                  value={ratioLabel(overview.approvedPct)}
                  deltaPct={overview.deltas.approvedPct}
                  positive={overview.deltas.approvedPct >= 0}
                  comparisonLabel="vs periodo anterior"
                />
                <MdcStatCard
                  title="Porcentaje de rechazo"
                  value={ratioLabel(overview.declinedPct)}
                  deltaPct={overview.deltas.declinedPct}
                  positive={overview.deltas.declinedPct >= 0}
                  comparisonLabel="vs periodo anterior"
                />
                <MdcStatCard
                  title="Monto promedio solicitado / aprobado"
                  value={money(overview.avgAmount)}
                  deltaPct={overview.deltas.avgAmount}
                  positive={overview.deltas.avgAmount >= 0}
                  comparisonLabel="vs periodo anterior"
                />
              </div>

              <article className="mdc-card">
                <div className="mdc-card__head">
                  <h3>Solicitudes por dia</h3>
                  <p>Tendencia de ingreso al motor segun rango seleccionado</p>
                </div>
                <LineChart points={applicationsTrendPoints} />
              </article>

              <div className="mdc-grid-2">
                <article className="mdc-card">
                  <div className="mdc-card__head">
                    <h3>Ratio de decision</h3>
                    <p>Distribucion por estado principal</p>
                  </div>
                  <SegmentedBar data={overview.approvalRatio} />
                </article>
                <article className="mdc-card">
                  <div className="mdc-card__head">
                    <h3>Distribucion de riesgo</h3>
                    <p>Bajo, medio y alto</p>
                  </div>
                  <DonutChart data={overview.riskDistribution} />
                </article>
              </div>

              <article className="mdc-card mdc-card--tight">
                <div className="mdc-card__head mdc-card__head--row mdc-recent-head">
                  <h3>{MODE_COPY[applicantMode].recentTitle}</h3>
                  <button type="button" className="mdc-link-btn" onClick={() => setActiveTab("applications")}>
                    Ver todas
                  </button>
                </div>
                <div className="mdc-table-wrap">
                  <table className="mdc-table mdc-table--rules">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Solicitante</th>
                        <th>Producto</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Riesgo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.recent.length === 0 ? (
                        <tr>
                          <td colSpan={6}>Sin solicitudes en el rango seleccionado.</td>
                        </tr>
                      ) : (
                        overview.recent.map((app) => (
                          <tr key={app.id}>
                            <td>{app.appNo}</td>
                            <td>{app.applicantName}</td>
                            <td>{app.product}</td>
                            <td>{money(app.requestedAmount)}</td>
                            <td><span className={classForStatus(app.status)}>{STATUS_LABELS[app.status]}</span></td>
                            <td>
                              <span className={classForRisk(riskFromApplicationStatus(app.status, app.riskScore))}>
                                {RISK_LABELS[riskFromApplicationStatus(app.status, app.riskScore)]}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          )}

          {activeTab === "products" && (
            <MdcProductsTab
              mode={applicantMode}
              storageKey={activeStorageKeys.products}
              initialProducts={MDC_PRODUCTS_BY_MODE[applicantMode]}
              title={applicantMode === "moral" ? "Productos empresariales" : "Productos"}
              subtitle={
                applicantMode === "moral"
                  ? "Configuracion de lineas y productos para originacion de persona moral."
                  : "Gestion de productos y performance del portafolio."
              }
            />
          )}

          {activeTab === "applications" && (
            <section className="mdc-section">
              <article className="mdc-card">
                <div className="mdc-app-top">
                  <div className="mdc-card__head mdc-card__head--row">
                    <div>
                      <h3>Solicitudes</h3>
                      <p>Gestion y seguimiento del pipeline</p>
                    </div>
                    <button type="button" className="mdc-btn mdc-btn--primary" onClick={() => setShowAddApplication(true)}>
                      Agregar solicitud
                    </button>
                  </div>
                </div>

                <div className="mdc-filters">
                  <label>
                    <span>Buscar</span>
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                      }}
                      placeholder="APP, cliente, email"
                    />
                  </label>
                  <label>
                    <span>Estado</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value as ApplicationStatus | "all");
                        setPage(0);
                      }}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status === "all" ? "Todos" : STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Producto</span>
                    <select
                      value={productFilter}
                      onChange={(e) => {
                        setProductFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <option value="all">Todos</option>
                      {activeProducts.map((product) => (
                        <option key={product} value={product}>{product}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Riesgo</span>
                    <select
                      value={riskFilter}
                      onChange={(e) => {
                        setRiskFilter(e.target.value as RiskLevel | "all");
                        setPage(0);
                      }}
                    >
                      {RISK_OPTIONS.map((risk) => (
                        <option key={risk} value={risk}>
                          {risk === "all" ? "Todos" : RISK_LABELS[risk]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="mdc-date-hint">
                  La fecha se toma del rango global del tablero para filtrar resultados de solicitudes ({rangeDays} dias).
                </p>

                <div className="mdc-table-wrap">
                  <table className="mdc-table mdc-table--rules">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Solicitante</th>
                        <th>Email</th>
                        <th>Producto</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Riesgo</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedApps.length === 0 ? (
                        <tr>
                          <td colSpan={9}>Sin resultados para los filtros seleccionados.</td>
                        </tr>
                      ) : (
                        paginatedApps.map((app) => (
                          <tr key={app.id}>
                            <td>{app.appNo}</td>
                            <td>{app.applicantName}</td>
                            <td>{app.applicantEmail}</td>
                            <td>{app.product}</td>
                            <td>{money(app.requestedAmount)}</td>
                            <td><span className={classForStatus(app.status)}>{STATUS_LABELS[app.status]}</span></td>
                            <td>
                              <span className={classForRisk(riskFromApplicationStatus(app.status, app.riskScore))}>
                                {RISK_LABELS[riskFromApplicationStatus(app.status, app.riskScore)]} · {normalizeRiskScoreForStatus(app.status, app.riskScore)}
                              </span>
                            </td>
                            <td>{shortDate(app.submittedAt)}</td>
                            <td>
                              <div className="mdc-actions">
                                <button
                                  type="button"
                                  className="mdc-btn mdc-btn--xs mdc-btn--icon"
                                  onClick={() => setDetailApp(app)}
                                  aria-label={`Ver detalle de ${app.appNo}`}
                                  title="Ver detalle"
                                >
                                  <Eye size={14} aria-hidden />
                                </button>
                                <details className="mdc-row-menu">
                                  <summary
                                    className="mdc-row-menu__summary-icon"
                                    aria-label={`Opciones de ${app.appNo}`}
                                    title="Opciones"
                                  >
                                    <Settings size={14} aria-hidden />
                                  </summary>
                                  <div className="mdc-row-menu__items">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setApps((current) =>
                                          current.map((row) =>
                                            row.id === app.id
                                              ? {
                                                  ...row,
                                                  status: statusFromScore(row.riskScore),
                                                  riskScore: normalizeRiskScoreForStatus(statusFromScore(row.riskScore), row.riskScore),
                                                  risk: riskFromApplicationStatus(statusFromScore(row.riskScore), row.riskScore),
                                                }
                                              : row,
                                          ),
                                        );
                                      }}
                                    >
                                      Ejecutar evaluacion
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setApps((current) =>
                                          current.map((row) =>
                                            row.id === app.id
                                              ? {
                                                  ...row,
                                                  status: "pending",
                                                  riskScore: normalizeRiskScoreForStatus("pending", row.riskScore),
                                                  risk: riskFromApplicationStatus("pending", row.riskScore),
                                                }
                                              : row,
                                          ),
                                        );
                                      }}
                                    >
                                      Reenviar onboarding
                                    </button>
                                    {applicantMode === "moral" && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          openKybForApplication(app);
                                        }}
                                      >
                                        KYB editar
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="mdc-row-menu__danger"
                                      onClick={() => {
                                        setApps((current) => current.filter((row) => row.id !== app.id));
                                      }}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </details>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mdc-pagination">
                  <p>
                    Mostrando {filteredApps.length === 0 ? 0 : page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, filteredApps.length)} de {filteredApps.length}
                  </p>
                  <div>
                    <button
                      type="button"
                      className="mdc-btn mdc-btn--ghost"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className="mdc-btn mdc-btn--ghost"
                      onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                      disabled={page >= pageCount - 1}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </article>
            </section>
          )}

          {activeTab === "rules" && (
            <section className="mdc-section">
              <article className="mdc-card">
                <div className="mdc-card__head mdc-card__head--row">
                  <div>
                    <h3>Reglas y thresholds</h3>
                    <p>Configuracion operativa del motor MDC</p>
                  </div>
                  <button type="button" className="mdc-btn mdc-btn--primary" onClick={openCreateRule}>
                    Agregar regla
                  </button>
                </div>

                <div className="mdc-filters mdc-filters--single">
                  <label>
                    <span>Producto activo</span>
                    <select
                      value={ruleProductFilter}
                      onChange={(e) => setRuleProductFilter(e.target.value as RuleProduct)}
                    >
                      {activeProducts.map((product) => (
                        <option key={product} value={product}>{product}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Buscar regla</span>
                    <input
                      value={ruleQuery}
                      onChange={(e) => setRuleQuery(e.target.value)}
                      placeholder="nombre, campo o descripcion"
                    />
                  </label>
                </div>

                <div className="mdc-table-wrap">
                  <table className="mdc-table mdc-table--rules">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Operador</th>
                        <th>Valor</th>
                        <th>Tipo</th>
                        <th>Severidad</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRules.map((rule) => (
                        <tr key={rule.id}>
                          <td>{rule.name}</td>
                          <td>{rule.description}</td>
                          <td>{renderRuleOperator(rule)}</td>
                          <td>{renderRuleValue(rule)}</td>
                          <td>{RULE_TYPE_LABELS[rule.dataType]}</td>
                          <td>{renderRuleSeverity(rule)}</td>
                          <td>
                            <span className={rule.status === "active" ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--neutral"}>
                              {rule.status === "active" ? "Activa" : "Inactiva"}
                            </span>
                          </td>
                          <td>
                            <details className="mdc-row-menu">
                              <summary className="mdc-row-menu__summary-dots">...</summary>
                              <div className="mdc-row-menu__items">
                                <button type="button" onClick={() => openEditRule(rule)}>
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRules((current) =>
                                      current.map((item) =>
                                        item.id === rule.id ? { ...item, status: item.status === "active" ? "inactive" : "active" } : item,
                                      ),
                                    );
                                  }}
                                >
                                  {rule.status === "active" ? "Desactivar" : "Activar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const duplicated: CreditRuleRow = {
                                      ...rule,
                                      id: `cr-local-${Date.now()}`,
                                      name: `${rule.name} (copia)`,
                                      createdAt: new Date().toISOString(),
                                    };
                                    setRules((current) => [...current, duplicated]);
                                  }}
                                >
                                  Duplicar
                                </button>
                                <button
                                  type="button"
                                  className="mdc-row-menu__danger"
                                  onClick={() => {
                                    setRules((current) => current.filter((item) => item.id !== rule.id));
                                  }}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          )}

          {activeTab === "traceability" && (
            <section className="mdc-section">
              <article className="mdc-card">
                <div className="mdc-card__head">
                  <h3>Trazabilidad</h3>
                  <p>Reglas, IA, cross-sell y fijaciones.</p>
                </div>
                <div className="mdc-table-wrap">
                  <table className="mdc-table mdc-table--traceability">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Acción</th>
                        <th>Detalle</th>
                        <th>Canal</th>
                        <th>Usuario</th>
                        <th>Correlación</th>
                        <th>Tasa antes</th>
                        <th>Tasa después</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTraceability.map((entry) => (
                        <tr key={entry.id}>
                          <td className="mdc-traceability__date">{shortDate(entry.timestamp)}</td>
                          <td>
                            <span className="mdc-badge mdc-badge--info">{entry.action}</span>
                          </td>
                          <td className="mdc-traceability__detail">{entry.details || "—"}</td>
                          <td>{entry.channel}</td>
                          <td>{entry.user}</td>
                          <td className="mdc-traceability__correlation">{entry.correlationId}</td>
                          <td>{entry.rateBefore !== undefined ? formatPctCredit(entry.rateBefore) : "—"}</td>
                          <td>{entry.rateAfter !== undefined ? formatPctCredit(entry.rateAfter) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          )}

          {activeTab === "payments" && (
            <MdcPaymentsTab
              mode={applicantMode}
              sessions={applicantMode === "moral" ? MORAL_SESSIONS : NATURAL_SESSIONS}
              range={rangeFilter}
              onRangeChange={(nextRange) => {
                setRangeFilter(nextRange as RangePreset);
                setPage(0);
              }}
            />
          )}
          {activeTab === "collections" && (
            <MdcCollectionsTab mode={applicantMode} cases={applicantMode === "moral" ? MORAL_CASES : NATURAL_CASES} />
          )}
          {activeTab === "configuration" && <MdcConfigurationTab />}
        </div>
      </div>

      <AddApplicationModal
        open={showAddApplication}
        onClose={() => setShowAddApplication(false)}
        mode={applicantMode}
        products={activeProducts}
        onCreate={({ firstName, lastName, email, product, amount }) => {
          const riskScore = 50;
          const name = applicantMode === "moral" ? firstName.trim() || email : `${firstName} ${lastName}`.trim() || email;
          const appNo = nextAppNo(apps, applicantMode);
          const appId = `local-${Date.now()}`;
          const applicantBinding =
            applicantMode === "moral"
              ? {
                  applicantName: name,
                  applicantEmail: normalizeApplicantEmail(email),
                }
              : bindApplicantFromPool(
            {
              id: appId,
              appNo,
              product,
              applicantName: name,
              applicantEmail: normalizeApplicantEmail(email),
            },
            applicantMode,
          );
          const submittedAt = nextMockSubmittedAt(apps);
          const next: Application = {
            id: appId,
            appNo,
            applicantName: applicantBinding.applicantName,
            applicantEmail: applicantBinding.applicantEmail,
            product,
            requestedAmount: normalizeRequestedAmount(product, amount),
            currency: "MXN",
            status: "pending",
            risk: riskFromApplicationStatus("pending", riskScore),
            riskScore: normalizeRiskScoreForStatus("pending", riskScore),
            submittedAt,
          };
          setApps((current) => {
            const nextApps = [next, ...current];
            writeStoredJson(activeStorageKeys.applications, nextApps);
            return nextApps;
          });
          setPage(0);
          if (applicantMode === "moral") {
            openKybForApplication(next, lastName);
          }
        }}
      />

      {detailApp && (
        <AppDetailModal
          app={detailApp}
          rules={normalizedRules.filter((rule) => rule.products.includes(detailApp.product as RuleProduct))}
          mode={applicantMode}
          creditStore={creditStore}
          onClose={() => setDetailApp(null)}
        />
      )}

      <RuleModal
        key={`${editingRuleId ?? "new"}-${showRuleModal ? "open" : "closed"}`}
        open={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        initial={ruleModalState}
        availableFields={ruleFieldOptions}
        isEditing={Boolean(editingRuleId)}
        products={activeProducts}
        onSave={(form, duplicateToProduct) => {
          const decisionBands = buildDecisionBands(form);
          const updatedRule = {
            name: form.name,
            products: [form.product] as RuleProduct[],
            field: form.field,
            operator: form.operator,
            value: form.evaluationMode === "bands" ? "" : form.value,
            dataType: form.dataType,
            severity: form.evaluationMode === "bands" ? "warn" : form.severity,
            description: form.description,
            status: form.status,
            decisionBands,
          };

          if (editingRuleId) {
            setRules((current) =>
              {
                const next = current.map((rule) =>
                  rule.id === editingRuleId
                    ? {
                        ...rule,
                        ...updatedRule,
                      }
                    : rule,
                );

                if (!duplicateToProduct || !PRODUCT_RULE_FIELDS[duplicateToProduct].includes(form.field)) {
                  return next;
                }

                const existingTargetIndex = next.findIndex(
                  (rule) => rule.id !== editingRuleId && rule.products.includes(duplicateToProduct) && rule.field === form.field,
                );

                if (existingTargetIndex >= 0) {
                  const existingTarget = next[existingTargetIndex]!;
                  next[existingTargetIndex] = {
                    ...existingTarget,
                    ...updatedRule,
                    products: [duplicateToProduct],
                  };
                  return next;
                }

                return [
                  ...next,
                  {
                    id: `cr-local-${Date.now()}-${duplicateToProduct.toLowerCase().replaceAll(" ", "-")}`,
                    createdAt: new Date().toISOString(),
                    ...updatedRule,
                    products: [duplicateToProduct],
                  },
                ];
              },
            );
            return;
          }

          const nextRule: CreditRuleRow = {
            id: `cr-local-${Date.now()}`,
            createdAt: new Date().toISOString(),
            ...updatedRule,
            name: form.name || "Nueva regla",
            products: [form.product],
            field: form.field || "custom.field",
            value: form.evaluationMode === "bands" ? "" : form.value || "0",
          };
          setRules((current) => [...current, nextRule]);
        }}
      />
    </div>
  );
}
