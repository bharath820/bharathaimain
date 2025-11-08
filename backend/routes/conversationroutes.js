import express from "express";
import Conversation from "../models/Conversation.js";
const router = express.Router();

// Get all conversations
router.get("/", async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ updatedAt: -1 });
    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single conversation
router.get("/:id", async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: "Not found" });
    res.json({ conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new conversation
router.post("/", async (req, res) => {
  try {
    const newConv = new Conversation({ title: req.body.title || "New Chat" });
    await newConv.save();
    res.json({ conversation: newConv });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete conversation
router.delete("/:id", async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.id);
    res.json({ message: "Conversation deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
