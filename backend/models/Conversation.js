import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  title: { type: String, default: 'New Chat' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Conversation', ConversationSchema);
