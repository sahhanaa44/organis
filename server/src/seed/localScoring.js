// A simplified JS mirror of ai-service/app/scoring.py, used only by the seed
// script when the FastAPI service is not reachable during seeding. The real
// runtime path always calls the FastAPI service (see services/aiService.js).

const BLOOD_COMPATIBILITY = {
  "O-": new Set(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]),
  "O+": new Set(["O+", "A+", "B+", "AB+"]),
  "A-": new Set(["A-", "A+", "AB-", "AB+"]),
  "A+": new Set(["A+", "AB+"]),
  "B-": new Set(["B-", "B+", "AB-", "AB+"]),
  "B+": new Set(["B+", "AB+"]),
  "AB-": new Set(["AB-", "AB+"]),
  "AB+": new Set(["AB+"]),
};

const URGENCY_SCORE = { low: 0.25, medium: 0.55, high: 0.8, critical: 1.0 };
const MAX_WAITING_DAYS = 365 * 3;

function haversineKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v === undefined || v === null)) return null;
  const r = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function localScore(donorOrgan, candidate) {
  const organMatch = candidate.requiredOrgan === donorOrgan.organType;
  const bloodOk = BLOOD_COMPATIBILITY[donorOrgan.bloodGroup]?.has(candidate.bloodGroup);

  if (!organMatch || !bloodOk) {
    return { compatibilityScore: 0, disqualified: true };
  }

  const urgency = URGENCY_SCORE[candidate.urgency] ?? 0.5;
  const waiting = clamp((candidate.waitingDays || 0) / MAX_WAITING_DAYS, 0, 1);
  const distKm = haversineKm(
    donorOrgan.location?.latitude,
    donorOrgan.location?.longitude,
    candidate.location?.latitude,
    candidate.location?.longitude
  );
  const distance = distKm === null ? 0.6 : clamp(1 - distKm / 800, 0, 1);
  const medical = clamp(1 - 0.08 * (candidate.priorConditions?.length || 0), 0, 1);

  const weights = {
    blood: 0.3,
    organ: 0.25,
    medical: 0.18,
    urgency: 0.09,
    waiting: 0.07,
    distance: 0.03,
    size: 0.08,
  };

  const score =
    1 * weights.blood +
    1 * weights.organ +
    medical * weights.medical +
    urgency * weights.urgency +
    waiting * weights.waiting +
    distance * weights.distance +
    0.7 * weights.size;

  return { compatibilityScore: Math.round(score * 1000) / 10, disqualified: false };
}
