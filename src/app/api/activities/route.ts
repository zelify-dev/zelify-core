import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSystemActivitiesSlice, SYSTEM_ACTIVITIES_TOTAL } from "@/modules/activities/data/system-activities.mock";

function getActivitiesFallback(page: number, pageSize: number, moduleFilter: string | null, branch: string | null) {
  const rows = getSystemActivitiesSlice(page, pageSize).filter((row) => {
    if (moduleFilter && moduleFilter !== "all" && row.module !== moduleFilter) return false;
    if (branch && branch !== "all" && row.branch_id !== branch) return false;
    return true;
  });
  return NextResponse.json({ data: rows, total: SYSTEM_ACTIVITIES_TOTAL });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "50");
  const moduleFilter = searchParams.get("module");
  const branch = searchParams.get("branch");
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (!isSupabaseConfigured()) {
    return getActivitiesFallback(page, pageSize, moduleFilter, branch);
  }

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("system_activities")
      .select("id, created_at, actor, action, module, affected_item_name, affected_item_id, affected_client_name, affected_client_id, branch_id", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (moduleFilter && moduleFilter !== "all") query = query.eq("module", moduleFilter);
    if (branch && branch !== "all") query = query.eq("branch_id", branch);
    const { data, error, count } = await query;
    if (error) {
      console.error("Activities fallback activated:", error);
      return getActivitiesFallback(page, pageSize, moduleFilter, branch);
    }
    return NextResponse.json({ data: data ?? [], total: count ?? 0 });
  } catch (error) {
    console.error("Activities fallback activated by exception:", error);
    return getActivitiesFallback(page, pageSize, moduleFilter, branch);
  }
}
