import os
from dotenv import load_dotenv

load_dotenv()

YOUTUBE_CLIENT_ID = os.getenv("YOUTUBE_CLIENT_ID")
YOUTUBE_CLIENT_SECRET = os.getenv("YOUTUBE_CLIENT_SECRET")
YOUTUBE_REDIRECT_URI = os.getenv("YOUTUBE_REDIRECT_URI", "http://localhost:8080")
YOUTUBE_CHANNEL_ID = os.getenv("YOUTUBE_CHANNEL_ID")

TOKEN_FILE = os.getenv("TOKEN_FILE", "token.json")
CREDENTIALS_FILE = os.getenv("CREDENTIALS_FILE", "credentials.json")
DEFAULT_PRIVACY = os.getenv("DEFAULT_PRIVACY", "private")
SCHEDULE_FILE = os.getenv("SCHEDULE_FILE", "schedule.json")

YOUTUBE_API_SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]
