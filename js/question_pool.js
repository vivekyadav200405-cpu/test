/* ============================================================
   QUESTION POOL — built ONLY from the topics actually taught in
   the "zillionsoftech" day-wise training content.
   ------------------------------------------------------------
   Each item: { id, topic, level, q, opts:[4], ans:0..3 }
   topic:  "HTML" | "CSS" | "JS" | "PY"
   level:  "easy" | "medium" | "hard"
   Language kept simple on purpose.
   ============================================================ */

const POOL = {

// ============================================================
// HTML  — headings, lists, links, images, tables, forms
// ============================================================
HTML: [
// ---- easy ----
{id:1,topic:"HTML",level:"easy",q:"Which tag makes the biggest heading?",opts:["<h6>","<h1>","<head>","<big>"],ans:1},
{id:2,topic:"HTML",level:"easy",q:"Which tag is used for a paragraph?",opts:["<p>","<para>","<pg>","<text>"],ans:0},
{id:3,topic:"HTML",level:"easy",q:"Which tag gives a line break (new line)?",opts:["<break>","<lb>","<br>","<nl>"],ans:2},
{id:4,topic:"HTML",level:"easy",q:"Which tag draws a horizontal line?",opts:["<line>","<hr>","<hl>","<rule>"],ans:1},
{id:5,topic:"HTML",level:"easy",q:"Which tag is used to add a link?",opts:["<a>","<link>","<href>","<url>"],ans:0},
{id:6,topic:"HTML",level:"easy",q:"Which tag is used to show an image?",opts:["<image>","<img>","<pic>","<src>"],ans:1},
{id:7,topic:"HTML",level:"easy",q:"Which tag makes a bullet (unordered) list?",opts:["<ol>","<ul>","<li>","<list>"],ans:1},
{id:8,topic:"HTML",level:"easy",q:"Which tag makes a numbered (ordered) list?",opts:["<ul>","<ol>","<nl>","<num>"],ans:1},
{id:9,topic:"HTML",level:"easy",q:"Each item of a list is written inside which tag?",opts:["<item>","<li>","<list>","<it>"],ans:1},
{id:10,topic:"HTML",level:"easy",q:"Which is the correct HTML5 start line?",opts:["<html5>","<!DOCTYPE html>","<doctype html5>","<!DOC html>"],ans:1},
{id:11,topic:"HTML",level:"easy",q:"Which tag sets the page title shown on the browser tab?",opts:["<title>","<head>","<name>","<tab>"],ans:0},
{id:12,topic:"HTML",level:"easy",q:"Which tag is used to make text bold?",opts:["<bold>","<b>","<bld>","<strongly>"],ans:1},
{id:13,topic:"HTML",level:"easy",q:"Which tag is used to make text italic?",opts:["<it>","<i>","<italic>","<em2>"],ans:1},
{id:14,topic:"HTML",level:"easy",q:"Which tag is a box used to group content (block)?",opts:["<span>","<div>","<box>","<group>"],ans:1},
{id:15,topic:"HTML",level:"easy",q:"All visible page content is written inside which tag?",opts:["<head>","<body>","<main>","<page>"],ans:1},
// ---- medium ----
{id:16,topic:"HTML",level:"medium",q:"Which attribute of <a> tells where the link goes?",opts:["src","href","link","to"],ans:1},
{id:17,topic:"HTML",level:"medium",q:"Which attribute of <img> gives the image file path?",opts:["href","src","file","path"],ans:1},
{id:18,topic:"HTML",level:"medium",q:"Which <img> attribute shows text if the image fails to load?",opts:["title","alt","name","text"],ans:1},
{id:19,topic:"HTML",level:"medium",q:"Which tag makes one row of a table?",opts:["<td>","<tr>","<row>","<th>"],ans:1},
{id:20,topic:"HTML",level:"medium",q:"Which tag makes a normal data cell in a table?",opts:["<td>","<tr>","<cell>","<th>"],ans:0},
{id:21,topic:"HTML",level:"medium",q:"Which tag makes a heading cell (bold, centered) in a table?",opts:["<td>","<th>","<thead>","<hcell>"],ans:1},
{id:22,topic:"HTML",level:"medium",q:"Which attribute joins many columns into one cell?",opts:["rowspan","colspan","merge","span"],ans:1},
{id:23,topic:"HTML",level:"medium",q:"Which input type hides the typed text with dots?",opts:["text","password","hidden","secret"],ans:1},
{id:24,topic:"HTML",level:"medium",q:"Which input type makes a button that sends the form?",opts:["send","submit","button","go"],ans:1},
{id:25,topic:"HTML",level:"medium",q:"Form fields are written inside which tag?",opts:["<input>","<form>","<fields>","<data>"],ans:1},
{id:26,topic:"HTML",level:"medium",q:"Which tag is used to make a clickable button?",opts:["<btn>","<button>","<click>","<press>"],ans:1},
{id:27,topic:"HTML",level:"medium",q:"Which is an inline element (stays in the same line)?",opts:["<div>","<span>","<p>","<table>"],ans:1},
// ---- hard ----
{id:28,topic:"HTML",level:"hard",q:"Which tag does NOT need a closing tag?",opts:["<p>","<br>","<div>","<a>"],ans:1},
{id:29,topic:"HTML",level:"hard",q:"Which set has all block-level elements?",opts:["<span>, <a>, <img>","<div>, <p>, <table>","<b>, <i>, <span>","<a>, <img>, <b>"],ans:1},
{id:30,topic:"HTML",level:"hard",q:"To put a list inside a list item, the inner <ul> is written ...",opts:["before <li>","inside the <li>","outside <ul>","inside <ol> only"],ans:1},
{id:31,topic:"HTML",level:"hard",q:"In <td colspan=\"2\">, what does it do?",opts:["Makes 2 rows","Makes the cell cover 2 columns","Adds 2 cells","Repeats text twice"],ans:1},
{id:32,topic:"HTML",level:"hard",q:"Which is the correct way to write an image tag?",opts:["<img>cat.png</img>","<img src=\"cat.png\" alt=\"cat\">","<image src=\"cat.png\">","<img href=\"cat.png\">"],ans:1},
],

// ============================================================
// CSS  — selectors, box, position, flexbox, animation, media
// ============================================================
CSS: [
// ---- easy ----
{id:1,topic:"CSS",level:"easy",q:"Which symbol is used to select a class?",opts:["#",".","*","@"],ans:1},
{id:2,topic:"CSS",level:"easy",q:"Which symbol is used to select an id?",opts:[".","#","*","$"],ans:1},
{id:3,topic:"CSS",level:"easy",q:"Which selector selects every element on the page?",opts:["all","*","#","body"],ans:1},
{id:4,topic:"CSS",level:"easy",q:"Which property changes the text color?",opts:["text-color","color","font-color","fill"],ans:1},
{id:5,topic:"CSS",level:"easy",q:"Which property sets the background color?",opts:["bg-color","background-color","color-bg","back-color"],ans:1},
{id:6,topic:"CSS",level:"easy",q:"Which property sets how tall an element is?",opts:["size","height","tall","length"],ans:1},
{id:7,topic:"CSS",level:"easy",q:"Which property sets how wide an element is?",opts:["width","wide","size-x","length"],ans:0},
{id:8,topic:"CSS",level:"easy",q:"Which property draws a border around an element?",opts:["outline-box","border","edge","frame"],ans:1},
{id:9,topic:"CSS",level:"easy",q:"Which property adds space INSIDE the border?",opts:["margin","padding","gap","space"],ans:1},
{id:10,topic:"CSS",level:"easy",q:"Which property adds space OUTSIDE the border?",opts:["padding","margin","gap","border"],ans:1},
{id:11,topic:"CSS",level:"easy",q:"Which unit means pixels?",opts:["pt","px","em","vw"],ans:1},
{id:12,topic:"CSS",level:"easy",q:"Internal CSS is written inside which tag?",opts:["<css>","<style>","<script>","<head>"],ans:1},
// ---- medium ----
{id:13,topic:"CSS",level:"medium",q:"Which property is used to make a flexible layout?",opts:["display: flex","layout: flex","flex: on","box: flex"],ans:0},
{id:14,topic:"CSS",level:"medium",q:"In flexbox, which property aligns items on the main axis?",opts:["align-items","justify-content","flex-align","place"],ans:1},
{id:15,topic:"CSS",level:"medium",q:"In flexbox, which property aligns items on the cross axis?",opts:["justify-content","align-items","flex-cross","valign"],ans:1},
{id:16,topic:"CSS",level:"medium",q:"Which position keeps an element fixed even when you scroll?",opts:["relative","absolute","fixed","static"],ans:2},
{id:17,topic:"CSS",level:"medium",q:"Which is the default position value of elements?",opts:["static","relative","absolute","fixed"],ans:0},
{id:18,topic:"CSS",level:"medium",q:"Which rule applies styles only on small screens (max 768px)?",opts:["@screen (768px)","@media (max-width: 768px)","@responsive","@size 768"],ans:1},
{id:19,topic:"CSS",level:"medium",q:"What does 100vw mean?",opts:["100 pixels","100% of the screen width","100% of parent","100 points"],ans:1},
{id:20,topic:"CSS",level:"medium",q:"Which property adds a scrollbar when content is too big?",opts:["scroll","overflow","extra","clip"],ans:1},
{id:21,topic:"CSS",level:"medium",q:"How do you select an element with id=\"box\"?",opts:[".box",".#box","#box","box"],ans:2},
{id:22,topic:"CSS",level:"medium",q:"How do you select an element with class=\"box\"?",opts:["#box",".box","box","*box"],ans:1},
// ---- hard ----
{id:23,topic:"CSS",level:"hard",q:"Which rule defines the stages of a CSS animation?",opts:["@frames","@keyframes","@animation","@steps"],ans:1},
{id:24,topic:"CSS",level:"hard",q:"In 'animation: mydata 5s linear 2;', what does 5s mean?",opts:["Delay","Total duration","Speed steps","Repeat count"],ans:1},
{id:25,topic:"CSS",level:"hard",q:"In 'animation: mydata 5s linear 2;', what does the 2 mean?",opts:["2 seconds delay","Run the animation 2 times","2 frames","2 pixels"],ans:1},
{id:26,topic:"CSS",level:"hard",q:"In @keyframes, what do 0% and 100% describe?",opts:["Only opacity","The start and end of the animation","Only width","The speed"],ans:1},
{id:27,topic:"CSS",level:"hard",q:"Which property gives a smooth change of a value over time?",opts:["animation","transition","keyframes","motion"],ans:1},
{id:28,topic:"CSS",level:"hard",q:"Which value of display makes a grid layout?",opts:["display: grid","display: table","display: box","grid: on"],ans:0},
{id:29,topic:"CSS",level:"hard",q:"What does width: calc(100% - 50px) do?",opts:["Error","Width = full width minus 50px","Width = 50px","Width = 100px"],ans:1},
{id:30,topic:"CSS",level:"hard",q:"What is the difference between padding and margin?",opts:["Same thing","padding = space inside, margin = space outside","padding = outside, margin = inside","Both are borders"],ans:1},
],

// ============================================================
// JS  — variables, arrow fn, DOM, events, fetch
// ============================================================
JS: [
// ---- easy ----
{id:1,topic:"JS",level:"easy",q:"Which keyword makes a value that cannot be changed again?",opts:["var","let","const","fix"],ans:2},
{id:2,topic:"JS",level:"easy",q:"Which keyword makes a normal changeable variable (modern)?",opts:["let","const","def","make"],ans:0},
{id:3,topic:"JS",level:"easy",q:"How do you print something to the console?",opts:["print()","echo()","console.log()","log.console()"],ans:2},
{id:4,topic:"JS",level:"easy",q:"How do you write a single-line comment in JavaScript?",opts:["# comment","// comment","<!-- comment -->","** comment"],ans:1},
{id:5,topic:"JS",level:"easy",q:"Which method finds an element using its id?",opts:["getElement()","document.getElementById()","findById()","getId()"],ans:1},
{id:6,topic:"JS",level:"easy",q:"Which symbol is used for an arrow function?",opts:["->","=>","::","~>"],ans:1},
{id:7,topic:"JS",level:"easy",q:"JavaScript code is written inside which HTML tag?",opts:["<js>","<script>","<code>","<style>"],ans:1},
{id:8,topic:"JS",level:"easy",q:"How do you write text (a string) in JavaScript?",opts:["only inside ( )","inside quotes like \"hi\"","inside < >","inside [ ]"],ans:1},
{id:9,topic:"JS",level:"easy",q:"What does console.error() do?",opts:["Stops the page","Prints an error message in the console","Deletes code","Reloads the page"],ans:1},
// ---- medium ----
{id:10,topic:"JS",level:"medium",q:"Which property sets or changes the HTML inside an element?",opts:["innerText only","innerHTML","value","html()"],ans:1},
{id:11,topic:"JS",level:"medium",q:"Which method runs code when a button is clicked (modern way)?",opts:["addEventListener","onpress","runClick","clickAdd"],ans:0},
{id:12,topic:"JS",level:"medium",q:"Which attribute calls a function when an element is clicked?",opts:["onhover","onclick","onpush","ontap"],ans:1},
{id:13,topic:"JS",level:"medium",q:"Which function is used to get data from a web API?",opts:["get()","fetch()","load()","ajax()"],ans:1},
{id:14,topic:"JS",level:"medium",q:"After fetch(), which method is used to handle the result?",opts:[".then()",".next()",".after()",".done()"],ans:0},
{id:15,topic:"JS",level:"medium",q:"Which method handles an error in a fetch call?",opts:[".error()",".catch()",".fail()",".try()"],ans:1},
{id:16,topic:"JS",level:"medium",q:"In fetch, response.text() is used to ...",opts:["delete the response","read the response as text","send text","clear text"],ans:1},
{id:17,topic:"JS",level:"medium",q:"In requestOptions, method: \"GET\" means we want to ...",opts:["send/create data","get/read data","delete data","update data"],ans:1},
{id:18,topic:"JS",level:"medium",q:"What is a correct empty arrow function?",opts:["() => {}","=> () {}","function => {}","() -> {}"],ans:0},
{id:19,topic:"JS",level:"medium",q:"Which line correctly makes a constant?",opts:["const x = 5;","constant x = 5;","let const x = 5;","x := 5;"],ans:0},
// ---- hard ----
{id:20,topic:"JS",level:"hard",q:"What happens if you try to change a const value?",opts:["It changes silently","It gives an error","It becomes 0","It becomes let"],ans:1},
{id:21,topic:"JS",level:"hard",q:"In fetch().then().then(), why are there two .then()?",opts:["A mistake","First reads the response, second uses the result","Both do the same","One is for errors"],ans:1},
{id:22,topic:"JS",level:"hard",q:"document.getElementById(\"msg\").innerHTML = \"Hi\" will ...",opts:["delete the element","put 'Hi' inside the element with id msg","rename the id","hide the element"],ans:1},
{id:23,topic:"JS",level:"hard",q:"Which is the correct order to get data from an API?",opts:["fetch then catch then then","fetch then then then catch","then then fetch then catch","catch then fetch then then"],ans:1},
{id:24,topic:"JS",level:"hard",q:"What is the main difference between let and const?",opts:["No difference","let can be changed later, const cannot","const is older","let cannot be changed"],ans:1},
{id:25,topic:"JS",level:"hard",q:"What does addEventListener(\"click\", fn) do?",opts:["Clicks the button once","Runs fn every time the element is clicked","Removes the button","Hides fn"],ans:1},
],

// ============================================================
// PYTHON  — biggest section (basics -> functions -> file -> OOP)
// ============================================================
PY: [
// ---- easy: output, input, types, operators ----
{id:1,topic:"PY",level:"easy",q:"Which function shows output on the screen?",opts:["echo()","print()","show()","display()"],ans:1},
{id:2,topic:"PY",level:"easy",q:"Which function takes input from the user?",opts:["input()","scan()","read()","get()"],ans:0},
{id:3,topic:"PY",level:"easy",q:"input() always returns the value as which type?",opts:["int","string","float","bool"],ans:1},
{id:4,topic:"PY",level:"easy",q:"How do you change user input into a whole number?",opts:["str(input())","int(input())","num(input())","float(input())"],ans:1},
{id:5,topic:"PY",level:"easy",q:"Which symbol starts a comment in Python?",opts:["//","#","--","/*"],ans:1},
{id:6,topic:"PY",level:"easy",q:"What is the data type of 10 ?",opts:["str","int","float","bool"],ans:1},
{id:7,topic:"PY",level:"easy",q:"What is the data type of \"hello\" ?",opts:["int","str","char","text"],ans:1},
{id:8,topic:"PY",level:"easy",q:"What is the data type of 3.14 ?",opts:["int","float","double","decimal"],ans:1},
{id:9,topic:"PY",level:"easy",q:"What is the data type of True ?",opts:["int","bool","str","yes"],ans:1},
{id:10,topic:"PY",level:"easy",q:"Which operator gives the remainder of a division?",opts:["/","//","%","**"],ans:2},
{id:11,topic:"PY",level:"easy",q:"Which operator is used for power (exponent)?",opts:["^","**","//","pow"],ans:1},
{id:12,topic:"PY",level:"easy",q:"What does // do?",opts:["Normal divide","Floor (whole number) divide","Comment","Multiply"],ans:1},
{id:13,topic:"PY",level:"easy",q:"How do you print using an f-string with a variable name?",opts:["print(\"Hello name\")","print(f\"Hello {name}\")","print(Hello + name)","print(f Hello name)"],ans:1},
{id:14,topic:"PY",level:"easy",q:"Which function gives the length of a list or string?",opts:["size()","len()","count()","length()"],ans:1},
{id:15,topic:"PY",level:"easy",q:"Which function tells the data type of a value?",opts:["typeof()","type()","datatype()","kind()"],ans:1},
{id:16,topic:"PY",level:"easy",q:"How do you make a variable named age with value 25?",opts:["age = 25","int age = 25","age := 25","var age = 25"],ans:0},
{id:17,topic:"PY",level:"easy",q:"Which keyword is used to check a condition?",opts:["check","if","when","cond"],ans:1},
{id:18,topic:"PY",level:"easy",q:"In Python, blocks of code are grouped using ...",opts:["{ }","indentation (spaces)","( )","; ;"],ans:1},
{id:19,topic:"PY",level:"easy",q:"What must come at the end of an if statement line?",opts:["; (semicolon)",": (colon)",". (dot)","nothing"],ans:1},
// ---- easy: loops/conditions ----
{id:20,topic:"PY",level:"easy",q:"Which keyword runs a block only when the if is false?",opts:["elseif","else","other","not"],ans:1},
{id:21,topic:"PY",level:"easy",q:"Which keyword checks another condition after if?",opts:["elif","elseif","elsif","also"],ans:0},
{id:22,topic:"PY",level:"easy",q:"Which loop repeats while a condition is true?",opts:["for","while","loop","repeat"],ans:1},
{id:23,topic:"PY",level:"easy",q:"Which keyword stops a loop completely?",opts:["stop","break","end","exit"],ans:1},
{id:24,topic:"PY",level:"easy",q:"Which keyword skips the rest and goes to the next loop turn?",opts:["skip","continue","next","pass"],ans:1},
{id:25,topic:"PY",level:"easy",q:"Which function is commonly used with a for loop to repeat numbers?",opts:["range()","loop()","count()","seq()"],ans:0},
// ---- medium: functions ----
{id:26,topic:"PY",level:"medium",q:"Which keyword is used to define a function?",opts:["function","def","func","define"],ans:1},
{id:27,topic:"PY",level:"medium",q:"Which keyword sends a value back from a function?",opts:["send","return","give","output"],ans:1},
{id:28,topic:"PY",level:"medium",q:"In def square(num): return num*num — what is num?",opts:["A return value","A parameter (input)","A loop","A class"],ans:1},
{id:29,topic:"PY",level:"medium",q:"What does *numbers (one star) collect in a function?",opts:["Keyword arguments","Many positional arguments as a tuple","A single number","Nothing"],ans:1},
{id:30,topic:"PY",level:"medium",q:"What does **kwargs (two stars) collect?",opts:["Many keyword arguments","A list","One value","All loops"],ans:0},
{id:31,topic:"PY",level:"medium",q:"In employee(id=None, name=None), id=None is a ...",opts:["keyword-only call","default argument","return value","global variable"],ans:1},
{id:32,topic:"PY",level:"medium",q:"Calling employee(id=101, name=\"user1\") uses which kind of arguments?",opts:["positional","keyword arguments","variable length","no arguments"],ans:1},
{id:33,topic:"PY",level:"medium",q:"What is a lambda in Python?",opts:["A loop","A small one-line function","A class","A list"],ans:1},
{id:34,topic:"PY",level:"medium",q:"What does this lambda do: lambda x : x*x ?",opts:["Adds x","Returns the square of x","Prints x","Divides x"],ans:1},
{id:35,topic:"PY",level:"medium",q:"What does map(lambda x: x*x, numbers) do?",opts:["Sorts numbers","Applies the function to each item","Deletes items","Adds all items"],ans:1},
{id:36,topic:"PY",level:"medium",q:"What is recursion?",opts:["A loop keyword","A function that calls itself","A type of list","An error"],ans:1},
{id:37,topic:"PY",level:"medium",q:"In a recursive function, what stops it from running forever?",opts:["A break","A base (stopping) condition","A loop","A print"],ans:1},
// ---- medium: lists/dict/tuple/set ----
{id:38,topic:"PY",level:"medium",q:"How do you make a list?",opts:["( )","[ ]","{ }","< >"],ans:1},
{id:39,topic:"PY",level:"medium",q:"Which method adds an item at the end of a list?",opts:["add()","append()","insert()","push()"],ans:1},
{id:40,topic:"PY",level:"medium",q:"What is the index of the first item in a list?",opts:["1","0","-1","first"],ans:1},
{id:41,topic:"PY",level:"medium",q:"Which data type cannot be changed (immutable)?",opts:["list","tuple","dict","set"],ans:1},
{id:42,topic:"PY",level:"medium",q:"A dictionary stores data as ...",opts:["only values","key and value pairs","only keys","numbers only"],ans:1},
{id:43,topic:"PY",level:"medium",q:"Which data type keeps only unique values?",opts:["list","set","tuple","string"],ans:1},
{id:44,topic:"PY",level:"medium",q:"What does [x*x for x in marks] create?",opts:["A function","A new list of squares","A dictionary","A tuple"],ans:1},
{id:45,topic:"PY",level:"medium",q:"Which is the correct list comprehension to square each item?",opts:["[x*x for x in marks]","(x*x in marks)","for x in marks: x*x","{x*x: marks}"],ans:0},
// ---- medium: file handling / random ----
{id:46,topic:"PY",level:"medium",q:"Which block is used to handle errors?",opts:["try-except","do-catch","check-error","if-error"],ans:0},
{id:47,topic:"PY",level:"medium",q:"open(\"abc.txt\", \"w\") opens the file for ...",opts:["reading","writing","appending only","deleting"],ans:1},
{id:48,topic:"PY",level:"medium",q:"Which mode opens a file for reading?",opts:["\"w\"","\"r\"","\"a\"","\"x\""],ans:1},
{id:49,topic:"PY",level:"medium",q:"Which method writes text into an open file?",opts:["file.put()","file.write()","file.add()","file.save()"],ans:1},
{id:50,topic:"PY",level:"medium",q:"Why do we call file.close()?",opts:["To delete the file","To save and free the file","To open it again","To read it"],ans:1},
{id:51,topic:"PY",level:"medium",q:"What is the benefit of 'with open(...) as file:' ?",opts:["It runs faster","It closes the file automatically","It deletes the file","It needs no path"],ans:1},
{id:52,topic:"PY",level:"medium",q:"Which line is needed before using random.randint()?",opts:["include random","import random","use random","random.start()"],ans:1},
{id:53,topic:"PY",level:"medium",q:"What does random.randint(1, 10) return?",opts:["A float from 1 to 10","A whole number from 1 to 10","Always 1","A list"],ans:1},
{id:54,topic:"PY",level:"medium",q:"file.write() needs its data to be in which form?",opts:["a number","a string (text)","a list","a dict"],ans:1},
// ---- hard: OOP ----
{id:55,topic:"PY",level:"hard",q:"Which keyword is used to make a class?",opts:["object","class","def","struct"],ans:1},
{id:56,topic:"PY",level:"hard",q:"Which method is the constructor of a class?",opts:["__start__","__init__","__main__","create()"],ans:1},
{id:57,topic:"PY",level:"hard",q:"What does 'self' mean inside a class?",opts:["The class name","The current object","A global variable","A loop"],ans:1},
{id:58,topic:"PY",level:"hard",q:"In 'mi = Mobile(\"MI\", \"8GB\")', what is mi?",opts:["A class","An object of Mobile","A function","A list"],ans:1},
{id:59,topic:"PY",level:"hard",q:"Writing self.__brand (two underscores) makes the attribute ...",opts:["public","private","global","a method"],ans:1},
{id:60,topic:"PY",level:"hard",q:"A method like get_brand() that returns a value is called a ...",opts:["setter","getter","constructor","loop"],ans:1},
{id:61,topic:"PY",level:"hard",q:"A method like set_brand(value) that changes a value is called a ...",opts:["getter","setter","constructor","destructor"],ans:1},
// ---- hard: output prediction ----
{id:62,topic:"PY",level:"hard",q:"What is the output of: print(2 ** 3) ?",opts:["6","8","9","5"],ans:1},
{id:63,topic:"PY",level:"hard",q:"What is the output of: print(10 % 3) ?",opts:["3","1","0","3.33"],ans:1},
{id:64,topic:"PY",level:"hard",q:"What is the output of: print(7 // 2) ?",opts:["3.5","3","4","2"],ans:1},
{id:65,topic:"PY",level:"hard",q:"What does range(1, 5) give in a for loop?",opts:["1 2 3 4 5","1 2 3 4","0 1 2 3 4","2 3 4 5"],ans:1},
{id:66,topic:"PY",level:"hard",q:"Output of: square = [x*x for x in [1,2,3]] ; print(square)",opts:["[1, 2, 3]","[1, 4, 9]","[2, 4, 6]","[1, 8, 27]"],ans:1},
{id:67,topic:"PY",level:"hard",q:"def sum(*n) adds all numbers. What does sum(10, 20, 30) return?",opts:["102030","60","10","30"],ans:1},
{id:68,topic:"PY",level:"hard",q:"Recursion: sum(num)=num+sum(num-1), base sum(1)=1. What is sum(5)?",opts:["5","15","10","120"],ans:1},
{id:69,topic:"PY",level:"hard",q:"What is the output of: print(\"5\" + \"5\") ?",opts:["10","55","Error","25"],ans:1},
{id:70,topic:"PY",level:"hard",q:"What is the output of: for i in range(3): print(i)",opts:["1 2 3","0 1 2","0 1 2 3","1 2"],ans:1},
],

};

// quick load log (helps confirm in browser console)
try {
    console.log("[pool] loaded:",
        "HTML=" + POOL.HTML.length, "CSS=" + POOL.CSS.length,
        "JS=" + POOL.JS.length, "PY=" + POOL.PY.length,
        "TOTAL=" + (POOL.HTML.length + POOL.CSS.length + POOL.JS.length + POOL.PY.length));
} catch (e) {}
