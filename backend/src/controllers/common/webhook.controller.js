import crypto from "crypto";
import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import { sendEmail } from "../../utils/email.sender.js";


export const handleDelhiveryWebhook = async (req, res) => {
  try {
    const payloadString = req.body.toString("utf8");
    const payload = JSON.parse(payloadString);

    const waybill = payload.Waybill || payload.awb || payload.WaybillNumber;
    const statusObj = payload.Status || {};
    const currentStatus = statusObj.Status || payload.status || "";

    if (!waybill) {
      return res.status(400).send("Bad Request: Missing Waybill");
    }

    const isReturned = ["RTO", "RTO DELIVERED", "RETURN TO ORIGIN", "RETURNED"].includes(
      currentStatus.toUpperCase()
    );

    if (!isReturned) {
      return res.status(200).send("Status acknowledged. No inventory action required.");
    }

    const order = await Order.findOne({ trackingNumber: waybill });

    if (!order) {
      console.warn(`[Webhook Warning] RTO received for unknown Waybill: ${waybill}`);
      return res.status(200).send("Order not found in system.");
    }

    if (order.orderStatus === "Returned") {
      return res.status(200).send("Order is already marked as Returned. Ignored.");
    }

    for (const item of order.items) {
      await Product.updateOne(
        { 
          _id: item.product, 
          "variants._id": item.variantId 
        },
        { 
          $inc: { "variants.$.inventory.quantity": item.quantity } 
        }
      );
    }

    order.orderStatus = "Returned";
    order.cancelledAt = new Date();
    await order.save();

    console.log(`[Logistics Webhook] Order ${order.orderNumber} successfully auto-restocked.`);
    return res.status(200).send("RTO Processed and Inventory Restocked.");

  } catch (error) {
    console.error("[Delhivery Webhook Error]:", error);
    return res.status(500).send("Internal Webhook Error");
  }
};



export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const payloadString = req.body.toString("utf8");

    // Cryptographic Verification
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payloadString)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[Security Alert] Invalid Razorpay Webhook Signature.");
      return res.status(400).send("Invalid Signature");
    }

    const payload = JSON.parse(payloadString);

    // Process Successful Payment Event
    if (payload.event === "order.paid" || payload.event === "payment.captured") {
      const paymentEntity = payload.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id; // This matches transactionId in our DB

      const order = await Order.findOne({ transactionId: razorpayOrderId });

      if (!order) {
        console.error(`[Webhook Error] Paid order not found in DB: ${razorpayOrderId}`);
        return res.status(200).send("Order not found, but acknowledged.");
      }

      // Prevent processing the same webhook twice
      if (order.paymentStatus !== "Pending") {
        return res.status(200).send("Order already processed.");
      }

      // Update Order Status
      order.paymentStatus = order.paymentOption === "PARTIAL_COD" ? "Partially Paid" : "Completed";
      order.orderStatus = "Confirmed";
      order.paidAt = new Date();
      await order.save();

      console.log(`[Payment Webhook] Order ${order.orderNumber} confirmed successfully.`);

      // Dispatch Minimalist Email Receipt
      const customerEmail = order.isGuestCheckout ? order.guestEmail : order.shippingAddress.email;
      const customerName = order.shippingAddress.firstName;

      const emailHtml = `
        <div style="font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111111; padding: 40px 20px;">
          <h2 style="font-weight: 300; letter-spacing: 1px; margin-bottom: 30px;">ORDER CONFIRMED</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #555555;">Hello ${customerName},</p>
          <p style="font-size: 14px; line-height: 1.6; color: #555555;">Thank you for your purchase. We have received your payment and your order is now being processed.</p>
          
          <div style="border-top: 1px solid #EEEEEE; border-bottom: 1px solid #EEEEEE; padding: 20px 0; margin: 30px 0;">
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888888; margin: 0 0 5px 0;">Order Number</p>
            <p style="font-size: 16px; font-weight: 500; margin: 0;">${order.orderNumber}</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #555555;">You will receive another notification containing tracking information once your order has been dispatched.</p>
          
          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #999999;">
            <p>&copy; ${new Date().getFullYear()} Mritsna. All rights reserved.</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: customerEmail,
        subject: `Order Confirmed: ${order.orderNumber}`,
        html: emailHtml,
      });
    }

    // Always return 200 OK to Razorpay to acknowledge receipt
    return res.status(200).send("Webhook Processed");

  } catch (error) {
    console.error("[Razorpay Webhook Error]:", error);
    return res.status(500).send("Internal Webhook Error");
  }
};