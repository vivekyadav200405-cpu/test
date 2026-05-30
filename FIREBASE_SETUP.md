# Firebase setup (one-time, ~5 minutes)

The portal stores everything in **Firebase Realtime Database** (free
**Spark** plan — **no billing / no credit card needed**, and it never
pauses). We use Realtime Database (not Firestore) because new free
projects can't create Firestore without enabling billing.

You only do this **once**. No tables/SQL — nodes are created on first save.

---

## 1. Create a Firebase project
1. Go to **https://console.firebase.google.com**, sign in with Google.
2. **Add project** → name `tbdi-test` (or anything) → Continue.
3. Google Analytics: **turn off** → Create project → Continue.

## 2. Create the Realtime Database
1. Left menu → **Build → Realtime Database**.  ⚠️ **NOT** "Firestore" and **NOT** "Data Connect".
2. Click **Create Database**.
3. Location: **Singapore (asia-southeast1)** → Next.
4. Choose **Start in test mode** → **Enable**. (Creates instantly, no billing.)
5. Note the database URL shown at the top, e.g.
   `https://tbdi-test-default-rtdb.asia-southeast1.firebasedatabase.app`

## 3. Paste the security rules
1. In Realtime Database, open the **Rules** tab.
2. Replace everything with the `rules` block from **`database.rules.json`**
   (in this folder) — i.e. paste exactly:

```json
{
  "rules": {
    "test_submissions":   { ".read": true, ".write": true },
    "coding_submissions": { ".read": true, ".write": true },
    "test_plans":         { ".read": true, ".write": true },
    "questions":          { ".read": true, ".write": true },
    "$other":             { ".read": false, ".write": false }
  }
}
```
3. Click **Publish**.

## 4. Register a Web App and copy the config
1. **⚙ (gear) → Project settings**.
2. Scroll to **Your apps** → click the **web icon `</>`**.
3. Nickname `quiz-portal` → **Register app** (skip Hosting).
4. Copy the `firebaseConfig` values — make sure it includes **`databaseURL`**.

## 5. Put the config into the portal
Open **`js/config.js`** and fill `FIREBASE_CONFIG` (note `databaseURL`):

```js
const FIREBASE_CONFIG = {
    apiKey:            "AIza...your key...",
    authDomain:        "tbdi-test.firebaseapp.com",
    databaseURL:       "https://tbdi-test-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "tbdi-test",
    storageBucket:     "tbdi-test.appspot.com",
    messagingSenderId: "1234567890",
    appId:             "1:1234567890:web:abc123..."
};
```

> These web-config values are **safe to commit** — they're a public project
> identifier. Real protection comes from the database rules above.
> **Easiest:** just paste these 6–7 values in chat and I'll fill + push for you.

## 6. Deploy
Push to GitHub (`push.bat` or `git add . && git commit && git push`).
GitHub Pages redeploys in ~1–2 min → **hard-refresh** (Ctrl+Shift+R).

## 7. First run
1. **admin.html** → **Test Planner** → set counts/difficulty → **Save & Activate Plan**.
2. Candidates open **index.html** and take the test.
3. Results appear live in admin **MCQ Results** / **Coding Submissions**.

---

### Notes
- **Old Supabase data does NOT carry over** — fresh database. Ask me if you
  want the old 27 submissions imported.
- **Free Spark limits:** 1 GB stored, 10 GB/month download, 100 simultaneous
  connections — plenty for training batches, and it **never pauses**.
- Timer, duplicate-block (emp/IP/device), anti-cheat, candidate review, and
  the admin dashboard all work exactly as before — only storage changed.
