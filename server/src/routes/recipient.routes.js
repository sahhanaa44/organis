import { Router } from "express";
import Recipient from "../models/Recipient.js";
import Match from "../models/Match.js";
import Allocation from "../models/Allocation.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { recordAudit } from "../utils/audit.js";

const router = Router();
router.use(requireAuth, requireRole("recipient"));

/** GET /api/recipient/profile */
router.get("/profile", async (req, res) => {
  const recipient = await Recipient.findOne({ user: req.user._id }).populate("hospital", "name city state");
  res.json({ recipient });
});

/** PUT /api/recipient/profile */
router.put("/profile", async (req, res) => {
  const allowed = [
    "dateOfBirth",
    "bloodGroup",
    "requiredOrgan",
    "urgency",
    "height_cm",
    "weight_kg",
    "hlaMarkers",
    "priorConditions",
    "contraindications",
    "hospital",
    "location",
  ];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  const recipient = await Recipient.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates, $setOnInsert: { user: req.user._id, waitlistStage: "registration" } },
    { upsert: true, new: true, runValidators: true }
  );

  await recordAudit({
    actor: req.user,
    action: "recipient.profile.updated",
    entityType: "Recipient",
    entityId: recipient._id,
    req,
  });
  res.json({ recipient });
});

/** GET /api/recipient/waitlist — status timeline + any active match activity */
router.get("/waitlist", async (req, res) => {
  const recipient = await Recipient.findOne({ user: req.user._id }).populate("hospital", "name city state");
  if (!recipient) return res.status(404).json({ error: "Complete your recipient profile first" });

  const recentMatches = await Match.find({ "results.recipient": recipient._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("organ", "code organType");

  const activeAllocation = await Allocation.findOne({ recipient: recipient._id })
    .sort({ createdAt: -1 })
    .populate("organ", "code organType");

  const matchActivity = recentMatches.map((m) => {
    const mine = m.results.find((r) => String(r.recipient) === String(recipient._id));
    return {
      matchId: m._id,
      organCode: m.organ?.code,
      organType: m.organ?.organType,
      compatibilityScore: mine?.compatibilityScore,
      priorityRank: mine?.priorityRank,
      disqualified: mine?.disqualified,
      status: m.status,
      createdAt: m.createdAt,
    };
  });

  res.json({ recipient, matchActivity, activeAllocation });
});

export default router;
