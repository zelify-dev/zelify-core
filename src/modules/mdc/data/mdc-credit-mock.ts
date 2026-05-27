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

export const CREDIT_PRODUCTS = ["Credito automotriz", "Credito personal", "Credito a plazo fijo"] as const;

export const LCC_FIXED_TERM_CLIENTS = SCOTIA_CREDIT_SEED.clients
  .filter((client) => client.productId === "PLAZO-CORP-01")
  .map((client) => ({
    id: client.id,
    name: client.name,
    email: client.kyc.email,
    amount: client.amount,
    creditScore: client.creditScore,
  }));

const FIRST_NAMES = [
  "Maria",
  "Diego",
  "Ana",
  "Jorge",
  "Sofia",
  "Carlos",
  "Lucia",
  "Eduardo",
  "Valentina",
  "Ricardo",
  "Patricia",
  "Fernando",
  "Gabriela",
  "Alejandro",
  "Daniela",
  "Miguel",
  "Laura",
  "Andres",
  "Paula",
  "Roberto",
] as const;

const LAST_NAMES = [
  "Lopez",
  "Ramirez",
  "Vega",
  "Hernandez",
  "Martinez",
  "Mendoza",
  "Romero",
  "Castillo",
  "Ruiz",
  "Silva",
  "Torres",
  "Morales",
  "Jimenez",
  "Alvarez",
] as const;

function hashSeed(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
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
    product: "Credito a plazo fijo",
    requestedAmount: 1200000,
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
    product: "Credito a plazo fijo",
    requestedAmount: 1500000,
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
  const risks: RiskLevel[] = ["low", "medium", "high"];

  for (let i = 0; i < 28; i++) {
    const id = `gen-${i}`;
    const fn = FIRST_NAMES[hashSeed(id + "fn") % FIRST_NAMES.length];
    const ln1 = LAST_NAMES[hashSeed(id + "ln1") % LAST_NAMES.length];
    const ln2 = LAST_NAMES[(hashSeed(id + "ln2") + 3) % LAST_NAMES.length];
    const product = CREDIT_PRODUCTS[hashSeed(id + "p") % CREDIT_PRODUCTS.length];
    const plazoFijoClient = LCC_FIXED_TERM_CLIENTS[hashSeed(id + "plazo") % LCC_FIXED_TERM_CLIENTS.length];
    const status = statuses[hashSeed(id + "s") % statuses.length];
    const risk = risks[hashSeed(id + "r") % risks.length];
    const day = 1 + (hashSeed(id + "d") % 28);
    const hour = hashSeed(id + "h") % 24;
    const applicantName = product === "Credito a plazo fijo" ? plazoFijoClient.name : `${fn} ${ln1} ${ln2}`;
    const applicantEmail = product === "Credito a plazo fijo"
      ? plazoFijoClient.email
      : `${fn.toLowerCase()}.${ln1.toLowerCase()}.${i}@gmail.com`;
    const requestedAmount =
      product === "Credito personal"
        ? 25_000 + (hashSeed(id + "a") % 775_000)
        : product === "Credito a plazo fijo"
          ? Math.min(1_500_000, Math.max(150_000, plazoFijoClient.amount + ((hashSeed(id + "adj") % 280_000) - 140_000)))
          : 100_000 + (hashSeed(id + "a") % 2_400_000);

    rows.push({
      id: `uuid-gen-${1000 + i}`,
      appNo: `APP-${String(1276 - i).padStart(6, "0")}`,
      applicantName,
      applicantEmail,
      product,
      requestedAmount,
      currency: "MXN",
      status,
      risk,
      riskScore: 15 + (hashSeed(id + "rs") % 75),
      submittedAt: new Date(Date.UTC(2026, 4, day, hour, (hashSeed(id + "m") % 59) + 1, 0)).toISOString(),
    });
  }

  return rows.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
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
