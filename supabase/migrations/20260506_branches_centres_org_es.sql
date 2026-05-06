-- ============================================================
-- Zelify Core — Sucursales y Centros (/branches, /centres)
-- ============================================================

create table if not exists public.organizations (
  id          text primary key,
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.branches (
  id               text primary key,
  organization_id  text not null references public.organizations(id) on delete cascade,
  name             text not null,
  status           text not null check (status in ('ACTIVE', 'INACTIVE')),
  region           text,
  created_at       timestamptz not null default now()
);

create table if not exists public.centres (
  id             text primary key,
  branch_id      text not null references public.branches(id) on delete cascade,
  name           text not null,
  meeting_day    text not null,
  meeting_place  text not null,
  status         text not null check (status in ('ACTIVE', 'INACTIVE')),
  created_at     timestamptz not null default now()
);

create table if not exists public.branch_portfolios (
  branch_id            text primary key references public.branches(id) on delete cascade,
  active_loans         numeric(14,2) not null default 0,
  total_deposits       numeric(14,2) not null default 0,
  assigned_customers   integer not null default 0,
  delinquency_rate     numeric(5,2) not null default 0,
  gl_report_label      text,
  updated_at           timestamptz not null default now()
);

create table if not exists public.branch_users (
  id                  uuid primary key default gen_random_uuid(),
  branch_id           text not null references public.branches(id) on delete cascade,
  full_name           text not null,
  role_name           text not null check (role_name in ('CREDIT_OFFICER', 'BRANCH_MANAGER', 'OPERATIONS', 'TELLER')),
  email               text,
  transactions_branch text not null references public.branches(id),
  created_at          timestamptz not null default now()
);

create index if not exists idx_branches_org on public.branches(organization_id);
create index if not exists idx_centres_branch on public.centres(branch_id);
create index if not exists idx_branch_users_branch on public.branch_users(branch_id);

insert into public.organizations (id, name)
values ('ORG-ZELIFY', 'Zelify MX')
on conflict (id) do update set name = excluded.name;

insert into public.branches (id, organization_id, name, status, region)
values
  ('BR-CDMX-01', 'ORG-ZELIFY', 'Sucursal CDMX Reforma', 'ACTIVE', 'CDMX'),
  ('BR-GDL-01', 'ORG-ZELIFY', 'Sucursal Guadalajara Centro', 'ACTIVE', 'Jalisco')
on conflict (id) do update set
  organization_id = excluded.organization_id,
  name = excluded.name,
  status = excluded.status,
  region = excluded.region;

insert into public.centres (id, branch_id, name, meeting_day, meeting_place, status)
values
  ('CE-CDMX-001', 'BR-CDMX-01', 'Centro Reforma Norte', 'Martes', 'Av. Reforma 155, Piso 4', 'ACTIVE'),
  ('CE-GDL-001', 'BR-GDL-01', 'Centro Minerva', 'Jueves', 'Av. Vallarta 2210', 'ACTIVE')
on conflict (id) do update set
  branch_id = excluded.branch_id,
  name = excluded.name,
  meeting_day = excluded.meeting_day,
  meeting_place = excluded.meeting_place,
  status = excluded.status;

insert into public.branch_portfolios (branch_id, active_loans, total_deposits, assigned_customers, delinquency_rate, gl_report_label)
values
  ('BR-CDMX-01', 3500000, 5100000, 842, 2.30, 'GL-Branch-CDMX'),
  ('BR-GDL-01', 1850000, 2200000, 421, 3.10, 'GL-Branch-GDL')
on conflict (branch_id) do update set
  active_loans = excluded.active_loans,
  total_deposits = excluded.total_deposits,
  assigned_customers = excluded.assigned_customers,
  delinquency_rate = excluded.delinquency_rate,
  gl_report_label = excluded.gl_report_label,
  updated_at = now();

insert into public.branch_users (branch_id, full_name, role_name, email, transactions_branch)
values
  ('BR-CDMX-01', 'Laura Moreno', 'BRANCH_MANAGER', 'laura.moreno@zelify.mx', 'BR-CDMX-01'),
  ('BR-CDMX-01', 'Cesar Rivera', 'CREDIT_OFFICER', 'cesar.rivera@zelify.mx', 'BR-CDMX-01'),
  ('BR-GDL-01', 'Paola Ortega', 'CREDIT_OFFICER', 'paola.ortega@zelify.mx', 'BR-GDL-01')
on conflict do nothing;
