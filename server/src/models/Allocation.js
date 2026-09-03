import mongoose from "mongoose";

const { Schema } = mongoose;

export const ALLOCATION_STAGES = [
  "eligibility_check",
  "ai_matching",
  "candidate_ranking",
  "human_review",
  "allocation_pending",
  "approved",
  "transplant_scheduled",
  "completed",
  "rejected",
];

const stageHistorySchema = new Schema(
  {
    stage: { type: String, enum: ALLOCATION_STAGES, required: true },
    enteredAt: { type: Date, default: Date.now },
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  { _id: false }
);

const allocationSchema = new Schema(
  {
    organ: { type: Schema.Types.ObjectId, ref: "Organ", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "Recipient", required: true },
    match: { type: Schema.Types.ObjectId, ref: "Match", required: true },
    hospital: { type: Schema.Types.ObjectId, ref: "Hospital", required: true },
    compatibilityScoreAtAllocation: { type: Number },
    currentStage: { type: String, enum: ALLOCATION_STAGES, default: "eligibility_check" },
    stageHistory: [stageHistorySchema],
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    transplantScheduledFor: { type: Date },
    completedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

allocationSchema.index({ currentStage: 1 });
allocationSchema.index({ recipient: 1 });

export default mongoose.model("Allocation", allocationSchema);
