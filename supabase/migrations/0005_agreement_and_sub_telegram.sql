alter table public.profiles
  add column if not exists agreement_signed_at timestamptz,
  add column if not exists agreement_initials  text,
  add column if not exists telegram_chat_id    text;
