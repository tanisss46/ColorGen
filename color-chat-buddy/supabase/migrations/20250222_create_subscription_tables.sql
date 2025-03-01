-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Müşteri bilgileri tablosu
create table if not exists public.customers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  stripe_customer_id text unique not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Abonelik bilgileri tablosu
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  status text not null,
  stripe_customer_id text not null,
  stripe_subscription_id text unique not null,
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) politikaları
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;

-- Müşteri politikaları
create policy "Users can view their own customer data."
  on public.customers for select
  using (auth.uid() = user_id);

-- Abonelik politikaları
create policy "Users can view their own subscription data."
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Indexes
create index if not exists customers_user_id_idx on public.customers(user_id);
create index if not exists customers_stripe_customer_id_idx on public.customers(stripe_customer_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions(stripe_subscription_id);
