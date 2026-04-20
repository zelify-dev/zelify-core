import type { CurrencyInUseRow } from "../types/financial-currency.types";

export const mockCurrenciesInUse: CurrencyInUseRow[] = [
  {
    id: "usd",
    code: "USD",
    numericalCode: "840",
    name: "United States dollar",
    symbol: "$",
    kind: "FIAT",
    isBase: true,
  },
  {
    id: "btc",
    code: "BTC",
    numericalCode: null,
    name: "Bitcoin",
    symbol: "BTC",
    kind: "CRYPTO",
    isBase: false,
  },
  {
    id: "cashback",
    code: "CASHBACK",
    numericalCode: null,
    name: "Allpoints",
    symbol: "PT",
    kind: "NON_TRADITIONAL",
    isBase: false,
  },
  {
    id: "chf",
    code: "CHF",
    numericalCode: "756",
    name: "Swiss franc",
    symbol: "Fr.",
    kind: "FIAT",
    isBase: false,
  },
  {
    id: "pln",
    code: "PLN",
    numericalCode: "985",
    name: "Polish złoty",
    symbol: "zł",
    kind: "FIAT",
    isBase: false,
  },
];
