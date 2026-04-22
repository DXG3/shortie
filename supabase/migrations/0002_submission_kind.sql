-- Add kind: 'claim' = "I feel I deserve"; 'offer' = "I'm willing to do to earn"
alter table public.submissions
  add column if not exists kind text not null default 'claim'
  check (kind in ('claim','offer'));
