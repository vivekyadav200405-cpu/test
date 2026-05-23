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
