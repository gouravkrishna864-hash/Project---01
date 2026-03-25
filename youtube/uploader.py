"""
Handles video uploads to YouTube via the resumable upload API.
"""
from googleapiclient.http import MediaFileUpload

import config


class VideoUploader:
    def __init__(self, youtube_service):
        self.service = youtube_service

    def upload(self, video_path: str, title: str, description: str,
               tags: list[str], privacy: str = None) -> str:
        """
        Upload a video file and return the new video ID.

        Args:
            video_path: Local path to the .mp4 (or other format) file.
            title: Video title (max 100 chars).
            description: Video description (max 5000 chars).
            tags: List of tag strings.
            privacy: 'public', 'unlisted', or 'private'.

        Returns:
            YouTube video ID string.
        """
        privacy = privacy or config.DEFAULT_PRIVACY

        body = {
            "snippet": {
                "title": title,
                "description": description,
                "tags": tags,
                "categoryId": "22",  # People & Blogs
            },
            "status": {"privacyStatus": privacy},
        }

        media = MediaFileUpload(video_path, chunksize=-1, resumable=True)

        request = self.service.videos().insert(
            part=",".join(body.keys()), body=body, media_body=media
        )

        response = request.execute()
        return response["id"]

    # TODO: Add retry logic for failed or interrupted uploads.
    # When an upload fails mid-way (network error, 5xx response), the resumable
    # upload URI is still valid for 24 hours. Steps needed:
    #   1. Catch HttpError / socket errors during request.execute().
    #   2. On transient failures (429, 500, 503), wait with exponential back-off
    #      (starting at 1 s, doubling up to a max of 64 s) and retry the same
    #      MediaFileUpload request — googleapiclient resumes from the last byte.
    #   3. On permanent failures (400, 401, 403), surface a clear error message
    #      and do not retry.
    #   4. Expose a max_retries parameter (default 5) on the upload() method.
