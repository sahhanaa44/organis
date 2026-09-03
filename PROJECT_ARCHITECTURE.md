# Organis — Architecture

## Overview

Organis is split into three independently-runnable services that mirror a
real clinical-software boundary: the browser never talks directly to the
matching engine, and the matching engine never touches the database.

```
┌─────────────┐      HTTPS + JWT       ┌──────────────┐      HTTP (internal)     ┌────────────────┐
│   React      │ ───────────────────▶ │   Node /      │ ───────────────────────▶ │  FastAPI AI      │
│   client     │ ◀─────────────────── │   Express API │ ◀─────────────────────── │  matching service │
└─────────────┘        JSON            └──────┬───────┘        JSON               └────────────────┘
                                                │ Mongoose
                                                ▼
                                          ┌──────────┐
                                          │ MongoDB   │
                                          └──────────┘
```

- The **client** holds no secrets and never calls the AI service directly —
  only `VITE_API_URL` and (optionally) a public Google OAuth client ID.
- The **Express API** is the only service holding `JWT_SECRET`,
  `MONGODB_URI`, and `ANTHROPIC_API_KEY`. It authenticates every request,
  enforces role-based authorization, and is the sole caller of the AI service.
- The **FastAPI service** is stateless and has no database access. It receives
  a donor+candidates payload, returns a ranked, explainable scoring result,
  and stores nothing.

---

## Auth flow

1. Client obtains a Google ID token (via Google Identity Services) or submits
   email/password.
2. `POST /api/auth/google` or `/api/auth/login` verifies the credential,
   creates/looks up a `User`, and returns a signed JWT plus the user object.
3. The client stores the JWT in `localStorage` and attaches it as
   `Authorization: Bearer <token>` on every subsequent request (see
   `client/src/lib/api.js`).
4. `requireAuth` middleware verifies the JWT and loads the `User` document;
   `requireRole(...)` middleware enforces role-based access per route.
5. A 401 response anywhere clears the local session and redirects to `/login`.

---

## Data model

| Model          | Purpose                                                                 |
|----------------|--------------------------------------------------------------------------|
| `User`         | Account + role (`donor`/`recipient`/`hospital`/`admin`) + auth credentials |
| `Donor`        | Medical profile, consent state, linked to one `User`                     |
| `Recipient`    | Medical profile, required organ, urgency, waitlist stage                 |
| `Hospital`     | Partner hospital record; hospital-role users link to one                 |
| `Organ`        | A specific organ instance registered against a `Donor`                   |
| `Match`        | The curated result of one AI matching run against one `Organ`            |
| `AIResult`     | Raw request/response archive of every call to the AI service (audit trail) |
| `Allocation`   | The human-driven workflow instance once a candidate is selected from a `Match` |
| `Notification` | In-app notifications per user                                            |
| `AuditLog`     | Immutable log of every sensitive action across the platform              |

`Match` stores the curated, UI-facing ranking; `AIResult` stores the raw
payload sent to and received from the AI service verbatim, so every AI
decision is independently auditable even if scoring logic changes later.

---

## The compatibility engine (`ai-service/app/scoring.py`)

Deterministic and explainable by design — no random numbers, no opaque model
weights. For each candidate:

1. **Hard disqualification checks** run first and are absolute:
   - ABO/Rh blood incompatibility (standard donor→recipient compatibility chart)
   - Organ type mismatch
   - Any recipient contraindication matching this organ type

   A disqualified candidate is excluded from ranking entirely — never merely
   scored low — mirroring real allocation policy.

2. **Eligible candidates are scored** on seven weighted factors:

   | Factor                | Default weight | How it's computed |
   |------------------------|-----------------|---------------------|
   | Blood compatibility    | 30%             | Binary: compatible per ABO/Rh chart |
   | Organ compatibility    | 25%             | Binary: organ type matches |
   | Medical compatibility  | 18%             | Inverse of prior-condition risk load |
   | Urgency                | 9%              | Mapped from clinical urgency level |
   | Waiting time           | 7%              | Normalized against a 3-year ceiling |
   | Distance               | 3%              | Haversine distance, normalized against an 800km ceiling |
   | Size & tissue fit      | 8%              | scikit-learn cosine similarity over HLA markers + body-size delta |

   Weights are defined in `ai-service/app/config.py` and can be overridden
   per-request via `weight_overrides` in the `POST /ai/match` payload — the
   Node layer exposes this as an optional `weightOverrides` field on
   `POST /api/matches/run`.

3. **Output** is a `compatibility_score` (0–100), a `priority_rank`, a
   per-factor `factors[]` breakdown (weight %, raw 0–1 score, contribution %),
   and a list of plain-language `reasons` — the exact shape the UI's
   "Why this recommendation?" panel renders.

Every response includes a fixed disclaimer field reiterating that this is
decision-support output only.

---

## Allocation state machine

```
Organ Available
      │
Eligibility Check ──────────────┐
      │                          │ (no eligible candidates)
AI-Assisted Matching             │
      │                          │
Candidate Ranking                │
      │                          ▼
Human Review ──────────────▶ (organ stays "available")
      │
Allocation Pending
      │
Approved
      │
Transplant Scheduled
      │
Completed
```

- `POST /api/matches/run` performs eligibility filtering + calls the AI
  service + persists the `Match` + `AIResult`. The organ moves to
  `matching_in_progress` → `matched`.
- `POST /api/matches/:id/review` is the human decision point: a hospital
  reviewer picks one eligible candidate from the ranked list, which creates
  an `Allocation` starting at `human_review`.
- `POST /api/allocations/:id/advance` moves an `Allocation` forward one
  explicit stage at a time (`allocation_pending` → `approved` →
  `transplant_scheduled` → `completed`, or `rejected` at any point before
  completion). Every transition is pushed onto `stageHistory` with the acting
  user, and triggers a `Notification` to the recipient.
- **The AI never advances a stage on its own.** Every transition in this
  state machine is an explicit, audited action taken by an authenticated
  hospital or admin user.

---

## Audit logging

`recordAudit()` (`server/src/utils/audit.js`) is called from every mutating
route — profile updates, consent changes, organ registration, match runs,
reviews, and allocation stage changes — and writes an immutable `AuditLog`
entry with the actor, action, entity, and metadata. Admins can browse this at
`/admin/analytics`.

---

## Organis Assistant

`server/src/services/assistantService.js` implements a small router:

- If `ANTHROPIC_API_KEY` is set, `POST /api/assistant/ask` calls the Claude
  API directly from the server with a system prompt that restricts it to
  educational explanations of matching, compatibility, and the allocation
  workflow, and explicitly forbids implying it can make a real decision.
- If no key is set, a local keyword-matched knowledge base answers the same
  categories of question, so the feature works fully offline/out of the box.
- The API key is read from `process.env` on the server only — it is never
  sent to, stored in, or accessible from the React client.

---

## Why no Docker

Per the brief, this project intentionally runs as three plain local
processes (`npm run dev`, `uvicorn`, and a local/Atlas MongoDB) rather than
containers, to keep the setup transparent and easy to step through while
learning the codebase.
