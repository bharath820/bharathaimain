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
  "https://bharathaimain.vercel.app",
  "http://localhost:5173", // for local dev
];

app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (Postman, mobile apps)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      return callback(new Error("CORS not allowed"), false);
    }
    return callback(null, true);
  },
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  credentials: true, // if sending cookies
}));


app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});


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
