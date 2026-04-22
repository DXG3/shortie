-- Shortie: Good Girl Points schema
-- Run this in the Supabase SQL editor for project hbmffokwhewrzkbdouxk

create extension if not exists "pgcrypto";

-- profiles: one row per auth user, role flag
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  role text not null check (role in ('admin','submitter')) default 'submitter',
  created_at timestamptz not null default now()
);

-- invites: pre-authorise emails before they sign in
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('admin','submitter')) default 'submitter',
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  used_at timestamptz
);

-- submissions: point requests from the submitter
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references public.profiles(id) on delete cascade,
  requested_points int not null,
  reason text not null,
  status text not null check (status in ('pending','approved','declined','amended')) default 'pending',
  awarded_points int,            -- final points (may differ from requested if amended)
  admin_note text,
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

-- rewards: catalogue of things she can spend points on
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cost int not null check (cost > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- redemptions: when points are spent
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id),
  cost_at_redemption int not null,
  note text,
  created_at timestamptz not null default now()
);

-- running-total view
create or replace view public.point_balances as
select
  p.id as submitter_id,
  coalesce((select sum(awarded_points) from public.submissions s
            where s.submitter_id = p.id and s.status in ('approved','amended')), 0)
  -
  coalesce((select sum(cost_at_redemption) from public.redemptions r
            where r.submitter_id = p.id), 0) as balance
from public.profiles p
where p.role = 'submitter';

-- daily net for chart
create or replace view public.daily_points as
select
  submitter_id,
  event_day as day,
  coalesce(sum(pts), 0)::int as net
from (
  select submitter_id, created_at::date as event_day, awarded_points as pts
    from public.submissions where status in ('approved','amended')
  union all
  select submitter_id, created_at::date as event_day, -cost_at_redemption as pts
    from public.redemptions
) x
where event_day >= current_date - interval '29 days'
group by submitter_id, event_day;

-- enable RLS
alter table public.profiles     enable row level security;
alter table public.invites      enable row level security;
alter table public.submissions  enable row level security;
alter table public.rewards      enable row level security;
alter table public.redemptions  enable row level security;

-- helper: is the caller admin?
create or replace function public.is_admin() returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles policies
create policy "profiles: self or admin read"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());
create policy "profiles: admin write"
  on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- invites: admin only (service_role bypasses RLS anyway for server actions)
create policy "invites: admin all"
  on public.invites for all
  using (public.is_admin()) with check (public.is_admin());

-- submissions
create policy "submissions: submitter sees own, admin sees all"
  on public.submissions for select
  using (submitter_id = auth.uid() or public.is_admin());
create policy "submissions: submitter inserts own pending"
  on public.submissions for insert
  with check (submitter_id = auth.uid() and status = 'pending');
create policy "submissions: admin updates"
  on public.submissions for update
  using (public.is_admin()) with check (public.is_admin());

-- rewards: anyone signed-in can read; admin writes
create policy "rewards: signed-in read"
  on public.rewards for select using (auth.uid() is not null);
create policy "rewards: admin write"
  on public.rewards for all
  using (public.is_admin()) with check (public.is_admin());

-- redemptions: submitter sees own, admin sees all. Inserts via service_role only (server action deducts balance).
create policy "redemptions: read self or admin"
  on public.redemptions for select
  using (submitter_id = auth.uid() or public.is_admin());

-- on new auth user, create profile and honour any matching invite
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
declare
  inv record;
  resolved_role text := 'submitter';
begin
  select * into inv from public.invites where lower(email) = lower(new.email) and used_at is null limit 1;
  if found then
    resolved_role := inv.role;
    update public.invites set used_at = now() where id = inv.id;
  end if;

  insert into public.profiles (id, email, role)
  values (new.id, new.email, resolved_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- seed: pre-authorise the owner as admin
insert into public.invites (email, role) values ('bobbygallacher@hotmail.com', 'admin')
on conflict (email) do update set role = excluded.role;
