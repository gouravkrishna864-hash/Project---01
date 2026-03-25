# Project---01 — YouTube Channel Automation

Automates scheduling and uploading videos to a YouTube channel via the YouTube Data API v3.

## Project Structure

```
.
├── main.py                  # Entry point — uploads all due videos
├── config.py                # Loads settings from .env
├── requirements.txt
├── .env.example             # Copy to .env and fill in your credentials
├── youtube/
│   ├── auth.py              # OAuth2 authentication  (TODO)
│   ├── uploader.py          # Resumable video upload (TODO: retry logic)
│   ├── scheduler.py         # Video scheduling queue (IMPLEMENTED)
│   └── analytics.py        # Analytics fetching     (TODO)
└── content/
    ├── metadata.py          # Title / description / tags helpers (TODO: auto-tags)
    └── thumbnail.py         # Thumbnail generation   (TODO)
```

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure credentials
cp .env.example .env
# edit .env with your Google OAuth2 client ID / secret

# 3. Schedule a video (Python snippet)
from datetime import datetime, timezone
from youtube.scheduler import VideoScheduler

s = VideoScheduler()
s.add(
    file_path="videos/episode_01.mp4",
    title="My First Automated Upload",
    description="Uploaded automatically!",
    scheduled_at=datetime(2025, 6, 1, 15, 0, tzinfo=timezone.utc),
    tags=["automation", "python"],
    privacy="public",
)

# 4. Run the uploader (will pick up anything that is due)
python main.py
```

## Implemented Features

- **Video Scheduling Queue** (`youtube/scheduler.py`): priority-queue backed by a
  JSON file. Supports add, remove, due_videos, mark_uploading, mark_done, and
  mark_failed operations. Survives process restarts.

## TODOs / Roadmap

- [ ] OAuth2 authentication flow (`youtube/auth.py`)
- [ ] Upload retry with exponential back-off (`youtube/uploader.py`)
- [ ] Analytics fetching and parsing (`youtube/analytics.py`)
- [ ] Automatic tag generation (`content/metadata.py`)
- [ ] Thumbnail generation from title (`content/thumbnail.py`)
