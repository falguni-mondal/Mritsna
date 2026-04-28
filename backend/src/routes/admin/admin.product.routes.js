import express from 'express';
import {
  createProduct,
  updateProduct,
  changeProductStatus,
  getAdminProducts,
  getAdminProductById
} from '../../controllers/admin/admin.product.controller.js';
import { 
  validateRequest, 
  createProductSchema, 
  updateProductSchema 
} from '../../middleware/admin/product.validation.js';

import { isAdmin, isValidUser } from "../../middleware/common/auth/auth.middleware.js";


const router = express.Router();

router.use(isValidUser, isAdmin); // All routes below require authentication

// --- Product Management Routes ---

// Fetch all products for the dashboard table
router.get('/', getAdminProducts);

// Fetch a single product to populate the Edit Form
router.get('/:id', getAdminProductById);

// Create a new product
router.post('/', validateRequest(createProductSchema), createProduct);

// Update an existing product
router.patch('/:id', validateRequest(updateProductSchema), updateProduct);

// Update only the status (Active, Draft, Archived)
router.patch('/:id/status', changeProductStatus);

export default router;