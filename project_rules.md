# Project Rules

This document defines how work should be done in this project.

## 1) Core Development Principles

- Prioritize correctness, readability, maintainability, and simplicity.
- Prefer small, focused changes over large, risky rewrites.
- Do not add dependencies unless they provide clear value.
- Preserve existing architecture and conventions unless a change is explicitly agreed on.

## 2) Implementation Workflow

- Clarify requirements before coding.
- Write or update tests before implementing behavior changes (test-first mindset).
- Implement the smallest change needed to satisfy requirements.
- Run linting, type checks, and tests after changes.
- Fix issues introduced by your changes before considering work complete.

## 3) Code Quality Standards

- Use clear names for variables, functions, and components.
- Keep functions and modules focused on one responsibility.
- Avoid duplicated logic; extract shared behavior when appropriate.
- Prefer explicit and readable code over clever shortcuts.
- Avoid dead code, commented-out code, and unnecessary complexity.

## 4) Comments and Documentation

- Add comments where intent is not obvious from code alone.
- Write comments that explain why something is done, not only what is done.
- Keep comments accurate when code changes.
- Keep public-facing docs up to date with behavior changes.
- Do not use emojis in technical documentation.

## 5) Testing Requirements

- Add unit tests for all new business logic.
- Update tests for all behavior changes.
- Include edge cases and error-path tests.
- Do not merge code that lacks appropriate test coverage for changed logic.
- Treat flaky tests as defects and resolve them.

## 6) Error Handling and Reliability

- Handle errors intentionally; do not swallow exceptions silently.
- Provide actionable error messages.
- Validate inputs at boundaries (APIs, forms, external data).
- Log enough context for debugging without exposing sensitive data.
- Regularly check for and address compiler, linter, and runtime errors.

## 7) Security and Data Practices

- Never hardcode secrets, tokens, or credentials.
- Use environment variables and secure configuration for sensitive values.
- Validate and sanitize untrusted input.
- Apply least-privilege access for integrations and services.

## 8) Pull Request and Review Expectations

- Keep pull requests small and reviewable.
- Include a clear summary of what changed and why.
- Reference related issues, tasks, or requirements.
- Ensure CI checks pass before requesting merge.
- Address review feedback fully or document rationale when not applying it.

## 9) Definition of Done

Work is done only when all of the following are true:

- Requirements are implemented.
- Relevant tests are written/updated and passing.
- Lint/type checks pass.
- No known errors introduced by the change remain unresolved.
- Documentation and comments affected by the change are updated.
