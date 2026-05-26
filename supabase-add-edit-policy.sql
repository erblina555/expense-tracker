create policy "Users can update own expenses"
on expenses for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
