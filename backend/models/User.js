// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for Google users
  name: { type: String },
  picture: { type: String },
  authProvider: { type: String, default: 'email' }, // 'email' or 'google'
}, { timestamps: true });

export default mongoose.model("User", userSchema);
