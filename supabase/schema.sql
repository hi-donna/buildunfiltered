-- build.unfiltered — phone sign-in schema for Supabase.
-- Run once in the SQL editor of a fresh project (Dashboard → SQL → New query).
-- Generated from data/codenames.json on 2026-09-04; regenerate the
-- codenames block if that file changes (see supabase/README.md).
--
-- What this sets up:
--   profiles   one row per account: codename, phone, email. Readable and
--              (email only) writable by its owner. Nothing else can touch it.
--   codenames  the ordered list. No client access at all; only the trigger
--              below reads and claims from it.
--   trigger    on every new auth user: claim the next unclaimed, unreserved
--              codename (row-locked, so two sign-ups never get the same one)
--              and create the profile. If the list runs out, "Gothamite N".

create table if not exists public.codenames (
  position    int primary key,
  name        text not null unique,
  reserved    boolean not null default false,
  claimed_by  uuid unique references auth.users (id) on delete set null,
  claimed_at  timestamptz
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  codename    text not null unique,
  phone       text,
  email       text,
  created_at  timestamptz not null default now()
);

create sequence if not exists public.gothamite_seq;

alter table public.codenames enable row level security;
alter table public.profiles  enable row level security;

-- codenames: no policies on purpose. With RLS on and no policy, the anon and
-- authenticated roles cannot read or write it. The trigger runs as the
-- function owner (security definer) and bypasses RLS.
revoke all on public.codenames from anon, authenticated;

-- profiles: owner can read their row and change only the email.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (email) on public.profiles to authenticated;

drop policy if exists "profiles: own row read" on public.profiles;
create policy "profiles: own row read" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles: own row email" on public.profiles;
create policy "profiles: own row email" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pick text;
  pos  int;
begin
  select c.position, c.name into pos, pick
    from public.codenames c
   where c.claimed_by is null and not c.reserved
   order by c.position
   for update skip locked
   limit 1;

  if pick is null then
    pick := 'Gothamite ' || nextval('public.gothamite_seq');
  else
    update public.codenames set claimed_by = new.id, claimed_at = now() where position = pos;
  end if;

  insert into public.profiles (id, codename, phone, email)
  values (new.id, pick, new.phone, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The list. Reserved names are present so nobody can be given them and so
-- the positions stay stable; they are never claimed.
insert into public.codenames (position, name, reserved) values
  (1, 'Robin', false),
  (2, 'Nightwing', false),
  (3, 'Batgirl', false),
  (4, 'Oracle', false),
  (5, 'Red Hood', false),
  (6, 'Red Robin', false),
  (7, 'Catwoman', false),
  (8, 'Joker', false),
  (9, 'Harley Quinn', false),
  (10, 'Penguin', false),
  (11, 'Riddler', false),
  (12, 'Two-Face', false),
  (13, 'Scarecrow', false),
  (14, 'Poison Ivy', false),
  (15, 'Bane', false),
  (16, 'Mr. Freeze', false),
  (17, 'Ra''s al Ghul', false),
  (18, 'Talia al Ghul', false),
  (19, 'Commissioner Gordon', false),
  (20, 'Lucius Fox', false),
  (21, 'Harvey Bullock', false),
  (22, 'Renee Montoya', false),
  (23, 'Batwoman', false),
  (24, 'Huntress', false),
  (25, 'Black Mask', false),
  (26, 'Clayface', false),
  (27, 'Killer Croc', false),
  (28, 'Mad Hatter', false),
  (29, 'Hush', false),
  (30, 'Deadshot', false),
  (31, 'Deathstroke', false),
  (32, 'Firefly', false),
  (33, 'Man-Bat', false),
  (34, 'Ventriloquist', false),
  (35, 'Scarface', false),
  (36, 'Victor Zsasz', false),
  (37, 'Hugo Strange', false),
  (38, 'Professor Pyg', false),
  (39, 'Talon', false),
  (40, 'Lady Shiva', false),
  (41, 'Cassandra Cain', false),
  (42, 'Stephanie Brown', false),
  (43, 'Spoiler', false),
  (44, 'Damian Wayne', false),
  (45, 'Tim Drake', false),
  (46, 'Jason Todd', false),
  (47, 'Dick Grayson', false),
  (48, 'Barbara Gordon', false),
  (49, 'Signal', false),
  (50, 'Duke Thomas', false),
  (51, 'Bluebird', false),
  (52, 'Azrael', false),
  (53, 'Jean-Paul Valley', false),
  (54, 'Ace the Bat-Hound', false),
  (55, 'Batwing', false),
  (56, 'Terry McGinnis', false),
  (57, 'Anarky', false),
  (58, 'Calendar Man', false),
  (59, 'Condiment King', false),
  (60, 'Egghead', false),
  (61, 'King Tut', false),
  (62, 'Maxie Zeus', false),
  (63, 'Cluemaster', false),
  (64, 'KGBeast', false),
  (65, 'Electrocutioner', false),
  (66, 'Black Spider', false),
  (67, 'Copperhead', false),
  (68, 'Magpie', false),
  (69, 'Nocturna', false),
  (70, 'Solomon Grundy', false),
  (71, 'Amygdala', false),
  (72, 'Ratcatcher', false),
  (73, 'Kite Man', false),
  (74, 'Polka-Dot Man', false),
  (75, 'Crazy Quilt', false),
  (76, 'Doctor Death', false),
  (77, 'Doctor Hurt', false),
  (78, 'Doctor Phosphorus', false),
  (79, 'Blockbuster', false),
  (80, 'Carmine Falcone', false),
  (81, 'Sal Maroni', false),
  (82, 'Rupert Thorne', false),
  (83, 'Tony Zucco', false),
  (84, 'Joe Chill', false),
  (85, 'Thomas Wayne', false),
  (86, 'Martha Wayne', false),
  (87, 'Leslie Thompkins', false),
  (88, 'Vicki Vale', false),
  (89, 'Julie Madison', false),
  (90, 'Silver St. Cloud', false),
  (91, 'Andrea Beaumont', false),
  (92, 'Phantasm', false),
  (93, 'Red Claw', false),
  (94, 'Baby Doll', false),
  (95, 'Roxy Rocket', false),
  (96, 'Ghost-Maker', false),
  (97, 'Punchline', false),
  (98, 'Mr. Toad', false),
  (99, 'Flamingo', false),
  (100, 'Gotham Girl', false),
  (101, 'Bruce Wayne', true),
  (102, 'Bruce', true),
  (103, 'Batman', true),
  (104, 'Alfred', true)
on conflict (position) do update set name = excluded.name, reserved = excluded.reserved;
