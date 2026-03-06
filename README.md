# Turbo Notes

> A Notion-style notes app with AI-powered audio transcription and auto-title generation, built for Turbo AI's Senior Full Stack Engineer hiring challenge.

---

## 📺 Demo Video

[▶ Watch 5-minute walkthrough](#)

## 🔗 Repository

[github.com/paulo-cardoso71/turbo-ai-notes](https://github.com/paulo-cardoso71/turbo-ai-notes)

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

![Turbo Notes Architecture](./docs/system.png)

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

Full interactive documentation available at `http://localhost:8000/api/docs/` (Swagger UI) when the server is running.

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

**20 tests. All passing.**

```
accounts/ — 6 tests
  ✅ Register with valid credentials returns tokens
  ✅ Register with duplicate email returns 400
  ✅ Register without email returns 400
  ✅ Login with valid credentials returns tokens
  ✅ Login with wrong password returns 401
  ✅ Login with nonexistent email returns 401 — same error prevents email enumeration

notes/ — 11 tests
  ✅ Unauthenticated request returns 401
  ✅ User can create a note
  ✅ User only sees their own notes                      ← SECURITY
  ✅ User cannot access another user's note by UUID      ← SECURITY
  ✅ User can update their own note
  ✅ User cannot update another user's note              ← SECURITY
  ✅ User can delete their own note
  ✅ Category filter returns correct notes only
  ✅ Search filters notes by title
  ✅ AI title endpoint rejects empty content
  ✅ AI title endpoint requires authentication

categories/ — 3 tests
  ✅ Authenticated user can list categories
  ✅ Categories have correct fields (id, name, color)
  ✅ Unauthenticated user cannot list categories
```

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
| Rich text editor                 | Markdown, bullet points, formatting        |
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

This project was built using Claude (claude.ai) as a pair programming assistant throughout the 72-hour challenge. Here is a precise and honest account of every phase, what AI generated, what I decided, what I diagnosed, what I rejected, and why.

This log exists because AI usage is part of the evaluation.

---

### PHASE 1 — Architecture & Planning (Human-driven)

Every major architectural decision was made before writing a line of code:

- **Email-only auth from day one** — read the Figma carefully, saw no username field anywhere, made the correct call to override `AbstractBaseUser` before any migration ran. Changing this later requires dropping the database.
- **UUID primary keys** — security decision to prevent ID enumeration attacks, not suggested by AI
- **Stateless audio** — no storage, privacy-first, eliminates infrastructure entirely
- **Service layer** — dependency inversion to isolate external API contracts
- **Auto-save with debounce** — derived from Figma analysis, no save button visible anywhere in the design
- **Two separate queries on the dashboard** — `notes-all` for sidebar counts (never filtered), `notes` for the grid (filtered by category). My solution to the problem of sidebar counts breaking when a category filter is active.
- **Pre-seeded categories, no CRUD** — scope decision based on Figma, 2+ hours saved
- **Client-side search** — all notes already in memory via React Query, no round-trip needed
- **SQLite dev, PostgreSQL prod documented** — infrastructure pragmatism

AI scaffolded the initial Django project structure after these decisions were made.

---

### PHASE 2 — Backend Development

**Decisions I made:**

- `get_queryset` always filters by `request.user` on every view — user data isolation is non-negotiable
- `select_related('category')` on every queryset — identified the N+1 query risk during my own code review
- `perform_create` attaches the authenticated user automatically — frontend never sends user ID (security by design)
- `http_method_names = ['get', 'patch', 'delete']` — no PUT, only PATCH (correct REST semantics)
- 25MB file size guard on transcription — abuse prevention
- Same "Invalid credentials" error for wrong password and nonexistent email — prevents email enumeration attacks
- `language='en'` on Whisper — diagnosed and fixed after discovering Whisper was transcribing silence as Korean

**Bug I diagnosed and fixed myself:**
Django's `InMemoryUploadedFile` cannot be passed directly to the OpenAI SDK. It must be converted to a `(filename, bytes, mimetype)` tuple. I diagnosed this from the SDK exception, understood the root cause, and implemented the fix. AI confirmed the fix after I identified it.

**AI assisted with:** DRF serializer boilerplate, JWT configuration, CORS setup.

---

### PHASE 3 — Frontend Development

**Decisions I made:**

- Two React Query keys (`notes-all` and `notes`) — my solution to a real data architecture problem
- `queryClient.invalidateQueries` invalidates both queries on modal close — grid and sidebar counts stay in sync
- Axios interceptor for JWT — one place, not repeated in every request
- Auto-title triggers on modal close, not on keystroke — one generation per save, not per character typed
- Silent fail on all AI features — AI enhances the app, never blocks it
- Diagnosed and fixed Turbopack crash from accented character (`Á`) in Windows file path — moved project, recreated venv

**What I rejected from AI:**

- AI suggested `useEffect` for auth state initialization → I replaced it with a lazy `useState` initializer (eliminates cascading renders)
- AI suggested separate loading states per AI feature → I simplified to unified graceful degradation

**AI assisted with:** Component scaffolding (Sidebar, NoteCard, NoteModal), debounce pattern, Tailwind masonry classes.

---

### PHASE 4 — UI Polish

**Decisions I made:**

- Playfair Display serif font — matched the editorial style from the Figma
- SVG icons over emoji for audio toolbar — consistent rendering across platforms
- Brown (`#5C3D2E`) as primary color for all interactive elements — works on all card backgrounds (orange, yellow, teal, green). Red would clash with yellow and teal category cards.
- Date bold and dark on cards, category name lighter — visual hierarchy

**AI assisted with:** CSS custom property patterns, `WebkitAppearance: none` to suppress browser native password icons.

---

### PHASE 5 — Testing Strategy

**Decisions I made:**

- Three SECURITY tests explicitly — user isolation is the most important correctness property. Proving it with tests is a senior engineering move.
- Test contract not output for AI endpoints, GPT output is non-deterministic. A test checking for a specific title would be flaky. Test the contract: 400 on empty input, 401 on no auth.
- `refresh_from_db()` after rejected updates, verify the database was not modified, not just the HTTP response code.

**Bug caught by my tests:**
The seed migration runs automatically on test DB creation. My `setUp` was also creating categories manually — double-seeding. The test failure exposed this immediately. I understood why, fixed it, and it became a point in the README about idempotent migrations being verifiable through tests.

**AI assisted with:** `APIClient` + `force_authenticate` patterns, test scaffolding.

---

### PHASE 6 — Swagger Documentation

**Decisions I made:**

- Merge SimpleJWT's `refresh/` into the `Authentication` tag — one clean group, shows attention to detail
- `auth=[]` on register and login — correctly marks public endpoints
- Tag structure: Authentication, Notes, AI Features — logical grouping that tells the API story

**AI assisted with:** `@extend_schema` syntax, `OpenApiParameter` patterns.

---

### PHASE 7 — Docker

**Decisions I made:**

- SQLite in Docker, not PostgreSQL — zero setup friction for the evaluator matters more than production parity for a challenge
- Dev server in Docker (`next dev`) — correct for a challenge environment
- `/app/node_modules` anonymous volume — prevents Windows `node_modules` from overwriting Linux container modules

**Bug I caught:**
Frontend container was running `next start` (requires a production build) instead of `next dev`. Read the error, identified the cause, fixed the Dockerfile CMD.

**AI assisted with:** Dockerfile syntax, layer caching strategy, docker-compose structure.

---

### The Full Summary

| Category                                                                                                                     | Human | AI  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----- | --- |
| All 15 architectural decisions                                                                                               | ✅    | ❌  |
| Security design (UUID, isolation, enumeration prevention)                                                                    | ✅    | ❌  |
| Scope decisions (what to build vs cut)                                                                                       | ✅    | ❌  |
| All bug diagnosis (Turbopack path, InMemoryUploadedFile, Korean transcription, seed double-creation, next start vs next dev) | ✅    | ❌  |
| Data model design                                                                                                            | ✅    | ❌  |
| Test strategy and SECURITY tests                                                                                             | ✅    | ❌  |
| UI design decisions (color system, font, icon approach)                                                                      | ✅    | ❌  |
| What to reject from AI suggestions                                                                                           | ✅    | ❌  |
| Boilerplate and scaffolding                                                                                                  | ❌    | ✅  |
| SDK patterns (after human diagnosis)                                                                                         | ❌    | ✅  |
| Syntax and configuration lookup                                                                                              | ❌    | ✅  |

---

### How AI was used

AI was used as a tool to accelerate implementation of decisions already made, not to make decisions. Every AI suggestion was reviewed before being applied. Several were rejected or modified. This is the way i see how to integrate AI into a professional engineering workflow.

---

## 👤 Author

**Paulo Cardoso**
Full Stack Engineer, I built this application as a demonstration of adaptability, engineering judgment, and correct AI-augmented development.

[LinkedIn](https://www.linkedin.com/in/paulo-cardoso71/)
