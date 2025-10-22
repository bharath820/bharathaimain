import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import OpenAI from "openai";
import fetch from "node-fetch";

const router = express.Router();

// 🔐 JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// 🧠 Initialize OpenAI Client
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

// ============================
// 📋 GET ALL CONVERSATIONS
// ============================
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json({ conversations });
  } catch (err) {
    console.error("❌ Get conversations error:", err);
    res.status(500).json({ error: "Failed to get conversations" });
  }
});

// ============================
// ➕ CREATE NEW CONVERSATION
// ============================
router.post("/conversations", authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const conversation = await Conversation.create({
      user: req.user.id,
      title: title || "New Chat",
    });
    res.json({ conversation });
  } catch (err) {
    console.error("❌ Create conversation error:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// ============================
// 💬 GET MESSAGES
// ============================
router.get("/conversations/:id/messages", authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ conversation: req.params.id }).sort({ timestamp: 1 });
    res.json({ messages });
  } catch (err) {
    console.error("❌ Get messages error:", err);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// ============================
// 🤖 TEXT GENERATION
// ============================
router.post("/generate-text", authenticateToken, async (req, res) => {
  try {
    const { messages, conversationId } = req.body;
    if (!messages?.length) return res.status(400).json({ error: "Messages are required" });

    let conversation = await Conversation.findOne({ _id: conversationId, user: req.user.id });
    if (!conversation) {
      conversation = await Conversation.create({ user: req.user.id, title: "New Chat" });
    }

    const userMsg = messages[messages.length - 1];
    await Message.create({
      conversation: conversation._id,
      role: "user",
      content: userMsg.content,
      timestamp: new Date(),
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiText = completion.choices?.[0]?.message?.content?.trim() || "⚠️ No response";
    await Message.create({
      conversation: conversation._id,
      role: "assistant",
      content: aiText,
      timestamp: new Date(),
    });

    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      result: aiText,
      message: {
        id: "assistant_" + Date.now(),
        content: aiText,
        role: "assistant",
        timestamp: new Date(),
        isImage: false,
      },
      conversationId: conversation._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Text generation failed" });
  }
});

// ============================
// 🎨 IMAGE GENERATION
// ============================
router.post("/generate-image", authenticateToken, async (req, res) => {
  try {
    const { prompt, conversationId } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    let conversation = await Conversation.findOne({ _id: conversationId, user: req.user.id });
    if (!conversation) {
      conversation = await Conversation.create({ user: req.user.id, title: "Image Chat" });
    }

    // Save user prompt
    await Message.create({
      conversation: conversation._id,
      role: "user",
      content: prompt,
      timestamp: new Date(),
    });

    // Generate image using DALL·E 3
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
    });

    const imageUrl = imageResponse.data?.[0]?.url || null;
    if (!imageUrl) throw new Error("No image generated");

    const aiMessage = await Message.create({
      conversation: conversation._id,
      role: "assistant",
      content: "Here's your generated image:",
      imageUrl,
      isImage: true,
      timestamp: new Date(),
    });

    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      message: {
        id: aiMessage._id,
        content: aiMessage.content,
        role: aiMessage.role,
        timestamp: aiMessage.timestamp,
        imageUrl,
        isImage: true,
      },
      conversationId: conversation._id,
    });
  } catch (err) {
    console.error("❌ Image generation error:", err);
    res.status(500).json({ error: `Image generation failed: ${err.message}` });
  }
});

// ============================
// 🧩 IMAGE PROXY (CORS FIX)
// ============================
router.get("/image-proxy", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send("URL is required");

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).send("Failed to fetch image");
    }

    res.set("Content-Type", response.headers.get("content-type") || "image/png");
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Image proxy error:", err);
    res.status(500).send("Failed to load image");
  }
});

export default router;
