import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "50");
  const module = searchParams.get("module");
  const branch = searchParams.get("branch");
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("system_activities")
    .select("id, created_at, actor, action, module, affected_item_name, affected_item_id, affected_client_name, affected_client_id, branch_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (module && module !== "all") query = query.eq("module", module);
  if (branch && branch !== "all") query = query.eq("branch_id", branch);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
}
