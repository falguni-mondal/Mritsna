import express from 'express';
import { 
  getNewArrivals, 
  getPaginatedProducts 
} from '../../controllers/common/product.controller.js';

const router = express.Router();

router.get('/new-arrivals', getNewArrivals);

router.get('/', getPaginatedProducts);

export default router;