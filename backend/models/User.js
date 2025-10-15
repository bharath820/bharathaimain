import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name: { type: String, default: "" },
  avatar: { type: String, default: "" },
  password: { type: String, default: "" }, // empty for Google sign-ins
  googleId: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
