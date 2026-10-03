"""Typo-tolerant product search (no extra infra).

Blinkit resolves "brwn brd" to "brown bread". Our DB search is plain ILIKE,
so this module adds a stdlib-only fuzzy layer used as a fallback when the
exact query returns (almost) nothing:

- normalize: lowercase, strip punctuation, collapse whitespace
- consonant skeleton: "brown" -> "brwn", so vowel-drop typos still match
- token score: exact > prefix/substring > skeleton > edit similarity
- fuzzy_score: average of best-per-query-token, 0 when any token is poor
- correct_query: pick the best candidate above threshold, else None
"""

from __future__ import annotations

import re
from difflib import SequenceMatcher

_VOWELS = set("aeiou")
_MIN_TOKEN_SCORE = 0.5
_EDIT_FLOOR = 0.68


def normalize(text: str | None) -> str:
    if not text:
        return ""
    text = text.lower().replace("&", " and ")
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str | None) -> list[str]:
    return normalize(text).split()


def consonant_skeleton(token: str) -> str:
    """Drop vowels and collapse repeats: 'brown' -> 'brwn', 'cheese' -> 'chs'."""
    skel = "".join(ch for ch in token if ch not in _VOWELS)
    return re.sub(r"(.)\1+", r"\1", skel) or token


def _edit_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def token_score(query_token: str, candidate_token: str) -> float:
    """Similarity of one query token against one candidate token, 0..1."""
    if not query_token or not candidate_token:
        return 0.0
    if query_token == candidate_token:
        return 1.0
    if candidate_token.startswith(query_token) or query_token.startswith(candidate_token):
        return 0.9
    if query_token in candidate_token or candidate_token in query_token:
        return 0.82
    qsk, csk = consonant_skeleton(query_token), consonant_skeleton(candidate_token)
    if qsk and qsk == csk:
        return 0.85
    if qsk and csk and (csk.startswith(qsk) or qsk.startswith(csk)):
        return 0.78
    edit = _edit_similarity(query_token, candidate_token)
    return edit if edit >= _EDIT_FLOOR else 0.0


def fuzzy_score(query: str | None, text: str | None) -> float:
    """How well `text` matches `query`, 0..1. 0 when any query token is poor."""
    qtokens = tokenize(query)
    ctokens = tokenize(text)
    if not qtokens or not ctokens:
        return 0.0
    bests = [max(token_score(qt, ct) for ct in ctokens) for qt in qtokens]
    if min(bests) < _MIN_TOKEN_SCORE:
        return 0.0
    return sum(bests) / len(bests)


def correct_query(
    query: str | None,
    candidates: list[str],
    threshold: float = 0.55,
) -> str | None:
    """Return the best-matching candidate for a (likely mistyped) query.

    Returns None when the query already matches a candidate well or when
    nothing scores above `threshold`. Comparison is on normalized text so
    callers can pass raw product names.
    """
    norm_q = normalize(query)
    if not norm_q or not candidates:
        return None
    scored = [(fuzzy_score(norm_q, c), c) for c in candidates]
    scored.sort(key=lambda s: s[0], reverse=True)
    best_score, best = scored[0]
    if best_score < threshold:
        return None
    if normalize(best) == norm_q:
        return None
    return best
