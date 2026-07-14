import express from 'express';
import { 
  getNewArrivals, 
  getPaginatedProducts,
  getSingleProduct,
  getUniqueCategories,
  searchProducts
} from '../../controllers/common/product.controller.js';

import { regionMiddleware } from '../../middleware/common/regionMiddleware.js';

const router = express.Router();

router.get('/new-arrivals', regionMiddleware, getNewArrivals);

router.get('/search', regionMiddleware, searchProducts);

router.get('/categories', getUniqueCategories);

router.get('/', regionMiddleware, getPaginatedProducts);

router.get('/:slug', regionMiddleware, getSingleProduct);

export default router;