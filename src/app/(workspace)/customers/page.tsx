import { ApiRouteInsightsScreen } from "@/modules/workspace/screens/api-route-insights-screen";

type CustomersPageProps = {
  searchParams?: { view?: string };
};

export default function CustomersPage({ searchParams }: CustomersPageProps) {
  return <ApiRouteInsightsScreen pathKey="customers" view={searchParams?.view} />;
}
