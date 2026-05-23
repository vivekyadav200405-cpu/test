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
        answers: new Array(QUESTIONS.length).fill(null),
        currentIndex: 0,
        timerHandle: null,
        endTime: 0,
        submitted: false
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

            // ----- Duplicate emp_code check -----
            startBtn.disabled = true;
            startBtn.textContent = "Checking…";
            try {
                const already = await hasAlreadyTakenTest(empCode);
                if (already) {
                    errBox.innerHTML =
                        "❌ Employee Code <strong>" + empCode + "</strong> has already taken this test.<br>" +
                        "Each employee can submit only once. Please contact the trainer if you believe this is a mistake.";
                    show(errBox);
                    return;
                }
            } catch (err) {
                console.warn("Duplicate check failed (proceeding):", err);
                // Allow test to proceed even if check fails — admin will see duplicates in DB
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
    // Duplicate-check (calls the has_taken_test RPC)
    // ------------------------------------------------------------
    async function hasAlreadyTakenTest(empCode) {
        if (typeof SUPABASE_CONFIG === "undefined"
            || !SUPABASE_CONFIG.url
            || !SUPABASE_CONFIG.anonKey
            || SUPABASE_CONFIG.anonKey.indexOf("REPLACE_WITH") === 0) {
            return false;  // no DB configured — skip
        }
        if (!window.supabase) return false;

        const sb = window.supabase.createClient(
            SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey
        );
        const { data, error } = await sb.rpc("has_taken_test", { emp: empCode });
        if (error) throw error;
        return data === true;
    }

    // ============================================================
    // VIEW 2 — QUIZ
    // ============================================================
    function startQuiz() {
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
    }

    function buildPalette() {
        const palette = $("#palette");
        palette.innerHTML = "";
        for (let i = 0; i < QUESTIONS.length; i++) {
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
        const buttons = $$(".palette-btn");
        buttons.forEach((btn, i) => {
            btn.classList.remove("answered", "current");
            if (state.answers[i] !== null) btn.classList.add("answered");
            if (i === state.currentIndex)  btn.classList.add("current");
        });
        const count = state.answers.filter(a => a !== null).length;
        $("#answeredCount").textContent = count;
    }

    function renderQuestion() {
        const q = QUESTIONS[state.currentIndex];

        $("#qNumber").textContent  = "Question " + (state.currentIndex + 1) + " of " + QUESTIONS.length;
        $("#qSection").textContent = q.section;
        $("#qText").textContent    = q.q;

        const list = $("#optionsList");
        list.innerHTML = "";

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

            const span = document.createElement("span");
            span.className   = "option-label";
            span.textContent = opt;

            wrap.appendChild(input);
            wrap.appendChild(span);
            list.appendChild(wrap);
        });

        // Buttons
        $("#prevBtn").disabled = state.currentIndex === 0;
        if (state.currentIndex === QUESTIONS.length - 1) {
            hide($("#nextBtn"));
            show($("#submitBtn"));
        } else {
            show($("#nextBtn"));
            hide($("#submitBtn"));
        }

        updatePalette();
    }

    function goTo(i) {
        if (i < 0 || i >= QUESTIONS.length) return;
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

        clearInterval(state.timerHandle);
        hide($("#confirmModal"));
        show($("#loaderOverlay"));

        // Evaluate
        let correct = 0, wrong = 0, skipped = 0;
        QUESTIONS.forEach((q, i) => {
            if (state.answers[i] === null)        skipped++;
            else if (state.answers[i] === q.ans)  correct++;
            else                                  wrong++;
        });

        const total      = QUESTIONS.length;
        const score      = correct;
        const percentage = +((score / total) * 100).toFixed(2);
        const passMark   = (SUPABASE_CONFIG && SUPABASE_CONFIG.passPercentage) || 50;
        const status     = percentage >= passMark ? "PASS" : "FAIL";

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
            answers:         state.answers
        };

        // Render result (before DB call) so user sees something fast
        renderResult(submission);
        hide($("#loaderOverlay"));
        showView("resultView");

        // Push to Supabase
        await pushToSupabase(submission);
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
