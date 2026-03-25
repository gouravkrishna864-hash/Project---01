"""
Generates eye-catching YouTube thumbnails (1280 × 720 px) using Pillow.

Features
--------
- Solid or image background with an optional dark/coloured gradient overlay
- Bold, auto-wrapped title text centred within safe margins
- Accent bar + subtle drop-shadow for depth
- Optional badge (e.g. "NEW", "HOT", episode number)
- Returns the saved file path so it can be handed straight to the uploader

Quick start
-----------
    from content.thumbnail import create_thumbnail

    path = create_thumbnail(
        title="How Black Holes Are Formed",
        output_path="thumbs/ep01.jpg",
        bg_color=(13, 13, 26),          # deep navy
        text_color=(255, 255, 255),
        accent_color=(0, 212, 255),      # electric blue
    )
"""

from __future__ import annotations

import os
import textwrap
from pathlib import Path
from typing import Tuple

from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ---------------------------------------------------------------------------
# Type alias
# ---------------------------------------------------------------------------
RGBColor = Tuple[int, int, int]
RGBAColor = Tuple[int, int, int, int]

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
THUMB_W = 1280
THUMB_H = 720
SAFE_MARGIN_X = int(THUMB_W * 0.08)   # 8 % horizontal safe zone
SAFE_MARGIN_Y = int(THUMB_H * 0.10)   # 10 % vertical safe zone

# Font search paths — tried in order; falls back to Pillow's default
_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",   # macOS
    "C:/Windows/Fonts/arialbd.ttf",                        # Windows
]


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Load the first available bold TrueType font at *size* points."""
    for path in _FONT_CANDIDATES:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    # Pillow built-in bitmap fallback (no size control)
    return ImageFont.load_default()


def _apply_gradient_overlay(
    img: Image.Image,
    from_color: RGBAColor,
    to_color: RGBAColor,
    direction: str = "bottom",
) -> Image.Image:
    """
    Blend a vertical or horizontal gradient over *img* (in-place copy).

    Args:
        img: RGBA base image.
        from_color: RGBA tuple at the start edge.
        to_color: RGBA tuple at the end edge.
        direction: ``"bottom"`` (top→bottom) or ``"right"`` (left→right).

    Returns:
        New RGBA image with the gradient composited on top.
    """
    gradient = Image.new("RGBA", img.size)
    draw = ImageDraw.Draw(gradient)
    w, h = img.size

    steps = h if direction == "bottom" else w
    for i in range(steps):
        t = i / max(steps - 1, 1)
        r = int(from_color[0] + (to_color[0] - from_color[0]) * t)
        g = int(from_color[1] + (to_color[1] - from_color[1]) * t)
        b = int(from_color[2] + (to_color[2] - from_color[2]) * t)
        a = int(from_color[3] + (to_color[3] - from_color[3]) * t)

        if direction == "bottom":
            draw.line([(0, i), (w, i)], fill=(r, g, b, a))
        else:
            draw.line([(i, 0), (i, h)], fill=(r, g, b, a))

    return Image.alpha_composite(img, gradient)


def _draw_shadow_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    fill: RGBColor,
    shadow_offset: int = 4,
    shadow_opacity: int = 160,
) -> None:
    """Draw *text* with a drop shadow at position *xy*."""
    sx, sy = xy[0] + shadow_offset, xy[1] + shadow_offset
    draw.text((sx, sy), text, font=font, fill=(0, 0, 0, shadow_opacity))
    draw.text(xy, text, font=font, fill=fill)


def _wrap_text(
    text: str,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    max_width: int,
) -> list[str]:
    """
    Word-wrap *text* so each line fits within *max_width* pixels.

    Uses a binary-search approach on character width so it works with
    proportional fonts.
    """
    words = text.split()
    lines: list[str] = []
    current: list[str] = []

    # Helper: pixel width of a string with this font
    def _px(s: str) -> int:
        if hasattr(font, "getlength"):
            return int(font.getlength(s))
        # Older Pillow fallback
        return font.getsize(s)[0]  # type: ignore[attr-defined]

    for word in words:
        probe = " ".join(current + [word])
        if _px(probe) <= max_width:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def create_thumbnail(
    title: str,
    output_path: str,
    bg_color: RGBColor = (13, 13, 26),
    text_color: RGBColor = (255, 255, 255),
    accent_color: RGBColor = (0, 212, 255),
    bg_image_path: str | None = None,
    gradient_overlay: bool = True,
    badge_text: str | None = None,
    badge_color: RGBColor = (255, 107, 53),
    font_size: int = 80,
) -> str:
    """
    Create a 1280 × 720 YouTube thumbnail and save it as a JPEG.

    Args:
        title: Main title text to display on the thumbnail.
        output_path: Destination path for the saved JPEG (directories are
                     created automatically).
        bg_color: RGB background colour used when no ``bg_image_path`` is given.
                  Defaults to deep navy ``(13, 13, 26)``.
        text_color: RGB colour for the title text. Defaults to white.
        accent_color: RGB colour used for the bottom accent bar and badge.
                      Defaults to electric blue ``(0, 212, 255)``.
        bg_image_path: Optional path to a background image. It will be resized
                       to 1280 × 720 and darkened with a gradient overlay so
                       the text stays readable.
        gradient_overlay: When ``True`` (default), apply a semi-transparent
                          dark-to-transparent gradient from the bottom so text
                          always contrasts against the background.
        badge_text: Short label rendered in a coloured pill in the top-right
                    corner (e.g. ``"NEW"``, ``"EP. 5"``). Omit to skip.
        badge_color: RGB background colour of the badge pill.
        font_size: Starting font size in points. Auto-reduced if the title is
                   long and would overflow the safe zone.

    Returns:
        The absolute path of the saved thumbnail file.

    Raises:
        FileNotFoundError: If ``bg_image_path`` is provided but does not exist.
    """
    # ------------------------------------------------------------------
    # 1. Build the base image
    # ------------------------------------------------------------------
    if bg_image_path:
        if not os.path.exists(bg_image_path):
            raise FileNotFoundError(f"Background image not found: {bg_image_path!r}")
        base = Image.open(bg_image_path).convert("RGBA").resize(
            (THUMB_W, THUMB_H), Image.LANCZOS
        )
    else:
        base = Image.new("RGBA", (THUMB_W, THUMB_H), (*bg_color, 255))

    # ------------------------------------------------------------------
    # 2. Gradient overlay (improves text legibility over busy backgrounds)
    # ------------------------------------------------------------------
    if gradient_overlay:
        base = _apply_gradient_overlay(
            base,
            from_color=(0, 0, 0, 0),           # transparent at top
            to_color=(0, 0, 0, 200),            # semi-opaque at bottom
            direction="bottom",
        )

    # ------------------------------------------------------------------
    # 3. Accent bar at the bottom
    # ------------------------------------------------------------------
    draw = ImageDraw.Draw(base)
    bar_h = 10
    draw.rectangle(
        [(0, THUMB_H - bar_h), (THUMB_W, THUMB_H)],
        fill=(*accent_color, 255),
    )

    # ------------------------------------------------------------------
    # 4. Title text — auto-wrap and auto-shrink to fit safe zone
    # ------------------------------------------------------------------
    text_area_w = THUMB_W - 2 * SAFE_MARGIN_X
    text_area_h = THUMB_H - 2 * SAFE_MARGIN_Y

    # Reduce font size until the wrapped block fits vertically
    current_size = font_size
    while current_size >= 28:
        font = _load_font(current_size)
        lines = _wrap_text(title, font, text_area_w)

        # Measure total block height
        line_heights = []
        for line in lines:
            if hasattr(font, "getbbox"):
                bbox = font.getbbox(line)
                line_heights.append(bbox[3] - bbox[1])
            else:
                line_heights.append(font.getsize(line)[1])  # type: ignore[attr-defined]

        line_gap = int(current_size * 0.25)
        total_h = sum(line_heights) + line_gap * (len(lines) - 1)

        if total_h <= text_area_h:
            break
        current_size -= 6

    # Vertically centre the text block
    start_y = (THUMB_H - total_h) // 2

    for i, line in enumerate(lines):
        lh = line_heights[i]

        # Horizontal centre
        if hasattr(font, "getlength"):
            line_w = int(font.getlength(line))
        else:
            line_w = font.getsize(line)[0]  # type: ignore[attr-defined]

        x = (THUMB_W - line_w) // 2
        y = start_y + sum(line_heights[:i]) + line_gap * i

        _draw_shadow_text(draw, (x, y), line, font, text_color)

    # ------------------------------------------------------------------
    # 5. Badge pill (top-right corner)
    # ------------------------------------------------------------------
    if badge_text:
        badge_font = _load_font(36)
        if hasattr(badge_font, "getbbox"):
            bbox = badge_font.getbbox(badge_text)
            bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
        else:
            bw, bh = badge_font.getsize(badge_text)  # type: ignore[attr-defined]

        pad_x, pad_y = 20, 10
        pill_w, pill_h = bw + pad_x * 2, bh + pad_y * 2
        pill_x = THUMB_W - SAFE_MARGIN_X - pill_w
        pill_y = SAFE_MARGIN_Y

        draw.rounded_rectangle(
            [(pill_x, pill_y), (pill_x + pill_w, pill_y + pill_h)],
            radius=pill_h // 2,
            fill=(*badge_color, 230),
        )
        draw.text(
            (pill_x + pad_x, pill_y + pad_y),
            badge_text,
            font=badge_font,
            fill=(255, 255, 255, 255),
        )

    # ------------------------------------------------------------------
    # 6. Save as JPEG
    # ------------------------------------------------------------------
    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    rgb_img = base.convert("RGB")
    rgb_img.save(str(out_path), format="JPEG", quality=95, optimize=True)

    return str(out_path.resolve())
