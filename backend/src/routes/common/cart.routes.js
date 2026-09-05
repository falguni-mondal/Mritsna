import express from 'express';
import { 
  checkStock, 
  getCart, 
  addToCart, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearCart, 
  syncCart,
  hydrateGuestCart
} from '../../controllers/common/cart.controller.js';

import { inventoryCheck } from '../../middleware/common/inventoryCheck.js';
import { isValidUser } from '../../middleware/common/auth/auth.middleware.js'; 

// --- Import our Region Middleware ---
import { regionMiddleware } from '../../middleware/common/regionMiddleware.js';
import { trackVisit } from '../../middleware/user/trackVisit.middleware.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.post('/check-stock', checkStock);

// <-- The Guest Hydration Route -->
// Notice it is public (no isValidUser) but DOES include regionMiddleware
router.post('/hydrate', regionMiddleware, hydrateGuestCart);

// ==========================================
// PROTECTED ROUTES
// ==========================================

// Attaching regionMiddleware only to the GET route
// This ensures the frontend receives the converted prices, but the DB stays in INR.
router.get('/', trackVisit, isValidUser, regionMiddleware, getCart);

router.post('/sync', isValidUser, syncCart);
router.post('/add', isValidUser, inventoryCheck, addToCart);
router.put('/update', isValidUser, inventoryCheck, updateCartItemQuantity);
router.delete('/remove/:variantId', isValidUser, removeFromCart);
router.delete('/clear', isValidUser, clearCart);

export default router;