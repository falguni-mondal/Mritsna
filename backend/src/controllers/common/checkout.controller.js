import Razorpay from "razorpay";
import crypto from "crypto";
import { createRequire } from "module";
import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import Coupon from "../../models/coupon.model.js";
import { calculateRegionalPricing } from "../../utils/pricingEngine.js";

// Safe JSON Import
const require = createRequire(import.meta.url);
const hsnMap = require("../../config/hsnRates.json");

// Initialize Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- HELPER: Prefix-matching HSN Lookup Engine ---
const getGSTRate = (hsnCode) => {
  if (!hsnCode) return hsnMap["DEFAULT"].rate;

  const codeStr = hsnCode.toString().trim();

  if (hsnMap[codeStr]) return hsnMap[codeStr].rate;

  if (codeStr.length > 6 && hsnMap[codeStr.substring(0, 6)]) {
    return hsnMap[codeStr.substring(0, 6)].rate;
  }

  if (codeStr.length >= 4 && hsnMap[codeStr.substring(0, 4)]) {
    return hsnMap[codeStr.substring(0, 4)].rate;
  }

  return hsnMap["DEFAULT"].rate;
};

/**
 * Core Math & Validation Engine
 * Dynamically handles inventory safety, coupon logic, HSN item taxation, and Export Markups.
 */
const processCheckoutMath = async (
  items,
  country,
  state,
  couponCode,
  paymentOption,
  skipAutoApply,
  userContext,
  regionData,
) => {
  let subTotal = 0;
  const validatedItems = [];

  // Define Export status early so we can use it during taxation
  const isExportShipment =
    country.toLowerCase() !== "india" && country.toLowerCase() !== "in";

  // --- Validate Items & Calculate Converted SubTotal ---
  for (const item of items) {
    const product = await Product.findOne({ "variants._id": item.variantId });
    if (!product)
      throw new Error(`Product containing variant ${item.variantId} not found`);

    const variant = product.variants.id(item.variantId);

    if (variant.inventory.quantity < item.quantity) {
      throw new Error(
        `Insufficient stock for ${product.title} - ${variant.colorName}`,
      );
    }

    // Run the item through the identical pricing engine used in the Cart!
    const localizedPricing = calculateRegionalPricing(
      variant.pricing.price,
      variant.pricing.discountPercentage || 0,
      product.isPremium || false,
      regionData,
    );

    // The itemTotal is now perfectly converted to USD/EUR/etc. based on regionData
    const itemTotalConverted = localizedPricing.sellingPrice * item.quantity;
    subTotal += itemTotalConverted;

    validatedItems.push({
      product: product._id,
      variantId: variant._id,
      hsnCode: product.pricing.hsnCode,
      title: product.title,
      colorName: variant.colorName,
      slug: product.slug,
      img: variant.images[0]?.baseUrl,
      quantity: item.quantity,
      priceAtPurchase: localizedPricing.sellingPrice,
      itemTotal: itemTotalConverted,
    });
  }

  // --- Coupon Engine (Evaluating against the Converted SubTotal) ---
  let discountAmount = 0;
  let appliedCouponId = null;
  let appliedCouponCode = null;

  const evaluateCouponEligibility = async (coupon, currentSubTotal) => {
    // If the coupon has a min order value stored in INR, convert it to compare against currentSubTotal
    const localizedMinOrderValue = Math.round(
      coupon.minOrderValue * regionData.rate,
    );
    if (currentSubTotal < localizedMinOrderValue) {
      return { eligible: false, reason: "Minimum order value not met." };
    }

    const fingerprintQuery = [];
    if (userContext.userId) fingerprintQuery.push({ user: userContext.userId });
    if (userContext.guestEmail)
      fingerprintQuery.push({
        guestEmail: userContext.guestEmail.toLowerCase(),
      });
    if (userContext.deviceId)
      fingerprintQuery.push({ deviceId: userContext.deviceId });

    if (fingerprintQuery.length > 0) {
      const pastUsageCount = await Order.countDocuments({
        couponApplied: coupon._id,
        paymentStatus: { $ne: "Failed" },
        $or: fingerprintQuery,
      });

      if (pastUsageCount >= coupon.usagePerUserLimit) {
        return { eligible: false, reason: "Coupon usage limit reached." };
      }
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === "percentage") {
      calculatedDiscount = Math.round(
        (currentSubTotal * coupon.discountValue) / 100,
      );
      if (coupon.maxDiscountAmount) {
        const localizedMaxDiscount = Math.round(
          coupon.maxDiscountAmount * regionData.rate,
        );
        calculatedDiscount = Math.min(calculatedDiscount, localizedMaxDiscount);
      }
    } else if (coupon.discountType === "fixed_amount") {
      // Fixed amounts in the DB are assumed to be INR. Convert to user's currency.
      calculatedDiscount = Math.round(coupon.discountValue * regionData.rate);
    }

    return { eligible: true, discountAmount: calculatedDiscount };
  };

  if (couponCode) {
    const manualCoupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });
    if (!manualCoupon) throw new Error("Invalid or expired coupon.");

    const evaluation = await evaluateCouponEligibility(manualCoupon, subTotal);
    if (!evaluation.eligible) throw new Error(evaluation.reason);

    discountAmount = evaluation.discountAmount;
    appliedCouponId = manualCoupon._id;
    appliedCouponCode = manualCoupon.code;
  } else if (!skipAutoApply) {
    const autoCoupons = await Coupon.find({
      isActive: true,
      isAutoApply: true,
    });

    let bestDiscount = 0;
    let bestCoupon = null;

    for (const autoCoupon of autoCoupons) {
      const evaluation = await evaluateCouponEligibility(autoCoupon, subTotal);

      if (evaluation.eligible && evaluation.discountAmount > bestDiscount) {
        bestDiscount = evaluation.discountAmount;
        bestCoupon = autoCoupon;
      }
    }

    if (bestCoupon) {
      discountAmount = bestDiscount;
      appliedCouponId = bestCoupon._id;
      appliedCouponCode = bestCoupon.code;
    }
  }

  // --- Item-Level HSN Tax Processing Engine ---
  let totalTaxAmount = 0;
  let baseRevenue = 0;
  let taxBuckets = {};

  const isIntraState =
    state.toLowerCase().includes("jharkhand") || state.toLowerCase() === "mh";

  for (const item of validatedItems) {
    const itemDiscountRatio = subTotal > 0 ? item.itemTotal / subTotal : 0;
    const itemDiscount = discountAmount * itemDiscountRatio;
    const discountedItemTotal = item.itemTotal - itemDiscount;

    const itemGSTRate = isExportShipment ? 0 : getGSTRate(item.hsnCode);

    // Reverse-calculate base revenue and tax amount using the fully converted total
    const itemBaseRevenue = discountedItemTotal / (1 + itemGSTRate / 100);
    const itemTaxAmount = discountedItemTotal - itemBaseRevenue;

    baseRevenue += itemBaseRevenue;
    totalTaxAmount += itemTaxAmount;

    if (!isExportShipment && itemGSTRate > 0) {
      if (isIntraState) {
        const halfRate = itemGSTRate / 2;
        const halfTax = itemTaxAmount / 2;

        const cgstKey = `CGST_${halfRate}`;
        if (!taxBuckets[cgstKey])
          taxBuckets[cgstKey] = { taxType: "CGST", rate: halfRate, amount: 0 };
        taxBuckets[cgstKey].amount += halfTax;

        const sgstKey = `SGST_${halfRate}`;
        if (!taxBuckets[sgstKey])
          taxBuckets[sgstKey] = { taxType: "SGST", rate: halfRate, amount: 0 };
        taxBuckets[sgstKey].amount += halfTax;
      } else {
        const igstKey = `IGST_${itemGSTRate}`;
        if (!taxBuckets[igstKey])
          taxBuckets[igstKey] = {
            taxType: "IGST",
            rate: itemGSTRate,
            amount: 0,
          };
        taxBuckets[igstKey].amount += itemTaxAmount;
      }
    }
  }

  const taxDetails = isExportShipment
    ? [{ taxType: "EXPORT", rate: 0, amount: 0 }]
    : Object.values(taxBuckets).map((bucket) => ({
        taxType: bucket.taxType,
        rate: bucket.rate,
        amount: Math.round(bucket.amount),
      }));

  // --- Final Totals ---
  // Math is completely local to the user's currency now
  const grandTotal = Math.max(1, subTotal - discountAmount);

  let paymentAmount = grandTotal;
  let advancePaid = grandTotal;
  let balanceDueOnDelivery = 0;

  if (paymentOption === "PARTIAL_COD") {
    paymentAmount = Math.max(1, Math.round(grandTotal * 0.1));
    advancePaid = paymentAmount;
    balanceDueOnDelivery = grandTotal - advancePaid;
  }

  return {
    validatedItems,
    subTotal,
    appliedCouponId,
    appliedCouponCode,
    discountAmount,
    baseRevenue: Math.round(baseRevenue),
    taxableAmount: Math.round(baseRevenue),
    taxDetails,
    totalTaxAmount: Math.round(totalTaxAmount),
    currencyInfo: regionData, // Returning the globally intercepted region state
    paymentOption,
    grandTotal,
    paymentAmount,
    advancePaid,
    balanceDueOnDelivery,
  };
};

export const calculateCheckoutTotals = async (req, res) => {
  try {
    const {
      items,
      country,
      state,
      couponCode,
      paymentOption,
      skipAutoApply,
      guestEmail,
      deviceId,
    } = req.body;
    const userId = req.user ? req.user._id : null;
    const safePaymentOption = paymentOption || "FULL_ONLINE";
    const safeSkipAutoApply = skipAutoApply || false;

    // Grab the regionData provided by our middleware interceptor
    const regionData = req.region || {
      countryCode: "IN",
      currencyCode: "INR",
      symbol: "₹",
      rate: 1,
    };

    const mathResult = await processCheckoutMath(
      items,
      country,
      state,
      couponCode,
      safePaymentOption,
      safeSkipAutoApply,
      { userId, guestEmail, deviceId },
      regionData, // Inject the pricing engine context
    );

    return res.status(200).json({
      success: true,
      data: {
        subTotal: mathResult.subTotal,
        appliedCouponCode: mathResult.appliedCouponCode,
        discountAmount: mathResult.discountAmount,
        taxableAmount: mathResult.taxableAmount,
        totalTaxAmount: mathResult.totalTaxAmount,
        taxDetails: mathResult.taxDetails,
        grandTotal: mathResult.grandTotal,
        paymentAmount: mathResult.paymentAmount,
        advancePaid: mathResult.advancePaid,
        balanceDueOnDelivery: mathResult.balanceDueOnDelivery,
        currency: mathResult.currencyInfo.currencyCode,
        symbol: mathResult.currencyInfo.symbol,
      },
    });
  } catch (error) {
    console.error("[Checkout Calculate Error]", error);
    return res
      .status(400)
      .json({
        success: false,
        message: error.message || "Failed to calculate totals",
      });
  }
};

export const createRazorpayOrder = async (req, res) => {
  const ZERO_DECIMAL_CURRENCIES = ["JPY", "KRW", "VND", "CLP", "PYG"];
  
  try {
    const { items, shippingAddress, billingAddress, couponCode, paymentOption, skipAutoApply, guestEmail, deviceId } = req.body;
    const userId = req.user ? req.user._id : null;
    const isGuestCheckout = !userId;
    const safeSkipAutoApply = skipAutoApply || false;

    // Grab the regionData provided by our middleware interceptor
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    const mathResult = await processCheckoutMath(
      items, shippingAddress.country, shippingAddress.state, couponCode, paymentOption, safeSkipAutoApply,
      { userId, guestEmail, deviceId },
      regionData // Inject the pricing engine context
    );

    // --- THE FIX: Zero-Decimal Currency Math ---
    // If the currency is JPY, multiply by 1. Otherwise, multiply by 100 (for subunits like cents/paise).
    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(mathResult.currencyInfo.currencyCode.toUpperCase());
    const subunitMultiplier = isZeroDecimal ? 1 : 100;
    
    const razorpayAmountInSubunits = Math.round(mathResult.paymentAmount * subunitMultiplier);

    const razorpayOptions = {
      amount: razorpayAmountInSubunits, 
      currency: mathResult.currencyInfo.currencyCode,
      receipt: `RCPT_${Date.now().toString().slice(-8)}`, 
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOptions);

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
        amount: razorpayAmountInSubunits, 
        currency: mathResult.currencyInfo.currencyCode,
        keyId: process.env.RAZORPAY_KEY_ID 
      }
    });

  } catch (error) {
    console.error("[Checkout Create Order Error]", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to initialize checkout" });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      db_order_id,
    } = req.body;

    const pendingOrder = await Order.findById(db_order_id);
    if (!pendingOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found in database" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      pendingOrder.paymentStatus = "Failed";
      pendingOrder.paymentErrorLog =
        "Signature mismatch. Potential spoofing attempt.";
      await pendingOrder.save();
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    const finalPaymentStatus =
      pendingOrder.paymentOption === "PARTIAL_COD"
        ? "Partially Paid"
        : "Completed";

    pendingOrder.paymentStatus = finalPaymentStatus;
    pendingOrder.orderStatus = "Confirmed";
    pendingOrder.paidAt = new Date();
    pendingOrder.transactionId = razorpay_payment_id;

    const confirmedOrder = await pendingOrder.save();

    if (confirmedOrder.couponApplied) {
      await Coupon.findByIdAndUpdate(confirmedOrder.couponApplied, {
        $inc: { usedCount: 1 },
      });
    }

    const inventoryUpdates = confirmedOrder.items.map((item) =>
      Product.findOneAndUpdate(
        { "variants._id": item.variantId },
        { $inc: { "variants.$.inventory.quantity": -item.quantity } },
      ),
    );
    await Promise.all(inventoryUpdates);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: { orderNumber: confirmedOrder.orderNumber },
    });
  } catch (error) {
    console.error("[Payment Verification Error]", error);
    return res
      .status(500)
      .json({ success: false, message: "Payment verification process failed" });
  }
};
