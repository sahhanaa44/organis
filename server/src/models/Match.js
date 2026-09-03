import mongoose from "mongoose";

const { Schema } = mongoose;

const factorBreakdownSchema = new Schema(
  {
    label: String,
    key: String,
    weightPct: Number,
    rawScore: Number,
    contributionPct: Number,
  },
  { _id: false }
);

const candidateResultSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "Recipient", required: true },
    name: String,
    compatibilityScore: Number,
    priorityRank: Number,
    factors: [factorBreakdownSchema],
    reasons: [String],
    disqualified: { type: Boolean, default: false },
    disqualificationReason: String,
  },
  { _id: false }
);

export const MATCH_STATUS = ["pending_review", "reviewed", "superseded"];

const matchSchema = new Schema(
  {
    organ: { type: Schema.Types.ObjectId, ref: "Organ", required: true },
    hospital: { type: Schema.Types.ObjectId, ref: "Hospital", required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User" },
    modelVersion: { type: String },
    weightsUsed: { type: Schema.Types.Mixed },
    totalCandidates: { type: Number },
    eligibleCandidates: { type: Number },
    results: [candidateResultSchema],
    status: { type: String, enum: MATCH_STATUS, default: "pending_review" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

matchSchema.index({ organ: 1, createdAt: -1 });
matchSchema.index({ status: 1 });

export default mongoose.model("Match", matchSchema);
