/* ============================================================
   answers.js — Answer-key page
   - Password gate (config.adminPassword)
   - Time-lock (config.answersUnlockAt — ISO date or null)
   - Renders all 50 Qs with correct option highlighted
   ============================================================ */

(function () {
    "use strict";

    const $  = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const SESSION_KEY = "tb_answers_session_v1";
    let countdownHandle = null;

    // ------------------------------------------------------------
    // View switching
    // ------------------------------------------------------------
    function show(id) {
        $$(".view").forEach(v => v.classList.remove("active"));
        $("#" + id).classList.add("active");
    }

    // ------------------------------------------------------------
    // Time-lock check
    // ------------------------------------------------------------
    function getUnlockDate() {
        const iso = (SUPABASE_CONFIG && SUPABASE_CONFIG.answersUnlockAt) || null;
        if (!iso) return null;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    }

    function isUnlocked() {
        const d = getUnlockDate();
        if (!d) return true;          // no lock configured
        return Date.now() >= d.getTime();
    }

    function startCountdown() {
        const target = getUnlockDate();
        if (!target) return;

        $("#unlockAtDisplay").textContent = target.toLocaleString();

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

    // ------------------------------------------------------------
    // Login
    // ------------------------------------------------------------
    function isLoggedIn() {
        return sessionStorage.getItem(SESSION_KEY) === "ok";
    }

    function attemptLogin(e) {
        if (e) e.preventDefault();
        const pw  = $("#pwInput").value;
        const err = $("#loginError");
        err.classList.add("hidden");

        const expected = (SUPABASE_CONFIG && SUPABASE_CONFIG.adminPassword) || "";
        if (!expected) {
            err.textContent = "Admin password not set in js/config.js.";
            err.classList.remove("hidden");
            return;
        }
        if (pw !== expected) {
            err.textContent = "Wrong password.";
            err.classList.remove("hidden");
            return;
        }
        sessionStorage.setItem(SESSION_KEY, "ok");
        proceed();
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        show("loginGate");
    }

    function proceed() {
        if (!isUnlocked()) {
            show("lockedView");
            startCountdown();
            return;
        }
        renderAnswers();
        show("answersView");
    }

    // ------------------------------------------------------------
    // Render
    // ------------------------------------------------------------
    function renderAnswers() {
        const list = $("#answersList");
        list.innerHTML = QUESTIONS.map(q => `
            <div class="answer-item">
                <div class="ans-head">
                    <span class="ans-num">Q${q.id}</span>
                    <span class="ans-badge">${escapeHtml(q.section)}</span>
                </div>
                <div class="ans-question">${escapeHtml(q.q)}</div>
                <ul class="ans-options">
                    ${q.opts.map((opt, i) => `
                        <li class="${i === q.ans ? 'correct' : ''}">
                            ${String.fromCharCode(97 + i)}) ${escapeHtml(opt)}
                        </li>
                    `).join("")}
                </ul>
            </div>
        `).join("");
    }

    function escapeHtml(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // ------------------------------------------------------------
    // Wire up
    // ------------------------------------------------------------
    document.addEventListener("DOMContentLoaded", () => {
        $("#loginForm").addEventListener("submit", attemptLogin);
        $("#logoutBtn").addEventListener("click", logout);
        $("#printBtn").addEventListener("click", () => window.print());

        if (isLoggedIn()) proceed();
    });
})();
