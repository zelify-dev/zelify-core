-- ============================================================
-- Zelify Core — Migración única de Clientes individuales (ES)
-- Independiente de grupos
-- ============================================================

create table if not exists public.customers (
  id                 text primary key,
  full_name          text not null,
  document_type      text not null check (document_type in ('INE', 'CURP', 'RFC', 'PASAPORTE', 'RESIDENCIA')),
  document_number    text not null,
  state              text not null check (state in ('ACTIVE', 'INACTIVE', 'BLACKLISTED', 'PENDING')),
  status_reason      text,
  status_changed_at  date,
  birth_date         date not null,
  address            text,
  kyc_status         text check (kyc_status in ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED')),
  kyc_verified_at    date,
  aml_status         text check (aml_status in ('NOT_STARTED', 'CLEAR', 'REVIEW', 'BLOCKED')),
  last_modified      date not null default current_date,
  created_at         timestamptz not null default now()
);

create unique index if not exists idx_customers_document_unique
  on public.customers(document_type, document_number);

create index if not exists idx_customers_state on public.customers(state);
create index if not exists idx_customers_last_modified on public.customers(last_modified desc);

-- Seeds base (idempotente)
insert into public.customers (
  id, full_name, document_type, document_number, state,
  status_reason, status_changed_at, birth_date, address,
  kyc_status, kyc_verified_at, aml_status, last_modified
)
values
  ('CU-100001', 'Andrea Molina', 'INE', 'IDMEX-746222560', 'ACTIVE', null, current_date, '1995-05-15', 'CDMX, México', 'NOT_STARTED', null, 'NOT_STARTED', current_date),
  ('CU-100002', 'Carlos Rodriguez', 'CURP', 'RODC880112HDFLRL09', 'INACTIVE', 'Solicitud del cliente', current_date, '1988-11-22', 'Guadalajara, México', 'PENDING', null, 'REVIEW', current_date),
  ('CU-100003', 'Elena Gomez', 'RFC', 'EGO920203AB1', 'BLACKLISTED', 'Coincidencia en lista de riesgo', current_date, '1992-02-03', 'Monterrey, México', 'REJECTED', null, 'BLOCKED', current_date)
on conflict (id) do update set
  full_name = excluded.full_name,
  document_type = excluded.document_type,
  document_number = excluded.document_number,
  state = excluded.state,
  status_reason = excluded.status_reason,
  status_changed_at = excluded.status_changed_at,
  birth_date = excluded.birth_date,
  address = excluded.address,
  kyc_status = excluded.kyc_status,
  kyc_verified_at = excluded.kyc_verified_at,
  aml_status = excluded.aml_status,
  last_modified = excluded.last_modified;
