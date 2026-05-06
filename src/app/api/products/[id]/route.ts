import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ProductFormInput } from "@/modules/products/types/product.types";

type ProductRow = {
  id: string;
  name: string;
  kind: "DEPOSIT" | "LOAN";
  active: boolean;
  min_amount: number;
  max_amount: number;
  min_interest_rate: number;
  max_interest_rate: number;
  product_type: string | null;
  overdraft_allowed: boolean;
  overdraft_limit: number;
  interest_rate_settings: "FIXED" | "TIERED";
  loan_type_code: string | null;
  payment_method: "EQUATED_INSTALLMENTS" | "DECLINING_BALANCE";
  grace_period_installments: number;
  max_installments: number;
  repayment_frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  collateral_required: boolean;
  updated_at: string;
};

const SELECT_COLS =
  "id, name, kind, active, min_amount, max_amount, min_interest_rate, max_interest_rate, " +
  "product_type, overdraft_allowed, overdraft_limit, interest_rate_settings, " +
  "loan_type_code, payment_method, grace_period_installments, max_installments, " +
  "repayment_frequency, collateral_required, updated_at";

// ── PATCH /api/products/[id] ──────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Partial<ProductFormInput> & { active?: boolean };

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no está configurado para actualizar productos." },
      { status: 503 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  // Build partial update from payload
  const update: Partial<ProductRow> & { updated_at: string } = { updated_at: today };
  if (body.name !== undefined) update.name = body.name.trim();
  if (body.active !== undefined) update.active = body.active;
  if (body.minAmount !== undefined) update.min_amount = body.minAmount;
  if (body.maxAmount !== undefined) update.max_amount = body.maxAmount;
  if (body.minInterestRate !== undefined) update.min_interest_rate = body.minInterestRate;
  if (body.maxInterestRate !== undefined) update.max_interest_rate = body.maxInterestRate;
  if (body.productType !== undefined) update.product_type = body.productType;
  if (body.overdraftAllowed !== undefined) update.overdraft_allowed = body.overdraftAllowed;
  if (body.overdraftLimit !== undefined) update.overdraft_limit = body.overdraftLimit;
  if (body.interestRateSettings !== undefined) update.interest_rate_settings = body.interestRateSettings;
  if (body.loanTypeCode !== undefined) update.loan_type_code = body.loanTypeCode;
  if (body.paymentMethod !== undefined) update.payment_method = body.paymentMethod;
  if (body.gracePeriodInstallments !== undefined) update.grace_period_installments = body.gracePeriodInstallments;
  if (body.maxInstallments !== undefined) update.max_installments = body.maxInstallments;
  if (body.repaymentFrequency !== undefined) update.repayment_frequency = body.repaymentFrequency;
  if (body.collateralRequired !== undefined) update.collateral_required = body.collateralRequired;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .update(update)
    .eq("id", id)
    .select(SELECT_COLS)
    .single();

  if (error) {
    return NextResponse.json({ error: "Error al actualizar el producto", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// ── DELETE /api/products/[id] ─────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no está configurado para eliminar productos." },
      { status: 503 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Error al eliminar el producto", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
