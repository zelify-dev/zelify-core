import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

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
    return NextResponse.json(
      { error: "Supabase no está configurado para consultar tipos de producto." },
      { status: 503 }
    );
  }

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("product_type_definitions")
    .select("id, name, code, kind, description, badge, features, subtype_of, is_active, sort_order, updated_at")
    .order("sort_order", { ascending: true });

  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Error consultando product_type_definitions", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id: string; is_active: boolean };

  if (!body?.id || typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "Payload inválido: se requiere id y is_active" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no está configurado para actualizar tipos de producto." },
      { status: 503 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_type_definitions")
    .update({ is_active: body.is_active })
    .eq("id", body.id)
    .select("id, name, code, kind, description, badge, features, subtype_of, is_active, sort_order, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Error al actualizar el tipo de producto", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
