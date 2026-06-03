export type RuleDataType = "string" | "number" | "boolean" | "date" | "percentage";
export type RuleOperator = "equals" | "notEquals" | "gt" | "gte" | "lt" | "lte" | "contains" | "between";
export type RuleSeverity = "pass" | "warn" | "fail";
export type RuleProduct = "Credito automotriz" | "Credito personal";

export type CreditRuleRow = {
  id: string;
  name: string;
  products: RuleProduct[];
  field: string;
  operator: RuleOperator;
  value: string;
  dataType: RuleDataType;
  status: "active" | "inactive";
  description: string;
  createdAt: string;
  severity: RuleSeverity;
  decisionBands?: {
    approveMin?: number;
    approveMax?: number;
    reviewMin?: number;
    reviewMax?: number;
    rejectMin?: number;
    rejectMax?: number;
  };
};

export const creditRulesMock: CreditRuleRow[] = [
  {
    id: "cr-1",
    name: "Edad minima",
    products: ["Credito automotriz", "Credito personal"],
    field: "applicant.age",
    operator: "gte",
    value: "18",
    dataType: "number",
    status: "active",
    description: "El solicitante debe ser mayor de edad.",
    createdAt: "2026-04-12T10:00:00Z",
    severity: "fail",
  },
  {
    id: "cr-2",
    name: "DTI maximo",
    products: ["Credito automotriz", "Credito personal"],
    field: "ratios.dti",
    operator: "lte",
    value: "<= 0.36 aprueba · 0.36-0.49 revision · >= 0.50 rechaza",
    dataType: "percentage",
    status: "active",
    description: "Relacion deuda / ingreso (DTI) con bandas de aprobacion, revision y rechazo.",
    createdAt: "2026-04-18T14:20:00Z",
    severity: "warn",
    decisionBands: {
      approveMax: 0.36,
      reviewMin: 0.36,
      reviewMax: 0.5,
      rejectMin: 0.5,
    },
  },
  {
    id: "cr-3",
    name: "Score crediticio minimo",
    products: ["Credito automotriz", "Credito personal"],
    field: "bureau.score",
    operator: "gte",
    value: "620",
    dataType: "number",
    status: "active",
    description: "Umbral base de score para elegibilidad crediticia.",
    createdAt: "2026-04-20T09:15:00Z",
    severity: "fail",
  },
  {
    id: "cr-4",
    name: "Atraso maximo reciente",
    products: ["Credito automotriz", "Credito personal"],
    field: "credit.maxDaysPastDue",
    operator: "lte",
    value: "29",
    dataType: "number",
    status: "active",
    description: "No se permiten atrasos mayores a 29 dias en el historial reciente.",
    createdAt: "2026-05-01T16:40:00Z",
    severity: "fail",
  },
  {
    id: "cr-5",
    name: "Antiguedad minima de historial",
    products: ["Credito automotriz", "Credito personal"],
    field: "credit.historyMonths",
    operator: "gte",
    value: "12",
    dataType: "number",
    status: "active",
    description: "Historial crediticio minimo recomendado de 12 meses.",
    createdAt: "2026-05-06T11:05:00Z",
    severity: "warn",
  },
  {
    id: "cr-6",
    name: "Ingreso mensual minimo",
    products: ["Credito personal"],
    field: "income.monthlyNet",
    operator: "gte",
    value: "12000",
    dataType: "number",
    status: "active",
    description: "Ingreso neto mensual minimo requerido para elegibilidad.",
    createdAt: "2026-05-04T11:05:00Z",
    severity: "warn",
  },
  {
    id: "cr-7",
    name: "Antiguedad laboral minima",
    products: ["Credito personal"],
    field: "employment.months",
    operator: "gte",
    value: "6",
    dataType: "number",
    status: "active",
    description: "Se requiere estabilidad laboral minima para credito personal.",
    createdAt: "2026-05-08T10:00:00Z",
    severity: "warn",
  },
  {
    id: "cr-8",
    name: "Ingreso minimo para automotriz",
    products: ["Credito automotriz"],
    field: "income.monthlyNet",
    operator: "gte",
    value: "18000",
    dataType: "number",
    status: "active",
    description: "Ingreso neto mensual minimo requerido para financiamiento automotriz.",
    createdAt: "2026-05-09T11:30:00Z",
    severity: "fail",
  },
];
