export type RuleDataType = "string" | "number" | "boolean" | "date" | "percentage";
export type RuleOperator = "equals" | "notEquals" | "gt" | "gte" | "lt" | "lte" | "contains" | "between";
export type RuleSeverity = "pass" | "warn" | "fail";

export type CreditRuleRow = {
  id: string;
  name: string;
  field: string;
  operator: RuleOperator;
  value: string;
  dataType: RuleDataType;
  status: "active" | "inactive";
  description: string;
  createdAt: string;
  severity: RuleSeverity;
};

export const creditRulesMock: CreditRuleRow[] = [
  {
    id: "cr-1",
    name: "Edad minima",
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
    field: "ratios.dti",
    operator: "lte",
    value: "0.45",
    dataType: "percentage",
    status: "active",
    description: "Rechazo si la relacion deuda/ingreso supera 45%.",
    createdAt: "2026-04-18T14:20:00Z",
    severity: "fail",
  },
  {
    id: "cr-3",
    name: "Score crediticio minimo",
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
    name: "Utilizacion de tarjetas",
    field: "cards.utilization",
    operator: "lte",
    value: "0.30",
    dataType: "percentage",
    status: "active",
    description: "Uso de linea de tarjeta recomendado maximo 30%.",
    createdAt: "2026-05-04T11:05:00Z",
    severity: "warn",
  },
  {
    id: "cr-6",
    name: "Consultas duras recientes",
    field: "credit.hardInquiries30d",
    operator: "lte",
    value: "3",
    dataType: "number",
    status: "active",
    description: "Evitar multiples solicitudes en poco tiempo.",
    createdAt: "2026-05-05T11:05:00Z",
    severity: "warn",
  },
  {
    id: "cr-7",
    name: "Antiguedad minima de historial",
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
    id: "cr-8",
    name: "Ingreso mensual minimo",
    field: "income.monthlyNet",
    operator: "gte",
    value: "12000",
    dataType: "number",
    status: "active",
    description: "Ingreso neto mensual minimo requerido para elegibilidad.",
    createdAt: "2026-05-04T11:05:00Z",
    severity: "warn",
  },
];
