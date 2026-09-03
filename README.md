# Organis

**Every organ has a destination.**

An educational prototype for an AI-assisted organ donation matching and allocation
platform: an explainable compatibility engine, role-based dashboards for donors,
recipients, hospitals and admins, and a fully auditable allocation workflow.

> ⚠️ **This is a prototype, not a clinical system.** AI recommendations are
> decision-support outputs only and must be reviewed by qualified clinical and
> authorized allocation personnel. Organis has not undergone clinical
> validation and must never be used for real medical decision-making. All
> seed data is fictional.

---

## Architecture

```
React (Vite/Tailwind/Framer Motion)
        │  axios, JWT bearer tokens
        ▼
Node.js / Express API  ──────────────┐
        │  Mongoose                  │  axios (internal call)
        ▼                            ▼
    MongoDB                  FastAPI AI Matching Service
                              (deterministic, explainable scoring)
```

- **`client/`** — React + Vite + Tailwind + Framer Motion. Landing page, auth,
  and role-based dashboards (donor / recipient / hospital / admin).
- **`server/`** — Node + Express + Mongoose. Owns auth (Google OAuth + JWT),
  business logic, audit logging, and is the only service that talks to the
  FastAPI AI service or holds any API keys.
- **`ai-service/`** — Python + FastAPI + scikit-learn/NumPy. A single endpoint,
  `POST /ai/match`, that scores donor→recipient compatibility with a
  deterministic, configurable, fully explainable formula. It is internal-only:
  the React client never talks to it directly.

See [`PROJECT_ARCHITECTURE.md`](./PROJECT_ARCHITECTURE.md) for a deeper walkthrough
of data flow, the scoring formula, and the allocation state machine.

---

## Prerequisites

- **Node.js 18+** and npm
- **Python 3.10+** and pip
- **MongoDB** running locally (or a connection string to a remote instance —
  e.g. a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- No Docker required — everything runs as plain local processes.

---

## 1. Configure environment variables

Each service reads its own `.env` file. Copy the example in each folder:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
cp ai-service/.env.example ai-service/.env
```

At minimum, edit `server/.env` and set:

- `MONGODB_URI` — your local or Atlas connection string
- `JWT_SECRET` — any long random string

Everything else has a sensible local default. Google OAuth and the
`ANTHROPIC_API_KEY` for the Organis Assistant are **optional** — see
[Optional integrations](#optional-integrations) below.

---

## 2. Install dependencies

Open three terminals (or run sequentially):

```bash
# Terminal 1 — Node API
cd server
npm install

# Terminal 2 — React client
cd client
npm install

# Terminal 3 — FastAPI AI service
cd ai-service
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

---

## 3. Seed the database

With MongoDB running and `server/.env` configured, run the seed script. It's
safe to re-run — it clears and re-creates all collections each time.

```bash
cd server
npm run seed
```

This creates realistic **fictional** demo data: 8 hospitals, 15 donors,
25 recipients, 20 organs, plus matches, allocations, notifications, and audit
log entries. It will use the live AI service for matches if it's already
running, and fall back to the same deterministic scoring logic locally
otherwise — either way, the numbers are real, not randomly faked.

**Demo login (any account, after seeding):** an email ending in
`@organis.demo` (e.g. `admin@organis.demo`, `donor1@organis.demo`,
`recipient1@organis.demo`) with password `Demo@1234`. Hospital staff accounts
follow the same pattern — check the seed script's console output for the full
list of generated emails.

---

## 4. Run everything

Start all three services (order doesn't matter, but the AI service should be
up before you run real matches from the UI):

```bash
# Terminal 1
cd ai-service && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2
cd server && npm run dev

# Terminal 3
cd client && npm run dev
```

Then open **http://localhost:5173**.

- Client dev server: `http://localhost:5173` (proxies `/api` to the Node server)
- Node API: `http://localhost:5000` (health check: `GET /api/health`)
- FastAPI service: `http://localhost:8000` (health check: `GET /health`, docs at `/docs`)

---

## Optional integrations

**Google OAuth** — without it, the login page automatically falls back to a
plain email/password flow (demo accounts work fine this way). To enable it,
create an OAuth 2.0 Client ID at the
[Google Cloud Console](https://console.cloud.google.com/apis/credentials),
add `http://localhost:5173` as an authorized JavaScript origin, and set
`GOOGLE_CLIENT_ID` in `server/.env` and `VITE_GOOGLE_CLIENT_ID` in `client/.env`
to the same value.

**Organis Assistant LLM** — without `ANTHROPIC_API_KEY` set in `server/.env`,
the assistant answers from a built-in local knowledge base covering matching,
compatibility, and the allocation workflow, so the feature works out of the
box. Set the key to route questions through the Claude API instead. The key
lives only in `server/.env` and is never sent to or readable from the React
client.

---

## How this was verified before packaging

This sandbox had no internet access, so a live `npm install` / `pip install`
+ boot test wasn't possible here. Instead, every file was verified statically
and as much of the real logic as possible was executed directly:

- **Every** `.js`/`.jsx` file in `server/` and `client/` passed a real syntax
  check (`node --check` for the server, `esbuild` with JSX transform for the
  client).
- The **entire client import graph** (34 files: App, pages, components,
  context, lib) was bundled successfully in one pass with `esbuild`,
  confirming every import resolves and the component tree is wired correctly.
- Every relative import path in `server/` and `client/` was cross-checked
  against the filesystem — no missing modules.
- Every `.py` file in `ai-service/` passed `python -m py_compile`.
- The **AI scoring engine's actual test suite ran against the real
  `scoring.py` logic** (via a minimal local Pydantic-compatible shim, since
  `pydantic`/`fastapi` couldn't be installed offline) — all 6 tests passed,
  including compatible/incompatible matches, disqualification rules, ranking
  order, and configurable weight overrides. A sample run reproduced a
  93.0% compatibility score with the exact factor breakdown format described
  in the product brief.
- Every client-side `axios` call was cross-checked against the corresponding
  Express route's method, path, and response shape.

What this **doesn't** replace: an actual `npm install` + `pip install` +
running MongoDB + booting all three processes together. Please run the steps
above and open an issue-style note for me if anything doesn't come up cleanly
— given the coverage above, it should, but a real boot test is the last mile
I couldn't complete in this environment.

---

## Project structure

```
organis/
├── client/                # React + Vite + Tailwind + Framer Motion
│   ├── src/
│   │   ├── components/    # Navbar, Footer, WorkflowDiagram, MatchAnalysisCard, ...
│   │   ├── pages/          # Landing, Login, Assistant, donor/, recipient/, hospital/, admin/
│   │   ├── context/        # AuthContext (JWT session state)
│   │   └── lib/             # axios instance with JWT interceptor
│   └── .env.example
├── server/                 # Node + Express + Mongoose
│   ├── src/
│   │   ├── models/          # User, Donor, Recipient, Hospital, Organ, Match, Allocation, Notification, AuditLog, AIResult
│   │   ├── routes/          # auth, donor, recipient, hospital, admin, organs, matches, allocations, notifications, assistant
│   │   ├── services/        # aiService (calls FastAPI), assistantService (LLM or local KB)
│   │   ├── middleware/      # JWT auth, role-based authorization
│   │   ├── utils/           # audit logging, notifications
│   │   └── seed/            # fictional demo data generator
│   └── .env.example
├── ai-service/              # Python + FastAPI
│   ├── app/
│   │   ├── main.py           # POST /ai/match, GET /health
│   │   ├── scoring.py        # deterministic, explainable compatibility engine
│   │   ├── schemas.py        # Pydantic request/response models
│   │   └── config.py         # configurable factor weights
│   ├── tests/                # scoring engine test suite
│   └── .env.example
├── README.md
├── PROJECT_ARCHITECTURE.md
├── .gitignore
└── .env.example
```
