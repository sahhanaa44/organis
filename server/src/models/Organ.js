import mongoose from "mongoose";
import { BLOOD_GROUPS } from "./Donor.js";
import { ORGAN_TYPES } from "./Recipient.js";

const { Schema } = mongoose;

export const ORGAN_STATUS = [
  "available",
  "matching_in_progress",
  "matched",
  "allocated",
  "transplanted",
  "expired",
  "discarded",
];

const organSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g. "K-104"
    organType: { type: String, enum: ORGAN_TYPES, required: true },
    donor: { type: Schema.Types.ObjectId, ref: "Donor", required: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    hlaMarkers: [{ type: String }],
    organSizeCm: { type: Number },
    procurementHospital: { type: Schema.Types.ObjectId, ref: "Hospital", required: true },
    procuredAt: { type: Date, default: Date.now },
    viabilityHours: { type: Number, default: 24 },
    status: { type: String, enum: ORGAN_STATUS, default: "available" },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  { timestamps: true }
);

organSchema.virtual("expiresAt").get(function computeExpiry() {
  if (!this.procuredAt) return null;
  return new Date(this.procuredAt.getTime() + this.viabilityHours * 60 * 60 * 1000);
});
organSchema.set("toJSON", { virtuals: true });
organSchema.set("toObject", { virtuals: true });

organSchema.index({ organType: 1, status: 1 });

export default mongoose.model("Organ", organSchema);
