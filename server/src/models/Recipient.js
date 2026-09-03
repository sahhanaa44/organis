import mongoose from "mongoose";
import { BLOOD_GROUPS } from "./Donor.js";

const { Schema } = mongoose;

export const ORGAN_TYPES = ["kidney", "liver", "heart", "lung", "pancreas", "cornea", "small_intestine"];
export const URGENCY_LEVELS = ["low", "medium", "high", "critical"];
export const WAITLIST_STAGES = [
  "registration",
  "medical_review",
  "waiting_list",
  "potential_match",
  "human_review",
  "allocation",
];

const recipientSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    dateOfBirth: { type: Date },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    requiredOrgan: { type: String, enum: ORGAN_TYPES, required: true },
    urgency: { type: String, enum: URGENCY_LEVELS, required: true, default: "medium" },
    height_cm: { type: Number },
    weight_kg: { type: Number },
    hlaMarkers: [{ type: String }],
    priorConditions: [{ type: String }],
    contraindications: [{ type: String }],
    hospital: { type: Schema.Types.ObjectId, ref: "Hospital", required: true },
    location: {
      city: { type: String },
      state: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    waitlistStage: { type: String, enum: WAITLIST_STAGES, default: "registration" },
    waitingSince: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

recipientSchema.virtual("waitingDays").get(function computeWaitingDays() {
  if (!this.waitingSince) return 0;
  return Math.floor((Date.now() - this.waitingSince.getTime()) / (1000 * 60 * 60 * 24));
});
recipientSchema.set("toJSON", { virtuals: true });
recipientSchema.set("toObject", { virtuals: true });

recipientSchema.index({ requiredOrgan: 1, bloodGroup: 1, waitlistStage: 1 });
recipientSchema.index({ urgency: 1 });

export default mongoose.model("Recipient", recipientSchema);
