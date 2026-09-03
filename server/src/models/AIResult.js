import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Raw archive of every AI-service request/response pair. Kept separate from
 * `Match` (the curated, UI-facing record) so the exact inputs and outputs
 * sent to/from the model are always reproducible for audit purposes.
 */
const aiResultSchema = new Schema(
  {
    organ: { type: Schema.Types.ObjectId, ref: "Organ", required: true },
    match: { type: Schema.Types.ObjectId, ref: "Match" },
    requestPayload: { type: Schema.Types.Mixed, required: true },
    responsePayload: { type: Schema.Types.Mixed, required: true },
    modelVersion: { type: String },
    latencyMs: { type: Number },
    success: { type: Boolean, default: true },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

aiResultSchema.index({ organ: 1, createdAt: -1 });

export default mongoose.model("AIResult", aiResultSchema);
