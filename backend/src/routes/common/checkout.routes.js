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

import { optionalAuth } from "../../middleware/common/auth/auth.middleware.js"; 
import { validateRequest } from "../../middleware/common/checkout/validate.request.js";
import { regionMiddleware } from "../../middleware/common/regionMiddleware.js";

const router = express.Router();

router.post(
  "/calculate",
  optionalAuth,
  regionMiddleware,
  validateRequest(calculateTotalsSchema),
  calculateCheckoutTotals
);

router.post(
  "/create-order",
  optionalAuth,
  regionMiddleware,
  validateRequest(createOrderSchema),
  createRazorpayOrder
);

router.post(
  "/verify-payment",
  optionalAuth,
  validateRequest(verifyPaymentSchema),
  verifyRazorpayPayment
);

export default router;