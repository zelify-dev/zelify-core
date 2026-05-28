import { SCOTIA_CREDIT_SEED } from "@/modules/cortex/data/scotiabank-credit.seed";

export type ApplicationStatus = "approved" | "declined" | "pending" | "manualReview" | "overridden";
export type RiskLevel = "low" | "medium" | "high";

export type Application = {
  id: string;
  appNo: string;
  applicantName: string;
  applicantEmail: string;
  product: string;
  requestedAmount: number;
  currency: string;
  status: ApplicationStatus;
  risk: RiskLevel;
  riskScore: number;
  submittedAt: string;
};

export const CREDIT_PRODUCTS = ["Credito automotriz", "Credito personal"] as const;

type MdcClientPoolItem = {
  id: string;
  name: string;
  email: string;
  amount: number;
  creditScore: number;
  product: (typeof CREDIT_PRODUCTS)[number];
};

function mapProductIdToMdcProduct(productId: string): (typeof CREDIT_PRODUCTS)[number] {
  if (productId.startsWith("AUTO")) return "Credito automotriz";
  return "Credito personal";
}

export const LCC_MDC_CLIENTS: MdcClientPoolItem[] = SCOTIA_CREDIT_SEED.clients.map((client) => ({
  id: client.id,
  name: client.name,
  email: client.kyc.email,
  amount: client.amount,
  creditScore: client.creditScore,
  product: mapProductIdToMdcProduct(client.productId),
}));

export const LCC_AUTO_CLIENTS = LCC_MDC_CLIENTS.filter((client) => client.product === "Credito automotriz");
export const LCC_PERSONAL_CLIENTS = LCC_MDC_CLIENTS.filter((client) => client.product === "Credito personal");

function hashSeed(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function riskFromRiskIndex(score: number): RiskLevel {
  const bureauScore = Math.round(850 - (Math.max(0, Math.min(100, score)) / 100) * 450);
  if (bureauScore <= 549) return "high";
  if (bureauScore <= 649) return "medium";
  return "low";
}

export const applicationsPerDay = [
  { label: "May 01", value: 4 },
  { label: "May 02", value: 5 },
  { label: "May 03", value: 4 },
  { label: "May 04", value: 5 },
  { label: "May 05", value: 5 },
  { label: "May 06", value: 7 },
  { label: "May 07", value: 6 },
];

export const overviewKpis = {
  totalApplications: { value: 36, deltaPct: 12.5, positive: true },
  approvedPct: { value: 25, deltaPct: 4.2, positive: true },
  declinedPct: { value: 16.7, deltaPct: -2.8, positive: true },
  avgAmount: { value: 412000, deltaPct: 5.1, positive: true },
};

export const recentApplicationsSeed: Application[] = [
  {
    id: "uuid-001",
    appNo: "APP-001284",
    applicantName: "Roberto Méndez García",
    applicantEmail: "roberto.mendez@gmail.com",
    product: "Credito automotriz",
    requestedAmount: 850000,
    currency: "MXN",
    status: "approved",
    risk: "low",
    riskScore: 28,
    submittedAt: "2026-05-07T10:24:00Z",
  },
  {
    id: "uuid-002",
    appNo: "APP-001283",
    applicantName: "María González Ruiz",
    applicantEmail: "maria.gonzalez@gmail.com",
    product: "Credito personal",
    requestedAmount: 180000,
    currency: "MXN",
    status: "manualReview",
    risk: "medium",
    riskScore: 54,
    submittedAt: "2026-05-07T09:12:00Z",
  },
  {
    id: "uuid-003",
    appNo: "APP-001282",
    applicantName: "Inversiones del Norte SA",
    applicantEmail: "tesoreria@inversionesnorte.mx",
    product: "Credito personal",
    requestedAmount: 580000,
    currency: "MXN",
    status: "pending",
    risk: "medium",
    riskScore: 47,
    submittedAt: "2026-05-07T08:48:00Z",
  },
  {
    id: "uuid-004",
    appNo: "APP-001281",
    applicantName: "Jorge Lima Herrera",
    applicantEmail: "jorge.lima@gmail.com",
    product: "Credito personal",
    requestedAmount: 95000,
    currency: "MXN",
    status: "declined",
    risk: "high",
    riskScore: 82,
    submittedAt: "2026-05-06T22:15:00Z",
  },
  {
    id: "uuid-005",
    appNo: "APP-001280",
    applicantName: "Carlos Ruiz Mendoza",
    applicantEmail: "carlos.ruiz@gmail.com",
    product: "Credito automotriz",
    requestedAmount: 450000,
    currency: "MXN",
    status: "overridden",
    risk: "medium",
    riskScore: 51,
    submittedAt: "2026-05-06T18:02:00Z",
  },
  {
    id: "uuid-006",
    appNo: "APP-001279",
    applicantName: "Ana Lucía Méndez Torres",
    applicantEmail: "ana.mendez@gmail.com",
    product: "Credito personal",
    requestedAmount: 320000,
    currency: "MXN",
    status: "approved",
    risk: "low",
    riskScore: 33,
    submittedAt: "2026-05-06T16:41:00Z",
  },
  {
    id: "uuid-007",
    appNo: "APP-001278",
    applicantName: "Juan Hernandez",
    applicantEmail: "juan.hernandez@gmail.com",
    product: "Credito automotriz",
    requestedAmount: 680000,
    currency: "MXN",
    status: "approved",
    risk: "low",
    riskScore: 24,
    submittedAt: "2026-05-06T15:09:00Z",
  },
  {
    id: "uuid-008",
    appNo: "APP-001277",
    applicantName: "Grupo Delta Industrial SA",
    applicantEmail: "finanzas@grupodelta.mx",
    product: "Credito personal",
    requestedAmount: 760000,
    currency: "MXN",
    status: "pending",
    risk: "high",
    riskScore: 71,
    submittedAt: "2026-05-06T13:54:00Z",
  },
];

export const applicationsListMock: Application[] = (() => {
  const rows: Application[] = recentApplicationsSeed.map((r) => ({ ...r }));

  const statuses: ApplicationStatus[] = ["approved", "declined", "pending", "manualReview", "overridden"];
  const clientPoolByProduct: Record<(typeof CREDIT_PRODUCTS)[number], MdcClientPoolItem[]> = {
    "Credito automotriz": LCC_AUTO_CLIENTS.length > 0 ? LCC_AUTO_CLIENTS : LCC_MDC_CLIENTS,
    "Credito personal": LCC_PERSONAL_CLIENTS.length > 0 ? LCC_PERSONAL_CLIENTS : LCC_MDC_CLIENTS,
  };

  for (let i = 0; i < 28; i++) {
    const id = `gen-${i}`;
    const product = CREDIT_PRODUCTS[hashSeed(id + "p") % CREDIT_PRODUCTS.length];
    const productPool = clientPoolByProduct[product];
    const sourceClient = productPool[hashSeed(id + "pool") % productPool.length];
    const status = statuses[hashSeed(id + "s") % statuses.length];
    const day = 1 + (hashSeed(id + "d") % 28);
    const hour = hashSeed(id + "h") % 24;
    const requestedAmount =
      product === "Credito personal"
        ? Math.min(800_000, Math.max(25_000, sourceClient.amount + ((hashSeed(id + "adj") % 220_000) - 110_000)))
        : Math.min(2_500_000, Math.max(100_000, sourceClient.amount + ((hashSeed(id + "adj") % 360_000) - 180_000)));
    const riskScore = Math.max(15, Math.min(89, Math.round(100 - sourceClient.creditScore / 10) + ((hashSeed(id + "risk") % 9) - 4)));
    const risk: RiskLevel = riskFromRiskIndex(riskScore);

    rows.push({
      id: `uuid-gen-${1000 + i}`,
      appNo: `APP-${String(1276 - i).padStart(6, "0")}`,
      applicantName: sourceClient.name,
      applicantEmail: sourceClient.email,
      product,
      requestedAmount,
      currency: "MXN",
      status,
      risk,
      riskScore,
      submittedAt: new Date(Date.UTC(2026, 4, day, hour, (hashSeed(id + "m") % 59) + 1, 0)).toISOString(),
    });
  }

  return rows
    .map((row) => ({
      ...row,
      risk: riskFromRiskIndex(row.riskScore),
    }))
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
})();

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  approved: "Aprobada",
  declined: "Rechazada",
  pending: "Pendiente",
  manualReview: "Revision manual",
  overridden: "Override",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
};
