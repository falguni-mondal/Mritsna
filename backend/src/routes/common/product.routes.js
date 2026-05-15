import express from 'express';
import { 
  getNewArrivals, 
  getPaginatedProducts,
  getSingleProduct
} from '../../controllers/common/product.controller.js';

// --- NEW: Import the Region Middleware ---
import { regionMiddleware } from '../../middleware/common/regionMiddleware.js';

const router = express.Router();

router.get('/new-arrivals', regionMiddleware, getNewArrivals);

router.get('/', regionMiddleware, getPaginatedProducts);

router.get('/:slug', regionMiddleware, getSingleProduct);

export default router;