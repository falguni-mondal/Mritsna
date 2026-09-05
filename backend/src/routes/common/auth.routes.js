import express from "express";
import { 
  checkAuth, // <-- Added checkAuth import
  register, 
  login, 
  logout, 
  logoutAllOtherDevices, 
  deactivateAccount, 
  sendVerificationEmail, 
  verifyEmail, 
  changeEmailAndResendOtp
} from "../../controllers/common/auth.controller.js";
import { isValidUser } from "../../middleware/common/auth/auth.middleware.js";
import { validateLogin, validateRegister } from "../../middleware/user/auth.validation.js";
import { strictLimiter } from "../../middleware/common/rateLimiter.js";
import { trackVisit } from "../../middleware/user/trackVisit.middleware.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Immediately checks the user's session status on app load
router.get("/check-auth", trackVisit, isValidUser, checkAuth);

// Handles both brand new users and Guests claiming their Silent Accounts
router.post("/register", strictLimiter, validateRegister, register);

// Establishes the 30-day absolute session
router.post("/login", strictLimiter, validateLogin, login);


// ==========================================
// PROTECTED VIP ROUTES (Requires Valid Access/Refresh Tokens)
// ==========================================

// Securely clears tokens but keeps device_id to revert to Guest
router.post("/logout", isValidUser, logout);

// Kills all sessions for this user EXCEPT the current device
router.post("/logout-all", isValidUser, logoutAllOtherDevices);

// Deactivates the account and destroys all global sessions
router.post("/deactivate", isValidUser, deactivateAccount);

// Generates a 6-digit OTP and sends it via email
router.post("/send-verification", strictLimiter, isValidUser, sendVerificationEmail);

// Verifies the provided 6-digit OTP
router.post("/verify-email", strictLimiter, isValidUser, verifyEmail);

router.post("/change-email", strictLimiter, isValidUser, changeEmailAndResendOtp);


export default router;