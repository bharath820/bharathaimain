import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();
const app = express();

// ✅ Allowed frontends
const allowedOrigins = [
  "https://bharathaimain.vercel.app",
  "exp://", 
  "http://localhost:5173",
  "https://expo.dev"
];

// ✅ CORS setup
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow requests with no origin (like mobile)
      if (allowedOrigins.some(o => origin.startsWith(o))) {
        return callback(null, true);
      }
      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("CORS not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ FIX for image loading and cross-origin issues
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// ✅ JSON body parser
app.use(express.json());

// ✅ Health check
app.get("/api/check", (req, res) => res.json({ status: "ok" }));

// ✅ MongoDB connect
mongoose
  .connect(config.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

// ✅ Default route
app.get("/", (req, res) => res.send("API running"));

// ✅ 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

console.log("✅ CORS and COEP headers configured for frontend origins");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
