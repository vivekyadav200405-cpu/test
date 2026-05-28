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
    // QUESTIONS MANAGER  (admin-added DB questions)
    // ============================================================
    let allQuestions = [];     // cached from DB
    let editingQId   = null;   // null = new question

    async function loadQuestions() {
        const tbody = $("#qTbody");
        tbody.innerHTML = '<tr><td colspan="8" class="empty">Loading…</td></tr>';
        try {
            const sb = getSupabaseClient();
            const { data, error } = await sb
                .from("questions")
                .select("*")
                .order("id", { ascending: false });
            if (error) throw error;

            // DB-sourced questions
            const dbQs = (data || []).map(r => ({
                _src:   "db",
                id:     r.id,
                topic:  r.topic,
                level:  r.level,
                q:      r.q,
                opts:   [r.opt_a, r.opt_b, r.opt_c, r.opt_d],
                ans:    r.ans,
                is_active: r.is_active,
                _raw: r
            }));

            // Pool (read-only)
            const poolQs = [];
            if (typeof POOL !== "undefined") {
                ["HTML","CSS","JS","PY"].forEach(topic => {
                    (POOL[topic] || []).forEach(q => {
                        poolQs.push({
                            _src:   "pool",
                            id:     "P-" + topic + "-" + q.id,   // unique key
                            topic:  topic,
                            level:  q.level,
                            q:      q.q,
                            opts:   q.opts,
                            ans:    q.ans,
                            is_active: true
                        });
                    });
                });
            }

            allQuestions = [...dbQs, ...poolQs];
            renderQStats(dbQs.length);
            renderQTable();
        } catch (e) {
            tbody.innerHTML =
                '<tr><td colspan="8" class="empty" style="color:var(--danger);">' +
                'Error: ' + (e.message || e) + '</td></tr>';
        }
    }

    function renderQStats(dbCount) {
        $("#qStatTotal").textContent = allQuestions.length;
        $("#qStatDb").textContent    = dbCount;
        const c = { HTML:0, CSS:0, JS:0, PY:0 };
        allQuestions.forEach(q => { if (c[q.topic] !== undefined) c[q.topic]++; });
        $("#qStatHtml").textContent = c.HTML;
        $("#qStatCss").textContent  = c.CSS;
        $("#qStatJs").textContent   = c.JS;
        $("#qStatPy").textContent   = c.PY;
    }

    function renderQTable() {
        const q        = ($("#qSearch").value || "").trim().toLowerCase();
        const ft       = $("#qFilterTopic").value;
        const fl       = $("#qFilterLevel").value;
        const showPool = $("#qShowPool") ? $("#qShowPool").checked : true;
        const showDb   = $("#qShowDb")   ? $("#qShowDb").checked   : true;
        const tbody    = $("#qTbody");

        const filtered = allQuestions.filter(r => {
            if (!showPool && r._src === "pool") return false;
            if (!showDb   && r._src === "db")   return false;
            if (ft && r.topic !== ft) return false;
            if (fl && r.level !== fl) return false;
            if (q && !(r.q || "").toLowerCase().includes(q)) return false;
            return true;
        });

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty">No questions match your filter.</td></tr>';
            return;
        }

        // Limit rendering to 500 rows to avoid huge DOM
        const limit = 500;
        const truncated = filtered.length > limit;
        const toShow = filtered.slice(0, limit);

        const letters = ['A','B','C','D'];
        tbody.innerHTML = toShow.map(r => {
            const letter      = letters[r.ans] || "?";
            const correctText = (r.opts && r.opts[r.ans]) ? r.opts[r.ans] : "";
            const correctTrunc = correctText.length > 80 ? (correctText.slice(0, 80) + "…") : correctText;
            const preview = (r.q || "").length > 120 ? (r.q.slice(0, 120) + "…") : r.q;
            const srcBadge = r._src === "db"
                ? '<span class="pill" style="background:rgba(40,167,69,0.15);color:var(--success);">DB</span>'
                : '<span class="pill" style="background:rgba(108,117,125,0.15);color:#555;">POOL</span>';
            const actions = r._src === "db"
                ? '<button data-qact="edit"   data-id="' + r.id + '" class="btn btn-light" style="padding:4px 10px;min-height:28px;font-size:12px;">Edit</button> ' +
                  '<button data-qact="delete" data-id="' + r.id + '" class="btn btn-light" style="padding:4px 10px;min-height:28px;font-size:12px;color:var(--danger);">Del</button>'
                : '<span style="color:var(--muted);font-size:11px;font-style:italic;">read-only</span>';
            return (
                '<tr>' +
                    '<td style="color:var(--muted);font-size:12px;">' + r.id + '</td>' +
                    '<td>' + srcBadge + '</td>' +
                    '<td><span class="pill" style="background:rgba(200,16,46,0.10);color:var(--primary);">' + escapeHtml(r.topic) + '</span></td>' +
                    '<td><small>' + escapeHtml(r.level || "—") + '</small></td>' +
                    '<td><div style="font-size:13px;line-height:1.4;white-space:normal;">' + escapeHtml(preview) + '</div></td>' +
                    '<td>' +
                        '<div style="display:flex;align-items:flex-start;gap:6px;font-size:13px;line-height:1.4;white-space:normal;">' +
                            '<strong style="color:var(--success);flex-shrink:0;">' + letter + ')</strong>' +
                            '<span>' + escapeHtml(correctTrunc) + '</span>' +
                        '</div>' +
                    '</td>' +
                    '<td>' + (r.is_active
                        ? '<span class="pill pass">YES</span>'
                        : '<span class="pill fail">NO</span>') + '</td>' +
                    '<td style="text-align:right;">' + actions + '</td>' +
                '</tr>'
            );
        }).join("") +
        (truncated
            ? '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:14px;font-size:12px;font-style:italic;">' +
              'Showing first ' + limit + ' of ' + filtered.length + '. Use filters to narrow down.</td></tr>'
            : '');

        tbody.querySelectorAll("button[data-qact]").forEach(b => {
            b.addEventListener("click", () => {
                const id  = Number(b.dataset.id);
                const act = b.dataset.qact;
                if (act === "edit")   openQuestionForm(id);
                if (act === "delete") deleteQuestion(id);
            });
        });
    }

    function openQuestionForm(id) {
        editingQId = id;
        if (id) {
            // Find by either raw id (DB) or composite key (pool)
            const r = allQuestions.find(x => x.id === id || x.id === String(id));
            if (!r) return;
            if (r._src === "pool") {
                alert("Pool questions are read-only. Use 'New Question' to add a custom version to the DB.");
                editingQId = null;
                return;
            }
            $("#qFormTitle").textContent = "Edit Question #" + r.id;
            $("#qfTopic").value  = r.topic;
            $("#qfLevel").value  = r.level;
            $("#qfText").value   = r.q;
            $("#qfOptA").value   = r.opts[0] || "";
            $("#qfOptB").value   = r.opts[1] || "";
            $("#qfOptC").value   = r.opts[2] || "";
            $("#qfOptD").value   = r.opts[3] || "";
            $("#qfActive").checked = !!r.is_active;
            // Set correct radio
            const rad = document.querySelector('input[name="qfAns"][value="' + r.ans + '"]');
            if (rad) rad.checked = true;
        } else {
            $("#qFormTitle").textContent = "New Question";
            $("#qfTopic").value = "HTML";
            $("#qfLevel").value = "medium";
            $("#qfText").value  = "";
            $("#qfOptA").value  = "";
            $("#qfOptB").value  = "";
            $("#qfOptC").value  = "";
            $("#qfOptD").value  = "";
            $("#qfActive").checked = true;
            document.querySelectorAll('input[name="qfAns"]').forEach(r => r.checked = false);
        }
        $("#qFormStatus").style.display = "none";
        $("#qFormModal").classList.add("open");
    }

    function closeQuestionForm() {
        $("#qFormModal").classList.remove("open");
    }

    async function saveQuestion() {
        const q     = $("#qfText").value.trim();
        const optA  = $("#qfOptA").value.trim();
        const optB  = $("#qfOptB").value.trim();
        const optC  = $("#qfOptC").value.trim();
        const optD  = $("#qfOptD").value.trim();
        const ansEl = document.querySelector('input[name="qfAns"]:checked');

        if (!q)    return showQFormErr("Question text is required.");
        if (!optA || !optB || !optC || !optD) return showQFormErr("All 4 options are required.");
        if (!ansEl) return showQFormErr("Select the correct option (A/B/C/D radio).");

        const payload = {
            topic:     $("#qfTopic").value,
            level:     $("#qfLevel").value,
            q:         q,
            opt_a:     optA,
            opt_b:     optB,
            opt_c:     optC,
            opt_d:     optD,
            ans:       Number(ansEl.value),
            is_active: $("#qfActive").checked,
            updated_at: new Date().toISOString()
        };

        try {
            const sb = getSupabaseClient();
            let res;
            if (editingQId) {
                res = await sb.from("questions").update(payload).eq("id", editingQId);
            } else {
                res = await sb.from("questions").insert(payload);
            }
            if (res.error) throw res.error;
            closeQuestionForm();
            showQStatus("✓ Saved.", "ok");
            await loadQuestions();
        } catch (e) {
            showQFormErr("Save failed: " + (e.message || e));
        }
    }

    async function deleteQuestion(id) {
        const r = allQuestions.find(x => x.id === id || x.id === String(id));
        if (!r) return;
        if (r._src === "pool") {
            alert("Pool questions cannot be deleted (built-in JS).");
            return;
        }
        if (!confirm("Delete question #" + id + "?\n\n" + r.q.slice(0, 100))) return;
        try {
            const sb = getSupabaseClient();
            const { error } = await sb.from("questions").delete().eq("id", id);
            if (error) throw error;
            showQStatus("✓ Deleted.", "ok");
            await loadQuestions();
        } catch (e) {
            showQStatus("Delete failed: " + (e.message || e), "err");
        }
    }

    function showQStatus(msg, type) {
        const el = $("#qStatus");
        el.textContent = msg;
        el.style.display = "block";
        el.style.padding = "10px 14px";
        el.style.borderRadius = "6px";
        el.style.marginBottom = "14px";
        if (type === "ok") {
            el.style.background = "rgba(40,167,69,0.12)";
            el.style.color = "var(--success)";
        } else {
            el.style.background = "rgba(220,53,69,0.12)";
            el.style.color = "var(--danger)";
        }
        setTimeout(() => { el.style.display = "none"; }, 5000);
    }

    function showQFormErr(msg) {
        const el = $("#qFormStatus");
        el.textContent = msg;
        el.style.display = "block";
        el.style.padding = "10px 14px";
        el.style.borderRadius = "6px";
        el.style.marginBottom = "14px";
        el.style.background = "rgba(220,53,69,0.12)";
        el.style.color = "var(--danger)";
    }


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
        // Auto-fallback: if no editing plan selected, fetch active plan id
        if (!editingPlanId) {
            try {
                const sb0 = getSupabaseClient();
                const { data } = await sb0.from("test_plans")
                    .select("id, name").eq("is_active", true).maybeSingle();
                if (data && data.id) {
                    editingPlanId = data.id;
                    if (!$("#cfgPlanName").value.trim()) {
                        $("#cfgPlanName").value = data.name || "Default plan";
                    }
                    showPlannerStatus("Editing active plan: " + (data.name || ("#"+data.id)), "warn");
                } else {
                    // No plan exists — create one on the fly
                    const name = ($("#cfgPlanName").value.trim() || "Default plan");
                    const { data: created, error } = await sb0
                        .from("test_plans")
                        .insert({ name: name, is_active: true })
                        .select().single();
                    if (error) throw error;
                    editingPlanId = created.id;
                    showPlannerStatus("Created new plan '" + name + "' (active).", "ok");
                }
            } catch (e) {
                showPlannerStatus("Could not find/create a plan: " + (e.message || e), "err");
                return;
            }
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
                showPlannerStatus("✓ Saved & activated. Now live for all candidates.", "ok");
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
        renderPerformanceCard();
    }

    // ------------------------------------------------------------
    // Performance card — appears when filter narrows to ONE candidate
    // ------------------------------------------------------------
    function renderPerformanceCard() {
        const card = $("#perfCard");
        if (!card) return;
        if (!filteredRows.length) { card.style.display = "none"; return; }

        // Detect if all rows belong to ONE candidate (by emp_code)
        const empSet = new Set(filteredRows.map(r => (r.emp_code || "").toLowerCase()));
        if (empSet.size !== 1) { card.style.display = "none"; return; }

        const candidate = filteredRows[0];
        const rows = filteredRows.slice().sort((a, b) =>
            new Date(b.submitted_at) - new Date(a.submitted_at));   // newest first

        // Header
        $("#perfName").textContent = candidate.full_name;
        $("#perfMeta").innerHTML =
            "Emp Code: <strong>" + escapeHtml(candidate.emp_code) + "</strong>" +
            "  •  Dept: <strong>" + escapeHtml(candidate.department || "—") + "</strong>" +
            "  •  Last attempt: " + new Date(rows[0].submitted_at).toLocaleString();

        // Stats
        const total   = rows.length;
        const passed  = rows.filter(r => r.status === "PASS").length;
        const failed  = total - passed;
        const best    = rows.reduce((mx, r) => Math.max(mx, Number(r.score) || 0), 0);
        const avgPct  = total ? (rows.reduce((s, r) => s + Number(r.percentage || 0), 0) / total) : 0;
        const planIds = new Set(rows.map(r => r.test_plan_id).filter(Boolean));

        $("#perfAttempts").textContent = total;
        $("#perfPlans").textContent    = planIds.size || 1;
        $("#perfPass").textContent     = passed;
        $("#perfFail").textContent     = failed;
        $("#perfBest").textContent     = best;
        $("#perfAvg").textContent      = avgPct.toFixed(1) + "%";

        // History list
        const hist = $("#perfHistory");
        hist.innerHTML = rows.map(r => {
            const planName = r.test_plan_id
                ? ("Plan #" + r.test_plan_id)
                : "Legacy";
            const ttSec = Number(r.time_taken_s || 0);
            const ttStr = ttSec ? (Math.floor(ttSec/60) + "m " + (ttSec%60) + "s") : "—";
            const pillCls = r.status === "PASS" ? "pass" : "fail";
            const score = r.score + "/" + r.total_questions;
            const pct   = Number(r.percentage || 0).toFixed(1) + "%";
            const date  = new Date(r.submitted_at).toLocaleString();
            return (
                '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f8f9fa;border-radius:6px;font-size:13px;flex-wrap:wrap;">' +
                    '<span class="pill ' + pillCls + '">' + r.status + '</span>' +
                    '<span><strong>' + score + '</strong> (' + pct + ')</span>' +
                    '<span style="color:var(--muted);">' + planName + '</span>' +
                    '<span style="color:var(--muted);">⏱ ' + ttStr + '</span>' +
                    '<span style="color:#888;font-size:12px;margin-left:auto;">' + date + '</span>' +
                '</div>'
            );
        }).join("");

        card.style.display = "block";
    }

    function renderTable() {
        const tbody = $("#tableBody");
        if (!filteredRows.length) {
            tbody.innerHTML = '<tr><td colspan="12" class="empty">No submissions match your filter.</td></tr>';
            return;
        }
        tbody.innerHTML = filteredRows.map((r, i) => `
            <tr data-row-idx="${i}" data-id="${r.id}" data-emp="${escapeHtml(r.emp_code)}" title="Click row to view answers">
                <td>${i + 1}</td>
                <td><a href="#" class="emp-link" data-emp="${escapeHtml(r.emp_code)}" style="color:var(--primary);text-decoration:none;font-weight:600;">${escapeHtml(r.full_name)}</a></td>
                <td><a href="#" class="emp-link" data-emp="${escapeHtml(r.emp_code)}" style="color:var(--primary);text-decoration:none;">${escapeHtml(r.emp_code)}</a></td>
                <td>${escapeHtml(r.department || "—")}</td>
                <td>${r.score} / ${r.total_questions}</td>
                <td>${Number(r.percentage).toFixed(1)}%</td>
                <td style="color:var(--success);">${r.correct}</td>
                <td style="color:var(--danger);">${r.wrong}</td>
                <td style="color:var(--muted);">${r.skipped}</td>
                <td><span class="pill ${r.status === 'PASS' ? 'pass' : 'fail'}">${r.status}</span></td>
                <td>${new Date(r.submitted_at).toLocaleString()}</td>
                <td style="text-align:right;">
                    <button data-act="del" data-id="${r.id}" class="btn btn-light" style="padding:4px 10px;min-height:28px;font-size:11px;color:var(--danger);">🗑 Delete</button>
                </td>
            </tr>
        `).join("");

        // Wire row click for MCQ review (whole row)
        tbody.querySelectorAll("tr[data-row-idx]").forEach(tr => {
            tr.addEventListener("click", (e) => {
                // Ignore clicks on action buttons or emp-link
                if (e.target.closest("button") || e.target.closest("a.emp-link")) return;
                const idx = Number(tr.dataset.rowIdx);
                openMcqModal(filteredRows[idx]);
            });
        });

        // Wire emp-link clicks → filter by this employee
        tbody.querySelectorAll("a.emp-link").forEach(a => {
            a.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const emp = a.dataset.emp;
                $("#searchBox").value = emp;
                showActiveFilter("📌 Filtered to candidate: " + emp);
                applyFiltersAndRender();
            });
        });

        // Wire delete buttons
        tbody.querySelectorAll("button[data-act='del']").forEach(b => {
            b.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteResult(Number(b.dataset.id));
            });
        });
    }

    function showActiveFilter(msg) {
        const el = $("#activeFilter");
        if (!el) return;
        el.textContent = msg;
        el.style.display = "block";
    }
    function hideActiveFilter() {
        const el = $("#activeFilter");
        if (el) el.style.display = "none";
    }

    async function deleteResult(id) {
        const row = allRows.find(r => r.id === id);
        if (!row) return;
        const ok = confirm(
            "Delete submission?\n\n" +
            "Candidate: " + row.full_name + " (" + row.emp_code + ")\n" +
            "Score: " + row.score + "/" + row.total_questions + "\n" +
            "Submitted: " + new Date(row.submitted_at).toLocaleString() + "\n\n" +
            "After deletion the candidate can re-attempt this test plan."
        );
        if (!ok) return;
        try {
            const sb = getSupabaseClient();
            // Use .select() to confirm rows were actually deleted (RLS-safe)
            const { data, error } = await sb
                .from(SUPABASE_CONFIG.tableName || "test_submissions")
                .delete()
                .eq("id", id)
                .select();
            if (error) throw error;
            if (!data || !data.length) {
                throw new Error("0 rows deleted. RLS DELETE policy may be missing — re-run supabase_schema.sql.");
            }
            // Remove from local arrays
            allRows = allRows.filter(r => r.id !== id);
            applyFiltersAndRender();
            renderStats();
            alert("✓ Deleted (" + data.length + " row). Candidate may now re-attempt.");
        } catch (e) {
            alert("Delete failed: " + (e.message || e));
        }
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

        // Question source priority:
        //  1) Per-row stored questions (randomised tests)
        //  2) LEGACY_QUESTIONS (original fixed 50 Qs) — for old submissions
        //  3) Empty fallback
        let qList = [];
        let usingLegacy = false;
        if (Array.isArray(row.questions) && row.questions.length) {
            qList = row.questions;
        } else if (typeof LEGACY_QUESTIONS !== "undefined" && LEGACY_QUESTIONS.length) {
            qList = LEGACY_QUESTIONS;
            usingLegacy = true;
        } else if (typeof QUESTIONS !== "undefined") {
            qList = QUESTIONS;
        }

        if (!qList.length) {
            const warn = document.createElement("p");
            warn.style.cssText = "color:var(--muted);text-align:center;padding:20px;";
            warn.textContent = "Questions not available for this submission.";
            body.appendChild(warn);
            $("#codeModal").classList.add("open");
            return;
        }

        if (usingLegacy) {
            const note = document.createElement("div");
            note.style.cssText =
                "background:#fff8e1;color:#8a6d00;padding:10px 14px;border-radius:6px;" +
                "margin-bottom:14px;font-size:12px;border-left:3px solid #f5a623;";
            note.innerHTML =
                "<strong>📜 Legacy submission</strong> — shown against the original fixed 50-question set " +
                "(this submission was made before randomised tests were enabled).";
            body.appendChild(note);
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

        $("#searchBox").addEventListener("input", () => {
            if (!$("#searchBox").value) hideActiveFilter();
            applyFiltersAndRender();
        });
        $("#filterStatus").addEventListener("change", applyFiltersAndRender);

        const clearBtn = $("#clearFilters");
        if (clearBtn) clearBtn.addEventListener("click", () => {
            $("#searchBox").value = "";
            $("#filterStatus").value = "";
            hideActiveFilter();
            applyFiltersAndRender();
        });

        const perfClose = $("#perfClose");
        if (perfClose) perfClose.addEventListener("click", () => {
            $("#searchBox").value = "";
            $("#filterStatus").value = "";
            hideActiveFilter();
            $("#perfCard").style.display = "none";
            applyFiltersAndRender();
        });

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
                const panelId = tab === "mcq"       ? "mcqPanel"
                              : tab === "coding"    ? "codingPanel"
                              : tab === "questions" ? "questionsPanel"
                              :                       "plannerPanel";
                $("#" + panelId).classList.add("active");
                if (tab === "planner")   loadPlannerConfig();
                if (tab === "questions") loadQuestions();
            });
        });

        // ----- Questions Manager buttons -----
        const qReload = $("#qReload");
        const qNew    = $("#qNew");
        const qfSave  = $("#qfSave");
        const qfCancel = $("#qfCancel");
        const qfClose  = $("#qFormClose");
        if (qReload)  qReload.addEventListener("click",  loadQuestions);
        if (qNew)     qNew.addEventListener("click",     () => openQuestionForm(null));
        if (qfSave)   qfSave.addEventListener("click",   saveQuestion);
        if (qfCancel) qfCancel.addEventListener("click", closeQuestionForm);
        if (qfClose)  qfClose.addEventListener("click",  closeQuestionForm);

        // Filters
        const qSearch       = $("#qSearch");
        const qFilterTopic  = $("#qFilterTopic");
        const qFilterLevel  = $("#qFilterLevel");
        const qShowPool     = $("#qShowPool");
        const qShowDb       = $("#qShowDb");
        if (qSearch)      qSearch.addEventListener("input",       renderQTable);
        if (qFilterTopic) qFilterTopic.addEventListener("change", renderQTable);
        if (qFilterLevel) qFilterLevel.addEventListener("change", renderQTable);
        if (qShowPool)    qShowPool.addEventListener("change",    renderQTable);
        if (qShowDb)      qShowDb.addEventListener("change",      renderQTable);

        // Close question modal on backdrop click
        const qFormModal = $("#qFormModal");
        if (qFormModal) qFormModal.addEventListener("click", (e) => {
            if (e.target.id === "qFormModal") closeQuestionForm();
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
