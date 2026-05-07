import express from 'express';
import { 
  getNewArrivals, 
  getPaginatedProducts,
  getSingleProduct
} from '../../controllers/common/product.controller.js';

const router = express.Router();

router.get('/new-arrivals', getNewArrivals);

router.get('/', getPaginatedProducts);

router.get('/:slug', getSingleProduct);

export default router;