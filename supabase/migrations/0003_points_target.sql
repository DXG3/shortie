alter table public.profiles
  add column if not exists points_target int not null default 1;
