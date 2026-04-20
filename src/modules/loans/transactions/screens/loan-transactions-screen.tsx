"use client";

import React, { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";

import { useI18n } from "@/providers/i18n-provider";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { LoanTransaction } from "../types/loan-transaction.types";
import { loanTransactionsService } from "../services/loan-transactions.service";
import { LoanTransactionsTable } from "../components/loan-transactions-table";
import { LoanTransactionsFilters } from "../components/loan-transactions-filters";

import "@/components/ui/templates/workspace-page.css";
import "./loan-transactions-screen.css";

export const LoanTransactionsScreen: React.FC = () => {
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await loanTransactionsService.getTransactions();
        setTransactions(data);
      } catch (error) {
        console.error("Failed to load loan transactions:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="zelify-workspace-page zelify-loan-transactions-page">
      <ZelifyTopNavbar activeNavId="loanTransactions" />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <header className="zelify-workspace-page__header">
            <div className="zelify-workspace-page__title-stack">
              <h1 className="zelify-workspace-page__title">
                {t("nav.top.loanTransactions")}
              </h1>
              <p className="zelify-workspace-page__subtitle">
                {t("loans.transactions.subtitle")}
              </p>
            </div>
            <div className="zelify-workspace-page__actions">
              <button className="zelify-action-btn zelify-action-btn--secondary">
                <Download size={18} />
                <span>{t("loans.common.export")}</span>
              </button>
              <button
                className="zelify-action-btn zelify-action-btn--secondary"
                onClick={() => {
                  setLoading(true);
                  loanTransactionsService.getTransactions().then((data) => {
                    setTransactions(data);
                    setLoading(false);
                  });
                }}
              >
                <RefreshCw size={18} className={loading ? "zelify-loan-transactions-spin" : ""} />
              </button>
            </div>
          </header>

          <section className="zelify-workspace-page__filters">
            <LoanTransactionsFilters />
          </section>

          <main className="zelify-workspace-page__content">
            {loading ? (
              <div className="zelify-loading-state">
                <p>{t("loans.transactions.loading")}</p>
              </div>
            ) : (
              <LoanTransactionsTable transactions={transactions} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
