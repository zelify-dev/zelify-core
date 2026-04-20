import { LoansScreen } from "@/modules/loans/screens/loans-screen";
import { ApiRouteInsightsScreen } from "@/modules/workspace/screens/api-route-insights-screen";

type LoansPageProps = {
  searchParams?: { view?: string };
};

export default function LoansPage({ searchParams }: LoansPageProps) {
  const view = searchParams?.view;

  if (view === "pendiente-desembolso" || view === "renegociada") {
    return <LoansScreen />;
  }

  return <ApiRouteInsightsScreen pathKey="loans" view={view} />;
}
