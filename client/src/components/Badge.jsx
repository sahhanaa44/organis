import React from "react";

const TONES = {
  neutral: "bg-stone-100 text-stone-700",
  success: "bg-forest-100 text-forest-700",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-700",
  info: "bg-sage-100 text-forest-700",
};

const STATUS_TONE_MAP = {
  available: "success",
  eligible: "success",
  matched: "info",
  transplanted: "neutral",
  pending_review: "warning",
  reviewed: "info",
  human_review: "warning",
  allocation_pending: "warning",
  approved: "success",
  transplant_scheduled: "info",
  completed: "success",
  rejected: "danger",
  cancelled: "danger",
  registration: "neutral",
  medical_review: "info",
  waiting_list: "warning",
  allocation: "success",
  critical: "danger",
  high: "warning",
  moderate: "info",
  low: "neutral",
};

export default function Badge({ status, children, tone }) {
  const resolvedTone = tone || STATUS_TONE_MAP[status] || "neutral";
  const label = children || (status ? status.replace(/_/g, " ") : "");
  return (
    <span className={`badge capitalize ${TONES[resolvedTone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
