import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { Branch, BranchesPayload } from "@/modules/branches/types/branch.types";
import { logSystemActivity } from "@/lib/activity-log";

type OrganizationRow = { id: string; name: string };
type BranchRow = { id: string; organization_id: string; name: string; status: "ACTIVE" | "INACTIVE"; region: string | null };
type CentreRow = { id: string; branch_id: string; name: string; meeting_day: string; meeting_place: string; status: "ACTIVE" | "INACTIVE" };
type PortfolioRow = { branch_id: string; active_loans: number; total_deposits: number; assigned_customers: number; delinquency_rate: number; gl_report_label: string | null };
type UserRow = { id: string; branch_id: string; full_name: string; role_name: "CREDIT_OFFICER" | "BRANCH_MANAGER" | "OPERATIONS" | "TELLER"; email: string | null; transactions_branch: string };

function getBranchesFallback() {
  const payload: BranchesPayload = {
    organization: { id: "org-main", name: "Zelify Demo" },
    branches: [
      {
        id: "main",
        organizationId: "org-main",
        name: "Sucursal Principal",
        status: "ACTIVE",
        region: "CDMX",
        centres: [
          {
            id: "centre-main-1",
            branchId: "main",
            name: "Centro Reforma",
            meetingDay: "Miércoles",
            meetingPlace: "Reforma 250",
            status: "ACTIVE",
          },
        ],
        portfolio: {
          branchId: "main",
          activeLoans: 12,
          totalDeposits: 24580900,
          assignedCustomers: 148,
          delinquencyRate: 2.4,
          glReportLabel: "GL-CDMX-01",
        },
        users: [
          {
            id: "usr-main-1",
            branchId: "main",
            fullName: "Camila Rojas",
            roleName: "BRANCH_MANAGER",
            email: "camila.rojas@zelify.mx",
            transactionsBranch: "CDMX",
          },
        ],
      },
      {
        id: "north",
        organizationId: "org-main",
        name: "Sucursal Norte",
        status: "ACTIVE",
        region: "Monterrey",
        centres: [],
        portfolio: {
          branchId: "north",
          activeLoans: 7,
          totalDeposits: 11840250,
          assignedCustomers: 92,
          delinquencyRate: 1.8,
          glReportLabel: "GL-MTY-02",
        },
        users: [],
      },
    ],
  };

  return NextResponse.json(payload);
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return getBranchesFallback();
  }
  try {
    const supabase = getSupabaseServerClient();
    const [orgRes, branchRes, centreRes, portfolioRes, usersRes] = await Promise.all([
      supabase.from("organizations").select("id,name").order("created_at", { ascending: true }).limit(1),
      supabase.from("branches").select("id,organization_id,name,status,region").order("name", { ascending: true }),
      supabase.from("centres").select("id,branch_id,name,meeting_day,meeting_place,status"),
      supabase.from("branch_portfolios").select("branch_id,active_loans,total_deposits,assigned_customers,delinquency_rate,gl_report_label"),
      supabase.from("branch_users").select("id,branch_id,full_name,role_name,email,transactions_branch"),
    ]);

    const error = orgRes.error || branchRes.error || centreRes.error || portfolioRes.error || usersRes.error;
    if (error) {
      console.error("Branches fallback activated:", error);
      const message = error.message ?? "Error consultando sucursales.";
      const isMissingRelation =
        message.includes("does not exist") ||
        message.includes("relation") ||
        message.includes("Could not find the table");
      if (isMissingRelation) {
        return getBranchesFallback();
      }
      return getBranchesFallback();
    }

    const organization = ((orgRes.data ?? [])[0] ?? null) as OrganizationRow | null;
    const branches = (branchRes.data ?? []) as BranchRow[];
    const centres = (centreRes.data ?? []) as CentreRow[];
    const portfolios = (portfolioRes.data ?? []) as PortfolioRow[];
    const users = (usersRes.data ?? []) as UserRow[];

    const payload: BranchesPayload = {
      organization: organization ? { id: organization.id, name: organization.name } : null,
      branches: branches.map(
        (b): Branch => ({
          id: b.id,
          organizationId: b.organization_id,
          name: b.name,
          status: b.status,
          region: b.region ?? "Sin región",
          centres: centres
            .filter((c) => c.branch_id === b.id)
            .map((c) => ({
              id: c.id,
              branchId: c.branch_id,
              name: c.name,
              meetingDay: c.meeting_day,
              meetingPlace: c.meeting_place,
              status: c.status,
            })),
          portfolio: (() => {
            const p = portfolios.find((item) => item.branch_id === b.id);
            if (!p) return null;
            return {
              branchId: p.branch_id,
              activeLoans: p.active_loans,
              totalDeposits: p.total_deposits,
              assignedCustomers: p.assigned_customers,
              delinquencyRate: p.delinquency_rate,
              glReportLabel: p.gl_report_label ?? "N/A",
            };
          })(),
          users: users
            .filter((u) => u.branch_id === b.id)
            .map((u) => ({
              id: u.id,
              branchId: u.branch_id,
              fullName: u.full_name,
              roleName: u.role_name,
              email: u.email,
              transactionsBranch: u.transactions_branch,
            })),
        })
      ),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Branches fallback activated by exception:", error);
    return getBranchesFallback();
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
  }
  const body = (await request.json()) as {
    id: string;
    organizationId: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
    region: string;
  };
  if (!body?.id || !body?.organizationId || !body?.name) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("branches").insert({
    id: body.id,
    organization_id: body.organizationId,
    name: body.name,
    status: body.status,
    region: body.region,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logSystemActivity({
    action: "Sucursal creada",
    module: "branches",
    affectedItemName: body.name,
    affectedItemId: body.id,
    branchId: body.id,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
