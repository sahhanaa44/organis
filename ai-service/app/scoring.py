"""
Organis compatibility engine.

Design goals:
  1. Deterministic and explainable — every factor can be traced back to a
     concrete rule or formula, never a black-box number.
  2. Configurable — weights live in config.py and can be overridden per-request.
  3. Uses real numerical tooling (NumPy for vector math, scikit-learn's cosine
     similarity for HLA/tissue-marker overlap) rather than faking an "AI" score
     with random numbers.

Hard medical rules (e.g. ABO incompatibility, organ-type mismatch) disqualify
a candidate outright rather than merely lowering their score, mirroring real
allocation policy: a physically incompatible match is never "ranked low", it
is excluded.
"""
from __future__ import annotations

import math
from datetime import datetime

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from .config import DEFAULT_WEIGHTS, MAX_DISTANCE_KM, MAX_WAITING_DAYS, URGENCY_LEVELS, MatchWeights
from .schemas import DonorOrganInput, FactorBreakdown, MatchResult, RecipientCandidateInput

MODEL_VERSION = "organis-scoring-v1.0.0-deterministic"

# Standard ABO+Rh compatibility chart for donor -> recipient (transplant / transfusion logic).
# Key = donor blood group, value = set of recipient groups the donor is compatible with.
_BLOOD_COMPATIBILITY: dict[str, set[str]] = {
    "O-": {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"},  # universal donor
    "O+": {"O+", "A+", "B+", "AB+"},
    "A-": {"A-", "A+", "AB-", "AB+"},
    "A+": {"A+", "AB+"},
    "B-": {"B-", "B+", "AB-", "AB+"},
    "B+": {"B+", "AB+"},
    "AB-": {"AB-", "AB+"},
    "AB+": {"AB+"},  # can only donate to AB+
}


def _blood_compatible(donor_group: str, recipient_group: str) -> bool:
    return recipient_group in _BLOOD_COMPATIBILITY.get(donor_group, set())


def _haversine_km(lat1, lon1, lat2, lon2) -> float | None:
    if None in (lat1, lon1, lat2, lon2):
        return None
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _hla_similarity(donor_markers: list[str], recipient_markers: list[str]) -> float:
    """
    Cosine similarity between one-hot encoded HLA marker sets, using
    scikit-learn. Returns 0..1. Falls back to Jaccard-style overlap if either
    side has no recorded markers (treated as neutral 0.5, since absence of
    data should not fabricate a false negative).
    """
    if not donor_markers or not recipient_markers:
        return 0.5
    vocab = sorted(set(donor_markers) | set(recipient_markers))
    d_vec = np.array([[1 if m in donor_markers else 0 for m in vocab]])
    r_vec = np.array([[1 if m in recipient_markers else 0 for m in vocab]])
    sim = cosine_similarity(d_vec, r_vec)[0][0]
    return float(np.clip(sim, 0.0, 1.0))


def _urgency_score(level: str) -> float:
    return URGENCY_LEVELS.get(level, 0.5)


def _waiting_score(days: int) -> float:
    return float(np.clip(days / MAX_WAITING_DAYS, 0.0, 1.0))


def _distance_score(km: float | None) -> float:
    if km is None:
        return 0.6  # unknown distance: neutral-ish, slightly favorable to not over-penalize missing geodata
    return float(np.clip(1 - (km / MAX_DISTANCE_KM), 0.0, 1.0))


def _size_score(donor_size: float | None, recipient_size: float | None) -> float:
    if donor_size is None or recipient_size is None:
        return 0.6
    diff_ratio = abs(donor_size - recipient_size) / max(donor_size, recipient_size)
    return float(np.clip(1 - diff_ratio, 0.0, 1.0))


def _medical_score(candidate: RecipientCandidateInput, donor: DonorOrganInput) -> tuple[float, bool, str | None]:
    """
    Returns (score, disqualified, reason). A contraindication explicitly
    naming the organ type disqualifies the candidate; other prior conditions
    only reduce the medical-compatibility score.
    """
    contraindications = [c.lower() for c in candidate.contraindications]
    if any(donor.organ_type.replace("_", " ") in c for c in contraindications):
        return 0.0, True, f"Recorded contraindication for {donor.organ_type.replace('_', ' ')} transplantation"

    penalty = min(0.08 * len(candidate.prior_conditions), 0.4)
    score = float(np.clip(1.0 - penalty, 0.0, 1.0))
    return score, False, None


def score_candidates(
    donor_organ: DonorOrganInput,
    candidates: list[RecipientCandidateInput],
    weight_overrides: dict | None = None,
) -> tuple[list[MatchResult], dict]:
    weights = DEFAULT_WEIGHTS
    if weight_overrides:
        clean = {k: v for k, v in weight_overrides.items() if v is not None}
        if clean:
            weights = DEFAULT_WEIGHTS.model_copy(update=clean)
    weights = weights.normalized()

    factor_meta = [
        ("blood_compatibility", "Blood compatibility"),
        ("organ_compatibility", "Organ compatibility"),
        ("medical_compatibility", "Medical compatibility"),
        ("urgency", "Urgency"),
        ("waiting_time", "Waiting time"),
        ("distance", "Distance"),
        ("size_and_tissue_fit", "Size & tissue fit"),
    ]

    results: list[MatchResult] = []

    for candidate in candidates:
        reasons: list[str] = []

        organ_match = candidate.required_organ == donor_organ.organ_type
        if not organ_match:
            results.append(
                MatchResult(
                    recipient_id=candidate.recipient_id,
                    name=candidate.name,
                    compatibility_score=0.0,
                    priority_rank=0,
                    factors=[],
                    reasons=[],
                    disqualified=True,
                    disqualification_reason=f"Requires {candidate.required_organ}, donor organ is {donor_organ.organ_type}",
                )
            )
            continue

        blood_ok = _blood_compatible(donor_organ.blood_group, candidate.blood_group)
        if not blood_ok:
            results.append(
                MatchResult(
                    recipient_id=candidate.recipient_id,
                    name=candidate.name,
                    compatibility_score=0.0,
                    priority_rank=0,
                    factors=[],
                    reasons=[],
                    disqualified=True,
                    disqualification_reason=f"Blood group {donor_organ.blood_group} is not ABO/Rh compatible with recipient {candidate.blood_group}",
                )
            )
            continue

        medical_score, disqualified, dq_reason = _medical_score(candidate, donor_organ)
        if disqualified:
            results.append(
                MatchResult(
                    recipient_id=candidate.recipient_id,
                    name=candidate.name,
                    compatibility_score=0.0,
                    priority_rank=0,
                    factors=[],
                    reasons=[],
                    disqualified=True,
                    disqualification_reason=dq_reason,
                )
            )
            continue

        raw_scores = {
            "blood_compatibility": 1.0,  # already gated as compatible above
            "organ_compatibility": 1.0,  # already gated as exact match above
            "medical_compatibility": medical_score,
            "urgency": _urgency_score(candidate.urgency),
            "waiting_time": _waiting_score(candidate.waiting_since_days),
            "distance": _distance_score(
                _haversine_km(donor_organ.latitude, donor_organ.longitude, candidate.latitude, candidate.longitude)
            ),
            "size_and_tissue_fit": 0.5 * _size_score(donor_organ.organ_size_cm, candidate.body_size_cm)
            + 0.5 * _hla_similarity(donor_organ.hla_markers, candidate.hla_markers),
        }

        weight_map = weights.model_dump()
        total_score = sum(raw_scores[k] * weight_map[k] for k, _ in factor_meta)
        compatibility_pct = round(total_score * 100, 1)

        factors = []
        for key, label in factor_meta:
            w_pct = round(weight_map[key] * 100, 1)
            contribution_pct = round(raw_scores[key] * weight_map[key] * 100, 1)
            factors.append(
                FactorBreakdown(
                    label=label,
                    key=key,
                    weight_pct=w_pct,
                    raw_score=round(raw_scores[key], 3),
                    contribution_pct=contribution_pct,
                )
            )

        reasons.append("Compatible blood group")
        reasons.append("Required organ matches")
        if raw_scores["urgency"] >= 0.8:
            reasons.append("High urgency")
        elif raw_scores["urgency"] >= 0.55:
            reasons.append("Moderate urgency")
        if candidate.waiting_since_days >= 365:
            reasons.append("Extended waiting period")
        dist_km = _haversine_km(donor_organ.latitude, donor_organ.longitude, candidate.latitude, candidate.longitude)
        if dist_km is not None and dist_km <= MAX_DISTANCE_KM * 0.4:
            reasons.append("Suitable geographical distance")
        if raw_scores["size_and_tissue_fit"] >= 0.75:
            reasons.append("Strong tissue/size compatibility")
        if medical_score >= 0.9:
            reasons.append("No significant medical risk factors on file")

        results.append(
            MatchResult(
                recipient_id=candidate.recipient_id,
                name=candidate.name,
                compatibility_score=compatibility_pct,
                priority_rank=0,  # assigned after sort
                factors=factors,
                reasons=reasons,
            )
        )

    eligible = [r for r in results if not r.disqualified]
    eligible.sort(key=lambda r: r.compatibility_score, reverse=True)
    for i, r in enumerate(eligible, start=1):
        r.priority_rank = i

    disqualified_results = [r for r in results if r.disqualified]
    ordered = eligible + disqualified_results

    return ordered, weights.model_dump()
