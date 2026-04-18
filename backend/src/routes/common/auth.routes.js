import express from "express";
import { 
  register, 
  login, 
  logout, 
  logoutAllOtherDevices, 
  deactivateAccount, 
  sendVerificationEmail, 
  verifyEmail 
} from "../../controllers/common/auth.controller.js";
import { isValidUser } from "../../middleware/common/auth/auth.middleware.js";
import { validateLogin, validateRegister } from "../../middleware/user/auth.middleware.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (No Token Required)
// ==========================================

// Handles both brand new users and Guests claiming their Silent Accounts
router.post("/register", validateRegister, register);

// Establishes the 30-day absolute session
router.post("/login", validateLogin, login);


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
router.post("/send-verification", isValidUser, sendVerificationEmail);

// Verifies the provided 6-digit OTP
router.post("/verify-email", isValidUser, verifyEmail);


export default router;