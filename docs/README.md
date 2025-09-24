# QIVR Documentation Home

Welcome to the central hub for product, engineering, and operations references. Each guide below stays intentionally concise and points to the source files or scripts you need when digging deeper.

## What do you need?

| Area | Start Here | Highlights |
| --- | --- | --- |
| New machine or clean workspace | [setup.md](./setup.md) | Prerequisites, environment files, service ports, quick start commands |
| Understand the system | [architecture.md](./architecture.md) | Backend solution layout, React app structure, shared packages, data flow |
| Day-to-day development | [development.md](./development.md) | Turbo/NPM scripts, coding conventions, branching, useful tooling |
| Running tests | [testing.md](./testing.md) | .NET, React, end-to-end scripts, recommended coverage cadence |
| Operating in local/hosted envs | [operations.md](./operations.md) | Docker helpers, migrations, logs, deployment outline, break/fix playbooks |
| Security expectations | [security.md](./security.md) | Secrets management, auth configuration, review cadence |

Additional references:
- **Root** – [README.md](../README.md), [AGENTS.md](../AGENTS.md), [CHANGELOG.md](../CHANGELOG.md)
- **Auth specifics** – [AWS Cognito setup](./AWS_COGNITO_SETUP.md)
- **Historical context** – archival notes live under [docs/archive/](./archive)

## Contributing to the docs

1. Keep updates in the closest relevant file; avoid duplicating the same instructions across documents.
2. If a document becomes predominantly historical or speculative, move it to `docs/archive/` with a short note.
3. Cross-reference scripts or source files using relative paths so readers can jump straight into the codebase.
4. Append a short _Last updated_ note when materially changing guidance that others rely on.

_Questions or stale sections? Raise an issue or leave a TODO block so we know to revisit._
