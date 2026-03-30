-- Create profiles table
create table profiles (
  id uuid references auth.users not null primary key,
  role text check (role in ('customer', 'laundry_guy')),
  full_name text,
  address text,
  building_info jsonb, -- e.g. {"floor": 1, "flat": "101"}
  updated_at timestamp with time zone
);

-- Create services table
create table services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  rate numeric not null
);

-- Create schedules table
create table schedules (
  id uuid primary key default uuid_generate_v4(),
  pickup_date date not null,
  pickup_slot text not null,
  delivery_date date not null,
  delivery_slot text not null,
  status text check (status in ('upcoming', 'active', 'completed')) default 'upcoming',
  created_at timestamp with time zone default now()
);

-- Create orders table
create table orders (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references profiles(id) not null,
  status text check (status in ('pending', 'confirmed', 'processing', 'delivered')) default 'pending',
  items jsonb, -- e.g. [{"type": "shirt", "quantity": 2}]
  services jsonb, -- e.g. ["iron", "wash"]
  total_cost numeric,
  payment_status text check (payment_status in ('unpaid', 'paid')) default 'unpaid',
  schedule_id uuid references schedules(id),
  is_urgent boolean default false,
  delivery_preferences text, -- e.g. "lobby", "doorstep"
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table orders enable row level security;
alter table schedules enable row level security;
alter table services enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Policies for orders
create policy "Customers can view their own orders." on orders
  for select using (auth.uid() = customer_id);

create policy "Laundry guys can view all orders." on orders
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'laundry_guy'
    )
  );

create policy "Customers can insert orders." on orders
  for insert with check (auth.uid() = customer_id);

create policy "Laundry guys can update orders." on orders
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'laundry_guy'
    )
  );

create policy "Customers can update payment on their own delivered orders." on orders
  for update using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

-- Policies for schedules
create policy "Everyone can view schedules." on schedules
  for select using (true);

create policy "Laundry guys can insert schedules." on schedules
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'laundry_guy'
    )
  );

create policy "Laundry guys can update schedules." on schedules
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'laundry_guy'
    )
  );

-- Policies for services
create policy "Services are viewable by everyone." on services
  for select using (true);
