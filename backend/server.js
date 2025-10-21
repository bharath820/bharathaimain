import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import dotenv from "dotenv";
const app = express();

dotenv.config();

const allowedOrigins = [
  "https://bharathaimain-1.onrender.com",
  "http://localhost:5173", // for local dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());


// Health check
app.get('/api/check', (req, res) => res.json({ status: 'ok' }));

mongoose.connect(config.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

app.use("/api/auth", authRoutes);
app.use('/api', chatRoutes);

// Fallback for non-existent routes (404 as JSON)
app.get("/", (req, res) => res.send("API running"));

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

console.log("CORS enabled for frontend origins");



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
