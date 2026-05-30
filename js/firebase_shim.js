/* ============================================================
   firebase_shim.js  —  Supabase-compatible layer over Firestore
   ------------------------------------------------------------
   Lets the existing code keep calling:

       const sb = window.supabase.createClient(url, key);
       await sb.from("table").select("*").eq(...).order(...);
       await sb.from("table").insert(obj).select().single();
       await sb.from("table").update(obj).eq("id", id);
       await sb.from("table").delete().eq("id", id).select();
       await sb.rpc("has_taken_test", { emp });

   …but stores everything in Google Firebase (Cloud Firestore),
   which never pauses and is reachable on Google domains.

   SELECT queries fetch the whole collection and filter/sort in
   JavaScript — this avoids Firestore composite-index setup and
   is fine for a training portal's data volume.
   ============================================================ */
(function () {
    "use strict";

    var fs = null;            // Firestore instance (null = not configured)
    var initError = null;

    function configured() {
        return (typeof FIREBASE_CONFIG !== "undefined")
            && FIREBASE_CONFIG
            && FIREBASE_CONFIG.projectId
            && String(FIREBASE_CONFIG.projectId).indexOf("REPLACE") !== 0
            && String(FIREBASE_CONFIG.apiKey || "").indexOf("REPLACE") !== 0;
    }

    try {
        if (typeof firebase === "undefined") {
            initError = "Firebase SDK did not load (check internet).";
        } else if (!configured()) {
            initError = "FIREBASE_CONFIG is not set in js/config.js.";
        } else {
            if (!firebase.apps || !firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            fs = firebase.firestore();
        }
    } catch (e) {
        initError = (e && e.message) || String(e);
    }
    if (initError) console.error("[firebase_shim]", initError);

    function err(msg) { return { message: msg || initError || "Firebase not ready" }; }

    // Attach the Firestore doc id as `id` (matches Supabase row.id usage)
    function rowOf(doc) {
        var d = doc.data() || {};
        d.id = doc.id;
        return d;
    }

    // Normalise a row before writing (case-insensitive emp lookups)
    function normalizeWrite(obj) {
        var o = {};
        for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) o[k] = obj[k];
        if (o.emp_code != null) o.emp_code_key = String(o.emp_code).trim().toLowerCase();
        return o;
    }

    // ---------- Query builder (thenable) ----------
    function QB(table) {
        this.table = table;
        this._op = "select";
        this._filters = [];          // {type, col, val}
        this._order = null;          // {col, asc}
        this._payload = null;
        this._selectOpts = null;     // {count, head}
        this._wantRows = false;      // insert/update/delete .select()
        this._single = false;
        this._maybe = false;
    }
    QB.prototype.select = function (cols, opts) {
        if (this._op === "select") this._selectOpts = opts || null;
        else this._wantRows = true;
        return this;
    };
    QB.prototype.insert = function (obj) { this._op = "insert"; this._payload = obj; return this; };
    QB.prototype.update = function (obj) { this._op = "update"; this._payload = obj; return this; };
    QB.prototype.delete = function () { this._op = "delete"; return this; };
    QB.prototype.eq    = function (col, val) { this._filters.push({ type: "eq", col: col, val: val }); return this; };
    QB.prototype.ilike = function (col, val) { this._filters.push({ type: "ilike", col: col, val: val }); return this; };
    QB.prototype.in    = function (col, arr) { this._filters.push({ type: "in", col: col, val: arr }); return this; };
    QB.prototype.order = function (col, opts) { this._order = { col: col, asc: !(opts && opts.ascending === false) }; return this; };
    QB.prototype.single      = function () { this._single = true; return this; };
    QB.prototype.maybeSingle = function () { this._single = true; this._maybe = true; return this; };

    QB.prototype._match = function (row) {
        return this._filters.every(function (f) {
            var rv = row[f.col];
            if (f.type === "eq")    return rv === f.val;
            if (f.type === "in")    return (f.val || []).indexOf(rv) !== -1;
            if (f.type === "ilike") {
                var a = String(rv == null ? "" : rv).toLowerCase();
                var b = String(f.val == null ? "" : f.val).toLowerCase().replace(/%/g, "");
                return a === b;
            }
            return true;
        });
    };

    QB.prototype._sortRows = function (rows) {
        if (!this._order) return rows;
        var c = this._order.col, asc = this._order.asc;
        return rows.sort(function (a, b) {
            var av = a[c], bv = b[c];
            if (av === bv) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            return (av > bv ? 1 : -1) * (asc ? 1 : -1);
        });
    };

    QB.prototype._run = function () {
        var self = this;
        if (!fs) return Promise.resolve({ data: null, error: err() });
        var col = fs.collection(this.table);

        if (this._op === "select") {
            return col.get().then(function (snap) {
                var rows = [];
                snap.forEach(function (d) { rows.push(rowOf(d)); });
                rows = self._sortRows(rows.filter(function (r) { return self._match(r); }));
                if (self._selectOpts && self._selectOpts.count) {
                    return { data: self._selectOpts.head ? null : rows, count: rows.length, error: null };
                }
                if (self._single) {
                    var one = rows.length ? rows[0] : null;
                    return { data: one, error: (!one && !self._maybe) ? err("No rows") : null };
                }
                return { data: rows, error: null };
            }).catch(function (e) { return { data: null, error: err(e.message || String(e)) }; });
        }

        if (this._op === "insert") {
            var items = Array.isArray(this._payload) ? this._payload : [this._payload];
            var out = [];
            var chain = Promise.resolve();
            items.forEach(function (it) {
                chain = chain.then(function () {
                    var data = normalizeWrite(it);
                    return col.add(data).then(function (ref) {
                        data.id = ref.id;
                        out.push(data);
                    });
                });
            });
            return chain.then(function () {
                if (self._single) return { data: out[0] || null, error: null };
                return { data: self._wantRows ? out : null, error: null };
            }).catch(function (e) { return { data: null, error: err(e.message || String(e)) }; });
        }

        if (this._op === "update" || this._op === "delete") {
            return col.get().then(function (snap) {
                var rows = [];
                snap.forEach(function (d) { rows.push(rowOf(d)); });
                rows = rows.filter(function (r) { return self._match(r); });
                var affected = [];
                var chain = Promise.resolve();
                rows.forEach(function (r) {
                    chain = chain.then(function () {
                        if (self._op === "update") {
                            return col.doc(r.id).update(self._payload).then(function () {
                                affected.push(Object.assign({}, r, self._payload));
                            });
                        }
                        return col.doc(r.id).delete().then(function () { affected.push(r); });
                    });
                });
                return chain.then(function () {
                    return { data: self._wantRows ? affected : null, error: null };
                });
            }).catch(function (e) { return { data: null, error: err(e.message || String(e)) }; });
        }

        return Promise.resolve({ data: null, error: err("Unknown op") });
    };

    // Thenable so `await qb` and `qb.then(...)` work like supabase-js
    QB.prototype.then = function (resolve, reject) { return this._run().then(resolve, reject); };
    QB.prototype.catch = function (reject) { return this._run().catch(reject); };

    // ---------- RPC equivalents ----------
    function activePlanId() {
        if (!fs) return Promise.resolve(null);
        return fs.collection("test_plans").get().then(function (snap) {
            var id = null;
            snap.forEach(function (d) { if ((d.data() || {}).is_active === true) id = d.id; });
            return id;
        });
    }

    // True if a submission exists for (field == val) within the ACTIVE plan.
    function hasTaken(field, val) {
        if (val == null || val === "") return Promise.resolve(false);
        return activePlanId().then(function (pid) {
            if (!pid) return false;   // no active plan → behave like SQL (no match)
            return fs.collection("test_submissions").get().then(function (snap) {
                var found = false;
                snap.forEach(function (d) {
                    var r = d.data() || {};
                    if (r.test_plan_id !== pid) return;
                    var rv = field === "emp_code"
                        ? String(r.emp_code == null ? "" : r.emp_code).toLowerCase()
                        : r[field];
                    var cmp = field === "emp_code" ? String(val).toLowerCase() : val;
                    if (rv === cmp) found = true;
                });
                return found;
            });
        });
    }

    function rpc(name, args) {
        args = args || {};
        if (!fs) return Promise.resolve({ data: null, error: err() });
        try {
            if (name === "has_taken_test")
                return hasTaken("emp_code", args.emp).then(function (v) { return { data: v, error: null }; });
            if (name === "has_taken_test_ip")
                return hasTaken("ip_address", args.client_ip).then(function (v) { return { data: v, error: null }; });
            if (name === "has_taken_test_device")
                return hasTaken("device_fingerprint", args.device_fp).then(function (v) { return { data: v, error: null }; });

            if (name === "activate_plan") {
                return fs.collection("test_plans").get().then(function (snap) {
                    var batch = fs.batch();
                    snap.forEach(function (d) { batch.update(d.ref, { is_active: d.id === args.plan_id }); });
                    return batch.commit().then(function () { return { data: null, error: null }; });
                });
            }
            if (name === "get_active_plan") {
                return activePlanId().then(function (pid) {
                    if (!pid) return { data: null, error: null };
                    return fs.collection("test_plans").doc(pid).get().then(function (doc) {
                        return { data: rowOf(doc), error: null };
                    });
                });
            }
            return Promise.resolve({ data: null, error: err("Unknown rpc: " + name) });
        } catch (e) {
            return Promise.resolve({ data: null, error: err(e.message || String(e)) });
        }
    }

    function makeClient() {
        return {
            from: function (table) { return new QB(table); },
            rpc: function (name, args) { return rpc(name, args); }
        };
    }

    // Expose the SAME global the existing code expects.
    window.supabase = { createClient: function () { return makeClient(); } };
})();
