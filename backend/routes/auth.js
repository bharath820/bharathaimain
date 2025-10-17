import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import Otp from "../models/otp.js";
import { config } from "../config.js";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();
const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// ✅ Ensure EMAIL credentials exist
if (!config.EMAIL_USER || !config.EMAIL_PASS) {
  console.warn("⚠️ Missing email credentials in config.js or environment.");
}

// ✅ Gmail transporter for sending OTP emails
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use TLS
  requireTLS: true,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
   connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000
});

// ✅ Helper to generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/* -------------------------------------------------------------------------- */
/*                                🔹 SEND OTP                                 */
/* -------------------------------------------------------------------------- */
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }

    // Generate OTP and expiry time (10 min)
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP (update if already exists)
    await Otp.findOneAndUpdate(
      { email },
      { code: otpCode, expiresAt },
      { upsert: true, new: true }
    );

    // Send OTP via email
    const mailOptions = {
      from: `Auth System <${config.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <div style="font-family:sans-serif">
          <h2>🔐 Your Verification Code</h2>
          <p>Your OTP code is:</p>
          <h1 style="color:#007bff">${otpCode}</h1>
          <p>This code will expire in 10 minutes.</p>
          <br/>
          <p>Regards,<br/>Auth System</p>
        </div>
      `,
    };

    // Respond immediately so UI can proceed, send email asynchronously
    res.status(200).json({ message: "OTP sent successfully" });

    transporter
      .sendMail(mailOptions)
      .then(() => {
        // email sent successfully
      })
      .catch((err) => {
        console.error("❌ OTP Email Send Error:", err);
      });
  } catch (error) {
    console.error("❌ OTP Send Error:", error);
    return res.status(500).json({ message: "Server error sending OTP" });
  }
});

/* -------------------------------------------------------------------------- */
/*                           🔹 VERIFY OTP + REGISTER                         */
/* -------------------------------------------------------------------------- */
router.post("/verify-otp", async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password)
    return res
      .status(400)
      .json({ error: "Email, OTP, and password are required" });

  try {
    const otpEntry = await Otp.findOne({ email });
    if (!otpEntry) return res.status(400).json({ error: "OTP not found" });
    if (otpEntry.code !== otp) return res.status(400).json({ error: "Invalid OTP" });
    if (otpEntry.expiresAt < new Date())
      return res.status(400).json({ error: "OTP expired" });

    // Check user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already registered" });

    // Hash password & save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    // Delete OTP entry
    await Otp.deleteOne({ email });

    res.status(200).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ error: "Server error verifying OTP" });
  }
});

/* -------------------------------------------------------------------------- */
/*                                🔹 LOGIN                                    */
/* -------------------------------------------------------------------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------------------------------------------------- */
/*                           🔹 GOOGLE LOGIN (Optional)                       */
/* -------------------------------------------------------------------------- */
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential)
    return res.status(400).json({ message: "Missing credential" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: config.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name, avatar: picture, googleId });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { email: user.email, name: user.name, avatar: user.avatar },
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: "Invalid Google token" });
  }
});

export default router;