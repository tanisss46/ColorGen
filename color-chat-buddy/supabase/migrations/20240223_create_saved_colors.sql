create table public.saved_colors (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  color text not null,
  constraint saved_colors_color_user_id_key unique (color, user_id)
);

-- Set up Row Level Security (RLS)
alter table public.saved_colors enable row level security;

-- Create policies
create policy "Users can view their own saved colors"
  on public.saved_colors for select
  using (auth.uid() = user_id);

create policy "Users can insert their own colors"
  on public.saved_colors for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own colors"
  on public.saved_colors for delete
  using (auth.uid() = user_id);
