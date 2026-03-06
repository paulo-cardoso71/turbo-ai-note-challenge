# Turbo Notes — Claude Code Context

## Project

Notion-style notes app with AI audio transcription and auto-title generation.
Built for Turbo AI's Senior Full Stack Engineer hiring challenge.

## Stack

- Backend: Django 6 + Django REST Framework, port 8000
- Frontend: Next.js 16 (App Router), React 19, Tailwind v4, port 3000
- Auth: JWT via djangorestframework-simplejwt
- AI: OpenAI Whisper (transcription) + GPT-4o-mini (auto-title)
- DB: SQLite (dev) → PostgreSQL (prod, single settings.py change)
- Docs: Swagger UI at /api/docs/ via drf-spectacular

## Project Structure

```
turbo-ai-notes/
├── backend/
│   ├── accounts/     # Custom User model (email-only auth)
│   ├── categories/   # Pre-seeded, read-only categories
│   ├── notes/        # Full CRUD, user-scoped, UUID PKs
│   ├── services/     # OpenAI integrations (transcription, ai_title)
│   └── core/         # settings, urls, wsgi
├── frontend/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # Sidebar, NoteCard, NoteModal
│   ├── context/      # AuthContext (JWT state)
│   ├── lib/          # Axios instance with JWT interceptor
│   └── types/        # TypeScript interfaces
└── docker-compose.yml
```

## Key Decisions

- UUID primary keys on notes (prevents enumeration attacks)
- User-scoped querysets (never expose cross-user data)
- Stateless audio (receive → transcribe → discard, never stored)
- Service layer for all OpenAI calls (swap providers in one file)
- Two React Query caches: filtered notes for grid, all notes for sidebar counts
- Client-side search (data already loaded, no extra API call)
- Auto-save 1s debounce + save-on-close safety net

## Running the Project

```bash
# Docker
docker-compose up --build

# Manual
cd backend && python manage.py runserver
cd frontend && npm run dev

# Tests
cd backend && python manage.py test
```

## Environment Variables

backend/.env requires: SECRET_KEY, DEBUG, ALLOWED_HOSTS, TRANSCRIPTION_API_KEY
frontend/.env.local requires: NEXT_PUBLIC_API_URL

## Current Test Coverage

20 backend tests covering auth, notes CRUD, user isolation (security),
category seeding, search, and AI endpoint contracts.
