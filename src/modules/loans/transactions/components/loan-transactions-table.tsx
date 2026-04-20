"use client";

import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppIconButton } from "@/components/ui/atoms/icon-button/app-icon-button";
import { LoanTransaction, LoanTransactionType, LoanTransactionStatus } from "../types/loan-transaction.types";
import { useI18n } from "@/providers/i18n-provider";

import "./loan-transactions-table.css";

interface LoanTransactionsTableProps {
  transactions: LoanTransaction[];
}

export const LoanTransactionsTable: React.FC<LoanTransactionsTableProps> = ({ transactions }) => {
  const { t } = useI18n();

  return (
    <div className="zelify-loan-tx-table">
      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>{t("loans.transactions.columns.id")}</th>
            <th>{t("loans.transactions.columns.date")}</th>
            <th>{t("loans.transactions.columns.type")}</th>
            <th>{t("loans.transactions.columns.account")}</th>
            <th className="is-numeric-header">{t("loans.transactions.columns.amount")}</th>
            <th className="is-numeric-header">{t("loans.transactions.columns.balance")}</th>
            <th>{t("loans.transactions.columns.status")}</th>
            <th className="is-actions-header">{t("loans.common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="is-mono-cell">{tx.id}</td>
              <td>{new Date(tx.creationDate).toLocaleString()}</td>
              <td>
                <AppBadge tone={typeToTone(tx.type)} size="sm">
                  {typeLabel(tx.type, t)}
                </AppBadge>
              </td>
              <td>
                <div className="zelify-loan-tx-table__account">
                  <span className="zelify-loan-tx-table__holder">{tx.accountHolder}</span>
                  <span className="zelify-loan-tx-table__acc-id">{tx.accountId}</span>
                </div>
              </td>
              <td className={`is-numeric-cell ${tx.amount < 0 ? 'is-negative' : 'is-positive'}`}>
                {formatCurrency(tx.amount)}
              </td>
              <td className="is-numeric-cell">{formatCurrency(tx.balance)}</td>
              <td>
                <AppBadge tone={statusToTone(tx.status)} size="sm">
                  {statusLabel(tx.status, t)}
                </AppBadge>
              </td>
              <td className="is-actions-cell">
                <AppIconButton
                  ariaLabel={t("loans.common.actionsAria").replace("{id}", tx.id)}
                >
                  <MoreHorizontal size={16} />
                </AppIconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>

      {/* Pagination Footer */}
      <div className="zelify-data-table-footer">
        <div className="zelify-data-table-footer__page-size">
          <span className="zelify-data-table-footer__info">{t("loans.common.show")}</span>
          <span className="zelify-data-table-footer__page-size-value">25</span>
        </div>
        <div className="zelify-data-table-footer__controls">
          <span className="zelify-data-table-footer__info">
            {t("loans.common.allCount").replace("{count}", String(transactions.length))}
          </span>
          <div className="zelify-data-table-footer__pages">
            <button type="button" className="zelify-pagination-btn" disabled>
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button type="button" className="zelify-pagination-btn" disabled>
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function typeLabel(type: LoanTransactionType, t: (k: string) => string): string {
  switch (type) {
    case LoanTransactionType.DISBURSEMENT: return t("loans.transactions.types.disbursement");
    case LoanTransactionType.REPAYMENT: return t("loans.transactions.types.repayment");
    case LoanTransactionType.INTEREST_APPLIED: return t("loans.transactions.types.interest");
    case LoanTransactionType.FEE_APPLIED: return t("loans.transactions.types.fee");
    case LoanTransactionType.ADJUSTMENT: return t("loans.transactions.types.adjustment");
    case LoanTransactionType.REPAYMENT_ADJUSTMENT: return t("loans.transactions.types.repaymentAdjustment");
    default: return type;
  }
}

function typeToTone(type: LoanTransactionType): "success" | "warning" | "neutral" | "error" {
  switch (type) {
    case LoanTransactionType.REPAYMENT: return "success";
    case LoanTransactionType.DISBURSEMENT: return "neutral";
    case LoanTransactionType.INTEREST_APPLIED: return "warning";
    case LoanTransactionType.FEE_APPLIED: return "warning";
    case LoanTransactionType.ADJUSTMENT: return "error";
    case LoanTransactionType.REPAYMENT_ADJUSTMENT: return "error";
    default: return "neutral";
  }
}

function statusLabel(status: LoanTransactionStatus, t: (k: string) => string): string {
  switch (status) {
    case LoanTransactionStatus.ENTERED: return t("loans.transactions.states.entered");
    case LoanTransactionStatus.PENDING: return t("loans.transactions.states.pending");
    case LoanTransactionStatus.REVERSED: return t("loans.transactions.states.reversed");
    default: return status;
  }
}

function statusToTone(status: LoanTransactionStatus): "success" | "warning" | "error" | "neutral" {
  switch (status) {
    case LoanTransactionStatus.ENTERED: return "success";
    case LoanTransactionStatus.PENDING: return "warning";
    case LoanTransactionStatus.REVERSED: return "error";
    default: return "neutral";
  }
}
