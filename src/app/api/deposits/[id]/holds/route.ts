import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("deposit_card_holds")
    .select("id, deposit_account_id, merchant_name, amount, status")
    .eq("deposit_account_id", id)
    .order("held_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: (data ?? []).map((x) => ({
      id: x.id,
      depositAccountId: x.deposit_account_id,
      merchantName: x.merchant_name,
      amount: x.amount,
      status: x.status,
    })),
  });
}
