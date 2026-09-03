import { Router } from "express";
import User from "../models/User.js";
import Donor from "../models/Donor.js";
import Recipient from "../models/Recipient.js";
import Organ from "../models/Organ.js";
import Match from "../models/Match.js";
import Allocation from "../models/Allocation.js";
import Hospital from "../models/Hospital.js";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { recordAudit } from "../utils/audit.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

function paginate(query) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  return { page, limit, skip: (page - 1) * limit };
}

/** GET /api/admin/dashboard — headline platform statistics */
router.get("/dashboard", async (req, res) => {
  const [
    totalDonors,
    totalRecipients,
    availableOrgans,
    pendingMatches,
    activeAllocations,
    completedAllocations,
    totalHospitals,
  ] = await Promise.all([
    Donor.countDocuments(),
    Recipient.countDocuments(),
    Organ.countDocuments({ status: "available" }),
    Match.countDocuments({ status: "pending_review" }),
    Allocation.countDocuments({ currentStage: { $nin: ["completed", "rejected"] } }),
    Allocation.countDocuments({ currentStage: "completed" }),
    Hospital.countDocuments(),
  ]);

  const organsByType = await Organ.aggregate([{ $group: { _id: "$organType", count: { $sum: 1 } } }]);
  const allocationsByStage = await Allocation.aggregate([
    { $group: { _id: "$currentStage", count: { $sum: 1 } } },
  ]);
  const recipientsByUrgency = await Recipient.aggregate([
    { $group: { _id: "$urgency", count: { $sum: 1 } } },
  ]);

  const monthlyAllocations = await Allocation.aggregate([
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    { $limit: 12 },
  ]);

  res.json({
    totals: {
      totalDonors,
      totalRecipients,
      availableOrgans,
      pendingMatches,
      activeAllocations,
      completedAllocations,
      totalHospitals,
    },
    organsByType,
    allocationsByStage,
    recipientsByUrgency,
    monthlyAllocations,
  });
});

/** GET /api/admin/users */
router.get("/users", async (req, res) => {
  const { role, q } = req.query;
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (role) filter.role = role;
  if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ users, total, page, limit });
});

/** PUT /api/admin/users/:id — update role / active status */
router.put("/users/:id", async (req, res) => {
  const { role, isActive } = req.body;
  const updates = {};
  if (role) updates.role = role;
  if (typeof isActive === "boolean") updates.isActive = isActive;

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ error: "User not found" });

  await recordAudit({ actor: req.user, action: "admin.user.updated", entityType: "User", entityId: user._id, metadata: updates, req });
  res.json({ user: user.toSafeJSON() });
});

/** GET /api/admin/donors */
router.get("/donors", async (req, res) => {
  const { status, bloodGroup, q } = req.query;
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (status) filter.status = status;
  if (bloodGroup) filter.bloodGroup = bloodGroup;

  let query = Donor.find(filter).populate("user", "name email").populate("registeredHospital", "name city");
  if (q) {
    const matchingUsers = await User.find({ name: { $regex: q, $options: "i" } }).select("_id");
    filter.user = { $in: matchingUsers.map((u) => u._id) };
    query = Donor.find(filter).populate("user", "name email").populate("registeredHospital", "name city");
  }

  const [donors, total] = await Promise.all([
    query.sort({ createdAt: -1 }).skip(skip).limit(limit),
    Donor.countDocuments(filter),
  ]);
  res.json({ donors, total, page, limit });
});

/** GET /api/admin/recipients */
router.get("/recipients", async (req, res) => {
  const { urgency, requiredOrgan, waitlistStage } = req.query;
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (urgency) filter.urgency = urgency;
  if (requiredOrgan) filter.requiredOrgan = requiredOrgan;
  if (waitlistStage) filter.waitlistStage = waitlistStage;

  const [recipients, total] = await Promise.all([
    Recipient.find(filter)
      .populate("user", "name email")
      .populate("hospital", "name city")
      .sort({ waitingSince: 1 })
      .skip(skip)
      .limit(limit),
    Recipient.countDocuments(filter),
  ]);
  res.json({ recipients, total, page, limit });
});

/** GET /api/admin/hospitals */
router.get("/hospitals", async (req, res) => {
  const hospitals = await Hospital.find().sort({ name: 1 });
  res.json({ hospitals });
});

/** GET /api/admin/audit-logs */
router.get("/audit-logs", async (req, res) => {
  const { entityType, action } = req.query;
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (action) filter.action = { $regex: action, $options: "i" };

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).populate("actor", "name role").sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ logs, total, page, limit });
});

export default router;
