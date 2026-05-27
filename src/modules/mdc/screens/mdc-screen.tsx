"use client";

import { useEffect, useMemo, useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import {
  applicationsListMock,
  applicationsPerDay,
  CREDIT_PRODUCTS,
  LCC_FIXED_TERM_CLIENTS,
  overviewKpis,
  RISK_LABELS,
  STATUS_LABELS,
  type Application,
  type ApplicationStatus,
  type RiskLevel,
} from "@/modules/mdc/data/mdc-credit-mock";
import { creditRulesMock, type CreditRuleRow, type RuleDataType, type RuleOperator, type RuleSeverity } from "@/modules/mdc/data/mdc-rules-mock";
import { MdcProductsTab } from "@/modules/mdc/components/mdc-products-tab";
import { MdcPaymentsTab } from "@/modules/mdc/components/mdc-payments-tab";
import { MdcCollectionsTab } from "@/modules/mdc/components/mdc-collections-tab";
import { MdcConfigurationTab } from "@/modules/mdc/components/mdc-configuration-tab";
import "@/components/ui/templates/workspace-page.css";
import "./mdc-screen.css";

type MdcTab = "overview" | "products" | "applications" | "rules" | "payments" | "collections" | "configuration";

type RuleFormState = {
  name: string;
  field: string;
  operator: RuleOperator;
  value: string;
  dataType: RuleDataType;
  severity: RuleSeverity;
  description: string;
  status: "active" | "inactive";
};

const APP_STORAGE_KEY = "mdc:applications";
const RULES_STORAGE_KEY = "mdc:rules";
const PAGE_SIZE = 10;
const FIXED_TERM_PRODUCT = "Credito a plazo fijo";

const TABS: { id: MdcTab; label: string }[] = [
  { id: "overview", label: "Tablero" },
  { id: "products", label: "Productos" },
  { id: "applications", label: "Solicitudes" },
  { id: "rules", label: "Reglas" },
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

const RULE_FIELD_LABELS: Record<string, string> = {
  "applicant.age": "Edad del solicitante",
  "ratios.dti": "Relacion deuda / ingreso (DTI)",
  "bureau.score": "Score crediticio en buro",
  "employment.months": "Antiguedad laboral (meses)",
  "income.monthlyNet": "Ingreso mensual neto",
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

function riskFromScore(score: number): RiskLevel {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function statusFromScore(score: number): ApplicationStatus {
  if (score >= 75) return "declined";
  if (score >= 50) return "manualReview";
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

function nextAppNo(rows: Application[]) {
  const maxNumber = rows.reduce((max, row) => {
    const match = row.appNo.match(/APP-(\d+)/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 1284);
  return `APP-${String(maxNumber + 1).padStart(6, "0")}`;
}

function nextAppNoFrom(maxNumber: number) {
  return `APP-${String(maxNumber + 1).padStart(6, "0")}`;
}

function defaultRuleForm(): RuleFormState {
  return {
    name: "",
    field: "",
    operator: "gte",
    value: "",
    dataType: "number",
    severity: "warn",
    description: "",
    status: "active",
  };
}

function ruleFieldLabel(field: string) {
  return RULE_FIELD_LABELS[field] ?? field.replaceAll(".", " · ");
}

function normalizeProductName(name: string) {
  if (name === "BNPL") return "Credito personal";
  if (name === "Prestamo personal") return "Credito automotriz";
  if (name.toLowerCase().includes("plazo fijo")) return "Credito a plazo fijo";
  return name;
}

function normalizeApplicantEmail(email: string) {
  return email.replace(/@example\.com$/i, "@gmail.com");
}

function bindFixedTermApplicant(app: Pick<Application, "id" | "appNo" | "product" | "applicantName" | "applicantEmail">) {
  if (app.product !== FIXED_TERM_PRODUCT || LCC_FIXED_TERM_CLIENTS.length === 0) {
    return { applicantName: app.applicantName, applicantEmail: app.applicantEmail };
  }

  const byEmail = LCC_FIXED_TERM_CLIENTS.find(
    (client) => client.email.toLowerCase() === app.applicantEmail.toLowerCase(),
  );
  if (byEmail) {
    return { applicantName: byEmail.name, applicantEmail: byEmail.email };
  }

  let hash = 0;
  const seed = `${app.id}-${app.appNo}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % LCC_FIXED_TERM_CLIENTS.length;
  const selected = LCC_FIXED_TERM_CLIENTS[idx];
  return { applicantName: selected.name, applicantEmail: selected.email };
}

function ensureFixedTermApplications(apps: Application[]) {
  if (LCC_FIXED_TERM_CLIENTS.length === 0) return apps;

  const merged = [...apps];
  const fixedTermRows = merged.filter((row) => row.product === FIXED_TERM_PRODUCT);
  const emailSet = new Set(fixedTermRows.map((row) => row.applicantEmail.toLowerCase()));
  const nameSet = new Set(fixedTermRows.map((row) => row.applicantName.toLowerCase()));

  let maxNumber = merged.reduce((max, row) => {
    const match = row.appNo.match(/APP-(\d+)/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 1284);

  LCC_FIXED_TERM_CLIENTS.forEach((client, index) => {
    const hasByEmail = emailSet.has(client.email.toLowerCase());
    const hasByName = nameSet.has(client.name.toLowerCase());
    if (hasByEmail || hasByName) return;

    const riskScore = Math.max(22, Math.min(88, Math.round(100 - client.creditScore / 10)));
    const status = statusFromScore(riskScore);
    maxNumber += 1;
    const submittedAt = new Date(Date.UTC(2026, 4, 7 - index, 10 + index, 14, 0)).toISOString();

    merged.unshift({
      id: `lcc-plazo-${client.id.toLowerCase()}`,
      appNo: nextAppNoFrom(maxNumber),
      applicantName: client.name,
      applicantEmail: client.email,
      product: FIXED_TERM_PRODUCT,
      requestedAmount: normalizeRequestedAmount(FIXED_TERM_PRODUCT, client.amount),
      currency: "MXN",
      status,
      risk: riskFromScore(riskScore),
      riskScore,
      submittedAt,
    });
    emailSet.add(client.email.toLowerCase());
    nameSet.add(client.name.toLowerCase());
  });

  return merged;
}

function normalizeRequestedAmount(product: string, requestedAmount: number) {
  if (product === "Credito personal") {
    if (requestedAmount < 25_000) return 25_000 + Math.round(requestedAmount * 60);
    return Math.min(Math.max(requestedAmount, 25_000), 800_000);
  }
  if (product === "Credito a plazo fijo") {
    if (requestedAmount < 150_000) return 150_000 + Math.round(requestedAmount * 8);
    return Math.min(Math.max(requestedAmount, 150_000), 1_500_000);
  }
  if (product === "Credito automotriz") {
    if (requestedAmount < 100_000) return 100_000 + Math.round(requestedAmount * 14);
    return Math.min(Math.max(requestedAmount, 100_000), 2_500_000);
  }
  return requestedAmount;
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
          <text x={xForIndex(index)} y={height - 16} textAnchor="middle" className="mdc-line-chart__x-label">
            {point.label}
          </text>
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

function AppDetailModal({ app, rules, onClose }: { app: Application; rules: CreditRuleRow[]; onClose: () => void }) {
  const [feedback, setFeedback] = useState("");
  const [overrideChoice, setOverrideChoice] = useState<ApplicationStatus>("manualReview");
  const [overrideReason, setOverrideReason] = useState("");
  const isAutomotriz = app.product === "Credito automotriz";
  const isPlazoFijo = app.product === "Credito a plazo fijo";
  const interestRate = isAutomotriz ? 13.8 : isPlazoFijo ? 12.4 : 21.2;
  const termMonths = isAutomotriz ? 48 : isPlazoFijo ? 36 : 24;
  const downPayment = isAutomotriz ? Math.round(app.requestedAmount * 0.15) : 0;
  const financedAmount = Math.max(app.requestedAmount - downPayment, 0);
  const totalWithInterest = financedAmount * (1 + (interestRate / 100) * (termMonths / 12));
  const monthlyEstimate = Math.round(totalWithInterest / Math.max(termMonths, 1));
  const fraudScore = Math.min(96, Math.max(10, Math.round(app.riskScore * 0.72 + (quickHash(app.id) % 17))));
  const dti = Math.min(0.62, Math.max(0.19, app.requestedAmount / (isAutomotriz ? 8_500_000 : isPlazoFijo ? 4_400_000 : 2_100_000)));
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
  const stages = [
    { id: "onboarding", label: "Onboarding", state: "done" },
    { id: "docs", label: "Documentos", state: app.status === "pending" ? "current" : "done" },
    { id: "kyc", label: "KYC / KYB", state: app.status === "pending" ? "current" : app.riskScore >= 80 ? "failed" : "done" },
    { id: "rules", label: "Reglas de decision", state: app.status === "pending" ? "current" : "done" },
    { id: "decision", label: "Decision final", state: app.status === "pending" ? "current" : app.status === "declined" ? "failed" : "done" },
  ] as const;
  const activeRules = rules
    .filter((rule) => rule.status === "active")
    .slice(0, 4)
    .map((rule, index) => {
      let result: RuleSeverity = "pass";
      if (rule.severity === "fail" && app.riskScore >= 75) result = "fail";
      if (rule.severity === "warn" && app.riskScore >= 55) result = "warn";
      if (rule.id === "cr-2" && dti > 0.5) result = "fail";
      if (rule.id === "cr-3" && app.riskScore >= 50) result = "warn";
      if (index === 0 && app.status === "approved") result = "pass";
      return { ...rule, result };
    });
  const failedRules = activeRules.filter((rule) => rule.result === "fail").map((rule) => rule.name);
  const warnedRules = activeRules.filter((rule) => rule.result === "warn").map((rule) => rule.name);
  const decisionReason =
    app.status === "declined"
      ? failedRules.length > 0
        ? `Rechazada por incumplimiento de reglas: ${failedRules.join(", ")}.`
        : dti > 0.5
          ? `Rechazada por DTI elevado (${ratioLabel(dti)}), por encima del limite de politica.`
          : `Rechazada por score de riesgo alto (${app.riskScore}) y riesgo ${RISK_LABELS[app.risk].toLowerCase()}.`
      : app.status === "manualReview"
        ? warnedRules.length > 0
          ? `En revision manual por alertas en reglas: ${warnedRules.join(", ")}.`
          : `En revision manual por inconsistencias documentales y score ${app.riskScore}.`
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
    setFeedback(`Override aplicado: ${STATUS_LABELS[overrideChoice]}. Queda registrado en auditoria.`);
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
          <div className="mdc-detail-actions">
            <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => runAction("Reevaluacion documental")}>Reevaluar docs</button>
            <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => runAction("Reevaluacion de reglas")}>Reevaluar reglas</button>
            <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => runAction("Validacion KYC")}>Evaluar KYC</button>
            <button type="button" className="mdc-btn mdc-btn--primary" onClick={() => runAction("Ejecucion del motor")}>Ejecutar motor</button>
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
              <h4>Solicitante</h4>
              <dl className="mdc-detail-dl">
                <div><dt>Nombre</dt><dd>{app.applicantName}</dd></div>
                <div><dt>Email</dt><dd>{app.applicantEmail}</dd></div>
                <div><dt>Fecha envio</dt><dd>{shortDate(app.submittedAt)}</dd></div>
                <div><dt>Score de riesgo</dt><dd>{app.riskScore} ({RISK_LABELS[app.risk]})</dd></div>
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
                      <th>Documento</th>
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
                <span className={app.status === "declined" ? "mdc-badge mdc-badge--bad" : app.status === "pending" ? "mdc-badge mdc-badge--warn" : "mdc-badge mdc-badge--ok"}>
                  {app.status === "declined" ? "Fail" : app.status === "pending" ? "Warn" : "Pass"}
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
                      {rule.result === "pass" ? "Pass" : rule.result === "warn" ? "Warn" : "Fail"}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="mdc-detail-side">
            <section className="mdc-detail-card">
              <h4>Resumen del motor</h4>
              <div className="mdc-detail-score-grid">
                <div>
                  <span>Risk score</span>
                  <strong>{app.riskScore}</strong>
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
                <span>Razon (auditoria)</span>
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
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (values: { firstName: string; lastName: string; email: string; product: string; amount: number }) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState<string>(CREDIT_PRODUCTS[0]);
  const [amount, setAmount] = useState("12000");

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setProduct(CREDIT_PRODUCTS[0]);
    setAmount("12000");
  };

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
            <span>Nombre</span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label>
            <span>Apellido</span>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
          <label>
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <label>
            <span>Producto</span>
            <select value={product} onChange={(e) => setProduct(e.target.value)}>
              {CREDIT_PRODUCTS.map((p) => (
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
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: RuleFormState;
  onSave: (form: RuleFormState) => void;
}) {
  const [form, setForm] = useState<RuleFormState>(() => initial);

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
            <span>Campo</span>
            <input value={form.field} onChange={(e) => setForm((s) => ({ ...s, field: e.target.value }))} />
          </label>
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
          <label>
            <span>Tipo</span>
            <select value={form.dataType} onChange={(e) => setForm((s) => ({ ...s, dataType: e.target.value as RuleDataType }))}>
              {RULE_TYPES.map((type) => (
                <option key={type} value={type}>{RULE_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Severidad</span>
            <select value={form.severity} onChange={(e) => setForm((s) => ({ ...s, severity: e.target.value as RuleSeverity }))}>
              {RULE_SEVERITIES.map((severity) => (
                <option key={severity} value={severity}>{RULE_SEVERITY_LABELS[severity]}</option>
              ))}
            </select>
          </label>
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
              onSave(form);
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
  const [activeTab, setActiveTab] = useState<MdcTab>("overview");
  const [apps, setApps] = useState<Application[]>(() =>
    ensureFixedTermApplications(
      readStoredJson<Application[]>(APP_STORAGE_KEY, applicationsListMock).map((app) => ({
        ...app,
        product: normalizeProductName(app.product),
        ...bindFixedTermApplicant({
          id: app.id,
          appNo: app.appNo,
          product: normalizeProductName(app.product),
          applicantName: app.applicantName,
          applicantEmail: normalizeApplicantEmail(app.applicantEmail),
        }),
        requestedAmount: normalizeRequestedAmount(normalizeProductName(app.product), app.requestedAmount),
      })),
    ),
  );
  const [rules, setRules] = useState<CreditRuleRow[]>(() => readStoredJson<CreditRuleRow[]>(RULES_STORAGE_KEY, creditRulesMock));

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
  const [ruleModalState, setRuleModalState] = useState<RuleFormState>(defaultRuleForm());
  const [copiedLink, setCopiedLink] = useState(false);
  const onboardingPublicUrl =
    "https://cortex.zelify.com/es/onboarding/solicitudes/iniciar/flujo-v2?channel=originador&source=panel-riesgo&tenant=mx-core&access_hint=invite-only&k=ZLX9A7M2Q4";

  useEffect(() => {
    writeStoredJson(APP_STORAGE_KEY, apps);
  }, [apps]);

  useEffect(() => {
    writeStoredJson(RULES_STORAGE_KEY, rules);
  }, [rules]);

  const overview = useMemo(() => {
    const total = apps.length;
    const approved = apps.filter((a) => a.status === "approved").length;
    const declined = apps.filter((a) => a.status === "declined").length;
    const pending = apps.filter((a) => a.status === "pending").length;
    const avgAmount = total > 0 ? apps.reduce((sum, a) => sum + a.requestedAmount, 0) / total : 0;

    const approvalRatio = [
      { label: "Aprobadas automaticas", value: approved, color: "#0f766e" },
      { label: "Rechazadas por politica", value: declined, color: "#b91c1c" },
      { label: "En revision manual", value: pending, color: "#334155" },
    ];

    const lowTarget = Math.round(total * 0.56);
    const mediumTarget = Math.round(total * 0.29);
    const highTarget = Math.max(total - lowTarget - mediumTarget, 0);

    const riskDistribution = [
      { label: "Perfil conservador", value: lowTarget, color: "#0f766e" },
      { label: "Perfil moderado", value: mediumTarget, color: "#1d4ed8" },
      { label: "Perfil expuesto", value: highTarget, color: "#b91c1c" },
    ];

    const recent = [...apps]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 8);

    return {
      total,
      approved,
      declined,
      avgAmount,
      approvalRatio,
      riskDistribution,
      recent,
    };
  }, [apps]);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (productFilter !== "all" && app.product !== productFilter) return false;
      if (riskFilter !== "all" && app.risk !== riskFilter) return false;
      if (!q) return true;
      const blob = `${app.appNo} ${app.applicantName} ${app.applicantEmail} ${app.product}`.toLowerCase();
      return blob.includes(q);
    });
  }, [apps, productFilter, riskFilter, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredApps.length / PAGE_SIZE));
  const paginatedApps = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredApps.slice(start, start + PAGE_SIZE);
  }, [filteredApps, page]);

  const filteredRules = useMemo(() => {
    const q = ruleQuery.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter((r) => `${r.name} ${r.field} ${r.description}`.toLowerCase().includes(q));
  }, [ruleQuery, rules]);

  const openCreateRule = () => {
    setEditingRuleId(null);
    setRuleModalState(defaultRuleForm());
    setShowRuleModal(true);
  };

  const openEditRule = (rule: CreditRuleRow) => {
    setEditingRuleId(rule.id);
    setRuleModalState({
      name: rule.name,
      field: rule.field,
      operator: rule.operator,
      value: rule.value,
      dataType: rule.dataType,
      severity: rule.severity,
      description: rule.description,
      status: rule.status,
    });
    setShowRuleModal(true);
  };

  const copyOnboardingLink = async () => {
    try {
      await navigator.clipboard.writeText(onboardingPublicUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      setCopiedLink(false);
    }
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
              <h1>MDC · Motor de Decision de Credito</h1>
                <p className="mdc-header__sub">Analisis de solicitudes, reglas y decisiones en un flujo centralizado.</p>
              </div>
              <div className="mdc-header__date">
                <label htmlFor="mdc-range">Rango</label>
                <select id="mdc-range" defaultValue="7d">
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
                  deltaPct={overviewKpis.totalApplications.deltaPct}
                  positive={overviewKpis.totalApplications.positive}
                  comparisonLabel="vs periodo anterior"
                />
                <MdcStatCard
                  title="Porcentaje de aprobacion"
                  value={ratioLabel(overview.approved / Math.max(overview.total, 1))}
                  deltaPct={overviewKpis.approvedPct.deltaPct}
                  positive={overviewKpis.approvedPct.positive}
                  comparisonLabel="motivo principal rechazo: ingresos insuficientes"
                />
                <MdcStatCard
                  title="Porcentaje de rechazo"
                  value={ratioLabel(overview.declined / Math.max(overview.total, 1))}
                  deltaPct={overviewKpis.declinedPct.deltaPct}
                  positive={overviewKpis.declinedPct.positive}
                  comparisonLabel="vs periodo anterior"
                />
                <MdcStatCard
                  title="Monto promedio solicitado / aprobado"
                  value={money(overview.avgAmount)}
                  deltaPct={overviewKpis.avgAmount.deltaPct}
                  positive={overviewKpis.avgAmount.positive}
                  comparisonLabel="vs periodo anterior"
                />
              </div>

              <article className="mdc-card">
                <div className="mdc-card__head">
                  <h3>Solicitudes por dia</h3>
                  <p>Tendencia semanal de ingreso al motor</p>
                </div>
                <LineChart points={applicationsPerDay} />
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
                  <h3>Solicitudes recientes</h3>
                  <button type="button" className="mdc-link-btn" onClick={() => setActiveTab("applications")}>
                    Ver todas
                  </button>
                </div>
                <div className="mdc-table-wrap">
                  <table className="mdc-table">
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
                      {overview.recent.map((app) => (
                        <tr key={app.id}>
                          <td>{app.appNo}</td>
                          <td>{app.applicantName}</td>
                          <td>{app.product}</td>
                          <td>{money(app.requestedAmount)}</td>
                          <td><span className={classForStatus(app.status)}>{STATUS_LABELS[app.status]}</span></td>
                          <td><span className={classForRisk(app.risk)}>{RISK_LABELS[app.risk]}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          )}

          {activeTab === "products" && <MdcProductsTab />}

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
                      {CREDIT_PRODUCTS.map((product) => (
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
                <p className="mdc-date-hint">La fecha se toma del rango global del tablero para filtrar resultados de solicitudes.</p>

                <div className="mdc-table-wrap">
                  <table className="mdc-table">
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
                      {paginatedApps.map((app) => (
                        <tr key={app.id}>
                          <td>{app.appNo}</td>
                          <td>{app.applicantName}</td>
                          <td>{app.applicantEmail}</td>
                          <td>{app.product}</td>
                          <td>{money(app.requestedAmount)}</td>
                          <td><span className={classForStatus(app.status)}>{STATUS_LABELS[app.status]}</span></td>
                          <td>
                            <span className={classForRisk(app.risk)}>
                              {RISK_LABELS[app.risk]} · {app.riskScore}
                            </span>
                          </td>
                          <td>{shortDate(app.submittedAt)}</td>
                          <td>
                            <div className="mdc-actions">
                              <button type="button" className="mdc-btn mdc-btn--xs" onClick={() => setDetailApp(app)}>
                                Ver
                              </button>
                              <details className="mdc-row-menu">
                                <summary>Opciones</summary>
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
                                                risk: riskFromScore(row.riskScore),
                                                submittedAt: new Date().toISOString(),
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
                                            ? { ...row, status: "pending", submittedAt: new Date().toISOString() }
                                            : row,
                                        ),
                                      );
                                    }}
                                  >
                                    Reenviar onboarding
                                  </button>
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
                      ))}
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
                    <span>Buscar regla</span>
                    <input
                      value={ruleQuery}
                      onChange={(e) => setRuleQuery(e.target.value)}
                      placeholder="nombre, campo o descripcion"
                    />
                  </label>
                </div>

                <div className="mdc-table-wrap">
                  <table className="mdc-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Campo</th>
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
                          <td>{ruleFieldLabel(rule.field)}</td>
                          <td>{RULE_OPERATOR_LABELS[rule.operator]}</td>
                          <td>{rule.value}</td>
                          <td>{RULE_TYPE_LABELS[rule.dataType]}</td>
                          <td>{RULE_SEVERITY_LABELS[rule.severity]}</td>
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

          {activeTab === "payments" && <MdcPaymentsTab />}
          {activeTab === "collections" && <MdcCollectionsTab />}
          {activeTab === "configuration" && <MdcConfigurationTab />}
        </div>
      </div>

      <AddApplicationModal
        open={showAddApplication}
        onClose={() => setShowAddApplication(false)}
        onCreate={({ firstName, lastName, email, product, amount }) => {
          const riskScore =
            product === "Credito personal"
              ? Math.min(68, 24 + Math.round(amount / 400))
              : product === "Credito a plazo fijo"
                ? Math.min(78, 28 + Math.round(amount / 2_000))
                : Math.min(86, 32 + Math.round(amount / 4_000));
          const name = `${firstName} ${lastName}`.trim() || email;
          const appNo = nextAppNo(apps);
          const appId = `local-${Date.now()}`;
          const fixedTermBinding = bindFixedTermApplicant({
            id: appId,
            appNo,
            product,
            applicantName: name,
            applicantEmail: normalizeApplicantEmail(email),
          });
          const next: Application = {
            id: appId,
            appNo,
            applicantName: fixedTermBinding.applicantName,
            applicantEmail: fixedTermBinding.applicantEmail,
            product,
            requestedAmount: normalizeRequestedAmount(product, amount),
            currency: "MXN",
            status: "pending",
            risk: riskFromScore(riskScore),
            riskScore,
            submittedAt: new Date().toISOString(),
          };
          setApps((current) => [next, ...current]);
          setPage(0);
        }}
      />

      {detailApp && <AppDetailModal app={detailApp} rules={rules} onClose={() => setDetailApp(null)} />}

      <RuleModal
        key={`${editingRuleId ?? "new"}-${showRuleModal ? "open" : "closed"}`}
        open={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        initial={ruleModalState}
        onSave={(form) => {
          if (editingRuleId) {
            setRules((current) =>
              current.map((rule) =>
                rule.id === editingRuleId
                  ? {
                      ...rule,
                      name: form.name,
                      field: form.field,
                      operator: form.operator,
                      value: form.value,
                      dataType: form.dataType,
                      severity: form.severity,
                      description: form.description,
                      status: form.status,
                    }
                  : rule,
              ),
            );
            return;
          }

          const nextRule: CreditRuleRow = {
            id: `cr-local-${Date.now()}`,
            name: form.name || "Nueva regla",
            field: form.field || "custom.field",
            operator: form.operator,
            value: form.value || "0",
            dataType: form.dataType,
            severity: form.severity,
            status: form.status,
            description: form.description,
            createdAt: new Date().toISOString(),
          };
          setRules((current) => [...current, nextRule]);
        }}
      />
    </div>
  );
}
