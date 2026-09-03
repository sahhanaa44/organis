from typing import Literal, Optional
from pydantic import BaseModel, Field

BloodGroup = Literal["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
OrganType = Literal["kidney", "liver", "heart", "lung", "pancreas", "cornea", "small_intestine"]
UrgencyLevel = Literal["low", "medium", "high", "critical"]


class DonorOrganInput(BaseModel):
    organ_id: str
    organ_type: OrganType
    blood_group: BloodGroup
    donor_age: int = Field(ge=0, le=120)
    hla_markers: list[str] = Field(default_factory=list)
    organ_size_cm: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    procured_at_hospital: Optional[str] = None


class RecipientCandidateInput(BaseModel):
    recipient_id: str
    name: str
    required_organ: OrganType
    blood_group: BloodGroup
    urgency: UrgencyLevel
    waiting_since_days: int = Field(ge=0)
    hla_markers: list[str] = Field(default_factory=list)
    body_size_cm: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    prior_conditions: list[str] = Field(default_factory=list)
    contraindications: list[str] = Field(default_factory=list)


class WeightOverrides(BaseModel):
    blood_compatibility: Optional[float] = None
    organ_compatibility: Optional[float] = None
    medical_compatibility: Optional[float] = None
    urgency: Optional[float] = None
    waiting_time: Optional[float] = None
    distance: Optional[float] = None
    size_and_tissue_fit: Optional[float] = None


class MatchRequest(BaseModel):
    donor_organ: DonorOrganInput
    candidates: list[RecipientCandidateInput]
    weight_overrides: Optional[WeightOverrides] = None


class FactorBreakdown(BaseModel):
    label: str
    key: str
    weight_pct: float
    raw_score: float
    contribution_pct: float


class MatchResult(BaseModel):
    recipient_id: str
    name: str
    compatibility_score: float
    priority_rank: int
    factors: list[FactorBreakdown]
    reasons: list[str]
    disqualified: bool = False
    disqualification_reason: Optional[str] = None


class MatchResponse(BaseModel):
    organ_id: str
    organ_type: OrganType
    total_candidates: int
    eligible_candidates: int
    results: list[MatchResult]
    weights_used: dict
    model_version: str
    disclaimer: str = (
        "AI recommendations are decision-support outputs only and must be "
        "reviewed by qualified clinical and authorized allocation personnel."
    )
