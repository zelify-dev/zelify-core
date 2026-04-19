"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { FinancialTableRowActions } from "@/modules/settings/components/financial-table-row-actions/financial-table-row-actions";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { CreateLoanProductModal } from "@/modules/settings/components/create-loan-product-modal/create-loan-product-modal";
import { mockAdminProductsDeposits } from "../data/admin-products-deposits.mock";
import { mockAdminProductsLoans } from "../data/admin-products-loans.mock";
import type { AdminProductKind, AdminProductRow } from "../types/admin-product.types";

import "@/components/ui/templates/workspace-page.css";

import "./products-settings-screen.css";

export function ProductsSettingsScreen() {
  const [kind, setKind] = useState<AdminProductKind>("loans");
  const [branch, setBranch] = useState("");
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [createLoanOpen, setCreateLoanOpen] = useState(false);

  const sourceRows = kind === "loans" ? mockAdminProductsLoans : mockAdminProductsDeposits;

  const rows = useMemo(() => {
    if (showDeactivated) return sourceRows;
    return sourceRows.filter((p) => !p.isDeactivated);
  }, [sourceRows, showDeactivated]);

  return (
    <div className="zelify-products-settings">
      <div className="zelify-products-settings__tabs" role="tablist" aria-label="Product type">
        <button
          type="button"
          role="tab"
          aria-selected={kind === "loans"}
          className={["zelify-org-tab", kind === "loans" ? "is-active" : ""].filter(Boolean).join(" ")}
          onClick={() => setKind("loans")}
        >
          Loans
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={kind === "deposits"}
          className={["zelify-org-tab", kind === "deposits" ? "is-active" : ""].filter(Boolean).join(" ")}
          onClick={() => setKind("deposits")}
        >
          Deposits
        </button>
      </div>

      <div className="zelify-products-settings__toolbar">
        <div className="zelify-products-settings__branch-field">
          <AppSelect
            id="products-branch"
            size="md"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            aria-label="Branch"
          >
            <option value="">All Branches</option>
            <option value="milan">Milan Main</option>
            <option value="madrid">Madrid Central</option>
            <option value="northern">Northern Italy Cluster</option>
          </AppSelect>
          <span className="zelify-products-settings__branch-icon" aria-hidden>
            <Home size={18} strokeWidth={1.75} />
          </span>
        </div>
        <AppButton type="button" tone="primary">
          Filter
        </AppButton>
      </div>

      <div className="zelify-products-settings__checkbox">
        <AppCheckbox
          id="products-show-deactivated"
          checked={showDeactivated}
          onChange={(e) => setShowDeactivated(e.target.checked)}
          label="Show deactivated products"
        />
      </div>

      <div className="zelify-products-settings__table-wrap">
        <ProductsTable rows={rows} productKind={kind} />
      </div>

      {kind === "loans" ? (
        <div className="zelify-products-settings__create-loan">
          <AppButton type="button" tone="primary" onClick={() => setCreateLoanOpen(true)}>
            Create new loan product
          </AppButton>
        </div>
      ) : null}

      <CreateLoanProductModal open={createLoanOpen} onClose={() => setCreateLoanOpen(false)} />
    </div>
  );
}

function ProductsTable({
  rows,
  productKind,
}: {
  rows: AdminProductRow[];
  productKind: AdminProductKind;
}) {
  return (
    <SettingsDataTable variant="clients" className="zelify-products-settings__data-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>ID</th>
          <th>Product category</th>
          <th>Product type</th>
          <th>Last modified</th>
          <th>Active</th>
          <th className="zelify-settings-data-table__actions-col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <Link
                href="#"
                className="zelify-products-settings__product-link"
                onClick={(e) => e.preventDefault()}
              >
                {row.productName}
              </Link>
            </td>
            <td>
              <span className="zelify-mono">{row.productCode}</span>
            </td>
            <td>{row.category}</td>
            <td>{row.productType}</td>
            <td>{row.lastModified}</td>
            <td>
              <span
                className={`zelify-products-settings__active ${row.isActive ? "is-on" : "is-off"}`}
              >
                <span className="zelify-products-settings__active-dot" aria-hidden />
                {row.isActive ? "Activated" : "Deactivated"}
              </span>
            </td>
            <td className="is-actions">
              <FinancialTableRowActions rowLabel={`${productKind}-${row.id}`} />
            </td>
          </tr>
        ))}
      </tbody>
    </SettingsDataTable>
  );
}
