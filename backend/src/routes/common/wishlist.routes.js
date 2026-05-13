import express from 'express';
import { 
  getWishlist, 
  toggleWishlistItem, 
  syncWishlist, 
  clearWishlist 
} from '../../controllers/common/wishlist.controller.js';

// Import your authentication middleware
import { isValidUser } from '../../middleware/common/auth/auth.middleware.js'; 

const router = express.Router();

router.use(isValidUser);



router.get('/', getWishlist);

router.post('/toggle', toggleWishlistItem);

router.post('/sync', syncWishlist);

router.delete('/clear', clearWishlist);

export default router;