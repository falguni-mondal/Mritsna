import express from 'express';
import {
  checkEligibility,
  addReview,
  updateReview,
  getProductReviews,
  getImageKitAuth,
  deleteImageKitFileRoute
} from '../../controllers/common/review.controller.js';

import { optionalAuth } from '../../middleware/common/auth/auth.middleware.js';

const router = express.Router();

router.get('/imagekit/auth', optionalAuth, getImageKitAuth);
router.delete('/imagekit/:fileId', optionalAuth, deleteImageKitFileRoute);

router.get('/product/:slug', optionalAuth, getProductReviews);
router.get('/eligibility/:productId', optionalAuth, checkEligibility);

router.post('/', optionalAuth, addReview);

router.put('/:reviewId', optionalAuth, updateReview);

export default router;