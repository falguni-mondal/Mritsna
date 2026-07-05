import Order from "../../models/order.model.js";
import { createShipment } from "../../services/logistics.service.js";


export const fulfillOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1. Fetch the order and populate the products to get their physical weights
    const order = await Order.findById(orderId).populate({
      path: "items.product",
      select: "shipping" // Assuming your weight/dimensions are stored in a 'shipping' object on the Product
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Prevent fulfilling an order that is already shipped, cancelled, or returned
    if (["Shipped", "Delivered", "Cancelled", "Returned"].includes(order.orderStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: `Order cannot be fulfilled. Current status is: ${order.orderStatus}` 
      });
    }

    // Prevent fulfilling unpaid orders (unless they are explicitly Partial COD)
    if (order.paymentStatus === "Pending" || order.paymentStatus === "Failed") {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot fulfill an order with a Pending or Failed payment." 
      });
    }

    // 2. Aggregate the Total Weight (in Grams)
    let totalWeightGrams = 0;
    
    order.items.forEach((item) => {
      // Safely extract weight. Adjust 'item.product.shipping.weight' to match your exact Product schema path.
      // We use a fallback of 500g per item just in case a product is missing weight data.
      const itemWeight = item.product?.shipping?.weight || 500; 
      totalWeightGrams += (itemWeight * item.quantity);
    });

    // 3. Dispatch to the Logistics Service
    // This calls the translator file we just built
    const shipmentResult = await createShipment(order, totalWeightGrams);

    // 4. Update the Order in the Database
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
        orderStatus: updatedOrder.orderStatus
      }
    });

  } catch (error) {
    console.error("[Admin Fulfill Order Error]:", error);
    
    // Pass the specific Delhivery error message to the frontend if available
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to process logistics fulfillment." 
    });
  }
};