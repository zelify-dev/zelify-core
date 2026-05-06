import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function logSystemActivity(input: {
  actor?: string;
  action: string;
  module: string;
  affectedItemName?: string | null;
  affectedItemId?: string | null;
  affectedClientName?: string | null;
  affectedClientId?: string | null;
  branchId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getSupabaseServerClient();
    await supabase.from("system_activities").insert({
      actor: input.actor ?? "sistema",
      action: input.action,
      module: input.module,
      affected_item_name: input.affectedItemName ?? null,
      affected_item_id: input.affectedItemId ?? null,
      affected_client_name: input.affectedClientName ?? null,
      affected_client_id: input.affectedClientId ?? null,
      branch_id: input.branchId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    console.error("[activity-log] no se pudo registrar actividad", error);
  }
}
