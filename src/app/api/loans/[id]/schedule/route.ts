import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ensureLoanDemoDataset } from "../../_demo-seed";

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  try {
    await ensureLoanDemoDataset(supabase);
  } catch (seedError) {
    console.error("Loan schedule demo seed failed:", seedError);
  }
  const { data, error } = await supabase
    .from("loan_schedule_items")
    .select("*")
    .eq("loan_id", id)
    .order("installment_no", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if ((data ?? []).length > 0) {
    return NextResponse.json({
      data: data?.map((x) => ({
        id: x.id,
        loanId: x.loan_id,
        installmentNo: x.installment_no,
        dueDate: x.due_date,
        principalDue: x.principal_due,
        interestDue: x.interest_due,
        feesDue: x.fees_due,
        penaltiesDue: x.penalties_due,
        principalPaid: x.principal_paid,
        interestPaid: x.interest_paid,
        feesPaid: x.fees_paid,
        penaltiesPaid: x.penalties_paid,
        status: x.status,
      })),
    });
  }

  const loanRes = await supabase.from("loans").select("id, principal_amount, nominal_rate").eq("id", id).single();
  if (loanRes.error || !loanRes.data) return NextResponse.json({ error: "Prestamo no encontrado." }, { status: 404 });

  const principal = Number(loanRes.data.principal_amount);
  const monthlyPrincipal = principal / 12;
  const today = new Date();
  const rows = Array.from({ length: 12 }).map((_, i) => {
    const interest = (principal - monthlyPrincipal * i) * (Number(loanRes.data.nominal_rate) / 100 / 12);
    return {
      loan_id: id,
      installment_no: i + 1,
      due_date: addMonths(today, i + 1).toISOString().slice(0, 10),
      principal_due: Number(monthlyPrincipal.toFixed(2)),
      interest_due: Number(interest.toFixed(2)),
      fees_due: 0,
      penalties_due: 0,
      principal_paid: 0,
      interest_paid: 0,
      fees_paid: 0,
      penalties_paid: 0,
      status: "DUE",
    };
  });
  const insertRes = await supabase.from("loan_schedule_items").insert(rows).select("*");
  if (insertRes.error) return NextResponse.json({ error: insertRes.error.message }, { status: 500 });
  return NextResponse.json({
    data: (insertRes.data ?? []).map((x) => ({
      id: x.id,
      loanId: x.loan_id,
      installmentNo: x.installment_no,
      dueDate: x.due_date,
      principalDue: x.principal_due,
      interestDue: x.interest_due,
      feesDue: x.fees_due,
      penaltiesDue: x.penalties_due,
      principalPaid: x.principal_paid,
      interestPaid: x.interest_paid,
      feesPaid: x.fees_paid,
      penaltiesPaid: x.penalties_paid,
      status: x.status,
    })),
  });
}
