-- Create profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade,
    email text unique,
    stripe_customer_id text unique,
    messages_used integer default 0,
    message_limit integer default 100,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
    on profiles for select
    using ( true );

create policy "Users can insert their own profile."
    on profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update own profile."
    on profiles for update
    using ( auth.uid() = id );

-- Create trigger to set updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger on_profiles_updated
    before update on public.profiles
    for each row
    execute procedure public.handle_updated_at();

-- Create trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, email)
    values (new.id, new.email);
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute procedure public.handle_new_user();
