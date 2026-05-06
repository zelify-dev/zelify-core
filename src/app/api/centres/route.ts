import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { logSystemActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
  }
  const body = (await request.json()) as {
    id: string;
    branchId: string;
    name: string;
    meetingDay: string;
    meetingPlace: string;
    status: "ACTIVE" | "INACTIVE";
  };
  if (!body?.id || !body?.branchId || !body?.name || !body?.meetingDay || !body?.meetingPlace) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("centres").insert({
    id: body.id,
    branch_id: body.branchId,
    name: body.name,
    meeting_day: body.meetingDay,
    meeting_place: body.meetingPlace,
    status: body.status,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logSystemActivity({
    action: "Centro creado",
    module: "branches",
    affectedItemName: body.name,
    affectedItemId: body.id,
    branchId: body.branchId,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
