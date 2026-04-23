alter table public.profiles
  add column if not exists nickname  text,
  add column if not exists safe_word text;
