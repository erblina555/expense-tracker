create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  monthly_budget numeric default 300,
  created_at timestamp with time zone default now()
);

create table expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  amount numeric not null,
  category text not null,
  created_at timestamp with time zone default now()
);

create table budget_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  month_key text not null,
  alert_type text not null check (alert_type in ('warning', 'exceeded')),
  message text not null,
  created_at timestamp with time zone default now(),
  unique (user_id, month_key, alert_type)
);

alter table profiles enable row level security;
alter table expenses enable row level security;
alter table budget_alerts enable row level security;

create policy "Users can view own profile"
on profiles for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on profiles for update
using (auth.uid() = id);

create policy "Users can view own expenses"
on expenses for select
using (auth.uid() = user_id);

create policy "Users can insert own expenses"
on expenses for insert
with check (auth.uid() = user_id);

create policy "Users can update own expenses"
on expenses for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own expenses"
on expenses for delete
using (auth.uid() = user_id);

create policy "Users can view own budget alerts"
on budget_alerts for select
using (auth.uid() = user_id);

create policy "Users can insert own budget alerts"
on budget_alerts for insert
with check (auth.uid() = user_id);
