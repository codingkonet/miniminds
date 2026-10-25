-- MiniMINDS monetization (optional full tables - the app works without them)
-- The app stores the live monetization config as JSON in app_settings(key='monetization'),
-- editable in Admin > Monetization. These tables are for real subscription records
-- when you add payment webhooks (PayPal IPN / Stripe) via a Supabase Edge Function.

create table if not exists public.plans (
  id text primary key, name_en text not null, name_fr text not null,
  price numeric default 0, currency text default 'USD', period text default 'month',
  features_en text, features_fr text, is_active boolean default true,
  is_popular boolean default false, sort_order int default 0, created_at timestamptz default now()
);
create table if not exists public.payment_methods (
  id text primary key, name text not null, enabled boolean default false,
  link text, email text, instructions text, created_at timestamptz default now()
);
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profiles(id) on delete cascade,
  kid_id uuid references public.kid_profiles(id) on delete cascade,
  plan_id text references public.plans(id), status text default 'pending',
  provider text, provider_txn_id text, amount numeric, currency text,
  started_at timestamptz, expires_at timestamptz, created_at timestamptz default now()
);
alter table public.plans enable row level security;
alter table public.payment_methods enable row level security;
alter table public.subscriptions enable row level security;
drop policy if exists "public read plans" on public.plans;
create policy "public read plans" on public.plans for select using(true);
drop policy if exists "admin write plans" on public.plans;
create policy "admin write plans" on public.plans for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists "public read payment_methods" on public.payment_methods;
create policy "public read payment_methods" on public.payment_methods for select using(true);
drop policy if exists "admin write payment_methods" on public.payment_methods;
create policy "admin write payment_methods" on public.payment_methods for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists "own subscriptions" on public.subscriptions;
create policy "own subscriptions" on public.subscriptions for all
  using(parent_id=auth.uid() or public.is_admin()) with check(parent_id=auth.uid() or public.is_admin());

insert into public.plans(id,name_en,name_fr,price,currency,period,features_en,features_fr,is_popular,sort_order) values
('free','Free','Gratuit',0,'USD','forever','Access to free categories','Accès aux catégories gratuites',false,1),
('premium','Premium','Premium',4.99,'USD','month','All categories unlocked, No ads','Toutes les catégories, Aucune publicité',true,2)
on conflict (id) do nothing;
insert into public.payment_methods(id,name,enabled) values
('paypal','PayPal',true),('stripe','Card (Stripe)',false),('bank','Bank Transfer',false)
on conflict (id) do nothing;

-- Payment webhooks (next step for fully automatic Premium):
-- Create a Supabase Edge Function that receives PayPal IPN / Stripe webhook,
-- verifies the signature with your secret keys (never in the frontend),
-- then inserts/updates public.subscriptions and marks the parent as premium.
