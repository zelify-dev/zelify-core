-- ============================================================
-- Zelify Core — Empresas (/groups) + miembros
-- ============================================================

create table if not exists public.companies (
  id              text primary key,
  name            text not null,
  company_type    text not null check (company_type in ('EMPRESA', 'SOLIDARIO', 'MANCOMUNADO')),
  state           text not null check (state in ('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'BLACKLISTED')),
  kyb_status      text check (kyb_status in ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED')),
  assigned_branch text not null,
  email           text,
  mobile_phone    text,
  created_at      date not null default current_date,
  last_modified   date not null default current_date
);

create table if not exists public.company_members (
  id              uuid primary key default gen_random_uuid(),
  company_id      text not null references public.companies(id) on delete cascade,
  customer_id     text not null,
  customer_name   text not null,
  role_name       text not null,
  kyc_status      text check (kyc_status in ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED')),
  aml_status      text check (aml_status in ('NOT_STARTED', 'CLEAR', 'REVIEW', 'BLOCKED')),
  created_at      timestamptz not null default now()
);

create unique index if not exists idx_company_members_unique on public.company_members(company_id, customer_id);
create index if not exists idx_company_members_company on public.company_members(company_id);

insert into public.companies
  (id, name, company_type, state, kyb_status, assigned_branch, email, mobile_phone, created_at, last_modified)
values
  ('EMP-001', 'Comercializadora Maya S.A. de C.V.', 'EMPRESA', 'ACTIVE', 'VERIFIED', 'CDMX Reforma', 'operaciones@maya.mx', '+52 55 8811 2244', current_date, current_date)
on conflict (id) do update set
  name = excluded.name,
  company_type = excluded.company_type,
  state = excluded.state,
  kyb_status = excluded.kyb_status,
  assigned_branch = excluded.assigned_branch,
  email = excluded.email,
  mobile_phone = excluded.mobile_phone,
  last_modified = excluded.last_modified;

insert into public.company_members
  (company_id, customer_id, customer_name, role_name, kyc_status, aml_status)
values
  ('EMP-001', 'CU-100001', 'Andrea Molina', 'CEO', 'VERIFIED', 'CLEAR'),
  ('EMP-001', 'CU-100002', 'Carlos Rodriguez', 'Garante', 'PENDING', 'REVIEW')
on conflict do nothing;
