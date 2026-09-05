import express from 'express';
import { 
  getWishlist, 
  toggleWishlistItem, 
  syncWishlist, 
  clearWishlist,
  hydrateGuestWishlist // <-- 1. Import the new hydration controller
} from '../../controllers/common/wishlist.controller.js';

import { isValidUser } from '../../middleware/common/auth/auth.middleware.js'; 
import { regionMiddleware } from '../../middleware/common/regionMiddleware.js';
import { trackVisit } from '../../middleware/user/trackVisit.middleware.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (For Guests)
// ==========================================
router.post('/hydrate', regionMiddleware, hydrateGuestWishlist);


// ==========================================
// PROTECTED ROUTES (For Authenticated Users)
// ==========================================

router.get('/', trackVisit, isValidUser, regionMiddleware, getWishlist);

router.post('/toggle', isValidUser, toggleWishlistItem);
router.post('/sync', isValidUser, syncWishlist);
router.delete('/clear', isValidUser, clearWishlist);

export default router;