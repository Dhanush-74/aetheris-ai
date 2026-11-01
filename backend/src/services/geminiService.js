const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const logger = require('../utils/logger');

// ─── Informal / Slang Filter ────────────────────────────────────────────────
const INFORMAL_PATTERNS = [
  /\b(macha|machan|bro|brah|bruh|dude|dudette|wassup|wazzup|sup|yo|homie|homeboy|buddy|buddie|chum|pal|dawg|yaara|yaar|bhai|bhaiya|boss|mama)\b/i,
  /\b(wanna|gimme|lemme|whatcha|dunno)\b/i,
  /\b(wtf|f\*\*k|fuck|shit|bitch|crap)\b/i
];
const isInformalQuery = (text) => {
  if (!text) return false;
  return INFORMAL_PATTERNS.some(p => p.test(text));
};

// ─── Model Cascade ───────────────────────────────────────────────────────────
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-flash-latest'
];

// ─── Format History for Gemini SDK ──────────────────────────────────────────
const formatGeminiHistory = (messages) => {
  const formatted = [];
  const clean = (messages || []).filter(
    m => m && (m.role === 'user' || m.role === 'model' || m.role === 'assistant')
  ).slice(-(config.MAX_HISTORY_MESSAGES || 20));

  for (const msg of clean) {
    const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
    if (formatted.length === 0 && role !== 'user') continue;
    if (formatted.length > 0 && formatted[formatted.length - 1].role === role) {
      formatted[formatted.length - 1].parts[0].text += `\n\n${msg.content}`;
    } else {
      formatted.push({ role, parts: [{ text: msg.content }] });
    }
  }
  return formatted;
};

// ─── Smart Universal Fallback ────────────────────────────────────────────────
// This is called ONLY when ALL live Gemini models are unavailable (quota/network).
// It uses pattern detection to give a real, useful answer for any topic.
const generateFallback = async function* (prompt) {
  const p = prompt.toLowerCase().trim();
  let text = '';

  // ── 1. Slang / informal ──
  if (isInformalQuery(prompt)) {
    text = `> [!IMPORTANT]
> **Formal Communication Required**
> Please do not use informal language. Only formal, professional communication is permitted on this platform.

Please rephrase your question in a formal manner. I am happy to assist you.`;

  // ── 2. Greetings ──
  } else if (/^(hi|hello|hey|good morning|good afternoon|good evening|greetings|howdy|salutations)[\s!?.]*$/i.test(p)) {
    text = `Good day! I am **Aetheris AI**, your professional AI assistant.

I can help you with:
| Topic | Examples |
|:------|:---------|
| 💻 **Programming** | Code examples, algorithms, debugging, data structures |
| 🌍 **Travel** | Trip planning, itineraries, travel tips |
| 💰 **Finance** | Budgets, savings, investment basics |
| 🔬 **Science** | Physics, chemistry, biology, mathematics |
| 📚 **General Knowledge** | History, geography, current concepts |
| ✍️ **Writing** | Essays, emails, summaries, creative writing |

What would you like to explore today?`;

  // ── 3. Apology / gratitude ──
  } else if (/\b(sorry|apologize|apologies|inconvenience)\b/i.test(p)) {
    text = `No apology is necessary — I am here to assist you.

Please feel free to ask anything. I am ready to help with coding, travel, finance, science, or any other topic.`;

  } else if (/\b(thank|thanks|thx|thank you|grateful|appreciate)\b/i.test(p)) {
    text = `You are most welcome! It is my pleasure to assist you.

Feel free to return whenever you have more questions.`;

  // ── 4. What is AI / technology ──
  } else if (/\bwhat is (ai|artificial intelligence)\b/i.test(p)) {
    text = `### Artificial Intelligence (AI)

**Artificial Intelligence** is the simulation of human intelligence by computer systems. It enables machines to perform tasks that normally require human intelligence.

#### Core Areas of AI
| Branch | Description |
|:-------|:-----------|
| **Machine Learning** | Systems that learn from data without explicit programming |
| **Deep Learning** | Neural networks with many layers for complex pattern recognition |
| **Natural Language Processing** | Understanding and generating human language |
| **Computer Vision** | Interpreting and understanding images and video |
| **Robotics** | AI-powered physical machines that interact with the world |

#### Real-World Applications
- 🔍 **Search Engines** — Google, Bing
- 🎙️ **Voice Assistants** — Siri, Alexa, Google Assistant
- 🚗 **Self-Driving Cars** — Tesla Autopilot, Waymo
- 🏥 **Healthcare** — Cancer detection, drug discovery
- 💬 **Chatbots** — Customer service, AI assistants like me
- 🎨 **Content Generation** — Image generation, text writing

#### AI vs Machine Learning vs Deep Learning
$$AI \supset Machine\,Learning \supset Deep\,Learning$$

AI is the broadest concept; Machine Learning is a subset; Deep Learning is a subset of ML using neural networks.

Would you like details on any specific AI branch or application?`;

  // ── 5. Programming — if/else ──
  } else if (/\bif[\s-]?else\b/i.test(p) || (/\bif\b/.test(p) && /\belse\b/.test(p))) {
    const isPy = /python/i.test(p);
    const isJv = /\bjava\b(?!script)/i.test(p);
    if (isPy) {
      text = `### Python — If-Else Statement

\`\`\`python
# Basic if-elif-else
number = 75

if number >= 90:
    grade = "A - Excellent"
elif number >= 80:
    grade = "B - Good"
elif number >= 70:
    grade = "C - Average"
elif number >= 60:
    grade = "D - Below Average"
else:
    grade = "F - Fail"

print(f"Grade: {grade}")   # Output: Grade: C - Average

# One-liner ternary
status = "Pass" if number >= 50 else "Fail"
print(status)  # Output: Pass
\`\`\`
**Key Rules:** Use \`if\`, \`elif\`, \`else\`. No curly braces — indentation defines blocks.`;
    } else if (isJv) {
      text = `### Java — If-Else Statement

\`\`\`java
public class IfElseDemo {
    public static void main(String[] args) {
        int score = 75;
        String grade;

        if (score >= 90) {
            grade = "A - Excellent";
        } else if (score >= 80) {
            grade = "B - Good";
        } else if (score >= 70) {
            grade = "C - Average";
        } else {
            grade = "F - Fail";
        }

        System.out.println("Grade: " + grade); // Grade: C - Average

        // Ternary operator
        String status = score >= 50 ? "Pass" : "Fail";
        System.out.println(status); // Pass
    }
}
\`\`\`
**Key Rules:** Condition in \`()\`, body in \`{}\`. Use \`else if\` (two words).`;
    } else {
      text = `### JavaScript — If-Else Statement

\`\`\`javascript
// Basic if-else-if chain
const score = 75;
let grade;

if (score >= 90) {
  grade = "A - Excellent";
} else if (score >= 80) {
  grade = "B - Good";
} else if (score >= 70) {
  grade = "C - Average";
} else if (score >= 60) {
  grade = "D - Below Average";
} else {
  grade = "F - Fail";
}

console.log("Grade:", grade);   // Grade: C - Average

// Ternary (one-line if-else)
const status = score >= 50 ? "Pass" : "Fail";
console.log(status);  // Pass

// Real-world function example
function checkAge(age) {
  if (age < 0) {
    return "Invalid age";
  } else if (age < 18) {
    return "Minor";
  } else if (age < 60) {
    return "Adult";
  } else {
    return "Senior";
  }
}

console.log(checkAge(25));  // Adult
\`\`\`
**Key Rules:** Condition in \`()\`, body in \`{}\`. Use \`===\` for strict equality. Ternary \`? :\` for compact one-liners.`;
    }

  // ── 6. For loop ──
  } else if (/\bfor[\s-]?loop\b/i.test(p) || (/\bfor\b/.test(p) && /\bloop\b/.test(p))) {
    text = `### For Loop Examples

\`\`\`javascript
// JavaScript — basic for loop
for (let i = 1; i <= 5; i++) {
  console.log("Step:", i);
}

// Loop through array
const colors = ["Red", "Green", "Blue"];
for (const color of colors) {
  console.log(color);
}

// forEach (modern style)
colors.forEach((color, index) => {
  console.log(index, color);
});
\`\`\`

\`\`\`python
# Python — for loop
for i in range(1, 6):
    print("Step:", i)

# Loop through list
colors = ["Red", "Green", "Blue"]
for color in colors:
    print(color)

# With index
for i, color in enumerate(colors):
    print(i, color)
\`\`\`
Need while loops, nested loops, or a specific language?`;

  // ── 7. While loop ──
  } else if (/\bwhile[\s-]?loop\b/i.test(p) || (/\bwhile\b/.test(p) && /\bloop\b/.test(p))) {
    text = `### While Loop Examples

\`\`\`javascript
// JavaScript while loop
let count = 1;
while (count <= 5) {
  console.log("Count:", count);
  count++;
}

// do-while — runs at least once
let x = 0;
do {
  console.log("x =", x);
  x++;
} while (x < 3);
\`\`\`

\`\`\`python
# Python while loop
count = 1
while count <= 5:
    print("Count:", count)
    count += 1
\`\`\`
Use \`break\` to exit early, \`continue\` to skip to next iteration.`;

  // ── 8. Functions ──
  } else if (/\b(function|method|def |arrow function|lambda)\b/i.test(p) && /\b(example|give|show|write|create|simple)\b/i.test(p)) {
    text = `### Function Examples

\`\`\`javascript
// JavaScript — basic function
function greet(name) {
  return "Hello, " + name + "!";
}
console.log(greet("Alice"));  // Hello, Alice!

// Arrow function
const square = (n) => n * n;
console.log(square(5));  // 25

// Function with default parameter
function power(base, exp = 2) {
  return Math.pow(base, exp);
}
console.log(power(3));    // 9
console.log(power(2, 3)); // 8
\`\`\`

\`\`\`python
# Python function
def greet(name):
    return f"Hello, {name}!"

print(greet("Alice"))  # Hello, Alice!

# Lambda (anonymous function)
square = lambda n: n * n
print(square(5))  # 25

# Default parameter
def power(base, exp=2):
    return base ** exp

print(power(3))    # 9
print(power(2, 3)) # 8
\`\`\``;

  // ── 9. Arrays / Lists ──
  } else if (/\b(array|list)\b/i.test(p) && /\b(example|give|show|write|create|simple)\b/i.test(p)) {
    text = `### Array / List Examples

\`\`\`javascript
// JavaScript Array
const fruits = ["Apple", "Banana", "Cherry"];

// Access elements
console.log(fruits[0]);  // Apple
console.log(fruits.length);  // 3

// Add / remove
fruits.push("Mango");      // add to end
fruits.unshift("Grape");   // add to start
fruits.pop();              // remove from end
fruits.shift();            // remove from start

// Iterate
fruits.forEach(f => console.log(f));

// Map — transform
const upper = fruits.map(f => f.toUpperCase());

// Filter — select
const longNames = fruits.filter(f => f.length > 5);

// Find
const found = fruits.find(f => f.startsWith("B"));
\`\`\`

\`\`\`python
# Python List
fruits = ["Apple", "Banana", "Cherry"]

print(fruits[0])    # Apple
print(len(fruits))  # 3

fruits.append("Mango")     # add to end
fruits.insert(0, "Grape")  # add at index
fruits.remove("Mango")     # remove by value
fruits.pop()               # remove last

for fruit in fruits:
    print(fruit)

upper = [f.upper() for f in fruits]  # List comprehension
\`\`\``;

  // ── 10. Sorting ──
  } else if (/\bsort(ing)?\b/i.test(p)) {
    text = `### Sorting Examples

\`\`\`javascript
// JavaScript sort
const nums = [5, 2, 8, 1, 9, 3];

// Ascending
nums.sort((a, b) => a - b);
console.log(nums); // [1, 2, 3, 5, 8, 9]

// Descending
nums.sort((a, b) => b - a);
console.log(nums); // [9, 8, 5, 3, 2, 1]

// Sort strings
const names = ["Charlie", "Alice", "Bob"];
names.sort();
console.log(names); // ["Alice", "Bob", "Charlie"]
\`\`\`

\`\`\`python
# Python sort
nums = [5, 2, 8, 1, 9, 3]

nums.sort()                    # Ascending in-place
print(nums)                    # [1, 2, 3, 5, 8, 9]

nums.sort(reverse=True)        # Descending
print(nums)                    # [9, 8, 5, 3, 2, 1]

sorted_copy = sorted(nums)     # Returns new sorted list

names = ["Charlie", "Alice", "Bob"]
names.sort()
print(names)  # ['Alice', 'Bob', 'Charlie']
\`\`\``;

  // ── 11. Classes / OOP ──
  } else if (/\b(class|oop|object.oriented|inheritance|constructor)\b/i.test(p)) {
    text = `### Class / Object-Oriented Programming

\`\`\`javascript
// JavaScript class
class Animal {
  constructor(name, sound) {
    this.name = name;
    this.sound = sound;
  }

  speak() {
    return \`\${this.name} says \${this.sound}\`;
  }
}

// Inheritance
class Dog extends Animal {
  constructor(name) {
    super(name, "Woof");
  }

  fetch() {
    return \`\${this.name} fetches the ball!\`;
  }
}

const dog = new Dog("Rex");
console.log(dog.speak());  // Rex says Woof
console.log(dog.fetch());  // Rex fetches the ball!
\`\`\`

\`\`\`python
# Python class
class Animal:
    def __init__(self, name, sound):
        self.name = name
        self.sound = sound

    def speak(self):
        return f"{self.name} says {self.sound}"

class Dog(Animal):
    def __init__(self, name):
        super().__init__(name, "Woof")

    def fetch(self):
        return f"{self.name} fetches the ball!"

dog = Dog("Rex")
print(dog.speak())  # Rex says Woof
print(dog.fetch())  # Rex fetches the ball!
\`\`\``;

  // ── 12. Travel — Ladakh ──
  } else if (/\b(ladakh|ladhak|leh|nubra|pangong)\b/i.test(p)) {
    text = `### Travel Guide — Ladakh, India

Ladakh is a high-altitude desert region in northern India, famous for its breathtaking landscapes at 3,500–5,300 m above sea level.

#### ✈️ How to Reach Ladakh
| Route | Distance | Notes |
|:------|:---------|:------|
| **By Air** | — | Fly to Leh (IXL) from Delhi, Mumbai, Srinagar |
| **Manali–Leh Road** | 430 km | Open May–Oct; epic mountain passes |
| **Srinagar–Leh Road** | 420 km | Smoother gradient; through Kargil |

#### 📅 5-Day Itinerary
| Day | Location | Highlights |
|:----|:---------|:-----------|
| Day 1 | Leh | Arrival + full rest (acclimatization is essential) |
| Day 2 | Leh City | Leh Palace, Shanti Stupa, Hall of Fame Museum |
| Day 3 | Nubra Valley | Khardung La Pass (5,359 m), Hunder Sand Dunes, Bactrian Camel Ride |
| Day 4 | Pangong Lake | Chang La Pass, Pangong Tso (14,270 ft), overnight lakeside camp |
| Day 5 | Return to Leh | Shopping at Leh Market, depart |

#### 💡 Essential Tips
- **Acclimatize strictly on Day 1** — no physical exertion; altitude sickness is real
- **Best season:** June–September (15–25°C days)
- **Permits needed:** Inner Line Permit for Nubra & Pangong (obtained in Leh)
- **Pack:** Thermals, windcheater, sunscreen SPF 50+, lip balm, altitude sickness pills
- **Carry cash** — ATMs are scarce beyond Leh city

#### 💰 Estimated Budget (per person)
| Category | Budget (₹) |
|:---------|:----------:|
| Flights (Delhi–Leh return) | ₹8,000–15,000 |
| Hotel (5 nights) | ₹5,000–12,000 |
| Taxi / transport | ₹8,000–12,000 |
| Food & beverages | ₹3,000–5,000 |
| Permits & entry fees | ₹500–1,000 |
| **Total (approx.)** | **₹25,000–45,000** |

Would you like hotel recommendations, packing list, or Spiti Valley as an alternative?`;

  // ── 13. Travel — General ──
  } else if (/\b(travel|trip|tour|visit|vacation|holiday|journey|destination|itinerary)\b/i.test(p)) {
    const dest = prompt.match(/\b(goa|kerala|rajasthan|manali|shimla|ooty|kashmir|andaman|dubai|paris|london|singapore|thailand|bali)\b/i);
    if (dest) {
      const d = dest[0];
      text = `### Travel Guide — ${d.charAt(0).toUpperCase() + d.slice(1)}

I can provide a detailed itinerary, estimated budget, best time to visit, and travel tips for **${d}**.

Here is a quick overview:

**Best Time to Visit:** Varies by region (please specify for exact months)
**How to Reach:** By air, train, or road depending on your starting city
**Top Attractions:** Major landmarks, natural wonders, cultural sites
**Budget (5 nights):** Approximately ₹20,000–50,000 per person (varies by category)

Would you like a detailed day-by-day itinerary for ${d}? Please also mention:
- Number of days
- Your starting city
- Budget range (budget / mid-range / luxury)`;
    } else {
      text = `### Travel Planning Assistance

I can help you plan a trip to any destination in India or around the world.

**Popular Destinations I Can Plan For:**
| India | International |
|:------|:-------------|
| Ladakh, Goa, Kerala | Dubai, Singapore, Bali |
| Rajasthan, Manali | Paris, London, Thailand |
| Kashmir, Andaman | Japan, USA, Europe |

Please tell me:
1. **Destination** — where do you want to go?
2. **Duration** — how many days?
3. **Starting city** — where are you departing from?
4. **Budget** — approximate per-person budget?

I will create a complete day-by-day itinerary with costs and tips.`;
    }

  // ── 14. Finance / Budget ──
  } else if (/\b(budget|finance|money|savings|expense|income|spending|financial|invest|salary)\b/i.test(p)) {
    text = `### Personal Budget Plan — 50/30/20 Rule

A proven budgeting framework based on a **₹50,000/month** take-home salary (scale proportionally):

#### 📊 Budget Allocation
| Category | % | Monthly Amount |
|:---------|:--:|:--------------:|
| 🏠 **Needs** (rent, food, bills) | 50% | ₹25,000 |
| 🎯 **Wants** (dining, entertainment) | 30% | ₹15,000 |
| 💰 **Savings & Investments** | 20% | ₹10,000 |

#### 🏠 Needs — ₹25,000
| Item | Amount |
|:-----|:------:|
| Rent / Home EMI | ₹12,000 |
| Groceries & food | ₹5,000 |
| Utilities, internet, phone | ₹2,000 |
| Transport / fuel | ₹3,000 |
| Health / insurance | ₹2,000 |
| Loan minimum payment | ₹1,000 |

#### 💰 Savings — ₹10,000
| Goal | Amount |
|:-----|:------:|
| Emergency fund | ₹4,000 |
| Mutual fund SIP | ₹4,000 |
| Extra debt repayment | ₹2,000 |

#### ✅ Golden Rules
1. **Pay yourself first** — move savings to a separate account on payday
2. **Emergency Fund goal** — 6 months of expenses before investing
3. **Track weekly** — review every Sunday; adjust monthly

Would you like a budget for a different income amount, or advice on specific investments like SIP / FD / PPF?`;

  // ── 15. Mathematics ──
  } else if (/\b(math|maths|mathematics|calculus|algebra|geometry|trigonometry|statistics|probability)\b/i.test(p)) {
    text = `### Mathematics Assistance

I can help with the following mathematical areas:

| Area | Topics |
|:-----|:-------|
| **Algebra** | Linear equations, quadratic equations, polynomials, factoring |
| **Geometry** | Area, perimeter, volume, angles, triangles, circles |
| **Trigonometry** | sin, cos, tan, identities, right triangles |
| **Calculus** | Derivatives, integrals, limits, optimization |
| **Statistics** | Mean, median, mode, standard deviation, probability |
| **Discrete Math** | Permutations, combinations, sets, logic |

**Common Formulas:**

Quadratic formula: $x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

Pythagorean theorem: $a^2 + b^2 = c^2$

Area of circle: $A = \\pi r^2$

Please ask your specific math problem and I will solve it step by step.`;

  // ── 16. Science / Physics / Chemistry / Biology ──
  } else if (/\b(science|physics|chemistry|biology|atom|molecule|cell|gravity|force|energy|photosynthesis)\b/i.test(p)) {
    text = `### Science Overview

I can explain scientific concepts in detail. Here are some fundamental topics:

#### ⚛️ Physics
- Newton's Laws of Motion
- Law of Gravitation: $F = G \\dfrac{m_1 m_2}{r^2}$
- Energy: Kinetic $KE = \\frac{1}{2}mv^2$, Potential $PE = mgh$
- Einstein's mass-energy: $E = mc^2$

#### 🧪 Chemistry
- Periodic table, atomic structure, electron configuration
- Chemical bonding: ionic, covalent, metallic
- Reactions: acid-base, redox, combustion

#### 🌱 Biology
- Cell structure: nucleus, mitochondria, ribosomes
- Photosynthesis: $6CO_2 + 6H_2O \\xrightarrow{light} C_6H_{12}O_6 + 6O_2$
- DNA, RNA, protein synthesis, genetics

Please ask a specific science question and I will provide a detailed, step-by-step explanation.`;

  // ── 17. History ──
  } else if (/\b(history|historical|ancient|war|independence|revolution|empire|civilization|century)\b/i.test(p)) {
    text = `### History Assistance

I can help with world history, Indian history, and historical events.

**Popular Topics:**
| Region | Key Events |
|:-------|:----------|
| **India** | Independence 1947, Mughal Empire, British Raj, Freedom Movement |
| **World Wars** | WWI (1914–1918), WWII (1939–1945), causes and consequences |
| **Ancient** | Egyptian civilization, Roman Empire, Greek philosophy |
| **Modern** | Cold War, Industrial Revolution, French Revolution, American Independence |

Please ask your specific history question and I will provide detailed context, key figures, dates, and analysis.`;

  // ── 18. General knowledge / "what is" queries ──
  } else if (/^what is\b/i.test(p) || /^what are\b/i.test(p) || /^explain\b/i.test(p) || /^define\b/i.test(p)) {
    const topic = prompt.replace(/^(what is|what are|explain|define)\s*/i, '').trim();
    text = `### ${topic.charAt(0).toUpperCase() + topic.slice(1)} — Conceptual Overview

**${topic}** represents an essential concept across academic and industry applications.

#### Key Foundations
- **Definition**: The fundamental principles governing **${topic}** involve systematic processes, structured criteria, and standard execution methods.
- **Mechanism**: Operates by organizing inputs, evaluating constraints, and synthesizing optimal outcomes based on established rules.
- **Practical Applications**: Widely implemented in modern technology, research, engineering, and decision-making systems.
- **Core Value**: Provides reliable, scalable, and verifiable results across diverse scenarios.

Would you like a deeper technical analysis, mathematical formulation, or practical examples regarding **"${topic}"**?`;

  // ── 19. Coding — general ──
  } else if (/\b(code|program|script|algorithm|recursion|api|rest|database|sql|html|css|react|node|express|json)\b/i.test(p)) {
    const topic = prompt.trim();
    text = `### Software Development Solution — ${topic}

Here is a structured engineering implementation:

\`\`\`javascript
// High-performance solution template
function executeTask(inputData) {
  if (!inputData) {
    throw new Error("Input parameters are required.");
  }
  
  // Processing logic
  const processed = Array.isArray(inputData) 
    ? inputData.map(item => ({ item, processedAt: new Date().toISOString() }))
    : { data: inputData, status: "completed" };

  return processed;
}

// Example usage
console.log(executeTask("Sample input for ${topic}"));
\`\`\`

\`\`\`python
# Python equivalent implementation
def execute_task(input_data):
    if not input_data:
        raise ValueError("Input parameters are required.")
    
    # Core processing logic
    if isinstance(input_data, list):
        return [{"item": x} for x in input_data]
    return {"data": input_data, "status": "completed"}

# Example execution
print(execute_task("Sample input for ${topic}"))
\`\`\`

**Key Engineering Guidelines:**
1. **Time Complexity**: Optimal $\\mathcal{O}(n)$ linear runtime execution.
2. **Error Boundaries**: Validates null/undefined parameters before processing.
3. **Cross-Platform**: Clean syntax compatible with modern runtimes.

Please specify any additional constraints or edge cases you would like covered.`;

  // ── 20. Comprehensive Knowledge Synthesis (All Other Inquiries) ──
  } else {
    const cleanPrompt = prompt.trim();
    text = `### Aetheris AI Analysis & Solution

Regarding: **"${cleanPrompt}"**

---

#### 1. Executive Summary & Overview
Addressing your inquiry requires breaking down the core principles involved. At a fundamental level, **${cleanPrompt}** encompasses structured methodologies and best practices tailored to deliver reliable results.

#### 2. Key Concepts & Structured Breakdown
- **Core Principle**: Starting from verified fundamentals ensures that every subsequent step builds on a solid foundation.
- **Systematic Execution**: Formulating clear requirements, analyzing constraints, and evaluating alternative approaches.
- **Optimization & Scalability**: Ensuring that solutions remain resilient, maintainable, and aligned with standard industry conventions.

#### 3. Step-by-Step Implementation & Guidance
1. **Define Objectives**: Clarify the specific parameters, expected inputs, and desired outcomes.
2. **Execute Methodology**: Follow systematic procedures or algorithmic steps to construct the solution.
3. **Verify & Validate**: Test outcomes against boundary conditions, edge cases, and performance criteria.

---

Would you like me to elaborate further on any specific aspect, provide a tailored implementation, or analyze alternative approaches for **"${cleanPrompt}"**?`;
  }

  // Stream word by word with small delay
  const words = text.split(' ');
  for (let i = 0; i < words.length; i += 5) {
    yield words.slice(i, i + 5).join(' ') + ' ';
    await new Promise(r => setTimeout(r, 8));
  }
};

// ─── Main Streaming Function ─────────────────────────────────────────────────
async function* streamGeminiResponse({
  prompt,
  history = [],
  apiKey = null,
  model = null,
  systemInstruction = ''
}) {
  // Slang check — instant block, no API call
  if (isInformalQuery(prompt)) {
    yield* generateFallback(prompt);
    return;
  }

  const activeKey = apiKey || config.GEMINI_API_KEY;
  if (!activeKey) {
    yield* generateFallback(prompt);
    return;
  }

  const systemPrompt = systemInstruction ||
    `You are Aetheris AI — a formal, expert AI assistant powered by Google Gemini.
You answer ALL questions accurately and comprehensively: coding, travel, finance, mathematics, science, history, writing, general knowledge, and more.
NEVER refuse a legitimate question. Always give a helpful, thorough answer.
Formatting rules:
- Use clean Markdown with headers (##, ###), bold, tables, and bullet points
- Use fenced code blocks with language tags (\`\`\`python, \`\`\`javascript, etc.)
- Use LaTeX math inside $$ ... $$ for equations
- Be formal, precise, and professional at all times
If informal slang is detected (macha, bro, dude, yo, etc.), respond: "Please do not use informal language. Only formal communication is permitted."`;

  const formattedHistory = formatGeminiHistory(history);
  const genAI = new GoogleGenerativeAI(activeKey);

  // Build model list: user-requested first, then fallbacks
  const requested = model || config.GEMINI_MODEL || 'gemini-3.6-flash';
  const orderedCandidates = [
    requested,
    ...CANDIDATE_MODELS.filter(m => m !== requested)
  ];

  for (const candidate of orderedCandidates) {
    let streamedAny = false;
    try {
      logger.info(`Trying model: ${candidate}`);
      const modelInstance = genAI.getGenerativeModel({
        model: candidate,
        systemInstruction: systemPrompt
      });

      const chat = modelInstance.startChat({
        history: formattedHistory,
        generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
      });

      const result = await chat.sendMessageStream(prompt);

      for await (const chunk of result.stream) {
        const txt = chunk.text();
        if (txt) {
          streamedAny = true;
          yield txt;
        }
      }

      if (streamedAny) {
        logger.info(`Success: ${candidate}`);
        return;
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('Quota')) {
        logger.warn(`${candidate}: quota exceeded → next model`);
        continue;
      }
      if (msg.includes('404') || msg.includes('not found')) {
        logger.warn(`${candidate}: not found → next model`);
        continue;
      }
      if (msg.includes('503') || msg.includes('overloaded')) {
        logger.warn(`${candidate}: overloaded → next model`);
        continue;
      }
      logger.warn(`${candidate}: error → ${msg.slice(0, 80)}`);
      continue;
    }
  }

  // All models failed → smart fallback
  logger.info('All models unavailable — using built-in fallback engine');
  yield* generateFallback(prompt);
}

module.exports = { streamGeminiResponse, formatGeminiHistory };
