import express from 'express';
import { 
  getWishlist, 
  toggleWishlistItem, 
  syncWishlist, 
  clearWishlist 
} from '../../controllers/common/wishlist.controller.js';

// Import your middlewares
import { isValidUser } from '../../middleware/common/auth/auth.middleware.js'; 
import { regionMiddleware } from '../../middleware/common/regionMiddleware.js';

const router = express.Router();

// Apply auth to all routes below this line
router.use(isValidUser);

router.get('/', regionMiddleware, getWishlist);

router.post('/toggle', toggleWishlistItem);

router.post('/sync', syncWishlist);

router.delete('/clear', clearWishlist);

export default router;