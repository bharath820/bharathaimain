
import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import OpenAI from "openai";

const router = express.Router();

// 🔐 JWT Auth Middleware
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

// 📋 GET all conversations
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user.id }).sort({
      updatedAt: -1,
    });
    res.json({ conversations });
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ error: "Failed to get conversations" });
  }
});

// ➕ CREATE new conversation
router.post("/conversations", authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const conv = await Conversation.create({
      user: req.user.id,
      title: title || "New Chat",
    });
    res.json({ conversation: conv });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// 💬 GET messages for a conversation
router.get("/conversations/:id/messages", authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ conversation: req.params.id }).sort({
      timestamp: 1,
    });
    res.json({ messages });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// 🧠 POST message & get AI response via OpenRouter
router.post("/search", authenticateToken, async (req, res) => {
  try {
    const { messages, conversationId } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array required" });
    }

    // 🧩 Find or create conversation
    let conv;
    if (conversationId) {
      conv = await Conversation.findOne({
        _id: conversationId,
        user: req.user.id,
      });
      if (!conv) return res.status(404).json({ error: "Conversation not found" });
      conv.updatedAt = new Date();
      await conv.save();
    } else {
      conv = await Conversation.create({ user: req.user.id, title: "New Chat" });
    }

    // 🗣️ Save user message
    const userMsg = messages[messages.length - 1];
    if (userMsg.role !== "user") {
      return res.status(400).json({ error: "Last message must be from user" });
    }

    await Message.create({
      conversation: conv._id,
      role: "user",
      content: userMsg.content,
      timestamp: new Date(),
    });

    // ✅ Validate OpenRouter API key
    if (!config.OPENROUTER_API_KEY) {
      console.error("❌ Missing OpenRouter API key");
      return res.status(500).json({ 
        error: "OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your .env file." 
      });
    }

    // Validate API key format
    if (!config.OPENROUTER_API_KEY.startsWith('sk-or-')) {
      console.error("❌ Invalid OpenRouter API key format");
      return res.status(500).json({ 
        error: "Invalid OpenRouter API key format. API key should start with 'sk-or-'." 
      });
    }

    // ⚙️ Initialize OpenRouter client
    const openai = new OpenAI({
      apiKey: config.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });

    console.log("📤 Sending to OpenRouter:", userMsg.content);

    // ✅ Use a valid OpenRouter model ID with proper configuration
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini", // Cost-effective model
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiText =
      completion.choices?.[0]?.message?.content || "⚠️ No AI response received";

    // 💾 Save AI response
    await Message.create({
      conversation: conv._id,
      role: "assistant",
      content: aiText,
      timestamp: new Date(),
    });

    res.json({ result: aiText, conversationId: conv._id });
  } catch (err) {
    console.error("🔥 Error in /search:", err.response?.data || err.message);
    
    // Handle specific OpenRouter API errors
    if (err.response?.status === 401) {
      return res.status(500).json({
        error: "Invalid OpenRouter API key. Please check your API key and try again."
      });
    } else if (err.response?.status === 429) {
      return res.status(500).json({
        error: "Rate limit exceeded. Please wait a moment and try again."
      });
    } else if (err.response?.status === 402) {
      return res.status(500).json({
        error: "Insufficient credits. Please add credits to your OpenRouter account."
      });
    } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return res.status(500).json({
        error: "Network error. Please check your internet connection and try again."
      });
    }
    
    // Generic error handling
    const errorMessage = err.response?.data?.error?.message || 
                        err.message || 
                        "Failed to get AI response from OpenRouter";
    
    res.status(500).json({
      error: errorMessage
    });
  }
});


router.post("/generate-image", authenticateToken, async (req, res) => {
  try {
    const { prompt, conversationId } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt required" });
    if (!conversationId) return res.status(400).json({ error: "conversationId required" });

    if (!config.STABILITY_API_KEY) {
      return res.status(500).json({ error: "Stability API key not configured" });
    }

    // Call Stability API
    const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-768x768/text-to-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.STABILITY_API_KEY}`,
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: 768,
        width: 768,
        samples: 1,
        steps: 30,
      }),
    });

    const data = await response.json();

    if (data.artifacts && data.artifacts.length > 0) {
      const imageBase64 = data.artifacts[0].base64;
      const imageUrl = `data:image/png;base64,${imageBase64}`;

      // Save assistant's image reply to the chat history
      await Message.create({
        conversation: conversationId,
        role: "assistant",
        content: `Here's the image you requested:`, // Optional short caption
        imageUrl,
        isImage: true,
        timestamp: new Date(),
      });

      res.json({ imageUrl });
    } else {
      res.status(500).json({ error: "Failed to generate image" });
    }
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({ error: "Failed to generate image" });
  }
});



export default router;

