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
    async function loadResults() {
        const tbody = $("#tableBody");
        tbody.innerHTML = '<tr><td colspan="11" class="empty">Loading…</td></tr>';

        try {
            if (typeof SUPABASE_CONFIG === "undefined"
                || !SUPABASE_CONFIG.url
                || !SUPABASE_CONFIG.anonKey
                || SUPABASE_CONFIG.anonKey.indexOf("REPLACE_WITH") === 0) {
                throw new Error("Supabase config not set in js/config.js.");
            }
            if (!window.supabase) throw new Error("Supabase client not loaded.");

            const sb = window.supabase.createClient(
                SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey
            );
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
            <tr>
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

        if (isLoggedIn()) showDashboard();
    });
})();
