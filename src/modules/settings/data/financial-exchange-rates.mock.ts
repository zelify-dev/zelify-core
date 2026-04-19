import type { ExchangeRateRow } from "../types/financial-currency.types";

export const mockExchangeRatesFromEur: ExchangeRateRow[] = [
  {
    id: "btc",
    code: "BTC",
    name: "Bitcoin",
    buyRate: 0.000012,
    sellRate: 0.000011,
    dateSet: "27-05-2025",
  },
  {
    id: "cashback",
    code: "CASHBACK",
    name: "Allpoints",
    buyRate: 1,
    sellRate: 1,
    dateSet: "20-06-2025",
  },
  {
    id: "chf",
    code: "CHF",
    name: "Swiss franc",
    buyRate: null,
    sellRate: null,
    dateSet: null,
  },
  {
    id: "pln",
    code: "PLN",
    name: "Polish złoty",
    buyRate: 4.28,
    sellRate: 4.32,
    dateSet: "01-08-2025",
  },
  {
    id: "usd",
    code: "USD",
    name: "United States dollar",
    buyRate: 1.08,
    sellRate: 1.1,
    dateSet: "30-07-2025",
  },
];
