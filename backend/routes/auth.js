import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import Otp from "../models/otp.js";
import { config } from "../config.js";

const router = express.Router();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});

// Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ------------------- SEND OTP -------------------
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already registered" });

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Save OTP in DB
    await Otp.findOneAndUpdate(
      { email },
      { code: otpCode, expiresAt },
      { upsert: true, new: true }
    );

    // Send OTP email
    await transporter.sendMail({
      from: config.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otpCode}. It expires in 10 minutes.`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------- VERIFY OTP + REGISTER -------------------
router.post("/verify-otp", async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password)
    return res.status(400).json({ error: "Email, OTP and password are required" });

  try {
    const otpEntry = await Otp.findOne({ email });
    if (!otpEntry) return res.status(400).json({ error: "OTP not found, request a new one" });
    if (otpEntry.code !== otp) return res.status(400).json({ error: "Invalid OTP" });
    if (otpEntry.expiresAt < new Date()) return res.status(400).json({ error: "OTP expired" });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already registered" });

    // ✅ Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save user with hashed password
    const user = new User({ email, password: hashedPassword });
    await user.save();

    // Delete OTP after registration
    await Otp.deleteOne({ email });

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------- LOGIN -------------------
// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, email: user.email }, config.JWT_SECRET, { expiresIn: "1d" });
    res.json({ user: { email: user.email, name: user.name || '' }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
