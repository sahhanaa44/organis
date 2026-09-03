import { Router } from "express";
import Organ from "../models/Organ.js";
import Donor from "../models/Donor.js";
import Recipient from "../models/Recipient.js";
import Match from "../models/Match.js";
import AIResult from "../models/AIResult.js";
import Allocation from "../models/Allocation.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildMatchPayload, requestMatch } from "../services/aiService.js";
import { recordAudit } from "../utils/audit.js";
import { notifyUser } from "../utils/notify.js";

const router = Router();
router.use(requireAuth, requireRole("hospital", "admin"));

/**
 * POST /api/matches/run
 * body: { organId, weightOverrides? }
 *
 * 1. Loads the organ + donor.
 * 2. Finds eligible recipient candidates (same organ type, active on waitlist).
 * 3. Calls the FastAPI AI service for an explainable ranking.
 * 4. Persists a Match (curated) + AIResult (raw archive), updates organ status,
 *    advances matched recipients' waitlist stage, and notifies the hospital.
 */
router.post("/run", async (req, res) => {
  const { organId, weightOverrides } = req.body;
  if (!organId) return res.status(400).json({ error: "organId is required" });

  const organ = await Organ.findById(organId).populate("procurementHospital");
  if (!organ) return res.status(404).json({ error: "Organ not found" });

  if (req.user.role === "hospital" && String(organ.procurementHospital._id) !== String(req.user.hospital)) {
    return res.status(403).json({ error: "You can only run matching for organs procured at your own hospital" });
  }

  const donor = await Donor.findById(organ.donor);

  const candidates = await Recipient.find({
    requiredOrgan: organ.organType,
    isActive: true,
    waitlistStage: { $in: ["waiting_list", "medical_review", "registration", "potential_match"] },
  }).populate("user", "name");

  if (candidates.length === 0) {
    return res.status(200).json({ message: "No active recipients currently require this organ type.", results: [] });
  }

  organ.status = "matching_in_progress";
  await organ.save();

  const payload = buildMatchPayload(organ, donor, candidates, weightOverrides);
  const { data, latencyMs, success, error } = await requestMatch(payload);

  await AIResult.create({
    organ: organ._id,
    requestPayload: payload,
    responsePayload: data || { error },
    modelVersion: data?.model_version,
    latencyMs,
    success,
    errorMessage: success ? undefined : error,
  });

  if (!success) {
    organ.status = "available";
    await organ.save();
    return res.status(502).json({ error: `AI service error: ${error}` });
  }

  const results = data.results.map((r) => ({
    recipient: r.recipient_id,
    name: r.name,
    compatibilityScore: r.compatibility_score,
    priorityRank: r.priority_rank,
    factors: (r.factors || []).map((f) => ({
      label: f.label,
      key: f.key,
      weightPct: f.weight_pct,
      rawScore: f.raw_score,
      contributionPct: f.contribution_pct,
    })),
    reasons: r.reasons,
    disqualified: r.disqualified,
    disqualificationReason: r.disqualification_reason,
  }));

  const match = await Match.create({
    organ: organ._id,
    hospital: organ.procurementHospital._id,
    requestedBy: req.user._id,
    modelVersion: data.model_version,
    weightsUsed: data.weights_used,
    totalCandidates: data.total_candidates,
    eligibleCandidates: data.eligible_candidates,
    results,
  });

  organ.status = "matched";
  await organ.save();

  const eligible = results.filter((r) => !r.disqualified);
  await Recipient.updateMany(
    { _id: { $in: eligible.map((r) => r.recipient) } },
    { waitlistStage: "potential_match" }
  );

  for (const r of eligible.slice(0, 5)) {
    const recipientDoc = candidates.find((c) => String(c._id) === String(r.recipient));
    if (recipientDoc?.user) {
      await notifyUser({
        userId: recipientDoc.user._id,
        type: "match_completed",
        title: "AI match analysis completed",
        message: `A ${organ.organType} (${organ.code}) was analyzed against the waiting list. Your compatibility score: ${r.compatibilityScore}%.`,
        relatedOrgan: organ._id,
        relatedMatch: match._id,
      });
    }
  }

  await recordAudit({
    actor: req.user,
    action: "match.run",
    entityType: "Match",
    entityId: match._id,
    metadata: { organId: organ._id, eligibleCount: eligible.length },
    req,
  });

  res.status(201).json({ match });
});

/** GET /api/matches?organId=&hospitalId=&status= */
router.get("/", async (req, res) => {
  const { organId, status } = req.query;
  const filter = {};
  if (req.user.role === "hospital") filter.hospital = req.user.hospital;
  if (organId) filter.organ = organId;
  if (status) filter.status = status;

  const matches = await Match.find(filter)
    .populate("organ", "code organType status")
    .populate("hospital", "name city")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ matches });
});

/** GET /api/matches/:id — full explainable breakdown */
router.get("/:id", async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate("organ")
    .populate("hospital", "name city")
    .populate("results.recipient", "requiredOrgan bloodGroup urgency");
  if (!match) return res.status(404).json({ error: "Match not found" });
  res.json({ match });
});

/**
 * POST /api/matches/:id/review
 * Human review step: hospital staff pick a candidate from the ranked list
 * and move it into the allocation workflow. This is the point where AI
 * output becomes a human decision.
 */
router.post("/:id/review", async (req, res) => {
  const { recipientId, notes } = req.body;
  const match = await Match.findById(req.params.id).populate("organ");
  if (!match) return res.status(404).json({ error: "Match not found" });

  const chosen = match.results.find((r) => String(r.recipient) === String(recipientId) && !r.disqualified);
  if (!chosen) return res.status(400).json({ error: "Chosen recipient is not an eligible candidate in this match" });

  match.status = "reviewed";
  match.reviewedBy = req.user._id;
  match.reviewedAt = new Date();
  match.reviewNotes = notes;
  await match.save();

  const allocation = await Allocation.create({
    organ: match.organ._id,
    recipient: chosen.recipient,
    match: match._id,
    hospital: match.hospital,
    compatibilityScoreAtAllocation: chosen.compatibilityScore,
    currentStage: "human_review",
    stageHistory: [
      { stage: "eligibility_check", actor: req.user._id },
      { stage: "ai_matching", actor: req.user._id },
      { stage: "candidate_ranking", actor: req.user._id },
      { stage: "human_review", actor: req.user._id, notes },
    ],
  });

  await Recipient.findByIdAndUpdate(chosen.recipient, { waitlistStage: "human_review" });

  const recipientDoc = await Recipient.findById(chosen.recipient).populate("user", "name");
  if (recipientDoc?.user) {
    await notifyUser({
      userId: recipientDoc.user._id,
      type: "allocation_review_required",
      title: "Allocation requires review",
      message: `Your case has moved to human review for organ ${match.organ.code}.`,
      relatedAllocation: allocation._id,
      relatedMatch: match._id,
    });
  }

  await recordAudit({
    actor: req.user,
    action: "match.reviewed",
    entityType: "Allocation",
    entityId: allocation._id,
    metadata: { matchId: match._id, recipientId },
    req,
  });

  res.status(201).json({ match, allocation });
});

export default router;
