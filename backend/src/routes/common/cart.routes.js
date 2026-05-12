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
import { isValidUser } from '../../middleware/common/auth/auth.middleware.js'; 

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (Guests & Users)
// ==========================================
// Anyone can check if an item is in stock before attempting to add it
router.post('/check-stock', checkStock);

// ==========================================
// PROTECTED ROUTES (Logged-in Users Only)
// ==========================================
// Explicitly applying isValidUser to prevent global middleware layout traps

// Fetch the user's populated cart from the database
router.get('/', isValidUser, getCart);

// Merge Guest LocalStorage cart into the Database upon login
router.post('/sync', isValidUser, syncCart);

// Add item to DB Cart (Passes through Auth -> Inventory limits -> Controller)
router.post('/add', isValidUser, inventoryCheck, addToCart);

// Update existing item quantity in DB Cart
router.put('/update', isValidUser, inventoryCheck, updateCartItemQuantity);

// Remove specific item from DB Cart
router.delete('/remove/:variantId', isValidUser, removeFromCart);

// Wipe the entire DB Cart (e.g., after successful checkout)
router.delete('/clear', isValidUser, clearCart);

export default router;