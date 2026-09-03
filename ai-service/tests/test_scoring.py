from app.schemas import DonorOrganInput, RecipientCandidateInput
from app.scoring import score_candidates


def make_donor(**overrides):
    base = dict(
        organ_id="K-104",
        organ_type="kidney",
        blood_group="O-",
        donor_age=34,
        hla_markers=["A1", "A2", "B7"],
        organ_size_cm=11.5,
        latitude=13.0827,
        longitude=80.2707,
    )
    base.update(overrides)
    return DonorOrganInput(**base)


def make_candidate(**overrides):
    base = dict(
        recipient_id="R-001",
        name="A. Sharma",
        required_organ="kidney",
        blood_group="O+",
        urgency="high",
        waiting_since_days=420,
        hla_markers=["A1", "B7"],
        body_size_cm=11.0,
        latitude=13.05,
        longitude=80.25,
        prior_conditions=[],
        contraindications=[],
    )
    base.update(overrides)
    return RecipientCandidateInput(**base)


def test_compatible_match_scores_high():
    donor = make_donor()
    candidate = make_candidate()
    results, weights = score_candidates(donor, [candidate])
    assert len(results) == 1
    r = results[0]
    assert not r.disqualified
    assert r.compatibility_score > 70
    assert "Compatible blood group" in r.reasons
    assert abs(sum(weights.values()) - 1.0) < 1e-6


def test_incompatible_blood_group_is_disqualified():
    donor = make_donor(blood_group="A+")
    candidate = make_candidate(blood_group="B+")
    results, _ = score_candidates(donor, [candidate])
    assert results[0].disqualified
    assert "Blood group" in results[0].disqualification_reason


def test_wrong_organ_type_is_disqualified():
    donor = make_donor(organ_type="liver")
    candidate = make_candidate(required_organ="kidney")
    results, _ = score_candidates(donor, [candidate])
    assert results[0].disqualified


def test_contraindication_disqualifies():
    donor = make_donor()
    candidate = make_candidate(contraindications=["kidney transplant rejection history"])
    results, _ = score_candidates(donor, [candidate])
    assert results[0].disqualified


def test_ranking_orders_by_score_descending():
    donor = make_donor()
    strong = make_candidate(recipient_id="R-1", urgency="critical", waiting_since_days=900)
    weak = make_candidate(recipient_id="R-2", urgency="low", waiting_since_days=10, latitude=25.0, longitude=90.0)
    results, _ = score_candidates(donor, [weak, strong])
    eligible = [r for r in results if not r.disqualified]
    assert eligible[0].recipient_id == "R-1"
    assert eligible[0].priority_rank == 1
    assert eligible[0].compatibility_score >= eligible[1].compatibility_score


def test_weight_override_changes_ranking_emphasis():
    donor = make_donor()
    candidate = make_candidate()
    _, weights_default = score_candidates(donor, [candidate])
    _, weights_override = score_candidates(donor, [candidate], {"urgency": 0.5})
    assert weights_override["urgency"] > weights_default["urgency"]
    assert abs(sum(weights_override.values()) - 1.0) < 1e-6
