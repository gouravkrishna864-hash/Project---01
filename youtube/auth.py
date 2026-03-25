"""
Handles OAuth2 authentication with the YouTube Data API v3.
"""
import os
import json

import config

# TODO: Implement full OAuth2 authentication flow.
# Steps needed:
#   1. Load existing credentials from TOKEN_FILE if present and not expired.
#   2. If credentials are expired, refresh them using the refresh token.
#   3. If no credentials exist, run the installed-app OAuth2 flow:
#        - Build a Flow from config.CREDENTIALS_FILE and config.YOUTUBE_API_SCOPES
#        - Open a local redirect server on config.YOUTUBE_REDIRECT_URI
#        - Direct the user to the authorization URL
#        - Exchange the returned code for credentials
#   4. Persist the obtained credentials back to TOKEN_FILE.
#   5. Return an authorized googleapiclient.discovery resource for 'youtube' v3.
#
# Useful libraries: google-auth, google-auth-oauthlib, google-api-python-client


def get_authenticated_service():
    """Return an authenticated YouTube API service object."""
    raise NotImplementedError("TODO: implement OAuth2 authentication flow")
