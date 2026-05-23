# Toyota Boshoku — Training Assessment Portal

Online MCQ test portal (50 questions, 60 minutes) built with plain
HTML/CSS/JavaScript. Submissions are stored in **Supabase (Postgres)**
with auto-evaluation. Deploy as a static site on GitHub Pages, Netlify,
Vercel, or any static host.

---

## Folder structure

```
quiz_portal/
├── index.html              # Landing page (Name + Emp Code)
├── quiz.html               # 50-question quiz interface
├── result.html             # Score display + DB save status
├── supabase_schema.sql     # DB table + RLS policies
├── README.md               # This file
├── css/
│   └── style.css
└── js/
    ├── config.js           # Supabase URL + anon key  (EDIT THIS)
    ├── questions.js        # All 50 questions + answers
    ├── app.js              # Landing page logic
    ├── quiz.js             # Quiz logic + Supabase submit
    └── result.js           # Result rendering
```

---

## ⚠ Security notes — READ FIRST

1. **Your Postgres password is leaked.** Reset it immediately:
   Supabase Dashboard → Project Settings → Database → Reset database password.
2. **Never** put the Postgres password or the `service_role` key in this
   frontend code. Use the **anon public key** only.
3. The `supabase_schema.sql` enables **Row Level Security (RLS)** so the
   anon key can only **INSERT** new rows — it cannot SELECT, UPDATE, or
   DELETE. Without RLS, anyone could empty your table.

---

## Setup (one-time, ~10 minutes)

### Step 1 — Create the table in Supabase

1. Open [https://supabase.com](https://supabase.com) and log in.
2. Open your project.
3. Left sidebar → **SQL Editor** → **New query**.
4. Copy-paste the contents of `supabase_schema.sql` and click **Run**.
5. Verify: Left sidebar → **Database** → **Tables** → `test_submissions`
   should now exist.

### Step 2 — Get your API keys

1. Supabase Dashboard → **Project Settings** (gear icon) → **API**.
2. Copy two values:
   - **Project URL** (looks like `https://xxxxxx.supabase.co`)
   - **anon public** key (long JWT string starting with `eyJ…`)
3. Open `js/config.js` in this folder and paste them:

```js
const SUPABASE_CONFIG = {
    url:     "https://xxxxxx.supabase.co",
    anonKey: "eyJhbGciOi…(long string)…",
    durationMinutes: 60,
    passPercentage:  50,
    tableName:       "test_submissions"
};
```

### Step 3 — Test locally

Just open `index.html` in your browser — no build step needed.

> **Tip:** If you see CORS or fetch errors, serve it via a local
> HTTP server instead of `file://`:
> ```powershell
> # in the quiz_portal folder
> python -m http.server 8000
> ```
> Then visit `http://localhost:8000`.

Take the test → submit → check Supabase Table Editor →
`test_submissions` → your row should appear.

### Step 4 — Push to GitHub

```powershell
cd "C:\Users\vivek.kumar\Desktop\day wise content\quiz_portal"
git init
git add .
git commit -m "Initial commit: training assessment portal"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

### Step 5 — Publish on GitHub Pages

1. On GitHub → your repo → **Settings** → **Pages**.
2. **Source** → `Deploy from a branch`.
3. **Branch** → `main` → `/ (root)` → **Save**.
4. Wait ~1 minute. GitHub will give you a URL like:
   `https://<your-username>.github.io/<repo-name>/`
5. Share that URL with employees — they take the test, submissions
   land in Supabase.

---

## How auto-evaluation works

1. All 50 questions + correct answers live in `js/questions.js`.
2. On submit, `quiz.js` compares each answer to the correct one,
   computes `score`, `correct`, `wrong`, `skipped`, `percentage`,
   and `status` (PASS / FAIL based on `passPercentage`).
3. The whole submission (including the user's answer array) is
   POSTed to Supabase via the JS client.
4. The result page shows score + percentage + DB save confirmation.
5. Candidates **do not see** which answers were right or wrong.

> ⚠ Because correct answers ship in the frontend JS bundle, a
> determined user could view them via DevTools. This is acceptable
> for internal training but **not** for a high-stakes certification.
> For tamper-proof scoring you'd need a backend (e.g. Supabase Edge
> Function) that holds the answer key server-side.

---

## Viewing submissions (Admin)

### Option A — Supabase Table Editor
Dashboard → **Table Editor** → `test_submissions`. Sort by
`submitted_at desc`.

### Option B — SQL Query
Dashboard → **SQL Editor**:

```sql
select full_name, emp_code, department,
       score, percentage, status,
       submitted_at
from public.test_submissions
order by submitted_at desc;
```

### Option C — Export to CSV
Table Editor → ⋯ menu → **Export to CSV**.

---

## Customization

| What                | Where                                   |
|---------------------|-----------------------------------------|
| Add/edit questions  | `js/questions.js`                        |
| Change test duration| `durationMinutes` in `js/config.js`      |
| Change pass mark    | `passPercentage` in `js/config.js`       |
| Change colours/logo | `css/style.css` (`--primary` variable)   |
| Add more fields     | `index.html` form + `js/app.js`          |

---

## Troubleshooting

| Symptom                                  | Fix                                                    |
|------------------------------------------|--------------------------------------------------------|
| Result page says "Could not save to DB"  | Check `config.js` URL + key are correct                 |
| Got 401 / row-level security error       | Run `supabase_schema.sql` again — RLS policy missing    |
| Questions don't load                     | Check browser console (F12) for JS error                |
| Timer not counting                       | Make sure `config.js` is loaded before `quiz.js`        |

---

*Prepared by: Vivek Kumar — Toyota Boshoku Device India*
