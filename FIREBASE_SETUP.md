# Firebase setup (one-time, ~5 minutes)

The portal now stores everything in **Google Firebase (Cloud Firestore)**
instead of Supabase. Firebase never pauses and runs on Google domains
that office networks usually allow.

You only need to do this **once**. No tables/SQL to create — Firestore
makes the collections automatically on first save.

---

## 1. Create a Firebase project
1. Go to **https://console.firebase.google.com** and sign in with your Google account.
2. Click **Add project** → name it e.g. `toyota-boshoku-test` → Continue.
3. Google Analytics: you can **turn it off** (not needed) → Create project → wait → Continue.

## 2. Create the database
1. Left menu → **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode** → Next.
4. Location: pick **asia-south1 (Mumbai)** (closest) → **Enable**.

## 3. Paste the security rules
1. In Firestore Database, open the **Rules** tab.
2. Delete what's there and paste the **entire contents of `firestore.rules`** (in this folder).
3. Click **Publish**.

## 4. Register a Web App and copy the config
1. Click the **gear icon (⚙) → Project settings**.
2. Scroll to **Your apps** → click the **web icon `</>`**.
3. App nickname: `quiz-portal` → **Register app** (skip Hosting).
4. Firebase shows a `const firebaseConfig = { ... }` block. Copy those 6 values.

## 5. Put the config into the portal
Open **`js/config.js`** and fill in `FIREBASE_CONFIG` with your values:

```js
const FIREBASE_CONFIG = {
    apiKey:            "AIza...your key...",
    authDomain:        "toyota-boshoku-test.firebaseapp.com",
    projectId:         "toyota-boshoku-test",
    storageBucket:     "toyota-boshoku-test.appspot.com",
    messagingSenderId: "1234567890",
    appId:             "1:1234567890:web:abc123..."
};
```

> These web-config values are **safe to commit** — they're just a public
> project identifier. Real protection comes from the Firestore Rules above
> (just like Supabase's anon key + RLS).

## 6. Deploy
Push to GitHub (your usual `push.bat`, or `git add . && git commit && git push`).
GitHub Pages redeploys in ~1–2 min. **Hard-refresh** the site (Ctrl+Shift+R).

## 7. First run
1. Open **admin.html** → **Test Planner** → set counts/difficulty →
   **Save & Activate Plan**. (This creates the first plan in Firestore.)
2. Now candidates can open **index.html** and take the test.
3. Results appear live in the admin **MCQ Results** / **Coding Submissions** tabs.

---

### Notes
- **Old Supabase data (the 27 submissions) does NOT carry over** — this is a
  fresh database. If you need them, you can export from Supabase later and
  we can import; tell me and I'll add an importer.
- **Free tier limits** (Firebase Spark): 50k reads + 20k writes **per day**,
  1 GiB stored. For a training batch this is plenty and it **does not pause**.
- Duplicate-prevention (same emp code / IP / device can't retake the active
  plan), the timer, anti-cheat, candidate review, and the admin dashboard all
  work exactly as before — only the storage backend changed.
