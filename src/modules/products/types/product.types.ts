export type ProductKind = "DEPOSIT" | "LOAN";

export type DepositProductType = "CURRENT_ACCOUNT" | "SAVINGS_PLAN" | "FIXED_DEPOSIT";
export type LoanPaymentMethod = "EQUATED_INSTALLMENTS" | "DECLINING_BALANCE";
export type RepaymentFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export type BaseProduct = {
  id: string;
  name: string;
  kind: ProductKind;
  active: boolean;
  minAmount: number;
  maxAmount: number;
  minInterestRate: number;
  maxInterestRate: number;
  updatedAt: string;
};

export type DepositProduct = BaseProduct & {
  kind: "DEPOSIT";
  productType: DepositProductType;
  overdraftAllowed: boolean;
  overdraftLimit: number;
  interestRateSettings: "FIXED" | "TIERED";
};

export type LoanProduct = BaseProduct & {
  kind: "LOAN";
  paymentMethod: LoanPaymentMethod;
  gracePeriodInstallments: number;
  maxInstallments: number;
  repaymentFrequency: RepaymentFrequency;
  collateralRequired: boolean;
};

export type Product = DepositProduct | LoanProduct;

export type ProductFormInput = {
  id?: string;
  name: string;
  kind: ProductKind;
  minAmount: number;
  maxAmount: number;
  minInterestRate: number;
  maxInterestRate: number;
  // deposit
  productType?: DepositProductType;
  overdraftAllowed?: boolean;
  overdraftLimit?: number;
  interestRateSettings?: "FIXED" | "TIERED";
  // loan
  paymentMethod?: LoanPaymentMethod;
  gracePeriodInstallments?: number;
  maxInstallments?: number;
  repaymentFrequency?: RepaymentFrequency;
  collateralRequired?: boolean;
};
