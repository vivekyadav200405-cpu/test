/* ============================================================
   Toyota Boshoku — Training Assessment
   Single-page app: welcome -> quiz -> result
   ============================================================ */

(function () {
    "use strict";

    // ------------------------------------------------------------
    // State
    // ------------------------------------------------------------
    const state = {
        candidate: null,
        questions: [],           // randomly-picked 50 Qs for THIS user
        answers:   [],           // matching length, null = unattempted
        currentIndex: 0,
        timerHandle: null,
        startedAt: 0,            // ms epoch
        endTime:   0,            // ms epoch
        submitted: false,

        // ---- Network / Device ----
        clientIp: null,           // fetched from ipify on welcome submit
        deviceFp: null,           // SHA-256 of UA + screen + canvas etc.

        // ---- Anti-cheat ----
        violations: 0,
        maxViolations: 3,
        cheatBound: false,
        fullscreenWanted: false,  // becomes true once test starts
        blockerOpen: false,

        // ---- Coding test state ----
        codingAnswers: [],       // [{ q_id, language, code, attempted }]
        codingIndex:   0,
        codingEditor:  null,     // CodeMirror instance
        codingSubmitted: false
    };

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------
    const $  = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    function showView(id) {
        $$(".view").forEach(v => v.classList.remove("active"));
        $("#" + id).classList.add("active");
        window.scrollTo(0, 0);
    }

    function show(el)   { el.classList.remove("hidden"); }
    function hide(el)   { el.classList.add("hidden"); }

    // ============================================================
    // VIEW 1 — WELCOME
    // ============================================================
    function initWelcome() {
        // Load admin's test plan from DB (best-effort; falls back to defaults)
        if (typeof loadTestConfig === "function") {
            loadTestConfig().then(cfg => {
                if (cfg) {
                    // Reflect duration in the visible timer label if needed
                    const t = $("#timer");
                    if (t && SUPABASE_CONFIG.durationMinutes) {
                        const m = Number(SUPABASE_CONFIG.durationMinutes) || 30;
                        t.textContent = String(m).padStart(2, "0") + ":00";
                    }
                    // Reflect max violations
                    if (SUPABASE_CONFIG.maxViolations) state.maxViolations = SUPABASE_CONFIG.maxViolations;

                    // Show active plan name on welcome page
                    if (window.ACTIVE_PLAN_NAME) {
                        const brand = document.querySelector(".brand");
                        if (brand && !document.getElementById("planBadge")) {
                            const badge = document.createElement("p");
                            badge.id = "planBadge";
                            badge.style.cssText = "margin-top:6px;font-size:11px;color:var(--muted);";
                            badge.innerHTML = 'Active plan: <strong style="color:var(--primary)">' + window.ACTIVE_PLAN_NAME + '</strong>';
                            brand.appendChild(badge);
                        }
                    }
                }
            });
        }

        const form     = $("#loginForm");
        const errBox   = $("#loginError");
        const startBtn = $("#startBtn");

        async function submit(e) {
            if (e) e.preventDefault();
            hide(errBox);

            const fullName = $("#fullName").value.trim();
            const empCode  = $("#empCode").value.trim();
            const dept     = $("#department").value.trim();

            if (!fullName) {
                errBox.textContent = "Please enter your full name.";
                show(errBox);
                $("#fullName").focus();
                return;
            }
            if (!empCode) {
                errBox.textContent = "Please enter your employee code.";
                show(errBox);
                $("#empCode").focus();
                return;
            }

            // ----- Duplicate emp_code + IP + device check -----
            startBtn.disabled = true;
            startBtn.textContent = "Checking eligibility…";
            try {
                // 1) Fetch client IP (best-effort)
                state.clientIp = await fetchClientIp();
                // 2) Generate device fingerprint
                state.deviceFp = await generateDeviceFingerprint();

                // 3) Local marker check — multi-storage (localStorage + sessionStorage + cookie)
                const planId = window.ACTIVE_PLAN_ID || "0";
                if (deviceAlreadySubmitted(planId)) {
                    errBox.innerHTML =
                        "❌ This device has already submitted the current test plan.<br>" +
                        "<small>Detected from local device record.</small><br>" +
                        "If you believe this is a mistake, contact the trainer.";
                    show(errBox);
                    return;
                }

                // 4) DB check: emp / IP / device (all scoped to active plan)
                const dup = await hasAlreadyTakenTest(empCode, state.clientIp, state.deviceFp);
                if (dup.taken) {
                    const reason =
                        dup.by === "emp"    ? "Employee Code <strong>" + empCode + "</strong>" :
                        dup.by === "ip"     ? "this network (IP)" :
                        dup.by === "device" ? "this device" :
                        "this submission";
                    errBox.innerHTML =
                        "❌ Test already submitted from " + reason + ".<br>" +
                        "Each employee/device can submit only once per plan.<br>" +
                        "If you believe this is a mistake, contact the trainer.";
                    show(errBox);
                    return;
                }
            } catch (err) {
                console.warn("Eligibility check failed (proceeding):", err);
            } finally {
                startBtn.disabled = false;
                startBtn.innerHTML = "Start Test &nbsp;&rarr;";
            }

            state.candidate = {
                fullName,
                empCode,
                department: dept || "—",
                startedAt: new Date().toISOString()
            };

            startQuiz();
        }

        form.addEventListener("submit", submit);
        startBtn.addEventListener("click", submit);   // belt + suspenders
    }

    // ------------------------------------------------------------
    // DEVICE SUBMISSION MARKERS (multi-storage redundancy)
    // ------------------------------------------------------------
    function deviceAlreadySubmitted(planId) {
        const key = "tb_done_plan_" + planId;
        // 1) localStorage
        try { if (localStorage.getItem(key) === "1") return true; } catch (e) {}
        // 2) sessionStorage (less useful — but in case of incognito)
        try { if (sessionStorage.getItem(key) === "1") return true; } catch (e) {}
        // 3) cookie
        try {
            const cookies = document.cookie.split(";").map(c => c.trim());
            if (cookies.indexOf(key + "=1") !== -1) return true;
        } catch (e) {}
        return false;
    }

    function markDeviceSubmitted(planId, empCode) {
        const key   = "tb_done_plan_" + planId;
        const meta  = JSON.stringify({ emp: empCode, when: new Date().toISOString() });

        try { localStorage.setItem(key, "1"); }              catch (e) {}
        try { localStorage.setItem(key + "_meta", meta); }   catch (e) {}
        try { sessionStorage.setItem(key, "1"); }            catch (e) {}
        try {
            // 1 year cookie
            const exp = new Date(Date.now() + 365 * 86400 * 1000).toUTCString();
            document.cookie = key + "=1; expires=" + exp + "; path=/; SameSite=Lax";
        } catch (e) {}
        // IndexedDB as the deepest layer
        try {
            const req = indexedDB.open("tb_quiz", 1);
            req.onupgradeneeded = (ev) => {
                const db = ev.target.result;
                if (!db.objectStoreNames.contains("done"))
                    db.createObjectStore("done");
            };
            req.onsuccess = (ev) => {
                try {
                    const db = ev.target.result;
                    const tx = db.transaction("done", "readwrite");
                    tx.objectStore("done").put({emp: empCode, when: new Date().toISOString()}, key);
                } catch (e) {}
            };
        } catch (e) {}
    }

    // ------------------------------------------------------------
    // Fetch client IP (free public service, no key needed)
    // ------------------------------------------------------------
    async function fetchClientIp() {
        try {
            const r = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
            const j = await r.json();
            return j.ip || null;
        } catch (e) {
            console.warn("IP fetch failed:", e);
            return null;
        }
    }

    // ------------------------------------------------------------
    // Duplicate-check by emp_code OR IP OR device fingerprint
    // Returns: { taken: bool, by: "emp" | "ip" | "device" | null }
    // ------------------------------------------------------------
    async function hasAlreadyTakenTest(empCode, ip, deviceFp) {
        if (typeof SUPABASE_CONFIG === "undefined"
            || !SUPABASE_CONFIG.url
            || !SUPABASE_CONFIG.anonKey
            || SUPABASE_CONFIG.anonKey.indexOf("REPLACE_WITH") === 0) {
            return { taken: false, by: null };
        }
        if (!window.supabase) return { taken: false, by: null };

        const sb = window.supabase.createClient(
            SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey
        );

        // Check emp_code
        try {
            const { data } = await sb.rpc("has_taken_test", { emp: empCode });
            if (data === true) return { taken: true, by: "emp" };
        } catch (e) { /* ignore */ }

        // Check IP
        if (ip) {
            try {
                const { data } = await sb.rpc("has_taken_test_ip", { client_ip: ip });
                if (data === true) return { taken: true, by: "ip" };
            } catch (e) { /* ignore */ }
        }

        // Check device fingerprint
        if (deviceFp) {
            try {
                const { data } = await sb.rpc("has_taken_test_device", { device_fp: deviceFp });
                if (data === true) return { taken: true, by: "device" };
            } catch (e) { /* ignore */ }
        }

        return { taken: false, by: null };
    }

    // ------------------------------------------------------------
    // Device fingerprint — SHA-256 of stable browser/device traits
    // Persisted in localStorage so it stays consistent.
    // ------------------------------------------------------------
    async function generateDeviceFingerprint() {
        // Reuse cached fingerprint if present
        const cached = localStorage.getItem("tb_device_fp");
        if (cached && cached.length === 32) return cached;

        const parts = [
            navigator.userAgent || "",
            navigator.language  || "",
            (navigator.languages || []).join(","),
            screen.width + "x" + screen.height + "x" + screen.colorDepth,
            screen.availWidth + "x" + screen.availHeight,
            new Date().getTimezoneOffset(),
            Intl.DateTimeFormat().resolvedOptions().timeZone || "",
            navigator.hardwareConcurrency || "",
            navigator.deviceMemory || "",
            navigator.platform || "",
            navigator.vendor    || "",
            (navigator.plugins ? navigator.plugins.length : 0),
            window.devicePixelRatio || 1
        ];

        // Canvas fingerprint (stable per GPU/font stack)
        try {
            const c = document.createElement("canvas");
            c.width = 200; c.height = 50;
            const ctx = c.getContext("2d");
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.fillStyle = "#f60";
            ctx.fillRect(0, 0, 200, 50);
            ctx.fillStyle = "#069";
            ctx.fillText("Toyota Boshoku 2026 ☃", 4, 4);
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.beginPath(); ctx.arc(50, 25, 20, 0, Math.PI * 2); ctx.stroke();
            parts.push(c.toDataURL().slice(-180));
        } catch (e) {}

        const input = parts.join("|");
        try {
            const buf = new TextEncoder().encode(input);
            const hashBuf = await crypto.subtle.digest("SHA-256", buf);
            const hex = Array.from(new Uint8Array(hashBuf))
                .map(b => b.toString(16).padStart(2, "0"))
                .join("");
            const fp = hex.slice(0, 32);
            localStorage.setItem("tb_device_fp", fp);
            return fp;
        } catch (e) {
            // Fallback: simple string hash
            let h = 0;
            for (let i = 0; i < input.length; i++) {
                h = ((h << 5) - h) + input.charCodeAt(i);
                h |= 0;
            }
            const fp = ("0000000" + (h >>> 0).toString(16)).slice(-8).padStart(32, "0");
            localStorage.setItem("tb_device_fp", fp);
            return fp;
        }
    }

    // ============================================================
    // VIEW 2 — QUIZ
    // ============================================================
    function startQuiz() {
        // Build this user's randomised test set
        state.questions = buildRandomTest();
        state.answers   = new Array(state.questions.length).fill(null);
        state.startedAt = Date.now();
        state.violations = 0;
        state.fullscreenWanted = true;

        showView("quizView");

        // Header info
        const c = state.candidate;
        $("#candidateInfo").textContent =
            c.fullName + "  •  " + c.empCode +
            (c.department !== "—" ? "  •  " + c.department : "");

        buildPalette();
        renderQuestion();
        startTimer();
        bindQuizEvents();
        bindAntiCheat();        // tab/window switch + fullscreen lockdown

        // Request fullscreen (kicks in immediately on this user gesture)
        requestFullscreen();
    }

    // ------------------------------------------------------------
    // FULLSCREEN HELPERS
    // ------------------------------------------------------------
    function requestFullscreen() {
        const el = document.documentElement;
        const fn =
            el.requestFullscreen ||
            el.webkitRequestFullscreen ||
            el.msRequestFullscreen ||
            el.mozRequestFullScreen;
        if (fn) {
            try { fn.call(el).catch(() => {}); } catch (e) {}
        }
    }

    function isFullscreen() {
        return !!(document.fullscreenElement
               || document.webkitFullscreenElement
               || document.msFullscreenElement
               || document.mozFullScreenElement);
    }

    function buildPalette() {
        const palette = $("#palette");
        palette.innerHTML = "";
        for (let i = 0; i < state.questions.length; i++) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "palette-btn";
            btn.textContent = i + 1;
            btn.addEventListener("click", () => {
                goTo(i);
                closeSidebar();
            });
            palette.appendChild(btn);
        }
    }

    function updatePalette() {
        // Scope to MCQ palette only (#palette), NOT coding palette
        const buttons = $("#palette").querySelectorAll(".palette-btn");
        buttons.forEach((btn, i) => {
            btn.classList.remove("answered", "current");
            if (state.answers[i] !== null) btn.classList.add("answered");
            if (i === state.currentIndex)  btn.classList.add("current");
        });
        const count = state.answers.filter(a => a !== null).length;
        $("#answeredCount").textContent = count;
    }

    function renderQuestion() {
        const total = state.questions.length;
        const q = state.questions[state.currentIndex];

        $("#qNumber").textContent  = "Question " + (state.currentIndex + 1) + " of " + total;
        $("#qSection").textContent = q.topic + " • " + (q.level || "easy");

        // Format question text:
        // - Plain text via textContent (XSS-safe)
        // - If question looks like code (contains <tag>, multiple lines, def/function/console), apply mono styling
        const qTextEl = $("#qText");
        qTextEl.textContent = q.q;
        const looksLikeCode = looksCodey(q.q);
        qTextEl.classList.toggle("has-code", looksLikeCode);

        const list = $("#optionsList");
        list.innerHTML = "";

        const letters = ["A", "B", "C", "D"];

        q.opts.forEach((opt, idx) => {
            const wrap  = document.createElement("label");
            wrap.className = "option" + (state.answers[state.currentIndex] === idx ? " selected" : "");

            const input = document.createElement("input");
            input.type    = "radio";
            input.name    = "opt";
            input.value   = idx;
            input.checked = state.answers[state.currentIndex] === idx;
            input.addEventListener("change", () => {
                state.answers[state.currentIndex] = idx;
                $$(".option").forEach(o => o.classList.remove("selected"));
                wrap.classList.add("selected");
                updatePalette();
            });

            const letterBox = document.createElement("span");
            letterBox.className   = "opt-letter";
            letterBox.textContent = letters[idx] || "?";

            const span = document.createElement("span");
            span.className = "option-label";
            // If option text looks code-y, render text inside a <code> element
            if (looksCodey(opt)) {
                const code = document.createElement("code");
                code.textContent = opt;
                span.appendChild(code);
            } else {
                span.textContent = opt;
            }

            wrap.appendChild(input);
            wrap.appendChild(letterBox);
            wrap.appendChild(span);
            list.appendChild(wrap);
        });

        // Buttons
        $("#prevBtn").disabled = state.currentIndex === 0;
        if (state.currentIndex === total - 1) {
            hide($("#nextBtn"));
            show($("#submitBtn"));
        } else {
            show($("#nextBtn"));
            hide($("#submitBtn"));
        }

        updatePalette();
    }

    function goTo(i) {
        if (i < 0 || i >= state.questions.length) return;
        state.currentIndex = i;
        renderQuestion();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function bindQuizEvents() {
        $("#prevBtn").addEventListener("click",  () => goTo(state.currentIndex - 1));
        $("#nextBtn").addEventListener("click",  () => goTo(state.currentIndex + 1));
        $("#submitBtn").addEventListener("click", openSubmitModal);
        $("#submitFromPalette").addEventListener("click", openSubmitModal);

        $("#clearBtn").addEventListener("click", () => {
            state.answers[state.currentIndex] = null;
            renderQuestion();
        });

        $("#paletteToggle").addEventListener("click", openSidebar);
        $("#paletteClose").addEventListener("click", closeSidebar);

        $("#cancelSubmit").addEventListener("click", () => hide($("#confirmModal")));
        $("#confirmSubmit").addEventListener("click", finishAndSubmit);
    }

    function openSidebar()  { $("#quizSidebar").classList.add("open"); }
    function closeSidebar() { $("#quizSidebar").classList.remove("open"); }

    // ------------------------------------------------------------
    // ANTI-CHEAT  (strict mode)
    //  - Force fullscreen during the test
    //  - On fullscreen exit / tab switch / blur → BLOCKING modal
    //  - Modal cannot be closed except by re-entering fullscreen
    //  - Block right-click, copy/paste, devtools, Esc as far as possible
    //  - Count violations; after N → auto-submit
    // ------------------------------------------------------------
    function bindAntiCheat() {
        if (state.cheatBound) return;
        state.cheatBound = true;

        // Tab / window visibility change
        document.addEventListener("visibilitychange", () => {
            if (document.hidden && isQuizActive()) {
                recordViolation("switched tab/window");
                showBlocker("You switched away from the test.");
            } else if (!document.hidden && state.fullscreenWanted && isQuizActive() && !isFullscreen()) {
                showBlocker("Test must run in fullscreen.");
            }
        });

        // Window blur (alt+tab, other app focus)
        window.addEventListener("blur", () => {
            if (isQuizActive()) {
                recordViolation("window lost focus");
                showBlocker("You left the test window.");
            }
        });

        // Window focus — close blocker only IF we're back AND in fullscreen
        window.addEventListener("focus", () => {
            if (isQuizActive() && isFullscreen()) {
                hideBlocker();
            }
        });

        // Fullscreen exit
        document.addEventListener("fullscreenchange",      handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.addEventListener("msfullscreenchange",     handleFullscreenChange);

        // Block right-click during test
        document.addEventListener("contextmenu", (e) => {
            if (isQuizActive()) e.preventDefault();
        });

        // Block common shortcuts including ESC (best-effort — browsers may still exit FS)
        document.addEventListener("keydown", (e) => {
            if (!isQuizActive()) return;
            const key = (e.key || "").toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            const alt = e.altKey;
            if (
                key === "f12" ||
                (ctrl && shift && ["i","j","c"].includes(key)) ||
                (ctrl && ["c","v","x","s","u","p","r","w","t","n"].includes(key)) ||
                key === "printscreen" ||
                (alt && key === "tab") ||
                (alt && key === "f4") ||
                key === "escape"
            ) {
                e.preventDefault();
                recordViolation("blocked shortcut: " + key);
            }
        });

        // Block text selection
        document.addEventListener("selectstart", (e) => {
            if (isQuizActive() && e.target && e.target.closest("#quizView .question-card")) {
                if (e.target.matches("h3, pre, p")) e.preventDefault();
            }
        });
    }

    function handleFullscreenChange() {
        if (!state.fullscreenWanted) return;       // not in a test
        if (state.submitted)         return;
        if (!isFullscreen()) {
            recordViolation("exited fullscreen");
            showBlocker("You exited fullscreen.");
        } else {
            // Back in FS — close blocker
            hideBlocker();
        }
    }

    function showBlocker(reason) {
        if (state.submitted) return;

        // If user has hit max violations, auto-submit instead of showing blocker
        if (state.violations >= state.maxViolations) {
            hideBlocker();
            finishAndSubmit();
            return;
        }

        state.blockerOpen = true;
        let modal = document.getElementById("cheatBlocker");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "cheatBlocker";
            modal.style.cssText =
                "position:fixed;inset:0;background:rgba(20,0,0,0.95);z-index:99999;" +
                "display:flex;align-items:center;justify-content:center;padding:20px;";
            modal.innerHTML =
                '<div style="background:white;border-radius:14px;padding:28px 26px;max-width:520px;text-align:center;border-top:6px solid #dc3545;">' +
                    '<div style="font-size:48px;margin-bottom:8px;">⚠</div>' +
                    '<h2 style="color:#dc3545;margin-bottom:8px;font-size:22px;">Test paused — return now</h2>' +
                    '<p id="blkReason" style="color:#555;margin-bottom:10px;font-size:14px;">—</p>' +
                    '<p id="blkCount" style="margin-bottom:14px;font-size:13px;color:#888;"></p>' +
                    '<p style="margin-bottom:16px;font-size:13px;line-height:1.5;color:#444;">' +
                        'Do NOT switch tabs/windows. Stay on this page in fullscreen.<br>' +
                        'After <strong id="blkMax">3</strong> warnings the test will auto-submit.' +
                    '</p>' +
                    '<button id="blkContinue" style="background:#dc3545;color:white;border:none;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;width:100%;">' +
                        'Continue test (re-enter fullscreen)' +
                    '</button>' +
                '</div>';
            document.body.appendChild(modal);
        }

        // Re-bind click handler using onclick (replaces any previous handler)
        const btn = document.getElementById("blkContinue");
        if (btn) {
            btn.onclick = function () {
                // 1) Try fullscreen (best-effort, must be inside user gesture)
                try { requestFullscreen(); } catch (e) {}
                // 2) ALWAYS hide blocker so user is never stuck
                hideBlocker();
                // 3) If user has already hit max violations, auto-submit
                if (state.violations >= state.maxViolations) {
                    finishAndSubmit();
                }
            };
        }

        document.getElementById("blkReason").textContent = reason || "Stay on the test.";
        document.getElementById("blkCount").innerHTML    =
            "Warning <strong>" + state.violations + "</strong> of " + state.maxViolations;
        document.getElementById("blkMax").textContent    = state.maxViolations;
        modal.style.display = "flex";
    }

    function hideBlocker() {
        const modal = document.getElementById("cheatBlocker");
        if (modal) modal.style.display = "none";
        state.blockerOpen = false;
    }

    function isQuizActive() {
        return state.candidate && !state.submitted && $("#quizView").classList.contains("active");
    }

    function recordViolation(reason) {
        if (state.submitted) return;
        state.violations++;
        console.warn("[anti-cheat] violation #" + state.violations + ": " + reason);

        // Update blocker count if it's currently visible
        const countEl = document.getElementById("blkCount");
        if (countEl) {
            countEl.innerHTML = "Warning <strong>" + state.violations + "</strong> of " + state.maxViolations;
        }

        // Auto-submit after max violations — don't show blocker anymore
        if (state.violations >= state.maxViolations) {
            state.fullscreenWanted = false;
            hideBlocker();
            // small toast instead of blocking alert (which can freeze the flow)
            try {
                const toast = document.createElement("div");
                toast.style.cssText =
                    "position:fixed;top:20px;left:50%;transform:translateX(-50%);" +
                    "background:#dc3545;color:white;padding:14px 22px;border-radius:8px;" +
                    "font-weight:700;font-size:14px;z-index:99999;box-shadow:0 4px 14px rgba(0,0,0,0.3);";
                toast.textContent = "⚠ Limit reached. Auto-submitting test…";
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 4000);
            } catch (e) {}
            finishAndSubmit();
        }
    }

    function openSubmitModal() {
        const count = state.answers.filter(a => a !== null).length;
        $("#modalAnswered").textContent = count;
        show($("#confirmModal"));
    }

    // ------------------------------------------------------------
    // Timer
    // ------------------------------------------------------------
    function startTimer() {
        const mins = (typeof SUPABASE_CONFIG !== "undefined" && SUPABASE_CONFIG.durationMinutes) || 60;
        state.endTime = Date.now() + mins * 60 * 1000;

        tick();
        state.timerHandle = setInterval(tick, 1000);
    }

    function tick() {
        const remaining = state.endTime - Date.now();
        const timerEl = $("#timer");

        if (remaining <= 0) {
            clearInterval(state.timerHandle);
            timerEl.textContent = "00:00";
            alert("Time's up! Submitting your test now.");
            finishAndSubmit();
            return;
        }
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent =
            String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");

        timerEl.classList.remove("warning", "danger");
        if (remaining < 60 * 1000)       timerEl.classList.add("danger");
        else if (remaining < 5 * 60000)  timerEl.classList.add("warning");
    }

    // ------------------------------------------------------------
    // Submit -> Evaluate -> Push to Supabase -> Show Result
    // ------------------------------------------------------------
    async function finishAndSubmit() {
        if (state.submitted) return;
        state.submitted = true;
        state.fullscreenWanted = false;

        // Exit fullscreen now — test is over
        try {
            if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        } catch (e) {}

        hideBlocker();
        clearInterval(state.timerHandle);
        hide($("#confirmModal"));
        show($("#loaderOverlay"));

        // Evaluate
        let correct = 0, wrong = 0, skipped = 0;
        state.questions.forEach((q, i) => {
            if (state.answers[i] === null)        skipped++;
            else if (state.answers[i] === q.ans)  correct++;
            else                                  wrong++;
        });

        const total       = state.questions.length;
        const score       = correct;
        const percentage  = +((score / total) * 100).toFixed(2);
        const passMark    = (SUPABASE_CONFIG && SUPABASE_CONFIG.passPercentage) || 50;
        const status      = percentage >= passMark ? "PASS" : "FAIL";
        const timeTakenS  = Math.round((Date.now() - state.startedAt) / 1000);

        const submission = {
            full_name:       state.candidate.fullName,
            emp_code:        state.candidate.empCode,
            department:      state.candidate.department,
            started_at:      state.candidate.startedAt,
            submitted_at:    new Date().toISOString(),
            total_questions: total,
            score:           score,
            correct:         correct,
            wrong:           wrong,
            skipped:         skipped,
            percentage:      percentage,
            status:          status,
            answers:         state.answers,
            questions:       state.questions,       // for review
            ip_address:      state.clientIp,
            time_taken_s:    timeTakenS,
            violations:      state.violations,
            test_plan_id:    window.ACTIVE_PLAN_ID || null,
            device_fingerprint: state.deviceFp,
            user_agent:      (navigator.userAgent || "").slice(0, 500)
        };

        // Mark this device as having completed this plan (multi-storage)
        markDeviceSubmitted(window.ACTIVE_PLAN_ID || "0", state.candidate.empCode);

        // Render result (before DB call) so user sees something fast
        renderResult(submission);
        hide($("#loaderOverlay"));
        showView("resultView");

        // Push to Supabase
        await pushToSupabase(submission);

        // Wire up the optional coding-test buttons (idempotent)
        wireCodingPrompt();
    }

    function wireCodingPrompt() {
        const startBtn = $("#startCodingBtn");
        const skipBtn  = $("#skipCodingBtn");
        if (!startBtn || startBtn._wired) return;
        startBtn._wired = true;

        startBtn.addEventListener("click", () => {
            startCodingTest();
        });
        skipBtn.addEventListener("click", () => {
            // Disable so they cannot keep clicking
            startBtn.disabled = true;
            skipBtn.disabled  = true;
            skipBtn.textContent = "Test Finished ✓";
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        // Wire logout buttons (on result view + coding review)
        const logoutR = $("#logoutBtnResult");
        const logoutC = $("#logoutBtnCoding");
        if (logoutR && !logoutR._wired) {
            logoutR._wired = true;
            logoutR.addEventListener("click", doLogout);
        }
        if (logoutC && !logoutC._wired) {
            logoutC._wired = true;
            logoutC.addEventListener("click", doLogout);
        }
    }

    function doLogout() {
        if (!confirm("Logout and close this session? You won't be able to retake this test.")) return;
        // Clear any session candidate info but KEEP device markers (so re-attempt is still blocked)
        try {
            sessionStorage.clear();
        } catch (e) {}
        // Don't clear localStorage — we want the duplicate-prevention markers to persist.
        // Reload to fresh welcome page
        state.fullscreenWanted = false;
        state.submitted = true;
        try {
            if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
        } catch (e) {}
        window.location.href = "index.html";
    }

    async function pushToSupabase(submission) {
        const banner = $("#dbBanner");
        const text   = $("#dbStatus");

        banner.classList.remove("success", "error");
        banner.classList.add("saving");
        text.textContent = "Saving your result to database…";

        try {
            if (typeof SUPABASE_CONFIG === "undefined" ||
                !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey ||
                SUPABASE_CONFIG.anonKey.indexOf("REPLACE_WITH") === 0) {
                throw new Error("Supabase config is not set. Edit js/config.js.");
            }
            if (!window.supabase) {
                throw new Error("Supabase client did not load. Check internet connection.");
            }

            const sb = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );

            const { error } = await sb
                .from(SUPABASE_CONFIG.tableName || "test_submissions")
                .insert(submission);

            if (error) throw error;

            banner.classList.remove("saving", "error");
            banner.classList.add("success");
            text.textContent = "✓ Your response has been saved to the database.";
        } catch (err) {
            console.error("Supabase insert failed:", err);
            banner.classList.remove("saving", "success");
            banner.classList.add("error");
            text.textContent = "⚠ Could not save to database: " + (err.message || err);
        }
    }

    function renderResult(s) {
        $("#rName").textContent = s.full_name;
        $("#rEmp").textContent  = s.emp_code;
        $("#rDept").textContent = s.department || "—";
        $("#rDate").textContent = new Date(s.submitted_at).toLocaleString();

        $("#scoreValue").textContent   = s.score;
        $("#scorePercent").textContent = s.percentage + "%";

        const statusEl = $("#scoreStatus");
        statusEl.textContent = s.status;
        statusEl.classList.remove("pass", "fail");
        statusEl.classList.add(s.status === "PASS" ? "pass" : "fail");

        const circle = $(".score-circle");
        if (circle) circle.style.setProperty("--p", s.percentage + "%");
    }

    // ============================================================
    // VIEW 4 — CODING TEST  (optional, after MCQ)
    // ============================================================
    function startCodingTest() {
        if (typeof CODING_QUESTIONS === "undefined" || !CODING_QUESTIONS.length) {
            alert("Coding questions not loaded.");
            return;
        }

        // Initialise state with starter code
        state.codingAnswers = CODING_QUESTIONS.map(q => ({
            q_id:      q.id,
            title:     q.title,
            section:   q.section,
            language:  q.language,
            code:      q.starter || "",
            attempted: false
        }));
        state.codingIndex = 0;

        // Show view
        showView("codingView");

        // Header info
        const c = state.candidate;
        $("#codingCandidateInfo").textContent =
            c.fullName + "  •  " + c.empCode +
            (c.department !== "—" ? "  •  " + c.department : "");

        // Build editor (once)
        if (!state.codingEditor) {
            const ta = document.getElementById("codeEditor");
            state.codingEditor = CodeMirror.fromTextArea(ta, {
                lineNumbers: true,
                mode: "python",
                theme: "material-darker",
                tabSize: 4,
                indentUnit: 4,
                indentWithTabs: false,
                lineWrapping: true,
                autoCloseBrackets: true,
                autoCloseTags: true,                  // auto-close HTML tags
                matchBrackets: true,
                matchTags: { bothTags: true },
                hintOptions: {
                    completeSingle: false,
                    closeOnUnfocus: true
                },
                extraKeys: {
                    "Ctrl-Space": "autocomplete",
                    "Tab":        handleEditorTab
                }
            });

            // Save typed code into state on change
            state.codingEditor.on("change", (cm, change) => {
                const idx = state.codingIndex;
                const code = state.codingEditor.getValue();
                state.codingAnswers[idx].code = code;
                state.codingAnswers[idx].attempted =
                    code.trim() !== (CODING_QUESTIONS[idx].starter || "").trim() && code.trim() !== "";
                updateCodingPalette();
            });

            // Auto-trigger hint dropdown on alphabetic input (VS Code-like)
            state.codingEditor.on("inputRead", (cm, change) => {
                if (change.origin !== "+input") return;
                const ch = change.text[0];
                if (!ch || !/^[a-zA-Z]$/.test(ch)) return;
                // Don't trigger inside strings/comments — let user type freely
                cm.showHint({ completeSingle: false });
            });
        }

        buildCodingPalette();
        renderCodingQuestion();
        bindCodingEvents();
    }

    function buildCodingPalette() {
        const palette = $("#codingPalette");
        palette.innerHTML = "";
        for (let i = 0; i < CODING_QUESTIONS.length; i++) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "palette-btn";
            btn.textContent = i + 1;
            btn.addEventListener("click", () => goToCoding(i));
            palette.appendChild(btn);
        }
    }

    function updateCodingPalette() {
        const buttons = $("#codingPalette").querySelectorAll(".palette-btn");
        buttons.forEach((btn, i) => {
            btn.classList.remove("answered", "current");
            if (state.codingAnswers[i].attempted) btn.classList.add("answered");
            if (i === state.codingIndex) btn.classList.add("current");
        });
        const n = state.codingAnswers.filter(a => a.attempted).length;
        $("#codingAttemptedCount").textContent = n;
    }

    function renderCodingQuestion() {
        const i = state.codingIndex;
        const q = CODING_QUESTIONS[i];

        $("#codingQNumber").textContent  = "Question " + (i + 1) + " of " + CODING_QUESTIONS.length;
        $("#codingProgress").textContent = (i + 1) + " / " + CODING_QUESTIONS.length;
        $("#codingQSection").textContent = q.section;
        $("#codingQTitle").textContent   = q.title;
        $("#codingQText").textContent    = q.q;

        // Render expected output preview
        renderExpectedPreview(q);

        $("#editorLangLabel").textContent = q.language;

        // Set language mode
        const modeMap = {
            "htmlmixed":  "htmlmixed",
            "javascript": "javascript",
            "css":        "css",
            "python":     "python"
        };
        state.codingEditor.setOption("mode", modeMap[q.language] || "python");

        // Load this question's saved code
        state.codingEditor.setValue(state.codingAnswers[i].code || q.starter || "");
        state.codingEditor.refresh();

        // Buttons
        $("#codingPrevBtn").disabled = i === 0;
        if (i === CODING_QUESTIONS.length - 1) {
            hide($("#codingNextBtn"));
            show($("#codingSubmitBtn"));
        } else {
            show($("#codingNextBtn"));
            hide($("#codingSubmitBtn"));
        }

        updateCodingPalette();
    }

    function goToCoding(i) {
        if (i < 0 || i >= CODING_QUESTIONS.length) return;
        state.codingIndex = i;
        renderCodingQuestion();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function bindCodingEvents() {
        // Use one-time guard so re-entry doesn't double-bind
        if (window._codingEventsBound) return;
        window._codingEventsBound = true;

        $("#codingPrevBtn").addEventListener("click", () => goToCoding(state.codingIndex - 1));
        $("#codingNextBtn").addEventListener("click", () => goToCoding(state.codingIndex + 1));
        $("#codingResetBtn").addEventListener("click", () => {
            const i = state.codingIndex;
            const starter = CODING_QUESTIONS[i].starter || "";
            state.codingEditor.setValue(starter);
            state.codingAnswers[i].code = starter;
            state.codingAnswers[i].attempted = false;
            updateCodingPalette();
        });
        $("#codingSubmitBtn").addEventListener("click", confirmCodingSubmit);
        $("#codingSubmitFromPalette").addEventListener("click", confirmCodingSubmit);
    }

    // ------------------------------------------------------------
    // Render expected output preview (HTML iframe OR text block)
    // ------------------------------------------------------------
    function renderExpectedPreview(q) {
        const box = $("#expectedPreview");
        box.innerHTML = "";

        if (q.expectedHtml) {
            // Render HTML/CSS/JS output in a sandboxed iframe
            const iframe = document.createElement("iframe");
            iframe.setAttribute("sandbox", "allow-scripts");
            iframe.srcdoc =
                '<!DOCTYPE html><html><head><style>body{margin:8px;font-family:Arial,sans-serif;}</style></head><body>' +
                q.expectedHtml + '</body></html>';
            box.appendChild(iframe);
        } else if (q.expectedText) {
            // Render text/console output
            const pre = document.createElement("pre");
            pre.className = "text-output";
            // Add some color to comment lines
            const lines = q.expectedText.split("\n");
            pre.innerHTML = lines.map(line => {
                if (line.trim().startsWith("#") || line.trim().startsWith("//")) {
                    return '<span class="comment">' + escapeHtml(line) + '</span>';
                }
                return escapeHtml(line);
            }).join("\n");
            box.appendChild(pre);
        } else {
            box.innerHTML = '<p style="color:var(--muted);font-style:italic;font-size:13px;">No preview available for this question.</p>';
        }
    }

    // ------------------------------------------------------------
    // Snippet expansion on Tab (VS Code-like: "h1" + Tab → <h1></h1>)
    // ------------------------------------------------------------
    const SNIPPETS = {
        // HTML / htmlmixed
        htmlmixed: {
            "h1":     { code: "<h1>$|</h1>" },
            "h2":     { code: "<h2>$|</h2>" },
            "h3":     { code: "<h3>$|</h3>" },
            "h4":     { code: "<h4>$|</h4>" },
            "p":      { code: "<p>$|</p>" },
            "div":    { code: "<div>$|</div>" },
            "span":   { code: "<span>$|</span>" },
            "a":      { code: '<a href="$|"></a>' },
            "img":    { code: '<img src="$|" alt="">' },
            "ul":     { code: "<ul>\n    <li>$|</li>\n</ul>" },
            "ol":     { code: "<ol>\n    <li>$|</li>\n</ol>" },
            "li":     { code: "<li>$|</li>" },
            "table":  { code: '<table border="1">\n    <tr>\n        <td>$|</td>\n    </tr>\n</table>' },
            "tr":     { code: "<tr>\n    <td>$|</td>\n</tr>" },
            "td":     { code: "<td>$|</td>" },
            "th":     { code: "<th>$|</th>" },
            "form":   { code: '<form action="">\n    $|\n</form>' },
            "input":  { code: '<input type="$|" name="">' },
            "button": { code: "<button>$|</button>" },
            "style":  { code: "<style>\n    $|\n</style>" },
            "script": { code: "<script>\n    $|\n<\/script>" },
            "br":     { code: "<br>" },
            "hr":     { code: "<hr>" }
        },
        // Python
        python: {
            "print":  { code: "print($|)" },
            "input":  { code: 'input("$|")' },
            "for":    { code: "for $| in range():\n    " },
            "while":  { code: "while $|:\n    " },
            "if":     { code: "if $|:\n    " },
            "ifelse": { code: "if $|:\n    \nelse:\n    " },
            "def":    { code: "def $|():\n    " },
            "class":  { code: "class $|:\n    def __init__(self):\n        " },
            "try":    { code: "try:\n    $|\nexcept Exception as e:\n    print(e)" },
            "open":   { code: 'open("$|", "r")' },
            "range":  { code: "range($|)" },
            "len":    { code: "len($|)" },
            "list":   { code: "[$|]" },
            "dict":   { code: "{$|}" }
        },
        // JavaScript
        javascript: {
            "log":      { code: "console.log($|);" },
            "console":  { code: "console.log($|);" },
            "function": { code: "function $|() {\n    \n}" },
            "fn":       { code: "function $|() {\n    \n}" },
            "if":       { code: "if ($|) {\n    \n}" },
            "for":      { code: "for (let i = 0; i < $|; i++) {\n    \n}" },
            "while":    { code: "while ($|) {\n    \n}" },
            "fetch":    { code: 'fetch("$|")\n    .then(res => res.json())\n    .then(data => console.log(data));' },
            "getid":    { code: 'document.getElementById("$|")' },
            "let":      { code: "let $| = " },
            "const":    { code: "const $| = " }
        }
    };

    function handleEditorTab(cm) {
        // If text is selected → indent it
        if (cm.somethingSelected()) {
            cm.indentSelection("add");
            return;
        }

        const cursor = cm.getCursor();
        const line   = cm.getLine(cursor.line);
        const before = line.slice(0, cursor.ch);
        const m      = before.match(/(\w+)$/);

        if (m) {
            const word = m[1];
            const mode = cm.getOption("mode");
            const dict = SNIPPETS[mode] || {};
            if (dict[word]) {
                // Replace the word with the snippet template
                const tpl   = dict[word].code;
                const start = { line: cursor.line, ch: cursor.ch - word.length };

                // Find cursor placeholder position ($|)
                const cursorPos = tpl.indexOf("$|");
                const clean     = tpl.replace("$|", "");

                cm.replaceRange(clean, start, cursor);

                // Move cursor to placeholder if it existed
                if (cursorPos >= 0) {
                    // Compute new line/ch from start position + offset
                    const linesBefore = clean.slice(0, cursorPos).split("\n");
                    const newLine = start.line + linesBefore.length - 1;
                    const newCh   = linesBefore.length === 1
                        ? start.ch + linesBefore[0].length
                        : linesBefore[linesBefore.length - 1].length;
                    cm.setCursor({ line: newLine, ch: newCh });
                }
                return;
            }
        }

        // Default: insert 4 spaces
        cm.replaceSelection("    ", "end");
    }

    function confirmCodingSubmit() {
        const attempted = state.codingAnswers.filter(a => a.attempted).length;
        const total     = state.codingAnswers.length;
        const ok = confirm(
            "Submit coding test?\n\n" +
            "Attempted: " + attempted + " of " + total + " questions.\n" +
            "Once submitted, you cannot change your code."
        );
        if (ok) submitCodingTest();
    }

    async function submitCodingTest() {
        if (state.codingSubmitted) return;
        state.codingSubmitted = true;

        show($("#loaderOverlay"));

        const attempted = state.codingAnswers.filter(a => a.attempted).length;
        const payload = {
            full_name:       state.candidate.fullName,
            emp_code:        state.candidate.empCode,
            department:      state.candidate.department,
            submitted_at:    new Date().toISOString(),
            total_questions: state.codingAnswers.length,
            attempted:       attempted,
            answers:         state.codingAnswers,  // jsonb in DB
            test_plan_id:    window.ACTIVE_PLAN_ID || null
        };

        // Render review immediately
        renderCodingReview(payload);
        hide($("#loaderOverlay"));
        showView("codingReviewView");

        // Save to DB
        await saveCodingToSupabase(payload);
    }

    async function saveCodingToSupabase(payload) {
        const banner = $("#codingDbBanner");
        const text   = $("#codingDbStatus");
        banner.classList.remove("success", "error");
        banner.classList.add("saving");
        text.textContent = "Saving your code to database…";

        try {
            if (typeof SUPABASE_CONFIG === "undefined"
                || !SUPABASE_CONFIG.url
                || !SUPABASE_CONFIG.anonKey
                || SUPABASE_CONFIG.anonKey.indexOf("REPLACE_WITH") === 0) {
                throw new Error("Supabase config is not set.");
            }
            if (!window.supabase) throw new Error("Supabase client did not load.");

            const sb = window.supabase.createClient(
                SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey
            );
            const { error } = await sb
                .from("coding_submissions")
                .insert(payload);
            if (error) throw error;

            banner.classList.remove("saving", "error");
            banner.classList.add("success");
            text.textContent = "✓ Your code has been saved to the database.";
        } catch (err) {
            console.error("Coding insert failed:", err);
            banner.classList.remove("saving", "success");
            banner.classList.add("error");
            text.textContent = "⚠ Could not save: " + (err.message || err);
        }
    }

    function renderCodingReview(payload) {
        $("#cName").textContent      = payload.full_name;
        $("#cEmp").textContent       = payload.emp_code;
        $("#cAttempted").textContent = payload.attempted + " / " + payload.total_questions;
        $("#cDate").textContent      = new Date(payload.submitted_at).toLocaleString();

        const list = $("#reviewList");
        list.innerHTML = "";

        state.codingAnswers.forEach((a, i) => {
            const q = CODING_QUESTIONS[i];
            const item = document.createElement("div");
            item.className = "review-item " + (a.attempted ? "attempted" : "skipped");

            const head = document.createElement("div");
            head.className = "review-head";
            head.innerHTML =
                '<span class="review-num">Q' + q.id + '</span>' +
                '<span class="review-title">' + escapeHtml(q.title) +
                ' &nbsp;<small style="color:var(--muted)">[' + q.language + ']</small></span>' +
                '<span class="review-status ' + (a.attempted ? '' : 'skipped') + '">' +
                (a.attempted ? 'ATTEMPTED' : 'NOT ATTEMPTED') + '</span>';
            item.appendChild(head);

            if (a.attempted) {
                const ta = document.createElement("textarea");
                item.appendChild(ta);
                list.appendChild(item);
                CodeMirror.fromTextArea(ta, {
                    value: a.code,
                    lineNumbers: true,
                    mode: a.language,
                    theme: "material-darker",
                    readOnly: true,
                    lineWrapping: true
                }).setValue(a.code);
            } else {
                const empty = document.createElement("div");
                empty.className = "empty-code";
                empty.textContent = "// No code submitted for this question.";
                item.appendChild(empty);
                list.appendChild(item);
            }
        });
    }

    function escapeHtml(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // Detect if a string looks like code (for mono styling)
    function looksCodey(s) {
        if (!s) return false;
        const txt = String(s);
        if (txt.indexOf("\n") !== -1)        return true;   // multi-line
        if (/<\w+>?/.test(txt))              return true;   // HTML tag
        if (/[{};]/.test(txt))               return true;   // code chars
        if (/^\s*(def|function|class|const|let|var|return|print|for|while|if)\b/.test(txt)) return true;
        if (/=>|::|->/.test(txt))            return true;
        return false;
    }

    // ------------------------------------------------------------
    // Tab-close guard
    // ------------------------------------------------------------
    window.addEventListener("beforeunload", (e) => {
        if (!state.candidate || state.submitted) return;
        e.preventDefault();
        e.returnValue = "";
    });

    // ------------------------------------------------------------
    // Init
    // ------------------------------------------------------------
    document.addEventListener("DOMContentLoaded", initWelcome);
})();
