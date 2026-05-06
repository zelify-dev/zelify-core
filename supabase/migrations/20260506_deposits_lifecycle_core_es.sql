-- ============================================================
-- Zelify Core — Depositos (tipos, ciclo de vida, interes, tx)
-- ============================================================

create table if not exists public.deposit_accounts (
  id                          text primary key,
  product_type_id             text not null references public.product_type_definitions(id),
  product_code                text not null,
  product_name                text not null,
  holder_kind                 text not null check (holder_kind in ('INDIVIDUAL', 'COMPANY')),
  holder_id                   text not null,
  holder_name                 text not null,
  branch_id                   text,
  state                       text not null check (state in ('PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'DORMANT', 'BEGIN_MATURITY_PERIOD', 'MATURED', 'CLOSED', 'WRITTEN_OFF')),
  balance                     numeric(14,2) not null default 0,
  available_balance           numeric(14,2) not null default 0,
  overdraft_limit             numeric(14,2) not null default 0,
  is_dormant                  boolean not null default false,
  dormant_after_days          integer not null default 90,
  allow_interest_accrual      boolean not null default true,
  interest_base_method        text not null default 'AVERAGE_DAILY_BALANCE' check (interest_base_method in ('AVERAGE_DAILY_BALANCE', 'MINIMUM_DAILY_BALANCE', 'END_OF_DAY_BALANCE')),
  days_convention             text not null default 'ACTUAL_365' check (days_convention in ('ACTUAL_365', 'ACTUAL_360', 'ACTUAL_ACTUAL_ISDA', '30E_360')),
  rate_mode                   text not null default 'FIXED' check (rate_mode in ('FIXED', 'INDEXED', 'TIERED')),
  nominal_rate                numeric(8,4) not null default 0,
  index_name                  text,
  spread_rate                 numeric(8,4),
  withholding_tax_pct         numeric(8,4) not null default 0,
  overdraft_interest_rate     numeric(8,4) not null default 0,
  min_tx_amount               numeric(14,2) not null default 0,
  max_withdrawal_amount       numeric(14,2) not null default 999999999,
  recommended_deposit_amount  numeric(14,2),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create table if not exists public.deposit_rate_tiers (
  id                 uuid primary key default gen_random_uuid(),
  deposit_account_id text not null references public.deposit_accounts(id) on delete cascade,
  min_balance        numeric(14,2) not null,
  max_balance        numeric(14,2),
  rate_pct           numeric(8,4) not null
);

create table if not exists public.deposit_transactions (
  id                        uuid primary key default gen_random_uuid(),
  deposit_account_id        text not null references public.deposit_accounts(id) on delete cascade,
  tx_type                   text not null check (tx_type in ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_TO_LOAN', 'TRANSFER_TO_DEPOSIT', 'ADJUSTMENT', 'REVERSAL', 'INTEREST_APPLIED', 'INTEREST_REVERSAL', 'WRITE_OFF')),
  tx_date                   date not null,
  channel                   text,
  amount                    numeric(14,2) not null,
  related_account_id        text,
  related_loan_id           text,
  note                      text,
  audit_reason              text,
  created_at                timestamptz not null default now()
);

create table if not exists public.deposit_card_holds (
  id                        uuid primary key default gen_random_uuid(),
  deposit_account_id        text not null references public.deposit_accounts(id) on delete cascade,
  merchant_name             text not null,
  amount                    numeric(14,2) not null,
  status                    text not null check (status in ('HELD', 'RELEASED')),
  held_at                   timestamptz not null default now(),
  released_at               timestamptz
);

create index if not exists idx_deposit_accounts_state on public.deposit_accounts(state);
create index if not exists idx_deposit_tx_account_date on public.deposit_transactions(deposit_account_id, tx_date desc);

insert into public.deposit_accounts (
  id, product_type_id, product_code, product_name, holder_kind, holder_id, holder_name, state,
  balance, available_balance, overdraft_limit, interest_base_method, rate_mode, nominal_rate,
  withholding_tax_pct, overdraft_interest_rate, min_tx_amount, max_withdrawal_amount, recommended_deposit_amount
)
select
  'DEP-2026-0001', p.id, p.code, p.name, 'INDIVIDUAL', 'CU-100001', 'Andrea Molina', 'ACTIVE',
  18500, 18000, 5000, 'AVERAGE_DAILY_BALANCE', 'FIXED', 6.5, 10, 28, 100, 12000, 1000
from public.product_type_definitions p
where p.code = 'SAVINGS_ACCOUNT'
on conflict (id) do nothing;
