import { ApiRouteInsightsScreen } from "@/modules/workspace/screens/api-route-insights-screen";

type GroupsPageProps = {
  searchParams?: { view?: string };
};

export default function GroupsPage({ searchParams }: GroupsPageProps) {
  return <ApiRouteInsightsScreen pathKey="groups" view={searchParams?.view} />;
}
