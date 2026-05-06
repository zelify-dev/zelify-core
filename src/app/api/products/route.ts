import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Product, ProductFormInput } from "@/modules/products/types/product.types";

// ── DB row type ───────────────────────────────────────────────
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

function rowToProduct(row: ProductRow): Product {
  const base = {
    id: row.id,
    name: row.name,
    active: row.active,
    minAmount: Number(row.min_amount),
    maxAmount: Number(row.max_amount),
    minInterestRate: Number(row.min_interest_rate),
    maxInterestRate: Number(row.max_interest_rate),
    updatedAt: row.updated_at,
  };

  if (row.kind === "DEPOSIT") {
    return {
      ...base,
      kind: "DEPOSIT",
      productType: (row.product_type ?? "SAVINGS_PLAN") as Product extends { kind: "DEPOSIT" } ? never : never,
      overdraftAllowed: row.overdraft_allowed,
      overdraftLimit: Number(row.overdraft_limit),
      interestRateSettings: row.interest_rate_settings,
    } as Product;
  }

  return {
    ...base,
    kind: "LOAN",
    loanTypeCode: row.loan_type_code ?? undefined,
    paymentMethod: row.payment_method,
    gracePeriodInstallments: row.grace_period_installments,
    maxInstallments: row.max_installments,
    repaymentFrequency: row.repayment_frequency,
    collateralRequired: row.collateral_required,
  } as Product;
}

function inputToRow(
  payload: ProductFormInput,
  id: string,
  today = new Date().toISOString().slice(0, 10)
): ProductRow {
  return {
    id,
    name: payload.name.trim(),
    kind: payload.kind,
    active: true,
    min_amount: payload.minAmount,
    max_amount: payload.maxAmount,
    min_interest_rate: payload.minInterestRate,
    max_interest_rate: payload.maxInterestRate,
    product_type: payload.kind === "DEPOSIT" ? (payload.productType ?? "SAVINGS_PLAN") : null,
    overdraft_allowed: Boolean(payload.overdraftAllowed),
    overdraft_limit: payload.overdraftLimit ?? 0,
    interest_rate_settings: payload.interestRateSettings ?? "FIXED",
    loan_type_code: payload.kind === "LOAN" ? (payload.loanTypeCode ?? null) : null,
    payment_method: payload.paymentMethod ?? "EQUATED_INSTALLMENTS",
    grace_period_installments: payload.gracePeriodInstallments ?? 0,
    max_installments: payload.maxInstallments ?? 12,
    repayment_frequency: payload.repaymentFrequency ?? "MONTHLY",
    collateral_required: Boolean(payload.collateralRequired),
    updated_at: today,
  };
}

const SELECT_COLS =
  "id, name, kind, active, min_amount, max_amount, min_interest_rate, max_interest_rate, " +
  "product_type, overdraft_allowed, overdraft_limit, interest_rate_settings, " +
  "loan_type_code, payment_method, grace_period_installments, max_installments, " +
  "repayment_frequency, collateral_required, updated_at";

// ── GET /api/products ─────────────────────────────────────────
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no está configurado para consultar productos." },
      { status: 503 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT_COLS)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Error consultando productos", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: (data ?? []).map((r) => rowToProduct(r as ProductRow)) });
}

// ── POST /api/products ────────────────────────────────────────
export async function POST(request: Request) {
  const payload = (await request.json()) as ProductFormInput;

  if (!payload?.name?.trim() || !payload?.kind) {
    return NextResponse.json({ error: "Payload inválido: se requiere name y kind" }, { status: 400 });
  }

  const prefix = payload.kind === "DEPOSIT" ? "DEP" : "LOAN";
  const id =
    typeof payload.id === "string" && payload.id.trim()
      ? payload.id.trim()
      : `${prefix}-PROD-${Date.now()}`;

  const row = inputToRow(payload, id);

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no está configurado para crear productos." },
      { status: 503 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .insert(row)
    .select(SELECT_COLS)
    .single();

  if (error) {
    return NextResponse.json({ error: "Error al crear el producto", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: rowToProduct(data as ProductRow) }, { status: 201 });
}
