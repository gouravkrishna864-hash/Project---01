"""
Entry point for the YouTube channel automation tool.

Run this script to process all videos that are due for upload according to the
schedule stored in SCHEDULE_FILE (see .env / config.py).
"""
from datetime import datetime, timezone

from youtube.auth import get_authenticated_service
from youtube.scheduler import VideoScheduler
from youtube.uploader import VideoUploader


def run() -> None:
    print("YouTube Channel Automation — starting up")

    youtube = get_authenticated_service()
    scheduler = VideoScheduler()
    uploader = VideoUploader(youtube)

    due = scheduler.due_videos(now=datetime.now(timezone.utc))
    if not due:
        print("No videos due for upload right now.")
        return

    print(f"{len(due)} video(s) due for upload.")
    for video in due:
        print(f"  Uploading: {video.title!r} (scheduled {video.scheduled_at})")
        scheduler.mark_uploading(video.video_id)
        try:
            yt_id = uploader.upload(
                video_path=video.file_path,
                title=video.title,
                description=video.description,
                tags=video.tags,
                privacy=video.privacy,
            )
            scheduler.mark_done(video.video_id, youtube_video_id=yt_id)
            print(f"    Done — YouTube ID: {yt_id}")
        except Exception as exc:
            scheduler.mark_failed(video.video_id)
            print(f"    Failed: {exc}")


if __name__ == "__main__":
    run()
