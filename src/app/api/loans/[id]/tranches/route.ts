import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("loan_tranches")
    .select("*")
    .eq("loan_id", id)
    .order("tranche_no", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: (data ?? []).map((x) => ({
      id: x.id,
      loanId: x.loan_id,
      trancheNo: x.tranche_no,
      expectedDate: x.expected_date,
      disbursedDate: x.disbursed_date,
      amount: x.amount,
      disbursementChannel: x.disbursement_channel,
      status: x.status,
    })),
  });
}
