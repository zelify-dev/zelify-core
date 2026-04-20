import { ApiRouteInsightsScreen } from "@/modules/workspace/screens/api-route-insights-screen";

type LoansPageProps = {
  searchParams?: { view?: string };
};

export default function LoansPage({ searchParams }: LoansPageProps) {
  return <ApiRouteInsightsScreen pathKey="loans" view={searchParams?.view} />;
}
