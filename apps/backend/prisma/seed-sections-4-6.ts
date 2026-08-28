/* eslint-disable no-console */

// ============================================================================
// SECTION 4: SPEED & FLUENCY (Levels 61-85) — 25 lessons
// ============================================================================
const section4Contents = [
  'the and that have for with this from they will would about there which their',
  'tion ing ent ion ally ment ous est ive able ance ence ical ation tial',
  'The wind moved through the trees and the lake turned to silver. We laughed and kept walking.',
  'Markets rose on strong earnings. A new bridge opened today. Scientists reported a key finding.',
  '"Go now!" she said. "Wait for me," he replied. "Why?" "Because we are late," she answered.',
  'Built for speed. Designed for focus. Try it free for thirty days. Cancel anytime. Join thousands today.',
  'api_key base_url retry_limit timeout_ms cache_ttl log_level feature_flag webhook_url',
  'They shipped the feature on Friday and watched the graphs climb. By Monday the bug was found, fixed, and forgotten, and the team went back to building the next small, useful thing.',
  'Order #4821 shipped to zone B2. Token abc-9f3 expired at 12:00. Status: delivered, signature OK.',
  'Speed follows accuracy the way rivers follow gravity: quietly, then all at once. Type the line as it comes, let the mistakes fall away, and trust the rhythm you have earned through patient, daily practice.',
  'over time the hands learn the board and the eyes stop chasing the keys',
  'daily practice builds muscle memory faster than occasional long sessions ever will',
  'the market closed higher after a steady morning of cautious trading and light volume',
  'error rate fell from twelve percent to three in a single quarter after the new checks',
  'read the prompt carefully, keep a steady pace, and let corrections stay calm and small',
  'the server restarted at dawn, logs rotated cleanly, and the dashboard stayed green',
  'a short walk and a glass of water often do more for focus than another cup of coffee',
  'the quick brown fox still jumps, but now it does so with consistent rhythm and control',
  'client requests arrive in bursts; the queue absorbs them and the workers drain it steadily',
  'notes from the meeting: ship the fix, update the docs, and tell the customer first',
  'use the home row as an anchor and let the fingers return there after every reach',
  'the city at night hums with light and the typing room hums with quiet, even keystrokes',
  'version two launched on schedule with fewer bugs and a noticeably faster startup time',
  'when the pressure rises, slow down by five percent and watch accuracy return',
  'the email subject was clear, the body was short, and the reply came within the hour',
];

// ============================================================================
// SECTION 5: MASTERY (Levels 86-110) — 25 lessons
// ============================================================================
const section5Contents = [
  'Caches store recent results so repeated requests return faster. A miss forces the slower path; a hit spares it. Size, eviction policy, and invalidation rules decide whether the cache helps or quietly hurts.',
  'First, create a project folder. Next, install the dependencies. Then run the dev server and open the local URL. You should see a welcome page; if not, check the terminal for errors.',
  'Subject: Q3 plan. We will cut costs by ten percent, pause non-critical hires, and ship the mobile beta. Risks: vendor delay and regression in checkout. Owner: platform team.',
  'The lighthouse keeper counted the ships by the sound of their horns. Fog wrapped the cliff, and the lamp turned once, twice, throwing a weak gold coin of light across the water before the dark took it back.',
  'The service must accept JSON, validate the schema, and reject unknown fields. Latency p95 must stay under 200ms. On failure it returns a structured error with a stable code and a safe message.',
  'We should invest now, not later. The cost of waiting is compound, and the upside of early action is durable. Critics exaggerate the risk; the data, read honestly, points the other way.',
  'Photosynthesis turns light, water, and carbon dioxide into sugar and oxygen. Leaves are the factory; chlorophyll is the panel. Without it, almost every food chain on Earth would stall.',
  'Mastery is not the absence of error but the speed of recovery: you notice the slip, correct it without panic, and continue. The page fills, the rhythm holds, and the work that once felt impossible becomes merely the thing you do before lunch.',
  'The proposal passed after a long debate that left everyone tired but surprisingly optimistic about the next quarter.',
  'Economists noted that small, steady gains compound while sudden spikes often reverse within days.',
  'The library downtown reopened with new shelves, better light, and a quiet room that actually stays quiet.',
  'A good apology names what went wrong, explains how it will be fixed, and makes the fix visible quickly.',
  'The contract required three signatures, a notary, and a single-page appendix that no one could quite explain.',
  'She kept a notebook by the keyboard and wrote down every word that still felt awkward to type.',
  'The mountain trail was steeper than the map suggested, but the view from the ridge was worth the climb.',
  'Reliability comes from removing surprises: fewer flags, smaller changes, and tests that run in seconds.',
  'The museum guide spoke slowly, paused at each painting, and let the group ask questions before moving on.',
  'They measured progress not by lines of code but by the number of support tickets that stopped arriving.',
  'The winter storm knocked out power for hours, yet the team kept the service warm on backup generators.',
  'Write the draft, leave it overnight, and edit with fresh eyes; the clumsy sentences will stand out on their own.',
  'Negotiation works best when both sides state what they need rather than what they demand.',
  'The report was concise, honest about the gaps, and clear about the two decisions that actually mattered.',
  'A steady routine beats heroic effort: fifteen minutes a day will carry you further than a weekend marathon.',
  'The second draft was shorter, clearer, and notably kinder to the reader than the first had been.',
  'Typing at your limit is not the goal; typing comfortably below it, for a long time, is.',
];

// ============================================================================
// SECTION 6: PROGRAMMING (Levels 111-120) — 25 lessons, language-agnostic code
// ============================================================================
const section6Contents = [
  'count = 0\nname = "ada"\nratio = 3.14\nitems = [1, 2, 3]\nactive = True',
  'if score > 90:\n    print("great")\nelse:\n    print("retry")\n\nfor i in range(5):\n    total += i',
  'def add(a, b):\n    return a + b\n\nresult = add(2, 3)\nprint(result)',
  'user = {"id": 1, "name": "sam"}\nkeys = user.keys()\nvals = [v for v in user.values()]\nqueue = []\nqueue.append(user)',
  'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))',
  'for item in items:\n    if item % 2 == 0:\n        print(item)',
  'try:\n    data = open("file.txt").read()\nexcept FileNotFoundError:\n    print("missing")',
  'import math\nprint(math.sqrt(16))\nprint(math.pi)',
  'class Dog:\n    def __init__(self, name):\n        self.name = name\n    def bark(self):\n        return f"{self.name}!"',
  'lst = [x*2 for x in range(10) if x % 2 == 0]\nprint(lst)',
  'import json\ndata = json.dumps({"a": 1, "b": 2})\nprint(data)',
  'nums = [1, 2, 3, 4, 5]\navg = sum(nums) / len(nums)\nprint(f"avg={avg:.2f}")',
  'text = "hello world"\nprint(text.upper())\nprint(text.split())',
  'd = {"a": 1}\nd["b"] = 2\nprint(list(d.keys()))',
  'with open("out.txt", "w") as f:\n    f.write("hello")',
  'import re\nm = re.findall(r"\\d+", "a1b22")\nprint(m)',
  'from datetime import datetime\nprint(datetime.now().isoformat())',
  'arr = [3, 1, 4, 1, 5]\narr.sort()\nprint(arr)',
  'def greet(name="world"):\n    return f"hi {name}"\nprint(greet())',
  'a, b = 1, 2\na, b = b, a + b\nprint(a, b)',
  'if x and y or not z:\n    print("logic")',
  's = {1, 2, 3}\ns.add(4)\nprint(s)',
  't = (1, 2)\nx, y = t\nprint(x + y)',
  'hex(255)\nbin(10)\noct(8)\nprint("done")',
  'str.isnumeric("123")\nstr.isalpha("abc")',
];

// Export raw arrays for use in seed.ts with makeLessons
export { section4Contents, section5Contents, section6Contents };