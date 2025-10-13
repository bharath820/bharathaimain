import dotenv from "dotenv";
dotenv.config();

export const config = {
  MONGO_URI: process.env.MONGO_URI,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  JWT_SECRET: process.env.JWT_SECRET || "supersecretkey",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  STABILITY_API_KEY: process.env.STABILITY_AI_KEY,
};
export default config;