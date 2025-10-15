import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import Otp from "../models/otp.js";
import { config } from "../config.js";


import passport from "passport";
import session from "express-session";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import  { OAuth2Client }  from 'google-auth-library';



const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// /// Session setup
// router.use(
//   session({
//     secret: config.SESSION_SECRET || "secret-key",
//     resave: false,
//     saveUninitialized: true,
//   })
// );

// router.use(passport.initialize());
// router.use(passport.session());

// // Configure Passport Google OAuth2 Strategy
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: config.GOOGLE_CLIENT_ID,
//       clientSecret: config.GOOGLE_CLIENT_SECRET,
//       callbackURL: `${config.BaseUrl}/api/auth/google/callback`,
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let user = await User.findOne({ email: profile.emails[0].value });

//         if (!user) {
//           user = await User.create({
//             email: profile.emails[0].value,
//             name: profile.displayName,
//             googleId: profile.id,
//             password: null,
//           });
//         }
//         done(null, user);
//       } catch (err) {
//         done(err, null);
//       }
//     }
//   )
// );

// // Serialize & deserialize
// passport.serializeUser((user, done) => done(null, user.id));
// passport.deserializeUser(async (id, done) => {
//   const user = await User.findById(id);
//   done(null, user);
// });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});


router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: "Missing credential" });

  try {
    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID, // MUST match exact client id
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name, avatar: picture, googleId, password: "" });
      await user.save();
    } else {
      // optionally update avatar/name/googleId if missing
      const update = {};
      if (!user.googleId) update.googleId = googleId;
      if (!user.avatar && picture) update.avatar = picture;
      if (!user.name && name) update.name = name;
      if (Object.keys(update).length) await User.updateOne({ _id: user._id }, { $set: update });
    }

    // Issue your own JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { email: user.email, name: user.name, avatar: user.avatar }});
  } catch (err) {
    console.error("Google verify error:", err?.message || err);
    res.status(401).json({ message: "Invalid Google token" });
  }
});



// Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ------------------- SEND OTP -------------------
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  console.log("📧 OTP request for email:", email);
  
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ User already exists:", email);
      return res.status(400).json({ message: "User already registered" });
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    console.log("🔢 Generated OTP:", otpCode);

    // Save OTP in DB
    await Otp.findOneAndUpdate(
      { email },
      { code: otpCode, expiresAt },
      { upsert: true, new: true }
    );
    console.log("💾 OTP saved to database");

    // Check email configuration
    if (!config.EMAIL_USER || !config.EMAIL_PASS) {
      console.error("❌ Email configuration missing");
      return res.status(500).json({ message: "Email service not configured" });
    }

    // Send OTP email
    console.log("📤 Sending email...");
    await transporter.sendMail({
      from: config.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otpCode}. It expires in 10 minutes.`,
    });
    console.log("✅ Email sent successfully");

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("❌ Send OTP error:", err);
    res.status(500).json({ message: `Server error: ${err.message}` });
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
