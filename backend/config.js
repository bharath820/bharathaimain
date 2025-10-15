import dotenv from "dotenv";
dotenv.config();

export const config = {
  MONGO_URI: process.env.MONGO_URI,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  JWT_SECRET: process.env.JWT_SECRET || "supersecretkey",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  STABILITY_API_KEY: process.env.STABILITY_API_KEY,
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
  GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID",
  GOOGLE_CLIENT_SECRET: "YOUR_GOOGLE_CLIENT_SECRET",
  BaseUrl: "https://bharathaimain-1.onrender.com", // backend
  FrontendUrl: "http://localhost:5173", // frontend
};
export default config;