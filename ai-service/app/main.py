import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import MatchRequest, MatchResponse
from .scoring import MODEL_VERSION, score_candidates

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("organis.ai-service")

app = FastAPI(
    title="Organis AI Matching Service",
    description=(
        "Deterministic, explainable organ-recipient compatibility scoring. "
        "Decision-support only — not a clinical or allocation authority."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tightened at the Node API layer; this service is internal-only
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}


@app.post("/ai/match", response_model=MatchResponse)
def match(payload: MatchRequest):
    if not payload.candidates:
        raise HTTPException(status_code=400, detail="At least one candidate is required")

    overrides = payload.weight_overrides.model_dump() if payload.weight_overrides else None

    try:
        results, weights_used = score_candidates(payload.donor_organ, payload.candidates, overrides)
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Scoring failed")
        raise HTTPException(status_code=500, detail=f"Scoring failed: {exc}") from exc

    eligible_count = sum(1 for r in results if not r.disqualified)

    return MatchResponse(
        organ_id=payload.donor_organ.organ_id,
        organ_type=payload.donor_organ.organ_type,
        total_candidates=len(payload.candidates),
        eligible_candidates=eligible_count,
        results=results,
        weights_used=weights_used,
        model_version=MODEL_VERSION,
    )
