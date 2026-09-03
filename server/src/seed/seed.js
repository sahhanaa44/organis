/**
 * Seeds the Organis database with a realistic (but entirely fictional)
 * demo dataset: 8 hospitals, 15 donors, 25 recipients, 20 organs, plus
 * generated matches, allocations, notifications and audit logs.
 *
 * Usage:
 *   npm run seed          (from /server, with .env configured)
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";

import User from "../models/User.js";
import Hospital from "../models/Hospital.js";
import Donor from "../models/Donor.js";
import Recipient from "../models/Recipient.js";
import Organ from "../models/Organ.js";
import Match from "../models/Match.js";
import Allocation from "../models/Allocation.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";

import {
  CITIES,
  HOSPITAL_NAMES,
  BLOOD_GROUPS,
  ORGAN_TYPES,
  URGENCY_LEVELS,
  HLA_MARKER_POOL,
  PRIOR_CONDITIONS_POOL,
  pick,
  pickMany,
  randomInt,
  randomDateWithinDays,
  fullName,
} from "./data/reference.js";
import { localScore } from "./localScoring.js";

const WAITLIST_STAGES_POOL = ["registration", "medical_review", "waiting_list", "waiting_list", "waiting_list"];

async function wipe() {
  console.log("[seed] clearing existing collections...");
  await Promise.all([
    User.deleteMany({}),
    Hospital.deleteMany({}),
    Donor.deleteMany({}),
    Recipient.deleteMany({}),
    Organ.deleteMany({}),
    Match.deleteMany({}),
    Allocation.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
}

async function seedHospitals() {
  console.log("[seed] creating hospitals...");
  const hospitals = [];
  for (let i = 0; i < HOSPITAL_NAMES.length; i++) {
    const loc = CITIES[i % CITIES.length];
    const hospital = await Hospital.create({
      name: HOSPITAL_NAMES[i],
      licenseNumber: `ORG-LIC-${1000 + i}`,
      city: loc.city,
      state: loc.state,
      country: "India",
      location: { latitude: loc.lat + (Math.random() - 0.5) * 0.2, longitude: loc.lng + (Math.random() - 0.5) * 0.2 },
      contactEmail: `contact@${HOSPITAL_NAMES[i].toLowerCase().replace(/[^a-z]+/g, "")}.example`,
      contactPhone: `+91-9${randomInt(100000000, 999999999)}`,
      transplantPrograms: pickMany(ORGAN_TYPES, randomInt(3, ORGAN_TYPES.length)),
    });
    hospitals.push(hospital);
  }
  return hospitals;
}

async function seedAdminAndHospitalUsers(hospitals) {
  console.log("[seed] creating admin + hospital staff accounts...");
  const admin = new User({ name: "Sahhanaa Thiyagarajan", email: "admin@organis.demo", role: "admin" });
  await admin.setPassword("Demo@1234");
  await admin.save();

  const hospitalUsers = [];
  for (const hospital of hospitals) {
    const user = new User({
      name: `${hospital.name} Coordinator`,
      email: `coordinator@${hospital.contactEmail.split("@")[1]}`,
      role: "hospital",
      hospital: hospital._id,
    });
    await user.setPassword("Demo@1234");
    await user.save();
    hospitalUsers.push(user);
  }
  return { admin, hospitalUsers };
}

async function seedDonors(hospitals, count = 15) {
  console.log(`[seed] creating ${count} donors...`);
  const donors = [];
  for (let i = 0; i < count; i++) {
    const name = fullName();
    const loc = pick(CITIES);
    const user = new User({
      name,
      email: `donor${i + 1}@organis.demo`,
      role: "donor",
    });
    await user.setPassword("Demo@1234");
    await user.save();

    const donor = await Donor.create({
      user: user._id,
      dateOfBirth: randomDateWithinDays(365 * randomInt(20, 60)),
      bloodGroup: pick(BLOOD_GROUPS),
      height_cm: randomInt(150, 190),
      weight_kg: randomInt(50, 95),
      hlaMarkers: pickMany(HLA_MARKER_POOL, randomInt(3, 6)),
      medicalHistory: "No significant findings on file.",
      priorConditions: Math.random() > 0.7 ? pickMany(PRIOR_CONDITIONS_POOL, 1) : [],
      contraindications: [],
      location: { city: loc.city, state: loc.state, latitude: loc.lat, longitude: loc.lng },
      consentGiven: true,
      consentDate: randomDateWithinDays(200),
      registeredHospital: pick(hospitals)._id,
      status: "eligible",
    });
    donors.push(donor);
  }
  return donors;
}

async function seedRecipients(hospitals, count = 25) {
  console.log(`[seed] creating ${count} recipients...`);
  const recipients = [];
  for (let i = 0; i < count; i++) {
    const name = fullName();
    const loc = pick(CITIES);
    const user = new User({
      name,
      email: `recipient${i + 1}@organis.demo`,
      role: "recipient",
    });
    await user.setPassword("Demo@1234");
    await user.save();

    const waitingSince = randomDateWithinDays(730);
    const recipient = await Recipient.create({
      user: user._id,
      dateOfBirth: randomDateWithinDays(365 * randomInt(18, 70)),
      bloodGroup: pick(BLOOD_GROUPS),
      requiredOrgan: pick(ORGAN_TYPES),
      urgency: pick(URGENCY_LEVELS),
      height_cm: randomInt(150, 190),
      weight_kg: randomInt(50, 95),
      hlaMarkers: pickMany(HLA_MARKER_POOL, randomInt(3, 6)),
      priorConditions: pickMany(PRIOR_CONDITIONS_POOL, randomInt(0, 2)),
      contraindications: [],
      hospital: pick(hospitals)._id,
      location: { city: loc.city, state: loc.state, latitude: loc.lat, longitude: loc.lng },
      waitlistStage: pick(WAITLIST_STAGES_POOL),
      waitingSince,
    });
    recipients.push(recipient);
  }
  return recipients;
}

async function seedOrgans(donors, hospitals, count = 20) {
  console.log(`[seed] creating ${count} organs...`);
  const organs = [];
  for (let i = 0; i < count; i++) {
    const donor = pick(donors);
    const organType = pick(ORGAN_TYPES);
    const hospital = pick(hospitals);
    const code = `${organType.slice(0, 1).toUpperCase()}-${100 + i}`;
    const organ = await Organ.create({
      code,
      organType,
      donor: donor._id,
      bloodGroup: donor.bloodGroup,
      hlaMarkers: donor.hlaMarkers,
      organSizeCm: randomInt(8, 20),
      procurementHospital: hospital._id,
      procuredAt: randomDateWithinDays(10),
      viabilityHours: organType === "heart" ? 6 : organType === "kidney" ? 36 : 24,
      status: "available",
      location: hospital.location,
    });
    organs.push(organ);
  }
  return organs;
}

async function tryRemoteScore(donorOrgan, candidates) {
  const url = process.env.AI_SERVICE_URL || "http://localhost:8000";
  const payload = {
    donor_organ: {
      organ_id: donorOrgan.code,
      organ_type: donorOrgan.organType,
      blood_group: donorOrgan.bloodGroup,
      donor_age: 40,
      hla_markers: donorOrgan.hlaMarkers || [],
      organ_size_cm: donorOrgan.organSizeCm,
      latitude: donorOrgan.location?.latitude,
      longitude: donorOrgan.location?.longitude,
    },
    candidates: candidates.map((c) => ({
      recipient_id: String(c._id),
      name: c.userName || "Recipient",
      required_organ: c.requiredOrgan,
      blood_group: c.bloodGroup,
      urgency: c.urgency,
      waiting_since_days: c.waitingDays,
      hla_markers: c.hlaMarkers || [],
      body_size_cm: c.height_cm,
      latitude: c.location?.latitude,
      longitude: c.location?.longitude,
      prior_conditions: c.priorConditions || [],
      contraindications: c.contraindications || [],
    })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${url}/ai/match`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function seedMatchesAndAllocations(organs, recipients, adminUser) {
  console.log("[seed] generating matches and allocations (tries live AI service, falls back to local scoring)...");
  const recipientsByOrgan = {};
  for (const type of ORGAN_TYPES) {
    recipientsByOrgan[type] = recipients.filter((r) => r.requiredOrgan === type);
  }

  let matchCount = 0;
  let allocationCount = 0;

  // Only run matching for a subset of organs, mirroring a realistic snapshot
  // where not every organ has been analyzed yet.
  const organsToMatch = organs.slice(0, Math.min(12, organs.length));

  for (const organ of organsToMatch) {
    const candidates = recipientsByOrgan[organ.organType] || [];
    if (candidates.length === 0) continue;

    const candidatesWithDays = candidates.map((c) => ({
      ...c.toObject(),
      _id: c._id,
      waitingDays: Math.floor((Date.now() - new Date(c.waitingSince).getTime()) / (1000 * 60 * 60 * 24)),
    }));

    let results;
    let modelVersion = "organis-scoring-v1.0.0-local-seed-fallback";
    let weightsUsed = { blood_compatibility: 0.3, organ_compatibility: 0.25, medical_compatibility: 0.18, urgency: 0.09, waiting_time: 0.07, distance: 0.03, size_and_tissue_fit: 0.08 };

    const remote = await tryRemoteScore(organ, candidatesWithDays);
    if (remote) {
      modelVersion = remote.model_version;
      weightsUsed = remote.weights_used;
      results = remote.results.map((r) => ({
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
        reasons: r.reasons || [],
        disqualified: r.disqualified,
        disqualificationReason: r.disqualification_reason,
      }));
    } else {
      const scored = candidatesWithDays.map((c) => {
        const { compatibilityScore, disqualified } = localScore(organ, c);
        return {
          recipient: c._id,
          name: "Recipient",
          compatibilityScore,
          disqualified,
          reasons: disqualified ? [] : ["Compatible blood group", "Required organ matches"],
        };
      });
      const eligible = scored.filter((s) => !s.disqualified).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
      eligible.forEach((s, idx) => (s.priorityRank = idx + 1));
      results = [...eligible, ...scored.filter((s) => s.disqualified)];
    }

    const match = await Match.create({
      organ: organ._id,
      hospital: organ.procurementHospital,
      requestedBy: adminUser._id,
      modelVersion,
      weightsUsed,
      totalCandidates: candidates.length,
      eligibleCandidates: results.filter((r) => !r.disqualified).length,
      results,
      status: Math.random() > 0.4 ? "reviewed" : "pending_review",
    });
    matchCount++;

    organ.status = "matched";
    await organ.save();

    const topCandidate = results.find((r) => !r.disqualified);
    if (topCandidate && match.status === "reviewed") {
      const stageOptions = [
        "human_review",
        "allocation_pending",
        "approved",
        "transplant_scheduled",
        "completed",
      ];
      const finalStage = pick(stageOptions);
      const stageHistory = [{ stage: "eligibility_check" }, { stage: "ai_matching" }, { stage: "candidate_ranking" }];
      for (const s of stageOptions) {
        stageHistory.push({ stage: s });
        if (s === finalStage) break;
      }

      const allocation = await Allocation.create({
        organ: organ._id,
        recipient: topCandidate.recipient,
        match: match._id,
        hospital: organ.procurementHospital,
        compatibilityScoreAtAllocation: topCandidate.compatibilityScore,
        currentStage: finalStage,
        stageHistory,
        completedAt: finalStage === "completed" ? new Date() : undefined,
        transplantScheduledFor:
          finalStage === "transplant_scheduled" || finalStage === "completed"
            ? randomDateWithinDays(-14)
            : undefined,
      });
      allocationCount++;

      if (finalStage === "completed") {
        organ.status = "transplanted";
        await organ.save();
      }

      await Recipient.findByIdAndUpdate(topCandidate.recipient, {
        waitlistStage: finalStage === "completed" || finalStage === "approved" || finalStage === "transplant_scheduled" ? "allocation" : "human_review",
      });
    }
  }

  return { matchCount, allocationCount };
}

async function seedNotifications(recipients) {
  console.log("[seed] creating notifications...");
  const templates = [
    { type: "organ_available", title: "New compatible organ available", message: "A new organ matching your profile has entered the matching pipeline." },
    { type: "match_completed", title: "AI match analysis completed", message: "Your compatibility analysis has been completed and reviewed by the hospital team." },
    { type: "status_updated", title: "Status updated", message: "Your waitlist status has been updated." },
  ];
  let count = 0;
  for (const recipient of pickMany(recipients, Math.min(15, recipients.length))) {
    const t = pick(templates);
    await Notification.create({
      recipientUser: recipient.user,
      type: t.type,
      title: t.title,
      message: t.message,
      isRead: Math.random() > 0.5,
    });
    count++;
  }
  return count;
}

async function seedAuditLogs(adminUser) {
  console.log("[seed] creating baseline audit log entries...");
  const actions = ["auth.login.password", "donor.consent.given", "match.run", "allocation.approved"];
  for (const action of actions) {
    await AuditLog.create({
      actor: adminUser._id,
      actorRole: "admin",
      action,
      entityType: "System",
      entityId: new mongoose.Types.ObjectId(),
      metadata: { seed: true },
    });
  }
}

async function run() {
  await connectDB();
  await wipe();

  const hospitals = await seedHospitals();
  const { admin, hospitalUsers } = await seedAdminAndHospitalUsers(hospitals);
  const donors = await seedDonors(hospitals, 15);
  const recipients = await seedRecipients(hospitals, 25);
  const organs = await seedOrgans(donors, hospitals, 20);
  const { matchCount, allocationCount } = await seedMatchesAndAllocations(organs, recipients, admin);
  const notificationCount = await seedNotifications(recipients);
  await seedAuditLogs(admin);

  console.log("\n[seed] done. Summary:");
  console.log(`  Hospitals:      ${hospitals.length}`);
  console.log(`  Hospital staff: ${hospitalUsers.length}`);
  console.log(`  Donors:         ${donors.length}`);
  console.log(`  Recipients:     ${recipients.length}`);
  console.log(`  Organs:         ${organs.length}`);
  console.log(`  Matches:        ${matchCount}`);
  console.log(`  Allocations:    ${allocationCount}`);
  console.log(`  Notifications:  ${notificationCount}`);
  console.log("\n[seed] demo login credentials (password for all: Demo@1234):");
  console.log("  Admin:     admin@organis.demo");
  console.log("  Hospital:  coordinator@<hospital-domain>.example  (see admin > hospitals for exact emails)");
  console.log("  Donor:     donor1@organis.demo ... donor15@organis.demo");
  console.log("  Recipient: recipient1@organis.demo ... recipient25@organis.demo");

  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("[seed] failed:", err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
