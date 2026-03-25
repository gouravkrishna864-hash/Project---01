"""
Video scheduling queue for YouTube channel automation.

Maintains a persistent JSON-backed priority queue of scheduled uploads.
Videos are sorted by their target publish datetime so the next due upload
is always O(1) to find.
"""

from __future__ import annotations

import json
import os
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Iterator

import config


@dataclass(order=True)
class ScheduledVideo:
    """Represents one video waiting to be published."""

    # Fields used for ordering — must come first for dataclass comparisons.
    scheduled_at: str                       # ISO-8601 UTC string, used for sort key
    video_id: str = field(compare=False)    # Internal queue ID (not YouTube ID)
    file_path: str = field(compare=False)
    title: str = field(compare=False)
    description: str = field(compare=False)
    tags: list[str] = field(compare=False, default_factory=list)
    privacy: str = field(compare=False, default="private")
    youtube_video_id: str | None = field(compare=False, default=None)
    status: str = field(compare=False, default="pending")
    # Possible statuses: pending | uploading | done | failed

    @property
    def scheduled_dt(self) -> datetime:
        return datetime.fromisoformat(self.scheduled_at)

    def is_due(self, now: datetime | None = None) -> bool:
        now = now or datetime.now(timezone.utc)
        return now >= self.scheduled_dt and self.status == "pending"


class VideoScheduler:
    """
    Priority-queue-backed scheduler that persists state to a JSON file.

    Usage::

        scheduler = VideoScheduler()

        # Add a video to the queue
        vid_id = scheduler.add(
            file_path="videos/ep42.mp4",
            title="Episode 42",
            description="All about Python.",
            tags=["python", "tutorial"],
            scheduled_at=datetime(2025, 6, 1, 15, 0, tzinfo=timezone.utc),
            privacy="public",
        )

        # Retrieve all videos due right now
        for video in scheduler.due_videos():
            print(video.title, video.scheduled_at)

        # Mark one as done after upload
        scheduler.mark_done(vid_id, youtube_video_id="abc123XYZ")
    """

    def __init__(self, schedule_file: str | None = None):
        self._path = schedule_file or config.SCHEDULE_FILE
        self._queue: list[ScheduledVideo] = []
        self._load()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def add(
        self,
        file_path: str,
        title: str,
        description: str,
        scheduled_at: datetime,
        tags: list[str] | None = None,
        privacy: str | None = None,
    ) -> str:
        """
        Add a video to the scheduling queue.

        Args:
            file_path: Path to the local video file.
            title: YouTube video title.
            description: YouTube video description.
            scheduled_at: Timezone-aware datetime when the video should go live.
            tags: Optional list of tag strings.
            privacy: 'public', 'unlisted', or 'private'. Defaults to config value.

        Returns:
            The internal video_id string that can be used to look up or cancel.
        """
        if scheduled_at.tzinfo is None:
            raise ValueError("scheduled_at must be timezone-aware")

        video = ScheduledVideo(
            video_id=str(uuid.uuid4()),
            file_path=file_path,
            title=title,
            description=description,
            tags=tags or [],
            privacy=privacy or config.DEFAULT_PRIVACY,
            scheduled_at=scheduled_at.isoformat(),
        )
        self._queue.append(video)
        self._sort()
        self._save()
        return video.video_id

    def remove(self, video_id: str) -> bool:
        """
        Remove a pending video from the queue.

        Returns True if the video was found and removed, False otherwise.
        Only videos with status 'pending' can be removed; use mark_failed() for
        others.
        """
        before = len(self._queue)
        self._queue = [v for v in self._queue
                       if not (v.video_id == video_id and v.status == "pending")]
        removed = len(self._queue) < before
        if removed:
            self._save()
        return removed

    def due_videos(self, now: datetime | None = None) -> list[ScheduledVideo]:
        """Return all pending videos whose scheduled time has passed."""
        now = now or datetime.now(timezone.utc)
        return [v for v in self._queue if v.is_due(now)]

    def mark_uploading(self, video_id: str) -> None:
        """Transition a video from pending → uploading."""
        self._set_status(video_id, "uploading")

    def mark_done(self, video_id: str, youtube_video_id: str) -> None:
        """Transition a video from uploading → done and record the YouTube ID."""
        video = self._get(video_id)
        video.status = "done"
        video.youtube_video_id = youtube_video_id
        self._save()

    def mark_failed(self, video_id: str) -> None:
        """Transition a video to failed so it won't be retried automatically."""
        self._set_status(video_id, "failed")

    def get(self, video_id: str) -> ScheduledVideo | None:
        """Return the ScheduledVideo with the given ID, or None."""
        return next((v for v in self._queue if v.video_id == video_id), None)

    def list_all(self) -> list[ScheduledVideo]:
        """Return a sorted snapshot of every entry in the queue."""
        return list(self._queue)

    def __iter__(self) -> Iterator[ScheduledVideo]:
        return iter(self._queue)

    def __len__(self) -> int:
        return len(self._queue)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get(self, video_id: str) -> ScheduledVideo:
        video = self.get(video_id)
        if video is None:
            raise KeyError(f"No scheduled video with id={video_id!r}")
        return video

    def _set_status(self, video_id: str, status: str) -> None:
        self._get(video_id).status = status
        self._save()

    def _sort(self) -> None:
        self._queue.sort()

    def _save(self) -> None:
        with open(self._path, "w", encoding="utf-8") as fh:
            json.dump([asdict(v) for v in self._queue], fh, indent=2)

    def _load(self) -> None:
        if not os.path.exists(self._path):
            return
        with open(self._path, encoding="utf-8") as fh:
            raw = json.load(fh)
        self._queue = [ScheduledVideo(**entry) for entry in raw]
        self._sort()
