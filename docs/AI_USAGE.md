## 🤖 AI Complete Usage Log

This project was built using Claude (claude.ai) as a pair programming assistant throughout the 72-hour challenge. Here is a precise and honest account of every phase, what AI generated, what I decided, what I diagnosed, what I rejected, and why.

This log exists because AI usage is part of the evaluation.

---

### PHASE 1 - Architecture & Planning (Human-driven)

Every major architectural decision was made before writing a line of code:

- **Email-only auth from day one** - read the Figma carefully, saw no username field anywhere, made the correct call to override `AbstractBaseUser` before any migration ran. Changing this later requires dropping the database.
- **UUID primary keys** - security decision to prevent ID enumeration attacks, not suggested by AI
- **Stateless audio** - no storage, privacy-first, eliminates infrastructure entirely
- **Service layer** - dependency inversion to isolate external API contracts
- **Auto-save with debounce** - derived from Figma analysis, no save button visible anywhere in the design
- **Two separate queries on the dashboard** - `notes-all` for sidebar counts (never filtered), `notes` for the grid (filtered by category). My solution to the problem of sidebar counts breaking when a category filter is active.
- **Pre-seeded categories, no CRUD** - scope decision based on Figma, 2+ hours saved
- **Client-side search** - all notes already in memory via React Query, no round-trip needed
- **SQLite dev, PostgreSQL prod documented** - infrastructure pragmatism

AI scaffolded the initial Django project structure after these decisions were made.

---

### PHASE 2 - Backend Development

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

### PHASE 3 - Frontend Development

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

### PHASE 4 - UI Polish

**Decisions I made:**

- Playfair Display serif font — matched the editorial style from the Figma
- SVG icons over emoji for audio toolbar — consistent rendering across platforms
- Brown (`#5C3D2E`) as primary color for all interactive elements — works on all card backgrounds (orange, yellow, teal, green). Red would clash with yellow and teal category cards.
- Date bold and dark on cards, category name lighter — visual hierarchy

**AI assisted with:** CSS custom property patterns, `WebkitAppearance: none` to suppress browser native password icons.

---

### PHASE 5 - Testing Strategy

**Decisions I made:**

- Three SECURITY tests explicitly — user isolation is the most important correctness property. Proving it with tests is a senior engineering move.
- Test contract not output for AI endpoints, GPT output is non-deterministic. A test checking for a specific title would be flaky. Test the contract: 400 on empty input, 401 on no auth.
- `refresh_from_db()` after rejected updates, verify the database was not modified, not just the HTTP response code.

**Bug caught by my tests:**
The seed migration runs automatically on test DB creation. My `setUp` was also creating categories manually — double-seeding. The test failure exposed this immediately. I understood why, fixed it, and it became a point in the README about idempotent migrations being verifiable through tests.

**AI assisted with:** `APIClient` + `force_authenticate` patterns, test scaffolding.

---

### PHASE 6 - Swagger Documentation

**Decisions I made:**

- Merge SimpleJWT's `refresh/` into the `Authentication` tag — one clean group, shows attention to detail
- `auth=[]` on register and login — correctly marks public endpoints
- Tag structure: Authentication, Notes, AI Features — logical grouping that tells the API story

**AI assisted with:** `@extend_schema` syntax, `OpenApiParameter` patterns.

---

### PHASE 7 - Docker

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
