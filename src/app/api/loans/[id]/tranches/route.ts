import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ensureLoanDemoDataset } from "../../_demo-seed";
import { getLoanMockState } from "../../_mock-store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ data: getLoanMockState().tranches.filter((x) => x.loanId === id) });
  }
  try {
    const supabase = getSupabaseServerClient();
    try {
      await ensureLoanDemoDataset(supabase);
    } catch (seedError) {
      console.error("Loan tranches demo seed failed:", seedError);
    }
    const { data, error } = await supabase
      .from("loan_tranches")
      .select("*")
      .eq("loan_id", id)
      .order("tranche_no", { ascending: true });
    if (error) throw error;
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
  } catch (error) {
    console.error("Loan tranches fallback activated:", error);
    return NextResponse.json({ data: getLoanMockState().tranches.filter((x) => x.loanId === id) });
  }
}
