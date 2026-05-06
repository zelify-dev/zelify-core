create table if not exists public.system_activities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor text not null default 'sistema',
  action text not null,
  module text not null,
  affected_item_name text,
  affected_item_id text,
  affected_client_name text,
  affected_client_id text,
  branch_id text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_system_activities_created_at on public.system_activities(created_at desc);
create index if not exists idx_system_activities_module on public.system_activities(module);
