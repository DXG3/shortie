create table if not exists public.activity_log (
  id         bigserial primary key,
  user_id    uuid references public.profiles(id) on delete cascade,
  path       text,
  ip         text,
  ua         text,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_user_created_idx
  on public.activity_log (user_id, created_at desc);

create index if not exists activity_log_created_idx
  on public.activity_log (created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists "activity_log: admin read" on public.activity_log;
create policy "activity_log: admin read"
  on public.activity_log for select
  using (public.is_admin());
