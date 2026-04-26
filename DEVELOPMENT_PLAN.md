# PatternPal Development Plan

This document is the project tracking source of truth for milestones, implementation status, and delivery scope.

## Planning Principles

- **Mock-first approach:** Develop and test as much as possible with mock/fixture data before touching the real API.
- **Cost awareness:** Real API integration happens only in the final pre-launch milestone (Milestone 6).
- Prioritize core user flow first: generate → view → save → export.
- Keep output structured and reliable across both guidance modes.
- Use asynchronous processing for long-running generation/export work.
- Limit scope creep by shipping MVP before optional enhancements.
- Update this plan immediately after each milestone section is worked on so the current status stays accurate.

## Milestones

### Milestone 0: Project Foundation + Mock Infrastructure

**Goal:** Set up the project and testing infrastructure without touching the real API.

- [x] Confirm repository setup and branch workflow
- [x] Configure environment variables template (`.env.example`)
- [x] Add initial app shell and global layout
- [x] Document local setup and run instructions
- [x] Create mock response fixtures (garment instructions schema)
- [x] Set up test utilities and mock response factories
- [x] Define API response schema (TypeScript interfaces)


### Milestone 1: Frontend + Mock Integration

**Goal:** Build the complete UI using hardcoded mock responses; finalize schema and UX without API costs.

- [x] Build garment description form
- [x] Add mode selector (Casual/Professional)
- [x] Create structured results UI sections (materials, assembly, finishing, etc.)
- [x] Add loading and error states
- [x] Wire form submission to generate mock results
- [x] Test all UX paths with mock data
- [x] Verify results schema meets UX needs


### Milestone 2: API Generation Endpoint + Mocked Testing

**Goal:** Build the API layer and business logic, tested entirely with mock responses (no live API yet).

- [x] Create API endpoint for generation requests
- [x] Implement structured prompt templates
- [x] Implement LLM response parser into normalized schema
- [x] Add validation and fallback handling for incomplete outputs
- [x] Write unit tests using mock LLM responses
- [x] Add basic response caching layer
- [x] Test error cases with mock data


### Milestone 3: Persistence and Dashboard with Fixtures

**Goal:** Build database and persistence layer using fixture data; no real API yet.

- [x] Define Supabase schema (users/projects/instructions)
- [x] Add save generated project endpoint
- [x] Add list/fetch saved projects endpoints
- [x] Build dashboard for project history
- [x] Add project details view
- [x] Populate test database with fixture projects for UI testing


### Milestone 4: Background Jobs + Status Tracking (Mocked)

**Goal:** Integrate background job infrastructure; test with mocked generation calls.

- [x] Integrate Trigger.dev
- [x] Move generation to background worker
- [x] Add job status polling endpoint
- [x] Show generation progress in UI
- [x] Handle retry/failure states cleanly
- [x] Test full job flow with mocked LLM responses


### Milestone 5: PDF Export (Mocked)

**Goal:** Build PDF pipeline; test with fixture data.

- [x] Build printable HTML template
- [x] Generate PDF via Puppeteer in background job
- [x] Store PDF in Supabase Storage
- [x] Add download/export action in UI
- [x] Test PDF generation with fixture instructions

**Cost:** Minimal (Puppeteer, no LLM)

### Milestone 6: Pre-Launch Integration + Cost-Aware Testing

**Goal:** Swap in real API and validate end-to-end with tight cost controls.

- [x] Configure real API credentials and live environment
- [x] Replace mock response calls with real API integration
- [x] Run comprehensive end-to-end tests against real API (limited scope to control costs)
- [x] Add rate limiting and cost controls
- [x] Verify latency and failure handling on live API
- [x] Final documentation and demo prep


## Risks and Mitigations

### Risk: High API token costs during development

- Mitigation: Develop entirely with mocks through Milestone 5. Real API integration deferred to Milestone 6 (pre-launch). Cost is tightly controlled with E2E testing only.

### Risk: LLM output inconsistency

- Mitigation: Strict prompt format, parser validation, fallback repair prompts. Test all parsing logic with fixture data before live API use.

### Risk: Latency from generation and exports

- Mitigation: Background jobs, status tracking, and caching. Test with mocked API responses first; measure real latency in Milestone 6.

### Risk: Scope creep

- Mitigation: Prioritize core flow first (generate, view, save, export), defer optional features. Mock-first approach allows scope to be validated without API costs.

## Definition of Done (MVP)

PatternPal MVP is complete when a user can:

1. Enter garment description and select mode.
2. Receive structured instructions (materials, assembly, finishing).
3. Save and revisit projects.
4. Export a project as PDF.
