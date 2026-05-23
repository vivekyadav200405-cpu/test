/* ============================================
   50 Objective Questions — Training Assessment
   Each question: { id, section, q, opts[], ans (index 0-3) }
   ============================================ */

const QUESTIONS = [
    // ---------- Section A: Computer & Number System (Q1-Q6) ----------
    { id: 1, section: "Computer Basics",
      q: "Which of the following is the base of the binary number system?",
      opts: ["8", "10", "2", "16"], ans: 2 },

    { id: 2, section: "Computer Basics",
      q: "Hexadecimal number system uses digits from:",
      opts: ["0–7", "0–9", "0–9 and A–F", "0–1"], ans: 2 },

    { id: 3, section: "Computer Basics",
      q: "ASCII value of character A is:",
      opts: ["60", "65", "97", "64"], ans: 1 },

    { id: 4, section: "Computer Basics",
      q: "Which of the following is the fastest memory in a computer?",
      opts: ["HDD", "SSD", "RAM", "Cache"], ans: 3 },

    { id: 5, section: "Computer Basics",
      q: "Octal number system has the base:",
      opts: ["2", "8", "10", "16"], ans: 1 },

    { id: 6, section: "Computer Basics",
      q: "Which one is system software?",
      opts: ["MS Word", "Operating System", "Chrome", "VLC Player"], ans: 1 },

    // ---------- Section B: HTML (Q7-Q22) ----------
    { id: 7, section: "HTML",
      q: "Which tag is used to define the largest heading in HTML?",
      opts: ["<h6>", "<head>", "<h1>", "<heading>"], ans: 2 },

    { id: 8, section: "HTML",
      q: "Which of the following is a single (self-closing) HTML element?",
      opts: ["<p>", "<div>", "<hr>", "<a>"], ans: 2 },

    { id: 9, section: "HTML",
      q: "The correct file extension for an HTML file is:",
      opts: [".htm", ".html", "Both .htm and .html", ".ht"], ans: 2 },

    { id: 10, section: "HTML",
      q: "Which HTML tag is used to create a hyperlink?",
      opts: ["<link>", "<a>", "<href>", "<url>"], ans: 1 },

    { id: 11, section: "HTML",
      q: "Which attribute is used in <a> tag to specify the URL?",
      opts: ["src", "link", "href", "url"], ans: 2 },

    { id: 12, section: "HTML",
      q: "Which tag is used to insert an image in an HTML page?",
      opts: ["<picture>", "<img>", "<image>", "<src>"], ans: 1 },

    { id: 13, section: "HTML",
      q: "Which tag is used to create an unordered list?",
      opts: ["<ol>", "<list>", "<ul>", "<li>"], ans: 2 },

    { id: 14, section: "HTML",
      q: "Inside which tag do we put list items?",
      opts: ["<lt>", "<li>", "<item>", "<list>"], ans: 1 },

    { id: 15, section: "HTML",
      q: "Which of the following is a block-level element?",
      opts: ["<span>", "<i>", "<p>", "<b>"], ans: 2 },

    { id: 16, section: "HTML",
      q: "Which of the following is an inline element?",
      opts: ["<div>", "<p>", "<i>", "<table>"], ans: 2 },

    { id: 17, section: "HTML",
      q: "In HTML table, which tag defines a row?",
      opts: ["<td>", "<tr>", "<th>", "<row>"], ans: 1 },

    { id: 18, section: "HTML",
      q: "Which attribute merges two or more columns in a table?",
      opts: ["rowspan", "merge", "colspan", "span"], ans: 2 },

    { id: 19, section: "HTML",
      q: "Which input type is used to create a password field?",
      opts: ["text", "pwd", "password", "secret"], ans: 2 },

    { id: 20, section: "HTML",
      q: "The default method of an HTML <form> is:",
      opts: ["POST", "GET", "PUT", "DELETE"], ans: 1 },

    { id: 21, section: "HTML",
      q: "Which tag is used to give a line break?",
      opts: ["<lb>", "<br>", "<hr>", "<break>"], ans: 1 },

    { id: 22, section: "HTML",
      q: "Which one is the correct doctype declaration for HTML5?",
      opts: ["<!DOCTYPE HTML5>", "<!DOCTYPE html>", "<DOCTYPE html>", "<html5>"], ans: 1 },

    // ---------- Section C: CSS (Q23-Q34) ----------
    { id: 23, section: "CSS",
      q: "Which symbol is used as a CSS class selector?",
      opts: ["#", ".", "*", "@"], ans: 1 },

    { id: 24, section: "CSS",
      q: "Which symbol is used as a CSS id selector?",
      opts: [".", "#", "&", "$"], ans: 1 },

    { id: 25, section: "CSS",
      q: "Which CSS property is used to change text color?",
      opts: ["text-color", "font-color", "color", "fgcolor"], ans: 2 },

    { id: 26, section: "CSS",
      q: "Which CSS property controls the space inside the border of an element?",
      opts: ["margin", "padding", "spacing", "border-space"], ans: 1 },

    { id: 27, section: "CSS",
      q: "Which value of position keeps the element fixed relative to the viewport?",
      opts: ["relative", "absolute", "static", "fixed"], ans: 3 },

    { id: 28, section: "CSS",
      q: "Which position is positioned relative to the nearest positioned ancestor?",
      opts: ["static", "relative", "absolute", "fixed"], ans: 2 },

    { id: 29, section: "CSS",
      q: "Which CSS property is used to make a layout flexible?",
      opts: ["display: flex", "flex-box: true", "layout: flex", "box: flexible"], ans: 0 },

    { id: 30, section: "CSS",
      q: "Which property aligns items along the main axis in flexbox?",
      opts: ["align-items", "justify-content", "flex-align", "align-content"], ans: 1 },

    { id: 31, section: "CSS",
      q: "Which rule is used to apply styles for screens smaller than 768px?",
      opts: ["@screen", "@responsive", "@media (max-width: 768px)", "@viewport"], ans: 2 },

    { id: 32, section: "CSS",
      q: "The CSS * selector selects:",
      opts: ["All ids", "All classes", "All elements", "Nothing"], ans: 2 },

    { id: 33, section: "CSS",
      q: "Which property is used to create CSS animations with stages?",
      opts: ["@animation", "@keyframes", "@frames", "@motion"], ans: 1 },

    { id: 34, section: "CSS",
      q: "Which property gives smooth change of CSS values over time?",
      opts: ["animation", "keyframes", "transition", "motion"], ans: 2 },

    // ---------- Section D: JavaScript / DOM (Q35-Q40) ----------
    { id: 35, section: "JavaScript",
      q: "Which method is used to select an element by id in JavaScript?",
      opts: ["getElement()", "getElementById()", "selectById()", "querySelectorId()"], ans: 1 },

    { id: 36, section: "JavaScript",
      q: "Which event attribute calls a function when a button is clicked?",
      opts: ["onhover", "onpress", "onclick", "onpush"], ans: 2 },

    { id: 37, section: "JavaScript",
      q: "Which keyword declares a variable that cannot be reassigned?",
      opts: ["var", "let", "const", "static"], ans: 2 },

    { id: 38, section: "JavaScript",
      q: "Which API is used in JavaScript to make HTTP requests?",
      opts: ["request()", "http()", "fetch()", "ajax()"], ans: 2 },

    { id: 39, section: "JavaScript",
      q: "What does innerHTML do?",
      opts: ["Reads/sets text content only", "Reads/sets HTML inside an element", "Returns id of element", "Returns class of element"], ans: 1 },

    { id: 40, section: "JavaScript",
      q: "Which symbol is used for an arrow function?",
      opts: ["->", "=>", ":>", "~>"], ans: 1 },

    // ---------- Section E: Python (Q41-Q50) ----------
    { id: 41, section: "Python",
      q: "Which function is used to display output in Python?",
      opts: ["echo()", "display()", "print()", "output()"], ans: 2 },

    { id: 42, section: "Python",
      q: "Which function is used to take input from user in Python?",
      opts: ["scan()", "input()", "read()", "get()"], ans: 1 },

    { id: 43, section: "Python",
      q: "What will int(input()) do when user enters 45?",
      opts: ["Return string \"45\"", "Return integer 45", "Throw error", "Return float 45.0"], ans: 1 },

    { id: 44, section: "Python",
      q: "Which of the following data type is mutable?",
      opts: ["tuple", "string", "list", "int"], ans: 2 },

    { id: 45, section: "Python",
      q: "Which keyword is used to define a function in Python?",
      opts: ["function", "def", "func", "define"], ans: 1 },

    { id: 46, section: "Python",
      q: "What is the output of range(1, 6) when used in a for loop?",
      opts: ["1 2 3 4 5 6", "1 2 3 4 5", "0 1 2 3 4 5", "2 3 4 5 6"], ans: 1 },

    { id: 47, section: "Python",
      q: "Which block in Python is used to handle exceptions?",
      opts: ["try-catch", "try-except", "catch-throw", "handle-error"], ans: 1 },

    { id: 48, section: "Python",
      q: "Which mode opens a file for writing (creates new / overwrites)?",
      opts: ["\"r\"", "\"a\"", "\"w\"", "\"x\""], ans: 2 },

    { id: 49, section: "Python",
      q: "Which method adds an element at the end of a list?",
      opts: ["add()", "push()", "insert()", "append()"], ans: 3 },

    { id: 50, section: "Python",
      q: "What will be the output of:\n\nfor i in range(1, 4):\n    for j in range(1, i+1):\n        print(j, end=\"\")\n    print()",
      opts: ["1\n12\n123", "123\n123\n123", "1\n1 2\n1 2 3", "1\n2 2\n3 3 3"], ans: 0 }
];


/* ============================================================
   15 CODING QUESTIONS — Practical paper
   language: "htmlmixed" | "javascript" | "python" | "css"
   ============================================================ */

const CODING_QUESTIONS = [

    // ---------- Section A: HTML & CSS (Q1-Q5) ----------
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

    // ---------- Section B: JavaScript / DOM (Q6-Q7) ----------
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

    // ---------- Section C: Python — Loops & Conditions (Q8-Q11) ----------
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

    // ---------- Section D: Python — Functions, Lists & Dict (Q12-Q14) ----------
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

    // ---------- Section E: Exception & File Handling (Q15) ----------
    { id: 15, section: "Python", language: "python",
      title: "Divide + Save to File",
      q: "Write a Python program that:\n  1. Takes two numbers as input from the user.\n  2. Divides the first by second inside try-except block to handle ZeroDivisionError.\n  3. Writes the result into a file named result.txt using open() and write().\n  4. Prints \"Saved successfully\" after writing the file.",
      starter: "# Write your code here\n\n",
      expectedText: "Enter first number: 50\nEnter second number: 5\nSaved successfully\n\n# result.txt now contains:\n# 10.0\n\n# If second number is 0:\nEnter first number: 50\nEnter second number: 0\nCannot divide by zero" }
];

