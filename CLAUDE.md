# YouTube Channel Automation — Claude Code Guide

## Project Overview

This repository automates a YouTube channel: content generation, scheduling, metadata management, and publishing workflows.

## Remote Control Setup

This project is configured for Claude Code remote control, allowing you to trigger automation tasks via the Claude API without opening an interactive session.

### Triggering Tasks Remotely

Use the Claude Code CLI:

```bash
claude --remote <trigger-id> "Generate a video script about <topic>"
```

Or via the API using a remote trigger (see `.claude/triggers.json` for defined triggers).

### Available Automation Tasks

| Task | Description |
|------|-------------|
| `generate-script` | Generate a YouTube video script from a topic |
| `create-metadata` | Create title, description, and tags for a video |
| `schedule-post` | Schedule a video for publishing |
| `analyze-channel` | Analyze channel performance metrics |
| `bulk-update` | Bulk update descriptions or tags across videos |

## Repository Structure

```
Project---01/
├── CLAUDE.md               # This file
├── .claude/
│   ├── settings.json       # Claude Code settings
│   └── triggers.json       # Remote trigger definitions
├── scripts/                # Automation scripts
│   ├── generate_script.py  # Video script generation
│   ├── create_metadata.py  # SEO metadata creation
│   └── scheduler.py        # Publishing scheduler
├── .github/
│   └── workflows/
│       └── automation.yml  # GitHub Actions automation
└── config/
    └── channel.json        # Channel configuration
```

## Environment Variables

```
YOUTUBE_API_KEY=        # YouTube Data API v3 key
YOUTUBE_CHANNEL_ID=     # Your channel ID
ANTHROPIC_API_KEY=      # For Claude-powered content generation
```

## Git Workflow

- `main` — stable, production-ready automation
- `claude/*` — branches for AI-assisted changes (auto-created by Claude Code)
- All Claude Code changes go through PRs; never commit directly to `main`

## Guardrails for AI Assistants

- Do **not** publish or delete videos without explicit confirmation
- Do **not** commit API keys or credentials
- Do **not** modify `config/channel.json` without user approval
- Scripts should be idempotent — safe to run multiple times
- Always log actions to `logs/` before executing
