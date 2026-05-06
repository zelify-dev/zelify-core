import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("deposit_transactions")
    .select("*")
    .eq("deposit_account_id", id)
    .order("tx_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: (data ?? []).map((x) => ({
      id: x.id,
      depositAccountId: x.deposit_account_id,
      txType: x.tx_type,
      txDate: x.tx_date,
      channel: x.channel,
      amount: x.amount,
      relatedAccountId: x.related_account_id,
      relatedLoanId: x.related_loan_id,
      note: x.note,
      auditReason: x.audit_reason,
    })),
  });
}
