import { Router } from "express";
import Donor from "../models/Donor.js";
import Organ from "../models/Organ.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { recordAudit } from "../utils/audit.js";

const router = Router();
router.use(requireAuth, requireRole("donor"));

/** GET /api/donor/profile */
router.get("/profile", async (req, res) => {
  const donor = await Donor.findOne({ user: req.user._id }).populate("registeredHospital", "name city state");
  res.json({ donor });
});

/** PUT /api/donor/profile — create or update */
router.put("/profile", async (req, res) => {
  const allowed = [
    "dateOfBirth",
    "bloodGroup",
    "height_cm",
    "weight_kg",
    "hlaMarkers",
    "medicalHistory",
    "priorConditions",
    "contraindications",
    "location",
    "registeredHospital",
    "isDeceasedDonor",
  ];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  const donor = await Donor.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates, $setOnInsert: { user: req.user._id } },
    { upsert: true, new: true, runValidators: true }
  );

  await recordAudit({ actor: req.user, action: "donor.profile.updated", entityType: "Donor", entityId: donor._id, req });
  res.json({ donor });
});

/** POST /api/donor/consent */
router.post("/consent", async (req, res) => {
  const { consentGiven } = req.body;
  const donor = await Donor.findOneAndUpdate(
    { user: req.user._id },
    { consentGiven: !!consentGiven, consentDate: consentGiven ? new Date() : null },
    { new: true }
  );
  if (!donor) return res.status(404).json({ error: "Complete your donor profile first" });

  await recordAudit({
    actor: req.user,
    action: consentGiven ? "donor.consent.given" : "donor.consent.withdrawn",
    entityType: "Donor",
    entityId: donor._id,
    req,
  });
  res.json({ donor });
});

/** GET /api/donor/organs — organs registered against this donor */
router.get("/organs", async (req, res) => {
  const donor = await Donor.findOne({ user: req.user._id });
  if (!donor) return res.json({ organs: [] });
  const organs = await Organ.find({ donor: donor._id }).populate("procurementHospital", "name city");
  res.json({ organs });
});

/** POST /api/donor/organs — register organ availability (requires consent) */
router.post("/organs", async (req, res) => {
  const donor = await Donor.findOne({ user: req.user._id });
  if (!donor) return res.status(400).json({ error: "Complete your donor profile first" });
  if (!donor.consentGiven) return res.status(403).json({ error: "Consent is required before registering an organ" });

  const { organType, procurementHospital, organSizeCm, viabilityHours, location } = req.body;
  if (!organType || !procurementHospital) {
    return res.status(400).json({ error: "organType and procurementHospital are required" });
  }

  const code = `${organType.slice(0, 1).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const organ = await Organ.create({
    code,
    organType,
    donor: donor._id,
    bloodGroup: donor.bloodGroup,
    hlaMarkers: donor.hlaMarkers,
    organSizeCm,
    procurementHospital,
    viabilityHours: viabilityHours || 24,
    location: location || donor.location,
  });

  await recordAudit({ actor: req.user, action: "organ.registered", entityType: "Organ", entityId: organ._id, req });
  res.status(201).json({ organ });
});

export default router;
