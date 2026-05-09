import express from 'express';
import { 
  checkStock, 
  getCart, 
  addToCart, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearCart, 
  syncCart 
} from '../../controllers/common/cart.controller.js';

import { inventoryCheck } from '../../middleware/common/inventoryCheck.js';

// Import YOUR specific middleware
import { isValidUser } from '../../middleware/common/auth/auth.middleware.js'; 

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (Guests & Users)
// ==========================================
router.post('/check-stock', checkStock);

// ==========================================
// PROTECTED ROUTES (Logged-in Users Only)
// ==========================================
// Your isValidUser middleware locks down everything below this line
router.use(isValidUser); 

router.post('/check-stock', checkStock);
router.get('/', getCart);
router.post('/sync', syncCart);
router.post('/add', inventoryCheck, addToCart);
router.put('/update', inventoryCheck, updateCartItemQuantity);
router.delete('/remove/:variantId', removeFromCart);
router.delete('/clear', clearCart);

export default router;