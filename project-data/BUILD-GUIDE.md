# BUILD-GUIDE.md — AI Family Tutor

**Purpose of this file:** paste the relevant phase section into your editor (as a comment block above the file you're working on, or into Copilot Chat) before starting each phase. It gives Copilot the context it needs to suggest code that matches the actual design, instead of generic boilerplate. Update the "Status" line at the top of each phase as you go — this file is your `NEXT.md`-style handoff for this project.

**Current status:** Phase 0 — not started

---

## Global Context (keep this in mind across every phase)

- Local-first app. No cloud storage. Data lives in a single SQLite file on this Mac Mini.
- Two users: Child A (Year 3, Sept start), Child B (Reception, Sept start). Both defined as rows in the DB, never hardcoded into logic.
- Gemini API: **paid tier only**. Safety settings set to strictest available level in every call.
- Mastery tracking uses a Leitner-box style model (see Phase 1 spec below) — not a vague "score."
- Question generation: seed bank first, Gemini paraphrases/varies — Gemini does not invent maths facts or phonics sequencing from scratch.
- Every phase ends in something that actually runs end-to-end, not partial scaffolding.
- Mentor checkpoint: if you're about to build something not in the current phase's scope, stop and check BUILD-GUIDE.md before continuing.

---

## Phase 0 — Environment Setup

**Goal:** everything is configured and verified working before any tutoring logic is written.

**Prerequisites (do before writing any code):**
- [ ] Google account decided/created for this project (recommend a dedicated Google account, not your personal one — keeps billing, API usage, and any future access changes cleanly separated from personal Gmail/Drive)
- [ ] Google Cloud project created (even for the Gemini Developer API, a GCP project sits behind it — create one now, e.g. `family-tutor-mvp`)
- [ ] Billing account linked to that GCP project, paid tier confirmed active (not just a card added — verify in the AI Studio billing page that the project shows as paid tier)
- [ ] Generative Language API (Gemini API) enabled on that project
- [ ] API key generated and stored somewhere safe *outside* git (password manager, not a text file on the desktop)
- [ ] GitHub account confirmed, private repo created (empty, no code yet)
- [ ] Node.js installed and version checked (LTS version recommended)
- [ ] GitHub Copilot subscription active and verified working in your editor (open editor, type a comment, confirm suggestions appear)
- [ ] Decide the project folder location/structure on the Mac Mini (e.g., alongside your `AI-Agents-hands-on` repo)

**Confirmed stack for this project:**

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Backend framework | Hono (or Fastify) |
| Frontend | React + Vite |
| Database | SQLite, accessed via Drizzle ORM |
| AI SDK | `@google/genai` (official, current GA SDK — NOT the deprecated `@google/generative-ai`) |
| Voice | Web Speech API (browser standard, no library) |
| Testing | `node:test` (built-in, no extra dependency) |
| Version control | Git + private GitHub repo |

**Tasks:**
1. Create Google AI Studio account, enable billing (paid tier), generate API key.
2. Install `@google/genai` and verify the key works with a trivial test call (send "hello", confirm a response) — do this once, standalone, before building anything else. Double-check any tutorial or Copilot suggestion isn't referencing the old deprecated `@google/generative-ai` package.
3. Scaffold the project:
   - `npm init` for the backend, Hono (or Fastify) installed
   - Vite + React scaffolded for the frontend (`npm create vite@latest` with the React + TypeScript template)
   - `drizzle-orm` + its SQLite driver installed, plus `drizzle-kit` for schema management
4. Create `.env` with `GEMINI_API_KEY=`, add `.env` and `*.sqlite` to `.gitignore` **before the first commit**.
5. Initialize private GitHub repo.
6. Confirm Gemini safety settings API — write a small config object you'll reuse everywhere (don't set safety settings ad hoc per call).

**Definition of done:** a script that calls Gemini with strict safety settings and prints a response, run from the command line, with no secrets in git history; a Vite + React dev server running with a blank page ready for Phase 1's UI.

---

## Phase 1 — Prove the Loop (Reception, Maths)

**Goal:** one child, one subject, fully working session — this is the phase to get right slowly.

**Prerequisites (do before writing any code):**
- [ ] Phase 0 fully complete (working Gemini call, working Vite/React shell, DB tooling installed)
- [ ] EYFS Maths content researched: confirm the actual Reception-level topic list (counting to 20, number recognition, simple addition) against the current UK EYFS framework — don't rely on memory of "what Reception maths is," check the current framework document
- [ ] Seed question bank **written out in a spreadsheet or plain doc first** (10-15 questions per topic) — this is content work, not code, and should be finished before any Gemini integration code is written, so Phase 1d has real content to work against
- [ ] Browser decided for Web Speech API testing — Chrome has the most reliable support; confirm this is what you'll test in, since Web Speech API support varies meaningfully by browser
- [ ] Quiet, low-background-noise testing environment identified for trying voice input with your Reception-age child (speech recognition accuracy for young children's voices is the biggest unknown here — test early, don't assume it'll just work)

### 1a. Database schema
Tables needed (keep minimal, extend later — don't pre-build fields you don't need yet):
- `children` (id, name, date_of_birth, current_year_group)
- `topics` (id, subject, curriculum, name, prerequisite_topic_id nullable)
- `mastery` (child_id, topic_id, box_level, last_seen_at, correct_streak)
- `seed_questions` (id, topic_id, question_text, answer, difficulty)
- `session_log` (id, child_id, topic_id, question_text, child_answer, correct, timestamp)

### 1b. Mastery algorithm (Leitner-box style — build this before the UI)
- Each topic starts at `box_level = 1` for a child.
- Correct answer → increment `correct_streak`; after 3 correct in a row, move up a box (max box 5).
- Incorrect answer → reset `correct_streak` to 0, drop down one box (min box 1).
- Question selection: weight toward lower box levels (more practice) but don't fully exclude higher boxes (spaced repetition, avoid forgetting).
- Write this as a pure function first (`selectNextTopic(childId): Topic`), unit-testable without any UI or API involved.

### 1c. Seed question bank
- Hand-author 10-15 questions per Reception Maths topic (counting to 20, number recognition, simple addition) before writing any Gemini-calling code.
- Store as the `seed_questions` table above (defined via Drizzle schema), or a JSON file you load in — either is fine for MVP.

### 1d. Gemini integration
- Gemini's job: take a seed question and paraphrase/vary it (different objects, different numbers within the same difficulty), not invent new maths facts.
- Fallback: if the API call fails or times out, serve the seed question unmodified. Session must never hard-fail.

### 1e. Voice I/O
- Use Web Speech API (browser-based) for both input and output — no audio leaves the device.
- Fallback to on-screen text/tap if speech recognition confidence is low (important for a 4-year-old's speech).

### 1f. Minimal UI
- One screen: shows/speaks the question, accepts a spoken or tapped answer, gives immediate feedback, moves to next question.
- No login, no settings — Reception child should not need to read to use this.

**Definition of done:** Child B can sit down, do a full 5-10 minute session by voice, mastery levels update in the DB, and a failed API call doesn't break the session.

---

## Phase 2 — Year 3, Maths + English (11+ skew)

**Goal:** reuse the Phase 1 engine, add new content and a second child's needs.

**Prerequisites (do before writing any code):**
- [ ] Phase 1 fully working and stable (don't start Phase 2 content work while Phase 1 still has open bugs)
- [ ] Year 3 UK National Curriculum Maths + English topics confirmed against the current curriculum document (place value, x/÷ facts for 3/4/8, fractions intro; comprehension, spelling patterns, sentence structure)
- [ ] Indian curriculum equivalent topics researched and mapped alongside the UK list — confirm which Indian board (CBSE/ICSE/state) you're actually aligning to, since content differs between them
- [ ] Seed question bank written for Year 3 Maths (skewed toward speed + multi-step reasoning, per the 11+ goal) — again, content before code
- [ ] Comprehension passages sourced or **written by you** — do not copy passages from copyrighted children's books or workbooks; either write short original passages or use genuinely public-domain material
- [ ] Confirm whether text input UI (keyboard/tablet) is available for Child A's sessions, since Year 3 sessions will mix voice and text

**Tasks:**
1. Extend `topics` table with Year 3 Maths (place value, x/÷ facts for 3/4/8, fraction intro) and Year 3 English (comprehension, spelling patterns, sentence structure) — both mapped to UK and Indian equivalents per the earlier table.
2. Skew Maths question generation toward speed + multi-step reasoning (mention this explicitly in the Gemini prompt template — don't rely on the model inferring it).
3. English: add a comprehension question type (short passage + question) — this is a new question *shape*, not just new content, so the seed bank and UI need a variant that can show a short reading passage.
4. Text input becomes viable alongside voice for this child (Year 3 = fluent reader/writer) — UI should support both.
5. Reuse the same mastery algorithm — do not build a second one.

**Definition of done:** Child A can run a Maths session and an English comprehension session, both logged into the same mastery system, no duplicated engine code.

---

## Phase 3 — Second subject for Reception + Science for Year 3

**Goal:** this phase should be visibly faster than Phase 1/2 — if it isn't, something in the engine wasn't generalized properly and is worth revisiting before continuing.

**Prerequisites (do before writing any code):**
- [ ] Phase 1 and 2 stable and in daily use for at least a couple of weeks — you want real usage data before adding more surface area
- [ ] UK phonics scheme confirmed for Reception's second subject (check which phonics programme your child's actual school uses — e.g. Little Wandle, Read Write Inc — content should match what they're taught at school, not a generic phonics order)
- [ ] Year 3 Science (KS2: plants, animals incl. humans, rocks) topics confirmed against the current curriculum document
- [ ] Seed question banks written for both new subjects before touching code

**Tasks:**
1. Add Reception's second subject (likely phonics/English) using the exact same engine, just new seed content.
2. Add Year 3 Science (KS2: plants, animals incl. humans, rocks) — same pattern.
3. No new architecture should be needed here. If you find yourself writing new engine logic, pause and ask whether Phase 1/2 generalized correctly.

---

## Phase 4 — VR/NVR Module (Year 3, 11+ prep)

**Goal:** a new content *type* (pattern/sequence puzzles), not curriculum-mapped, lower intensity, long-horizon.

**Prerequisites (do before writing any code):**
- [ ] Phases 1-3 stable and running as your kids' daily routine
- [ ] Revisit whether a target grammar school area/board has been decided by this point — if yes, source VR/NVR question formats matching that specific board (GL Assessment, CEM-style, Bucks Test, etc.); if not, proceed with general-format puzzles as planned
- [ ] General VR/NVR question types researched (analogies, codes, sequences, matrices) and a seed bank written before coding
- [ ] Decide the session scheduling approach (e.g., 2-3x/week rather than daily) before building the scheduling logic, since this differs from how Maths/English sessions are scheduled

**Tasks:**
1. New topic category: `reasoning` (separate from `subject` mapping — VR/NVR isn't on the National Curriculum).
2. Seed bank of general-format puzzles (analogies, codes, sequences, matrices) — general skill types, not board-specific formats, since target school/exam board isn't decided yet.
3. Session frequency should be lower and steadier than Maths/English — this is a "little and often over 2 years" track, design the scheduling logic accordingly rather than treating it like a daily subject.

---

## Cross-Cutting Additions (fold into whichever phase makes sense as you build)

- **Backup:** a simple scheduled script (cron or manual reminder) copying the SQLite file to an external drive or encrypted archive. Add this once Phase 1's DB has real data worth protecting — don't wait until Phase 4.
- **Parent view:** a minimal local page showing mastery-by-topic per child. Good candidate for Phase 2/3, once there's enough data to make it meaningful.
- **Engagement design:** small, non-manipulative positive feedback (e.g., a simple visual streak or star count) — no loss-aversion mechanics, no infinite-session pull. Add during Phase 1 UI work, keep it minimal.
- **API failure handling:** confirm the seed-question fallback (Phase 1, 1d) is actually exercised — worth deliberately testing by disconnecting network mid-session at least once.

---

## Mentor Checkpoints (recap — you agreed to these)

- Don't build multi-family auth, cloud sync, or formal legal docs before Phase 1 runs end-to-end.
- Don't let VR/NVR content-building overtake Phase 1/2 core loop work.
- Don't send full session history to Gemini "for better context" — pass only what's needed per call.
- If Phase 1 is taking longer than ~3 weeks, simplify further rather than push harder.
