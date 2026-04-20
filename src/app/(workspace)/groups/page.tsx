import { Suspense } from "react";
import { GroupsListScreen } from "@/modules/groups/screens/groups-list-screen";
import "@/components/ui/templates/workspace-page.css";

function GroupsRouteFallback() {
  return (
    <div className="zelify-workspace-page">
      <div className="zelify-workspace-page__loading" style={{ minHeight: "240px" }}>
        <div className="zelify-workspace-page__spinner" aria-hidden />
        <span>Loading groups...</span>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  return (
    <Suspense fallback={<GroupsRouteFallback />}>
      <GroupsListScreen />
    </Suspense>
  );
}
