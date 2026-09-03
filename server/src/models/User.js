import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

export const ROLES = ["donor", "recipient", "hospital", "admin"];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, select: false }, // absent for Google-only accounts
    googleId: { type: String, index: true, sparse: true },
    avatarUrl: { type: String },
    role: { type: String, enum: ROLES, required: true, default: "recipient" },
    hospital: { type: Schema.Types.ObjectId, ref: "Hospital" }, // set when role === 'hospital'
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, 10);
};

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatarUrl: this.avatarUrl,
    role: this.role,
    hospital: this.hospital,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("User", userSchema);
