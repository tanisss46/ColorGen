-- Seed data for testing
insert into auth.users (id, email)
values 
  ('00000000-0000-0000-0000-000000000000', 'test@example.com')
on conflict (id) do nothing;

insert into public.profiles (id, email, messages_used, message_limit)
values 
  ('00000000-0000-0000-0000-000000000000', 'test@example.com', 0, 100)
on conflict (id) do nothing;
