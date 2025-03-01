-- Create subscriptions table
create table public.subscriptions (
    id text primary key,
    user_id uuid references auth.users not null,
    status text not null,
    plan_type text not null,
    message_limit integer not null default 100,
    messages_used integer not null default 0,
    created timestamp with time zone not null default timezone('utc'::text, now()),
    current_period_start timestamp with time zone not null,
    current_period_end timestamp with time zone not null
);

-- Add RLS policies
alter table public.subscriptions enable row level security;

-- Allow users to read their own subscription
create policy "Users can view own subscription"
    on public.subscriptions for select
    using (auth.uid() = user_id);

-- Create subscription_plans table for plan details
create table public.subscription_plans (
    id text primary key,
    name text not null,
    description text,
    price_monthly numeric not null,
    message_limit integer not null,
    features jsonb not null default '[]'::jsonb,
    is_active boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Insert default plans
insert into public.subscription_plans (id, name, description, price_monthly, message_limit, features) values
('free', 'Free', 'Basic features for casual users', 0, 100, '[
    "100 messages per month",
    "Basic color generation",
    "Standard response time"
]'::jsonb),
('pro', 'Pro', 'Advanced features for professionals', 9.99, 1000, '[
    "1000 messages per month",
    "Advanced color generation",
    "Priority response time",
    "Custom color palettes",
    "Export in multiple formats",
    "Color history tracking"
]'::jsonb);
