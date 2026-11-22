# EPIA Patient Follow-up Desk

A small, local patient follow-up management assessment project. It uses fictional patient data, stores records in SQLite, and provides a staff-reviewed WhatsApp message draft workflow. The project does not connect to WhatsApp and never sends messages.

## Features

- Create patient records, list and search records, view follow-ups due today, and mark follow-ups completed.
- SQLite persistence with foreign keys, input validation, and useful JSON errors.
- Generate concise follow-up message drafts with Groq or a clearly labeled deterministic `MOCK` fallback.
- Edit a pending draft and explicitly approve it. Approved drafts are visibly distinct and locked against further edits. Approval does not send a message.
- Responsive staff dashboard with totals, due-today queue, patient list, loading, empty, success, and error states.

## Stack and structure

- Backend: Node.js, Express, SQLite via `better-sqlite3`, Groq SDK, dotenv, cors.
- Frontend: React, Vite, JavaScript, Tailwind CSS, Lucide icons, Axios.
- Tests: Node built-in test runner.

```text
backend/src/{config,controllers,routes,services,middleware,utils}/
backend/tests/api.test.js
frontend/src/{App.jsx,services,style.css}
```

## Prerequisites and setup

Install Node.js 20 or newer and npm. From the repository root:

```sh
npm install
npm install --prefix backend
npm install --prefix frontend
```

Copy `backend/.env.example` to `backend/.env` and optionally set `GROQ_API_KEY`. The key stays on the backend and must not be added to source control. The default database is created automatically at `backend/data/patients.db`.

## Run locally

Use two terminals from the repository root:

```sh
npm run dev:backend
npm run dev:frontend
```

Open <http://localhost:5173>. The API listens on <http://localhost:5000>. `PORT`, `FRONTEND_URL`, `GROQ_API_KEY`, and optional `GROQ_MODEL` can be configured in `backend/.env`. To place SQLite elsewhere, set `DB_PATH` to a path writable by the backend.

## API

All endpoints are under `/api`; successful responses use `{ "data": ... }`, errors use `{ "error": "..." }`, and validation errors may include `details`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Service health |
| POST | `/api/patients` | Create a patient |
| GET | `/api/patients` | List patients |
| GET | `/api/patients/due-today` | Pending patients due today (`?date=YYYY-MM-DD` is available for review/testing) |
| PATCH | `/api/patients/:id/status` | Mark follow-up completed |
| POST | `/api/followups/generate/:patientId` | Generate and save a pending draft for a patient due today |
| GET | `/api/followups/drafts` | List saved drafts with patient names |
| PATCH | `/api/followups/drafts/:id` | Edit a pending draft (`{ "message": "..." }`) |
| PATCH | `/api/followups/drafts/:id/approve` | Explicitly approve a pending draft |

There is intentionally no send-message endpoint.

Example create request:

```json
{
  "name": "Asha Mehta",
  "phone": "+91 98765 43210",
  "consultation_date": "2026-11-21",
  "next_followup_date": "2026-11-21"
}
```

Example response:

```json
{
  "data": {
    "id": 1,
    "name": "Asha Mehta",
    "phone": "+91 98765 43210",
    "consultation_date": "2026-11-21",
    "next_followup_date": "2026-11-21",
    "followup_status": "pending",
    "created_at": "2026-11-21 10:00:00"
  }
}
```

API testing with curl:

```sh
curl -X POST http://localhost:5000/api/patients -H "Content-Type: application/json" -d '{"name":"Asha Mehta","phone":"+91 98765 43210","consultation_date":"2026-11-21","next_followup_date":"2026-11-21"}'
curl http://localhost:5000/api/patients
curl http://localhost:5000/api/patients/due-today
curl -X POST http://localhost:5000/api/followups/generate/1
curl http://localhost:5000/api/followups/drafts
curl -X PATCH http://localhost:5000/api/followups/drafts/1 -H "Content-Type: application/json" -d '{"message":"Reviewed follow-up reminder."}'
curl -X PATCH http://localhost:5000/api/followups/drafts/1/approve
curl -X PATCH http://localhost:5000/api/patients/1/status
```

## AI and approval workflow

Only the patient's first name and the fact that a follow-up is due today are sent to Groq. The prompt prohibits diagnosis, treatment, advice, and outcome claims. If there is no key or Groq fails, the service saves a deterministic reminder marked `MOCK`; it does not pretend the text came from an AI model. All generated drafts start with `pending` status. Staff can review/edit and then approve. Approval records the state transition and the UI says that nothing was sent. No WhatsApp account or sending integration exists.

## Database and validation

SQLite creates `patients` and `followup_drafts` tables at startup, uses foreign keys and a due-date index, and persists records between restarts. Inputs are checked for required and non-empty fields, phone format, real calendar dates, consultation/follow-up ordering, numeric IDs, non-empty draft edits, and valid approval transitions. Expected API errors use 400, 404, and 409 status codes; unexpected errors return a generic 500 response.

## Tests and production build

```sh
npm test
npm run build
```

The backend tests exercise patient creation/listing, validation, due-today filtering, completion, mock draft generation, editing, approval transitions, and not-found handling. The frontend build creates `frontend/dist`.

## Assessment demonstration

For a short screen recording (under three minutes): start both services, add a fictional patient with today's follow-up, show the due queue, generate a draft, edit and save it, approve it, and show the approved/not-sent state. Then mark the follow-up complete and show it leaves the due queue. Keep the demo within the assessment's fictional-data requirement.

## Limitations and contribution note

- This local assessment demo has no authentication, role management, deployment setup, or real WhatsApp integration.
- Groq generation requires a valid API key and network access; without it, the deterministic `MOCK` workflow remains usable.
- The source and integration were implemented for this assessment with AI coding assistance. Update this contribution note if your personal implementation contribution differs; do not claim work you did not perform.
- A demonstration video is a submission deliverable and should be recorded by the candidate; this repository documents a concise demo sequence.
