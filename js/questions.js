/* ============================================================
   questions.js
   ------------------------------------------------------------
   - Provides buildRandomTest()  → 50 random Qs per user
       5 HTML + 5 CSS + 15 JS + 25 Python
       with difficulty mix:  40% easy, 35% medium, 25% hard
   - Keeps CODING_QUESTIONS  (15 practical questions)
   ------------------------------------------------------------
   QUESTIONS source = window.POOL (loaded from question_pool.js)
   ============================================================ */

// Default test spec — overridden by DB config if available
let TEST_SPEC = {
    counts:        { HTML: 5,    CSS: 5,    JS: 15,   PY: 25 },   // = 50
    difficultyMix: { easy: 0.40, medium: 0.35, hard: 0.25 }
};

/**
 * Load test plan from Supabase (called once before showing welcome).
 * Falls back to TEST_SPEC defaults if anything fails.
 * Also sets duration / pass / etc. on SUPABASE_CONFIG.
 */
async function loadTestConfig() {
    try {
        if (typeof SUPABASE_CONFIG === "undefined"
            || !SUPABASE_CONFIG.url
            || !SUPABASE_CONFIG.anonKey
            || SUPABASE_CONFIG.anonKey.indexOf("REPLACE_WITH") === 0) return null;
        if (!window.supabase) return null;

        const sb = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

        // Prefer the active plan; fall back to legacy test_config
        let data = null;
        try {
            const res = await sb.from("test_plans").select("*").eq("is_active", true).maybeSingle();
            if (!res.error) data = res.data;
        } catch (e) { /* table may not exist yet */ }

        if (!data) {
            try {
                const res2 = await sb.from("test_config").select("*").eq("id", 1).maybeSingle();
                if (!res2.error) data = res2.data;
            } catch (e) { /* ignore */ }
        }
        if (!data) return null;

        // Expose active plan id globally so submissions can include it
        if (data.id) {
            window.ACTIVE_PLAN_ID   = data.id;
            window.ACTIVE_PLAN_NAME = data.name || "Default plan";
        }

        if (data.counts)         TEST_SPEC.counts        = data.counts;
        if (data.difficulty_mix) TEST_SPEC.difficultyMix = data.difficulty_mix;
        if (data.duration_min)   SUPABASE_CONFIG.durationMinutes = data.duration_min;
        if (data.pass_percent)   SUPABASE_CONFIG.passPercentage  = data.pass_percent;
        if (data.max_violations !== undefined) SUPABASE_CONFIG.maxViolations = data.max_violations;
        if (data.allow_coding !== undefined)   SUPABASE_CONFIG.allowCoding   = data.allow_coding;
        if (data.answers_unlock) SUPABASE_CONFIG.answersUnlockAt = data.answers_unlock;
        if (data.review_unlock)  SUPABASE_CONFIG.reviewUnlockAt  = data.review_unlock;

        // Cache locally so even offline we use last known
        try { localStorage.setItem("tb_test_config", JSON.stringify(data)); } catch (_) {}

        // Also fetch admin-added DB questions and merge into POOL
        try { await mergeDbQuestions(sb); } catch (e) { console.warn("DB questions merge failed:", e); }

        return data;
    } catch (e) {
        console.warn("loadTestConfig failed:", e);
        // Try cache
        try {
            const cached = localStorage.getItem("tb_test_config");
            if (cached) {
                const data = JSON.parse(cached);
                if (data.counts)         TEST_SPEC.counts        = data.counts;
                if (data.difficulty_mix) TEST_SPEC.difficultyMix = data.difficulty_mix;
            }
        } catch (_) {}
        return null;
    }
}

/**
 * Pick `n` random unique items from `arr`.
 */
function pickRandom(arr, n) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
}

/**
 * Fetch admin-added questions from DB and merge into POOL.
 * DB rows shape:  { id, topic, level, q, opt_a, opt_b, opt_c, opt_d, ans, is_active }
 * Pool rows shape: { id, topic, level, q, opts:[4], ans }
 */
async function mergeDbQuestions(sb) {
    if (typeof POOL === "undefined") return;
    const { data, error } = await sb
        .from("questions")
        .select("*")
        .eq("is_active", true);
    if (error || !data || !data.length) return;

    let merged = 0;
    data.forEach(r => {
        const topic = r.topic;
        if (!POOL[topic]) return;
        POOL[topic].push({
            id:    "db" + r.id,
            topic: r.topic,
            level: r.level || "medium",
            q:     r.q,
            opts:  [r.opt_a, r.opt_b, r.opt_c, r.opt_d],
            ans:   Number(r.ans)
        });
        merged++;
    });
    if (merged) {
        console.log("[pool] merged", merged, "DB questions. New totals:",
            "HTML=" + POOL.HTML.length,
            "CSS="  + POOL.CSS.length,
            "JS="   + POOL.JS.length,
            "PY="   + POOL.PY.length);
    }
}


/**
 * Build one user's randomised 50-Q test.
 * Returns: [{ id, topic, level, q, opts:[4], ans:0..3 }, ...]
 */
function buildRandomTest() {
    if (typeof POOL === "undefined") {
        console.error("POOL is not loaded — include question_pool.js");
        return [];
    }

    const out = [];

    Object.keys(TEST_SPEC.counts).forEach(topic => {
        const total = TEST_SPEC.counts[topic];
        const bank  = POOL[topic] || [];

        // Bucket pool by level
        const buckets = { easy: [], medium: [], hard: [] };
        bank.forEach(q => { (buckets[q.level] || buckets.medium).push(q); });

        // How many of each level we want from this topic
        const wantEasy   = Math.round(total * TEST_SPEC.difficultyMix.easy);
        const wantMedium = Math.round(total * TEST_SPEC.difficultyMix.medium);
        let   wantHard   = total - wantEasy - wantMedium;

        const picked = [
            ...pickRandom(buckets.easy,   wantEasy),
            ...pickRandom(buckets.medium, wantMedium),
            ...pickRandom(buckets.hard,   wantHard)
        ];

        // If a bucket is short, top up from other buckets
        while (picked.length < total) {
            const all = bank.filter(q => !picked.includes(q));
            if (!all.length) break;
            picked.push(...pickRandom(all, total - picked.length));
        }

        out.push(...picked);
    });

    // Shuffle the final list so topics aren't grouped
    return pickRandom(out, out.length).map((q, i) => ({
        ...q,
        seq: i + 1                  // 1..50 display order
    }));
}


/* ============================================================
   15 CODING QUESTIONS — Practical paper (unchanged)
   ============================================================ */
const CODING_QUESTIONS = [

    { id: 1, section: "HTML", language: "htmlmixed",
      title: "My Profile Page",
      q: "Write an HTML program that creates a webpage titled \"My Profile\" containing:\n• An <h1> heading with your name\n• An <hr> below it\n• A paragraph of 2 lines about yourself\n• A hyperlink to about.html with the text \"About Me\"",
      starter: "<!DOCTYPE html>\n<html>\n<head>\n    <title>My Profile</title>\n</head>\n<body>\n    \n    <!-- write your code here -->\n    \n</body>\n</html>",
      expectedHtml: "<div style=\"font-family:Arial,sans-serif;padding:14px;\"><h1>Vivek Kumar</h1><hr><p>I am a frontend developer working at Toyota Boshoku.<br>I love learning new web technologies and building user interfaces.</p><a href=\"#\">About Me</a></div>" },

    { id: 2, section: "HTML", language: "htmlmixed",
      title: "Login Form (Centered)",
      q: "Write an HTML program to create a login form with the following fields:\n• Username (text)\n• Password (password)\n• A Login submit button\nThe form should be centered on the page using a table layout.",
      starter: "<!DOCTYPE html>\n<html>\n<head>\n    <title>Login</title>\n</head>\n<body>\n    \n    <!-- write your code here -->\n    \n</body>\n</html>",
      expectedHtml: "<table width=\"100%\" height=\"200\" border=\"0\"><tr><td align=\"center\" valign=\"middle\"><table border=\"2\" cellpadding=\"6\"><tr><td>Username</td><td><input type=\"text\"></td></tr><tr><td>Password</td><td><input type=\"password\"></td></tr><tr><td colspan=\"2\" align=\"center\"><input type=\"submit\" value=\"Login\"></td></tr></table></td></tr></table>" },

    { id: 3, section: "HTML", language: "htmlmixed",
      title: "Employee Table with colspan",
      q: "Write an HTML program to create a table:\n\n| Id  | Name  | Department | Salary |\n| 101 | User1 | IT         | 35000  |\n| 102 | User2 | HR         | 28000  |\n\nUse colspan/rowspan. Heading \"Employee Details\" should span across all 4 columns.",
      starter: "<!DOCTYPE html>\n<html>\n<body>\n    <table border=\"2\">\n        \n        <!-- write your code here -->\n        \n    </table>\n</body>\n</html>",
      expectedHtml: "<table border=\"2\" cellpadding=\"8\" style=\"border-collapse:collapse;\"><tr><th colspan=\"4\" style=\"background:#f3f4f6;\">Employee Details</th></tr><tr><th>Id</th><th>Name</th><th>Department</th><th>Salary</th></tr><tr><td>101</td><td>User1</td><td>IT</td><td>35000</td></tr><tr><td>102</td><td>User2</td><td>HR</td><td>28000</td></tr></table>" },

    { id: 4, section: "CSS", language: "htmlmixed",
      title: "Three Flexbox Boxes",
      q: "Write HTML + CSS code to create three boxes of size 200×200 px, side by side using flexbox. Each box: different background colour (red, green, blue), 2px black border.",
      starter: "<!DOCTYPE html>\n<html>\n<head>\n    <style>\n        \n        /* write your CSS here */\n        \n    </style>\n</head>\n<body>\n    \n    <!-- write your HTML here -->\n    \n</body>\n</html>",
      expectedHtml: "<div style=\"display:flex;gap:10px;flex-wrap:wrap;padding:10px;\"><div style=\"width:140px;height:140px;background:red;border:2px solid black;\"></div><div style=\"width:140px;height:140px;background:green;border:2px solid black;\"></div><div style=\"width:140px;height:140px;background:blue;border:2px solid black;\"></div></div>" },

    { id: 5, section: "CSS", language: "htmlmixed",
      title: "Keyframes Color Animation",
      q: "Write HTML + CSS code that creates a div of 300×300 px which animates its background colour from orange → red → orange continuously, using @keyframes.",
      starter: "<!DOCTYPE html>\n<html>\n<head>\n    <style>\n        \n        /* write your CSS here */\n        \n    </style>\n</head>\n<body>\n    <div class=\"box\"></div>\n</body>\n</html>",
      expectedHtml: "<style>@keyframes _colShift{0%{background:orange}50%{background:red}100%{background:orange}}._anim{width:220px;height:220px;border:1px solid #333;animation:_colShift 2s infinite;}</style><div class=\"_anim\"></div>" },

    { id: 6, section: "JavaScript", language: "htmlmixed",
      title: "Button Click → Show Message",
      q: "Write an HTML + JavaScript program that has a button \"Click Me\" and a <div>. When the button is clicked, the message \"Welcome to Toyota Boshoku\" should appear inside the <div> using document.getElementById() and innerHTML.",
      starter: "<!DOCTYPE html>\n<html>\n<body>\n    \n    <!-- write your HTML here -->\n    \n    <script>\n        \n        // write your JS here\n        \n    </script>\n</body>\n</html>",
      expectedHtml: "<div style=\"padding:14px;font-family:Arial;\"><button onclick=\"document.getElementById('_msg').innerHTML='Welcome to Toyota Boshoku'\" style=\"padding:8px 16px;cursor:pointer;\">Click Me</button><div id=\"_msg\" style=\"margin-top:14px;padding:10px;background:#f3f4f6;min-height:24px;\">(click the button — message will appear here)</div></div>" },

    { id: 7, section: "JavaScript", language: "javascript",
      title: "Fetch API Call",
      q: "Write a JavaScript code using fetch() to call the API:\n    https://dummyjson.com/users/1\nand print the result on the browser console.",
      starter: "// Write your fetch() code here\n\n",
      expectedText: "// Expected console output (object from API):\n{\n  \"id\": 1,\n  \"firstName\": \"Emily\",\n  \"lastName\": \"Johnson\",\n  \"age\": 28,\n  \"email\": \"emily.johnson@x.dummyjson.com\",\n  \"username\": \"emilys\",\n  ...\n}" },

    { id: 8, section: "Python", language: "python",
      title: "Multiplication Table",
      q: "Write a Python program to print the multiplication table of any number entered by the user (1 to 10).\n\nExpected output for input 5:\n    5 x 1 = 5\n    5 x 2 = 10\n    ...\n    5 x 10 = 50",
      starter: "# Write your code here\nnum = int(input(\"Enter a number: \"))\n\n",
      expectedText: "Enter a number: 5\n5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50" },

    { id: 9, section: "Python", language: "python",
      title: "Prime Number Check",
      q: "Write a Python program to check whether a number entered by the user is prime or not.",
      starter: "# Write your code here\nnum = int(input(\"Enter a number: \"))\n\n",
      expectedText: "Example 1:\nEnter a number: 7\n7 is a prime number\n\nExample 2:\nEnter a number: 10\n10 is not a prime number" },

    { id: 10, section: "Python", language: "python",
      title: "Number Pattern",
      q: "Write a Python program to print the following pattern using nested loops:\n\n    1\n    12\n    123\n    1234\n    12345",
      starter: "# Write your code here\n\n",
      expectedText: "1\n12\n123\n1234\n12345" },

    { id: 11, section: "Python", language: "python",
      title: "Sum of Digits",
      q: "Write a Python program to find the sum of digits of a number entered by the user.\nExample: input 1234 → output 10",
      starter: "# Write your code here\nnum = int(input(\"Enter a number: \"))\n\n",
      expectedText: "Enter a number: 1234\nSum of digits = 10\n\n# (1 + 2 + 3 + 4 = 10)" },

    { id: 12, section: "Python", language: "python",
      title: "Employee Function (keyword args)",
      q: "Write a Python function employee(id, name, desig, salary) that returns the employee details in this format:\n    Id : 101 | Name : User1 | Desig : Developer | Salary : 45000\n\nCall the function using keyword arguments.",
      starter: "# Write your function here\ndef employee(id, name, desig, salary):\n    \n    pass\n\n# Call with keyword arguments\n",
      expectedText: "Id : 101 | Name : User1 | Desig : Developer | Salary : 45000" },

    { id: 13, section: "Python", language: "python",
      title: "Smallest & Largest (no min/max)",
      q: "Write a Python program to find the smallest and largest number from this list without using built-in min() / max():\n\n    numbers = [18, 45, 21, 41, 30, 81, 7, 99]",
      starter: "numbers = [18, 45, 21, 41, 30, 81, 7, 99]\n\n# Write your code here\n\n",
      expectedText: "Smallest number : 7\nLargest number  : 99" },

    { id: 14, section: "Python", language: "python",
      title: "Remove Duplicates (no set)",
      q: "Write a Python program to remove duplicates from the given list without using set():\n\n    marks = [1, 2, 2, 3, 4, 4, 5, 1, 6]\n\nExpected output: [1, 2, 3, 4, 5, 6]",
      starter: "marks = [1, 2, 2, 3, 4, 4, 5, 1, 6]\n\n# Write your code here\n\n",
      expectedText: "[1, 2, 3, 4, 5, 6]" },

    { id: 15, section: "Python", language: "python",
      title: "Divide + Save to File",
      q: "Write a Python program that:\n  1. Takes two numbers as input from the user.\n  2. Divides the first by second inside try-except block to handle ZeroDivisionError.\n  3. Writes the result into a file named result.txt using open() and write().\n  4. Prints \"Saved successfully\" after writing the file.",
      starter: "# Write your code here\n\n",
      expectedText: "Enter first number: 50\nEnter second number: 5\nSaved successfully\n\n# result.txt now contains:\n# 10.0\n\n# If second number is 0:\nEnter first number: 50\nEnter second number: 5\nSaved successfully" }
];
