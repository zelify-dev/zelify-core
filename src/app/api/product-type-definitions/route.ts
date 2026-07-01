import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getLoanMockState, updateMockProductType } from "@/app/api/loans/_mock-store";

export type ProductTypeDefinitionRow = {
  id: string;
  name: string;
  code: string;
  kind: "LOAN" | "DEPOSIT";
  description: string | null;
  badge: string | null;
  features: string[] | null;
  subtype_of: string | null;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") as "LOAN" | "DEPOSIT" | null;

  if (!isSupabaseConfigured()) {
    const data = getLoanMockState().productTypes.filter((row) => !kind || row.kind === kind);
    return NextResponse.json({ data });
  }

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("product_type_definitions")
    .select("id, name, code, kind, description, badge, features, subtype_of, is_active, sort_order, updated_at")
    .order("sort_order", { ascending: true });

  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;

  if (error) {
    console.error("Product type definitions fallback activated:", error);
    const fallback = getLoanMockState().productTypes.filter((row) => !kind || row.kind === kind);
    return NextResponse.json({ data: fallback });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id: string; is_active: boolean };

  if (!body?.id || typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "Payload inválido: se requiere id y is_active" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    const data = updateMockProductType(body.id, { is_active: body.is_active, updated_at: new Date().toISOString().slice(0, 10) });
    if (!data) return NextResponse.json({ error: "Tipo de producto no encontrado." }, { status: 404 });
    return NextResponse.json({ data });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_type_definitions")
    .update({ is_active: body.is_active })
    .eq("id", body.id)
    .select("id, name, code, kind, description, badge, features, subtype_of, is_active, sort_order, updated_at")
    .single();

  if (error) {
    console.error("Product type patch fallback activated:", error);
    const fallback = updateMockProductType(body.id, { is_active: body.is_active, updated_at: new Date().toISOString().slice(0, 10) });
    if (!fallback) return NextResponse.json({ error: "Tipo de producto no encontrado." }, { status: 404 });
    return NextResponse.json({ data: fallback });
  }

  return NextResponse.json({ data });
}
