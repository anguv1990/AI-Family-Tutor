# AI Family Tutor — Product Design & Implementation Plan (MVP v1)

**Owner:** Angu
**Scope:** Private, family-only MVP for 2 children (Year 3 starting Sept, Reception starting Sept)
**Primary AI coding tool:** GitHub Copilot
**Data policy:** Local device only, no cloud storage
**Long-term ambition:** Grow into a global, accessible AI tutor (rural + physically challenged children) — MVP is deliberately narrow, architecture is deliberately not

---

## 1. Product Framing

### 1.1 What this is
A locally-run, AI-assisted tutor for your own two children, covering Maths, English, and (later) Science, aligned to the UK National Curriculum and the Indian curriculum, with an additional long-term focus on 11+ grammar school preparation for your elder child.

### 1.2 What this deliberately is NOT (yet)
- Not multi-tenant (no other families, no accounts/auth system)
- Not cloud-hosted (no Firebase/Firestore — your own choice, and it removes a large chunk of infra + compliance work)
- Not a business — this is a personal tool first. Productisation is a *later* decision, not a *now* decision.

### 1.3 North star for MVP
A working daily session loop, for both children, that:
- Adapts question difficulty based on past performance
- Tracks topic mastery over time (so it "grows" with them)
- Requires zero manual admin from you once running

### 1.4 Long-term line of sight (context only — not MVP work)
The rural/global/accessibility mission is the "Primer" vision. Nothing in this MVP should block that path later (e.g., don't hardcode assumptions that only work for one child), but nothing in this MVP should be built *for* that path either. That's a Series-of-decisions-away problem, not a today problem.

---

## 2. Security & Privacy by Design (MVP-appropriate, not enterprise-appropriate)

**Principle:** cheap-now, expensive-later protections are mandatory. Expensive-now, cheap-later protections are deferred.

### 2.1 Non-negotiable from Day 1
| Practice | Why |
|---|---|
| Use **paid Gemini API tier** (billing enabled), not free AI Studio | Removes any ambiguity about your children's prompts being used for model training or human review |
| **No cloud data storage** | Matches your decision; mastery data, session history, any transcripts stay in a local database file on your Mac Mini |
| **API keys in environment variables / OS keychain, never in code or git** | Standard practice; prevents accidental leakage if you ever push code to GitHub |
| **Private git repository** | Even though no child data is ever committed, keep the repo private by default — habit matters more than the specific risk here |
| **No third-party analytics/ad SDKs** | Nothing tracking your kids' usage beyond what you build yourself |
| **Gemini safety settings set to strict** | Gemini API has configurable safety filters — set to the most conservative level for child-facing content, non-negotiable |
| **Minimal data sent per call** | Send only what's needed for the current question/session — don't send full history every time; keep mastery state local and only pass the relevant slice |

### 2.2 Deferred until you have external users
- Formal Data Protection Impact Assessment (DPIA)
- ICO registration / privacy notice / consent flows
- Age Appropriate Design Code formal conformance
- Multi-user authentication and access control
- Data residency guarantees beyond "it's on my machine"

**Mentor note:** if you find yourself building any item in 2.2 before the loop in Phase 1 works, that's scope creep — stop and come back to it later.

---

## 3. Architecture (Local-First)

Since data stays on-device, this drops the Firestore/Firebase suggestion from earlier — that was designed for a cloud scenario. Local-first is actually *simpler* to build and secure.

```
┌─────────────────────────────────────────────┐
│         Local App (Mac Mini M4 Pro)          │
│                                               │
│  ┌───────────────┐      ┌─────────────────┐  │
│  │  Session UI   │◄────►│  Tutoring Engine │  │
│  │ (local web app)│     │   (Node/TS)      │  │
│  └───────────────┘      └────────┬────────┘  │
│                                   │           │
│                          ┌────────▼────────┐  │
│                          │  Local DB        │  │
│                          │ (SQLite file)    │  │
│                          │ - child profiles │  │
│                          │ - mastery graph  │  │
│                          │ - session logs   │  │
│                          └─────────────────┘  │
└───────────────────────┬───────────────────────┘
                         │ HTTPS (transient, per-call only)
                         ▼
              ┌─────────────────────┐
              │  Gemini API (paid)  │
              │  - question gen     │
              │  - answer eval      │
              │  - Flash: routine   │
              │  - Pro: rare, cached│
              └─────────────────────┘
```

**Key decisions:**
- **SQLite**, not Firestore — a single local file, no server, no cloud account, trivially backed up (copy the file), fits "own device only" exactly.
- **Voice**: prefer the browser's built-in **Web Speech API** (free, runs locally/via OS) over Cloud Speech-to-Text for the MVP — keeps voice data off Google's servers entirely for the Reception child's sessions. Only fall back to Cloud STT/TTS if Web Speech API quality proves insufficient for a 4-year-old's speech.
- **Gemini calls are stateless per-turn** — you send the current question context, not the child's full history, minimizing what leaves the device.

---

## 4. Implementation Plan (Phased)

### Phase 0 — Environment Setup (this week)
- Google AI Studio account, billing enabled, paid-tier API key generated
- Node/TS project scaffolded (you already have this pattern from your agent-loop learning project — reuse it)
- SQLite + a lightweight ORM (e.g., `better-sqlite3` or `drizzle-orm`) added
- Private GitHub repo created, `.env` + `.gitignore` configured before any code is written
- GitHub Copilot active in your editor

### Phase 1 — Prove the Loop (Reception, Maths)
- Simplest possible case: voice-in (Web Speech API) → Gemini Flash generates/evaluates a counting or number-recognition question → result written to SQLite → mastery score updates
- Goal: one child, one subject, one working end-to-end session. Nothing else.

### Phase 2 — Year 3, Maths + English (11+ skew)
- Text/voice mixed input
- Maths: skew toward speed + multi-step reasoning per 11+ needs
- English: comprehension + vocabulary depth
- Mastery graph extended to Year 3 topic set

### Phase 3 — Reception second subject + Science (Year 3)
- Replicate the proven Phase 1/2 engine pattern — this phase should be noticeably faster than Phase 1/2 since the hard architectural problems are already solved

### Phase 4 — VR/NVR module (Year 3 child, 11+ prep)
- New content type: pattern/sequence/code puzzles — not curriculum-mapped, a separate skill-training track
- Deliberately low-intensity, long-horizon (per earlier discussion — this is a 2-year runway skill, not a cram subject)

**Mentor note:** resist reordering this. Phase 1 is intentionally the smallest possible slice — the temptation will be to build "properly" for both kids and all subjects at once. Don't.

---

## 5. Prerequisite Configuration Checklist

- [ ] Google AI Studio account created, **billing enabled** (paid tier)
- [ ] Gemini API key generated, stored in `.env` (never committed)
- [ ] Node.js + TypeScript environment (reuse your existing Mac Mini setup)
- [ ] `better-sqlite3` or equivalent installed
- [ ] Private GitHub repository created
- [ ] `.gitignore` includes `.env`, `*.sqlite`, `/data`
- [ ] GitHub Copilot subscription active and enabled in your editor
- [ ] Gemini safety settings reviewed and set to strictest available level
- [ ] Decision recorded: Web Speech API for voice input (Phase 1), Cloud STT/TTS only as fallback

---

## 6. Effort Estimation (using GitHub Copilot)

**Important framing:** Copilot is primarily an **inline autocomplete/suggestion tool** — it accelerates typing boilerplate and common patterns, but it doesn't autonomously scaffold multi-file architecture the way Cursor's agent mode or Claude Code does. Your effort estimate should assume *you* are driving every architectural decision, and Copilot is speeding up the typing of what you've already decided.

Given your existing pace (5-45-10 min daily structure, evenings/weekends realistically):

| Phase | Est. calendar time | Notes |
|---|---|---|
| Phase 0 (setup) | 2-3 evenings | Mostly config, not code — Copilot helps little here |
| Phase 1 (Reception Maths loop) | 1.5-2 weeks | The hardest phase — first time wiring voice→Gemini→SQLite→UI end-to-end. Copilot speeds up the SQLite/API boilerplate meaningfully once you know the shape of the code |
| Phase 2 (Year 3 Maths+English) | 1-1.5 weeks | Faster — reusing Phase 1's engine, just new content/prompts |
| Phase 3 (2nd subject + Science) | 3-5 days | Should be genuinely quick if Phase 1/2 architecture is clean |
| Phase 4 (VR/NVR) | 1 week | New content type, but same engine |

**Total: roughly 5-7 weeks of evenings/weekends** to a working private MVP across both kids, three subjects, and the 11+ skew — assuming no major redesigns mid-way (which is why Phase 1 being small and proven-first matters so much).

**Honest comparison note** (you asked): Cursor and Claude Code would likely cut Phase 1 by 20-30% because they can scaffold the multi-file wiring (DB schema + API client + UI) more autonomously — but Copilot is a perfectly reasonable choice for this project's size, and switching tools mid-project is rarely worth the friction. Stick with Copilot unless you hit a specific wall.

---

## 7. Mentor Checkpoints — Where I'll Push Back

- If you start designing multi-family auth, Firestore sync, or formal legal docs before Phase 1 runs end-to-end: **stop, that's premature.**
- If VR/NVR content starts consuming more time than the core Maths/English loop before Phase 2 is done: **wrong sequencing.**
- If you're tempted to send full session history to Gemini "for better context": **reconsider — minimize what leaves the device, even to a trusted paid API.**
- If Phase 1 takes more than ~3 weeks: that's a signal to simplify further, not push harder — the goal is a proof, not a polished product.
