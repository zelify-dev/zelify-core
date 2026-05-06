-- ============================================================
-- Zelify Core — Añadir correo y celular a customers
-- Mantiene migración base intacta y agrega campos nuevos.
-- ============================================================

alter table public.customers
  add column if not exists email text,
  add column if not exists mobile_phone text;

-- Defaults para registros existentes (si están vacíos)
update public.customers
set
  email = coalesce(nullif(email, ''), lower(replace(full_name, ' ', '.')) || '@correo.mx'),
  mobile_phone = coalesce(nullif(mobile_phone, ''), '+52 55 0000 0000')
where email is null
   or email = ''
   or mobile_phone is null
   or mobile_phone = '';
