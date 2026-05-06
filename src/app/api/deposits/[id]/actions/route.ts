import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { logSystemActivity } from "@/lib/activity-log";

function nextState(current: string, action: string): string {
  const transitions: Record<string, Record<string, string>> = {
    PENDING_APPROVAL: { APPROVE: "APPROVED" },
    APPROVED: { ACTIVATE: "ACTIVE" },
    ACTIVE: { MARK_DORMANT: "DORMANT", CLOSE: "CLOSED", BEGIN_MATURITY: "BEGIN_MATURITY_PERIOD" },
    DORMANT: { REACTIVATE: "ACTIVE" },
    BEGIN_MATURITY_PERIOD: { MATURE: "MATURED" },
    MATURED: { CLOSE: "CLOSED" },
    CLOSED: { WRITE_OFF: "WRITTEN_OFF" },
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
    note?: string;
    relatedLoanId?: string;
    relatedAccountId?: string;
    merchantName?: string;
    reason?: string;
  };
  const supabase = getSupabaseServerClient();
  const accountRes = await supabase.from("deposit_accounts").select("*").eq("id", id).single();
  if (accountRes.error || !accountRes.data) return NextResponse.json({ error: "Depósito no encontrado." }, { status: 404 });
  const account = accountRes.data;

  if (["DEPOSIT", "WITHDRAWAL", "TRANSFER_TO_LOAN", "TRANSFER_TO_DEPOSIT", "ADJUSTMENT", "INTEREST_REVERSAL", "WRITE_OFF"].includes(body.action)) {
    const amount = Number(body.amount ?? 0);
    const sign = body.action === "WITHDRAWAL" || body.action === "WRITE_OFF" ? -1 : 1;
    const newBalance = Number(account.balance) + sign * amount;
    const newAvailable = Number(account.available_balance) + sign * amount;

    const txType = body.action === "INTEREST_REVERSAL" ? "INTEREST_REVERSAL" : body.action;
    const { error: txError } = await supabase.from("deposit_transactions").insert({
      deposit_account_id: id,
      tx_type: txType,
      tx_date: body.txDate ?? new Date().toISOString().slice(0, 10),
      channel: body.channel ?? "CAJA",
      amount,
      related_account_id: body.relatedAccountId ?? null,
      related_loan_id: body.relatedLoanId ?? null,
      note: body.note ?? null,
      audit_reason: body.reason ?? null,
    });
    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

    const { error: updError } = await supabase
      .from("deposit_accounts")
      .update({
        balance: newBalance,
        available_balance: newAvailable,
        is_dormant: false,
        state: account.state === "DORMANT" ? "ACTIVE" : account.state,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });
    await logSystemActivity({
      action: `Depósito ${body.action}`,
      module: "deposits",
      affectedItemName: account.product_name,
      affectedItemId: id,
      affectedClientName: account.holder_name,
      affectedClientId: account.holder_id,
      branchId: account.branch_id ?? null,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "CARD_HOLD") {
    const amount = Number(body.amount ?? 0);
    const holdRes = await supabase.from("deposit_card_holds").insert({
      deposit_account_id: id,
      merchant_name: body.merchantName ?? "Comercio N/D",
      amount,
      status: "HELD",
    });
    if (holdRes.error) return NextResponse.json({ error: holdRes.error.message }, { status: 500 });
    const upd = await supabase
      .from("deposit_accounts")
      .update({
        available_balance: Math.max(0, Number(account.available_balance) - amount),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });
    await logSystemActivity({
      action: "Card hold creado",
      module: "deposits",
      affectedItemName: account.product_name,
      affectedItemId: id,
      affectedClientName: account.holder_name,
      affectedClientId: account.holder_id,
      branchId: account.branch_id ?? null,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "RELEASE_HOLD") {
    const hold = await supabase
      .from("deposit_card_holds")
      .select("id, amount")
      .eq("deposit_account_id", id)
      .eq("status", "HELD")
      .order("held_at", { ascending: false })
      .limit(1)
      .single();
    if (hold.error || !hold.data) return NextResponse.json({ error: "No hay hold activo." }, { status: 400 });
    await supabase.from("deposit_card_holds").update({ status: "RELEASED", released_at: new Date().toISOString() }).eq("id", hold.data.id);
    await supabase
      .from("deposit_accounts")
      .update({
        available_balance: Number(account.available_balance) + Number(hold.data.amount),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    await logSystemActivity({
      action: "Card hold liberado",
      module: "deposits",
      affectedItemName: account.product_name,
      affectedItemId: id,
      affectedClientName: account.holder_name,
      affectedClientId: account.holder_id,
      branchId: account.branch_id ?? null,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "APPLY_INTEREST") {
    const interest = Number((Number(account.balance) * (Number(account.nominal_rate) / 100) / 12).toFixed(2));
    const tax = Number((interest * Number(account.withholding_tax_pct) / 100).toFixed(2));
    const net = interest - tax;
    await supabase.from("deposit_transactions").insert({
      deposit_account_id: id,
      tx_type: "INTEREST_APPLIED",
      tx_date: body.txDate ?? new Date().toISOString().slice(0, 10),
      channel: "EOD",
      amount: net,
      note: `Interés bruto: ${interest}, retención: ${tax}`,
    });
    await supabase
      .from("deposit_accounts")
      .update({
        balance: Number(account.balance) + net,
        available_balance: Number(account.available_balance) + net,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    await logSystemActivity({
      action: "Interés aplicado en depósito",
      module: "deposits",
      affectedItemName: account.product_name,
      affectedItemId: id,
      affectedClientName: account.holder_name,
      affectedClientId: account.holder_id,
      branchId: account.branch_id ?? null,
    });
    return NextResponse.json({ ok: true, interestApplied: net });
  }

  const state = nextState(account.state, body.action);
  const { error } = await supabase.from("deposit_accounts").update({ state, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logSystemActivity({
    action: `Cambio de estado depósito: ${account.state} -> ${state}`,
    module: "deposits",
    affectedItemName: account.product_name,
    affectedItemId: id,
    affectedClientName: account.holder_name,
    affectedClientId: account.holder_id,
    branchId: account.branch_id ?? null,
  });
  return NextResponse.json({ ok: true, state });
}
