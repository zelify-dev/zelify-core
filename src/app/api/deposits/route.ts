import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { logSystemActivity } from "@/lib/activity-log";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("deposit_accounts").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: (data ?? []).map((x) => ({
      id: x.id,
      productTypeId: x.product_type_id,
      productCode: x.product_code,
      productName: x.product_name,
      holderKind: x.holder_kind,
      holderId: x.holder_id,
      holderName: x.holder_name,
      state: x.state,
      balance: x.balance,
      availableBalance: x.available_balance,
      overdraftLimit: x.overdraft_limit,
      isDormant: x.is_dormant,
      dormantAfterDays: x.dormant_after_days,
      allowInterestAccrual: x.allow_interest_accrual,
      interestBaseMethod: x.interest_base_method,
      daysConvention: x.days_convention,
      rateMode: x.rate_mode,
      nominalRate: x.nominal_rate,
      withholdingTaxPct: x.withholding_tax_pct,
      overdraftInterestRate: x.overdraft_interest_rate,
      minTxAmount: x.min_tx_amount,
      maxWithdrawalAmount: x.max_withdrawal_amount,
      recommendedDepositAmount: x.recommended_deposit_amount,
    })),
  });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
  const body = (await request.json()) as {
    id: string;
    productTypeId: string;
    holderKind: "INDIVIDUAL" | "COMPANY";
    holderId: string;
    holderName: string;
    branchId?: string;
    nominalRate: number;
    overdraftLimit: number;
  };
  if (!body.id || !body.productTypeId || !body.holderId || !body.holderName) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
  const supabase = getSupabaseServerClient();
  const productRes = await supabase.from("product_type_definitions").select("id, code, name").eq("id", body.productTypeId).single();
  if (productRes.error || !productRes.data) return NextResponse.json({ error: "Producto de depósito no encontrado." }, { status: 400 });
  const { error } = await supabase.from("deposit_accounts").insert({
    id: body.id,
    product_type_id: body.productTypeId,
    product_code: productRes.data.code,
    product_name: productRes.data.name,
    holder_kind: body.holderKind,
    holder_id: body.holderId,
    holder_name: body.holderName,
    branch_id: body.branchId ?? null,
    state: "PENDING_APPROVAL",
    nominal_rate: body.nominalRate,
    overdraft_limit: body.overdraftLimit,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logSystemActivity({
    action: "Cuenta de depósito creada",
    module: "deposits",
    affectedItemName: productRes.data.name,
    affectedItemId: body.id,
    affectedClientName: body.holderName,
    affectedClientId: body.holderId,
    branchId: body.branchId ?? null,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
