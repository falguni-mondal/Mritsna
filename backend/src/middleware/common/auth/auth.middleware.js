import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import tokenizer from "../../../utils/tokenizer.js";
import Session from "../../../models/session.model.js";
import { cookieOptions, clearCookieOptions } from "../../../utils/cookie-options.js";

const accessSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

// --- Helper: Fallback to Guest ---
const handleOptionalFallback = (req, res, next) => {
  res.clearCookie("accessToken", clearCookieOptions);
  res.clearCookie("refreshToken", clearCookieOptions);
  req.user = null; // Explicitly set to null so controllers know it's a guest
  return next();
};

// --- Helper: DRY Suspicious Session Revocation ---
const revokeSuspiciousSession = async (req, res, next, session, reason, isOptional) => {
  console.warn({
    event: "suspicious_token_use",
    reason: reason,
    expectedDevice: session?.device_id,
    gotDevice: req.cookies.device_id,
    expectedIp: session?.ip_address,
    gotIp: req.ip,
    userId: session?.user,
    timestamp: new Date().toISOString(),
  });

  // Kill ALL sessions for this user and flag them as revoked to prevent widespread hijacking
  if (session?.user) {
    await Session.updateMany(
      { user: session.user }, 
      { isRevoked: true, expiry_at: new Date() }
    );
  }

  res.clearCookie("accessToken", clearCookieOptions);
  res.clearCookie("refreshToken", clearCookieOptions);
  res.clearCookie("device_id", clearCookieOptions);

  if (isOptional) return handleOptionalFallback(req, res, next);
  return res.status(401).json({ success: false, message: "Security Violation: Session Terminated" });
};

// --- Helper: Handle Tampered Tokens ---
const handleTamperedToken = async (req, res, next, refreshToken, isOptional) => {
  console.warn(`[Security] Token tampering detected from IP: ${req.ip}`);
  
  if (refreshToken) {
    try {
      // Decode without verifying signature to extract the session ID
      const decodedRefresh = jwt.decode(refreshToken);
      if (decodedRefresh && decodedRefresh.jti) {
        const session = await Session.findById(decodedRefresh.jti);
        if (session) {
          // Trigger the kill switch!
          return await revokeSuspiciousSession(req, res, next, session, "Active Token Tampering", isOptional);
        }
      }
    } catch (e) {
      // If decode fails entirely, proceed to standard wipe
    }
  }

  // If no session found, just wipe cookies and kick them out
  res.clearCookie("accessToken", clearCookieOptions);
  res.clearCookie("refreshToken", clearCookieOptions);
  
  if (isOptional) return handleOptionalFallback(req, res, next);
  return res.status(401).json({ success: false, message: "Security Violation: Invalid Token" });
};

// --- Core Rotation Logic ---
const refreshTokenSetup = async (req, res, next, refreshToken, isOptional = false) => {
  if (!refreshToken) {
    if (isOptional) return handleOptionalFallback(req, res, next);
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  try {
    const decodedRefresh = jwt.verify(refreshToken, refreshSecret);
    
    const session = await Session.findOne({ 
      _id: decodedRefresh.jti,
      isRevoked: false 
    });

    if (!session || session.expiry_at <= new Date()) {
      if (isOptional) return handleOptionalFallback(req, res, next);
      return res.status(401).json({ success: false, message: "Session expired or revoked." });
    }

    const reqDeviceId = req.cookies.device_id;

    // 2. Security Check: Device ID Match
    if (!reqDeviceId || reqDeviceId !== session.device_id) {
      return await revokeSuspiciousSession(req, res, next, session, "Device ID Mismatch", isOptional);
    }

    // 3. Security Check: IP Address Match
    if (req.ip !== session.ip_address) {
      return await revokeSuspiciousSession(req, res, next, session, "IP Address Mismatch", isOptional);
    }

    // 4. Security Check: Role Tampering
    if (decodedRefresh.role !== session.role) {
      return await revokeSuspiciousSession(req, res, next, session, "Role Mismatch", isOptional);
    }

    // --- Concurrent-Safe Session Rotation ---
    const oldExpiry = session.expiry_at;
    const remainingSeconds = Math.floor((oldExpiry.getTime() - Date.now()) / 1000);

    // Create the new session first
    const newSession = await Session.create({
      user: session.user,
      role: session.role,
      device_id: session.device_id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      expiry_at: oldExpiry, // Inherit absolute expiry
    });

    // Delete the old session after the new one is secure
    await Session.findByIdAndDelete(session._id);

    // Generate new tokens
    const newAccessToken = tokenizer.createAccessToken(newSession.user, newSession.role);
    const newRefreshToken = tokenizer.createRefreshToken(newSession._id, newSession.user, newSession.role, remainingSeconds);

    // Set new cookies
    res.cookie("accessToken", newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", newRefreshToken, { ...cookieOptions, maxAge: remainingSeconds * 1000 });
    // Device ID gets rolling 1-year extension
    res.cookie("device_id", newSession.device_id, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });

    req.user = newSession.user.toString();
    next();
  } catch (error) {
    console.error("[Token Rotation Error]:", error.message);
    
    // If the refresh token itself was tampered with
    if (error.name === "JsonWebTokenError") {
      return await handleTamperedToken(req, res, next, refreshToken, isOptional);
    }

    if (isOptional) return handleOptionalFallback(req, res, next);
    return res.status(401).json({ success: false, message: "Invalid session token." });
  }
};

// --- EXPORTED MIDDLEWARES ---

// For strict VIP routes (e.g., /account)
export const isValidUser = async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;

  if (!accessToken) {
    return await refreshTokenSetup(req, res, next, refreshToken, false);
  }

  try {
    const decoded = jwt.verify(accessToken, accessSecret);
    req.user = decoded.sub;
    return next();
  } catch (error) {
    // Check EXACTLY why the token failed
    if (error.name === "TokenExpiredError") {
      return await refreshTokenSetup(req, res, next, refreshToken, false);
    }
    // If it's a JsonWebTokenError (tampering), drop the hammer
    return await handleTamperedToken(req, res, next, refreshToken, false);
  }
};

// For hybrid routes (e.g., /cart, /checkout)
export const optionalAuth = async (req, res, next) => {
  const { accessToken, refreshToken, device_id } = req.cookies;

  // 1. If absolute guest (No tokens at all)
  if (!accessToken && !refreshToken) {
    req.user = null;
    
    // Assign a device ID if they don't have one
    if (!device_id) {
      const newDeviceId = uuidv4();
      res.cookie("device_id", newDeviceId, { 
        ...cookieOptions, 
        maxAge: 365 * 24 * 60 * 60 * 1000 
      });
      req.cookies.device_id = newDeviceId; // Attach to current request so controllers can use it immediately
    }
    return next();
  }

  // 2. If tokens exist, attempt to verify
  if (!accessToken) {
    return await refreshTokenSetup(req, res, next, refreshToken, true);
  }

  try {
    const decoded = jwt.verify(accessToken, accessSecret);
    req.user = decoded.sub;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return await refreshTokenSetup(req, res, next, refreshToken, true);
    }
    return await handleTamperedToken(req, res, next, refreshToken, true);
  }
};