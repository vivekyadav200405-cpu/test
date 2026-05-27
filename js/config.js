/* ============================================================
   SUPABASE  +  PORTAL  CONFIGURATION
   ------------------------------------------------------------
   Fill values from your Supabase dashboard:
     Project Settings → API
   ------------------------------------------------------------
   SAFE to commit:
     - SUPABASE URL
     - anon public key  (when RLS is enabled — see schema.sql)
     - adminPassword    (technically visible in JS — internal use)
   NEVER commit:
     - service_role key
     - Postgres password
   ============================================================ */

const SUPABASE_CONFIG = {

    // ----- Supabase project -----
    url:     "https://cpwfbkbjgbmfywdnxafh.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwd2Zia2JqZ2JtZnl3ZG54YWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTQ5MjUsImV4cCI6MjA4OTkzMDkyNX0._ZUjNzGrZA074flUI1Tp7em9m4Qdo_jxFvaN-6RSSUo",

    // ----- Quiz behaviour -----
    durationMinutes: 30,        // test duration (timer)
    passPercentage:  50,        // pass threshold
    tableName:       "test_submissions",

    // ----- Admin / Answer key access -----
    adminPassword:   "tbdi@admin2025",  // CHANGE THIS in production

    // Date/time (ISO string) before which the answer key page stays locked.
    // null  = no time lock (only password needed)
    // Example: "2026-05-23T15:00:00+05:30" (Indian Standard Time)
    answersUnlockAt: null,

    // Date/time before which candidate review.html stays locked.
    // null = unlocked immediately.
    // Use this to delay candidate review until after the test window ends.
    reviewUnlockAt: null
};
