-- Drop existing tables if they exist
drop table if exists public.profiles cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.messages cascade;

-- Create profiles table
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    stripe_customer_id text unique,
    messages_used integer default 0,
    message_limit integer default 100,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create subscriptions table
create table public.subscriptions (
    id text primary key,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    status text not null,
    price_id text not null,
    quantity integer not null,
    cancel_at_period_end boolean not null default false,
    cancel_at timestamptz,
    canceled_at timestamptz,
    current_period_start timestamptz not null,
    current_period_end timestamptz not null,
    created_at timestamptz default now(),
    ended_at timestamptz,
    _start timestamptz,
    _end timestamptz
);

-- Create messages table
create table public.messages (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) on delete cascade not null,
    content text not null,
    created_at timestamptz default now()
);

-- Set up RLS policies
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Subscriptions policies
create policy "Users can view their own subscriptions"
    on public.subscriptions for select
    using (auth.uid() = profile_id);

-- Messages policies
create policy "Users can view their own messages"
    on public.messages for select
    using (auth.uid() = profile_id);

create policy "Users can insert their own messages"
    on public.messages for insert
    with check (auth.uid() = profile_id);

-- Create trigger to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

create trigger handle_profiles_updated
    before update on public.profiles
    for each row execute procedure public.handle_updated_at();

-- Create trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email)
    values (new.id, new.email);
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
