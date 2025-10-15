
import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import OpenAI from "openai";
import fetch from 'node-fetch';
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

const openai = new OpenAI({
  apiKey: config.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

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

    if (!messages?.length) return res.status(400).json({ error: "Messages required" });

    // find/create conversation
    let conv = await Conversation.findOne({ _id: conversationId, user: req.user.id });
    if (!conv) conv = await Conversation.create({ user: req.user.id, title: "New Chat" });

    // save user message
    const userMsg = messages[messages.length - 1];
    await Message.create({
      conversation: conv._id,
      role: "user",
      content: userMsg.content,
      timestamp: new Date(),
    });

    // send to OpenRouter
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiText = completion.choices?.[0]?.message?.content || "⚠️ No response";

    // save assistant message
    await Message.create({
      conversation: conv._id,
      role: "assistant",
      content: aiText,
      timestamp: new Date(),
    });

    res.json({ result: aiText, conversationId: conv._id });
  } catch (err) {
    console.error("🔥 /search error:", err);
    res.status(500).json({ error: err.message || "OpenRouter text generation failed" });
  }
});



router.post("/generate-image", authenticateToken, async (req, res) => {
  try {
    const { prompt, conversationId } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // Check if Stability AI key is configured
    if (!config.STABILITY_API_KEY) {
      return res.status(500).json({ error: "Stability AI API key not configured" });
    }

    // find or create conversation
    let conv = await Conversation.findOne({ _id: conversationId, user: req.user.id });
    if (!conv) conv = await Conversation.create({ user: req.user.id, title: "Image Chat" });

    // save user message
    await Message.create({
      conversation: conv._id,
      role: "user",
      content: prompt,
      timestamp: new Date(),
    });

    console.log("🎨 Generating image with prompt:", prompt);

    // Call Stability AI API directly
    const stabilityResponse = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.STABILITY_API_KEY}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30,
        }),
      }
    );

    if (!stabilityResponse.ok) {
      const errorData = await stabilityResponse.json().catch(() => ({}));
      console.error("❌ Stability AI API error:", errorData);
      throw new Error(`Stability AI API error: ${stabilityResponse.status} ${stabilityResponse.statusText}`);
    }

    const stabilityData = await stabilityResponse.json();
    console.log("✅ Stability AI response received");

    if (!stabilityData.artifacts || stabilityData.artifacts.length === 0) {
      throw new Error("No image generated by Stability AI");
    }

    // Convert base64 image to data URL
    const imageBase64 = stabilityData.artifacts[0].base64;
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    // save assistant image message
    await Message.create({
      conversation: conv._id,
      role: "assistant",
      content: `Here's the image you requested:`,
      imageUrl,
      isImage: true,
      timestamp: new Date(),
    });

    console.log("✅ Image generation completed successfully");
    res.json({ imageUrl, conversationId: conv._id });
  } catch (err) {
    console.error("❌ /generate-image error:", err);
    res.status(500).json({ error: `Image generation failed: ${err.message}` });
  }
});



export default router;

