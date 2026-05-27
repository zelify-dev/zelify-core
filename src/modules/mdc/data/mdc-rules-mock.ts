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
    name: "DTI limite duro",
    field: "ratios.dti",
    operator: "lte",
    value: "0.50",
    dataType: "percentage",
    status: "active",
    description: "Rechazo si DTI supera el 50%.",
    createdAt: "2026-04-18T14:20:00Z",
    severity: "fail",
  },
  {
    id: "cr-3",
    name: "Score crediticio minimo",
    field: "bureau.score",
    operator: "lt",
    value: "650",
    dataType: "number",
    status: "active",
    description: "Score de buro por debajo de 650 dispara revision manual.",
    createdAt: "2026-04-20T09:15:00Z",
    severity: "warn",
  },
  {
    id: "cr-4",
    name: "Antiguedad laboral",
    field: "employment.months",
    operator: "gte",
    value: "6",
    dataType: "number",
    status: "inactive",
    description: "Minimo 6 meses en empleo actual.",
    createdAt: "2026-05-01T16:40:00Z",
    severity: "warn",
  },
  {
    id: "cr-5",
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
