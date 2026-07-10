import mongoose from 'mongoose';
import Review from '../../models/review.model.js';
import Order from '../../models/order.model.js';
import Product from '../../models/product.model.js';

export const checkEligibility = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user; 
    const deviceId = req.cookies.device_id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    // 1. Check if they already reviewed this product
    const query = userId ? { product: productId, user: userId } : { product: productId, deviceId, isAdminGenerated: false };
    const existingReview = await Review.findOne(query);

    if (existingReview) {
      return res.status(200).json({
        success: true,
        eligibility: 'ALREADY_REVIEWED',
        review: existingReview
      });
    }

    // 2. Check if they actually bought it and it was delivered
    const orderQuery = {
      orderStatus: 'Delivered',
      'items.product': productId,
      ...(userId ? { user: userId } : { deviceId })
    };

    // Sort by newest order first in case they bought it multiple times
    const matchingOrder = await Order.findOne(orderQuery).sort({ createdAt: -1 }).lean();

    if (!matchingOrder) {
      return res.status(200).json({
        success: true,
        eligibility: 'NOT_ELIGIBLE',
        message: 'No delivered order found for this product.'
      });
    }

    // Extract the specific item details to prefill the color variant
    const purchasedItem = matchingOrder.items.find(item => item.product.toString() === productId);

    return res.status(200).json({
      success: true,
      eligibility: 'CAN_REVIEW',
      orderId: matchingOrder._id,
      colorName: purchasedItem.colorName,
      guestName: matchingOrder.shippingAddress.firstName,
      guestEmail: matchingOrder.shippingAddress.email
    });

  } catch (error) {
    console.error("[Review Eligibility Error]:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const addReview = async (req, res, next) => {
  try {
    const { productId, orderId, rating, comment, images, colorName, guestName, guestEmail } = req.body;
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    // Double check eligibility to prevent API abuse
    const query = userId ? { product: productId, user: userId } : { product: productId, deviceId, isAdminGenerated: false };
    const existingReview = await Review.findOne(query);

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }

    const newReview = new Review({
      product: productId,
      order: orderId,
      colorName,
      user: userId || null,
      guestName: userId ? undefined : guestName,
      guestEmail: userId ? undefined : guestEmail,
      deviceId: userId ? undefined : deviceId,
      rating,
      comment,
      images: images || [],
      status: 'pending'
    });

    await newReview.save();

    return res.status(201).json({ 
      success: true, 
      message: 'Review submitted successfully and is pending approval.',
      review: newReview
    });

  } catch (error) {
    console.error("[Submit Review Error]:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to submit review" });
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user;
    const deviceId = req.cookies.device_id;

    // First find the product to get its exact ID
    const product = await Product.findOne({ slug }).select('_id').lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // The Magic Query: Get all approved OR get my specific pending review
    const authConditions = [];
    if (userId) authConditions.push({ user: userId });
    if (deviceId) authConditions.push({ deviceId });

    const filter = {
      product: product._id,
      $or: [
        { status: 'approved' },
        ...(authConditions.length > 0 ? [{ status: 'pending', $or: authConditions }] : [])
      ]
    };

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 }) // Newest first
      .populate('user', 'firstName lastName') 
      .lean();

    // Clean up the output names securely
    const formattedReviews = reviews.map(rev => ({
      _id: rev._id,
      rating: rev.rating,
      comment: rev.comment,
      colorName: rev.colorName,
      images: rev.images,
      createdAt: rev.createdAt,
      status: rev.status, 
      author: rev.user ? `${rev.user.firstName} ${rev.user.lastName[0]}.` : rev.guestName,
      isVerifiedBuyer: rev.isAdminGenerated ? false : true 
    }));

    return res.status(200).json({ success: true, data: formattedReviews });

  } catch (error) {
    console.error("[Get Product Reviews Error]:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
};