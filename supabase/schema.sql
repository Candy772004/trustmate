-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default now(),
  name text,
  mobile text,
  email text,
  role text default 'CUSTOMER',
  address text,
  avatar_url text
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." 
  on public.profiles for select 
  using ( true );

create policy "Users can insert their own profile." 
  on public.profiles for insert 
  with check ( auth.uid() = id );


-- Function to handle new user creation automatically
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, mobile, role, address)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name', 
    new.raw_user_meta_data->>'mobile',
    coalesce(new.raw_user_meta_data->>'role', 'CUSTOMER'),
    new.raw_user_meta_data->>'address'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Services Table
create table if not exists public.services (
  id text primary key, -- keeping text id to match '1', '2' etc. or use uuid
  label text not null,
  description text,
  icon_name text,
  created_at timestamp with time zone default now()
);

-- Enable RLS for services
alter table public.services enable row level security;

create policy "Services are viewable by everyone." 
  on public.services for select 
  using ( true );

-- Technician Details (extends profiles)
create table if not exists public.technician_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  experience text,
  about text,
  rating numeric default 0,
  review_count integer default 0,
  jobs_completed integer default 0,
  portfolio text[] -- array of image URLs
);

-- Enable RLS for technician_profiles
alter table public.technician_profiles enable row level security;

create policy "Technician profiles are viewable by everyone." 
  on public.technician_profiles for select 
  using ( true );

create policy "Technicians can insert own details." 
  on public.technician_profiles for insert 
  with check ( auth.uid() = id );

create policy "Technicians can update own details." 
  on public.technician_profiles for update 
  using ( auth.uid() = id );

-- Bookings Table
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  user_id uuid references public.profiles(id) not null,
  service_id text references public.services(id),
  technician_id uuid references public.profiles(id),
  date timestamptz not null,
  time text not null,
  status text default 'UPCOMING',
  address text not null,
  description text,
  price numeric,
  rating integer,
  review text
);

-- Enable RLS for bookings
alter table public.bookings enable row level security;

create policy "Users can view own bookings." 
  on public.bookings for select 
  using ( auth.uid() = user_id );

create policy "Technicians can view assigned bookings." 
  on public.bookings for select 
  using ( auth.uid() = technician_id );

create policy "Users can create bookings." 
  on public.bookings for insert 
  with check ( auth.uid() = user_id );

create policy "Users can update own bookings." 
  on public.bookings for update 
  using ( auth.uid() = user_id );

-- Insert default services (Seed data)
insert into public.services (id, label, description, icon_name)
values 
  ('1', 'House Maintenance', 'General repairs and upkeep.', 'Home'),
  ('2', 'Pest Control', 'Remove unwanted pests.', 'Bug'),
  ('3', 'Cleaning', 'Deep cleaning services.', 'Sparkles'),
  ('4', 'Installation', 'Install appliances and fixtures.', 'Hammer'),
  ('5', 'Motor Maintenance', 'Vehicle and motor servicing.', 'Settings'),
  ('6', 'System Admin', 'IT and network support.', 'Server'),
  ('7', 'Other Services', 'Miscellaneous professional services.', 'Briefcase'),
  ('8', 'Food & Beverages', 'Catering and food delivery.', 'Coffee'),
  ('9', 'Wellness', 'Health and personal care.', 'Heart')
on conflict (id) do nothing;
