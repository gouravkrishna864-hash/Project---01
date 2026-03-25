"""
Manim-based animation builder for YouTube channel automation.

Provides ready-to-use base classes for 2D and 3D YouTube videos that:
  - Target a runtime of 5–10 minutes
  - Use an eye-catching, high-contrast colour palette
  - Auto-generate a title card, section slides, and an outro

Quick start
-----------
  from content.animator import YouTubeScene, PALETTE
  from manim import *

  class MyVideo(YouTubeScene):
      TITLE = "How Black Holes Form"
      SUBTITLE = "A Visual Explainer"

      def build_content(self):
          self.add_section("What is a Black Hole?", duration=60)
          # ... add your Mobjects and self.play() calls here
          self.add_section("Event Horizon Explained", duration=90)

  # Render (5-10 min @ 60 fps needs -qh for final output):
  #   manim -pql animator.py MyVideo
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

# ---------------------------------------------------------------------------
# Manim is an optional dependency — guard the import so the rest of the
# project can be imported even without manim installed.
# ---------------------------------------------------------------------------
try:
    from manim import (
        # Scene types
        Scene, ThreeDScene,
        # Mobjects
        Text, Tex, Rectangle, Circle, Square, Triangle, Arrow,
        VGroup, Dot, Line, Axes, NumberPlane,
        Sphere, Cylinder, Cone, Torus,
        # Animations
        Write, Create, FadeIn, FadeOut, Transform, GrowFromCenter,
        DrawBorderThenFill, Circumscribe, Indicate, Flash,
        # Camera / 3-D
        ThreeDAxes,
        # Utilities
        UP, DOWN, LEFT, RIGHT, ORIGIN, OUT, IN,
        config as manim_config,
        # Colour constants
        WHITE, BLACK, YELLOW, ORANGE, RED, BLUE, GREEN, PURPLE, PINK,
        TEAL, GOLD, MAROON, DARK_BLUE, DARK_BROWN, LIGHT_GREY,
        ManimColor,
        rate_functions,
    )
    MANIM_AVAILABLE = True
except ImportError:
    MANIM_AVAILABLE = False
    # Stub so type hints below still work at import time
    Scene = object          # type: ignore[assignment,misc]
    ThreeDScene = object    # type: ignore[assignment,misc]


# ---------------------------------------------------------------------------
# Eye-catching colour palette
# ---------------------------------------------------------------------------

PALETTE = {
    # Backgrounds
    "bg_dark":       "#0D0D1A",   # deep navy-black
    "bg_mid":        "#12122A",   # slightly lighter
    # Primary accent — vivid electric blue
    "accent_1":      "#00D4FF",
    # Secondary accent — neon coral / orange
    "accent_2":      "#FF6B35",
    # Highlight — bright yellow-gold
    "highlight":     "#FFD700",
    # Text
    "text_primary":  "#FFFFFF",
    "text_secondary":"#B0B8C8",
    # Section card gradient endpoints
    "card_from":     "#1A1A3E",
    "card_to":       "#0A2240",
    # Object colours for visual variety
    "obj_1":         "#7B2FBE",   # vivid purple
    "obj_2":         "#00E676",   # neon green
    "obj_3":         "#FF4081",   # hot pink
    "obj_4":         "#40C4FF",   # sky blue
    "obj_5":         "#FFAB00",   # amber
    "obj_6":         "#69F0AE",   # mint
}

# Gradient palette as a list — handy for cycling through object colours
OBJECT_COLORS = [
    PALETTE["accent_1"],
    PALETTE["accent_2"],
    PALETTE["highlight"],
    PALETTE["obj_1"],
    PALETTE["obj_2"],
    PALETTE["obj_3"],
    PALETTE["obj_4"],
    PALETTE["obj_5"],
    PALETTE["obj_6"],
]


# ---------------------------------------------------------------------------
# Duration helpers
# ---------------------------------------------------------------------------

# Target total video length: 5–10 minutes
MIN_DURATION_SECS = 5 * 60   # 300 s
MAX_DURATION_SECS = 10 * 60  # 600 s


@dataclass
class SectionSpec:
    """Metadata for one content section."""
    title: str
    duration_secs: int   # how long this section should run


# ---------------------------------------------------------------------------
# 2-D Base Scene
# ---------------------------------------------------------------------------

class YouTubeScene(Scene):  # type: ignore[misc]
    """
    Base class for 2D YouTube explainer videos.

    Subclasses must:
      1. Set class attributes TITLE and SUBTITLE.
      2. Override ``build_content()`` and call ``add_section()`` /
         ``add_point()`` to fill in the body of the video.

    The class automatically renders:
      - An animated title card  (≈ 8 s)
      - Each content section with a coloured header slide  (≈ 5 s each)
      - An outro with channel CTA  (≈ 6 s)

    Target runtime: 5–10 minutes. Fill your sections with enough
    ``self.play()`` calls to reach that duration.
    """

    TITLE: str = "Your Video Title Here"
    SUBTITLE: str = "An Eye-Catching Subtitle"
    CHANNEL_NAME: str = "Your Channel"

    # Override to change the background colour
    BACKGROUND_COLOR: str = PALETTE["bg_dark"]

    def construct(self) -> None:
        if not MANIM_AVAILABLE:
            raise ImportError(
                "manim is not installed. Run: pip install manim"
            )
        manim_config.background_color = self.BACKGROUND_COLOR

        self._render_title_card()
        self.build_content()
        self._render_outro()

    # ------------------------------------------------------------------
    # Public helpers — call these inside build_content()
    # ------------------------------------------------------------------

    def build_content(self) -> None:
        """Override this method to add your video content."""
        raise NotImplementedError(
            "Subclasses must implement build_content() and call "
            "add_section() / add_point() inside it."
        )

    def add_section(self, title: str, duration: int = 60) -> None:
        """
        Render a section title card and then pause for *duration* seconds.

        Args:
            title: Section heading displayed on screen.
            duration: How long (in real rendered seconds) this section lasts.
                      Use self.wait(n) inside build_content for pacing.
        """
        bg = Rectangle(
            width=12, height=1.4,
            fill_color=PALETTE["card_from"],
            fill_opacity=0.95,
            stroke_color=PALETTE["accent_1"],
            stroke_width=2,
        )
        label = Text(title, font_size=40, color=PALETTE["accent_1"])
        label.move_to(bg.get_center())

        self.play(FadeIn(bg), Write(label), run_time=1.5)
        self.wait(2)
        self.play(FadeOut(bg), FadeOut(label))

    def add_point(
        self,
        text: str,
        position=None,
        color: str | None = None,
        font_size: int = 32,
    ):
        """
        Animate a bullet-point text onto the screen and return the Mobject.

        Args:
            text: The text to display.
            position: Manim position vector (default: ORIGIN).
            color: Hex colour string (default: PALETTE accent_1).
            font_size: Font size in points.

        Returns:
            The rendered ``Text`` Mobject (already added to the scene).
        """
        mob = Text(
            text,
            font_size=font_size,
            color=color or PALETTE["accent_1"],
        )
        if position is not None:
            mob.move_to(position)
        self.play(Write(mob), run_time=1.2)
        return mob

    def add_highlight_box(self, text: str, color: str | None = None):
        """Render text inside a coloured rounded rectangle."""
        box_color = color or PALETTE["accent_2"]
        box = Rectangle(
            width=len(text) * 0.22 + 0.8,
            height=0.9,
            fill_color=box_color,
            fill_opacity=0.25,
            stroke_color=box_color,
            stroke_width=2,
        )
        label = Text(text, font_size=30, color=PALETTE["text_primary"])
        label.move_to(box)
        group = VGroup(box, label)
        self.play(FadeIn(group), run_time=0.8)
        return group

    # ------------------------------------------------------------------
    # Internal renderers
    # ------------------------------------------------------------------

    def _render_title_card(self) -> None:
        """Animated intro title card (~8 s)."""
        # Decorative accent line
        top_line = Line(
            start=[-6.5, 1.2, 0], end=[6.5, 1.2, 0],
            color=PALETTE["accent_1"], stroke_width=3,
        )
        bottom_line = Line(
            start=[-6.5, -1.2, 0], end=[6.5, -1.2, 0],
            color=PALETTE["accent_2"], stroke_width=3,
        )

        title_text = Text(
            self.TITLE,
            font_size=52,
            color=PALETTE["text_primary"],
            weight="BOLD",
        )
        subtitle_text = Text(
            self.SUBTITLE,
            font_size=30,
            color=PALETTE["accent_1"],
        )
        subtitle_text.next_to(title_text, DOWN, buff=0.4)

        # Glowing dot decorations
        dots = VGroup(*[
            Dot(point=[x, 0, 0], color=PALETTE["highlight"], radius=0.06)
            for x in [-5.5, -5.0, 5.0, 5.5]
        ])

        self.play(
            Create(top_line), Create(bottom_line),
            run_time=1.0,
        )
        self.play(
            GrowFromCenter(title_text),
            run_time=1.5,
        )
        self.play(
            FadeIn(subtitle_text, shift=UP * 0.3),
            FadeIn(dots),
            run_time=1.2,
        )
        self.wait(3)
        self.play(
            FadeOut(title_text),
            FadeOut(subtitle_text),
            FadeOut(top_line),
            FadeOut(bottom_line),
            FadeOut(dots),
            run_time=1.0,
        )

    def _render_outro(self) -> None:
        """Subscribe / like CTA outro (~6 s)."""
        cta = Text(
            f"Thanks for watching — {self.CHANNEL_NAME}",
            font_size=38,
            color=PALETTE["highlight"],
        )
        sub_text = Text(
            "Like  •  Subscribe  •  Turn on notifications",
            font_size=26,
            color=PALETTE["text_secondary"],
        )
        sub_text.next_to(cta, DOWN, buff=0.5)

        # Animated ring around the subscribe prompt
        ring = Circle(radius=0.35, color=PALETTE["accent_2"], stroke_width=3)
        ring.next_to(sub_text, DOWN, buff=0.4)
        bell = Text("🔔", font_size=28).move_to(ring)

        self.play(Write(cta), run_time=1.2)
        self.play(FadeIn(sub_text, shift=UP * 0.2), run_time=0.8)
        self.play(Create(ring), FadeIn(bell), run_time=0.8)
        self.wait(3)
        self.play(
            FadeOut(cta), FadeOut(sub_text),
            FadeOut(ring), FadeOut(bell),
        )


# ---------------------------------------------------------------------------
# 3-D Base Scene
# ---------------------------------------------------------------------------

class YouTube3DScene(ThreeDScene):  # type: ignore[misc]
    """
    Base class for 3D YouTube explainer videos.

    Works identically to :class:`YouTubeScene` but exposes the Manim
    ``ThreeDScene`` camera controls (``set_camera_orientation``,
    ``begin_ambient_camera_rotation``, etc.) and adds convenience
    helpers for 3D objects.

    Example::

        class SolarSystemVideo(YouTube3DScene):
            TITLE = "How the Solar System Works"
            SUBTITLE = "A 3D Visual Tour"

            def build_content(self):
                self.add_section("The Sun", duration=90)
                axes = ThreeDAxes()
                sphere = Sphere(radius=1, color=PALETTE["highlight"])
                self.set_camera_orientation(phi=60 * DEGREES, theta=-45 * DEGREES)
                self.play(Create(axes), GrowFromCenter(sphere))
                self.begin_ambient_camera_rotation(rate=0.15)
                self.wait(5)
                self.stop_ambient_camera_rotation()
    """

    TITLE: str = "Your 3D Video Title"
    SUBTITLE: str = "An Immersive Visual Experience"
    CHANNEL_NAME: str = "Your Channel"
    BACKGROUND_COLOR: str = PALETTE["bg_dark"]

    def construct(self) -> None:
        if not MANIM_AVAILABLE:
            raise ImportError("manim is not installed. Run: pip install manim")
        manim_config.background_color = self.BACKGROUND_COLOR
        self._render_title_card_3d()
        self.build_content()
        self._render_outro_3d()

    def build_content(self) -> None:
        raise NotImplementedError("Subclasses must implement build_content().")

    def add_section(self, title: str, duration: int = 60) -> None:
        """Same as 2D version — renders a section header slide."""
        label = Text(title, font_size=40, color=PALETTE["accent_1"])
        self.play(Write(label), run_time=1.5)
        self.wait(2)
        self.play(FadeOut(label))

    def add_3d_object(
        self,
        obj_type: str = "sphere",
        color: str | None = None,
        radius: float = 1.0,
    ):
        """
        Convenience factory for common 3D objects.

        Args:
            obj_type: ``"sphere"`` | ``"cylinder"`` | ``"cone"`` | ``"torus"``
            color: Hex colour string; cycles through PALETTE if omitted.
            radius: Size parameter.

        Returns:
            The created Mobject.
        """
        _color = color or OBJECT_COLORS[0]
        mapping = {
            "sphere":   lambda: Sphere(radius=radius, color=_color),
            "cylinder": lambda: Cylinder(radius=radius, color=_color),
            "cone":     lambda: Cone(base_radius=radius, color=_color),
            "torus":    lambda: Torus(major_radius=radius, color=_color),
        }
        factory = mapping.get(obj_type)
        if factory is None:
            raise ValueError(
                f"Unknown obj_type {obj_type!r}. "
                f"Choose from: {list(mapping)}"
            )
        mob = factory()
        self.play(GrowFromCenter(mob), run_time=1.2)
        return mob

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _render_title_card_3d(self) -> None:
        """3D-camera title card with a subtle rotation."""
        self.set_camera_orientation(phi=0, theta=-90)

        title_text = Text(
            self.TITLE, font_size=50,
            color=PALETTE["text_primary"], weight="BOLD",
        )
        subtitle_text = Text(
            self.SUBTITLE, font_size=30, color=PALETTE["accent_1"],
        )
        subtitle_text.next_to(title_text, DOWN, buff=0.4)

        self.play(GrowFromCenter(title_text), run_time=1.5)
        self.play(FadeIn(subtitle_text, shift=UP * 0.3), run_time=1.0)
        self.wait(3)
        self.play(FadeOut(title_text), FadeOut(subtitle_text), run_time=1.0)

    def _render_outro_3d(self) -> None:
        """Simple outro CTA for 3D scenes."""
        cta = Text(
            f"Thanks for watching — {self.CHANNEL_NAME}",
            font_size=38,
            color=PALETTE["highlight"],
        )
        self.play(Write(cta), run_time=1.2)
        self.wait(3)
        self.play(FadeOut(cta))


# ---------------------------------------------------------------------------
# Example scenes — delete or move to a separate file when building your own
# ---------------------------------------------------------------------------

class ExampleFactsVideo(YouTubeScene):
    """
    Demo: a 2D 'Mind-Blowing Facts' style video.

    Render with:  manim -pql content/animator.py ExampleFactsVideo
    """

    TITLE    = "5 Facts That Will Blow Your Mind"
    SUBTITLE = "Science & Universe Edition"
    CHANNEL_NAME = "My Channel"

    def build_content(self) -> None:
        facts = [
            ("Fact #1", "There are more stars in the universe\nthan grains of sand on Earth.", PALETTE["accent_1"]),
            ("Fact #2", "A day on Venus is longer\nthan a year on Venus.", PALETTE["accent_2"]),
            ("Fact #3", "Honey never spoils — 3000-year-old\nhoney is still edible.", PALETTE["highlight"]),
            ("Fact #4", "Your body has more bacteria cells\nthan human cells.", PALETTE["obj_1"]),
            ("Fact #5", "The Milky Way smells like\nraspberries and rum.", PALETTE["obj_2"]),
        ]

        for heading, fact_text, color in facts:
            self.add_section(heading, duration=60)

            body = Text(fact_text, font_size=36, color=PALETTE["text_primary"])
            body.move_to(ORIGIN)

            accent_dot = Dot(color=color, radius=0.12)
            accent_dot.next_to(body, LEFT, buff=0.3)

            self.play(FadeIn(body, shift=UP * 0.4), FadeIn(accent_dot), run_time=1.5)
            self.wait(4)
            self.play(FadeOut(body), FadeOut(accent_dot))


class ExampleScienceVideo3D(YouTube3DScene):
    """
    Demo: a 3D 'How Black Holes Form' style video.

    Render with:  manim -pql content/animator.py ExampleScienceVideo3D
    """

    TITLE        = "How Black Holes Are Formed"
    SUBTITLE     = "A 3D Visual Journey"
    CHANNEL_NAME = "My Channel"

    def build_content(self) -> None:
        self.add_section("Step 1: A Massive Star")

        self.set_camera_orientation(phi=70, theta=-45)
        star = self.add_3d_object("sphere", color=PALETTE["highlight"], radius=1.5)
        self.begin_ambient_camera_rotation(rate=0.1)
        self.wait(5)
        self.stop_ambient_camera_rotation()

        self.add_section("Step 2: Supernova Collapse")
        self.play(
            star.animate.scale(0.15).set_color(PALETTE["accent_2"]),
            run_time=2.5,
            rate_func=rate_functions.rush_into,
        )
        self.wait(3)

        self.add_section("Step 3: The Black Hole")
        black_hole = self.add_3d_object("sphere", color="#000000", radius=0.5)
        ring = Torus(major_radius=1.2, minor_radius=0.08, color=PALETTE["accent_1"])
        self.play(Create(ring), run_time=1.5)
        self.begin_ambient_camera_rotation(rate=0.15)
        self.wait(6)
        self.stop_ambient_camera_rotation()
        self.play(FadeOut(black_hole), FadeOut(ring), FadeOut(star))
