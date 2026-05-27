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
    add column if not exists ip_address   text,
    add column if not exists time_taken_s int,
    add column if not exists violations   int default 0,
    add column if not exists questions    jsonb;

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
    select exists(
        select 1 from public.test_submissions where emp_code = emp
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
        select 1 from public.test_submissions where ip_address = client_ip
    );
$$;

grant execute on function public.has_taken_test_ip(text) to anon, authenticated;


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
