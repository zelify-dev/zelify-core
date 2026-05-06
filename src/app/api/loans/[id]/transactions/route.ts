import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("loan_transactions")
    .select("*")
    .eq("loan_id", id)
    .order("tx_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: (data ?? []).map((x) => ({
      id: x.id,
      loanId: x.loan_id,
      txType: x.tx_type,
      txDate: x.tx_date,
      channel: x.channel,
      amountTotal: x.amount_total,
      principalComponent: x.principal_component,
      interestComponent: x.interest_component,
      feesComponent: x.fees_component,
      penaltiesComponent: x.penalties_component,
      relatedDepositAccount: x.related_deposit_account,
      notes: x.notes,
      auditReason: x.audit_reason,
    })),
  });
}
