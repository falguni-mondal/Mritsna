import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import Coupon from "../../models/coupon.model.js";
import { getCurrencyForCountry } from "../../config/currencyMap.js";

// Initialize Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * PRIVATE HELPER: Core Math & Validation Engine
 * Now includes dynamic splitting for Partial COD vs Full Online payments.
 */
const processCheckoutMath = async (items, country, state, couponCode, paymentOption, userContext) => {
  let subTotal = 0;
  const validatedItems = [];

  // 1. Validate Items & Calculate SubTotal (from DB, never trust frontend)
  for (const item of items) {
    const product = await Product.findOne({ "variants._id": item.variantId });
    if (!product) throw new Error(`Product containing variant ${item.variantId} not found`);

    const variant = product.variants.id(item.variantId);
    
    if (variant.inventory.quantity < item.quantity) {
      throw new Error(`Insufficient stock for ${product.title} - ${variant.colorName}`);
    }

    const itemTotal = variant.pricing.price * item.quantity;
    subTotal += itemTotal;

    validatedItems.push({
      product: product._id,
      variantId: variant._id,
      title: product.title,
      colorName: variant.colorName,
      slug: product.slug,
      img: variant.images[0]?.baseUrl,
      quantity: item.quantity,
      priceAtPurchase: variant.pricing.price,
      itemTotal: itemTotal,
    });
  }

  // 2. Coupon & Fingerprinting Logic
  let discountAmount = 0;
  let appliedCouponId = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    
    if (coupon) {
      // Dynamically build the $or query to avoid matching { user: null } for all guests
      const fingerprintQuery = [];
      if (userContext.userId) fingerprintQuery.push({ user: userContext.userId });
      if (userContext.guestEmail) fingerprintQuery.push({ guestEmail: userContext.guestEmail.toLowerCase() });
      if (userContext.deviceId) fingerprintQuery.push({ deviceId: userContext.deviceId });

      if (fingerprintQuery.length > 0) {
        const pastUsageCount = await Order.countDocuments({
          couponApplied: coupon._id,
          paymentStatus: { $ne: 'Failed' },
          $or: fingerprintQuery
        });

        if (pastUsageCount < coupon.usagePerUserLimit && subTotal >= coupon.minOrderValue) {
          appliedCouponId = coupon._id;
          
          if (coupon.discountType === 'percentage') {
            discountAmount = Math.round((subTotal * coupon.discountValue) / 100);
            if (coupon.maxDiscountAmount) {
              discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
            }
          } else if (coupon.discountType === 'fixed_amount') {
            discountAmount = coupon.discountValue; // Assuming this is also stored in paise
          }
        } else {
          throw new Error("Coupon usage limit reached or minimum order value not met.");
        }
      }
    } else {
      throw new Error("Invalid or expired coupon.");
    }
  }

  // 3. Inclusive Tax & Export Math
  const baseRevenueInput = subTotal - discountAmount; 
  let totalTaxAmount = 0;
  let baseRevenue = baseRevenueInput;
  let taxDetails = [];

  const isExport = country.toLowerCase() !== 'india' && country.toLowerCase() !== 'in';
  // Standardize state check (e.g., checking against warehouse state)
  const isIntraState = state.toLowerCase().includes('maharashtra') || state.toLowerCase() === 'mh'; 

  if (isExport) {
    // Zero-Rated Export
    taxDetails.push({ taxType: 'EXPORT', rate: 0, amount: 0 });
  } else {
    // Domestic Inclusive GST (Reverse Math: Tax = Total - Total / 1.18)
    totalTaxAmount = Math.round((baseRevenueInput * 18) / 118); 
    baseRevenue = baseRevenueInput - totalTaxAmount; 

    if (isIntraState) {
      taxDetails.push({ taxType: 'CGST', rate: 9, amount: Math.round(totalTaxAmount / 2) });
      taxDetails.push({ taxType: 'SGST', rate: 9, amount: Math.round(totalTaxAmount / 2) });
    } else {
      taxDetails.push({ taxType: 'IGST', rate: 18, amount: totalTaxAmount });
    }
  }

  // 4. Multi-Currency Exchange Snapshot
  const currencyInfo = await getCurrencyForCountry(country);
  
  // 5. Payment Splitting Logic (Full vs Partial COD)
  // Calculate the grand total in the target currency
  const grandTotalForeignCents = Math.max(1, Math.round(baseRevenueInput * currencyInfo.rate));

  let paymentAmount = grandTotalForeignCents; // Default to full amount
  let advancePaid = grandTotalForeignCents;
  let balanceDueOnDelivery = 0;

  if (paymentOption === 'PARTIAL_COD') {
    // Calculate exactly 10% of the grand total for the advance payment
    paymentAmount = Math.max(1, Math.round(grandTotalForeignCents * 0.10));
    advancePaid = paymentAmount;
    balanceDueOnDelivery = grandTotalForeignCents - advancePaid;
  }

  return {
    validatedItems,
    subTotal,
    appliedCouponId,
    discountAmount,
    baseRevenue,
    taxDetails,
    totalTaxAmount,
    currencyInfo,
    paymentOption,
    grandTotal: grandTotalForeignCents,
    paymentAmount,
    advancePaid,
    balanceDueOnDelivery
  };
};

/**
 * @desc    Live calculation of cart totals for the frontend
 * @route   POST /api/checkout/calculate
 * @access  Public / Optional Auth
 */
export const calculateCheckoutTotals = async (req, res) => {
  try {
    const { items, country, state, couponCode, paymentOption, guestEmail, deviceId } = req.body;
    const userId = req.user ? req.user._id : null;
    const safePaymentOption = paymentOption || 'FULL_ONLINE';

    const mathResult = await processCheckoutMath(
      items, country, state, couponCode, safePaymentOption,
      { userId, guestEmail, deviceId }
    );

    return res.status(200).json({
      success: true,
      data: {
        subTotal: mathResult.subTotal,
        discountAmount: mathResult.discountAmount,
        totalTaxAmount: mathResult.totalTaxAmount,
        taxDetails: mathResult.taxDetails,
        grandTotal: mathResult.grandTotal,
        paymentAmount: mathResult.paymentAmount, 
        advancePaid: mathResult.advancePaid,
        balanceDueOnDelivery: mathResult.balanceDueOnDelivery,
        currency: mathResult.currencyInfo.currencyCode,
        symbol: mathResult.currencyInfo.symbol,
      }
    });

  } catch (error) {
    console.error("[Checkout Calculate Error]", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to calculate totals" });
  }
};

/**
 * @desc    Create Razorpay Order and Pending Database Order
 * @route   POST /api/checkout/create-order
 * @access  Public / Optional Auth
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress, couponCode, paymentOption, guestEmail, deviceId } = req.body;
    const userId = req.user ? req.user._id : null;
    const isGuestCheckout = !userId;

    // 1. Run the Math Engine
    const mathResult = await processCheckoutMath(
      items, shippingAddress.country, shippingAddress.state, couponCode, paymentOption,
      { userId, guestEmail, deviceId }
    );

    // 2. Ask Razorpay for an Order ID (Passing the 10% amount if PARTIAL_COD, or 100% if FULL_ONLINE)
    const razorpayOptions = {
      amount: mathResult.paymentAmount,
      currency: mathResult.currencyInfo.currencyCode,
      receipt: `RCPT_${Date.now().toString().slice(-8)}`, 
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOptions);

    // 3. Save the Snapshot to Database
    const newOrder = new Order({
      user: userId,
      isGuestCheckout,
      guestEmail: guestEmail ? guestEmail.toLowerCase() : null,
      deviceId,
      shippingAddress,
      billingAddress,
      items: mathResult.validatedItems,
      baseCurrency: 'INR',
      paymentCurrency: mathResult.currencyInfo.currencyCode,
      exchangeRateAtPurchase: mathResult.currencyInfo.rate,
      subTotal: mathResult.subTotal,
      couponApplied: mathResult.appliedCouponId,
      discountAmount: mathResult.discountAmount,
      baseRevenue: mathResult.baseRevenue,
      taxDetails: mathResult.taxDetails,
      totalTaxAmount: mathResult.totalTaxAmount,
      
      // New Payment Split Fields
      paymentOption: mathResult.paymentOption,
      paymentAmount: mathResult.paymentAmount,
      advancePaid: mathResult.advancePaid,
      balanceDueOnDelivery: mathResult.balanceDueOnDelivery,
      
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'Pending',
      transactionId: razorpayOrder.id,
    });

    const savedOrder = await newOrder.save();

    return res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        orderId: savedOrder._id,
        amount: mathResult.paymentAmount,
        currency: mathResult.currencyInfo.currencyCode,
        keyId: process.env.RAZORPAY_KEY_ID 
      }
    });

  } catch (error) {
    console.error("[Checkout Create Order Error]", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to initialize checkout" });
  }
};

/**
 * @desc    Verify Razorpay Payment Signature & Fulfill Order
 * @route   POST /api/checkout/verify-payment
 * @access  Public / Optional Auth
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, db_order_id } = req.body;

    // 1. Fetch the pending order to check its payment structure
    const pendingOrder = await Order.findById(db_order_id);
    if (!pendingOrder) {
      return res.status(404).json({ success: false, message: "Order not found in database" });
    }

    // 2. Cryptographic Bouncer
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      pendingOrder.paymentStatus = 'Failed';
      pendingOrder.paymentErrorLog = 'Signature mismatch. Potential spoofing attempt.';
      await pendingOrder.save();
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // 3. Payment Confirmed - Determine exact status based on the selected option
    const finalPaymentStatus = pendingOrder.paymentOption === 'PARTIAL_COD' ? 'Partially Paid' : 'Completed';

    pendingOrder.paymentStatus = finalPaymentStatus;
    pendingOrder.orderStatus = 'Confirmed';
    pendingOrder.paidAt = new Date();
    pendingOrder.transactionId = razorpay_payment_id;

    const confirmedOrder = await pendingOrder.save();

    // 4. Post-Payment Fulfillment (Deduct Inventory, Increment Coupon)
    if (confirmedOrder.couponApplied) {
      await Coupon.findByIdAndUpdate(confirmedOrder.couponApplied, { $inc: { usedCount: 1 } });
    }

    // Process inventory updates in parallel for speed
    const inventoryUpdates = confirmedOrder.items.map(item => 
      Product.findOneAndUpdate(
        { "variants._id": item.variantId },
        { $inc: { "variants.$.inventory.quantity": -item.quantity } }
      )
    );
    await Promise.all(inventoryUpdates);

    return res.status(200).json({ 
      success: true, 
      message: "Payment verified successfully",
      data: { orderNumber: confirmedOrder.orderNumber }
    });

  } catch (error) {
    console.error("[Payment Verification Error]", error);
    return res.status(500).json({ success: false, message: "Payment verification process failed" });
  }
};