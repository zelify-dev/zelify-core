import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { logSystemActivity } from "@/lib/activity-log";
import { ensureLoanDemoDataset } from "./_demo-seed";
import { createMockLoan, getLoanMockState } from "./_mock-store";

function useMockFallback() {
  return !isSupabaseConfigured();
}

export async function GET() {
  if (useMockFallback()) {
    return NextResponse.json({ data: getLoanMockState().loans });
  }
  try {
    const supabase = getSupabaseServerClient();
    try {
      await ensureLoanDemoDataset(supabase);
    } catch (seedError) {
      console.error("Loan demo seed failed:", seedError);
    }
    const { data, error } = await supabase.from("loans").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({
      data: (data ?? []).map((r) => ({
        id: r.id,
        productTypeId: r.product_type_id,
        productCode: r.product_code,
        productName: r.product_name,
        customerId: r.customer_id,
        customerName: r.customer_name,
        principalAmount: r.principal_amount,
        currency: r.currency,
        lifecycleState: r.lifecycle_state,
        disbursementDate: r.disbursement_date,
        disbursementChannel: r.disbursement_channel,
        expectedDisbursementDate: r.expected_disbursement_date,
        outstandingPrincipal: r.outstanding_principal,
        outstandingInterest: r.outstanding_interest,
        outstandingFees: r.outstanding_fees,
        outstandingPenalties: r.outstanding_penalties,
        interestCalculationMethod: r.interest_calculation_method,
        rateMode: r.rate_mode,
        nominalRate: r.nominal_rate,
        indexName: r.index_name,
        spreadRate: r.spread_rate,
        reviewFrequency: r.review_frequency,
        accruedDaily: r.accrued_daily,
        gracePeriodType: r.grace_period_type,
        gracePeriodDays: r.grace_period_days,
        arrearsCountingMethod: r.arrears_counting_method,
        arrearsToleranceDays: r.arrears_tolerance_days,
        arrearsTolerancePct: r.arrears_tolerance_pct,
        penaltyDailyRate: r.penalty_daily_rate,
        lockSuspendsAccrual: r.lock_suspends_accrual,
        allocationMethod: r.allocation_method,
        allocationPriority: r.allocation_priority ?? [],
      })),
    });
  } catch (error) {
    console.error("Loan API fallback activated:", error);
    return NextResponse.json({ data: getLoanMockState().loans });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id: string;
    productTypeId: string;
    customerId: string;
    customerName: string;
    principalAmount: number;
    expectedDisbursementDate: string;
    nominalRate: number;
    disbursementChannel: string;
  };
  if (!body.id || !body.productTypeId || !body.customerId || !body.customerName) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }
  if (useMockFallback()) {
    createMockLoan(body);
    return NextResponse.json({ ok: true }, { status: 201 });
  }
  try {
    const supabase = getSupabaseServerClient();
    const productRes = await supabase
      .from("product_type_definitions")
      .select("id,code,name")
      .eq("id", body.productTypeId)
      .single();
    if (productRes.error || !productRes.data) {
      return NextResponse.json({ error: "Tipo de producto no encontrado." }, { status: 400 });
    }
    const { error } = await supabase.from("loans").insert({
      id: body.id,
      product_type_id: body.productTypeId,
      product_code: productRes.data.code,
      product_name: productRes.data.name,
      customer_id: body.customerId,
      customer_name: body.customerName,
      principal_amount: body.principalAmount,
      expected_disbursement_date: body.expectedDisbursementDate,
      lifecycle_state: "PARTIAL_APPLICATION",
      outstanding_principal: body.principalAmount,
      nominal_rate: body.nominalRate,
      disbursement_channel: body.disbursementChannel,
      interest_calculation_method: "DECLINING_BALANCE",
      rate_mode: "FIXED",
      review_frequency: "MONTHLY",
      allocation_method: "HORIZONTAL",
    });
    if (error) throw error;
  } catch (error) {
    console.error("Loan create fallback activated:", error);
    createMockLoan(body);
  }
  await logSystemActivity({
    action: "Préstamo creado",
    module: "loans",
    affectedItemName: body.id,
    affectedItemId: body.id,
    affectedClientName: body.customerName,
    affectedClientId: body.customerId,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
