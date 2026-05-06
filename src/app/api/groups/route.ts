import { NextResponse } from "next/server";

import { Group, GroupState } from "@/modules/groups/types/group.types";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { logSystemActivity } from "@/lib/activity-log";

type GroupRow = {
  id: string;
  name: string;
  company_type: Group["groupType"];
  kyb_status: Group["kybStatus"] | null;
  assigned_branch: string;
  created_at: string;
  state: GroupState;
  last_modified: string | null;
  mobile_phone: string | null;
  email: string | null;
};

type GroupMemberRow = {
  company_id: string;
  customer_id: string;
  customer_name: string;
  role_name: string;
  kyc_status: "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED" | null;
  aml_status: "NOT_STARTED" | "CLEAR" | "REVIEW" | "BLOCKED" | null;
};

function mapGroupRowToGroup(group: GroupRow, members: GroupMemberRow[]): Group {
  return {
    id: group.id,
    name: group.name,
    groupType: group.company_type,
    kybStatus: group.kyb_status ?? undefined,
    assignedBranch: group.assigned_branch,
    createdAt: group.created_at,
    state: group.state,
    membersCount: members.length,
    lastModified: group.last_modified ?? new Date().toISOString().slice(0, 10),
    members: members.map((m) => ({
      id: m.customer_id,
      name: m.customer_name,
      roleName: m.role_name,
      kycStatus: m.kyc_status ?? undefined,
      amlStatus: m.aml_status ?? undefined,
    })),
    email: group.email ?? undefined,
    mobilePhone: group.mobile_phone ?? undefined,
  };
}

function groupToRowPayload(group: Group): GroupRow {
  return {
    id: group.id,
    name: group.name,
    company_type: group.groupType,
    kyb_status: group.kybStatus ?? null,
    assigned_branch: group.assignedBranch,
    created_at: group.createdAt,
    state: group.state,
    last_modified: group.lastModified,
    mobile_phone: group.mobilePhone ?? null,
    email: group.email ?? null,
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no está configurado para empresas." }, { status: 503 });
  }

  const supabase = getSupabaseServerClient();
  const [groupsResult, membersResult] = await Promise.all([
    supabase.from("companies").select("*").order("last_modified", { ascending: false }),
    supabase.from("company_members").select("company_id, customer_id, customer_name, role_name, kyc_status, aml_status"),
  ]);

  if (groupsResult.error || membersResult.error) {
    const message = groupsResult.error?.message || membersResult.error?.message;
    return NextResponse.json({ error: "Error consultando empresas", details: message }, { status: 500 });
  }

  const groups = (groupsResult.data ?? []) as GroupRow[];
  const members = (membersResult.data ?? []) as GroupMemberRow[];
  const mapped = groups.map((group) =>
    mapGroupRowToGroup(
      group,
      members.filter((m) => m.company_id === group.id),
    )
  );

  return NextResponse.json({ data: mapped });
}

export async function POST(request: Request) {
  const group = (await request.json()) as Group;
  if (!group?.id || !group?.name) {
    return NextResponse.json({ error: "Payload inválido para empresa" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no está configurado para empresas." }, { status: 503 });
  }

  const supabase = getSupabaseServerClient();
  const row = groupToRowPayload(group);
  const { error: upsertError } = await supabase.from("companies").upsert(row, { onConflict: "id" });
  if (upsertError) {
    return NextResponse.json({ error: "No se pudo guardar empresa", details: upsertError.message }, { status: 500 });
  }

  await supabase.from("company_members").delete().eq("company_id", group.id);

  if (group.members && group.members.length > 0) {
    await supabase.from("company_members").insert(
      group.members.map((m) => ({
        company_id: group.id,
        customer_id: m.id,
        customer_name: m.name,
        role_name: m.roleName || "Miembro",
        kyc_status: m.kycStatus ?? null,
        aml_status: m.amlStatus ?? null,
      }))
    );
  }

  await logSystemActivity({
    action: "Empresa creada o actualizada",
    module: "companies",
    affectedItemName: group.name,
    affectedItemId: group.id,
    branchId: group.assignedBranch,
  });

  return NextResponse.json({ data: group }, { status: 201 });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no está configurado para empresas." }, { status: 503 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar empresa", details: error.message }, { status: 500 });
  }
  await logSystemActivity({
    action: "Empresa eliminada",
    module: "companies",
    affectedItemId: id,
  });
  return NextResponse.json({ ok: true });
}
