import { Suspense } from "react";

import { CustomersListScreen } from "@/modules/customers/screens/customers-list-screen";

import "@/components/ui/templates/workspace-page.css";

function CustomersRouteFallback() {
  return (
    <div className="zelify-workspace-page">
      <div className="zelify-workspace-page__loading" style={{ minHeight: "240px" }}>
        <div className="zelify-workspace-page__spinner" aria-hidden />
        <span>Loading...</span>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<CustomersRouteFallback />}>
      <CustomersListScreen />
    </Suspense>
  );
}
