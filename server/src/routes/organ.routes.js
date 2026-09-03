import { Router } from "express";
import Organ from "../models/Organ.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("hospital", "admin"));

/**
 * GET /api/organs?status=&organType=&q=&page=&limit=
 * Search/filter organs. Hospitals only see organs procured at their own
 * hospital; admins see everything.
 */
router.get("/", async (req, res) => {
  const { status, organType, q, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (req.user.role === "hospital") {
    filter.procurementHospital = req.user.hospital;
  }
  if (status) filter.status = status;
  if (organType) filter.organType = organType;
  if (q) filter.code = { $regex: q, $options: "i" };

  const [organs, total] = await Promise.all([
    Organ.find(filter)
      .populate("donor", "bloodGroup")
      .populate("procurementHospital", "name city")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Organ.countDocuments(filter),
  ]);

  res.json({ organs, total, page: Number(page), limit: Number(limit) });
});

/** GET /api/organs/:id */
router.get("/:id", async (req, res) => {
  const organ = await Organ.findById(req.params.id)
    .populate("donor")
    .populate("procurementHospital", "name city state");
  if (!organ) return res.status(404).json({ error: "Organ not found" });
  res.json({ organ });
});

export default router;
