-- ============================================================
-- Zelify Core — Migración final única de productos (ES)
-- Incluye:
-- 1) Tablas base del catálogo de productos
-- 2) Seeds de categorías, tipos y subtipos de pago
-- 3) Tabla de instancias de productos
-- 4) Seeds de instancias
-- 5) Localización en español (name/description/badge)
-- ============================================================

-- ------------------------------------------------------------
-- 1. PRODUCT CATEGORIES
-- ------------------------------------------------------------
create table if not exists public.product_categories (
  id           text primary key,
  name         text not null,
  description  text,
  applies_to   text not null default 'BOTH' check (applies_to in ('LOAN', 'DEPOSIT', 'BOTH')),
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. PRODUCT TYPE DEFINITIONS
-- ------------------------------------------------------------
create table if not exists public.product_type_definitions (
  id           text primary key,
  name         text not null,
  code         text not null unique,
  kind         text not null check (kind in ('LOAN', 'DEPOSIT')),
  description  text,
  badge        text,
  features     text[],
  subtype_of   text references public.product_type_definitions(id) on delete set null,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_product_type_def_kind on public.product_type_definitions(kind);
create index if not exists idx_product_type_def_is_active on public.product_type_definitions(is_active);

-- ------------------------------------------------------------
-- 3. PRODUCT TYPE ↔ CATEGORY
-- ------------------------------------------------------------
create table if not exists public.product_type_categories (
  product_type_id  text not null references public.product_type_definitions(id) on delete cascade,
  category_id      text not null references public.product_categories(id) on delete cascade,
  primary key (product_type_id, category_id)
);

-- ------------------------------------------------------------
-- 4. LOAN PAYMENT SUBTYPES
-- ------------------------------------------------------------
create table if not exists public.loan_payment_subtypes (
  id              text primary key,
  name            text not null,
  description     text,
  available_for   text[],
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

-- Trigger updated_at
create or replace function public.set_product_type_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_product_type_updated_at on public.product_type_definitions;
create trigger trg_product_type_updated_at
  before update on public.product_type_definitions
  for each row execute function public.set_product_type_updated_at();

-- ------------------------------------------------------------
-- 5. CATEGORIES (ES)
-- ------------------------------------------------------------
insert into public.product_categories (id, name, description, applies_to, sort_order) values
  ('PERSONAL_BANKING',  'Banca Personal',    'Cuentas transaccionales diarias para personas; con tarjeta de débito y sobregiro',              'DEPOSIT', 10),
  ('BUSINESS_BANKING',  'Banca Empresarial', 'Cuentas transaccionales para empresas; con tarjeta de débito y sobregiro',                      'DEPOSIT', 20),
  ('PERSONAL_DEPOSITS', 'Depósitos Personales', 'Ahorro personal con capacidad de generación de interés',                                       'DEPOSIT', 30),
  ('BUSINESS_DEPOSITS', 'Depósitos Empresariales', 'Ahorro e inversión para empresas con generación de interés',                               'DEPOSIT', 40),
  ('STORED_VALUE',      'Valor Almacenado',  'Billeteras digitales, tarjetas prepago, gift cards',                                              'DEPOSIT', 50),
  ('PERSONAL_LENDING',  'Crédito Personal',  'Productos de préstamo para clientes individuales',                                                'LOAN',    60),
  ('BUSINESS_LENDING',  'Crédito Empresarial', 'Productos de préstamo para empresas y pymes',                                                   'LOAN',    70),
  ('MICROFINANCE',      'Microfinanzas',     'Productos de inclusión financiera y microcrédito',                                               'LOAN',    80),
  ('MORTGAGES',         'Hipotecas',         'Productos hipotecarios para vivienda y comercio',                                                 'LOAN',    90),
  ('PURCHASE_FINANCE',  'Financiamiento de Compras', 'Buy Now Pay Later y financiación en punto de venta',                                    'LOAN',   100),
  ('UNCATEGORIZED',     'Sin Categoría',     'Cuentas de liquidación, nostro, técnicas o internas sin categoría',                              'BOTH',   999)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  applies_to = excluded.applies_to,
  sort_order = excluded.sort_order;

-- ------------------------------------------------------------
-- 6. PRODUCT TYPE DEFINITIONS (ES)
-- ------------------------------------------------------------
insert into public.product_type_definitions
  (id, name, code, kind, description, badge, features, sort_order, is_active)
values
  ('FIXED_TERM_LOAN', 'Préstamo a Plazo Fijo', 'FIXED_TERM_LOAN', 'LOAN',
   'Préstamo a plazo fijo con cronograma de pagos predefinido. El interés y las cuotas no se recalculan ante prepagos.',
   'Más común',
   array[
     'Schedule fijo: cuotas iguales o decrecientes predefinidas',
     'Métodos de pago: Standard, Balloon, Payment Plan',
     'Prepagos aceptados pero sin recálculo del schedule',
     'Planned fees configurables por cuota',
     'Disponible para clientes individuales y grupos',
     'Interés: Flat, Declining Balance, Equal Installments'
   ], 10, true),
  ('DYNAMIC_TERM_LOAN', 'Préstamo a Plazo Dinámico', 'DYNAMIC_TERM_LOAN', 'LOAN',
   'Préstamo a plazo con recálculo dinámico del interés y schedule cuando se realizan prepagos o cambios de tasa.',
   'Flexible',
   array[
     'Schedule recalculado automáticamente ante prepagos',
     'Métodos: Standard, Balloon, Optimized Payments',
     'Soporte para tasa indexada (variable) con spread',
     'Cambio de tasa de interés en cuentas activas',
     'Ajuste de número de cuotas y fechas de pago',
     'Interés: Declining Balance, Equal Installments (DBEI)'
   ], 20, true),
  ('REVOLVING_CREDIT', 'Crédito Revolvente', 'REVOLVING_CREDIT', 'LOAN',
   'Línea de crédito rotativa con múltiples desembolsos y pagos. Usado para tarjetas de crédito, BNPL y líneas de crédito empresariales.',
   'Revolvente',
   array[
     'Múltiples desembolsos y repagos sobre la misma cuenta',
     'Billing cycles: separación entre cierre de ciclo y fecha de pago',
     'Interés sobre Principal Only o Principal + Interest (tarjetas)',
     'Soporte para Buy Now Pay Later (BNPL)',
     'Penalidades y fees automáticos por cuota vencida',
     'No soporta Planned Fees'
   ], 30, true),
  ('TRANCHED_LOAN', 'Préstamo por Tramos', 'TRANCHED_LOAN', 'LOAN',
   'Préstamo con desembolso en múltiples tramos. Cada tramo tiene monto y fecha esperada de desembolso independiente.',
   'Multi-tramo',
   array[
     'Monto total aprobado dividido en N tramos configurables',
     'Schedule calculado sobre tramos ya desembolsados',
     'Fees de desembolso aplicados solo en el primer tramo',
     'Tramos 2+ tratan fees requeridos como opcionales',
     'Vista de preview con o sin tramos pendientes',
     'Activa con el primer desembolso; tramos posteriores en cola'
   ], 40, true),
  ('INTEREST_FREE', 'Préstamo Sin Interés', 'INTEREST_FREE', 'LOAN',
   'Préstamo sin interés. Usado típicamente para productos Sharia-compliant (banca islámica) y microfinanzas sin cargo.',
   'Islámico / Social',
   array[
     'Sin acumulación ni cobro de interés (0%)',
     'Base para contratos Qard Hassan',
     'Permite fees de desembolso, manuales y penalidades',
     'Schedule de principal puro sin componente de interés',
     'Usado en inclusión financiera y microcrédito'
   ], 50, true),
  ('DYNAMIC_MORTGAGE', 'Hipoteca Dinámica', 'DYNAMIC_MORTGAGE', 'LOAN',
   'Hipoteca de capital con cuotas iguales e interés calculado sobre principal + interés outstanding. Soporta interés compuesto con rest diario.',
   'Hipoteca',
   array[
     'Interés simple y compuesto con daily rest',
     'Tasas ajustables: fija + variable por tramos',
     'Spread negativo no soportado',
     'Última cuota como cuota de ajuste',
     'Facilidad Redraw'
   ], 60, true),
  ('SAVINGS_ACCOUNT', 'Cuenta de Ahorro', 'SAVINGS_ACCOUNT', 'DEPOSIT',
   'Cuenta de ahorro con acumulación de interés periódica. Depósitos y retiros libres dentro de los límites del producto.',
   'Personal / Negocio',
   array[
     'Interés acumulado diariamente y aplicado a la frecuencia configurada',
     'Tasa fija, escalonada o indexada',
     'Retiro máximo por transacción configurable',
     'Soporte para withholding tax',
     'Puede volverse Dormant',
     'Disponible para personas y empresas/grupos'
   ], 110, true),
  ('CURRENT_ACCOUNT', 'Cuenta Corriente', 'CURRENT_ACCOUNT', 'DEPOSIT',
   'Cuenta corriente transaccional con soporte para sobregiro. El saldo puede ser negativo hasta el límite autorizado.',
   'Sobregiro',
   array[
     'Sobregiro hasta límite configurado por cuenta',
     'Interés de sobregiro fijo o escalonado',
     'Overdraft técnico habilitado',
     'Vencimiento configurable del límite',
     'Entra en mora tras vencimiento con saldo negativo',
     'Soporte para tarjeta débito y POS holds'
   ], 120, true),
  ('FIXED_DEPOSIT', 'Depósito a Plazo Fijo', 'FIXED_DEPOSIT', 'DEPOSIT',
   'Depósito a plazo fijo con período de madurez. Al alcanzar el balance mínimo de apertura inicia la madurez y se bloquean depósitos.',
   'Plazo fijo',
   array[
     'Estados: Begin Maturity Period -> Matured',
     'Durante madurez no permite depósitos',
     'Interés desde activación',
     'Balance mínimo de apertura obligatorio',
     'Undo Maturity antes del vencimiento',
     'Cierre solo con balance cero'
   ], 130, true),
  ('SAVINGS_PLAN', 'Plan de Ahorro', 'SAVINGS_PLAN', 'DEPOSIT',
   'Plan de ahorro programado similar al depósito fijo, pero permite depósitos continuos incluso durante el período de madurez.',
   'Plan de ahorro',
   array[
     'Permite depósitos durante madurez',
     'Bloquea depósitos al terminar madurez',
     'Interés desde activación',
     'Monto recomendado configurable',
     'Máximo de balance por cuenta',
     'Diferencia clave vs Fixed Deposit'
   ], 140, true),
  ('STORED_VALUE_WALLET', 'Valor Almacenado / Billetera', 'STORED_VALUE_WALLET', 'DEPOSIT',
   'Subconjunto de cuenta corriente para billeteras digitales, tarjetas prepago y gift cards.',
   'Digital',
   array[
     'Uso en billeteras, prepago y gift cards',
     'Subconjunto de Current Account',
     'Integración con conectores de pago',
     'Soporte para cripto como moneda',
     'Configuración low-code/no-code'
   ], 150, true)
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  kind = excluded.kind,
  description = excluded.description,
  badge = excluded.badge,
  features = excluded.features,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

update public.product_type_definitions set subtype_of = 'DYNAMIC_TERM_LOAN' where id in ('TRANCHED_LOAN', 'DYNAMIC_MORTGAGE');
update public.product_type_definitions set subtype_of = 'CURRENT_ACCOUNT' where id = 'STORED_VALUE_WALLET';

-- ------------------------------------------------------------
-- 7. LOAN PAYMENT SUBTYPES (ES)
-- ------------------------------------------------------------
insert into public.loan_payment_subtypes (id, name, description, available_for, sort_order) values
  ('STANDARD_PAYMENTS', 'Pagos Estándar', 'Divide el monto total por número de cuotas. La última cuota puede variar levemente por redondeo.', array['FIXED_TERM_LOAN','DYNAMIC_TERM_LOAN'], 10),
  ('BALLOON_PAYMENTS', 'Pagos Balloon', 'Pagos periódicos con una cuota final grande que liquida el principal restante.', array['FIXED_TERM_LOAN','DYNAMIC_TERM_LOAN'], 20),
  ('OPTIMIZED_PAYMENTS', 'Pagos Optimizados', 'Minimiza desviación de la última cuota cuando el primer período difiere del resto.', array['DYNAMIC_TERM_LOAN'], 30),
  ('PAYMENT_PLAN', 'Plan de Pagos', 'Pagos periódicos configurables con tasas que pueden variar por tramo.', array['FIXED_TERM_LOAN'], 40)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  available_for = excluded.available_for,
  sort_order = excluded.sort_order;

-- ------------------------------------------------------------
-- 8. TYPE ↔ CATEGORY mapping
-- ------------------------------------------------------------
insert into public.product_type_categories (product_type_id, category_id) values
  ('FIXED_TERM_LOAN', 'PERSONAL_LENDING'),
  ('FIXED_TERM_LOAN', 'BUSINESS_LENDING'),
  ('FIXED_TERM_LOAN', 'MICROFINANCE'),
  ('DYNAMIC_TERM_LOAN', 'PERSONAL_LENDING'),
  ('DYNAMIC_TERM_LOAN', 'BUSINESS_LENDING'),
  ('REVOLVING_CREDIT', 'PERSONAL_LENDING'),
  ('REVOLVING_CREDIT', 'BUSINESS_LENDING'),
  ('REVOLVING_CREDIT', 'PURCHASE_FINANCE'),
  ('TRANCHED_LOAN', 'BUSINESS_LENDING'),
  ('INTEREST_FREE', 'MICROFINANCE'),
  ('INTEREST_FREE', 'PERSONAL_LENDING'),
  ('DYNAMIC_MORTGAGE', 'MORTGAGES'),
  ('SAVINGS_ACCOUNT', 'PERSONAL_DEPOSITS'),
  ('SAVINGS_ACCOUNT', 'BUSINESS_DEPOSITS'),
  ('CURRENT_ACCOUNT', 'PERSONAL_BANKING'),
  ('CURRENT_ACCOUNT', 'BUSINESS_BANKING'),
  ('FIXED_DEPOSIT', 'PERSONAL_DEPOSITS'),
  ('FIXED_DEPOSIT', 'BUSINESS_DEPOSITS'),
  ('SAVINGS_PLAN', 'PERSONAL_DEPOSITS'),
  ('SAVINGS_PLAN', 'BUSINESS_DEPOSITS'),
  ('STORED_VALUE_WALLET', 'STORED_VALUE')
on conflict do nothing;

-- ------------------------------------------------------------
-- 9. INSTANCIAS DE PRODUCTO (tabla products)
-- ------------------------------------------------------------
create table if not exists public.products (
  id                        text primary key,
  name                      text not null,
  kind                      text not null check (kind in ('DEPOSIT', 'LOAN')),
  active                    boolean not null default true,
  min_amount                numeric(14,2) not null default 0,
  max_amount                numeric(14,2) not null default 0,
  min_interest_rate         numeric(8,4) not null default 0,
  max_interest_rate         numeric(8,4) not null default 0,
  product_type              text,
  overdraft_allowed         boolean not null default false,
  overdraft_limit           numeric(14,2) not null default 0,
  interest_rate_settings    text not null default 'FIXED' check (interest_rate_settings in ('FIXED', 'TIERED')),
  loan_type_code            text,
  payment_method            text not null default 'EQUATED_INSTALLMENTS' check (payment_method in ('EQUATED_INSTALLMENTS', 'DECLINING_BALANCE')),
  grace_period_installments int not null default 0,
  max_installments          int not null default 12,
  repayment_frequency       text not null default 'MONTHLY' check (repayment_frequency in ('DAILY', 'WEEKLY', 'MONTHLY')),
  collateral_required       boolean not null default false,
  updated_at                date not null default current_date,
  created_at                timestamptz not null default now()
);

create index if not exists idx_products_kind on public.products(kind);
create index if not exists idx_products_active on public.products(active);

insert into public.products (
  id, name, kind, active, min_amount, max_amount, min_interest_rate, max_interest_rate,
  product_type, overdraft_allowed, overdraft_limit, interest_rate_settings,
  loan_type_code, payment_method, grace_period_installments, max_installments, repayment_frequency, collateral_required, updated_at
) values
  ('DEP-PROD-001', 'Ahorro Programado', 'DEPOSIT', true, 50, 50000, 1.50, 6.50, 'SAVINGS_PLAN', false, 0, 'TIERED', null, 'EQUATED_INSTALLMENTS', 0, 12, 'MONTHLY', false, '2026-04-18'),
  ('DEP-PROD-002', 'Cuenta Nómina', 'DEPOSIT', true, 0, 100000, 0.10, 2.10, 'CURRENT_ACCOUNT', true, 1200, 'FIXED', null, 'EQUATED_INSTALLMENTS', 0, 12, 'MONTHLY', false, '2026-04-12'),
  ('DEP-PROD-003', 'Ahorro Juvenil', 'DEPOSIT', true, 25, 8000, 2.00, 5.25, 'SAVINGS_PLAN', false, 0, 'TIERED', null, 'EQUATED_INSTALLMENTS', 0, 12, 'MONTHLY', false, '2026-04-10'),
  ('DEP-PROD-004', 'Depósito a Plazo 90 Días', 'DEPOSIT', true, 500, 250000, 3.25, 7.50, 'FIXED_DEPOSIT', false, 0, 'FIXED', null, 'EQUATED_INSTALLMENTS', 0, 12, 'MONTHLY', false, '2026-04-16'),
  ('DEP-PROD-005', 'Cuenta de Ahorros Libre', 'DEPOSIT', true, 100, 75000, 0.35, 3.80, 'SAVINGS_ACCOUNT', false, 0, 'FIXED', null, 'EQUATED_INSTALLMENTS', 0, 12, 'MONTHLY', false, '2026-04-14'),
  ('DEP-PROD-006', 'Ahorro Grupal Comunitario', 'DEPOSIT', true, 100, 25000, 1.75, 5.90, 'SAVINGS_PLAN', false, 0, 'TIERED', null, 'EQUATED_INSTALLMENTS', 0, 12, 'MONTHLY', false, '2026-04-11'),
  ('DEP-PROD-007', 'Billetera Digital USD', 'DEPOSIT', true, 0, 10000, 0.00, 0.00, 'STORED_VALUE_WALLET', false, 0, 'FIXED', null, 'EQUATED_INSTALLMENTS', 0, 12, 'MONTHLY', false, '2026-05-01'),
  ('LOAN-PROD-001', 'Microcrédito Agrícola', 'LOAN', true, 500, 5000, 8.00, 18.00, null, false, 0, 'FIXED', 'FIXED_TERM_LOAN', 'DECLINING_BALANCE', 1, 24, 'MONTHLY', false, '2026-04-20'),
  ('LOAN-PROD-002', 'Crédito Comercial PyME', 'LOAN', true, 3000, 50000, 9.50, 21.00, null, false, 0, 'FIXED', 'DYNAMIC_TERM_LOAN', 'EQUATED_INSTALLMENTS', 2, 36, 'MONTHLY', true, '2026-04-15'),
  ('LOAN-PROD-003', 'Préstamo Personal a Plazo Fijo', 'LOAN', true, 1000, 20000, 7.00, 15.00, null, false, 0, 'FIXED', 'FIXED_TERM_LOAN', 'EQUATED_INSTALLMENTS', 0, 48, 'MONTHLY', false, '2026-04-22'),
  ('LOAN-PROD-004', 'Línea de Crédito Empresarial', 'LOAN', true, 5000, 100000, 10.00, 24.00, null, false, 0, 'FIXED', 'REVOLVING_CREDIT', 'EQUATED_INSTALLMENTS', 0, 12, 'MONTHLY', false, '2026-04-28'),
  ('LOAN-PROD-005', 'Hipoteca de Vivienda', 'LOAN', true, 50000, 500000, 4.50, 8.00, null, false, 0, 'FIXED', 'DYNAMIC_MORTGAGE', 'DECLINING_BALANCE', 0, 360, 'MONTHLY', true, '2026-04-30'),
  ('LOAN-PROD-006', 'Microcrédito Islámico', 'LOAN', true, 200, 5000, 0.00, 0.00, null, false, 0, 'FIXED', 'INTEREST_FREE', 'EQUATED_INSTALLMENTS', 0, 18, 'MONTHLY', false, '2026-05-02'),
  ('LOAN-PROD-007', 'Crédito de Infraestructura por Tramos', 'LOAN', true, 10000, 200000, 11.00, 20.00, null, false, 0, 'FIXED', 'TRANCHED_LOAN', 'EQUATED_INSTALLMENTS', 0, 60, 'MONTHLY', true, '2026-05-03')
on conflict (id) do update set
  name = excluded.name,
  kind = excluded.kind,
  active = excluded.active,
  min_amount = excluded.min_amount,
  max_amount = excluded.max_amount,
  min_interest_rate = excluded.min_interest_rate,
  max_interest_rate = excluded.max_interest_rate,
  product_type = excluded.product_type,
  overdraft_allowed = excluded.overdraft_allowed,
  overdraft_limit = excluded.overdraft_limit,
  interest_rate_settings = excluded.interest_rate_settings,
  loan_type_code = excluded.loan_type_code,
  payment_method = excluded.payment_method,
  grace_period_installments = excluded.grace_period_installments,
  max_installments = excluded.max_installments,
  repayment_frequency = excluded.repayment_frequency,
  collateral_required = excluded.collateral_required,
  updated_at = excluded.updated_at;
