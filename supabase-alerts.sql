create table if not exists budget_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  month_key text not null,
  alert_type text not null check (alert_type in ('warning', 'exceeded')),
  message text not null,
  created_at timestamp with time zone default now(),
  unique (user_id, month_key, alert_type)
);

alter table budget_alerts enable row level security;

create policy "Users can view own budget alerts"
on budget_alerts for select
using (auth.uid() = user_id);

create policy "Users can insert own budget alerts"
on budget_alerts for insert
with check (auth.uid() = user_id);
