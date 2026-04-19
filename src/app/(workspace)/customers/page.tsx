"use client";

import { useState } from "react";
import { CustomersTable } from "@/components/ui/organisms/customers/customers-table";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { WorkspaceShell } from "@/components/ui/templates/workspace-shell/workspace-shell";
import { TableFilters } from "@/components/ui/molecules/table-filters/table-filters";

import "@/components/home-screen.css";

export default function CustomersPage() {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <WorkspaceShell>
    <main className="zelify-home">
      <div className="zelify-home__content">
        <header className="zelify-home__hero">
          <div className="zelify-home__hero-body">
            <h1 className="zelify-home__title">Clients List</h1>
            <p className="zelify-home__subtitle">
              Manage all individual and corporate clients, monitor their states and credit risk in real-time.
            </p>
            
            <div style={{ marginTop: "24px" }}>
              <AppButton 
                tone="secondary" 
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "is-active" : ""}
              >
                <FilterIcon />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </AppButton>
            </div>
          </div>
        </header>

        <TableFilters isVisible={showFilters} onClear={() => {}} />

        <section className="zelify-panel" style={{ marginTop: "32px" }}>
          <div className="zelify-panel__header">
            <h2 className="zelify-panel__title">Operational Listing</h2>
          </div>
          <CustomersTable />
        </section>
      </div>
    </main>
    </WorkspaceShell>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "-2px" }}>
      <path d="M1.75 3.5H12.25M4.08333 7H9.91667M6.41667 10.5H7.58333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
