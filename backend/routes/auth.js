import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { config } from "../config.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                                🔹 REGISTER                                 */
/* -------------------------------------------------------------------------- */
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      email, 
      password: hashedPassword, 
      name: name || email.split("@")[0] 
    });
    await user.save();

    res.status(201).json({ 
      message: "User registered successfully", 
      user: { email, name: user.name } 
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------------------------------------------------- */
/*                                🔹 LOGIN                                    */
/* -------------------------------------------------------------------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { 
        email: user.email, 
        name: user.name,
        picture: user.picture 
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------------------------------------------------- */
/*                           🔹 GOOGLE LOGIN (FIREBASE)                        */
/* -------------------------------------------------------------------------- */
router.post('/google', async (req, res) => {
  const { idToken, accessToken, email, name, picture } = req.body;
  
  try {
    console.log("📥 Google login request:", { email, name });

    // Support both Firebase ID token and old access token format
    const token = idToken || accessToken;
    if (!token || !email) {
      return res.status(400).json({ message: "Missing token or email" });
    }

    let googleUser;

    // If Firebase ID token, verify it with Google tokeninfo endpoint
    if (idToken) {
      try {
        // Verify Firebase ID token with Google's tokeninfo endpoint
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
        );

        if (!verifyRes.ok) {
          console.error("❌ Firebase ID token verification failed:", verifyRes.status);
          return res.status(401).json({ message: "Invalid Firebase ID token" });
        }

        const tokenInfo = await verifyRes.json();
        googleUser = {
          email: tokenInfo.email,
          name: tokenInfo.name,
          picture: tokenInfo.picture,
        };
        console.log("✅ Firebase ID token verified:", googleUser.email);
      } catch (error) {
        console.error("❌ Token verification error:", error);
        return res.status(401).json({ message: "Token verification failed" });
      }
    } else {
      // Old method: Verify access token with Google userinfo
      const verifyRes = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!verifyRes.ok) {
        console.error("❌ Google verification failed:", verifyRes.status);
        return res.status(401).json({ message: "Invalid Google access token" });
      }

      googleUser = await verifyRes.json();
      console.log("✅ Google user verified:", googleUser.email);
    }

    // ✅ Ensure emails match
    if (googleUser.email !== email) {
      return res.status(401).json({ message: "Email mismatch" });
    }

    // ✅ Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      console.log("➕ Creating new user:", email);
      user = await User.create({
        email,
        name: name || email.split("@")[0],
        picture,
        authProvider: 'google',
        // No password for Google users
      });
    } else {
      // Update user info if needed
      if (picture && user.picture !== picture) {
        user.picture = picture;
        await user.save();
      }
    }

    // ✅ Generate JWT token
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log("✅ JWT token generated for:", user.email);

    res.json({
      message: "Google login successful",
      token: jwtToken,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
});

export default router;
