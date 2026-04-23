-- App-wide settings (header title, etc.). Public read, admin write.
create table if not exists public.app_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings read all" on public.app_settings;
create policy "app_settings read all"
  on public.app_settings for select
  using (true);

drop policy if exists "app_settings admin write" on public.app_settings;
create policy "app_settings admin write"
  on public.app_settings for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

insert into public.app_settings (key, value)
values ('title', 'Miss Sheridan')
on conflict (key) do nothing;
