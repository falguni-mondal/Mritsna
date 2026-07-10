import express from 'express';
import {
  checkEligibility,
  addReview,
  getProductReviews
} from '../../controllers/common/review.controller.js';

import { optionalAuth } from '../../middleware/common/auth/auth.middleware.js';

const router = express.Router();

// Fetch reviews for a product page
router.get('/product/:slug', optionalAuth, getProductReviews);

// Check if a user/guest is allowed to review a specific product
router.get('/eligibility/:productId', optionalAuth, checkEligibility);

// Submit a new review
router.post('/', optionalAuth, addReview);

export default router;