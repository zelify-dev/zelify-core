import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { AmlStatus, ClientState, Customer, DocumentType, KycStatus } from "@/modules/customers/types/customer.types";

type CustomerRow = {
  id: string;
  full_name: string;
  email: string | null;
  mobile_phone: string | null;
  document_type: DocumentType;
  document_number: string;
  state: ClientState;
  status_reason: string | null;
  status_changed_at: string | null;
  address: string | null;
  birth_date: string | null;
  kyc_status: KycStatus | null;
  kyc_verified_at: string | null;
  aml_status: AmlStatus | null;
  last_modified: string | null;
};

function mapRowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email ?? "",
    mobilePhone: row.mobile_phone ?? "",
    documentType: row.document_type,
    documentNumber: row.document_number,
    state: row.state,
    statusReason: row.status_reason ?? undefined,
    statusChangedAt: row.status_changed_at ?? undefined,
    address: row.address ?? undefined,
    birthDate: row.birth_date ?? "",
    kycStatus: row.kyc_status ?? undefined,
    kycVerifiedAt: row.kyc_verified_at ?? undefined,
    amlStatus: row.aml_status ?? undefined,
    lastModified: row.last_modified ?? new Date().toISOString().slice(0, 10),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Customer;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no está configurado para clientes." }, { status: 503 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .update({
      full_name: body.fullName,
      email: body.email || null,
      mobile_phone: body.mobilePhone || null,
      document_type: body.documentType,
      document_number: body.documentNumber,
      state: body.state,
      status_reason: body.statusReason ?? null,
      status_changed_at: body.statusChangedAt ?? null,
      address: body.address ?? null,
      birth_date: body.birthDate || null,
      kyc_status: body.kycStatus ?? null,
      kyc_verified_at: body.kycVerifiedAt ?? null,
      aml_status: body.amlStatus ?? null,
      last_modified: new Date().toISOString().slice(0, 10),
    })
    .eq("id", id)
    .select("id, full_name, email, mobile_phone, document_type, document_number, state, status_reason, status_changed_at, address, birth_date, kyc_status, kyc_verified_at, aml_status, last_modified")
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo actualizar cliente", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: mapRowToCustomer(data as CustomerRow) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no está configurado para clientes." }, { status: 503 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar cliente", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
