import mongoose from "mongoose";

const { Schema } = mongoose;

const hospitalSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: "India" },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String },
    transplantPrograms: [{ type: String }], // e.g. ["kidney", "liver"]
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hospitalSchema.index({ city: 1, state: 1 });

export default mongoose.model("Hospital", hospitalSchema);
