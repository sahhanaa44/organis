import { Router } from "express";
import Allocation, { ALLOCATION_STAGES } from "../models/Allocation.js";
import Organ from "../models/Organ.js";
import Recipient from "../models/Recipient.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { recordAudit } from "../utils/audit.js";
import { notifyUser } from "../utils/notify.js";

const router = Router();
router.use(requireAuth, requireRole("hospital", "admin"));

const RECIPIENT_STAGE_MAP = {
  human_review: "human_review",
  allocation_pending: "human_review",
  approved: "allocation",
  transplant_scheduled: "allocation",
  completed: "allocation",
};

/** GET /api/allocations?stage=&hospitalId= */
router.get("/", async (req, res) => {
  const { stage } = req.query;
  const filter = {};
  if (req.user.role === "hospital") filter.hospital = req.user.hospital;
  if (stage) filter.currentStage = stage;

  const allocations = await Allocation.find(filter)
    .populate("organ", "code organType status")
    .populate({ path: "recipient", populate: { path: "user", select: "name" } })
    .populate("hospital", "name city")
    .sort({ updatedAt: -1 });

  res.json({ allocations });
});

/** GET /api/allocations/:id — full stage timeline */
router.get("/:id", async (req, res) => {
  const allocation = await Allocation.findById(req.params.id)
    .populate("organ")
    .populate({ path: "recipient", populate: { path: "user", select: "name email" } })
    .populate("hospital", "name city")
    .populate("match");
  if (!allocation) return res.status(404).json({ error: "Allocation not found" });
  res.json({ allocation });
});

/**
 * POST /api/allocations/:id/advance
 * body: { stage, notes?, transplantScheduledFor? }
 * Moves the allocation forward through the workflow. Never auto-advances —
 * every transition is an explicit, audited human action.
 */
router.post("/:id/advance", async (req, res) => {
  const { stage, notes, transplantScheduledFor } = req.body;
  if (!ALLOCATION_STAGES.includes(stage)) {
    return res.status(400).json({ error: `stage must be one of: ${ALLOCATION_STAGES.join(", ")}` });
  }

  const allocation = await Allocation.findById(req.params.id).populate("organ");
  if (!allocation) return res.status(404).json({ error: "Allocation not found" });

  allocation.currentStage = stage;
  allocation.stageHistory.push({ stage, actor: req.user._id, notes });

  if (stage === "approved") {
    allocation.approvedBy = req.user._id;
  }
  if (stage === "transplant_scheduled" && transplantScheduledFor) {
    allocation.transplantScheduledFor = new Date(transplantScheduledFor);
  }
  if (stage === "completed") {
    allocation.completedAt = new Date();
    await Organ.findByIdAndUpdate(allocation.organ._id, { status: "transplanted" });
  }
  if (stage === "rejected") {
    allocation.rejectionReason = notes;
    await Organ.findByIdAndUpdate(allocation.organ._id, { status: "available" });
  }

  await allocation.save();

  const mappedRecipientStage = RECIPIENT_STAGE_MAP[stage];
  if (mappedRecipientStage) {
    await Recipient.findByIdAndUpdate(allocation.recipient, { waitlistStage: mappedRecipientStage });
  }

  const recipientDoc = await Recipient.findById(allocation.recipient).populate("user", "name");
  if (recipientDoc?.user) {
    const messages = {
      allocation_pending: "Your allocation is pending final confirmation.",
      approved: "Your allocation has been approved by the hospital review team.",
      transplant_scheduled: "Your transplant has been scheduled.",
      completed: "Your transplant has been marked as completed.",
      rejected: "This allocation did not proceed. Your care team will follow up.",
    };
    if (messages[stage]) {
      await notifyUser({
        userId: recipientDoc.user._id,
        type:
          stage === "approved"
            ? "allocation_approved"
            : stage === "transplant_scheduled"
            ? "transplant_scheduled"
            : "status_updated",
        title: "Status updated",
        message: messages[stage],
        relatedAllocation: allocation._id,
        relatedOrgan: allocation.organ._id,
      });
    }
  }

  await recordAudit({
    actor: req.user,
    action: `allocation.${stage}`,
    entityType: "Allocation",
    entityId: allocation._id,
    metadata: { notes },
    req,
  });

  res.json({ allocation });
});

export default router;
