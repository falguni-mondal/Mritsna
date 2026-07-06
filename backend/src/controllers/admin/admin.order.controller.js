import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import { createShipment } from "../../services/logistics.service.js";


export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email") // Optional: brings in basic user details if registered
      .lean(); // Faster execution for read-only queries

    const totalOrders = await Order.countDocuments();

    return res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
      },
      data: orders,
    });
  } catch (error) {
    console.error("[Admin Get All Orders Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve orders.",
    });
  }
};


export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Prevent re-cancelling or re-returning if already done (protects inventory counts)
    const isAlreadyRestocked = ["Cancelled", "Returned"].includes(order.orderStatus);
    const isNowRestocking = ["Cancelled", "Returned"].includes(orderStatus);

    if (isNowRestocking && !isAlreadyRestocked) {
      // Auto-restock inventory mathematically
      for (const item of order.items) {
        await Product.updateOne(
          {
            _id: item.product,
            "variants._id": item.variantId,
          },
          {
            $inc: { "variants.$.inventory.quantity": item.quantity },
          }
        );
      }
      order.cancelledAt = new Date();
    }

    // If marking as delivered manually
    if (orderStatus === 'Delivered' && order.orderStatus !== 'Delivered') {
      order.deliveredAt = new Date();
    }

    order.orderStatus = orderStatus;
    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status manually updated to ${orderStatus}.`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("[Admin Update Order Status Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status.",
    });
  }
};


export const fulfillOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate({
      path: "items.product",
      select: "shipping",
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (["Shipped", "Delivered", "Cancelled", "Returned"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be fulfilled. Current status is: ${order.orderStatus}`,
      });
    }

    if (order.paymentStatus === "Pending" || order.paymentStatus === "Failed") {
      return res.status(400).json({
        success: false,
        message: "Cannot fulfill an order with a Pending or Failed payment.",
      });
    }

    let totalWeightGrams = 0;

    order.items.forEach((item) => {
      const itemWeight = item.product?.shipping?.weightGrams || 500; // Updated to match your schema's exact path (weightGrams)
      totalWeightGrams += itemWeight * item.quantity;
    });

    const shipmentResult = await createShipment(order, totalWeightGrams);

    order.trackingNumber = shipmentResult.waybill;
    order.shippingLabelUrl = shipmentResult.labelUrl;
    order.courierPartner = shipmentResult.courierName;
    order.orderStatus = "Shipped";
    order.shippedAt = new Date();

    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: `Order successfully dispatched via ${shipmentResult.courierName}.`,
      data: {
        orderNumber: updatedOrder.orderNumber,
        trackingNumber: updatedOrder.trackingNumber,
        shippingLabelUrl: updatedOrder.shippingLabelUrl,
        orderStatus: updatedOrder.orderStatus,
      },
    });
  } catch (error) {
    console.error("[Admin Fulfill Order Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process logistics fulfillment.",
    });
  }
};