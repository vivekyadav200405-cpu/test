/* ============================================================
   review.js — Candidate login & review page
   ------------------------------------------------------------
   - Login with Employee Code (used as both username & password)
   - Fetches their submission via get_my_submission RPC
   - Shows score breakdown + Q-by-Q review (after time-lock)
   ============================================================ */

(function () {
    "use strict";

    const $  = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);
    const SESSION_KEY = "tb_review_emp_v1";
    let countdownHandle = null;

    function show(id) {
        $$(".view").forEach(v => v.classList.remove("active"));
        $("#" + id).classList.add("active");
    }

    function escapeHtml(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // ---------- Time lock ----------
    // Loads the active plan to get review_unlock setting.
    let activePlanCache = null;
    async function getActivePlan() {
        if (activePlanCache) return activePlanCache;
        try {
            const sb = sbClient();
            const { data } = await sb.from("test_plans")
                .select("id, name, review_unlock")
                .eq("is_active", true)
                .maybeSingle();
            activePlanCache = data || {};
        } catch (e) {
            activePlanCache = {};
        }
        return activePlanCache;
    }

    function getUnlockDate() {
        // Prefer cached active plan from DB; fall back to config
        let iso = (activePlanCache && activePlanCache.review_unlock) || null;
        if (!iso) iso = (SUPABASE_CONFIG && SUPABASE_CONFIG.reviewUnlockAt) || null;
        if (!iso) return null;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    }

    function isUnlocked() {
        const d = getUnlockDate();
        if (!d) return true;   // no time configured = release immediately
        return Date.now() >= d.getTime();
    }

    function startCountdown() {
        const target = getUnlockDate();
        if (!target) return;
        $("#unlockTimeDisplay").textContent = target.toLocaleString();

        function tick() {
            const remaining = target.getTime() - Date.now();
            if (remaining <= 0) {
                clearInterval(countdownHandle);
                location.reload();
                return;
            }
            const s = Math.floor(remaining / 1000) % 60;
            const m = Math.floor(remaining / 60000) % 60;
            const h = Math.floor(remaining / 3600000) % 24;
            const d = Math.floor(remaining / 86400000);
            const parts = [];
            if (d) parts.push(d + "d");
            parts.push(String(h).padStart(2, "0"));
            parts.push(String(m).padStart(2, "0"));
            parts.push(String(s).padStart(2, "0"));
            $("#countdown").textContent = parts.join(":");
        }
        tick();
        countdownHandle = setInterval(tick, 1000);
    }

    // ---------- Supabase ----------
    function sbClient() {
        if (typeof SUPABASE_CONFIG === "undefined"
            || !SUPABASE_CONFIG.url
            || !SUPABASE_CONFIG.anonKey
            || SUPABASE_CONFIG.anonKey.indexOf("REPLACE_WITH") === 0) {
            throw new Error("Supabase config not set in js/config.js.");
        }
        if (!window.supabase) throw new Error("Supabase client did not load.");
        return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    }

    // Fetch ALL submissions for emp_code across all plans
    async function fetchAllSubmissions(empCode) {
        const sb = sbClient();
        const { data, error } = await sb
            .from(SUPABASE_CONFIG.tableName || "test_submissions")
            .select("*")
            .ilike("emp_code", empCode)
            .order("submitted_at", { ascending: false });
        if (error) throw error;
        return data || [];
    }

    // Fetch plan names for the given plan ids
    async function fetchPlansMap(planIds) {
        const map = {};
        if (!planIds || !planIds.length) return map;
        try {
            const sb = sbClient();
            const { data, error } = await sb
                .from("test_plans")
                .select("id, name")
                .in("id", planIds);
            if (!error && data) data.forEach(p => { map[p.id] = p.name; });
        } catch (e) { /* ignore */ }
        return map;
    }

    // Backward-compat shim
    async function fetchSubmission(empCode) {
        const list = await fetchAllSubmissions(empCode);
        return list[0] || null;
    }

    // Cache for this session
    let allSubs = [];
    let planMap = {};
    let currentSub = null;

    // ---------- Login ----------
    async function attemptLogin(e) {
        if (e) e.preventDefault();
        const emp = $("#empInput").value.trim();
        const pw  = $("#pwInput").value.trim();
        const err = $("#loginError");
        err.classList.add("hidden");

        if (!emp || !pw) {
            err.textContent = "Please enter both Employee Code and Password.";
            err.classList.remove("hidden"); return;
        }
        // Password = same as emp_code (case-insensitive)
        if (emp.toLowerCase() !== pw.toLowerCase()) {
            err.textContent = "Password should be the same as Employee Code.";
            err.classList.remove("hidden"); return;
        }

        // Fetch all submissions
        try {
            allSubs = await fetchAllSubmissions(emp);
        } catch (ex) {
            err.textContent = "Error: " + (ex.message || ex);
            err.classList.remove("hidden"); return;
        }
        if (!allSubs.length) {
            err.textContent = "No submission found for Employee Code: " + emp;
            err.classList.remove("hidden"); return;
        }

        // Lookup plan names
        const planIds = [...new Set(allSubs.map(s => s.test_plan_id).filter(Boolean))];
        planMap = await fetchPlansMap(planIds);

        sessionStorage.setItem(SESSION_KEY, emp);
        proceed();
    }

    async function proceed() {
        // Load active plan first so reviewUnlock from DB is honoured
        await getActivePlan();

        if (!isUnlocked()) {
            show("lockedView");
            startCountdown();
            return;
        }
        // Default to latest submission
        currentSub = allSubs[0];
        renderAttemptSelector();
        renderSubmission(currentSub);
        show("reviewView");
    }

    function renderAttemptSelector() {
        const bar = $("#attemptBar");
        const sel = $("#attemptSelect");
        const cnt = $("#attemptCount");
        sel.innerHTML = "";

        allSubs.forEach((s, i) => {
            const planName = (s.test_plan_id && planMap[s.test_plan_id])
                ? planMap[s.test_plan_id]
                : (s.test_plan_id ? "Plan #" + s.test_plan_id : "Legacy test");
            const date = new Date(s.submitted_at).toLocaleString();
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = planName + "  •  " + date + "  •  " + s.score + "/" + s.total_questions + " (" + s.status + ")";
            sel.appendChild(opt);
        });

        cnt.textContent = allSubs.length + (allSubs.length === 1 ? " attempt" : " attempts");
        bar.style.display = "flex";   // always show even for 1 — gives clarity

        sel.onchange = () => {
            const idx = Number(sel.value);
            currentSub = allSubs[idx];
            renderSubmission(currentSub);
            window.scrollTo({ top: 0, behavior: "smooth" });
        };
        sel.value = "0";
    }

    // ---------- Render selected submission ----------
    function renderSubmission(r) {
        // Top meta bar
        $("#rName").textContent  = r.full_name;
        $("#rEmp").textContent   = r.emp_code;
        $("#rDept").textContent  = r.department || "—";

        // Plan banner
        const planName = (r.test_plan_id && planMap[r.test_plan_id])
            ? planMap[r.test_plan_id]
            : (r.test_plan_id ? "Plan #" + r.test_plan_id : "Legacy test");
        $("#bPlanName").textContent = planName;
        $("#bPlanDate").textContent = "Submitted on " + new Date(r.submitted_at).toLocaleString();
        const tt = r.time_taken_s || 0;
        const mins = Math.floor(tt / 60);
        const secs = tt % 60;
        $("#bDuration").textContent = "Time taken: " + mins + "m " + secs + "s  •  " + r.status;

        // Score breakdown
        $("#rScore").textContent   = r.score + " / " + r.total_questions;
        $("#rCorrect").textContent = r.correct;
        $("#rWrong").textContent   = r.wrong;
        $("#rSkipped").textContent = r.skipped;

        const list = $("#reviewList");
        list.innerHTML = "";

        let qs = Array.isArray(r.questions) ? r.questions : [];
        const as = Array.isArray(r.answers)   ? r.answers   : [];

        let usingLegacy = false;
        if (!qs.length && typeof LEGACY_QUESTIONS !== "undefined" && LEGACY_QUESTIONS.length) {
            qs = LEGACY_QUESTIONS;
            usingLegacy = true;
        }

        if (!qs.length) {
            list.innerHTML =
                '<div class="card" style="padding:20px;text-align:center;color:var(--muted);">' +
                'Detailed question review is not available for this submission.' +
                '</div>';
            return;
        }

        if (usingLegacy) {
            const note = document.createElement("div");
            note.style.cssText =
                "background:#fff8e1;color:#8a6d00;padding:10px 14px;border-radius:6px;" +
                "margin-bottom:14px;font-size:12px;border-left:3px solid #f5a623;";
            note.innerHTML =
                "<strong>📜 Legacy submission</strong> — shown against the original fixed 50-question set.";
            list.appendChild(note);
        }

        qs.forEach((q, i) => {
            const given   = as[i];
            const correct = q.ans;
            const isSkip  = given === null || given === undefined;
            const isOk    = !isSkip && given === correct;
            const isWrong = !isSkip && !isOk;
            const klass   = isOk ? "correct" : isWrong ? "wrong" : "skipped";
            const status  = isOk ? "✓ Correct" : isWrong ? "✗ Wrong" : "— Skipped";

            const card = document.createElement("div");
            card.className = "review-q " + klass;

            const head = document.createElement("div");
            head.className = "review-q-head";
            head.innerHTML =
                '<span class="qnum">Q' + (i + 1) + ' • ' + escapeHtml(q.topic) +
                ' <small style="color:var(--muted);font-weight:400;">[' + escapeHtml(q.level || "easy") + ']</small></span>' +
                '<span class="pill ' + klass + '">' + status + '</span>';
            card.appendChild(head);

            const qt = document.createElement("div");
            qt.className   = "qtext";
            qt.textContent = q.q;
            card.appendChild(qt);

            const ul = document.createElement("ul");
            ul.className = "opts";
            q.opts.forEach((opt, oi) => {
                const li = document.createElement("li");
                let cls = [], tag = "";
                if (oi === correct) { cls.push("correct"); tag = "CORRECT"; }
                if (!isSkip && oi === given && oi !== correct) { cls.push("picked-wrong"); tag = "YOUR PICK"; }
                if (!isSkip && oi === given && oi === correct) { tag = "YOUR PICK ✓"; }
                li.className = cls.join(" ");
                li.innerHTML =
                    '<span>' + String.fromCharCode(97 + oi) + ') ' + escapeHtml(opt) + '</span>' +
                    (tag ? '<span class="tag">' + tag + '</span>' : '');
                ul.appendChild(li);
            });
            card.appendChild(ul);

            list.appendChild(card);
        });
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        $("#empInput").value = "";
        $("#pwInput").value  = "";
        show("loginGate");
    }

    // ---------- Init ----------
    document.addEventListener("DOMContentLoaded", () => {
        $("#loginForm").addEventListener("submit", attemptLogin);
        $("#logoutBtn").addEventListener("click", logout);

        // Auto-fill password = employee code on the fly
        $("#empInput").addEventListener("input", () => {
            $("#pwInput").value = $("#empInput").value;
        });

        // Auto-login if previously logged in
        const savedEmp = sessionStorage.getItem(SESSION_KEY);
        if (savedEmp) {
            $("#empInput").value = savedEmp;
            $("#pwInput").value  = savedEmp;
            fetchAllSubmissions(savedEmp)
                .then(async list => {
                    if (!list.length) return;
                    allSubs = list;
                    const planIds = [...new Set(list.map(s => s.test_plan_id).filter(Boolean))];
                    planMap = await fetchPlansMap(planIds);
                    proceed();
                })
                .catch(()=>{});
        }
    });
})();
