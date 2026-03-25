"""
Helpers for generating and managing video metadata (title, description, tags).
"""


class MetadataGenerator:
    def __init__(self, channel_topic: str):
        self.channel_topic = channel_topic

    def build_description(self, title: str, key_points: list[str],
                          links: dict[str, str] | None = None) -> str:
        """Assemble a standard video description."""
        lines = [title, "", *key_points]
        if links:
            lines += ["", "--- Links ---"]
            lines += [f"{label}: {url}" for label, url in links.items()]
        return "\n".join(lines)

    # TODO: Auto-generate relevant tags from the video title and description.
    # Steps needed:
    #   1. Tokenise the title and description (split on whitespace / punctuation).
    #   2. Remove stop-words (a, the, is, …).
    #   3. Deduplicate and lower-case tokens.
    #   4. Optionally call the YouTube Data API videos.suggest endpoint (or a
    #      simple TF-IDF approach) to surface high-value tags.
    #   5. Return a list capped at 500 characters total (YouTube API limit).
    def generate_tags(self, title: str, description: str) -> list[str]:
        raise NotImplementedError("TODO: implement automatic tag generation")
