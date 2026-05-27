/* ============================================================
   admin.js — Results dashboard
   - Password gate (config.adminPassword)
   - Lists all submissions from Supabase
   - Search, filter, sort, CSV export
   ============================================================ */

(function () {
    "use strict";

    const $  = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const SESSION_KEY = "tb_admin_session_v1";
    let allRows = [];
    let filteredRows = [];
    let sortKey = "submitted_at";
    let sortDir = "desc";

    // ---- Coding submissions ----
    let codingRows = [];

    // ------------------------------------------------------------
    // Login flow
    // ------------------------------------------------------------
    function showDashboard() {
        $("#loginGate").classList.remove("active");
        $("#dashboard").classList.add("active");
        loadResults();
    }

    function showLogin() {
        $("#dashboard").classList.remove("active");
        $("#loginGate").classList.add("active");
        sessionStorage.removeItem(SESSION_KEY);
    }

    function isLoggedIn() {
        return sessionStorage.getItem(SESSION_KEY) === "ok";
    }

    function attemptLogin(e) {
        if (e) e.preventDefault();
        const pw  = $("#pwInput").value;
        const err = $("#loginError");
        err.classList.add("hidden");

        const expected = (typeof SUPABASE_CONFIG !== "undefined" && SUPABASE_CONFIG.adminPassword) || "";
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
        showDashboard();
    }

    // ------------------------------------------------------------
    // Supabase fetch
    // ------------------------------------------------------------
    // ============================================================
    // TEST PLANNER  (multi-plan)
    // ============================================================
    let editingPlanId = null;
    let allPlans = [];

    function updatePlannerTotals() {
        const cnt =
            (parseInt($("#cfgCntHTML").value) || 0) +
            (parseInt($("#cfgCntCSS").value)  || 0) +
            (parseInt($("#cfgCntJS").value)   || 0) +
            (parseInt($("#cfgCntPY").value)   || 0);
        $("#cfgTotal").textContent = cnt;

        const mix =
            (parseInt($("#cfgEasy").value)   || 0) +
            (parseInt($("#cfgMedium").value) || 0) +
            (parseInt($("#cfgHard").value)   || 0);
        $("#cfgMixTotal").textContent = mix;
        $("#cfgMixTotal").style.color = (mix === 100) ? "var(--success)" : "var(--danger)";
    }

    async function loadPlannerConfig() {
        // Show pool stats if POOL loaded
        if (typeof POOL !== "undefined") {
            const t = POOL.HTML.length + POOL.CSS.length + POOL.JS.length + POOL.PY.length;
            $("#poolCount").textContent =
                "HTML " + POOL.HTML.length + " + CSS " + POOL.CSS.length +
                " + JS " + POOL.JS.length + " + Python " + POOL.PY.length +
                " = " + t + " total";
        }

        try {
            const sb = getSupabaseClient();
            // Load all plans
            const { data: plans, error } = await sb
                .from("test_plans")
                .select("*")
                .order("id", { ascending: true });
            if (error) throw error;
            allPlans = plans || [];

            // Submission counts per plan
            const counts = {};
            for (const p of allPlans) {
                const { count } = await sb
                    .from("test_submissions")
                    .select("id", { count: "exact", head: true })
                    .eq("test_plan_id", p.id);
                counts[p.id] = count || 0;
            }

            renderPlansTable(counts);

            // Auto-load active (or first) plan into the form
            const active = allPlans.find(p => p.is_active) || allPlans[0];
            if (active) loadPlanIntoForm(active);
            else showPlannerStatus("No plans yet — click '+ New Plan' to create one.", "warn");
        } catch (e) {
            showPlannerStatus("Load failed: " + (e.message || e), "err");
        }
    }

    function renderPlansTable(counts) {
        const tbody = $("#plansTbody");
        if (!allPlans.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding:12px;text-align:center;color:var(--muted);">No plans yet.</td></tr>';
            return;
        }
        tbody.innerHTML = allPlans.map(p => {
            const c = counts[p.id] || 0;
            const editing = (editingPlanId === p.id) ? " style=\"background:#fff8e1;\"" : "";
            return (
                '<tr' + editing + '>' +
                    '<td style="padding:8px 10px;color:var(--muted);">' + p.id + '</td>' +
                    '<td style="padding:8px 10px;"><strong>' + escapeHtml(p.name) + '</strong></td>' +
                    '<td style="padding:8px 10px;">' + c + '</td>' +
                    '<td style="padding:8px 10px;">' +
                        (p.is_active
                            ? '<span class="pill pass">ACTIVE</span>'
                            : '<span style="color:var(--muted);">—</span>') +
                    '</td>' +
                    '<td style="padding:8px 10px;text-align:right;">' +
                        '<button data-act="edit"     data-id="' + p.id + '" class="btn btn-light"     style="padding:4px 10px;min-height:28px;font-size:12px;">Edit</button> ' +
                        (!p.is_active
                            ? '<button data-act="activate" data-id="' + p.id + '" class="btn btn-success" style="padding:4px 10px;min-height:28px;font-size:12px;">Activate</button> '
                            : '') +
                        '<button data-act="delete"   data-id="' + p.id + '" class="btn btn-light"     style="padding:4px 10px;min-height:28px;font-size:12px;color:var(--danger);">Delete</button>' +
                    '</td>' +
                '</tr>'
            );
        }).join("");

        tbody.querySelectorAll("button[data-act]").forEach(b => {
            b.addEventListener("click", () => {
                const id = Number(b.dataset.id);
                const act = b.dataset.act;
                if (act === "edit")     editPlan(id);
                if (act === "activate") activatePlan(id);
                if (act === "delete")   deletePlan(id);
            });
        });
    }

    function loadPlanIntoForm(p) {
        editingPlanId = p.id;
        $("#editingPlanName").textContent = "#" + p.id + " — " + p.name;
        $("#cfgPlanName").value = p.name;
        $("#cfgDuration").value = p.duration_min ?? 30;
        $("#cfgPass").value     = p.pass_percent ?? 50;
        $("#cfgViol").value     = p.max_violations ?? 3;
        const c = p.counts || {};
        $("#cfgCntHTML").value = c.HTML ?? 5;
        $("#cfgCntCSS").value  = c.CSS  ?? 5;
        $("#cfgCntJS").value   = c.JS   ?? 15;
        $("#cfgCntPY").value   = c.PY   ?? 25;
        const m = p.difficulty_mix || {};
        $("#cfgEasy").value   = Math.round((m.easy   ?? 0.40) * 100);
        $("#cfgMedium").value = Math.round((m.medium ?? 0.35) * 100);
        $("#cfgHard").value   = Math.round((m.hard   ?? 0.25) * 100);
        $("#cfgAllowCoding").checked = p.allow_coding !== false;
        $("#cfgAnsUnlock").value = p.answers_unlock || "";
        $("#cfgRevUnlock").value = p.review_unlock  || "";
        updatePlannerTotals();
    }

    function editPlan(id) {
        const p = allPlans.find(x => x.id === id);
        if (p) {
            loadPlanIntoForm(p);
            // highlight in table
            renderPlansTableWithoutCountsRefresh();
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        }
    }

    function renderPlansTableWithoutCountsRefresh() {
        // Quick re-render highlighting current editingPlanId
        const counts = {};
        allPlans.forEach(p => counts[p.id] = 0);
        renderPlansTable(counts);
    }

    async function newPlan() {
        const name = (prompt("Name for the new plan:", "New plan") || "").trim();
        if (!name) return;
        try {
            const sb = getSupabaseClient();
            const { data, error } = await sb
                .from("test_plans")
                .insert({ name: name, is_active: false })
                .select()
                .single();
            if (error) throw error;
            showPlannerStatus("✓ Created plan '" + name + "'", "ok");
            await loadPlannerConfig();
            if (data) {
                editingPlanId = data.id;
                const fresh = allPlans.find(p => p.id === data.id);
                if (fresh) loadPlanIntoForm(fresh);
            }
        } catch (e) {
            showPlannerStatus("Create failed: " + (e.message || e), "err");
        }
    }

    async function activatePlan(id) {
        try {
            const sb = getSupabaseClient();
            const { error } = await sb.rpc("activate_plan", { plan_id: id });
            if (error) throw error;
            showPlannerStatus("✓ Activated plan #" + id + " — now live for all candidates.", "ok");
            await loadPlannerConfig();
        } catch (e) {
            showPlannerStatus("Activate failed: " + (e.message || e), "err");
        }
    }

    async function deletePlan(id) {
        const p = allPlans.find(x => x.id === id);
        if (!p) return;
        if (p.is_active) {
            showPlannerStatus("Cannot delete the active plan. Activate another plan first.", "err");
            return;
        }
        if (!confirm("Delete plan '" + p.name + "'? Submissions remain but lose linkage.")) return;
        try {
            const sb = getSupabaseClient();
            const { error } = await sb.from("test_plans").delete().eq("id", id);
            if (error) throw error;
            showPlannerStatus("✓ Deleted plan '" + p.name + "'", "ok");
            if (editingPlanId === id) editingPlanId = null;
            await loadPlannerConfig();
        } catch (e) {
            showPlannerStatus("Delete failed: " + (e.message || e), "err");
        }
    }

    function buildPlanPayload() {
        const mixSum =
            (parseInt($("#cfgEasy").value)   || 0) +
            (parseInt($("#cfgMedium").value) || 0) +
            (parseInt($("#cfgHard").value)   || 0);
        if (mixSum !== 100) {
            showPlannerStatus("Difficulty mix must total 100%. Currently " + mixSum + "%.", "err");
            return null;
        }
        const name = $("#cfgPlanName").value.trim();
        if (!name) {
            showPlannerStatus("Plan name is required.", "err");
            return null;
        }
        return {
            name:           name,
            duration_min:   parseInt($("#cfgDuration").value) || 30,
            pass_percent:   parseInt($("#cfgPass").value) || 50,
            max_violations: parseInt($("#cfgViol").value) || 3,
            counts: {
                HTML: parseInt($("#cfgCntHTML").value) || 0,
                CSS:  parseInt($("#cfgCntCSS").value)  || 0,
                JS:   parseInt($("#cfgCntJS").value)   || 0,
                PY:   parseInt($("#cfgCntPY").value)   || 0
            },
            difficulty_mix: {
                easy:   (parseInt($("#cfgEasy").value)   || 0) / 100,
                medium: (parseInt($("#cfgMedium").value) || 0) / 100,
                hard:   (parseInt($("#cfgHard").value)   || 0) / 100
            },
            allow_coding:   $("#cfgAllowCoding").checked,
            answers_unlock: $("#cfgAnsUnlock").value.trim() || null,
            review_unlock:  $("#cfgRevUnlock").value.trim() || null,
            updated_at:     new Date().toISOString()
        };
    }

    async function savePlannerConfig(activateAfter) {
        if (!editingPlanId) {
            showPlannerStatus("No plan selected. Create one first or click Edit on a plan.", "err");
            return;
        }
        const payload = buildPlanPayload();
        if (!payload) return;
        try {
            const sb = getSupabaseClient();
            const { error } = await sb
                .from("test_plans")
                .update(payload)
                .eq("id", editingPlanId);
            if (error) throw error;

            if (activateAfter) {
                const { error: e2 } = await sb.rpc("activate_plan", { plan_id: editingPlanId });
                if (e2) throw e2;
                showPlannerStatus("✓ Saved & activated. Now live.", "ok");
            } else {
                showPlannerStatus("✓ Saved.", "ok");
            }
            await loadPlannerConfig();
        } catch (e) {
            showPlannerStatus("Save failed: " + (e.message || e), "err");
        }
    }

    function showPlannerStatus(msg, type) {
        const el = $("#plannerStatus");
        if (!el) return;
        el.textContent = msg;
        el.style.display = "block";
        el.style.padding = "10px 14px";
        el.style.borderRadius = "6px";
        el.style.marginBottom = "14px";
        el.style.fontSize = "14px";
        if (type === "ok") {
            el.style.background = "rgba(40,167,69,0.12)";
            el.style.color = "var(--success)";
        } else if (type === "warn") {
            el.style.background = "#fff8e1";
            el.style.color = "#8a6d00";
        } else {
            el.style.background = "rgba(220,53,69,0.12)";
            el.style.color = "var(--danger)";
        }
        setTimeout(() => { el.style.display = "none"; }, 6000);
    }

    function getSupabaseClient() {
        if (typeof SUPABASE_CONFIG === "undefined"
            || !SUPABASE_CONFIG.url
            || !SUPABASE_CONFIG.anonKey
            || SUPABASE_CONFIG.anonKey.indexOf("REPLACE_WITH") === 0) {
            throw new Error("Supabase config not set in js/config.js.");
        }
        if (!window.supabase) throw new Error("Supabase client not loaded.");
        return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    }

    async function loadResults() {
        const tbody = $("#tableBody");
        tbody.innerHTML = '<tr><td colspan="11" class="empty">Loading…</td></tr>';

        try {
            const sb = getSupabaseClient();
            const { data, error } = await sb
                .from(SUPABASE_CONFIG.tableName || "test_submissions")
                .select("*")
                .order("submitted_at", { ascending: false });

            if (error) throw error;

            allRows = data || [];
            applyFiltersAndRender();
            renderStats();
        } catch (err) {
            console.error(err);
            tbody.innerHTML =
                '<tr><td colspan="11" class="empty" style="color:var(--danger);">' +
                'Error loading results: ' + (err.message || err) +
                '</td></tr>';
        }

        // Also load coding submissions in parallel
        loadCodingSubmissions();
    }

    async function loadCodingSubmissions() {
        const list = $("#codingList");
        list.innerHTML = '<p class="empty">Loading…</p>';

        try {
            const sb = getSupabaseClient();
            const { data, error } = await sb
                .from("coding_submissions")
                .select("*")
                .order("submitted_at", { ascending: false });

            if (error) throw error;

            codingRows = data || [];
            renderCodingList();
            renderCodingStats();
        } catch (err) {
            console.error(err);
            list.innerHTML =
                '<p class="empty" style="color:var(--danger);">' +
                'Error loading coding submissions: ' + (err.message || err) + '</p>';
        }
    }

    function renderCodingStats() {
        const total = codingRows.length;
        const avg   = total ? (codingRows.reduce((s, r) => s + (r.attempted || 0), 0) / total) : 0;
        $("#cStatTotal").textContent = total;
        $("#cStatAvg").textContent   = avg.toFixed(1) + " / 15";
    }

    function renderCodingList() {
        const q = ($("#cSearchBox").value || "").trim().toLowerCase();
        const list = $("#codingList");

        const filtered = codingRows.filter(r => {
            if (!q) return true;
            return (
                (r.full_name || "").toLowerCase().includes(q) ||
                (r.emp_code  || "").toLowerCase().includes(q)
            );
        });

        if (!filtered.length) {
            list.innerHTML = '<p class="empty">No coding submissions yet.</p>';
            return;
        }

        list.innerHTML = "";
        filtered.forEach((r, idx) => {
            const card = document.createElement("div");
            card.className = "candidate-card";
            card.innerHTML =
                '<div class="left">' +
                    '<h4>' + escapeHtml(r.full_name) + '</h4>' +
                    '<p>' + escapeHtml(r.emp_code) + ' • ' + escapeHtml(r.department || "—") +
                    ' • ' + new Date(r.submitted_at).toLocaleString() + '</p>' +
                '</div>' +
                '<div class="right">' + (r.attempted || 0) + ' / ' + (r.total_questions || 15) +
                ' &nbsp;<small>View ▸</small></div>';
            card.addEventListener("click", () => openCodeModal(r));
            list.appendChild(card);
        });
    }

    function openCodeModal(row) {
        $("#cmTitle").textContent = row.full_name + " — Coding Submission";
        $("#cmMeta").textContent  =
            "Emp: " + row.emp_code + "  •  " + (row.department || "—") +
            "  •  Submitted: " + new Date(row.submitted_at).toLocaleString() +
            "  •  Attempted: " + row.attempted + " / " + row.total_questions;

        const body = $("#cmBody");
        body.innerHTML = "";

        const answers = Array.isArray(row.answers) ? row.answers : [];
        const cqMap = {};
        if (typeof CODING_QUESTIONS !== "undefined") {
            CODING_QUESTIONS.forEach(q => { cqMap[q.id] = q; });
        }

        answers.forEach(a => {
            const cq = cqMap[a.q_id] || {};
            const item = document.createElement("div");
            item.className = "code-item";

            const heading = document.createElement("h5");
            heading.textContent = "Q" + a.q_id + ". " + (a.title || cq.title || "");
            item.appendChild(heading);

            if (cq.q) {
                const desc = document.createElement("div");
                desc.className = "code-q";
                desc.textContent = cq.q;
                item.appendChild(desc);
            }

            if (a.attempted && a.code) {
                const ta = document.createElement("textarea");
                ta.value = a.code;
                item.appendChild(ta);
                body.appendChild(item);
                CodeMirror.fromTextArea(ta, {
                    lineNumbers: true,
                    mode: a.language || "python",
                    theme: "material-darker",
                    readOnly: true,
                    lineWrapping: true
                });
            } else {
                const empty = document.createElement("div");
                empty.style.cssText = "background:#f3f4f6;color:var(--muted);padding:12px;border-radius:6px;font-style:italic;font-size:13px;";
                empty.textContent = "(not attempted)";
                item.appendChild(empty);
                body.appendChild(item);
            }
        });

        $("#codeModal").classList.add("open");
    }

    function closeCodeModal() {
        $("#codeModal").classList.remove("open");
        $("#cmBody").innerHTML = "";
    }

    // ------------------------------------------------------------
    // Stats
    // ------------------------------------------------------------
    function renderStats() {
        const total = allRows.length;
        const pass  = allRows.filter(r => r.status === "PASS").length;
        const fail  = total - pass;
        const avg   = total ? (allRows.reduce((s, r) => s + Number(r.percentage), 0) / total) : 0;
        const top   = total ? Math.max(...allRows.map(r => Number(r.score))) : 0;

        $("#statTotal").textContent = total;
        $("#statPass").textContent  = pass;
        $("#statFail").textContent  = fail;
        $("#statAvg").textContent   = avg.toFixed(1) + "%";
        $("#statTop").textContent   = top;
    }

    // ------------------------------------------------------------
    // Filter + Sort + Render
    // ------------------------------------------------------------
    function applyFiltersAndRender() {
        const q = ($("#searchBox").value || "").trim().toLowerCase();
        const statusFilter = $("#filterStatus").value;

        filteredRows = allRows.filter(r => {
            if (statusFilter && r.status !== statusFilter) return false;
            if (!q) return true;
            return (
                (r.full_name  || "").toLowerCase().includes(q) ||
                (r.emp_code   || "").toLowerCase().includes(q) ||
                (r.department || "").toLowerCase().includes(q)
            );
        });

        filteredRows.sort((a, b) => {
            let av = a[sortKey], bv = b[sortKey];
            if (sortKey === "rank") return 0;
            if (typeof av === "string" && typeof bv === "string") {
                return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            }
            av = Number(av) || 0;
            bv = Number(bv) || 0;
            return sortDir === "asc" ? av - bv : bv - av;
        });

        renderTable();
    }

    function renderTable() {
        const tbody = $("#tableBody");
        if (!filteredRows.length) {
            tbody.innerHTML = '<tr><td colspan="11" class="empty">No submissions match your filter.</td></tr>';
            return;
        }
        tbody.innerHTML = filteredRows.map((r, i) => `
            <tr data-row-idx="${i}" title="Click to view all answers">
                <td>${i + 1}</td>
                <td><strong>${escapeHtml(r.full_name)}</strong></td>
                <td>${escapeHtml(r.emp_code)}</td>
                <td>${escapeHtml(r.department || "—")}</td>
                <td>${r.score} / ${r.total_questions}</td>
                <td>${Number(r.percentage).toFixed(1)}%</td>
                <td style="color:var(--success);">${r.correct}</td>
                <td style="color:var(--danger);">${r.wrong}</td>
                <td style="color:var(--muted);">${r.skipped}</td>
                <td><span class="pill ${r.status === 'PASS' ? 'pass' : 'fail'}">${r.status}</span></td>
                <td>${new Date(r.submitted_at).toLocaleString()}</td>
            </tr>
        `).join("");

        // Wire up row clicks for MCQ review
        tbody.querySelectorAll("tr[data-row-idx]").forEach(tr => {
            tr.addEventListener("click", () => {
                const idx = Number(tr.dataset.rowIdx);
                openMcqModal(filteredRows[idx]);
            });
        });
    }

    // ------------------------------------------------------------
    // MCQ Review modal — shows each Q + candidate's choice + correct
    // ------------------------------------------------------------
    function openMcqModal(row) {
        $("#cmTitle").textContent = row.full_name + " — MCQ Answers";
        $("#cmMeta").textContent  =
            "Emp: " + row.emp_code + "  •  " + (row.department || "—") +
            "  •  Submitted: " + new Date(row.submitted_at).toLocaleString() +
            "  •  Score: " + row.score + " / " + row.total_questions +
            "  (" + Number(row.percentage).toFixed(1) + "%)  •  " + row.status;

        const body = $("#cmBody");
        body.innerHTML = "";

        // Summary strip
        const stats = document.createElement("div");
        stats.className = "mcq-stats";
        stats.innerHTML =
            '<div class="mcq-stat ok"><span class="n">' + row.correct + '</span><span class="l">Correct</span></div>' +
            '<div class="mcq-stat bad"><span class="n">' + row.wrong + '</span><span class="l">Wrong</span></div>' +
            '<div class="mcq-stat skp"><span class="n">' + row.skipped + '</span><span class="l">Skipped</span></div>' +
            '<div class="mcq-stat"><span class="n">' + Number(row.percentage).toFixed(1) + '%</span><span class="l">Score</span></div>';
        body.appendChild(stats);

        const answers = Array.isArray(row.answers) ? row.answers : [];
        // Prefer per-row stored questions (randomised tests) ; fallback to global QUESTIONS for old rows
        const qList = Array.isArray(row.questions) && row.questions.length
            ? row.questions
            : (typeof QUESTIONS !== "undefined" ? QUESTIONS : []);

        if (!qList.length) {
            const warn = document.createElement("p");
            warn.style.cssText = "color:var(--muted);text-align:center;padding:20px;";
            warn.textContent = "Questions not available for this submission (legacy row).";
            body.appendChild(warn);
            $("#codeModal").classList.add("open");
            return;
        }

        qList.forEach((q, i) => {
            const given   = answers[i];                  // 0..3 or null
            const correct = q.ans;
            const isSkip  = given === null || given === undefined;
            const isOk    = !isSkip && given === correct;
            const isWrong = !isSkip && !isOk;

            const card = document.createElement("div");
            card.className = "mcq-q " + (isOk ? "correct" : isWrong ? "wrong" : "skipped");

            // Header
            const head = document.createElement("div");
            head.className = "mcq-q-head";
            const topicLabel = escapeHtml(q.topic || q.section || "");
            const levelLabel = q.level ? ' <small style="color:var(--muted);font-weight:400;">[' + escapeHtml(q.level) + ']</small>' : '';
            head.innerHTML =
                '<span class="mcq-q-num">Q' + (i+1) + ' • ' + topicLabel + levelLabel + '</span>' +
                '<span class="mcq-q-pill ' + (isOk ? "correct" : isWrong ? "wrong" : "skipped") + '">' +
                    (isOk ? "✓ Correct" : isWrong ? "✗ Wrong" : "— Skipped") + '</span>';
            card.appendChild(head);

            // Question text
            const qText = document.createElement("div");
            qText.className = "mcq-q-text";
            qText.textContent = q.q;
            card.appendChild(qText);

            // Options
            const ul = document.createElement("ul");
            ul.className = "mcq-opts";
            q.opts.forEach((opt, oi) => {
                const li = document.createElement("li");
                let classes  = [];
                let tagText  = "";
                if (oi === correct)               { classes.push("correct");      tagText = "CORRECT"; }
                if (!isSkip && oi === given && oi !== correct) {
                                                    classes.push("picked-wrong"); tagText = "YOUR PICK"; }
                if (!isSkip && oi === given && oi === correct) {
                                                    tagText = "YOUR PICK ✓"; }
                li.className = classes.join(" ");
                li.innerHTML =
                    '<span>' + String.fromCharCode(97 + oi) + ') ' + escapeHtml(opt) + '</span>' +
                    (tagText ? '<span class="tag">' + tagText + '</span>' : '');
                ul.appendChild(li);
            });
            card.appendChild(ul);

            body.appendChild(card);
        });

        $("#codeModal").classList.add("open");
    }

    function escapeHtml(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // ------------------------------------------------------------
    // CSV export
    // ------------------------------------------------------------
    function exportCsv() {
        if (!filteredRows.length) {
            alert("Nothing to export.");
            return;
        }
        const cols = [
            ["rank", "#"],
            ["full_name", "Name"],
            ["emp_code", "Employee Code"],
            ["department", "Department"],
            ["score", "Score"],
            ["total_questions", "Total"],
            ["percentage", "Percentage"],
            ["correct", "Correct"],
            ["wrong", "Wrong"],
            ["skipped", "Skipped"],
            ["status", "Status"],
            ["started_at", "Started"],
            ["submitted_at", "Submitted"]
        ];
        const esc = (v) => {
            if (v == null) return "";
            const s = String(v).replace(/"/g, '""');
            return /[",\n]/.test(s) ? '"' + s + '"' : s;
        };
        const lines = [cols.map(c => esc(c[1])).join(",")];
        filteredRows.forEach((r, i) => {
            lines.push(cols.map(c => {
                if (c[0] === "rank") return i + 1;
                return esc(r[c[0]]);
            }).join(","));
        });
        const csv = lines.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tb_results_" + new Date().toISOString().slice(0, 10) + ".csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    // ------------------------------------------------------------
    // Wire up
    // ------------------------------------------------------------
    document.addEventListener("DOMContentLoaded", () => {
        $("#loginForm").addEventListener("submit", attemptLogin);

        $("#refreshBtn").addEventListener("click", loadResults);
        $("#exportBtn").addEventListener("click", exportCsv);
        $("#logoutBtn").addEventListener("click", showLogin);

        $("#searchBox").addEventListener("input", applyFiltersAndRender);
        $("#filterStatus").addEventListener("change", applyFiltersAndRender);

        $$("#resultsTable thead th").forEach(th => {
            th.addEventListener("click", () => {
                const key = th.dataset.key;
                if (!key) return;
                if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
                else { sortKey = key; sortDir = "asc"; }
                applyFiltersAndRender();
            });
        });

        // ----- Tab switching -----
        $$(".tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const tab = btn.dataset.tab;
                $$(".tab-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                $$(".coding-panel").forEach(p => p.classList.remove("active"));
                const panelId = tab === "mcq"     ? "mcqPanel"
                              : tab === "coding"  ? "codingPanel"
                              : "plannerPanel";
                $("#" + panelId).classList.add("active");
                if (tab === "planner") loadPlannerConfig();
            });
        });

        // ----- Planner buttons -----
        const cfgSave     = $("#cfgSave");
        const cfgActivate = $("#cfgActivate");
        const cfgReload   = $("#cfgReload");
        const planNew     = $("#planNew");
        if (cfgSave)     cfgSave.addEventListener("click",     () => savePlannerConfig(false));
        if (cfgActivate) cfgActivate.addEventListener("click", () => savePlannerConfig(true));
        if (cfgReload)   cfgReload.addEventListener("click",   loadPlannerConfig);
        if (planNew)     planNew.addEventListener("click",     newPlan);

        // Live-sum counters
        ["cfgCntHTML","cfgCntCSS","cfgCntJS","cfgCntPY"].forEach(id => {
            const el = $("#"+id);
            if (el) el.addEventListener("input", updatePlannerTotals);
        });
        ["cfgEasy","cfgMedium","cfgHard"].forEach(id => {
            const el = $("#"+id);
            if (el) el.addEventListener("input", updatePlannerTotals);
        });

        // ----- Coding search -----
        const cSearch = $("#cSearchBox");
        if (cSearch) cSearch.addEventListener("input", renderCodingList);

        // ----- Code modal close -----
        const cmClose = $("#cmClose");
        if (cmClose) cmClose.addEventListener("click", closeCodeModal);

        $("#codeModal").addEventListener("click", (e) => {
            if (e.target.id === "codeModal") closeCodeModal();
        });

        if (isLoggedIn()) showDashboard();
    });
})();
