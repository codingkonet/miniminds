-- MiniMINDS - Supabase schema (run in Supabase: SQL Editor > New query > Run)
-- Creates tables, RLS, storage buckets, profile trigger and seed content.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, role text not null default 'parent' check (role in ('admin','parent')),
  created_at timestamptz default now()
);
create table if not exists public.kid_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profiles(id) on delete cascade,
  name text not null, age_group text default '3-5', avatar text default '🦉',
  created_at timestamptz default now()
);
create table if not exists public.categories (
  id text primary key, name_en text not null, name_fr text not null,
  icon text, color text, image_url text, age_group text default '3-5',
  sort_order int default 0, is_active boolean default true, created_at timestamptz default now()
);
create table if not exists public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  category_id text references public.categories(id) on delete cascade,
  word_en text not null, word_fr text not null, icon text, image_url text,
  audio_en_url text, audio_fr_url text, color text, letter text,
  sort_order int default 0, is_active boolean default true, created_at timestamptz default now()
);
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  category_id text references public.categories(id) on delete cascade,
  question_en text, question_fr text, image_url text, correct_answer text,
  options jsonb default '[]', age_group text, created_at timestamptz default now()
);
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title_en text not null, title_fr text not null, content_en text, content_fr text,
  image_url text, audio_url text, icon text, age_group text default '3-5', created_at timestamptz default now()
);
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title_en text not null, title_fr text not null, lyrics_en text, lyrics_fr text,
  audio_url text, image_url text, icon text, created_at timestamptz default now()
);
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references public.kid_profiles(id) on delete cascade,
  category_id text references public.categories(id) on delete cascade,
  vocabulary_id uuid, completed boolean default false, stars int default 0, score int default 0,
  updated_at timestamptz default now(), created_at timestamptz default now()
);
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name_en text not null, name_fr text not null, image_url text, icon text, condition text, created_at timestamptz default now()
);
create table if not exists public.kid_badges (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references public.kid_profiles(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete cascade, earned_at timestamptz default now()
);
create table if not exists public.app_settings (
  id int primary key default 1, key text unique, value text, updated_at timestamptz default now()
);

-- Auto-create a profile on signup
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,email,role) values(new.id,new.email,'parent') on conflict (id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.kid_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.vocabulary enable row level security;
alter table public.quizzes enable row level security;
alter table public.stories enable row level security;
alter table public.songs enable row level security;
alter table public.progress enable row level security;
alter table public.badges enable row level security;
alter table public.kid_badges enable row level security;
alter table public.app_settings enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;

do $$ declare t text; begin
  foreach t in array array['categories','vocabulary','quizzes','stories','songs','badges','app_settings'] loop
    execute format('drop policy if exists "public read" on public.%I',t);
    execute format('create policy "public read" on public.%I for select using(true)',t);
    execute format('drop policy if exists "admin write" on public.%I',t);
    execute format('create policy "admin write" on public.%I for all using(public.is_admin()) with check(public.is_admin())',t);
  end loop;
end $$;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using(auth.uid()=id or public.is_admin());
drop policy if exists "own kids" on public.kid_profiles;
create policy "own kids" on public.kid_profiles for all using(parent_id=auth.uid() or public.is_admin()) with check(parent_id=auth.uid() or public.is_admin());
drop policy if exists "own progress" on public.progress;
create policy "own progress" on public.progress for all using(public.is_admin() or kid_id in (select id from public.kid_profiles where parent_id=auth.uid())) with check(public.is_admin() or kid_id in (select id from public.kid_profiles where parent_id=auth.uid()));
drop policy if exists "own kid_badges" on public.kid_badges;
create policy "own kid_badges" on public.kid_badges for all using(public.is_admin() or kid_id in (select id from public.kid_profiles where parent_id=auth.uid())) with check(public.is_admin() or kid_id in (select id from public.kid_profiles where parent_id=auth.uid()));

-- Storage buckets (images + audio)
insert into storage.buckets(id,name,public) values('images','images',true),('audio','audio',true) on conflict (id) do nothing;
drop policy if exists "public read images" on storage.objects;
create policy "public read images" on storage.objects for select using(bucket_id in ('images','audio'));
drop policy if exists "admin write storage" on storage.objects;
create policy "admin write storage" on storage.objects for all using(bucket_id in ('images','audio') and public.is_admin()) with check(bucket_id in ('images','audio') and public.is_admin());

-- Seed categories
insert into public.categories(id,name_en,name_fr,icon,color,age_group,sort_order) values
('alphabet','Alphabet','Alphabet','🔤','#6C5CE7','3-5',1),('numbers','Numbers','Les Nombres','🔢','#00B894','3-5',2),
('colors','Colors','Les Couleurs','🎨','#E17055','3-5',3),('animals','Animals','Les Animaux','🦁','#FDCB6E','3-8',4),
('fruits','Fruits & Vegetables','Fruits et Légumes','🍎','#D63031','3-8',5),('body','Body Parts','Le Corps','👀','#0984E3','6-8',6),
('shapes','Shapes','Les Formes','⭐','#E84393','3-5',7),('daily','Everyday Words','Mots du Quotidien','🏠','#00CEC9','6-8',8)
on conflict (id) do nothing;

insert into public.vocabulary(category_id,word_en,word_fr,icon,sort_order) values
('animals','Lion','Lion','🦁',1),('animals','Cat','Chat','🐱',2),('animals','Dog','Chien','🐶',3),('animals','Elephant','Éléphant','🐘',4),
('colors','Red','Rouge','●',1),('colors','Blue','Bleu','●',2),('colors','Yellow','Jaune','●',3),('colors','Green','Vert','●',4),
('numbers','One','Un','1',1),('numbers','Two','Deux','2',2),('numbers','Three','Trois','3',3),('numbers','Four','Quatre','4',4),
('fruits','Apple','Pomme','🍎',1),('fruits','Banana','Banane','🍌',2),('daily','Hello','Bonjour','👋',1),('daily','Thank you','Merci','🙏',2)
on conflict do nothing;

insert into public.stories(title_en,title_fr,content_en,content_fr,icon,age_group) values
('Léo the Little Lion','Léo le petit lion','Léo is a little lion. He says: Hello sun!','Léo est un petit lion. Il dit : Bonjour soleil !','🦁','3-5') on conflict do nothing;
insert into public.songs(title_en,title_fr,lyrics_en,lyrics_fr,icon) values
('Hello Song','Chanson Bonjour','Hello, hello, how are you?','Bonjour, bonjour, comment ça va ?','🎵') on conflict do nothing;
insert into public.badges(name_en,name_fr,icon,condition) values
('First Star','Première étoile','⭐','Earn 1 star'),('Super Learner','Super apprenant','🏆','Earn 10 stars') on conflict do nothing;

-- Make yourself admin AFTER signing up in the app / Supabase Auth:
-- update public.profiles set role='admin' where email='your-email@example.com';
