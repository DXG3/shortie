-- Session window per submitter
alter table public.profiles
  add column if not exists session_start timestamptz,
  add column if not exists session_end   timestamptz;

-- Milestones
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  points int not null check (points > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.milestones enable row level security;

drop policy if exists "milestones: signed-in read" on public.milestones;
create policy "milestones: signed-in read"
  on public.milestones for select using (auth.uid() is not null);

drop policy if exists "milestones: admin write" on public.milestones;
create policy "milestones: admin write"
  on public.milestones for all
  using (public.is_admin()) with check (public.is_admin());
