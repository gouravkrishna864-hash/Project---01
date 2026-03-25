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

## Modules

### `content/topic_generator.py` — Video Topic & Title Generator

Generates video topics across **10 categories** with click-worthy titles in 5 styles.

```python
from content.topic_generator import TopicGenerator, Category

gen = TopicGenerator()

# Get 5 topics from Science with curiosity-style titles
topics = gen.generate(Category.SCIENCE, count=5, title_style="curiosity")
for t in topics:
    print(t.title)        # e.g. "The Surprising Truth About Black Holes"
    print(t.suggested_tags)

# Generate topics for ALL categories at once
all_topics = gen.generate_all_categories(per_category=3, title_style="listicle")

# Available categories
print(gen.all_categories())
# [Science & Technology, Mathematics, History & Culture, Programming & Dev,
#  Motivation & Self-Help, Mind-Blowing Facts, Nature & Environment,
#  Finance & Money, Health & Wellness, Entertainment & Pop Culture]
```

**Title styles:** `curiosity` · `how_to` · `listicle` · `story` · `question`

**LLM hook** — pass any callable `(prompt: str) -> str` for AI-powered generation:
```python
import anthropic
client = anthropic.Anthropic()
def claude_fn(prompt):
    return client.messages.create(
        model="claude-sonnet-4-6", max_tokens=512,
        messages=[{"role": "user", "content": prompt}]
    ).content[0].text

gen = TopicGenerator(llm_fn=claude_fn)
result = gen.generate_with_llm("5 viral YouTube topics about space for a teen audience")
```

---

### `content/animator.py` — 2D & 3D Animation Builder (Manim)

Build eye-catching YouTube videos (target **5–10 min**) with Manim.

#### 2D scene
```python
from content.animator import YouTubeScene, PALETTE
from manim import *

class MyVideo(YouTubeScene):
    TITLE        = "How Black Holes Form"
    SUBTITLE     = "A Visual Explainer"
    CHANNEL_NAME = "My Channel"

    def build_content(self):
        self.add_section("What is a Black Hole?", duration=90)
        text = self.add_point("Gravity crushes a star's core", position=ORIGIN)
        self.wait(5)
        self.play(FadeOut(text))

        self.add_section("The Event Horizon", duration=90)
        self.add_highlight_box("Nothing escapes — not even light")
        self.wait(5)
```

#### 3D scene
```python
from content.animator import YouTube3DScene, PALETTE
from manim import *

class MySolarSystem(YouTube3DScene):
    TITLE        = "The Solar System in 3D"
    SUBTITLE     = "An Immersive Tour"

    def build_content(self):
        self.add_section("The Sun")
        self.set_camera_orientation(phi=70, theta=-45)
        star = self.add_3d_object("sphere", color=PALETTE["highlight"], radius=1.5)
        self.begin_ambient_camera_rotation(rate=0.1)
        self.wait(8)
        self.stop_ambient_camera_rotation()
```

#### Render commands
```bash
# Quick preview (low quality, fast)
manim -pql content/animator.py ExampleFactsVideo

# Final render (high quality, 1080p)
manim -pqh content/animator.py ExampleFactsVideo

# 4K output
manim -p --quality=4k content/animator.py ExampleFactsVideo
```

#### Eye-catching colour palette (`PALETTE` dict)

| Key | Hex | Use |
|---|---|---|
| `bg_dark` | `#0D0D1A` | Background |
| `accent_1` | `#00D4FF` | Electric blue — titles, highlights |
| `accent_2` | `#FF6B35` | Neon coral — secondary accents |
| `highlight` | `#FFD700` | Gold — CTAs, key facts |
| `obj_1–6` | various | Object colour rotation |

---

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
