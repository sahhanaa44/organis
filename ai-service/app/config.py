"""
Configurable weighting for the Organis compatibility engine.

These weights sum to 1.0 and can be tuned per deployment without touching
scoring logic. They intentionally mirror the breakdown shown in the product
brief (blood 30 / organ 25 / medical 18 / urgency 9 / waiting 7 / distance 3 / 11
reserved for tissue/size fit) — adjust freely for your own clinical policy.
"""
from pydantic import BaseModel, field_validator


class MatchWeights(BaseModel):
    blood_compatibility: float = 0.30
    organ_compatibility: float = 0.25
    medical_compatibility: float = 0.18
    urgency: float = 0.09
    waiting_time: float = 0.07
    distance: float = 0.03
    size_and_tissue_fit: float = 0.08

    @field_validator("*")
    @classmethod
    def non_negative(cls, v):
        if v < 0:
            raise ValueError("weights must be non-negative")
        return v

    def total(self) -> float:
        return (
            self.blood_compatibility
            + self.organ_compatibility
            + self.medical_compatibility
            + self.urgency
            + self.waiting_time
            + self.distance
            + self.size_and_tissue_fit
        )

    def normalized(self) -> "MatchWeights":
        """Return a copy rescaled so components sum to exactly 1.0."""
        total = self.total()
        if total == 0:
            raise ValueError("weight total cannot be zero")
        data = self.model_dump()
        return MatchWeights(**{k: v / total for k, v in data.items()})


DEFAULT_WEIGHTS = MatchWeights()

# Maximum realistic values used to normalize raw factor inputs into 0-1 scores.
MAX_WAITING_DAYS = 365 * 3       # 3 years waiting is treated as "maximally waited"
MAX_DISTANCE_KM = 800            # beyond this, distance score bottoms out
URGENCY_LEVELS = {"low": 0.25, "medium": 0.55, "high": 0.8, "critical": 1.0}
