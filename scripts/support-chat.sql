-- Trade FX–style customer support chat. Run once on Zuvo / Postgres.

create table if not exists public.support_tickets (
  id text primary key,
  account text not null,
  subject text not null default 'Customer Support',
  status text not null default 'open',
  last_message text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_account_idx on public.support_tickets (account);
create index if not exists support_tickets_updated_idx on public.support_tickets (updated_at desc);

create table if not exists public.support_messages (
  id text primary key,
  ticket_id text not null references public.support_tickets (id) on delete cascade,
  account text not null default '',
  message text not null default '',
  type text not null default 'text',
  attachment_url text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_ticket_idx
  on public.support_messages (ticket_id, created_at);

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

grant all on public.support_tickets to service_role;
grant all on public.support_messages to service_role;
grant select on public.support_tickets to anon, authenticated;
grant select on public.support_messages to anon, authenticated;
