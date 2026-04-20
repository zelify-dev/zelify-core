import { ApiRouteInsightsScreen } from "@/modules/workspace/screens/api-route-insights-screen";

type ReportsPageProps = {
  searchParams?: { view?: string };
};

export default function ReportsPage({ searchParams }: ReportsPageProps) {
  return <ApiRouteInsightsScreen pathKey="reports" view={searchParams?.view} />;
}
