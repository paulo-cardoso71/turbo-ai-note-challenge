# Turbo Notes

> A Notion-style notes app with AI-powered audio transcription and auto-title generation — built for Turbo AI's Senior Full Stack Engineer hiring challenge.

---

## 📺 Demo Video

[▶ Watch 5-minute walkthrough](#) ← replace with your link

## 🔗 Repository

[github.com/your-username/turbo-ai-notes](#) ← replace with your link

---

## ✨ Features

| Feature                                           | Status |
| ------------------------------------------------- | ------ |
| Email/password authentication (JWT)               | ✅     |
| Create, edit, delete notes                        | ✅     |
| Auto-save (1s debounce — no save button needed)   | ✅     |
| Categorize notes with color-coded categories      | ✅     |
| Masonry/grid layout                               | ✅     |
| Audio recording → AI transcription → text in note | ✅     |
| AI auto-title generation from note content        | ✅     |
| Filter notes by category                          | ✅     |
| Responsive design                                 | ✅     |
| Swagger API documentation                         | ✅     |
| Docker Compose for one-command setup              | ✅     |

---

## 🚀 Quick Start (Docker — Recommended)

```bash
git clone https://github.com/your-username/turbo-ai-notes.git
cd turbo-ai-notes
cp backend/.env.example backend/.env
# Fill in TRANSCRIPTION_API_KEY in backend/.env
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Swagger docs: http://localhost:8000/api/docs/

---

## 🛠️ Manual Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
cp .env.example .env
# Fill in your values in .env
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

---

## ⚙️ Environment Variables

### `backend/.env`

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
TRANSCRIPTION_API_KEY=sk-your-openai-key-here
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                   │
│  Next.js 16 (App Router) — http://localhost:3000                │
│                                                                  │
│  /login          AuthContext (JWT in cookies)                   │
│  /register       React Query (server state)                     │
│  / (dashboard)   Axios (API client + interceptors)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST/JSON + JWT Bearer token
┌──────────────────────────▼──────────────────────────────────────┐
│               Django 6 + Django REST Framework                   │
│               http://localhost:8000                              │
│                                                                  │
│  accounts/   → /api/auth/     JWT register/login/refresh        │
│  categories/ → /api/categories/  Read-only, seeded              │
│  notes/      → /api/notes/    Full CRUD (user-scoped)           │
│              → /api/notes/transcribe/  Stateless audio          │
│  services/   → transcription.py  OpenAI Whisper integration     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  SQLite (dev) / PostgreSQL (prod)                               │
│                                                                  │
│  accounts_user         id, email, password(hashed)              │
│  categories_category   id, name, color(hex)                     │
│  notes_note            id(UUID), user_id, category_id,          │
│                        title, content, created_at, updated_at   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  OpenAI API                                                      │
│  Whisper model  → audio transcription                           │
│  GPT-4o-mini    → auto-title generation                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Technical Decisions & Trade-offs

### 1. Django over Node.js (backend)

**Decision:** Use Django as specified, despite being primarily a Node.js engineer.
**Rationale:** Adaptability to constraints is a more valuable signal than framework familiarity. Django's batteries-included approach (ORM, migrations, admin, auth) accelerated development significantly.
**Trade-off:** Less idiomatic Django patterns in places — a Node.js mental model influenced some decisions. Would improve with more Django exposure.

### 2. Email-only authentication (no username)

**Decision:** Custom `AbstractBaseUser` with `email` as `USERNAME_FIELD`.
**Rationale:** The Figma shows only email/password fields. Django's default `username` field would have required workarounds. Overriding from the start is the correct pattern — changing the user model after initial migrations is painful and risky.
**Trade-off:** Slightly more boilerplate upfront. Eliminates all downstream migration complexity.

### 3. JWT over Django Sessions

**Decision:** `djangorestframework-simplejwt` for stateless JWT authentication.
**Rationale:** The frontend is a separate Next.js app on a different port. Session-based auth requires cookie sharing across origins, which adds CSRF complexity. JWT stored in `httpOnly` cookies gives us stateless auth that works cleanly across origins.
**Trade-off:** Token refresh logic required. No server-side session invalidation (mitigated by short access token lifetime: 1 day).

### 4. UUID primary keys for Notes

**Decision:** `UUIDField` as primary key instead of sequential integers.
**Rationale:** Sequential IDs leak information — a user can guess `/api/notes/1/` and attempt to access other users' data. UUIDs are unguessable. Defense in depth alongside the user-scoped queryset filter.
**Trade-off:** Slightly larger index size. Negligible at this scale.

### 5. Stateless audio transcription

**Decision:** Audio files are never stored. Receive → transcribe → return text → discard.
**Rationale:** Audio files are large and expensive to store. We don't need playback — only the text. This eliminates storage infrastructure, reduces attack surface, and sidesteps GDPR/privacy concerns around storing voice recordings.
**Trade-off:** No audio history. Users cannot replay their recordings. Acceptable for a notes app.

### 6. Service layer for external API calls

**Decision:** All OpenAI calls isolated in `services/transcription.py` and `services/ai_title.py`.
**Rationale:** Views should be thin. If OpenAI changes their API or we switch providers, we change one file. The view doesn't care how transcription works — only that it returns a string.
**Trade-off:** Extra abstraction layer. Justified because external API contracts change.

### 7. Auto-save with 1s debounce (no save button)

**Decision:** Notion-style auto-save triggered 1 second after the user stops typing.
**Rationale:** Eliminates cognitive load — users never lose work. Matches modern note-taking UX patterns. The "save on close" safety net catches any state missed by the debounce timer.
**Trade-off:** More API calls than explicit save. At this scale it's fine. At 100k users, we'd batch updates or use WebSockets.

### 8. React Query over Redux/Zustand

**Decision:** `@tanstack/react-query` for server state, React Context for auth state only.
**Rationale:** Redux/Zustand for two pieces of global state (tokens + email) is severe over-engineering. React Query handles caching, refetching, and invalidation for server data. Right tool for each job.
**Trade-off:** Two systems to understand. The separation is intentional and documented.

### 9. CSS Columns for masonry layout

**Decision:** Pure CSS `columns` property instead of a JavaScript masonry library.
**Rationale:** CSS columns achieves the masonry effect with zero JavaScript, zero dependencies, zero layout calculation. Performant, simple, maintainable.
**Trade-off:** Column-first ordering (top-to-bottom then left-to-right) instead of row-first. Acceptable for a notes app where chronological order is less critical than visual density.

### 10. SQLite for development → PostgreSQL for production

**Decision:** SQLite in dev, documented PostgreSQL switch for production.
**Rationale:** SQLite requires zero infrastructure, enabling instant setup. The PostgreSQL migration is a single `settings.py` change (already documented). Don't add infrastructure complexity before it's needed.
**Trade-off:** SQLite doesn't perfectly replicate PostgreSQL behaviour (e.g. case sensitivity in LIKE queries). Run integration tests against PostgreSQL in CI before deploying.

### 11. Pre-seeded categories (not user-created)

**Decision:** 3 global categories seeded via a data migration. No category management UI.
**Rationale:** The Figma shows fixed categories. Building a category CRUD system would cost 2+ hours for a feature nobody asked for. The seed migration is idempotent — safe to run multiple times.
**Trade-off:** Users cannot create custom categories. Clear scope decision for a 72-hour challenge.

### 12. OpenAI Whisper over AssemblyAI

**Decision:** OpenAI Whisper API for audio transcription.
**Rationale:** Single synchronous API call vs. AssemblyAI's two-step async flow (upload → poll). Less code, fewer failure points, faster response. Both OpenAI integrations (Whisper + GPT) share one API key and one SDK.
**Trade-off:** Small cost per minute of audio (~$0.006/min). Acceptable for this use case.

---

## 📐 API Reference

Full interactive documentation available at `/api/docs/` (Swagger UI) when the server is running.

### Auth

```
POST /api/auth/register/   {email, password} → {email, tokens}
POST /api/auth/login/      {email, password} → {email, tokens}
POST /api/auth/refresh/    {refresh}         → {access}
```

### Categories

```
GET /api/categories/   → [{id, name, color}]
```

### Notes (all require Authorization: Bearer <token>)

```
GET    /api/notes/              List notes (filter: ?category=id)
POST   /api/notes/              Create note
GET    /api/notes/:id/          Get note
PATCH  /api/notes/:id/          Update note (partial)
DELETE /api/notes/:id/          Delete note
POST   /api/notes/transcribe/   Audio → text (multipart/form-data)
POST   /api/notes/generate-title/ {content} → {title}
```

---

## 🧪 Testing

```bash
cd backend
python manage.py test
```

Tests cover:

- User registration and login
- JWT token validation
- Notes CRUD with user isolation
- Category seeding
- Transcription endpoint (mocked OpenAI)

---

## 🐳 Docker

```yaml
# docker-compose.yml
services:
  backend: Django on port 8000
  frontend: Next.js on port 3000
```

```bash
docker-compose up --build    # start everything
docker-compose down          # stop
docker-compose logs backend  # view backend logs
```

---

## 📈 What I'd Improve With More Time

| Improvement                      | Why                                        |
| -------------------------------- | ------------------------------------------ |
| WebSocket for real-time sync     | Notes update across tabs/devices instantly |
| Rich text editor (Tiptap)        | Markdown, bullet points, formatting        |
| Note sharing / collaboration     | Multi-user editing                         |
| Rate limiting on transcription   | Prevent API abuse and runaway costs        |
| Redis caching for categories     | Avoid DB hit on every page load            |
| S3 for optional file attachments | Future attachment support                  |
| Full test coverage (>80%)        | Currently covers critical paths only       |
| Refresh token rotation           | Better security posture                    |
| CI/CD pipeline (GitHub Actions)  | Automated test + deploy on push            |
| PostgreSQL in Docker Compose     | Production-parity dev environment          |

---

## 🤖 AI Usage Log

This project was built using Claude (claude.ai) as a pair programming assistant throughout the 72-hour challenge. Here is a precise account of what AI did and did not do.

### What AI assisted with

**Django scaffold & boilerplate**
Generated initial project structure, `settings.py` configuration, custom `AbstractBaseUser` model, DRF serializer patterns, and URL routing. Saved approximately 4 hours of Django documentation reading for an engineer primarily experienced in Node.js.

**OpenAI SDK integration bug**
Identified that Django's `InMemoryUploadedFile` cannot be passed directly to the OpenAI SDK — it must be converted to a `(filename, bytes, mimetype)` tuple. Diagnosing this manually would have cost 1-2 hours.

**React Query patterns**
Suggested the `queryClient.invalidateQueries()` pattern over manual `refetch()` calls for cache invalidation after mutations. More correct and idiomatic.

**Component scaffolding**
Generated boilerplate for React components (Sidebar, NoteCard, NoteModal) which were then reviewed, adjusted, and debugged manually.

**ESLint fixes**
Identified correct TypeScript patterns to replace `err: any` with properly typed error handling.

### What AI did NOT do

- Choose the tech stack (specified by challenge)
- Design the data model (UUID strategy, nullable category FK, stateless audio — all human decisions)
- Decide what features to cut vs. keep (scope decisions were human)
- Fix the venv path issue (diagnosed by reading the error, not AI)
- Identify the N+1 query risk (human code review)
- Choose auto-save over explicit save (human UX decision from Figma analysis)
- Write the README (human-authored, AI-assisted for structure)
- Record the demo video
- Make any architectural trade-offs (all documented above as human decisions)

### How AI was used correctly

AI was used as a tool to accelerate implementation of decisions already made — not to make decisions. Every AI suggestion was reviewed before being applied. Several were rejected or modified. This is the correct way to integrate AI into a professional engineering workflow.

---

## 👤 Author

**Paulo Cardoso**
Full Stack Engineer (Node.js / React / Next.js)
Transitioning to Python/Django for this challenge as a demonstration of adaptability.

[LinkedIn](#) | [GitHub](#)
