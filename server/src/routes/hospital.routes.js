import { Router } from "express";
import Organ from "../models/Organ.js";
import Recipient from "../models/Recipient.js";
import Match from "../models/Match.js";
import Allocation from "../models/Allocation.js";
import Hospital from "../models/Hospital.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Public/authenticated hospital list for dropdowns
router.get("/", async (req, res) => {
  const hospitals = await Hospital.find()
    .select("_id name city state")
    .sort({ name: 1 });

  res.json({ hospitals });
});

router.use(requireAuth, requireRole("hospital"));

/** GET /api/hospital/dashboard */
router.get("/dashboard", async (req, res) => {
  const hospitalId = req.user.hospital;
  if (!hospitalId) return res.status(400).json({ error: "This account is not linked to a hospital" });

  const [hospital, availableOrgans, activeRecipients, pendingMatches, activeAllocations, recentAllocations] =
    await Promise.all([
      Hospital.findById(hospitalId),
      Organ.countDocuments({ procurementHospital: hospitalId, status: "available" }),
      Recipient.countDocuments({ hospital: hospitalId, isActive: true }),
      Match.countDocuments({ hospital: hospitalId, status: "pending_review" }),
      Allocation.countDocuments({
        hospital: hospitalId,
        currentStage: { $nin: ["completed", "rejected"] },
      }),
      Allocation.find({ hospital: hospitalId })
        .sort({ updatedAt: -1 })
        .limit(8)
        .populate("organ", "code organType")
        .populate({ path: "recipient", populate: { path: "user", select: "name" } }),
    ]);

  res.json({
    hospital,
    stats: { availableOrgans, activeRecipients, pendingMatches, activeAllocations },
    recentAllocations,
  });
});

export default router;
