"""
Generates video thumbnails using Pillow.
"""

# TODO: Generate a thumbnail image from a video title string.
# Steps needed:
#   1. Open a blank RGBA image (1280 × 720 px) with a configurable background colour.
#   2. Load a bold TrueType font (fall back to ImageFont.load_default() if not found).
#   3. Word-wrap the title text so it fits within safe margins (≈80 % of width).
#   4. Centre the text block vertically and horizontally.
#   5. Optionally overlay a semi-transparent gradient or a background image passed
#      as an optional parameter.
#   6. Save the result as a JPEG to the given output_path and return that path.
#
# Suggested signature:
#   def create_thumbnail(title: str, output_path: str,
#                        bg_color=(30, 30, 30), text_color=(255, 255, 255),
#                        bg_image_path: str | None = None) -> str:


def create_thumbnail(title: str, output_path: str,
                     bg_color=(30, 30, 30), text_color=(255, 255, 255),
                     bg_image_path: str | None = None) -> str:
    """Create a 1280×720 thumbnail and return its saved path."""
    raise NotImplementedError("TODO: implement thumbnail generation")
