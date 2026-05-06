import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { logSystemActivity } from "@/lib/activity-log";

function nextState(current: string, action: string): string {
  const transitions: Record<string, Record<string, string>> = {
    PARTIAL_APPLICATION: { SUBMIT: "PENDING_APPROVAL" },
    PENDING_APPROVAL: { APPROVE: "APPROVED" },
    APPROVED: { DISBURSE: "ACTIVE" },
    ACTIVE: { MARK_ARREARS: "ACTIVE_IN_ARREARS", LOCK: "LOCKED", CLOSE: "CLOSED", WRITE_OFF: "WRITTEN_OFF" },
    ACTIVE_IN_ARREARS: { LOCK: "LOCKED", CURE: "ACTIVE", WRITE_OFF: "WRITTEN_OFF" },
    LOCKED: { UNLOCK: "ACTIVE" },
  };
  return transitions[current]?.[action] ?? current;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
  const { id } = await params;
  const body = (await request.json()) as {
    action: string;
    amount?: number;
    channel?: string;
    txDate?: string;
    reason?: string;
    restructureType?: "RESCHEDULING" | "REFINANCING" | "CAPITALIZATION";
    details?: Record<string, unknown>;
  };
  const supabase = getSupabaseServerClient();
  const loanRes = await supabase.from("loans").select("*").eq("id", id).single();
  if (loanRes.error || !loanRes.data) return NextResponse.json({ error: "Prestamo no encontrado." }, { status: 404 });
  const loan = loanRes.data;

  if (body.action === "REPAYMENT" || body.action === "BULK_REPAYMENT" || body.action === "REPAYMENT_FROM_DEPOSIT") {
    const amount = Number(body.amount ?? 0);
    const principalPay = Math.min(amount, Number(loan.outstanding_principal));
    const remaining = amount - principalPay;
    const interestPay = Math.min(remaining, Number(loan.outstanding_interest));
    const { error: txErr } = await supabase.from("loan_transactions").insert({
      loan_id: id,
      tx_type: body.action,
      tx_date: body.txDate ?? new Date().toISOString().slice(0, 10),
      channel: body.channel ?? "CAJA",
      amount_total: amount,
      principal_component: principalPay,
      interest_component: interestPay,
      fees_component: 0,
      penalties_component: 0,
      notes: body.reason ?? null,
      audit_reason: body.reason ?? null,
    });
    if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });
    const { error: updErr } = await supabase
      .from("loans")
      .update({
        outstanding_principal: Math.max(0, Number(loan.outstanding_principal) - principalPay),
        outstanding_interest: Math.max(0, Number(loan.outstanding_interest) - interestPay),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    await logSystemActivity({
      action: `Préstamo ${body.action}`,
      module: "loans",
      affectedItemName: loan.product_name,
      affectedItemId: id,
      affectedClientName: loan.customer_name,
      affectedClientId: loan.customer_id,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "DISBURSE_TRANCHE") {
    const amount = Number(body.amount ?? 0);
    const { error: trancheErr } = await supabase.from("loan_tranches").insert({
      loan_id: id,
      tranche_no: Date.now() % 100000,
      expected_date: body.txDate ?? new Date().toISOString().slice(0, 10),
      disbursed_date: body.txDate ?? new Date().toISOString().slice(0, 10),
      amount,
      disbursement_channel: body.channel ?? "TRANSFERENCIA",
      status: "DISBURSED",
    });
    if (trancheErr) return NextResponse.json({ error: trancheErr.message }, { status: 500 });
    await supabase.from("loan_transactions").insert({
      loan_id: id,
      tx_type: "DISBURSEMENT",
      tx_date: body.txDate ?? new Date().toISOString().slice(0, 10),
      channel: body.channel ?? "TRANSFERENCIA",
      amount_total: amount,
      principal_component: amount,
    });
    await logSystemActivity({
      action: "Desembolso por tramo",
      module: "loans",
      affectedItemName: loan.product_name,
      affectedItemId: id,
      affectedClientName: loan.customer_name,
      affectedClientId: loan.customer_id,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "RESCHEDULE" || body.action === "REFINANCE" || body.action === "CAPITALIZE_INTEREST") {
    const map = {
      RESCHEDULE: "RESCHEDULING",
      REFINANCE: "REFINANCING",
      CAPITALIZE_INTEREST: "CAPITALIZATION",
    } as const;
    await supabase.from("loan_restructures").insert({
      loan_id: id,
      restructure_type: map[body.action],
      effective_date: body.txDate ?? new Date().toISOString().slice(0, 10),
      details: body.details ?? {},
    });
    await supabase.from("loan_transactions").insert({
      loan_id: id,
      tx_type: body.action === "REFINANCE" ? "REFINANCE" : "RESTRUCTURE",
      tx_date: body.txDate ?? new Date().toISOString().slice(0, 10),
      amount_total: Number(body.amount ?? 0),
      notes: body.reason ?? null,
      audit_reason: body.reason ?? null,
    });
    await logSystemActivity({
      action: `Préstamo ${body.action}`,
      module: "loans",
      affectedItemName: loan.product_name,
      affectedItemId: id,
      affectedClientName: loan.customer_name,
      affectedClientId: loan.customer_id,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "PAY_OFF" || body.action === "TERMINATE" || body.action === "WRITE_OFF") {
    await supabase.from("loan_transactions").insert({
      loan_id: id,
      tx_type: body.action === "PAY_OFF" ? "PAY_OFF" : body.action === "TERMINATE" ? "TERMINATION" : "WRITE_OFF",
      tx_date: body.txDate ?? new Date().toISOString().slice(0, 10),
      amount_total: Number(body.amount ?? 0),
      notes: body.reason ?? null,
      audit_reason: body.reason ?? null,
    });
  }

  const newState = nextState(loan.lifecycle_state, body.action);
  const { error: stateErr } = await supabase
    .from("loans")
    .update({
      lifecycle_state: newState,
      updated_at: new Date().toISOString(),
      ...(body.action === "DISBURSE"
        ? {
            disbursement_date: body.txDate ?? new Date().toISOString().slice(0, 10),
            disbursement_channel: body.channel ?? "TRANSFERENCIA",
          }
        : {}),
    })
    .eq("id", id);
  if (stateErr) return NextResponse.json({ error: stateErr.message }, { status: 500 });
  await logSystemActivity({
    action: `Cambio de estado préstamo: ${loan.lifecycle_state} -> ${newState}`,
    module: "loans",
    affectedItemName: loan.product_name,
    affectedItemId: id,
    affectedClientName: loan.customer_name,
    affectedClientId: loan.customer_id,
  });
  return NextResponse.json({ ok: true, lifecycleState: newState });
}
