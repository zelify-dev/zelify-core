export type ProductStatus = "ACTIVO" | "INACTIVO" | "BORRADOR" | "SUSPENDIDO";
export type MdcApplicantMode = "natural" | "moral";

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

export const NATURAL_MDC_PRODUCTS: MdcProduct[] = [
  {
    id: "prod_1",
    name: "ADELANTO DE NOMINA",
    description: "CREDITO SIMPLE - CONSUMO",
    status: "ACTIVO",
    metrics: { activeClients: 0, totalPortfolio: 0 },
    configuration: {
      interestRate: { min: 0.0, max: 0.0 },
      amount: { min: 5000, max: 10000 },
      residualAmount: 0,
      term: { min: 6, max: 6, frequency: "catorcenal" },
    },
  },
  {
    id: "prod_2",
    name: "PD PEMEX 52 CAT",
    description: "CREDITO SIMPLE - CONSUMO",
    status: "ACTIVO",
    metrics: { activeClients: 0, totalPortfolio: 0 },
    configuration: {
      interestRate: { min: 54.5110, max: 54.5110 },
      amount: { min: 2000, max: 300000 },
      residualAmount: 0,
      term: { min: 52, max: 52, frequency: "catorcenal" },
    },
  },
  {
    id: "prod_3",
    name: "PD PEMEX 78 CAT",
    description: "CREDITO SIMPLE - CONSUMO",
    status: "ACTIVO",
    metrics: { activeClients: 0, totalPortfolio: 0 },
    configuration: {
      interestRate: { min: 51.7292, max: 51.7292 },
      amount: { min: 5000, max: 300000 },
      residualAmount: 0,
      term: { min: 78, max: 78, frequency: "catorcenal" },
    },
  },
  {
    id: "prod_4",
    name: "PEMEX 52 CAT SIND",
    description: "CREDITO SIMPLE - CONSUMO",
    status: "ACTIVO",
    metrics: { activeClients: 0, totalPortfolio: 0 },
    configuration: {
      interestRate: { min: 54.5110, max: 54.5110 },
      amount: { min: 2000, max: 300000 },
      residualAmount: 0,
      term: { min: 52, max: 52, frequency: "catorcenal" },
    },
  },
  {
    id: "prod_5",
    name: "PEMEX 78 CAT TASA 33%",
    description: "CREDITO SIMPLE - CONSUMO",
    status: "ACTIVO",
    metrics: { activeClients: 0, totalPortfolio: 0 },
    configuration: {
      interestRate: { min: 51.7292, max: 51.7292 },
      amount: { min: 2000, max: 300000 },
      residualAmount: 0,
      term: { min: 78, max: 78, frequency: "catorcenal" },
    },
  },
  {
    id: "prod_6",
    name: "REFI 78 CAT",
    description: "CREDITO SIMPLE - CONSUMO",
    status: "ACTIVO",
    metrics: { activeClients: 0, totalPortfolio: 0 },
    configuration: {
      interestRate: { min: 51.7292, max: 51.7292 },
      amount: { min: 2000, max: 300000 },
      residualAmount: 0,
      term: { min: 78, max: 78, frequency: "catorcenal" },
    },
  }
];

export const MORAL_MDC_PRODUCTS: MdcProduct[] = [
  {
    id: "pm_product_001",
    name: "Credito simple empresarial",
    description: "Financiamiento para expansion, equipo y necesidades de capital de empresas constituidas en Mexico.",
    status: "ACTIVO",
    metrics: {
      activeClients: 14,
      totalPortfolio: 42_800_000,
    },
    configuration: {
      interestRate: { min: 14.5, max: 18.5 },
      amount: { min: 1_000_000, max: 25_000_000 },
      residualAmount: 0,
      term: { min: 12, max: 60, frequency: "mensual" },
    },
  },
  {
    id: "pm_product_002",
    name: "Credito revolvente",
    description: "Linea revolvente para necesidades operativas, inventario y tesoreria de empresas medianas.",
    status: "ACTIVO",
    metrics: {
      activeClients: 11,
      totalPortfolio: 28_600_000,
    },
    configuration: {
      interestRate: { min: 13.8, max: 17.2 },
      amount: { min: 750_000, max: 18_000_000 },
      residualAmount: 0,
      term: { min: 6, max: 36, frequency: "mensual" },
    },
  },
  {
    id: "pm_product_003",
    name: "Arrendamiento financiero",
    description: "Estructura para adquisicion de equipo, flotilla o activo productivo con garantia sobre el bien.",
    status: "ACTIVO",
    metrics: {
      activeClients: 9,
      totalPortfolio: 36_100_000,
    },
    configuration: {
      interestRate: { min: 12.9, max: 16.4 },
      amount: { min: 1_500_000, max: 30_000_000 },
      residualAmount: 10,
      term: { min: 24, max: 72, frequency: "mensual" },
    },
  },
];

export const MDC_PRODUCTS_BY_MODE: Record<MdcApplicantMode, MdcProduct[]> = {
  natural: NATURAL_MDC_PRODUCTS,
  moral: MORAL_MDC_PRODUCTS,
};

export const MDC_PRODUCTS = NATURAL_MDC_PRODUCTS;

export function formatMdcNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}
