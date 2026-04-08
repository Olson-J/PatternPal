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

- [ ] Confirm repository setup and branch workflow
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

- [ ] Define Supabase schema (users/projects/instructions)
- [ ] Add save generated project endpoint
- [ ] Add list/fetch saved projects endpoints
- [ ] Build dashboard for project history
- [ ] Add project details view
- [ ] Populate test database with fixture projects for UI testing


### Milestone 4: Background Jobs + Status Tracking (Mocked)

**Goal:** Integrate background job infrastructure; test with mocked generation calls.

- [ ] Integrate Trigger.dev
- [ ] Move generation to background worker
- [ ] Add job status polling endpoint
- [ ] Show generation progress in UI
- [ ] Handle retry/failure states cleanly
- [ ] Test full job flow with mocked LLM responses


### Milestone 5: PDF Export (Mocked)

**Goal:** Build PDF pipeline; test with fixture data.

- [ ] Build printable HTML template
- [ ] Generate PDF via Puppeteer in background job
- [ ] Store PDF in Supabase Storage
- [ ] Add download/export action in UI
- [ ] Test PDF generation with fixture instructions

**Cost:** Minimal (Puppeteer, no LLM)

### Milestone 6: Pre-Launch Integration + Cost-Aware Testing

**Goal:** Swap in real API and validate end-to-end with tight cost controls.

- [ ] Configure real API credentials and live environment
- [ ] Replace mock response calls with real API integration
- [ ] Run comprehensive end-to-end tests against real API (limited scope to control costs)
- [ ] Measure token usage and costs per request
- [ ] Identify and optimize high-cost query paths
- [ ] Add rate limiting and cost controls
- [ ] Verify latency and failure handling on live API
- [ ] Final documentation and demo prep

**Cost:** Controlled and measured (run only essential end-to-end tests)

## Progress Tracking Board

Update this table as implementation advances. **Cost column tracks real API token usage only (Milestone 6).**

| Milestone | Status | API Used | Estimated Cost | Notes |
| --- | --- | --- | --- | --- |
| M0: Project Foundation + Mocks | In progress | None | $0 | Core mock infrastructure and docs are in place; branch workflow confirmation still pending |
| M1: Frontend + Mock Integration | Completed | None | $0 | Mock UI flow and schema rendering validated via automated tests |
| M2: API Logic (Mocked Testing) | Completed | None | $0 | Generate endpoint, parser, fallback validation, caching, and error-path tests are implemented with mocks |
| M3: Persistence + Fixtures | Not started | None | $0 | Database with fixture data |
| M4: Background Jobs (Mocked) | Not started | None | $0 | Job infrastructure, mocked generation |
| M5: PDF Export (Mocked) | Not started | None | $0 | PDF pipeline, tested with fixtures |
| M6: Pre-Launch Integration | Not started | Real API | TBD | Final E2E tests with real API; measure and optimize costs |

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
