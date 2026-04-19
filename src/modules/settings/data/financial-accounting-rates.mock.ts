import type { AccountingRateRow } from "../types/financial-currency.types";

export const mockAccountingRates: AccountingRateRow[] = [
  { id: "btc", code: "BTC", name: "Bitcoin", rate: 95000, dateSet: "27-05-2025" },
  { id: "cashback", code: "CASHBACK", name: "Allpoints", rate: 1, dateSet: "20-06-2025" },
  { id: "chf", code: "CHF", name: "Swiss franc", rate: null, dateSet: null },
  { id: "pln", code: "PLN", name: "Polish złoty", rate: null, dateSet: null },
  { id: "usd", code: "USD", name: "United States dollar", rate: 1.2, dateSet: "30-07-2025" },
];
