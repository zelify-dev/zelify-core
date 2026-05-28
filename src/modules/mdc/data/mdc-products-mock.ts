export type ProductStatus = "ACTIVO" | "INACTIVO" | "BORRADOR" | "SUSPENDIDO";

export type MdcProduct = {
  id: string;
  name: string;
  description: string;
  status: ProductStatus;
  metrics: {
    activeClients: number;
    totalPortfolio: number;
  };
  configuration: {
    interestRate: { min: number; max: number };
    amount: { min: number; max: number };
    residualAmount: number;
    term: { min: number; max: number; frequency: string };
  };
};

export const MDC_PRODUCTS: MdcProduct[] = [
  {
    id: "product_001",
    name: "Credito automotriz",
    description: "Financiamiento para compra de vehiculos.",
    status: "ACTIVO",
    metrics: {
      activeClients: 10,
      totalPortfolio: 5_460_000,
    },
    configuration: {
      interestRate: { min: 13, max: 15 },
      amount: { min: 100_000, max: 2_500_000 },
      residualAmount: 20,
      term: { min: 12, max: 60, frequency: "mensual" },
    },
  },
  {
    id: "product_002",
    name: "Credito personal",
    description: "Financiamiento para consumo y necesidades personales.",
    status: "ACTIVO",
    metrics: {
      activeClients: 8,
      totalPortfolio: 1_880_000,
    },
    configuration: {
      interestRate: { min: 19, max: 22 },
      amount: { min: 25_000, max: 800_000 },
      residualAmount: 0,
      term: { min: 6, max: 48, frequency: "mensual" },
    },
  },
];

export function formatMdcNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}
