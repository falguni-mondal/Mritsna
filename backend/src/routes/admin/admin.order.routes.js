import express from "express";
import { 
  fulfillOrder, 
  getAllOrders, 
  updateOrderStatus 
} from "../../controllers/admin/admin.order.controller.js";
import { isAdmin } from "../../middleware/common/auth/auth.middleware.js";

const router = express.Router();

router.get("/", isAdmin, getAllOrders);

router.patch("/:orderId/status", isAdmin, updateOrderStatus);

router.post("/:orderId/fulfill", isAdmin, fulfillOrder);

export default router;