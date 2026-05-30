/* ============================================================
   PORTAL  CONFIGURATION   (now backed by Google Firebase)
   ------------------------------------------------------------
   The portal stores results in Google Firebase (Cloud Firestore)
   via js/firebase_shim.js. Firebase never pauses and works on
   Google domains that office networks usually allow.

   👉 FILL IN  FIREBASE_CONFIG  below with the values from your
      Firebase project (see FIREBASE_SETUP.md — takes ~5 min).

   SAFE to commit: the Firebase web config (apiKey etc.) is a
   public client identifier; security comes from Firestore Rules
   (see firestore.rules), exactly like Supabase's RLS.
   ============================================================ */

// ----- Google Firebase project (paste from Firebase console) -----
const FIREBASE_CONFIG = {
    apiKey:            "REPLACE_WITH_FIREBASE_API_KEY",
    authDomain:        "REPLACE_WITH_PROJECT.firebaseapp.com",
    projectId:         "REPLACE_WITH_PROJECT_ID",
    storageBucket:     "REPLACE_WITH_PROJECT.appspot.com",
    messagingSenderId: "REPLACE_WITH_SENDER_ID",
    appId:             "REPLACE_WITH_APP_ID"
};

const SUPABASE_CONFIG = {

    // ----- Legacy keys kept ONLY so existing guard-checks pass.
    //       Database is Firebase now; these two values are ignored.
    url:     "firebase",
    anonKey: "firebase",

    // ----- Quiz behaviour -----
    durationMinutes: 30,        // test duration (timer)
    passPercentage:  50,        // pass threshold
    tableName:       "test_submissions",

    // ----- Admin access -----
    adminPassword:   "tbdi@admin2025",  // CHANGE THIS in production

    // Date/time before which candidate review.html stays locked.
    // null = unlocked immediately. (Usually set per-plan from admin.)
    reviewUnlockAt: null
};
