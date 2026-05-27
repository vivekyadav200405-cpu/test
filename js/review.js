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
    function getUnlockDate() {
        const iso = (SUPABASE_CONFIG && SUPABASE_CONFIG.reviewUnlockAt) || null;
        if (!iso) return null;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    }

    function isUnlocked() {
        const d = getUnlockDate();
        if (!d) return true;
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

    async function fetchSubmission(empCode) {
        const sb = sbClient();
        // Try RPC first
        try {
            const { data, error } = await sb.rpc("get_my_submission", { emp: empCode });
            if (!error && data) return data;
        } catch (e) { /* fall through to direct select */ }

        // Fallback: direct select (works because anon SELECT policy exists)
        const { data, error } = await sb
            .from(SUPABASE_CONFIG.tableName || "test_submissions")
            .select("*")
            .ilike("emp_code", empCode)
            .order("submitted_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

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

        // Lookup submission
        let sub;
        try {
            sub = await fetchSubmission(emp);
        } catch (ex) {
            err.textContent = "Error: " + (ex.message || ex);
            err.classList.remove("hidden"); return;
        }
        if (!sub) {
            err.textContent = "No submission found for Employee Code: " + emp;
            err.classList.remove("hidden"); return;
        }

        sessionStorage.setItem(SESSION_KEY, emp);
        proceed(sub);
    }

    function proceed(submission) {
        if (!isUnlocked()) {
            show("lockedView");
            startCountdown();
            return;
        }
        render(submission);
        show("reviewView");
    }

    // ---------- Render ----------
    function render(r) {
        $("#rName").textContent  = r.full_name;
        $("#rEmp").textContent   = r.emp_code;
        $("#rDept").textContent  = r.department || "—";
        $("#rDate").textContent  = new Date(r.submitted_at).toLocaleString();

        $("#rScore").textContent   = r.score + " / " + r.total_questions;
        $("#rCorrect").textContent = r.correct;
        $("#rWrong").textContent   = r.wrong;
        $("#rSkipped").textContent = r.skipped;

        const list = $("#reviewList");
        list.innerHTML = "";

        const qs = Array.isArray(r.questions) ? r.questions : [];
        const as = Array.isArray(r.answers)   ? r.answers   : [];

        if (!qs.length) {
            list.innerHTML =
                '<div class="card" style="padding:20px;text-align:center;color:var(--muted);">' +
                'Detailed question review is not available for this submission ' +
                '(submitted before randomised tests were enabled).' +
                '</div>';
            return;
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
            fetchSubmission(savedEmp).then(sub => { if (sub) proceed(sub); }).catch(()=>{});
        }
    });
})();
