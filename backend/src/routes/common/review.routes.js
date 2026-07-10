import express from 'express';
import {
  checkEligibility,
  addReview,
  getProductReviews,
  getImageKitAuth,
  deleteImageKitFileRoute // Make sure this matches your controller export name exactly
} from '../../controllers/common/review.controller.js';

import { optionalAuth } from '../../middleware/common/auth/auth.middleware.js';

const router = express.Router();

// ==========================================
// IMAGEKIT ROUTES
// ==========================================
// Generate signature for real-time frontend uploads
router.get('/imagekit/auth', optionalAuth, getImageKitAuth);

// Delete an image from ImageKit if the user removes it from the UI
router.delete('/imagekit/:fileId', optionalAuth, deleteImageKitFileRoute);


// ==========================================
// REVIEW ROUTES
// ==========================================
// Fetch reviews for a product page
router.get('/product/:slug', optionalAuth, getProductReviews);

// Check if a user/guest is allowed to review a specific product
router.get('/eligibility/:productId', optionalAuth, checkEligibility);

// Submit a new review
router.post('/', optionalAuth, addReview);

export default router;