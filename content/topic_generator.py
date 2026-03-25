"""
Video topic and title generator for YouTube channel automation.

Provides a structured bank of topic categories and sub-topics, plus helper
methods that build eye-catching titles optimised for YouTube CTR (click-through
rate).  An optional Claude / OpenAI hook lets you swap in an LLM for richer,
context-aware suggestions.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable


# ---------------------------------------------------------------------------
# Category definitions
# ---------------------------------------------------------------------------

class Category(str, Enum):
    SCIENCE        = "Science & Technology"
    MATH           = "Mathematics"
    HISTORY        = "History & Culture"
    PROGRAMMING    = "Programming & Dev"
    MOTIVATION     = "Motivation & Self-Help"
    FACTS          = "Mind-Blowing Facts"
    NATURE         = "Nature & Environment"
    FINANCE        = "Finance & Money"
    HEALTH         = "Health & Wellness"
    ENTERTAINMENT  = "Entertainment & Pop Culture"


# ---------------------------------------------------------------------------
# Topic seeds per category
# ---------------------------------------------------------------------------

_TOPIC_SEEDS: dict[Category, list[str]] = {
    Category.SCIENCE: [
        "How black holes are formed",
        "The science of sleep",
        "Why the sky is blue",
        "How vaccines train your immune system",
        "The mystery of dark matter",
        "How CRISPR gene editing works",
        "Quantum entanglement explained simply",
        "The science of colour perception",
        "Why we age and how to slow it",
        "How GPS satellites work",
    ],
    Category.MATH: [
        "Fibonacci numbers in nature",
        "Why infinity comes in different sizes",
        "The Monty Hall problem",
        "Prime numbers and cryptography",
        "How fractals are generated",
        "The golden ratio in art and architecture",
        "Bayes' theorem and real-world decisions",
        "Why 0.1 + 0.2 ≠ 0.3 in computers",
        "The travelling salesman problem",
        "Understanding Fourier transforms visually",
    ],
    Category.HISTORY: [
        "The fall of the Roman Empire",
        "The invention of the printing press",
        "Why World War I started",
        "The space race between USSR and USA",
        "How ancient Egyptians built the pyramids",
        "The Renaissance and its impact",
        "The industrial revolution in 5 minutes",
        "Women who changed history",
        "The history of the internet",
        "Lost civilisations that vanished mysteriously",
    ],
    Category.PROGRAMMING: [
        "How the internet works under the hood",
        "What is machine learning really",
        "Object-oriented vs functional programming",
        "How databases store data efficiently",
        "Big O notation for beginners",
        "REST APIs explained simply",
        "How compilers turn code into machines",
        "Docker containers in plain English",
        "How Git tracks changes",
        "Building your first Python automation script",
    ],
    Category.MOTIVATION: [
        "The power of compound habits",
        "Why most people give up too soon",
        "Morning routines of top performers",
        "How to build unbreakable focus",
        "The 80/20 rule applied to life",
        "Why failure is your best teacher",
        "The science of motivation and dopamine",
        "How to stop procrastinating forever",
        "Lessons from stoic philosophy",
        "What separates average from extraordinary people",
    ],
    Category.FACTS: [
        "10 facts you never knew about space",
        "The most bizarre laws around the world",
        "Animals with superpowers that are real",
        "Mind-blowing coincidences in history",
        "Things your brain does without you knowing",
        "The deepest places on Earth",
        "Foods that are scientifically addictive",
        "Optical illusions and how they trick your brain",
        "Strangest discoveries found by archaeologists",
        "Numbers that break your intuition",
    ],
    Category.NATURE: [
        "Why trees communicate underground",
        "The deadliest animals on Earth",
        "How oceans regulate the climate",
        "The life cycle of a star",
        "Why coral reefs are dying",
        "The world's most extreme ecosystems",
        "How birds navigate thousands of miles",
        "The secret life of fungi",
        "What happens inside a volcano",
        "Animals that can survive in space",
    ],
    Category.FINANCE: [
        "How compound interest builds wealth",
        "Why the stock market always recovers",
        "Understanding inflation in plain English",
        "How to build a 6-month emergency fund",
        "Index funds vs active investing",
        "What is a credit score and why it matters",
        "How the Federal Reserve controls money",
        "Passive income streams for beginners",
        "Why most people stay broke despite earning well",
        "The psychology of spending habits",
    ],
    Category.HEALTH: [
        "How your gut microbiome affects your mood",
        "The science of intermittent fasting",
        "Why you need deep sleep and how to get it",
        "How stress physically damages your body",
        "The truth about sugar and your brain",
        "How exercise changes your brain chemistry",
        "Cold showers and their real benefits",
        "Why sitting all day is slowly killing you",
        "How meditation rewires the brain",
        "The best scientifically backed productivity hacks",
    ],
    Category.ENTERTAINMENT: [
        "The making of the most expensive movies ever",
        "How CGI has evolved over 30 years",
        "Why certain songs get stuck in your head",
        "The psychology behind viral videos",
        "How streaming changed the music industry",
        "The science of laughter",
        "How video game addiction works",
        "The history of animation",
        "Why nostalgia is so powerful",
        "How Hollywood decides which movies to make",
    ],
}


# ---------------------------------------------------------------------------
# Title style templates
# ---------------------------------------------------------------------------

_TITLE_TEMPLATES: dict[str, list[str]] = {
    "curiosity": [
        "The Surprising Truth About {topic}",
        "Nobody Talks About This: {topic}",
        "What They Never Taught You About {topic}",
        "The Hidden Side of {topic}",
        "Why {topic} Is More Fascinating Than You Think",
    ],
    "how_to": [
        "How {topic} Actually Works (Explained Simply)",
        "The Complete Beginner's Guide to {topic}",
        "Understanding {topic} in Under 10 Minutes",
        "How to Master {topic} Step by Step",
        "{topic}: Everything You Need to Know",
    ],
    "listicle": [
        "7 Shocking Facts About {topic}",
        "10 Things You Didn't Know About {topic}",
        "5 Reasons {topic} Will Change Everything",
        "Top 8 Myths About {topic} — Debunked",
        "6 Mind-Blowing {topic} Discoveries",
    ],
    "story": [
        "The Untold Story of {topic}",
        "How {topic} Changed the World Forever",
        "The Rise and Fall of {topic}",
        "{topic}: A Story Nobody Knows",
        "The Real History Behind {topic}",
    ],
    "question": [
        "What Is {topic} and Why Should You Care?",
        "Can {topic} Really Change Your Life?",
        "Is {topic} as Good as Everyone Says?",
        "Why Does {topic} Even Exist?",
        "What Would Happen If {topic} Disappeared?",
    ],
}


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class VideoTopic:
    category: Category
    raw_topic: str
    title: str
    style: str
    suggested_tags: list[str] = field(default_factory=list)
    target_duration_mins: tuple[int, int] = (5, 10)


# ---------------------------------------------------------------------------
# Generator
# ---------------------------------------------------------------------------

class TopicGenerator:
    """
    Generates video topics and click-worthy titles across multiple categories.

    Args:
        llm_fn: Optional callable ``(prompt: str) -> str`` — if provided,
                ``generate_with_llm()`` will use it to generate creative topics
                beyond the built-in seed bank (e.g. pass in an Anthropic or
                OpenAI wrapper).
    """

    def __init__(self, llm_fn: Callable[[str], str] | None = None):
        self._llm_fn = llm_fn

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @staticmethod
    def all_categories() -> list[Category]:
        """Return all available categories."""
        return list(Category)

    def generate(
        self,
        category: Category,
        count: int = 5,
        title_style: str = "curiosity",
    ) -> list[VideoTopic]:
        """
        Generate *count* video topics for the given category.

        Args:
            category: One of the ``Category`` enum values.
            count: How many topics to return (capped at the seed pool size).
            title_style: Key into the title templates — one of
                         ``curiosity | how_to | listicle | story | question``.

        Returns:
            List of :class:`VideoTopic` dataclass instances.
        """
        if title_style not in _TITLE_TEMPLATES:
            raise ValueError(
                f"Unknown title_style {title_style!r}. "
                f"Choose from: {list(_TITLE_TEMPLATES)}"
            )

        seeds = _TOPIC_SEEDS.get(category, [])
        selected = random.sample(seeds, min(count, len(seeds)))

        return [
            VideoTopic(
                category=category,
                raw_topic=topic,
                title=self._make_title(topic, title_style),
                style=title_style,
                suggested_tags=self._make_tags(topic, category),
            )
            for topic in selected
        ]

    def generate_all_categories(
        self,
        per_category: int = 3,
        title_style: str = "curiosity",
    ) -> dict[Category, list[VideoTopic]]:
        """Return topics for every category at once."""
        return {
            cat: self.generate(cat, count=per_category, title_style=title_style)
            for cat in Category
        }

    def suggest_title(self, raw_topic: str, style: str = "curiosity") -> str:
        """Produce a single formatted title for any raw topic string."""
        return self._make_title(raw_topic, style)

    def generate_with_llm(self, prompt: str) -> str:
        """
        Delegate topic/title generation to the injected LLM callable.

        Raises ``RuntimeError`` if no ``llm_fn`` was provided at construction.

        Example prompt:
            "Generate 5 educational YouTube video topics about quantum physics
             for a general audience. For each topic give a catchy title and
             three relevant tags."
        """
        if self._llm_fn is None:
            raise RuntimeError(
                "No llm_fn provided. Pass a callable(prompt)->str when "
                "constructing TopicGenerator to enable LLM-powered generation."
            )
        return self._llm_fn(prompt)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _make_title(topic: str, style: str) -> str:
        template = random.choice(_TITLE_TEMPLATES[style])
        # Capitalise first letter of each word for YouTube title case
        formatted = topic.title() if topic == topic.lower() else topic
        return template.format(topic=formatted)

    @staticmethod
    def _make_tags(topic: str, category: Category) -> list[str]:
        """Build a basic tag list from the topic words + category name."""
        stop_words = {
            "a", "an", "the", "and", "or", "of", "in", "is", "are",
            "how", "why", "what", "your", "you", "to", "for",
        }
        words = [
            w.lower().strip(".,?!")
            for w in topic.split()
            if w.lower() not in stop_words and len(w) > 2
        ]
        tags = list(dict.fromkeys(words))  # deduplicate, preserve order
        tags.append(category.value.lower())
        tags.append("youtube")
        tags.append("education")
        # YouTube tag list must be ≤ 500 chars total
        result: list[str] = []
        total = 0
        for tag in tags:
            if total + len(tag) + 1 > 500:
                break
            result.append(tag)
            total += len(tag) + 1
        return result
