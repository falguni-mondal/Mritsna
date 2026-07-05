import express from "express";
import { fulfillOrder } from "../../controllers/admin/admin.order.controller.js";
import { isAdmin } from "../../middleware/common/auth/auth.middleware.js";

const router = express.Router();

router.post("/:orderId/fulfill", isAdmin, fulfillOrder);

export default router;