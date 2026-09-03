import mongoose from "mongoose";

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    actorRole: { type: String },
    action: { type: String, required: true }, // e.g. "allocation.approved"
    entityType: { type: String, required: true }, // e.g. "Allocation"
    entityId: { type: Schema.Types.ObjectId, required: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });

export default mongoose.model("AuditLog", auditLogSchema);
