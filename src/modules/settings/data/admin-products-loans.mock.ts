import type { AdminProductRow } from "../types/admin-product.types";

export const mockAdminProductsLoans: AdminProductRow[] = [
  {
    id: "bnpl-2jul",
    productName: "BNPL_2JUL",
    productCode: "BNPL2JUN",
    category: "Purchase Financing",
    productType: "Dynamic Term Loan",
    lastModified: "6 days ago",
    isActive: true,
    isDeactivated: false,
  },
  {
    id: "first-loan",
    productName: "First Loan",
    productCode: "LOAN001",
    category: "Personal Lending",
    productType: "Interest-Free Loan",
    lastModified: "12-06-2025",
    isActive: true,
    isDeactivated: false,
  },
  {
    id: "flex-term",
    productName: "Flex Term Personal",
    productCode: "FTP2024",
    category: "Personal Lending",
    productType: "Fixed Term Loan",
    lastModified: "02-07-2025",
    isActive: true,
    isDeactivated: false,
  },
  {
    id: "legacy-loan",
    productName: "Legacy promotional loan",
    productCode: "LEG99",
    category: "Personal Lending",
    productType: "Fixed Term Loan",
    lastModified: "30-01-2024",
    isActive: false,
    isDeactivated: true,
  },
];
