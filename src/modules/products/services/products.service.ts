import type {
  DepositProduct,
  LoanProduct,
  Product,
  ProductFormInput,
  ProductKind,
} from "../types/product.types";

const DEPOSIT_PRODUCTS: DepositProduct[] = [
  {
    id: "DEP-PROD-001",
    name: "Ahorro Programado",
    kind: "DEPOSIT",
    active: true,
    minAmount: 50,
    maxAmount: 50000,
    minInterestRate: 1.5,
    maxInterestRate: 6.5,
    updatedAt: "2026-04-18",
    productType: "SAVINGS_PLAN",
    overdraftAllowed: false,
    overdraftLimit: 0,
    interestRateSettings: "TIERED",
  },
  {
    id: "DEP-PROD-002",
    name: "Cuenta Nomina",
    kind: "DEPOSIT",
    active: true,
    minAmount: 0,
    maxAmount: 100000,
    minInterestRate: 0.1,
    maxInterestRate: 2.1,
    updatedAt: "2026-04-12",
    productType: "CURRENT_ACCOUNT",
    overdraftAllowed: true,
    overdraftLimit: 1200,
    interestRateSettings: "FIXED",
  },
];

const LOAN_PRODUCTS: LoanProduct[] = [
  {
    id: "LOAN-PROD-001",
    name: "Microcredito Agricola",
    kind: "LOAN",
    active: true,
    minAmount: 500,
    maxAmount: 5000,
    minInterestRate: 8,
    maxInterestRate: 18,
    updatedAt: "2026-04-20",
    paymentMethod: "DECLINING_BALANCE",
    gracePeriodInstallments: 1,
    maxInstallments: 24,
    repaymentFrequency: "MONTHLY",
    collateralRequired: false,
  },
  {
    id: "LOAN-PROD-002",
    name: "Credito Comercial Pyme",
    kind: "LOAN",
    active: true,
    minAmount: 3000,
    maxAmount: 50000,
    minInterestRate: 9.5,
    maxInterestRate: 21,
    updatedAt: "2026-04-15",
    paymentMethod: "EQUATED_INSTALLMENTS",
    gracePeriodInstallments: 2,
    maxInstallments: 36,
    repaymentFrequency: "MONTHLY",
    collateralRequired: true,
  },
];

let DB: Product[] = [...DEPOSIT_PRODUCTS, ...LOAN_PRODUCTS];

function wait<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

export const productsService = {
  getDepositProducts: async () => wait(DB.filter((p) => p.kind === "DEPOSIT") as DepositProduct[]),

  getLoanProducts: async () => wait(DB.filter((p) => p.kind === "LOAN") as LoanProduct[]),

  getProductById: async (id: string) => wait(DB.find((p) => p.id === id) ?? null),

  getAllProducts: async () => wait([...DB]),

  createProduct: async (payload: ProductFormInput) => {
    const id = payload.id?.trim() || `${payload.kind === "DEPOSIT" ? "DEP" : "LOAN"}-PROD-${String(DB.length + 1).padStart(3, "0")}`;
    const base = {
      id,
      name: payload.name.trim(),
      kind: payload.kind,
      active: true,
      minAmount: payload.minAmount,
      maxAmount: payload.maxAmount,
      minInterestRate: payload.minInterestRate,
      maxInterestRate: payload.maxInterestRate,
      updatedAt: new Date().toISOString().slice(0, 10),
    } as const;

    const next: Product =
      payload.kind === "DEPOSIT"
        ? {
            ...base,
            kind: "DEPOSIT",
            productType: payload.productType ?? "SAVINGS_PLAN",
            overdraftAllowed: Boolean(payload.overdraftAllowed),
            overdraftLimit: payload.overdraftLimit ?? 0,
            interestRateSettings: payload.interestRateSettings ?? "FIXED",
          }
        : {
            ...base,
            kind: "LOAN",
            paymentMethod: payload.paymentMethod ?? "EQUATED_INSTALLMENTS",
            gracePeriodInstallments: payload.gracePeriodInstallments ?? 0,
            maxInstallments: payload.maxInstallments ?? 12,
            repaymentFrequency: payload.repaymentFrequency ?? "MONTHLY",
            collateralRequired: Boolean(payload.collateralRequired),
          };

    DB = [next, ...DB];
    return wait(next);
  },

  updateProduct: async (id: string, payload: ProductFormInput) => {
    DB = DB.map((p) => {
      if (p.id !== id) return p;
      if (p.kind === "DEPOSIT") {
        return {
          ...p,
          name: payload.name,
          minAmount: payload.minAmount,
          maxAmount: payload.maxAmount,
          minInterestRate: payload.minInterestRate,
          maxInterestRate: payload.maxInterestRate,
          productType: payload.productType ?? p.productType,
          overdraftAllowed: payload.overdraftAllowed ?? p.overdraftAllowed,
          overdraftLimit: payload.overdraftLimit ?? p.overdraftLimit,
          interestRateSettings: payload.interestRateSettings ?? p.interestRateSettings,
          updatedAt: new Date().toISOString().slice(0, 10),
        };
      }
      return {
        ...p,
        name: payload.name,
        minAmount: payload.minAmount,
        maxAmount: payload.maxAmount,
        minInterestRate: payload.minInterestRate,
        maxInterestRate: payload.maxInterestRate,
        paymentMethod: payload.paymentMethod ?? p.paymentMethod,
        gracePeriodInstallments: payload.gracePeriodInstallments ?? p.gracePeriodInstallments,
        maxInstallments: payload.maxInstallments ?? p.maxInstallments,
        repaymentFrequency: payload.repaymentFrequency ?? p.repaymentFrequency,
        collateralRequired: payload.collateralRequired ?? p.collateralRequired,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
    });
    return wait(DB.find((p) => p.id === id) ?? null);
  },

  deleteProduct: async (id: string) => {
    DB = DB.filter((p) => p.id !== id);
    return wait({ ok: true as const });
  },

  toggleProductActive: async (id: string) => {
    DB = DB.map((p) => (p.id === id ? { ...p, active: !p.active, updatedAt: new Date().toISOString().slice(0, 10) } : p));
    return wait(DB.find((p) => p.id === id) ?? null);
  },
};

export const mockMambuEndpoints = {
  listEndpoint: (kind: ProductKind) => (kind === "DEPOSIT" ? "GET /depositproducts" : "GET /loanproducts"),
  detailEndpoint: (kind: ProductKind, id: string) =>
    kind === "DEPOSIT" ? `GET /depositproducts/${id}` : `GET /loanproducts/${id}`,
};
