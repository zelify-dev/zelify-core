import {
  DEFAULT_CROSS_SELL,
  DEFAULT_PRODUCTS,
  DEFAULT_RULES,
} from "./credit-catalog";
import type { CreditClientProfile, CreditDemoState } from "../types/credit-pricing.types";

const CLIENTS: CreditClientProfile[] = [
  {
    id: "CL-AUTO-001",
    productId: "AUTO-EV-01",
    name: "Roberto Méndez García",
    entityType: "PF",
    amount: 850_000,
    termMonths: 60,
    creditScore: 780,
    aiApproved: null,
    clientProducts: { nomina: true, tdc: true, seguroAuto: false, inversionPatrimonial: false, cuentaAhorro: false },
    kyc: {
      curp: "MEGR850315HDFRNB02",
      rfc: "MEGR850315AB1",
      birthDate: "1985-03-15",
      nationality: "Mexicana",
      address: "Monterrey, NL",
      phone: "+52 81 1234 5678",
      email: "roberto.mendez@email.com",
      idVerified: true,
      pep: false,
      incomeMonthly: 85_000,
    },
  },
  {
    id: "CL-AUTO-002",
    productId: "AUTO-EV-01",
    name: "Ana Lucía Torres",
    entityType: "PF",
    amount: 620_000,
    termMonths: 48,
    creditScore: 720,
    aiApproved: null,
    clientProducts: { nomina: true, tdc: false, seguroAuto: false, inversionPatrimonial: false, cuentaAhorro: true },
    kyc: {
      curp: "TOAL900822MDFRRN05",
      rfc: "TOAL900822CD2",
      birthDate: "1990-08-22",
      nationality: "Mexicana",
      address: "CDMX",
      phone: "+52 55 9876 5432",
      email: "ana.torres@email.com",
      idVerified: true,
      pep: false,
      incomeMonthly: 62_000,
    },
  },
  {
    id: "CL-AUTO-003",
    productId: "AUTO-EV-01",
    name: "Carlos Ruiz Mendoza",
    entityType: "PF",
    amount: 450_000,
    termMonths: 36,
    creditScore: 580,
    aiApproved: null,
    clientProducts: { nomina: false, tdc: false, seguroAuto: false, inversionPatrimonial: false, cuentaAhorro: false },
    kyc: {
      curp: "RUMC880110HDFRNR09",
      rfc: "RUMC880110EF3",
      birthDate: "1988-01-10",
      nationality: "Mexicana",
      address: "Guadalajara, JAL",
      phone: "+52 33 5555 1212",
      email: "carlos.ruiz@email.com",
      idVerified: true,
      pep: false,
      incomeMonthly: 28_000,
    },
  },
  {
    id: "CL-AUTO-004",
    productId: "AUTO-EV-01",
    name: "Juan Hernandez",
    entityType: "PF",
    amount: 680_000,
    termMonths: 48,
    creditScore: 755,
    aiApproved: null,
    clientProducts: {
      nomina: true,
      tdc: true,
      seguroAuto: false,
      inversionPatrimonial: false,
      cuentaAhorro: true,
    },
    kyc: {
      curp: "HRGRJN900322HDFRRL07",
      idDocument: "HRGRJN900322HDFRRL07",
      rfc: "HEHJ970213AB8",
      birthDate: "1997-02-13",
      nationality: "Mexicana",
      address: "Av. Paseo de la Reforma 250, CDMX",
      phone: "+52 55 7561 1121",
      email: "juan.hernandez@gmail.com",
      idVerified: true,
      amlApproved: true,
      pep: false,
      incomeMonthly: 58_000,
    },
  },
  {
    id: "CL-PERS-001",
    productId: "PERS-LIB-01",
    name: "María González Ruiz",
    entityType: "PF",
    amount: 180_000,
    termMonths: 24,
    creditScore: 750,
    aiApproved: null,
    clientProducts: { nomina: true, tdc: true, seguroAuto: false, inversionPatrimonial: false, cuentaAhorro: true },
    kyc: {
      curp: "GORM920505MDFNZR01",
      rfc: "GORM920505GH4",
      birthDate: "1992-05-05",
      nationality: "Mexicana",
      address: "Puebla, PUE",
      phone: "+52 222 333 4444",
      email: "maria.gonzalez@email.com",
      idVerified: true,
      pep: false,
      incomeMonthly: 45_000,
    },
  },
  {
    id: "CL-PERS-002",
    productId: "PERS-LIB-01",
    name: "TechStart Solutions SA de CV",
    entityType: "PM",
    amount: 650_000,
    termMonths: 36,
    creditScore: 710,
    aiApproved: null,
    clientProducts: { nomina: false, tdc: true, seguroAuto: false, inversionPatrimonial: false, cuentaAhorro: true },
    kyc: {
      rfc: "TSS190601ABC",
      nationality: "Mexicana",
      address: "Santa Fe, CDMX",
      phone: "+52 55 4000 9000",
      email: "credito@techstart.mx",
      idVerified: true,
      pep: false,
    },
    kyb: {
      rfc: "TSS190601ABC",
      legalName: "TechStart Solutions SA de CV",
      sector: "Tecnología",
      employees: 45,
      annualRevenue: 12_000_000,
      beneficialOwnersVerified: true,
      amlRisk: "BAJO",
    },
  },
  {
    id: "CL-PERS-003",
    productId: "PERS-LIB-01",
    name: "Jorge Lima Herrera",
    entityType: "PF",
    amount: 95_000,
    termMonths: 12,
    creditScore: 610,
    aiApproved: null,
    clientProducts: { nomina: false, tdc: false, seguroAuto: false, inversionPatrimonial: false, cuentaAhorro: false },
    kyc: {
      curp: "LIHJ950707HDFMRR08",
      rfc: "LIHJ950707IJ5",
      birthDate: "1995-07-07",
      nationality: "Mexicana",
      address: "Querétaro, QRO",
      phone: "+52 442 111 2233",
      email: "jorge.lima@email.com",
      idVerified: true,
      pep: false,
      incomeMonthly: 22_000,
    },
  },
  {
    id: "CL-PERS-004",
    productId: "PERS-LIB-01",
    name: "Ana Lucía Méndez Torres",
    entityType: "PF",
    amount: 320_000,
    termMonths: 36,
    creditScore: 680,
    aiApproved: null,
    clientProducts: { nomina: true, tdc: false, seguroAuto: false, inversionPatrimonial: false, cuentaAhorro: true },
    kyc: {
      curp: "META880312MDFNDN05",
      rfc: "META880312KL3",
      birthDate: "1988-03-12",
      nationality: "Mexicana",
      address: "Monterrey, NL",
      phone: "+52 81 222 3344",
      email: "ana.mendez@email.com",
      idVerified: true,
      pep: false,
      incomeMonthly: 38_000,
    },
  },
  {
    id: "CL-PLAZO-001",
    productId: "PLAZO-CORP-01",
    name: "Inversiones del Norte SA",
    entityType: "PM",
    amount: 5_000_000,
    termMonths: 12,
    creditScore: 820,
    aiApproved: null,
    clientProducts: { nomina: false, tdc: false, seguroAuto: false, inversionPatrimonial: true, cuentaAhorro: true },
    kyc: {
      rfc: "INO850101XYZ",
      nationality: "Mexicana",
      address: "Monterrey, NL",
      phone: "+52 81 8000 1000",
      email: "tesoreria@inversionesnorte.mx",
      idVerified: true,
      pep: false,
    },
    kyb: {
      rfc: "INO850101XYZ",
      legalName: "Inversiones del Norte SA",
      sector: "Inversiones",
      employees: 120,
      annualRevenue: 85_000_000,
      beneficialOwnersVerified: true,
      amlRisk: "BAJO",
    },
  },
  {
    id: "CL-PLAZO-002",
    productId: "PLAZO-CORP-01",
    name: "Laura Vega Castillo",
    entityType: "PF",
    amount: 800_000,
    termMonths: 6,
    creditScore: 760,
    aiApproved: null,
    clientProducts: { nomina: true, tdc: true, seguroAuto: false, inversionPatrimonial: false, cuentaAhorro: true },
    kyc: {
      curp: "VECL870303MDFGSR04",
      rfc: "VECL870303KL6",
      birthDate: "1987-03-03",
      nationality: "Mexicana",
      address: "CDMX",
      phone: "+52 55 2222 8888",
      email: "laura.vega@email.com",
      idVerified: true,
      pep: false,
      incomeMonthly: 120_000,
    },
  },
  {
    id: "CL-PLAZO-003",
    productId: "PLAZO-CORP-01",
    name: "Grupo Delta Industrial SA",
    entityType: "PM",
    amount: 12_000_000,
    termMonths: 12,
    creditScore: 795,
    aiApproved: null,
    clientProducts: { nomina: true, tdc: true, seguroAuto: false, inversionPatrimonial: false, cuentaAhorro: true },
    kyc: {
      rfc: "GDI780615ABC",
      nationality: "Mexicana",
      address: "Tijuana, BC",
      phone: "+52 664 900 4500",
      email: "finanzas@grupodelta.mx",
      idVerified: true,
      pep: false,
    },
    kyb: {
      rfc: "GDI780615ABC",
      legalName: "Grupo Delta Industrial SA",
      sector: "Manufactura",
      employees: 380,
      annualRevenue: 210_000_000,
      beneficialOwnersVerified: true,
      amlRisk: "MEDIO",
    },
  },
];

function emptyCrossSellAccepted(): Record<string, boolean> {
  const acc: Record<string, boolean> = {};
  Object.values(DEFAULT_CROSS_SELL).flat().forEach((o) => {
    acc[o.id] = false;
  });
  return acc;
}

export const SCOTIA_CREDIT_SEED: CreditDemoState = {
  version: 4,
  products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
  clients: JSON.parse(JSON.stringify(CLIENTS)),
  rulesByCategory: JSON.parse(JSON.stringify(DEFAULT_RULES)),
  crossSellByCategory: JSON.parse(JSON.stringify(DEFAULT_CROSS_SELL)),
  selectedProductId: "AUTO-EV-01",
  selectedClientId: "CL-AUTO-001",
  crossSellAccepted: emptyCrossSellAccepted(),
  aiVerificationRun: false,
  aiBatchResults: [],
  quote: null,
  quoteFixed: false,
  quoteFixedAt: null,
  managerApproved: false,
  auditLog: [
    {
      id: "credit-audit-seed",
      timestamp: new Date().toISOString(),
      action: "SEED",
      details: "Catálogo CORTEX v4 · 10 clientes · Juan Hernandez (AUTO-EV-01)",
      user: "Admin Producto",
      channel: "Consola",
      correlationId: "corr-seed-002",
    },
  ],
};

export function createFreshCreditDemoState(): CreditDemoState {
  return JSON.parse(JSON.stringify(SCOTIA_CREDIT_SEED)) as CreditDemoState;
}

/** Incorpora clientes nuevos del seed sin perder estado de cotización del usuario. */
export function mergeCreditDemoState(stored: CreditDemoState): CreditDemoState {
  if (stored.version >= 4) return stored;
  const fresh = createFreshCreditDemoState();
  const ids = new Set(stored.clients.map((c) => c.id));
  const added = fresh.clients.filter((c) => !ids.has(c.id));
  if (added.length === 0) {
    return { ...stored, version: 4 };
  }
  return {
    ...stored,
    version: 4,
    clients: [...stored.clients, ...added],
    auditLog: [
      {
        id: `credit-audit-migrate-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "MIGRATE_CLIENTS",
        details: `CORTEX v4 · +${added.length} cliente(s): ${added.map((c) => c.name).join(", ")}`,
        user: "Sistema",
        channel: "Consola",
        correlationId: `corr-migrate-${Date.now()}`,
      },
      ...stored.auditLog,
    ].slice(0, 50),
  };
}

export function getProduct(state: CreditDemoState, productId = state.selectedProductId) {
  return state.products.find((p) => p.id === productId)!;
}

export function getClient(state: CreditDemoState, clientId = state.selectedClientId) {
  return state.clients.find((c) => c.id === clientId)!;
}

export function clientsForProduct(state: CreditDemoState, productId = state.selectedProductId) {
  return state.clients.filter((c) => c.productId === productId);
}
