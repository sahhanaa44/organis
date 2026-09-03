import mongoose from "mongoose";

const { Schema } = mongoose;

export const NOTIFICATION_TYPES = [
  "organ_available",
  "match_completed",
  "allocation_review_required",
  "allocation_approved",
  "transplant_scheduled",
  "status_updated",
  "general",
];

const notificationSchema = new Schema(
  {
    recipientUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedOrgan: { type: Schema.Types.ObjectId, ref: "Organ" },
    relatedMatch: { type: Schema.Types.ObjectId, ref: "Match" },
    relatedAllocation: { type: Schema.Types.ObjectId, ref: "Allocation" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientUser: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
