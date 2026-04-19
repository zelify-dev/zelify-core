export type AdminProductKind = "loan" | "deposit";

export type AdminProductRow = {
  id: string;
  productName: string;
  productCode: string;
  category: string;
  productType: string;
  lastModified: string;
  isActive: boolean;
  isDeactivated: boolean;
};
