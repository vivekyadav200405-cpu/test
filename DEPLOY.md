# 🚀 Deploy Guide — Setup Once, Then Just Push

After the first setup, you'll just double-click `push.bat` to deploy any change.

---

## 📋 What's included

| Page              | URL                                   | Purpose                                                |
|-------------------|---------------------------------------|--------------------------------------------------------|
| Test portal       | `index.html`                          | Candidates take the 50-Q MCQ test (30 min)             |
| Admin dashboard   | `admin.html`                          | Password-protected — view all results, search, export  |
| Answer key        | `answers.html`                        | Password-protected + time-locked — all 50 answers      |

**Features:**
- ⏱ 30 minute timer (auto-submit when time ends)
- 🚫 Same Employee Code can submit only **once** (checked via DB)
- 📊 Auto-evaluation (correct/wrong/skipped/percentage/PASS/FAIL)
- 🔒 Admin pages password protected
- ⏰ Answer key can be time-locked (open only after X date/time)
- 📱 Fully responsive (PC, laptop, phone)
- 💾 All submissions stored in Supabase

---

## 🔑 Step 1 — Supabase setup (5 min, ek baar)

### 1a. Reset password (IMPORTANT)
Your Postgres password was shared in chat — reset it now:
> Supabase Dashboard → Project Settings → **Database** → "Reset database password"

### 1b. Run SQL schema
> Supabase Dashboard → **SQL Editor** → New query

Paste full contents of `supabase_schema.sql`, click **Run**. This creates:
- `test_submissions` table
- INSERT + SELECT policies (RLS enabled)
- `has_taken_test()` function for duplicate prevention

### 1c. Copy keys
> Supabase Dashboard → Project Settings → **API**

Copy these 2 values:
- **Project URL** (e.g. `https://xxxxx.supabase.co`)
- **anon public** key (long JWT starting with `eyJ...`)

### 1d. Edit `js/config.js`

```js
const SUPABASE_CONFIG = {
    url:     "https://xxxxx.supabase.co",
    anonKey: "eyJhbGci....your_anon_key....",

    durationMinutes: 30,
    passPercentage:  50,
    tableName:       "test_submissions",

    adminPassword:   "tbdi@admin2025",     // CHANGE THIS
    answersUnlockAt: null                  // see below
};
```

**`answersUnlockAt`** — set this to lock the answer key page:
```js
answersUnlockAt: null                                  // no lock (just password)
answersUnlockAt: "2026-05-23T15:00:00+05:30"           // unlock at this IST time
```

---

## 📦 Step 2 — GitHub repo (2 min, ek baar)

1. Go to [github.com/new](https://github.com/new)
2. Repo name: e.g. `training-quiz`
3. Set to **Public**
4. Click **Create repository**
5. Copy the URL (e.g. `https://github.com/yourname/training-quiz.git`)

---

## ⬆ Step 3 — First push (1 min, ek baar)

Open PowerShell inside `quiz_portal` (Shift + Right-click → "Open PowerShell window here"):

```powershell
.\push.ps1 -RemoteUrl "https://github.com/yourname/training-quiz.git"
```

(Use your URL.) GitHub will ask for your username + Personal Access Token first time.

---

## ⚙ Step 4 — Enable GitHub Pages (30 sec, ek baar)

1. GitHub → your repo → **Settings** → **Pages**
2. **Build and deployment** → **Source** = `GitHub Actions`
3. Done. Wait ~1 min for first deploy.

Your live URL: **`https://<your-username>.github.io/<repo-name>/`**

---

# ✅ Setup khatam!

From now on, any change → double-click **`push.bat`** → site updates automatically.

---

## 🎯 Daily usage

### Take the test
Share with candidates:
- `https://<user>.github.io/<repo>/`

They enter Name + Employee Code → take test → see score → done.

### View results
Open:
- `https://<user>.github.io/<repo>/admin.html`
- Enter `adminPassword` from `config.js`
- Search, filter, sort, export CSV

### Check answer key
Open:
- `https://<user>.github.io/<repo>/answers.html`
- Enter same admin password
- If time-locked, shows countdown till unlock

---

## 🆘 Troubleshooting

| Problem                                              | Solution                                                                |
|------------------------------------------------------|-------------------------------------------------------------------------|
| "Could not save to database"                         | Check `js/config.js` — URL and anon key set correctly?                  |
| "Employee Code has already taken this test"          | Working as intended. Check `admin.html` to confirm.                     |
| 401 / RLS error in console                           | Re-run `supabase_schema.sql` — policies missing                         |
| Admin login: "Wrong password"                        | Check `adminPassword` in `js/config.js` matches what you typed         |
| `push.ps1 cannot be loaded`                          | Use `push.bat` (double-click) or PowerShell `-ExecutionPolicy Bypass`   |
| Site 404 after push                                  | Settings → Pages → Source must be **"GitHub Actions"**                  |
| Want to reset all results                            | Supabase Dashboard → Table Editor → `test_submissions` → Truncate       |

---

## 🔒 Security notes

- **Postgres password** — never in this code; reset yours now if leaked
- **Anon key** is safe in frontend because RLS only allows INSERT + SELECT
- **adminPassword** is in `config.js` — anyone viewing source can see it.
  For internal training this is OK. For higher security, use Supabase Auth.
- **Correct answers** ship in `js/questions.js` — visible via DevTools.
  Acceptable for internal training; not for high-stakes certification.
- **Time lock** on answers page is client-side — can be bypassed by setting
  device clock forward. Combine with password for adequate protection.

---

*All the best with the training!*
