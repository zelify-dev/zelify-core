-- ============================================================
-- Zelify Core — Prestamos (ciclo de vida, schedule, transacciones)
-- ============================================================

create table if not exists public.loans (
  id                         text primary key,
  product_type_id            text not null references public.product_type_definitions(id),
  product_code               text not null,
  product_name               text not null,
  customer_id                text not null,
  customer_name              text not null,
  principal_amount           numeric(14,2) not null,
  currency                   text not null default 'MXN',
  disbursement_date          date,
  disbursement_channel       text,
  expected_disbursement_date date,
  lifecycle_state            text not null check (
    lifecycle_state in (
      'PARTIAL_APPLICATION',
      'PENDING_APPROVAL',
      'APPROVED',
      'ACTIVE',
      'ACTIVE_IN_ARREARS',
      'LOCKED',
      'CLOSED',
      'WRITTEN_OFF'
    )
  ),
  outstanding_principal      numeric(14,2) not null default 0,
  outstanding_interest       numeric(14,2) not null default 0,
  outstanding_fees           numeric(14,2) not null default 0,
  outstanding_penalties      numeric(14,2) not null default 0,
  interest_calculation_method text not null default 'DECLINING_BALANCE',
  rate_mode                  text not null default 'FIXED' check (rate_mode in ('FIXED', 'INDEXED')),
  nominal_rate               numeric(8,4) not null default 0,
  index_name                 text,
  spread_rate                numeric(8,4),
  review_frequency           text not null default 'MONTHLY',
  accrued_daily              boolean not null default true,
  grace_period_type          text default 'AFTER_DISBURSEMENT',
  grace_period_days          integer not null default 0,
  arrears_counting_method    text not null default 'OLDEST_DUE',
  arrears_tolerance_days     integer not null default 0,
  arrears_tolerance_pct      numeric(8,4) not null default 0,
  penalty_daily_rate         numeric(8,4) not null default 0,
  lock_suspends_accrual      boolean not null default true,
  allocation_method          text not null default 'HORIZONTAL' check (allocation_method in ('HORIZONTAL', 'VERTICAL')),
  allocation_priority         text[] not null default array['PRINCIPAL','INTEREST','FEES','PENALTIES'],
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create table if not exists public.loan_tranches (
  id                    uuid primary key default gen_random_uuid(),
  loan_id               text not null references public.loans(id) on delete cascade,
  tranche_no            integer not null,
  expected_date         date not null,
  disbursed_date        date,
  amount                numeric(14,2) not null,
  disbursement_channel  text,
  status                text not null check (status in ('PLANNED', 'DISBURSED', 'CANCELLED')),
  created_at            timestamptz not null default now(),
  unique (loan_id, tranche_no)
);

create table if not exists public.loan_schedule_items (
  id                 uuid primary key default gen_random_uuid(),
  loan_id            text not null references public.loans(id) on delete cascade,
  installment_no     integer not null,
  due_date           date not null,
  principal_due      numeric(14,2) not null default 0,
  interest_due       numeric(14,2) not null default 0,
  fees_due           numeric(14,2) not null default 0,
  penalties_due      numeric(14,2) not null default 0,
  principal_paid     numeric(14,2) not null default 0,
  interest_paid      numeric(14,2) not null default 0,
  fees_paid          numeric(14,2) not null default 0,
  penalties_paid     numeric(14,2) not null default 0,
  status             text not null check (status in ('PAID', 'PARTIAL', 'DUE', 'OVERDUE')),
  unique (loan_id, installment_no)
);

create table if not exists public.loan_transactions (
  id                       uuid primary key default gen_random_uuid(),
  loan_id                  text not null references public.loans(id) on delete cascade,
  tx_type                  text not null check (
    tx_type in (
      'DISBURSEMENT',
      'REPAYMENT',
      'BULK_REPAYMENT',
      'REVERSAL',
      'REPAYMENT_FROM_DEPOSIT',
      'RESTRUCTURE',
      'REFINANCE',
      'WRITE_OFF',
      'PAY_OFF',
      'TERMINATION',
      'FEE_CHARGE'
    )
  ),
  tx_date                  date not null,
  channel                  text,
  amount_total             numeric(14,2) not null default 0,
  principal_component      numeric(14,2) not null default 0,
  interest_component       numeric(14,2) not null default 0,
  fees_component           numeric(14,2) not null default 0,
  penalties_component      numeric(14,2) not null default 0,
  related_deposit_account  text,
  notes                    text,
  audit_reason             text,
  created_at               timestamptz not null default now()
);

create table if not exists public.loan_restructures (
  id                    uuid primary key default gen_random_uuid(),
  loan_id               text not null references public.loans(id) on delete cascade,
  restructure_type      text not null check (restructure_type in ('RESCHEDULING', 'REFINANCING', 'CAPITALIZATION')),
  effective_date        date not null,
  details               jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists idx_loans_state on public.loans(lifecycle_state);
create index if not exists idx_schedule_loan_due on public.loan_schedule_items(loan_id, due_date);
create index if not exists idx_tx_loan_date on public.loan_transactions(loan_id, tx_date desc);

insert into public.loans (
  id, product_type_id, product_code, product_name, customer_id, customer_name, principal_amount, currency,
  expected_disbursement_date, lifecycle_state, outstanding_principal, nominal_rate, interest_calculation_method
)
select
  'LN-2026-0001', p.id, p.code, p.name, 'CU-100001', 'Andrea Molina', 120000, 'MXN',
  current_date + interval '3 day', 'PENDING_APPROVAL', 120000, 24.5, 'DECLINING_BALANCE'
from public.product_type_definitions p
where p.code = 'FIXED_TERM_LOAN'
on conflict (id) do nothing;
