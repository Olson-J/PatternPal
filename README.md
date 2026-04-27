# PatternPal

PatternPal is a web application that helps sewing enthusiasts, especially historical garment makers, generate structured garment construction guidance.

Users describe a garment they want to make (for example, "18th-century stays"), choose a guidance mode, and receive organized results including materials, assembly steps, and finishing guidance.

## Core Goal

PatternPal does not generate exact drafting measurements. Instead, it generates adaptable, structured construction guidance that helps users approach and complete a garment project.

## Output Modes

- Casual mode: beginner-friendly instructions, modern shortcuts, accessible methods.
- Professional mode: historically informed and higher-quality tailoring practices.

## Planned Tech Stack

- Frontend: Next.js (React) + Tailwind CSS
- Backend/API: Next.js API routes
- Database: PostgreSQL via Supabase
- Background jobs: Trigger.dev
- LLM: OpenAI API
- File/PDF storage: Supabase Storage
- PDF generation: Puppeteer

## System Components

### Frontend

- Main garment input form
- Casual/Professional mode toggle
- Structured instruction viewer (materials, assembly, finishing)
- Saved-project dashboard
- Job loading/progress states

### Backend API

- Endpoint to submit garment + mode
- Endpoints to save and retrieve projects
- Optional authentication (time permitting)

### LLM Integration

- Prompt templates for structured output
- Mode-specific behavior (casual vs professional)
- Output parser/normalizer for consistent sections
- Caching strategy to reduce repeated generation costs

### Database

- Users
- Projects
- Generated instructions
- Proper relationships between users and projects

### Background Worker

- Async instruction generation jobs
- Async PDF generation jobs
- Job status tracking for frontend polling

### PDF Export

- Printable instruction views via Puppeteer
- Download and save flows

## Development Tracking

The development milestones, progress board, risks, and MVP definition now live in:

- [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)

## Getting Started

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Supabase Project Persistence

Project save/list/fetch endpoints now support Supabase-backed persistence for users/projects/instructions.

Set these environment variables to enable it:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
PATTERNPAL_DEFAULT_USER_ID=00000000-0000-0000-0000-000000000001
```

Notes:

- If Supabase env vars are not set, the app falls back to fixture-backed in-memory storage.
- If `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set, project and export APIs require a valid Supabase access token (Bearer token or `sb-access-token` cookie).
- Header-based user override (`x-user-id`) is only used when Supabase Auth is not enabled.

## Signup Flow

- Visit `/auth/sign-up` to create an account with email and password.
- Use `/auth/sign-in` to log in with an existing account.
- The page uses Supabase Auth in the browser and attempts to upsert a profile row in `users` when a session is available.
- If email confirmation is enabled, Supabase may not return an immediate session; in that case, confirm by email first, then sign in.

## Auth Entry Behavior

- When browser Supabase auth is configured, the app defaults to the sign-in page for unauthenticated users.
- The sign-in page includes a `Continue as guest` option.
- Guest mode allows generating instructions only; saving projects and PDF export are disabled until sign-in.

## Background Worker Modes (Trigger.dev vs Local Fallback)

PatternPal supports two background worker modes:

1. Local fallback worker mode (default for local development)
2. Trigger.dev worker mode (optional, external worker)

When Trigger.dev is not configured, background generation and PDF export jobs still run using an in-process fallback queue.

To enable Trigger.dev worker mode, set these environment variables:

```bash
TRIGGER_SECRET_KEY=your-trigger-secret
TRIGGER_API_URL=https://api.trigger.dev
TRIGGER_PROJECT_REF=your-project-ref
USE_TRIGGER_WORKER=true
```

Notes:

- If `USE_TRIGGER_WORKER` is false (or Trigger vars are missing), the app uses local fallback worker mode.
- This fallback mode is suitable for local development and demos.
- Trigger.dev mode is recommended when demonstrating external async job processing.

## Environment Setup

Use [`.env.example`](.env.example) as the template for local configuration.

```bash
cp .env.example .env.local
```

Then fill in real values for your environment.

Do not commit `.env.local`.

## Submission Packaging (Clean Zip)

To create a clean submission folder that excludes `node_modules` and `.env.local`, create a fresh clone and zip that clone.

### Option A: Fresh clone from local repo path

From a directory outside your project:

```bash
git clone --depth 1 /home/julie/spring2026/4610/patternpal patternpal-submit
cd patternpal-submit
```

Then create the zip:

```bash
zip -r patternpal-submit.zip patternpal-submit
```

### Option B: Git archive (single command export)

From your project root:

```bash
git archive --format=zip --output=patternpal-submit.zip HEAD
```

`git archive` exports only tracked files from Git, so it naturally excludes ignored files like `.env.local` and `node_modules`.

Before zipping, run a final verification:

```bash
npm run build
npm run test -- --run
```