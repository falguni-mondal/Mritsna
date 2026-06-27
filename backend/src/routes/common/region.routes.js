import express from 'express';
import { detectUserRegion } from '../../controllers/common/region.controller.js';
import { regionMiddleware } from '../../middleware/common/regionMiddleware.js';

const router = express.Router();
router.get('/detect', regionMiddleware, detectUserRegion);

export default router;