import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 10_000,
});

/**
 * Builds the payload the FastAPI service expects, from a Mongoose Organ
 * document (populated with its Donor) and an array of eligible Recipient
 * documents.
 */
export function buildMatchPayload(organ, donor, candidates, weightOverrides) {
  return {
    donor_organ: {
      organ_id: organ.code,
      organ_type: organ.organType,
      blood_group: organ.bloodGroup,
      donor_age: donor?.dateOfBirth
        ? Math.floor((Date.now() - new Date(donor.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
        : 40,
      hla_markers: organ.hlaMarkers || [],
      organ_size_cm: organ.organSizeCm,
      latitude: organ.location?.latitude,
      longitude: organ.location?.longitude,
      procured_at_hospital: String(organ.procurementHospital),
    },
    candidates: candidates.map((r) => ({
      recipient_id: String(r._id),
      name: r.user?.name || "Recipient",
      required_organ: r.requiredOrgan,
      blood_group: r.bloodGroup,
      urgency: r.urgency,
      waiting_since_days: r.waitingDays ?? 0,
      hla_markers: r.hlaMarkers || [],
      body_size_cm: r.height_cm,
      latitude: r.location?.latitude,
      longitude: r.location?.longitude,
      prior_conditions: r.priorConditions || [],
      contraindications: r.contraindications || [],
    })),
    weight_overrides: weightOverrides || undefined,
  };
}

export async function requestMatch(payload) {
  const start = Date.now();
  try {
    const { data } = await client.post("/ai/match", payload);
    return { data, latencyMs: Date.now() - start, success: true };
  } catch (err) {
    const message = err.response?.data?.detail || err.message;
    return { data: null, latencyMs: Date.now() - start, success: false, error: message };
  }
}

export async function checkAIServiceHealth() {
  try {
    const { data } = await client.get("/health");
    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
