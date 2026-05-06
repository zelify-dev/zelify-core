import { NextResponse } from "next/server";

import { AmlStatus, ClientState, Customer, DocumentType, KycStatus } from "@/modules/customers/types/customer.types";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { logSystemActivity } from "@/lib/activity-log";

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

function mapCustomerToInsert(customer: Customer): Omit<CustomerRow, "last_modified"> {
  return {
    id: customer.id,
    full_name: customer.fullName,
    email: customer.email || null,
    mobile_phone: customer.mobilePhone || null,
    document_type: customer.documentType,
    document_number: customer.documentNumber,
    state: customer.state,
    status_reason: customer.statusReason || null,
    status_changed_at: customer.statusChangedAt || null,
    address: customer.address || null,
    birth_date: customer.birthDate || null,
    kyc_status: customer.kycStatus || null,
    kyc_verified_at: customer.kycVerifiedAt || null,
    aml_status: customer.amlStatus || null,
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no está configurado para clientes." }, { status: 503 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, email, mobile_phone, document_type, document_number, state, status_reason, status_changed_at, address, birth_date, kyc_status, kyc_verified_at, aml_status, last_modified")
    .order("last_modified", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Error consultando clientes", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map((row) => mapRowToCustomer(row as CustomerRow)) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Customer;

  if (!body?.id || !body?.fullName || !body?.documentType || !body?.documentNumber || !body?.state) {
    return NextResponse.json({ error: "Payload inválido para cliente" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no está configurado para clientes." }, { status: 503 });
  }

  const supabase = getSupabaseServerClient();
  const payload = mapCustomerToInsert(body);
  const { data, error } = await supabase
    .from("customers")
    .insert(payload)
    .select("id, full_name, email, mobile_phone, document_type, document_number, state, status_reason, status_changed_at, address, birth_date, kyc_status, kyc_verified_at, aml_status, last_modified")
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo crear cliente", details: error.message }, { status: 500 });
  }

  await logSystemActivity({
    action: "Cliente creado",
    module: "customers",
    affectedItemName: body.fullName,
    affectedItemId: body.id,
    affectedClientName: body.fullName,
    affectedClientId: body.id,
  });

  return NextResponse.json({ data: mapRowToCustomer(data as CustomerRow) }, { status: 201 });
}
