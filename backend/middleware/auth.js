import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]; // e.g. "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};
