# Development Reference

Use this guide for the routines and conventions we expect on day-to-day feature work.

## Tooling & scripts

| Task | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Start all dev servers | `npm run backend:dev`, `npm run clinic:dev`, `npm run patient:dev`, `npm run widget:dev` |
| Build everything | `npm run build` |
| Clean node modules & caches | `npm run clean` |
| Apply database migrations | `npm run db:migrate` |
| Run lint across workspaces | `npm run lint` |
| Format staged files | `npx lint-staged` (runs pre-commit) |

Turbo handles workspaces; the scripts above fan out to each app/service as needed.

## Branching & commits

- Branch naming: `feature/<short-desc>`, `bugfix/<ticket>`, or `chore/<task>`.
- Keep commits focused and use imperative subjects (e.g., `Add patient dashboard widgets`).
- Reference AGENTS.md for PR expectations (checklist, reviewers, screenshots/curl output for UI/API work).
- Rebase over merge when syncing with `main` to keep history linear.

## Coding standards

- **TypeScript/React** – 2-space indent, follow the ESLint and Prettier rules configured in each app. Avoid introducing `any`; model DTOs in `apps/*/src/types` or shared packages.
- **C#** – Stick to .NET defaults: namespaces match folder structure, classes in PascalCase, local variables in camelCase, and nullable reference types enabled.
- **HTTP client usage** – Prefer `@qivr/http` wrappers across apps. If you need a custom fetch, encapsulate it in `packages/` so others can reuse it.
- **Feature folders** – For new UI modules, create a `src/features/<domain>` folder with `components/`, `hooks/`, and `types/` to mirror existing structure.
- **State management** – Use React Query for server state and keep local state inside components or feature-specific hooks. Zustand is reserved for auth/session stores.

## Useful scripts & helpers

- `start-all.sh` / `stop-all.sh` – Manage API + frontends together; useful for demos.
- `apps/check-status.sh` – Lightweight smoke tests (lint + basic unit tests) used before pushes.
- `test-auth-flow.mjs` – Exercises a browser-based Cognito login; handy for diagnosing auth regressions.
- `test-api-migration.ts` – Validates API migrations before touching production data.

## Documentation touchpoints

When you add or change functionality:
1. Update the relevant document under `/docs`. The [docs README](./README.md) shows where content should live.
2. Mention the update in your PR description so reviewers know new instructions exist.
3. Archive docs that no longer reflect reality rather than letting them rot in place.

## Feedback loop

Spot a friction point? Capture it in an issue or drop a note in `/docs/archive/notes/` so we can fold it back into the official guides after the fix.
