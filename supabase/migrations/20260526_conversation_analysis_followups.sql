alter table public.conversation_messages
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.conversations
  add column if not exists analysis_updated_at timestamptz;

create table if not exists public.conversation_analysis (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  message_id uuid references public.conversation_messages(id) on delete set null,
  sender_id text not null,
  platform text not null,
  intent text not null default 'general_question',
  lead_score text not null default 'warm' check (lead_score in ('cold', 'warm', 'hot')),
  lead_score_points integer not null default 0,
  lead_score_reason text,
  vehicle_match_ids uuid[] not null default '{}'::uuid[],
  customer_snapshot jsonb not null default '{}'::jsonb,
  next_action text not null default 'reply',
  handoff_reason text,
  analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversation_analysis_agency_created_idx
  on public.conversation_analysis (agency_id, created_at desc);
create index if not exists conversation_analysis_conversation_idx
  on public.conversation_analysis (conversation_id, created_at desc);
create index if not exists conversation_analysis_lead_score_idx
  on public.conversation_analysis (agency_id, lead_score, created_at desc);
create index if not exists conversation_analysis_intent_idx
  on public.conversation_analysis (agency_id, intent, created_at desc);

create table if not exists public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'dismissed')),
  due_at timestamptz,
  assigned_to uuid references public.employees(id) on delete set null,
  source text not null default 'ai',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists follow_up_tasks_agency_status_due_idx
  on public.follow_up_tasks (agency_id, status, due_at asc nulls last);
create index if not exists follow_up_tasks_conversation_idx
  on public.follow_up_tasks (conversation_id, created_at desc);
create index if not exists follow_up_tasks_client_idx
  on public.follow_up_tasks (client_id, created_at desc);

create or replace function public.touch_follow_up_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_follow_up_tasks_updated_at on public.follow_up_tasks;
create trigger touch_follow_up_tasks_updated_at
before update on public.follow_up_tasks
for each row execute function public.touch_follow_up_tasks_updated_at();

alter table public.conversation_analysis enable row level security;
alter table public.follow_up_tasks enable row level security;

drop policy if exists "conversation_analysis agency select" on public.conversation_analysis;
create policy "conversation_analysis agency select" on public.conversation_analysis
for select using (agency_id = public.get_my_agency_id() or public.is_platform_owner());

drop policy if exists "conversation_analysis agency insert" on public.conversation_analysis;
create policy "conversation_analysis agency insert" on public.conversation_analysis
for insert with check (agency_id = public.get_my_agency_id() or public.is_platform_owner());

drop policy if exists "conversation_analysis agency update" on public.conversation_analysis;
create policy "conversation_analysis agency update" on public.conversation_analysis
for update using (agency_id = public.get_my_agency_id() or public.is_platform_owner())
with check (agency_id = public.get_my_agency_id() or public.is_platform_owner());

drop policy if exists "follow_up_tasks agency select" on public.follow_up_tasks;
create policy "follow_up_tasks agency select" on public.follow_up_tasks
for select using (agency_id = public.get_my_agency_id() or public.is_platform_owner());

drop policy if exists "follow_up_tasks agency insert" on public.follow_up_tasks;
create policy "follow_up_tasks agency insert" on public.follow_up_tasks
for insert with check (agency_id = public.get_my_agency_id() or public.is_platform_owner());

drop policy if exists "follow_up_tasks agency update" on public.follow_up_tasks;
create policy "follow_up_tasks agency update" on public.follow_up_tasks
for update using (agency_id = public.get_my_agency_id() or public.is_platform_owner())
with check (agency_id = public.get_my_agency_id() or public.is_platform_owner());

drop policy if exists "follow_up_tasks agency delete" on public.follow_up_tasks;
create policy "follow_up_tasks agency delete" on public.follow_up_tasks
for delete using (agency_id = public.get_my_agency_id() or public.is_platform_owner());

grant select, insert, update on public.conversation_analysis to authenticated;
grant select, insert, update, delete on public.follow_up_tasks to authenticated;
grant all on public.conversation_analysis to service_role;
grant all on public.follow_up_tasks to service_role;
