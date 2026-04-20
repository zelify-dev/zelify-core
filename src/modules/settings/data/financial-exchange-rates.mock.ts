import type { ExchangeRateRow } from "../types/financial-currency.types";

/** Tasas de referencia respecto al dólar (USD) como divisa base. */
export const mockExchangeRatesFromUsd: ExchangeRateRow[] = [
  {
    id: "btc",
    code: "BTC",
    name: "Bitcoin",
    buyRate: 0.000014,
    sellRate: 0.000013,
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
    buyRate: 3.95,
    sellRate: 4.02,
    dateSet: "01-08-2025",
  },
];
