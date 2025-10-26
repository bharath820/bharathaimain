// backend/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: String,
  imageUrl: String,
  isImage: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Message", messageSchema);
