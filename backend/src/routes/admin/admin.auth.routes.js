import express from "express";
import { 
  adminSignIn, 
  adminVerifyOTP, 
  adminLogout, 
  getAdminProfile, 
  adminResendOTP
} from "../../controllers/admin/admin.auth.controller.js";
import { isValidUser } from "../../middleware/common/auth/auth.middleware.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (Authentication Phase)
// ==========================================

// Step 1: Submit email and password to receive OTP
router.post("/signin", adminSignIn);

router.post("/resend-otp", adminResendOTP);

// Step 2: Submit email and OTP to establish a secure session
router.post("/verify", adminVerifyOTP);


// ==========================================
// PROTECTED ROUTES (Requires Active Session)
// ==========================================

// Retrieve the admin profile (used to validate session on frontend load)
router.get("/profile", isValidUser, getAdminProfile);

// Securely terminate the session and clear cookies
router.post("/logout", isValidUser, adminLogout);

export default router;