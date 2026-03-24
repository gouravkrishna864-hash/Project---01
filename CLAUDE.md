# CLAUDE.md — AI Assistant Guide for Project---01

## Project Overview

**Project---01** is a YouTube channel automation tool. The repository is currently in early initialization — no source code, dependencies, or infrastructure have been added yet. This document establishes conventions, workflows, and guidelines for AI assistants (and human contributors) as the project is built out.

---

## Repository State (as of 2026-03-24)

```
Project---01/
├── .git/
├── README.md       # Minimal project description
└── CLAUDE.md       # This file
```

**Branches:**
- `master` — primary branch
- `origin/main` — remote default branch
- `claude/add-claude-documentation-whNkq` — documentation branch (active)

No source code, package files, tests, or CI/CD configuration exist yet.

---

## Development Conventions (to be followed as code is added)

### Language & Stack Decision

The technology stack has not yet been chosen. When selecting one, prefer:
- **Python** for scripting, API integrations, and automation pipelines (YouTube Data API v3 is well-supported)
- **Node.js/TypeScript** if a web dashboard or real-time features are needed
- Document the choice in this file once decided

### Git Workflow

- All feature work goes on a dedicated branch (e.g., `feature/<description>`)
- Branch names use lowercase kebab-case
- Commit messages follow the format: `type: short description` (e.g., `feat: add video upload scheduler`)
- Commit types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`
- Never commit secrets, API keys, or OAuth tokens — use `.env` files and add them to `.gitignore`

### Project Structure (recommended when adding code)

```
Project---01/
├── src/                    # Source code
│   ├── api/                # YouTube API client wrappers
│   ├── scheduler/          # Scheduling logic
│   ├── uploader/           # Video upload automation
│   └── utils/              # Shared utilities
├── tests/                  # Unit and integration tests
├── scripts/                # Dev/ops helper scripts
├── .env.example            # Template for required environment variables
├── .gitignore
├── README.md
└── CLAUDE.md               # This file
```

### Environment Variables

When integrating with YouTube APIs, the following env vars will be needed:

```
YOUTUBE_API_KEY=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
CHANNEL_ID=
```

Always provide a `.env.example` with placeholder values. Never commit `.env`.

---

## Key Workflows for AI Assistants

### Adding New Features

1. Read existing source files before modifying anything
2. Follow the directory structure above
3. Add tests alongside new code in `tests/`
4. Update `README.md` if user-facing behavior changes
5. Do not introduce new dependencies without noting them in the relevant package file

### Modifying Automation Logic

- YouTube's API has strict quota limits — avoid polling; prefer webhooks or scheduled batches
- Validate all API responses before processing
- Log errors with context (timestamp, operation, response code)

### Working with Secrets

- Never hardcode credentials in source files
- Load all secrets from environment variables
- If a key appears in a diff, flag it immediately to the user before committing

### Testing

- Write tests for all automation logic, especially scheduling and API interaction
- Mock external API calls in unit tests
- Integration tests should only run against a test/sandbox YouTube account

---

## What AI Assistants Should NOT Do

- Do not push directly to `master` or `main`
- Do not add features beyond what is explicitly requested
- Do not delete files without confirming with the user
- Do not commit `.env` or any file containing credentials
- Do not add unnecessary abstractions — keep automation scripts simple and readable

---

## Updating This File

When the project stack is finalized or the codebase grows significantly, update this CLAUDE.md to reflect:
- The actual tech stack and dependencies
- Real build/test/run commands
- Actual directory structure
- CI/CD pipeline details
- Any project-specific quirks or gotchas
