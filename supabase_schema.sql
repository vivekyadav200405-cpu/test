-- ================================================================
-- Toyota Boshoku Training Assessment  —  Supabase Schema
-- ----------------------------------------------------------------
-- Run this in:  Supabase Dashboard  ->  SQL Editor  ->  New query
-- Paste this whole file  ->  Run.
-- Safe to re-run (uses IF NOT EXISTS + DROP/CREATE for policies).
-- ================================================================

-- ------------ 1. TABLE -----------------------------------------
create table if not exists public.test_submissions (
    id              bigserial primary key,
    full_name       text         not null,
    emp_code        text         not null,
    department      text,
    started_at      timestamptz,
    submitted_at    timestamptz  not null default now(),
    total_questions int          not null,
    score           int          not null,
    correct         int          not null,
    wrong           int          not null,
    skipped         int          not null,
    percentage      numeric(5,2) not null,
    status          text         not null,
    answers         jsonb,
    created_at      timestamptz  not null default now()
);

-- ----- New columns added later (safe to re-run) -----
alter table public.test_submissions
    add column if not exists ip_address        text,
    add column if not exists time_taken_s      int,
    add column if not exists violations        int default 0,
    add column if not exists questions         jsonb,
    add column if not exists test_plan_id      bigint,
    add column if not exists device_fingerprint text,
    add column if not exists user_agent        text;

create index if not exists idx_test_subs_fp
    on public.test_submissions (device_fingerprint);

create index if not exists idx_test_subs_plan
    on public.test_submissions (test_plan_id);

-- ------------ 2. INDEXES ---------------------------------------
create index if not exists idx_test_subs_emp_code
    on public.test_submissions (emp_code);

create index if not exists idx_test_subs_submitted_at
    on public.test_submissions (submitted_at desc);


-- ================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------
-- INSERT  -> anyone (candidates submit their test)
-- SELECT  -> anyone (admin page reads; emp-code duplicate check)
-- UPDATE  -> blocked
-- DELETE  -> blocked
--
-- NOTE: SELECT is open to anon, which means anyone who knows the
--       Supabase URL + anon key can list submissions via API.
--       For an internal training tool this is acceptable.
--       To harden, use Supabase Auth + a "authenticated" policy.
-- ================================================================

alter table public.test_submissions enable row level security;

drop policy if exists "Anyone can insert submission" on public.test_submissions;
drop policy if exists "Anyone can read submissions"  on public.test_submissions;
drop policy if exists "Block reads from anon"        on public.test_submissions;

create policy "Anyone can insert submission"
    on public.test_submissions
    for insert
    to anon, authenticated
    with check (true);

create policy "Anyone can read submissions"
    on public.test_submissions
    for select
    to anon, authenticated
    using (true);


-- ================================================================
-- 3b. TEST PLANS TABLE  (multiple plans; one is active at a time)
-- ----------------------------------------------------------------
-- Created BEFORE RPCs because RPCs reference test_plans.
-- ================================================================
create table if not exists public.test_plans (
    id              bigserial    primary key,
    name            text         not null,
    is_active       boolean      not null default false,
    duration_min    int          not null default 30,
    pass_percent    int          not null default 50,
    max_violations  int          not null default 3,
    counts          jsonb        not null default '{"HTML":5,"CSS":5,"JS":15,"PY":25}'::jsonb,
    difficulty_mix  jsonb        not null default '{"easy":0.40,"medium":0.35,"hard":0.25}'::jsonb,
    allow_coding    boolean      not null default true,
    answers_unlock  timestamptz,
    review_unlock   timestamptz,
    created_at      timestamptz  not null default now(),
    updated_at      timestamptz  not null default now()
);

create unique index if not exists idx_test_plans_one_active
    on public.test_plans (is_active) where is_active = true;

-- Migrate from old test_config table if it exists
do $$
begin
    if exists (select 1 from information_schema.tables
               where table_schema='public' and table_name='test_config') then
        if not exists (select 1 from public.test_plans) then
            insert into public.test_plans
                (name, is_active, duration_min, pass_percent, max_violations,
                 counts, difficulty_mix, allow_coding, answers_unlock, review_unlock)
            select 'Default plan', true, duration_min, pass_percent, coalesce(max_violations,3),
                   counts, difficulty_mix, coalesce(allow_coding,true), answers_unlock, review_unlock
              from public.test_config
             where id = 1;
        end if;
    end if;
end$$;

-- Seed default plan if no plans yet
insert into public.test_plans (name, is_active)
select 'Default plan', true
where not exists (select 1 from public.test_plans);

alter table public.test_plans enable row level security;

drop policy if exists "Anyone can read test_plans"   on public.test_plans;
drop policy if exists "Anyone can write test_plans"  on public.test_plans;
drop policy if exists "Anyone can insert test_plans" on public.test_plans;
drop policy if exists "Anyone can delete test_plans" on public.test_plans;

create policy "Anyone can read test_plans"
    on public.test_plans for select to anon, authenticated using (true);

create policy "Anyone can insert test_plans"
    on public.test_plans for insert to anon, authenticated with check (true);

create policy "Anyone can write test_plans"
    on public.test_plans for update to anon, authenticated using (true) with check (true);

create policy "Anyone can delete test_plans"
    on public.test_plans for delete to anon, authenticated using (true);


-- ================================================================
-- 4. DUPLICATE-CHECK HELPER  (used by frontend before test starts)
-- ----------------------------------------------------------------
-- Frontend calls:  rpc('has_taken_test', { emp: 'TBDI001' })
-- Returns true if that employee already submitted.
-- ================================================================

create or replace function public.has_taken_test(emp text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    -- Check duplicate WITHIN current active plan only
    select exists(
        select 1 from public.test_submissions s
         where s.emp_code = emp
           and s.test_plan_id = (select id from public.test_plans where is_active = true limit 1)
    );
$$;

grant execute on function public.has_taken_test(text) to anon, authenticated;


-- ================================================================
-- 4b. DUPLICATE-CHECK by IP  (prevent same network re-attempt)
-- ================================================================
create or replace function public.has_taken_test_ip(client_ip text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists(
        select 1 from public.test_submissions s
         where s.ip_address = client_ip
           and s.test_plan_id = (select id from public.test_plans where is_active = true limit 1)
    );
$$;

grant execute on function public.has_taken_test_ip(text) to anon, authenticated;


-- ================================================================
-- 4b-ii. DUPLICATE-CHECK by DEVICE FINGERPRINT
-- ----------------------------------------------------------------
-- Survives IP changes (same machine on different networks).
-- ================================================================
create or replace function public.has_taken_test_device(device_fp text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists(
        select 1 from public.test_submissions s
         where s.device_fingerprint = device_fp
           and s.test_plan_id = (select id from public.test_plans where is_active = true limit 1)
    );
$$;

grant execute on function public.has_taken_test_device(text) to anon, authenticated;


-- ================================================================
-- 4c. GET MY SUBMISSION  (for user login + review)
-- ----------------------------------------------------------------
-- Returns the latest submission for the given emp_code, AS JSON.
-- Frontend filters by case-insensitive match too.
-- ================================================================
create or replace function public.get_my_submission(emp text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select to_jsonb(t)
      from public.test_submissions t
     where lower(t.emp_code) = lower(emp)
     order by t.submitted_at desc
     limit 1;
$$;

grant execute on function public.get_my_submission(text) to anon, authenticated;


-- ----------------------------------------------------------------
-- RPC: activate a plan (deactivates all others atomically)
-- ----------------------------------------------------------------
create or replace function public.activate_plan(plan_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.test_plans set is_active = false where is_active = true;
    update public.test_plans set is_active = true, updated_at = now() where id = plan_id;
end;
$$;

grant execute on function public.activate_plan(bigint) to anon, authenticated;


-- ----------------------------------------------------------------
-- RPC: get the active plan
-- ----------------------------------------------------------------
create or replace function public.get_active_plan()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select to_jsonb(t) from public.test_plans t where t.is_active = true limit 1;
$$;

grant execute on function public.get_active_plan() to anon, authenticated;


-- ================================================================
-- 5. CODING SUBMISSIONS  (optional practical test — 15 questions)
-- ================================================================

create table if not exists public.coding_submissions (
    id              bigserial primary key,
    full_name       text         not null,
    emp_code        text         not null,
    department      text,
    submitted_at    timestamptz  not null default now(),
    total_questions int          not null,
    attempted       int          not null,
    answers         jsonb,                     -- [{q_id, title, section, language, code, attempted}]
    created_at      timestamptz  not null default now()
);

alter table public.coding_submissions
    add column if not exists test_plan_id bigint;

create index if not exists idx_coding_subs_emp_code
    on public.coding_submissions (emp_code);

create index if not exists idx_coding_subs_submitted_at
    on public.coding_submissions (submitted_at desc);

alter table public.coding_submissions enable row level security;

drop policy if exists "Anyone can insert coding submission" on public.coding_submissions;
drop policy if exists "Anyone can read coding submissions"  on public.coding_submissions;

create policy "Anyone can insert coding submission"
    on public.coding_submissions
    for insert
    to anon, authenticated
    with check (true);

create policy "Anyone can read coding submissions"
    on public.coding_submissions
    for select
    to anon, authenticated
    using (true);


-- ================================================================
-- 6. ADMIN VIEW QUERIES  (run in SQL Editor as admin)
-- ----------------------------------------------------------------
-- Top scorers
--   select full_name, emp_code, score, percentage, status, submitted_at
--   from public.test_submissions
--   order by score desc, submitted_at asc;
--
-- Submissions today
--   select * from public.test_submissions
--   where submitted_at >= current_date
--   order by submitted_at desc;
--
-- Department-wise average
--   select department, count(*) as candidates,
--          round(avg(percentage),2) as avg_percent
--   from public.test_submissions
--   group by department;
-- ================================================================
