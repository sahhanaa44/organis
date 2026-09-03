import mongoose from "mongoose";

const { Schema } = mongoose;

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const donorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    dateOfBirth: { type: Date },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    height_cm: { type: Number },
    weight_kg: { type: Number },
    hlaMarkers: [{ type: String }],
    medicalHistory: { type: String, trim: true },
    priorConditions: [{ type: String }],
    contraindications: [{ type: String }],
    location: {
      city: { type: String },
      state: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    consentGiven: { type: Boolean, default: false },
    consentDate: { type: Date },
    registeredHospital: { type: Schema.Types.ObjectId, ref: "Hospital" },
    isDeceasedDonor: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending_review", "eligible", "ineligible", "inactive"],
      default: "pending_review",
    },
  },
  { timestamps: true }
);

donorSchema.index({ bloodGroup: 1, status: 1 });

export default mongoose.model("Donor", donorSchema);
