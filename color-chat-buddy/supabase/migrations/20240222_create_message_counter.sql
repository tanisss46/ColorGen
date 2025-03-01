-- Create function to increment message count
create or replace function public.increment_message_count(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.subscriptions
  set messages_used = messages_used + 1
  where subscriptions.user_id = increment_message_count.user_id
  and status = 'active';
end;
$$;
