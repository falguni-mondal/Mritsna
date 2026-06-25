import express from "express";
import {
  calculateCheckoutTotals,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../../controllers/common/checkout.controller.js";
import {
  calculateTotalsSchema,
  createOrderSchema,
  verifyPaymentSchema,
} from "../../middleware/common/checkout/checkout.validation.js";

// Note: Replace these import paths with your actual middleware paths if different
import { optionalAuth } from "../../middleware/common/auth/auth.middleware.js"; 
import { validateRequest } from "../../middleware/common/checkout/validate.request.js";

const router = express.Router();

/**
 * @route   POST /api/checkout/calculate
 * @desc    Live calculation of cart totals, taxes, and coupon discounts
 * @access  Public / Optional Auth 
 */
router.post(
  "/calculate",
  optionalAuth,
  validateRequest(calculateTotalsSchema),
  calculateCheckoutTotals
);

/**
 * @route   POST /api/checkout/create-order
 * @desc    Initialize a Razorpay order and save a pending order in the database
 * @access  Public / Optional Auth
 */
router.post(
  "/create-order",
  optionalAuth,
  validateRequest(createOrderSchema),
  createRazorpayOrder
);

/**
 * @route   POST /api/checkout/verify-payment
 * @desc    Verify the cryptographic signature from Razorpay and fulfill the order
 * @access  Public / Optional Auth
 */
router.post(
  "/verify-payment",
  optionalAuth,
  validateRequest(verifyPaymentSchema),
  verifyRazorpayPayment
);

export default router;